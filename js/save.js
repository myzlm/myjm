/* ============================================================
   save.js — 上次的门票
   ------------------------------------------------------------
   这间店原先不记路：关掉页面，回来就得从邮件重新读起，
   下载那一条进度条，每次都得再看一遍。

   现在柜台替你留着一张票 —— 上面写着上次停在哪一屏。
   回来时先问一句，接着走就放回原来那一屏，不是从头站定。

   票要撕，得撕两下：第一下只是问一句，第二下才真撕。
   而且没有快捷键 —— 删档这种事不该有一个键。
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
    '第七章 · 门 外',
    '终章 · 回 响',
  ];

  /* 屏 → 说人话的名字（票上要印） */
  const SCR = {
    mail: '邮件',
    download: '下载页',
    login: '登录框',
    hall: '记忆殿',
    contract: '登记表',
    counter: '柜台',
    verify: '记忆核验',
    ledger: '账本',
    film: '胶片',
    scale: '天平',
    stash: '信匣',
    oil: '油灯',
    clock: '挂钟',
    scratch: '刻痕',
    anomaly: '异常',
    hands: '柜下木箱',
    pry: '保险箱',
    lock: '门锁',
    win98: '旧系统',
    print: '打印',
    rhythm: '节奏',
    layer: '走廊',
    root: '记录库',
    duty: '当班',
    street: '街',
    night: '守夜',
    space: '里间',
    moyun: '墨云',
    final: '终章',
    end: '结局',
  };

  /* 这几屏是柜台底下的东西：回来时站在柜台，不硬塞进谜题中间 */
  const TO_COUNTER = ['verify', 'ledger', 'film', 'scale', 'pry', 'lock',
    'win98', 'print', 'rhythm', 'oil', 'clock', 'scratch', 'anomaly', 'space'];

  const Save = {
    CH: CH,
    SCR: SCR,
    _t: 0,
    _stop: false,
    _armed: false,

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
        const scr = (global.App && global.App.current) || '';
        /* 还没进过任何一屏（开门动画、章节票）就别记，免得留一张空票 */
        if (!scr && ch < 1) return;
        if (!this._armed && ch < 1) return;
        localStorage.setItem(K, JSON.stringify({
          v: 2, ch: ch, scr: scr, at: Date.now(),
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
        if (!o || !o.state) return null;
        if (typeof o.ch !== 'number') o.ch = this.chapterOf(o.state);
        return o;
      } catch (e) { return null; }
    },

    clear() { try { localStorage.removeItem(K); } catch (e) {} },

    /* 这一局走到第几章 */
    chapterOf(S) {
      if (!S) return 0;
      const s = S.sys || {};
      if (s.ending) return 8;
      const st = (S.sys && S.sys.street) || null;
      if (st && st.end) return 8;
      if (S.ch7) return 7;
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
      if (S.dlDone) a.push('装好了');
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
      const inv = S.inv || {};
      const n2 = Object.keys(inv).length;
      if (n2) a.push('手上有 ' + n2 + ' 样东西');
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
        const ch = Math.min(7, Math.max(0, sv.ch));
        const scrName = SCR[sv.scr] || '';
        const draft = (sv.state && sv.state.sys && sv.state.sys.form) || {};
        const who = sv.name || draft.name || '';
        const d = document.createElement('div');
        d.className = 'rs';
        d.id = 'resume';
        d.innerHTML =
          '<div class="rs-paper">' +
          '  <div class="rs-stamp"><b>续</b></div>' +
          '  <div class="rs-t">上 次 的 门 票</div>' +
          '  <div class="rs-ch' + (CH[ch].length > 9 ? ' long' : '') + '">' + CH[ch] + '</div>' +
          (scrName ? '  <div class="rs-at">停在 · <b>' + scrName + '</b></div>' : '') +
          '  <div class="rs-meta">' + this.summary(sv.state) + '</div>' +
          '  <div class="rs-line"></div>' +
          '  <div class="rs-btns">' +
          '    <button class="rs-go" data-a="go">接 着 走</button>' +
          '    <button class="rs-new" data-a="new">重新开一间</button>' +
          '  </div>' +
          '  <div class="rs-warn" id="rs-warn"></div>' +
          '  <div class="rs-note">停在 ' + this.ago(sv.at) + '。' +
          (who ? '（那时你叫' + who + '。）' : '') +
          '<br>接着走，回原来那一屏；谜题里的进度还在原处。' +
          '<br>票一直留着，除非你自己撕掉（撕要两下）。</div>' +
          '</div>';
        document.body.appendChild(d);
        void d.offsetWidth;
        d.classList.add('on');

        let armed = 0;
        let warnT = 0;
        const warn = $('#rs-warn', d);

        const finish = (go) => {
          d.classList.remove('on');
          clearTimeout(warnT);
          setTimeout(() => { d.remove(); resolve(go); }, 420);
        };
        const pick = (go) => {
          document.removeEventListener('keydown', onKey, true);
          if (global.Snd) { try { global.Snd.init(); global.Snd.click(); } catch (err) {} }
          finish(go);
        };
        const onKey = (e) => {
          /* 只有 Enter / 空格是"接着走"。
             Esc 什么都不做 —— 删档不该有一个键。 */
          if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(true); }
          if (e.key === 'Escape') {
            e.preventDefault();
            if (global.Toast) global.Toast.show('票留着。要接着走，点「接着走」。', 2600);
          }
        };

        d.addEventListener('click', (e) => {
          const b = e.target.closest('[data-a]');
          if (!b) return;
          if (b.dataset.a === 'go') { pick(true); return; }
          /* 重新开一间：第一下只是问，第二下才撕 */
          if (!armed) {
            armed = Date.now();
            b.textContent = '真 的 撕 掉 ？';
            b.classList.add('armed');
            warn.innerHTML = '这一下会把你这一局的存档删干净：名字、钥匙、手上的东西、走过的路。<br>' +
              '删了找不回来。再点一下才删。';
            clearTimeout(warnT);
            warnT = setTimeout(() => {
              armed = 0;
              b.textContent = '重新开一间';
              b.classList.remove('armed');
              warn.innerHTML = '';
            }, 6000);
            return;
          }
          if (Date.now() - armed > 6000) { armed = 0; return; }
          pick('new');
        });
        document.addEventListener('keydown', onKey, true);
      });
    },

    /* ---------- 回到原来那一屏 ---------- */
    async resumeScreen(scr, ch) {
      const S = global.State;
      const show = (n) => global.App.show(n);

      if (TO_COUNTER.indexOf(scr) >= 0) {
        if (scr === 'space' && global.Space) { global.Space.open(); return true; }
        if (global.Counter) { global.Counter.inited = true; global.Counter.talked = true; global.Counter.introPlayed = true; }
        show('counter');
        if (global.Counter) global.Counter.init();
        if (global.Counter && global.Counter.refreshHud) global.Counter.refreshHud();
        if (global.Toast) global.Toast.show('上次停在「' + (SCR[scr] || '柜台') + '」。东西还在原处。', 3200);
        return true;
      }

      switch (scr) {
        case 'mail':
          show('mail');
          if (global.Mail) global.Mail.init();
          return true;

        case 'download':
          show('download');
          if (global.Download) { global.Download.init(); global.Download.restore(); }
          return true;

        case 'login':
          show('login');
          if (global.Login) global.Login.start();
          return true;

        case 'hall':
          show('hall');
          if (global.Hall) global.Hall.init();
          return true;

        case 'contract':
          show('contract');
          if (global.Contract) { global.Contract.init(); global.Contract.resumeForm(); }
          return true;

        case 'counter':
          if (global.Counter) { global.Counter.inited = true; global.Counter.talked = true; global.Counter.introPlayed = true; }
          show('counter');
          if (global.Counter) global.Counter.init();
          return true;

        case 'hands':
          show('hands');
          if (global.Hands) { global.Hands.from = 'counter'; global.Hands.start(); }
          return true;

        case 'stash':
          if (global.Press) { global.Press.open(); return true; }
          break;

        case 'layer':
          if (ch >= 4) { show('layer'); if (global.Layer) global.Layer.start(); return true; }
          break;

        case 'root':
          if (ch >= 5) { show('root'); if (global.Root) global.Root.start(); return true; }
          break;

        case 'duty':
          if (ch >= 6) { show('duty'); if (global.Duty) global.Duty.start(); return true; }
          break;

        case 'street':
          if (ch >= 7) { show('street'); if (global.Street) global.Street.start(); return true; }
          break;

        case 'night':
          if (global.Night && global.Night.can && global.Night.can()) {
            global.Night.start(true);
            return true;
          }
          break;

        case 'moyun':
          if (global.Moyun) { show('moyun'); global.Moyun.start('counter'); return true; }
          break;

        case 'final':
          if (ch >= 7) { show('final'); if (global.Final) global.Final.start(); return true; }
          break;

        case 'end':
          if (ch >= 8) { show('end'); if (global.End) global.End.show(); return true; }
          break;
      }
      void S;
      return false;
    },

    /* 按章回，是退路：屏对不上时用 */
    async byChapter(ch) {
      const S = global.State;
      if (ch <= 3) {
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
      } else if (ch === 7) {
        global.App.show('street');
        if (global.Street) global.Street.start();
      } else {
        global.App.show('final');
        if (global.Final) global.Final.start();
      }
    },

    /* ---------- 接着走：把 State 放回去，回到原来那一屏 ---------- */
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
      if (global.Fade) await global.Fade.on(true);

      let ok = false;
      try { ok = await this.resumeScreen(sv.scr || '', ch); } catch (e) { ok = false; }
      if (!ok) await this.byChapter(ch);

      if (global.Fade) await global.Fade.off(700);
      if (global.Toast) {
        const at = SCR[sv.scr];
        global.Toast.show(at ? ('接着上次的：' + at) : ('接着上次的：' + CH[ch]), 3600);
      }
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
      document.addEventListener('screenchange', () => { this._armed = true; this.write(); });
    },

    /* 新的周目：清票，不清收藏 */
    fresh() { this.clear(); this._stop = false; this._armed = false; },
  };

  global.Save = Save;
})(window);
