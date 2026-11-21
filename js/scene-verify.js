/* ============================================================
   scene-verify.js — 抵押 · 记忆核验
   ------------------------------------------------------------
   柜台上一直压着一张空白的抵押单。
   你在上面写一段记忆。它开始核验：
     ① 本地分析：五感开了几条 / 落不落地 / 时间线推回去
     ② 追问：挑你最缺的那一块问一句，你答，或是不答
     ③ 联网核验（查得到 / 查不到）
     ④ 与前面几次比对
   通过，给你一把凭证钥匙；不通过，墙会开始剥落。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Toast, Shake } = global.G;

  const TIER_OF = { 璀璨: 'perfect', 鲜活: 'fine', 褪色: 'plain', 碎裂: 'broken' };
  const GRADE_COLOR = { 璀璨: '#ffd700', 鲜活: '#8bc34a', 褪色: '#bcaaa4', 碎裂: '#6d6d6d' };

  const Ver = {
    inited: false,
    busy: false,
    last: null,
    askResolve: null,

    init() {
      if (this.inited) return;
      this.inited = true;
      $('#vf-run').addEventListener('click', () => this.run());
      $('#vf-back').addEventListener('click', () => this.back());
      $('#vf-ta').addEventListener('input', () => this.count());
      $$('.vf-sample').forEach((b) => {
        b.addEventListener('click', () => {
          $('#vf-ta').value = global.Verify.SAMPLES[+b.dataset.i] || '';
          this.count();
          Toast.show('样本已填入。核验的是它，不是你。', 2400);
        });
      });
      $('#vf-wipe').addEventListener('click', () => {
        $('#vf-ta').value = '';
        this.count();
        $('#vf-ta').focus();
      });
      $('#vf-ask-ok').addEventListener('click', () => this.answer($('#vf-ask-ta').value));
      $('#vf-ask-skip').addEventListener('click', () => this.answer(null));
      $('#vf-ask-ta').addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); this.answer($('#vf-ask-ta').value); }
      });
    },

    start() {
      this.init();
      this.busy = false;
      this.last = null;
      this.askResolve = null;
      $('#vf-ta').value = '';
      this.count();
      $('#vf-ask').classList.remove('on');
      $('#vf-ask-ta').value = '';
      $('#vf-result').innerHTML =
        '<div class="vf-idle">' +
        '<div class="vf-idle-top"><span class="vf-idle-k">待 核 验</span>' +
        '<span class="vf-idle-s">表单 036 · 四段，缺一段推回来</span></div>' +
        '<div class="vf-bars vf-bars-idle">' +
        ['逻辑自洽|34%', 'AI 率（反）|34%', '记忆连贯|32%'].map((x) => {
          const p = x.split('|');
          return '<div class="vf-bar"><span class="b-l">' + p[0] + '</span>' +
            '<span class="b-t"><i style="width:0%"></i></span>' +
            '<span class="b-v">—</span><span class="b-h">' + p[1] + '</span></div>';
        }).join('') +
        '</div>' +
        '<div class="vf-idle-tip">写一段你记得的事。越具体越好：<br>' +
        '光是什么颜色的，声音从哪个方向来，你手上有什么感觉。<br>' +
        '<em>——写不出来，它会问你一句。</em></div>' +
        '<div class="vf-idle-note">它不打分「真不真」。它只看这段话里，有没有人真的在场。</div>' +
        '</div>';
      $('#vf-stage').innerHTML = '';
      $('#vf-stage').classList.remove('on');
      $('#vf-result').classList.remove('on');
      this.history();
      setTimeout(() => { try { $('#vf-ta').focus(); } catch (e) {} }, 300);
    },

    count() {
      const n = Array.from($('#vf-ta').value).length;
      $('#vf-count').textContent = n + ' 字';
      $('#vf-count').className = 'vf-count ' + (n < 12 ? 'low' : n > 600 ? 'high' : '');
    },

    history() {
      const box = $('#vf-hist');
      const h = global.Verify.load();
      if (!h.length) { box.innerHTML = '<div class="vf-hist-empty">还没有抵押过。</div>'; return; }
      box.innerHTML = h.slice(-5).reverse().map((x) =>
        '<div class="vf-hist-row"><span class="g" style="color:' + this.colorOf(x.grade) + '">' + x.grade + '</span>' +
        '<span class="s">' + x.score + '</span><span class="t">' + x.text.slice(0, 26) + '…</span></div>').join('');
    },

    colorOf(g) { return GRADE_COLOR[g] || '#888'; },

    stageLine(t, cls) {
      const box = $('#vf-stage');
      box.classList.add('on');
      const d = document.createElement('div');
      d.className = 'vf-st ' + (cls || '');
      d.textContent = t;
      box.appendChild(d);
      box.scrollTop = box.scrollHeight;
      return d;
    },

    /* ---------------- 核验中：右栏别一直挂着「待核验」 ---------------- */
    pending() {
      const box = $('#vf-result');
      box.classList.remove('on');
      box.innerHTML =
        '<div class="vf-idle vf-busy">' +
        '<div class="vf-idle-top"><span class="vf-idle-k">核 验 中<span class="vf-dot"></span></span>' +
        '<span class="vf-idle-s">表单 036 · 四段</span></div>' +
        '<div class="vf-bars vf-bars-idle">' +
        ['逻辑自洽', 'AI 率（反）', '记忆连贯', '追问回应'].map((l) =>
          '<div class="vf-bar"><span class="b-l">' + l + '</span>' +
          '<span class="b-t"><i style="width:0%"></i></span>' +
          '<span class="b-v">—</span><span class="b-h"></span></div>').join('') +
        '</div>' +
        '<div class="vf-idle-tip">它读得比你写得慢。<br>先别急着补。</div>' +
        '</div>';
    },

    /* ---------------- ② 追问：把流程按住，等人开口 ---------------- */
    ask(question) {
      $('#vf-ask-t').textContent = question;
      $('#vf-ask').classList.add('on');
      $('#vf-ask-ta').value = '';
      $('#vf-ask-ok').disabled = false;
      setTimeout(() => { try { $('#vf-ask-ta').focus(); } catch (e) {} }, 260);
      return new Promise((resolve) => { this.askResolve = resolve; });
    },

    answer(v) {
      if (!this.askResolve) return;
      const r = this.askResolve;
      this.askResolve = null;
      $('#vf-ask-ok').disabled = true;
      const t = String(v == null ? '' : v).trim();
      $('#vf-ask').classList.remove('on');
      r(t || null);
    },

    async run() {
      if (this.busy) return;
      const text = $('#vf-ta').value.trim();
      if (!text) {
        document.dispatchEvent(new CustomEvent('memoryEmpty'));
        Toast.show('空白的一张纸。柜台后面的人没有接。', 2600);
        return;
      }
      this.busy = true;
      $('#vf-run').disabled = true;
      $('#vf-stage').innerHTML = '';
      $('#vf-ask').classList.remove('on');
      this.pending();

      this.stageLine('① 本地分析：五感通道 / 落地程度 / 时间线……', 'run');
      await wait(700);
      const res = global.Verify.analyze(text);
      const sn = res.senses || { ch: 0, keys: [] };
      const senseTxt = sn.ch
        ? sn.ch + '/5（' + sn.keys.map((k) => global.Verify.SENSE_NAME[k]).join(' ') + '）'
        : '0/5';
      this.stageLine('　 五感 ' + senseTxt + '　落地 ' + res.solid.v + '　AI 率 ' + res.aiRate + '%', 'dim');
      await wait(380);
      if (res.timeline && res.timeline.years.length) {
        this.stageLine('　 时间线：' + res.timeline.years.join(' → ') +
          (res.timeline.conflict ? '　← 推回去对不上' : ''), res.timeline.conflict ? 'warn' : 'dim');
        await wait(320);
      }

      /* --- 追问 --- */
      if (res.ask) {
        this.stageLine('② 它停了一下。它要问你一句。', 'run');
        const ans = await this.ask(res.ask);
        global.Verify.recheck(res, ans);
        this.stageLine(ans
          ? '　 你答了 ' + Array.from(ans).length + ' 字。重新折算：' + res.score
          : '　 你没答。凭证薄了一层。', ans ? 'dim' : 'warn');
        await wait(420);
      } else {
        this.stageLine('② 它没有再问。这段记忆，它没有疑问。', 'dim');
        await wait(320);
      }

      this.stageLine('③ 提取实体：' + ((res.entities || []).map((e) => e.v).join('、') || '（无）'), 'run');
      await wait(340);
      await global.Verify.online(res);
      if (res.online.mode === 'online') {
        this.stageLine('　 已连接维基百科：' +
          (res.online.hits.length ? '命中 ' + res.online.hits.length + ' 条 · ' + res.online.hits.slice(0, 2).join(' / ') : '没有命中'), 'dim');
      } else if (res.online.mode === 'offline') {
        this.stageLine('　 联网核验失败（离线）。只做本地判定。', 'warn');
      } else {
        this.stageLine('　 没有可检索的实体。跳过。', 'dim');
      }
      await wait(380);

      this.stageLine('④ 与 ' + global.Verify.history.length + ' 段旧记忆比对……', 'run');
      await wait(460);
      const before = global.Verify.history.length;
      global.Verify.commit(res);
      if (before && global.Verify.history.some((h) => h.text === text && h !== global.Verify.history[global.Verify.history.length - 1])) {
        document.dispatchEvent(new CustomEvent('memoryRepeat'));
      }
      global.Eggs && global.Eggs.scanText(text);
      if (global.TrueName) global.TrueName.bump('ver', 1);
      if (global.State.sys) global.State.sys.verified++;

      this.last = res;
      await wait(240);
      this.render(res);
      this.history();
      this.busy = false;
      $('#vf-run').disabled = false;

      if (res.score >= 85) { global.Snd && global.Snd.ok && global.Snd.ok(); }
      else if (res.score < 40) {
        Shake.start(document.body, 5, 26);
        setTimeout(() => Shake.stop(), 420);
        global.Snd && global.Snd.deny && global.Snd.deny();
        Toast.show('记忆被拒绝。墙在动。', 3000);
      }
      // 三次通过 → L1
      if (global.State.sys.verified === 3) {
        Toast.show('你的视角变了一点。按 P 看看。', 3600);
        global.Eggs && global.Eggs.unlock(3, true);
      }
    },

    render(res) {
      const tier = global.KEY_TIERS ? global.KEY_TIERS[TIER_OF[res.grade]] : null;
      const bar = (label, v, hint) =>
        '<div class="vf-bar"><span class="b-l">' + label + '</span>' +
        '<span class="b-t"><i style="width:' + v + '%"></i></span>' +
        '<span class="b-v">' + v + '</span>' +
        '<span class="b-h">' + hint + '</span></div>';

      const warns = (res.warnings || []).map((w) =>
        '<div class="vf-w lv' + (w.lv || 0) + '">' + w.t + '</div>').join('');

      /* 五感：开了哪几条，一眼看见 */
      const sn = res.senses || { hits: {}, ch: 0 };
      const senseCells = global.Verify.SENSE_KEYS.map((k) => {
        const n = sn.hits[k] || 0;
        return '<span class="vf-sn' + (n ? ' on' : '') + '">' + global.Verify.SENSE_NAME[k] + '</span>';
      }).join('');

      /* 落地：名字 / 地名 / 数 / 时间锚 */
      const sd = res.solid || {};
      const solidBits = [
        ['名字', sd.named || 0], ['地名', sd.places || 0],
        ['数', sd.nums || 0], ['时间锚', sd.anchors || 0], ['引号', sd.dialog || 0],
      ].filter((x) => x[1] > 0);
      const solidRow = solidBits.length
        ? solidBits.map((x) => '<b>' + x[0] + ' ' + x[1] + '</b>').join('<i>·</i>')
        : '<em>一个都没有</em>';

      /* 时间线 */
      let tl = '';
      const tm = res.timeline || { pts: [], years: [], conflict: false };
      if (tm.years.length) {
        tl = '<div class="vf-tl">' + tm.years.map((y) => '<span class="vf-ty' + (tm.conflict ? ' bad' : '') + '">' + y + '</span>').join('<i>→</i>');
        if (tm.pts.length) {
          tl += '<span class="vf-tby">推回生年 ' + tm.birthdays.join(' / ') + '</span>';
        }
        tl += '</div>';
      }

      /* 追问那一段 */
      let askBox = '';
      if (res.reply) {
        const q = res.ask || '';
        const a = res.reply.ans;
        askBox = '<div class="vf-reply' + (res.reply.skipped ? ' skip' : '') + '">' +
          '<div class="vr-q"><b>它问</b>' + q + '</div>' +
          '<div class="vr-a"><b>' + (res.reply.skipped ? '你没答' : '你答') + '</b>' +
          (a ? a : '（沉默）') + '</div>' +
          '<div class="vr-v">追问得分 ' + res.reply.v + '</div>' +
          '</div>';
      }

      /* 联网 */
      let onBox = '';
      if (res.online && res.online.mode === 'online' && res.online.hits.length) {
        onBox = '<div class="vf-online">世界上查得到：' +
          res.online.hits.slice(0, 3).map((h) => '<span>' + h + '</span>').join('') + '</div>';
      } else if (res.online && res.online.mode === 'offline') {
        onBox = '<div class="vf-online off">联网失败。这一次，只有它自己判断。</div>';
      }

      const ok = res.ok;
      $('#vf-result').innerHTML =
        '<div class="vf-card ' + (ok ? 'ok' : 'no') + '">' +
        '<div class="vf-score"><b style="color:' + res.color + '">' + res.score + '</b>' +
        '<span>综合评分</span>' +
        '<em class="vf-seal" style="border-color:' + res.color + ';color:' + res.color + '">' + res.grade + '</em></div>' +
        '<div class="vf-bars">' +
        bar('逻辑自洽', res.dims.logic, res.dims.reply != null ? '26%' : '34%') +
        bar('AI 率（反）', res.dims.ai, res.dims.reply != null ? '26%' : '34%') +
        bar('记忆连贯', res.dims.coherence, res.dims.reply != null ? '24%' : '32%') +
        (res.dims.reply != null ? bar('追问回应', res.dims.reply, '24%') : '') +
        '</div>' +
        '<div class="vf-grain">' +
        '<div class="vf-g-row"><span class="vf-g-k">五感</span><span class="vf-g-v">' +
        senseCells + '<em>' + sn.ch + '/5</em></span></div>' +
        '<div class="vf-g-row"><span class="vf-g-k">落地</span><span class="vf-g-v vf-g-s">' + solidRow + '</span></div>' +
        tl +
        '</div>' +
        askBox +
        onBox +
        '<div class="vf-warns">' + (warns || '<div class="vf-w lv0">没有异常。这段记忆像真的。</div>') + '</div>' +
        '<div class="vf-proof ' + (ok ? '' : 'bad') + '">' +
        (ok
          ? '<div class="vp-k">记忆凭证 · ' + (tier ? tier.name : res.grade) + '</div>' +
            '<div class="vp-s">细节 ' + res.detail + ' / 8　·　可用于开门、开锁、开抽屉</div>'
          : '<div class="vp-k">拒绝</div><div class="vp-s">这张单子被推回来了。墙后面有东西在动。</div>') +
        '</div>' +
        '<div class="vf-name">真名 · 记忆码已更新：' +
        (global.TrueName ? global.TrueName.key('memory') : '—') + '</div>' +
        '</div>';

      $('#vf-result').classList.add('on');

      // 凭证回写：只升不降
      if (ok && global.State) {
        const order = ['broken', 'plain', 'fine', 'perfect'];
        const now = order.indexOf(global.State.keyQ || 'broken');
        const got = order.indexOf(TIER_OF[res.grade]);
        if (got > now) global.State.keyQ = TIER_OF[res.grade];
        if (res.detail > (global.State.detail || 0)) global.State.detail = res.detail;
        global.State.sys.verified = global.State.sys.verified;
      }
    },

    async back() {
      if (this.askResolve) { this.answer(null); }
      if (this.busy) { this.busy = false; $('#vf-run').disabled = false; }
      await global.G.Fade.through(() => {
        App.show('counter');
        global.Counter.init();
      });
    },
  };

  global.Ver = Ver;
})(window);
