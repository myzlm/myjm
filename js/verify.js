/* ============================================================
   verify.js — 记忆核验引擎 · 第二版
   ------------------------------------------------------------
   第一版只问三件事：说不说得通、像不像人写的、跟前面对不对得上。
   第二版多问一层：你说的是「记得」，还是「知道」。

   四段：
     ① 五感 / 具体 / 时间线   —— 量的是记忆的颗粒，不是字数
     ② 追问                   —— 它反问你一句，看你答不答得上来
     ③ 联网核验               —— 年份、书名、人名，拿去搜一遍
     ④ 跨次比对               —— 和前面押过的对不对得上

   它仍然不判断「你说的是不是真的」。
   它判断的是：「这段话里，有没有人真的在场。」
   ============================================================ */
(function (global) {
  'use strict';

  const LS = 'code_echo_memories_v1';

  /* ---------------- 五 感 通 道 ----------------
     不是数词，是数「开了几条通道」。
     一段真记得的事，通常至少开三条。 */
  const SENSES = {
    see: ('看见 看到 望着 盯着 光是 光从 光线 影子 昏黄 惨白 发黑 发亮 反光 刺眼 晃眼 模糊 亮着 灭了 ' +
      '灯泡 灯 蜡烛 煤油灯 火光 烟 雾 雪 雨 玻璃 窗 墙 纸 脸 眼睛 指甲 头发 血 锈 斑 印子 花纹 ' +
      '月光 太阳 天色 褪色 绿 红 黄 灰 蓝 白 黑 暗 亮').split(/\s+/),
    hear: ('声音 声响 响 静 安静 吱呀 咯吱 咔 嗒 滴答 沙沙 噼啪 嗡 轰 铃 铃声 哭 喊 叫 骂 咳 喘 ' +
      '呼吸 脚步 敲 拍 撞 磨 撕 裂 唱 念 数 咽 嘟囔 吵 耳鸣 回声 闷响 尖 拖长 停了 收音机 电视 钟 ' +
      '广播 喇叭 鞭炮').split(/\s+/),
    touch: ('冷 热 凉 烫 冰 冻 暖 温 湿 潮 干 硬 软 粗糙 滑 涩 粘 黏 扎 刺 麻 痒 疼 酸 抖 哆嗦 ' +
      '发木 发僵 汗 油 滑腻 沉 重 轻 压 握住 捏 攥 摸 蹭 硌 按 擦 冻僵 烫手 冰凉').split(/\s+/),
    smell: ('味儿 气味 味道 香 臭 腥 霉 酸 焦 糊 煤 煤烟 烟味 油烟 葱 蒜 药 香灰 檀 纸灰 灰 土 ' +
      '潮气 汗味 酒 腐 烂 甜 苦 呛 熏 扑鼻 冲鼻 药味 汽油').split(/\s+/),
    taste: ('尝 甜 咸 苦 酸 涩 辣 腥 铁锈味 口水 咽下 舌头 牙 嘴 干 渴 苦味 甜味 发苦 发涩').split(/\s+/),
  };
  const SENSE_KEYS = ['see', 'hear', 'touch', 'smell', 'taste'];
  const SENSE_NAME = { see: '看', hear: '听', touch: '碰', smell: '闻', taste: '尝' };

  const EMOTION = ('害怕 怕 慌 紧张 难过 伤心 委屈 生气 高兴 开心 安心 踏实 孤独 寂寞 羞 后悔 想念 ' +
    '舍不得 心疼 烦 累 无措 发怵 松了口 憋 忍 温柔 恨 喜欢 爱 空 麻木 惊 愣 酸 挺住 ' +
    '不敢 想哭 想笑 松 沉 悬 堵 发毛 后怕').split(/\s+/);

  /* 模板化表达：命中越多，AI 率越高 */
  const TEMPLATE = [
    ['总而言之', 6], ['值得一提的是', 8], ['首先', 4], ['其次', 4], ['最后', 2],
    ['在这个', 4], ['的过程中', 5], ['让人不禁', 7], ['不禁感慨', 8], ['油然而生', 8],
    ['时光荏苒', 10], ['岁月如梭', 10], ['记忆犹新', 5], ['历历在目', 5],
    ['深深地', 5], ['无比', 4], ['十分', 3], ['非常', 3], ['仿佛', 3], ['似乎', 2],
    ['我永远不会忘记', 8], ['那一刻', 4], ['那一刻我', 5], ['温暖', 3], ['美好', 3],
    ['充满', 3], ['仿佛整个世界', 12], ['我意识到', 5], ['让我明白', 6], ['不仅是', 4],
    ['更是', 5], ['无论', 3], ['还是', 2], ['阳光明媚', 9], ['微风拂过', 9],
    ['不忘初心', 9], ['人生的意义', 9], ['生活的意义', 9], ['让我懂得', 7],
    ['深深体会', 8], ['难以忘怀', 7], ['刻骨铭心', 8],
  ];

  /* 总结词：这些不是「记得」，是「想明白了」 */
  const ABSTRACT = ('温暖 美好 意义 成长 感悟 珍贵 难忘 永远 铭记 铭刻 回忆 时光 岁月 人生 情感 ' +
    '体会 感受 深刻 幸福 感动 感慨 启迪 力量').split(/\s+/);

  /* 时间锚：有锚的地方，人才站得住 */
  const ANCHORS = ('那年 那年冬天 那年夏天 那天 那天晚上 那天早上 那天下午 后来 第二天 第二天一早 ' +
    '早上 中午 下午 傍晚 晚上 半夜 凌晨 小时候 小时候有一次 腊月 正月 除夕 清明 中秋 冬天 夏天 ' +
    '秋天 春天 那年冬天特别冷 从前 有一年 那年头').split(/\s+/);

  const COMMON_SENSE = [
    [/太阳.{0,6}西边.{0,4}升/, '太阳从西边升起来。'],
    [/一年.{0,4}(十三|13)个?月/, '一年有十三个月。'],
    [/1\s*\+\s*1\s*=\s*3/, '1+1=3。'],
    [/(我|他|她).{0,4}死了.{0,10}(现在|今天|正在)/, '人死了，但"现在"还在做事。'],
  ];

  const CN_D = { 零: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

  const cnNum = (s) => {
    const m = String(s).match(/\d+/);
    if (m) return +m[0];
    const t = String(s).replace(/[岁\s]/g, '');
    if (/^[零一二两三四五六七八九]$/.test(t)) return CN_D[t];
    if (t === '十') return 10;
    const m2 = t.match(/^([一二两三四五六七八九])?十([一二三四五六七八九])?$/);
    if (m2) return (m2[1] ? CN_D[m2[1]] : 1) * 10 + (m2[2] ? CN_D[m2[2]] : 0);
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

  function countHits(list, text) {
    let n = 0;
    for (let i = 0; i < list.length; i++) if (text.indexOf(list[i]) >= 0) n++;
    return n;
  }

  /* ============================================================
     时 间 线
     ------------------------------------------------------------
     两句话：1998 年我十二岁 / 2005 年我十二岁
     第一版只看出「岁数重复」。第二版往下推一步：
     1998-12 = 1986 年生；2005-12 = 1993 年生。
     同一个人，生了两回。这才是对不上的地方。
     ============================================================ */
  function timeline(text) {
    const pts = [];
    const push = (y, a, src) => {
      if (!y || !a) return;
      if (pts.some((p) => p.y === y && p.a === a)) return;
      pts.push({ y: y, a: a, by: y - a, src: src });
    };
    let m;
    const re1 = /((?:19|20)\d{2})\s*年?[^。！？\n]{0,14}?(\d{1,3}|[一二两三四五六七八九十]{1,3})\s*岁/g;
    while ((m = re1.exec(text))) push(+m[1], cnNum(m[2]), m[0]);
    const re2 = /(\d{1,3}|[一二两三四五六七八九十]{1,3})\s*岁[^。！？\n]{0,14}?((?:19|20)\d{2})\s*年/g;
    while ((m = re2.exec(text))) push(+m[2], cnNum(m[1]), m[0]);

    const birthdays = pts.map((p) => p.by);
    const conflict = birthdays.length >= 2 &&
      (Math.max.apply(null, birthdays) - Math.min.apply(null, birthdays)) >= 2;

    /* 只说年份、不说岁数的那几句，也摆到线上——给 UI 看 */
    const bare = (text.match(/(?:19|20)\d{2}\s*年?/g) || []).map((s) => +s.replace(/[^\d]/g, ''));
    const years = [];
    pts.forEach((p) => { if (years.indexOf(p.y) < 0) years.push(p.y); });
    bare.forEach((y) => { if (years.indexOf(y) < 0) years.push(y); });
    years.sort();

    return {
      pts: pts,
      years: years,
      birthdays: birthdays,
      conflict: conflict,
      span: birthdays.length ? Math.max.apply(null, birthdays) - Math.min.apply(null, birthdays) : 0,
    };
  }

  /* ============================================================
     具 体 性
     ------------------------------------------------------------
     「有个人在一个地方做了一件事」——这是骨架。
     骨架不值钱。值钱的是：谁、哪、几个、什么颜色的。
     ============================================================ */
  function solidOf(text) {
    const named = (text.match(/[\u4e00-\u9fa5]{2,3}(?=叫|说|告诉我|骂|喊|问)/g) || []);
    const places = (text.match(/[\u4e00-\u9fa5]{1,4}(?:胡同|村|镇|县|市|街|巷|院子|院|厂|学校|中学|小学|铺子|店|桥|河边|山上|楼|单元|门牌)/g) || []);
    const nums = (text.match(/\d+/g) || []).concat(
      text.match(/[一二两三四五六七八九十几半]+(?:个|只|条|天|年|岁|点|斤|块|毛|分|里|米|步|声|下|遍|回)/g) || []
    );
    const anchors = ANCHORS.filter((w) => text.indexOf(w) >= 0);
    const dialog = (text.match(/[「“"][^」”"]{2,}[」”"]/g) || []).length;
    const abstract = ABSTRACT.filter((w) => text.indexOf(w) >= 0);

    return {
      named: named.length,
      places: places.length,
      nums: nums.length,
      anchors: anchors.length,
      dialog: dialog,
      abstract: abstract.length,
      names: named.concat(places).slice(0, 6),
      anchorWords: anchors.slice(0, 5),
      /* 0–100：够不够"落地" */
      v: Math.max(0, Math.min(100,
        24 + named.length * 11 + places.length * 13 + Math.min(24, nums.length * 8) +
        Math.min(18, anchors.length * 9) + dialog * 9 - abstract.length * 12)),
    };
  }

  function senseOf(text) {
    const hits = {};
    let ch = 0, total = 0;
    SENSE_KEYS.forEach((k) => {
      const n = countHits(SENSES[k], text);
      hits[k] = n;
      if (n > 0) ch++;
      total += n;
    });
    return { hits: hits, ch: ch, total: total, keys: SENSE_KEYS.filter((k) => hits[k] > 0) };
  }

  /* ---------------- 追 问 ----------------
     它不是随机问。它挑你最缺的那一块问。
     ============================================================ */
  const ASK = {
    see: '你没说你看见了什么。那会儿屋里亮着吗，光是从哪儿来的？',
    hear: '你没说听见了什么。当时安静吗？安静里头有没有别的响动？',
    touch: '你没说手上是什么感觉。那天你碰到的第一样东西，是凉的还是热的？',
    smell: '你没说闻到了什么。那地方是什么味儿？',
    taste: '你没说嘴里是什么味儿。那天你吃过什么，或者渴不渴？',
  };

  function askFor(res) {
    if (res.timeline && res.timeline.conflict) {
      const b = res.timeline.birthdays;
      return '你说的这两句，推出来是两个生年：' + b.join(' 年 / ') + ' 年。哪一句是真的？';
    }
    if (res.senses.ch === 0) {
      return '你写的这些，没有一个地方是具体的。那天你手里拿着什么？';
    }
    const miss = SENSE_KEYS.filter((k) => !res.senses.hits[k]);
    if (miss.length) return ASK[miss[0]];
    if (res.solid.named === 0 && res.solid.places === 0) {
      return '里面一个人名、一个地名都没有。那件事里，还有谁在？';
    }
    if (res.solid.nums === 0) {
      return '没有一个数。几岁、几年、几个人——一个都说不出来吗？';
    }
    return null;
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
      (text.match(/[\u4e00-\u9fa5]{1,4}(?:胡同|村|镇|县|街|巷|院子|厂|学校|中学|小学|铺子|桥)/g) || []).slice(0, 2).forEach((p) => add(p, 'place'));
      (text.match(/[A-Za-z]{3,}/g) || []).slice(0, 2).forEach((w) => add(w, 'word'));
      return out;
    },

    /* ---------------- 账本对照：名字撞上了没有 ---------------- */
    ledger() {
      const out = [];
      try {
        const mv = global.__mv;
        if (mv && typeof mv.records === 'function') {
          [1, 14, 22, 36].forEach((n) => {
            const t = mv.records(n);
            if (typeof t !== 'string') return;
            const m = t.match(/"name":\s*"([^"]{1,8})"/);
            if (m && m[1] && m[1].indexOf('█') < 0) out.push({ id: n, name: m[1] });
          });
        }
      } catch (e) {}
      return out;
    },

    /* ---------------- ① 本地分析 ---------------- */
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
        senses: { hits: {}, ch: 0, total: 0, keys: [] },
        senseKeys: [],
        solid: { v: 0 },
        timeline: { pts: [], years: [], birthdays: [], conflict: false, span: 0 },
        ask: null,
        reply: null,
        ledgerHit: null,
        online: { mode: 'skip', hits: [] },
      };

      if (chars < 12) {
        res.warnings.push({ lv: 3, t: '太短了。短到不能算"记得"，只能算"知道"。' });
        res.dims = { logic: 20, ai: 40, coherence: 10 };
        const r = this.finish(res);
        r.score = 22;               // 一段太短的话，钉死在 22 分，不参与加权
        r.ask = null;
        return r;
      }

      const sen = senseOf(text);
      const emoHits = EMOTION.filter((w) => text.indexOf(w) >= 0);
      res.senses = sen;
      res.senseKeys = sen.keys;
      res.sensory = sen.total;
      res.emotion = emoHits.length;
      res.detail = Math.max(3, Math.min(8, Math.round(3 + sen.ch * 0.75 + Math.min(2, sen.total / 6))));

      res.solid = solidOf(text);
      res.timeline = timeline(text);
      const ages = agesOf(text);
      res.AGES = ages;

      /* --- 1. 逻辑自洽 --- */
      let logic = 92;
      COMMON_SENSE.forEach(([re, msg]) => {
        if (msg && re.test(text)) {
          logic -= 34;
          res.warnings.push({ lv: 3, t: '常识冲突：' + msg });
        }
      });
      if (ages.length >= 2) {
        const mn = Math.min.apply(null, ages), mx = Math.max.apply(null, ages);
        if (mx - mn > 80) { logic -= 16; res.warnings.push({ lv: 2, t: '年龄跨度不合常理（' + mn + ' 岁 / ' + mx + ' 岁）。' }); }
      }
      /* 时间线：生年对不上 */
      if (res.timeline.conflict) {
        logic -= 34;
        res._timeBreak = true;
        res.warnings.push({
          lv: 3,
          t: '按你说的年份和岁数往回推，你出生于 ' + res.timeline.birthdays.join(' 年，又出生于 ') +
            ' 年。同一个人，生了两回。',
        });
      } else if (res.timeline.pts.length >= 2 && res.timeline.span === 1) {
        logic -= 6;
        res.warnings.push({ lv: 1, t: '两句话推出的生年差了一年。差一年，也可能是记错。' });
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
      /* 只有骨架，没有东西：它说得通，但它不曾发生 */
      if (res.solid.v < 26) {
        logic -= 10;
        res.warnings.push({ lv: 2, t: '这段话里，没有一个人名、一个地名、一个数。它说得通，但它没落地。' });
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
      if (sen.ch === 0) ai += 20;
      else if (sen.ch === 1) ai += 8;
      else if (sen.ch >= 3) ai -= 10;               // 三条通道都在 → 人写的
      if (emoHits.length === 0) ai += 8;
      if (res.solid.abstract >= 2) ai += 10;
      else if (res.solid.abstract === 0 && res.solid.v >= 60) ai -= 8;
      if (/(哈哈|唉|呃|那个|反正|你说|不知道怎么|其实我|我记着|那时候)/.test(text)) ai -= 9;   // 口语碎屑
      if (/[“”"]/.test(text)) ai -= 3;
      ai = Math.max(0, Math.min(100, ai * 1.7));
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
          coh -= 0;
        }
        if (e.k === 'name' && prevNames.length && prevNames.indexOf(e.v) < 0 && res.entities.some((x) => x.k === 'name' && x !== e)) {
          coh -= 10;
          res.warnings.push({ lv: 2, t: '这一次出现的名字（' + e.v + '）和之前抵押过的记忆对不上。' });
        }
      });
      if (prevAges.length && ages.length) {
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

      /* --- 账本对照：这一段里，有没有账本上的人 --- */
      const led = this.ledger();
      for (let i = 0; i < led.length; i++) {
        if (led[i].name && text.indexOf(led[i].name) >= 0) {
          res.ledgerHit = led[i];
          coh -= 8;
          res.warnings.push({ lv: 2, t: '「' + led[i].name + '」这个名字，账本第 ' + led[i].id + ' 行有。你认识他？' });
          break;
        }
      }

      res.dims.logic = Math.max(5, Math.min(100, Math.round(logic)));
      res.dims.ai = Math.max(5, Math.min(100, Math.round(aiScore)));
      res.dims.coherence = Math.max(5, Math.min(100, Math.round(coh)));

      const r = this.finish(res);
      /* 够好的，它就不问了 —— 分数拿满的人，不会被人追着问 */
      r.ask = (r.score >= 85 && !r.timeline.conflict) ? null : askFor(r);
      return r;
    },

    /* ---------------- ② 追 问 回 收 ----------------
       它问一句，你答一句。答得实，分数往上走；绕过去，往下掉。
       ============================================================ */
    scoreReply(ans, res) {
      const t = String(ans == null ? '' : ans).trim();
      if (!t) return { v: 34, notes: ['它问了一句，你没答。'], skipped: true };

      let v = 54;
      const notes = [];
      const ch = Array.from(t).length;

      if (ch < 4) { v -= 22; notes.push('四个字以下，不算答。'); }
      else if (ch < 10) { v -= 8; }
      else if (ch >= 36) { v += 5; }

      /* 补上原来缺的通道 —— 这是它真正想听的 */
      const sen = senseOf(t);
      const before = res.senseKeys || [];
      const fresh = sen.keys.filter((k) => before.indexOf(k) < 0);
      if (fresh.length) {
        v += 13 * Math.min(2, fresh.length);
        notes.push('补上了「' + fresh.map((k) => SENSE_NAME[k]).join('、') + '」。');
      }

      const nums = (t.match(/\d+/g) || []).length +
        (t.match(/[一二两三四五六七八九十几半]+(?:个|只|条|天|年|岁|点|斤|块|步|声|下|遍|回)/g) || []).length;
      if (nums) { v += Math.min(12, nums * 6); }

      const ab = ABSTRACT.filter((w) => t.indexOf(w) >= 0).length;
      if (ab) { v -= 9 * Math.min(2, ab); notes.push('回答里还是总结，不是东西。'); }

      if (ch >= 8 && res.text.indexOf(t.slice(0, 8)) >= 0) {
        v -= 14;
        notes.push('你把原文又说了一遍。');
      }
      if (/(不记得|忘了|记不清|不知道|想不起|说不上)/.test(t)) {
        v -= 10;
        notes.push('「不记得」也是一种答案，只是不结实。');
      }
      /* 反问：不答，但把问题推回去 —— 柜台后面的人不生气 */
      if (/[？?]/.test(t) && /(为什么|凭什么|你问|谁问|关你|你到底)/.test(t)) {
        v = Math.max(v, 63);
        notes.push('你反问了它。它没有生气，只把问题记下来了。');
      }

      return { v: Math.max(6, Math.min(100, v)), notes: notes, skipped: false };
    },

    recheck(res, ans) {
      const r = this.scoreReply(ans, res);
      res.reply = { ans: String(ans == null ? '' : ans).trim(), v: r.v, notes: r.notes, skipped: r.skipped };
      res.dims.reply = r.v;
      if (r.skipped) {
        res.warnings.push({ lv: 1, t: '它问了你一句，你没答。凭证会薄一层。' });
      } else if (r.notes.length) {
        res.warnings.push({ lv: 0, t: '追问：' + r.notes.join('') });
      }
      return this.finish(res);
    },

    finish(res) {
      const d = res.dims;
      let s;
      if (d.reply != null) {
        s = Math.round(d.logic * 0.26 + d.ai * 0.26 + d.coherence * 0.24 + d.reply * 0.24);
      } else {
        s = Math.round(d.logic * 0.34 + d.ai * 0.34 + d.coherence * 0.32);
      }
      res.score = s;
      if (s >= 85) { res.grade = '璀璨'; res.color = '#ffd700'; }
      else if (s >= 65) { res.grade = '鲜活'; res.color = '#8bc34a'; }
      else if (s >= 40) { res.grade = '褪色'; res.color = '#bcaaa4'; }
      else { res.grade = '碎裂'; res.color = '#6d6d6d'; }
      res.ok = s >= 40;
      this.last = res;
      return res;
    },

    /* ---------------- ③ 联网核验（可失败） ---------------- */
    async online(res) {
      const ent = (res.entities || []).filter((e) => e.k === 'year' || e.k === 'quote' || e.k === 'word' || e.k === 'place');
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
        senses: res.senses ? res.senses.ch : 0,
        asked: !!res.reply,
      });
      this.persist();
      if (global.TrueName) global.TrueName.addMemory(res.text);
      return this.history.length;
    },

    reset() {
      this.history = [];
      this.persist();
    },

    SENSE_NAME: SENSE_NAME,
    SENSE_KEYS: SENSE_KEYS,

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
