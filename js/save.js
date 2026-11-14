/* ============================================================
   save.js — 上次的门票
   ------------------------------------------------------------
   这间店原先不记路：关掉页面，回来就得从邮件重新读起。
   现在柜台替你留着一张票 —— 上面写着上次走到第几章。

   只记"章节"和当时的样子，不记你正卡在哪一步。
   所以接着走，是从这一章的开头重新站定，不是从半句话中间。
   ============================================================ */
(function (global) {
  'use strict';

  const { $, wait } = global.G;

  const K = 'code_echo_save_v1';

  const CH = [
    '序章 · 登录地球 online',
    '第一章 · 邮 件',
    '第二章 · 抵 押',
    '第三章 · 他 说 的 话',
    '第四章 · 渲 染 层',
    '第五章 · 根 目 录',
    '第六章 · 收 摊',
    '终章 · 回 响',
  ];

  const Save = {
    CH: CH,
    _t: 0,
    _stop: false,

    /* ---------- 存 ---------- */
    write() {
      if (this._stop) return;
      const S = global.State;
      if (!S) return;
      try {
        const s = S.sys || {};
        /* 走到结局了：这一局结束，票收回去 */
        if (s.ending) { this.clear(); this._stop = true; return; }
        const ch = this.chapterOf(S);
        if (ch < 1) return;
        localStorage.setItem(K, JSON.stringify({
          v: 1, ch: ch, at: Date.now(),
          name: S.playerName || '',
          state: S,
        }));
        this._last = ch;
      } catch (e) {}
    },

    /* 解谜屏里每动一下就存太吵，1.5 秒一次够了 */
    touch() {
      const t = Date.now();
      if (t - (this._t || 0) < 1500) return;
      this._t = t;
      this.write();
    },

    read() {
      /* 调试/回归用的入口：?fresh=1 当作没有存档 */
      if (location.search.indexOf('fresh=1') >= 0) return null;
      try {
        const o = JSON.parse(localStorage.getItem(K) || 'null');
        if (!o || !o.state || !o.ch) return null;
        return o;
      } catch (e) { return null; }
    },

    clear() { try { localStorage.removeItem(K); } catch (e) {} },

    /* ---------- 这一局走到第几章 ---------- */
    chapterOf(S) {
      if (!S) return 0;
      const s = S.sys || {};
      if (s.ending) return 7;
      if (S.ch6 >= 1) return 6;
      if (S.ch5 >= 1) return 5;
      if (S.ch4 >= 1) return 4;
      if (S.ch2 >= 4) return 3;
      if (S.ch2 >= 1) return 2;
      if (S.gavePaper || S.printed || S.pcFixed) return 1;
      return 0;
    },

    /* ---------- 当时的样子 ---------- */
    summary(S) {
      const s = S.sys || {};
      const a = [];
      if (S.ch2 >= 4) {
        const q = { perfect: '完美', fine: '精良', plain: '普通', broken: '残破' }[S.keyQ] || '—';
        a.push('钥匙 ' + q);
        const n = Object.keys(S.proofs || {}).length;
        if (n) a.push('物证 ' + n + ' / 6');
        if (S.soulDone) a.push('叫魂过了');
      } else if (S.ch2 >= 1) {
        if (S.ledgerSolved) a.push('账本平了');
        if (S.filmSolved) a.push('胶片接回');
        if (S.ateFood) a.push('吃过一顿');
      } else {
        if (S.pcFixed) a.push('机器修好了');
        if (S.printed) a.push('档案打出来了');
      }
      if (S.ch5 >= 1) a.push('记录库翻到了第 36 行');
      if (s.duty && s.duty.picks && s.duty.picks.length) {
        a.push('办过 ' + s.duty.picks.length + ' 笔');
      }
      if ((s.endings || []).length) a.push('见过 ' + s.endings.length + ' 个结局');
      return a.join(' · ') || '空着手';
    },

    ago(t) {
      const d = Math.max(0, Date.now() - (t || 0)) / 1000;
      if (d < 90) return '刚刚';
      if (d < 3600) return Math.round(d / 60) + ' 分钟前';
      if (d < 86400) return Math.round(d / 3600) + ' 小时前';
      return Math.round(d / 86400) + ' 天前';
    },

    /* ---------- 那张票 ---------- */
    prompt(sv) {
      return new Promise((resolve) => {
        const ch = Math.min(7, Math.max(1, sv.ch));
        const d = document.createElement('div');
        d.className = 'rs';
        d.id = 'resume';
        d.innerHTML =
          '<div class="rs-paper">' +
          '  <div class="rs-stamp"><b>续</b></div>' +
          '  <div class="rs-t">上 次 的 门 票</div>' +
          '  <div class="rs-ch">' + CH[ch] + '</div>' +
          '  <div class="rs-meta">' + this.summary(sv.state) + '</div>' +
          '  <div class="rs-line"></div>' +
          '  <div class="rs-btns">' +
          '    <button class="rs-go" data-a="go">接 着 走</button>' +
          '    <button class="rs-new" data-a="new">重新开一间</button>' +
          '  </div>' +
          '  <div class="rs-note">停在 ' + this.ago(sv.at) + '。' +
          (sv.name ? '（那时你叫' + sv.name + '。）' : '') +
          '<br>接着走，是从这一章的开头重新站定——不是从半句话中间。' +
          '<br>不接着走，彩蛋、结局、票根也还在。</div>' +
          '</div>';
        document.body.appendChild(d);
        void d.offsetWidth;
        d.classList.add('on');

        const finish = (go) => {
          d.classList.remove('on');
          setTimeout(() => { d.remove(); resolve(go); }, 420);
        };
        const onKey = (e) => {
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(true); }
          else if (e.key === 'Escape') { e.preventDefault(); pick(false); }
        };
        const pick = (go) => {
          document.removeEventListener('keydown', onKey, true);
          if (global.Snd) { try { global.Snd.init(); global.Snd.click(); } catch (err) {} }
          finish(go);
        };
        document.addEventListener('keydown', onKey, true);
        d.addEventListener('click', (e) => {
          const b = e.target.closest('[data-a]');
          if (!b) return;
          pick(b.dataset.a === 'go');
        });
      });
    },

    /* ---------- 接着走：把 State 放回去，从这一章开头站定 ---------- */
    async enter(sv) {
      const S = global.State;
      const saved = sv.state || {};
      /* 深一层合并：sys 里的东西要留下（彩蛋、结局、票根之外的记录） */
      Object.keys(saved).forEach((k) => {
        if (k === 'sys') return;
        S[k] = saved[k];
      });
      S.sys = Object.assign({}, S.sys || {}, saved.sys || {});
      S.sys.pendingTalk = null;

      const ch = this.chapterOf(S);
      const G = global.G;
      if (global.Fade) await global.Fade.on(true);

      if (ch <= 3) {
        /* 柜台：把开场当成已经说过了 */
        if (ch >= 2) S.ch2 = Math.max(1, S.ch2 || 1);
        if (global.Counter) { global.Counter.inited = true; global.Counter.talked = true; global.Counter.introPlayed = true; }
        global.App.show('counter');
        if (global.Counter) global.Counter.init();
      } else if (ch === 4) {
        global.App.show('layer');
        if (global.Layer) global.Layer.start();
      } else if (ch === 5) {
        global.App.show('root');
        if (global.Root) global.Root.start();
      } else if (ch === 6) {
        global.App.show('duty');
        if (global.Duty) global.Duty.start();
      } else {
        global.App.show('final');
        if (global.Final) global.Final.start();
      }

      if (global.Fade) await global.Fade.off(700);
      if (global.Toast) global.Toast.show('接着上次的：' + CH[ch], 3600);
      return ch;
    },

    /* ---------- 自己盯着存 ---------- */
    boot() {
      this._stop = false;
      clearInterval(this._t);
      this._t = setInterval(() => this.write(), 6000);
      document.addEventListener('visibilitychange', () => { if (document.hidden) this.write(); });
      window.addEventListener('beforeunload', () => this.write());
      /* 章节一换就落一次，别等那六秒 */
      document.addEventListener('screenchange', () => this.write());
    },

    /* 新的周目：清票，不清收藏 */
    fresh() { this.clear(); this._stop = false; },
  };

  global.Save = Save;
})(window);
