/* ============================================================
   scene-verify.js — 抵押 · 记忆核验
   ------------------------------------------------------------
   柜台上一直压着一张空白的抵押单。
   你在上面写一段记忆。它开始核验：
     ① 本地三维评分
     ② 联网核验（查得到 / 查不到）
     ③ 与前面几次比对
   通过，给你一把凭证钥匙；不通过，墙会开始剥落。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Toast, Shake } = global.G;

  const TIER_OF = { 璀璨: 'perfect', 鲜活: 'fine', 褪色: 'plain', 碎裂: 'broken' };

  const Ver = {
    inited: false,
    busy: false,
    last: null,

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
    },

    start() {
      this.init();
      this.busy = false;
      this.last = null;
      $('#vf-ta').value = '';
      this.count();
      $('#vf-result').innerHTML =
        '<div class="vf-idle">' +
        '<div class="vf-idle-top"><span class="vf-idle-k">待 核 验</span>' +
        '<span class="vf-idle-s">表单 036 · 三段，缺一段推回来</span></div>' +
        '<div class="vf-bars vf-bars-idle">' +
        ['逻辑自洽|35%', 'AI 率（反）|35%', '记忆连贯|30%'].map((x) => {
          const p = x.split('|');
          return '<div class="vf-bar"><span class="b-l">' + p[0] + '</span>' +
            '<span class="b-t"><i style="width:0%"></i></span>' +
            '<span class="b-v">—</span><span class="b-h">' + p[1] + '</span></div>';
        }).join('') +
        '</div>' +
        '<div class="vf-idle-tip">写一段你记得的事。越具体越好：<br>' +
        '光是什么颜色的，声音从哪个方向来，你手上有什么感觉。</div>' +
        '<div class="vf-idle-note">它不打分「真不真」。它只看这段记忆，像不像一个人真的记得。</div>' +
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

    colorOf(g) {
      return { 璀璨: '#ffd700', 鲜活: '#8bc34a', 褪色: '#bcaaa4', 碎裂: '#6d6d6d' }[g] || '#888';
    },

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
      $('#vf-result').classList.remove('on');

      this.stageLine('① 本地分析：感官细节 / 情感一致 / 独特性……', 'run');
      await wait(720);
      const res = global.Verify.analyze(text);
      this.stageLine('　 感官词 ' + res.sensory + ' 个　情感词 ' + res.emotion + ' 个　AI 率 ' + res.aiRate + '%', 'dim');
      await wait(420);

      this.stageLine('② 提取实体：' + ((res.entities || []).map((e) => e.v).join('、') || '（无）'), 'run');
      await wait(380);
      await global.Verify.online(res);
      if (res.online.mode === 'online') {
        this.stageLine('　 已连接维基百科：' + (res.online.hits.length ? '命中 ' + res.online.hits.length + ' 条' : '没有命中'), 'dim');
      } else if (res.online.mode === 'offline') {
        this.stageLine('　 联网核验失败（离线）。只做本地判定。', 'warn');
      } else {
        this.stageLine('　 没有可检索的实体。跳过。', 'dim');
      }
      await wait(420);

      this.stageLine('③ 与 ' + global.Verify.history.length + ' 段旧记忆比对……', 'run');
      await wait(480);
      const before = global.Verify.history.length;
      global.Verify.commit(res);
      if (before && global.Verify.history.some((h) => h.text === text && h !== global.Verify.history[global.Verify.history.length - 1])) {
        document.dispatchEvent(new CustomEvent('memoryRepeat'));
      }
      global.Eggs && global.Eggs.scanText(text);
      if (global.TrueName) global.TrueName.bump('ver', 1);
      if (global.State.sys) global.State.sys.verified++;

      this.last = res;
      await wait(260);
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

      const ok = res.ok;
      $('#vf-result').innerHTML =
        '<div class="vf-card ' + (ok ? 'ok' : 'no') + '">' +
        '<div class="vf-score"><b style="color:' + res.color + '">' + res.score + '</b>' +
        '<span>综合评分</span>' +
        '<em class="vf-seal" style="border-color:' + res.color + ';color:' + res.color + '">' + res.grade + '</em></div>' +
        '<div class="vf-bars">' +
        bar('逻辑自洽', res.dims.logic, '35%') +
        bar('AI 率（反）', res.dims.ai, '35%') +
        bar('记忆连贯', res.dims.coherence, '30%') +
        '</div>' +
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
      await global.G.Fade.through(() => {
        App.show('counter');
        global.Counter.init();
      });
    },
  };

  global.Ver = Ver;
})(window);
