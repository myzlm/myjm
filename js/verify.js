/* ============================================================
   verify.js — 记忆核验引擎
   ------------------------------------------------------------
   阶段一 本地三维评分
     逻辑自洽 35% · AI 率（反）35% · 跨次连贯 30%
   阶段二 联网核验（Wikipedia，可离线降级）
   阶段三 品质判定（璀璨 / 鲜活 / 褪色 / 碎裂）→ 记忆凭证
   阶段四 写入真名记忆码

   这个引擎不判断"你说的是不是真的"——
   它只判断"这段记忆像不像一个人真的记得"。
   ============================================================ */
(function (global) {
  'use strict';

  const LS = 'code_echo_memories_v1';

  const SENSORY = ('看见 听到 听见 闻到 摸到 尝到 声音 味道 气味 光 影子 冷 热 凉 烫 湿 干 疼 麻 痒 ' +
    '粗糙 滑 硬 软 香 臭 苦 甜 咸 酸 风 雨 雪 雾 灰 锈 潮 响 静 晃 刺眼 昏 暗 亮 抖 哆嗦 汗 心跳 ' +
    '吱呀 咯吱 沙沙 滴答 噼啪 嗡 轰 铃声 脚步 呼吸 咳嗽 咽 口水 手电 灯泡 煤油 灶 烟').split(/\s+/);

  const EMOTION = ('害怕 怕 慌 紧张 难过 伤心 委屈 生气 高兴 开心 安心 踏实 孤独 寂寞 羞 后悔 想念 ' +
    '舍不得 心疼 烦 累 无措 发怵 松了口 憋 忍 温柔 恨 喜欢 爱 舍不得 空 麻木 惊 愣 酸 挺住 ' +
    '不敢 想哭 想笑 松 沉 悬 堵').split(/\s+/);

  /* 模板化表达：命中越多，AI 率越高 */
  const TEMPLATE = [
    ['总而言之', 6], ['值得一提的是', 8], ['首先', 4], ['其次', 4], ['最后', 2],
    ['在这个', 4], ['的过程中', 5], ['让人不禁', 7], ['不禁感慨', 8], ['油然而生', 8],
    ['时光荏苒', 10], ['岁月如梭', 10], ['记忆犹新', 5], ['历历在目', 5],
    ['深深地', 5], ['无比', 4], ['十分', 3], ['非常', 3], ['仿佛', 3], ['似乎', 2],
    ['我永远不会忘记', 8], ['那一刻', 4], ['那一刻我', 5], ['温暖', 3], ['美好', 3],
    ['充满', 3], ['仿佛整个世界', 12], ['我意识到', 5], ['让我明白', 6], ['不仅是', 4],
    ['更是', 5], ['无论', 3], ['还是', 2], ['阳光明媚', 9], ['微风拂过', 9],
  ];

  const COMMON_SENSE = [
    [/太阳.{0,6}西边.{0,4}升/, '太阳从西边升起来。'],
    [/一年.{0,4}(十三|13)个?月/, '一年有十三个月。'],
    [/1\s*\+\s*1\s*=\s*3/, '1+1=3。'],
    [/(我|他|她).{0,4}死了.{0,10}(现在|今天|正在)/, '人死了，但"现在"还在做事。'],
  ];

  const cnNum = (s) => {
    const m = String(s).match(/\d+/);
    if (m) return +m[0];
    const t = String(s).replace(/[岁\s]/g, '');
    const d = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };
    if (/^[零一二两三四五六七八九]$/.test(t)) return d[t];
    if (t === '十') return 10;
    const m2 = t.match(/^([一二两三四五六七八九])?十([一二三四五六七八九])?$/);
    if (m2) return (m2[1] ? d[m2[1]] : 1) * 10 + (m2[2] ? d[m2[2]] : 0);
    if (t === '百') return 100;
    return null;
  };

  /* 岁数：阿拉伯数字与中文数字都认 */
  function agesOf(text) {
    const raw = text.match(/(\d{1,3}|[一二两三四五六七八九十百]{1,3})\s*岁/g) || [];
    const out = [];
    raw.forEach((r) => { const n = cnNum(r); if (n != null && n > 0 && n < 130) out.push(n); });
    return out;
  }

  const Verify = {
    history: [],
    last: null,

    load() {
      try {
        const raw = localStorage.getItem(LS);
        this.history = raw ? JSON.parse(raw) : [];
        if (!Array.isArray(this.history)) this.history = [];
      } catch (e) { this.history = []; }
      return this.history;
    },

    persist() {
      try { localStorage.setItem(LS, JSON.stringify(this.history.slice(-12))); } catch (e) {}
    },

    /* ---------------- 实体抽取 ---------------- */
    entities(text) {
      const out = [];
      const add = (v, k) => { if (v && out.length < 8) out.push({ v: v, k: k }); };
      (text.match(/(19|20)\d{2}\s*年?/g) || []).slice(0, 3).forEach((y) => add(y.replace(/\s|年/g, ''), 'year'));
      (text.match(/[《「"][^》」"]{2,12}[》」"]/g) || []).slice(0, 2).forEach((q) => add(q.replace(/[《》「」"]/g, ''), 'quote'));
      (text.match(/[\u4e00-\u9fa5]{2,3}(?=叫|说|告诉我|骂|喊)/g) || []).slice(0, 2).forEach((n) => add(n, 'name'));
      (text.match(/[A-Za-z]{3,}/g) || []).slice(0, 2).forEach((w) => add(w, 'word'));
      return out;
    },

    /* ---------------- 本地三维评分 ---------------- */
    analyze(textRaw) {
      this.load();
      const text = String(textRaw || '').replace(/\r/g, '');
      const chars = Array.from(text).length;
      const sentences = text.split(/[。！？\n…]+/).filter((s) => s.trim().length > 1);
      const res = {
        text: text,
        chars: chars,
        ok: false,
        score: 0,
        grade: '碎裂',
        color: '#6d6d6d',
        dims: { logic: 0, ai: 0, coherence: 0 },
        aiRate: 100,
        warnings: [],
        entities: [],
        detail: 0,
        sensory: 0,
        emotion: 0,
        online: { mode: 'skip', hits: [] },
      };

      if (chars < 12) {
        res.warnings.push({ lv: 3, t: '太短了。短到不能算"记得"，只能算"知道"。' });
        res.dims = { logic: 20, ai: 40, coherence: 10 };
        res.score = 22;
        return this.finish(res);
      }

      const sensoryHits = SENSORY.filter((w) => text.indexOf(w) >= 0);
      const emoHits = EMOTION.filter((w) => text.indexOf(w) >= 0);
      res.sensory = sensoryHits.length;
      res.emotion = emoHits.length;
      res.detail = Math.max(3, Math.min(8, Math.round(sensoryHits.length * 0.8) + 1));

      /* --- 1. 逻辑自洽 --- */
      let logic = 92;
      COMMON_SENSE.forEach(([re, msg]) => {
        if (msg && re.test(text)) {
          logic -= 34;
          res.warnings.push({ lv: 3, t: '常识冲突：' + msg });
        }
      });
      const ages = agesOf(text);
      if (ages.length >= 2) {
        const mn = Math.min.apply(null, ages), mx = Math.max.apply(null, ages);
        if (mx - mn > 80) { logic -= 16; res.warnings.push({ lv: 2, t: '年龄跨度不合常理（' + mn + ' 岁 / ' + mx + ' 岁）。' }); }
        // 同一个岁数，配了两个差得很远的年份
        const years = (text.match(/(19|20)\d{2}/g) || []).map(Number);
        const dup = ages.some((a) => ages.filter((x) => x === a).length > 1);
        if (dup && years.length >= 2 && (Math.max.apply(null, years) - Math.min.apply(null, years)) >= 3) {
          logic -= 52;
          res._timeBreak = true;
          res.warnings.push({ lv: 3, t: '同一个岁数出现在不同的年份里。时间线对不上。' });
        }
      }
      if (/我(已经)?死了/.test(text) && /(现在|今天|刚刚)/.test(text)) {
        logic -= 22;
        res.warnings.push({ lv: 2, t: '你同时"死了"又"现在"在做事。' });
      }
      if (/(从来|绝对|一定)(没有|不)/.test(text) && /记得/.test(text)) {
        logic -= 8;
        res.warnings.push({ lv: 1, t: '绝对的否定，通常不是记忆，是态度。' });
      }
      if (sentences.length && chars / sentences.length > 90) {
        logic -= 6;
        res.warnings.push({ lv: 1, t: '一口气太长了。人回忆的时候会换气。' });
      }
      if (chars > 40 && sentences.length < 2) {
        logic -= 5;
      }

      /* --- 2. AI 率（反） --- */
      let ai = 0;
      TEMPLATE.forEach(([w, wt]) => { if (text.indexOf(w) >= 0) ai += wt; });
      const lens = sentences.map((s) => Array.from(s).length).filter((n) => n > 0);
      if (lens.length >= 3) {
        const avg = lens.reduce((a, b) => a + b, 0) / lens.length;
        const varr = lens.reduce((a, b) => a + (b - avg) * (b - avg), 0) / lens.length;
        if (varr < 12) ai += 14;                    // 句子一样长 → 像生成的
        if (varr > 300) ai -= 8;                    // 长短不齐 → 像人
      }
      if (!/[，。！？…—]/.test(text)) ai += 10;
      if (/[\u4e00-\u9fa5]/.test(text) && !/[的了着过]/.test(text)) ai += 8;
      if (sensoryHits.length === 0) ai += 18;
      if (emoHits.length === 0) ai += 12;
      if (/(哈哈|唉|呃|那个|反正|你说|不知道怎么)/.test(text)) ai -= 9;   // 口语碎屑
      if (/[“”"]/.test(text)) ai -= 3;
      ai = Math.max(0, Math.min(100, ai * 1.7));       // 模板命中要罚得狠一点
      res.aiRate = Math.round(ai);
      const aiScore = 100 - ai * 1.05;

      /* --- 3. 跨次连贯 --- */
      let coh = 82;
      if (res._timeBreak) coh -= 20;
      res.entities = this.entities(text);
      const prevYears = [], prevNames = [], prevAges = [];
      this.history.forEach((h) => {
        (h.entities || []).forEach((e) => {
          if (e.k === 'year') prevYears.push(e.v);
          if (e.k === 'name') prevNames.push(e.v);
        });
        if (h.ages) h.ages.forEach((a) => prevAges.push(a));
      });
      res.entities.forEach((e) => {
        if (e.k === 'year' && prevYears.length) {
          // 上一次说"1998 年"配的是哪件事，这次换了件事 → 只是提示，不判死
          coh -= 0;
        }
        if (e.k === 'name' && prevNames.length && prevNames.indexOf(e.v) < 0 && res.entities.some((x) => x.k === 'name' && x !== e)) {
          coh -= 10;
          res.warnings.push({ lv: 2, t: '这一次出现的名字（' + e.v + '）和之前抵押过的记忆对不上。' });
        }
      });
      if (prevAges.length && ages.length) {
        // 同一个岁数在不同年份出现两次 → 时间线打架
        const dup = {};
        prevAges.concat(ages).forEach((a) => { dup[a] = (dup[a] || 0) + 1; });
        if (Object.keys(dup).some((a) => dup[a] > 1) && prevYears.length) {
          coh -= 12;
          res.warnings.push({ lv: 2, t: '同一个岁数，出现在了不同的年份里。' });
        }
      }
      if (!this.history.length) {
        coh = 78;
        res.warnings.push({ lv: 0, t: '没有前次可比对。这是你第一次抵押。' });
      } else {
        res.warnings.push({ lv: 0, t: '已比对 ' + this.history.length + ' 段旧记忆。' });
      }
      if (this.history.some((h) => h.text === text)) {
        coh -= 25;
        res.warnings.push({ lv: 2, t: '这段记忆你抵押过。同一段记忆不能当两次用。' });
      }

      res.dims.logic = Math.max(5, Math.min(100, Math.round(logic)));
      res.dims.ai = Math.max(5, Math.min(100, Math.round(aiScore)));
      res.dims.coherence = Math.max(5, Math.min(100, Math.round(coh)));
      res.score = Math.round(res.dims.logic * 0.35 + res.dims.ai * 0.35 + res.dims.coherence * 0.30);
      res.AGES = ages;
      return this.finish(res);
    },

    finish(res) {
      const s = res.score;
      if (s >= 85) { res.grade = '璀璨'; res.color = '#ffd700'; }
      else if (s >= 65) { res.grade = '鲜活'; res.color = '#8bc34a'; }
      else if (s >= 40) { res.grade = '褪色'; res.color = '#bcaaa4'; }
      else { res.grade = '碎裂'; res.color = '#6d6d6d'; }
      res.ok = s >= 40;
      this.last = res;
      return res;
    },

    /* ---------------- 联网核验（可失败） ---------------- */
    async online(res) {
      const ent = (res.entities || []).filter((e) => e.k === 'year' || e.k === 'quote' || e.k === 'word');
      if (!ent.length) { res.online = { mode: 'skip', hits: [] }; return res.online; }
      const q = ent.slice(0, 2).map((e) => e.v).join(' ');
      const url = 'https://zh.wikipedia.org/w/api.php?action=query&list=search&srsearch=' +
        encodeURIComponent(q) + '&srlimit=3&format=json&origin=*';
      let ctrl = null;
      try {
        ctrl = ('AbortController' in global) ? new AbortController() : null;
        const timer = setTimeout(() => { try { ctrl && ctrl.abort(); } catch (e) {} }, 3200);
        const r = await fetch(url, ctrl ? { signal: ctrl.signal } : undefined);
        clearTimeout(timer);
        const j = await r.json();
        const hits = ((j.query && j.query.search) || []).map((x) => x.title);
        res.online = { mode: 'online', q: q, hits: hits };
        // 搜到了：说明这段记忆里的事"在世界上存在过"；搜不到：只加一句提示，不扣分
        if (!hits.length) res.warnings.push({ lv: 1, t: '「' + q + '」在公开资料里查不到。' });
      } catch (e) {
        res.online = { mode: 'offline', q: q, hits: [] };
        res.warnings.push({ lv: 0, t: '联网核验失败（离线）。本次只做本地判定。' });
      }
      return res.online;
    },

    /* ---------------- 入账 ---------------- */
    commit(res) {
      this.load();
      this.history.push({
        t: Date.now(),
        text: res.text,
        score: res.score,
        grade: res.grade,
        entities: res.entities,
        ages: res.AGES || [],
        detail: res.detail,
      });
      this.persist();
      if (global.TrueName) global.TrueName.addMemory(res.text);
      return this.history.length;
    },

    reset() {
      this.history = [];
      this.persist();
    },

    /* 给 UI：三段示例（一段好、一段 AI、一段矛盾） */
    SAMPLES: [
      '那年冬天特别冷，厨房的窗户上结了一层冰花。我妈在灶台边擀面，擀面杖压在案板上咯吱咯吱地响。' +
      '我蹲在门口剥蒜，手指冻得发木，蒜皮粘在指头上怎么也搓不掉。屋里有股葱花下热油的味儿，' +
      '还有一点点煤烟。她喊我端碗，我应了一声，声音有点哑。',
      '总而言之，那一天是令人难忘的一天。首先，我感受到了家庭的温暖；其次，我意识到成长的意义。' +
      '阳光明媚，微风拂过，我深深地体会到了生活的美好，这段记忆将永远铭刻在我的心中。',
      '1998 年我十二岁，跟着父亲去了南方。2005 年我十二岁，还是跟着父亲去了南方。' +
      '我记得那趟火车很慢，车厢里有人在吃橘子，皮扔在地上，被人踩得发亮。',
    ],
  };

  global.Verify = Verify;
})(window);
