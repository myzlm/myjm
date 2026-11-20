/* ============================================================
   strata.js — 四层空间
   ------------------------------------------------------------
   你站的这间屋子，不是一层。
   从上往下：店面（你看得见的）／渲染层（墙是 div）／
             根目录（三十七行）／源码层（写出来的那个东西）

   每一层藏一个字。四个字连起来是一句话：无人认领。
   前三层用眼睛找，第四层得动手删——把盖住它的那块墙皮删掉。

   这一层不催你。它只是不打算解释自己。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, Toast } = global.G;

  const PASSWORD = '无人认领';

  const LAYERS = [
    {
      n: 1, key: 'shop', name: '店 面', ch: '无',
      at: '柜台。你摸得到的一切：灯、碗、抽屉、那台电脑。',
      hint: '看页面源码，#screen-counter 上面有一段注释。',
    },
    {
      n: 2, key: 'render', name: '渲 染 层', ch: '人',
      at: '墙是 div，影子是 clip-path。人也是。',
      hint: '按 Tab 打开检查器，展开 #screen-layer，翻注释节点。',
    },
    {
      n: 3, key: 'root', name: '根 目 录', ch: '认',
      at: '三十七行。一行没有名字。',
      hint: '终端里 ls /var/records，然后看第 37 行；或看 #screen-root 的注释。',
    },
    {
      n: 4, key: 'src', name: '源 码 层', ch: '领',
      at: '墙皮底下。三十五张写好的路引，一张空的。',
      hint: '在检查器里删掉 #screen-counter .cs-wall（或 display:none）。',
    },
  ];

  const Strata = {
    inited: false,
    _timer: 0,

    init() {
      if (this.inited) return;
      this.inited = true;
      const S = global.State;
      S.sys = S.sys || {};
      if (!S.sys.strata) S.sys.strata = { peel: false, chars: [], open: false };

      /* 每层都在 DOM 上留了 data-st，方便自检和"翻源码"的人对上 */
      $$('[data-st]').forEach((el) => {
        el.setAttribute('title', el.getAttribute('title') || '');
      });

      /* 揭开过一次，就记住：下次进来墙皮不再补上 */
      if (S.sys.strata.peel) this.applyPeel();

      /* 盯住那块墙皮：被删掉 / 被 display:none，都算揭开 */
      this._timer = setInterval(() => this.watch(), 900);
      document.addEventListener('screenchange', () => this.watch());

      /* 控制台里那一个入口：打开 F12，输入 __strata() */
      global.__strata = () => this.report(true);
    },

    state() {
      const S = global.State;
      S.sys = S.sys || {};
      if (!S.sys.strata) S.sys.strata = { peel: false, chars: [], open: false };
      return S.sys.strata;
    },

    applyPeel() {
      const w = document.querySelector('#screen-counter .cs-wall');
      if (w) w.style.display = 'none';
      const u = $('#strata-under');
      if (u) u.classList.add('on');
    },

    /* 墙皮还在不在 */
    wallGone() {
      const w = document.querySelector('#screen-counter .cs-wall');
      if (!w) return true;
      const cs = global.getComputedStyle(w);
      if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') return true;
      /* 屏幕本身没显示的时候量不出 offsetParent，别把它当成"墙没了" */
      const scr = document.querySelector('#screen-counter');
      if (!scr || !scr.classList.contains('active')) return false;
      return !w.offsetParent;
    },

    watch() {
      const st = this.state();
      if (st.peel) return;
      if (!this.wallGone()) return;
      st.peel = true;
      this.applyPeel();
      if (global.Snd) { try { global.Snd.noise(1.4, { type: 'lowpass', freq: 320, gain: 0.06 }); } catch (e) {} }
      if (global.G && global.G.Toast) global.G.Toast.show('墙皮后面还有一层。', 3600);
      if (global.Save && global.Save.touch) global.Save.touch();
      try { console.log('%c第四层 · 领\n%c三十五张写好了。第三十六张，空着。\n四个字：无 人 认 领。去终端里念一遍。',
        'color:#c9a45c', 'color:#7a6a52'); } catch (e) {}
    },

    /* 终端/控制台共用的一张表 */
    report(toConsole) {
      const st = this.state();
      const rows = LAYERS.map((L) => {
        const got = st.chars.indexOf(L.ch) >= 0 || (L.key === 'src' && st.peel);
        return L.n + '  ' + L.name + '　' + (got ? '[' + L.ch + ']' : '[ ]') + '　' + L.at;
      });
      const head = '四层空间 —— 你走到第几层';
      const tail = st.open
        ? '四个字已经念过了。它们认得你。'
        : (st.peel ? '四个字齐了。去终端里念：无人认领' : '第 4 层还没揭开。墙皮盖着它。');
      if (toConsole) {
        try {
          console.log('%c' + head, 'color:#c9a45c;font-size:13px');
          rows.forEach((r) => console.log('%c' + r, 'color:#8b7c63'));
          console.log('%c' + tail, 'color:#6f6350');
        } catch (e) {}
        return { rows, tail };
      }
      return { head, rows, tail };
    },

    /* 终端里念对了四个字 */
    open(src) {
      const st = this.state();
      if (st.open) {
        return { ok: true, again: true, text: '念过了。它认得你。' };
      }
      if (!st.peel) {
        return {
          ok: false,
          text: '字不全。第 4 个字在墙皮底下——把 #screen-counter 的 .cs-wall 删掉。',
        };
      }
      st.open = true;
      st.chars = LAYERS.map((L) => L.ch);
      const S = global.State;
      S.sys = S.sys || {};
      S.sys.strataOpen = true;
      if (global.Save && global.Save.write) global.Save.write();
      if (global.Snd) { try { global.Snd.tone(70, 2.6, { type: 'sine', gain: 0.06, attack: 0.7 }); } catch (e) {} }
      if (global.G && global.G.Toast) global.G.Toast.show('四个字。无人认领。', 4200);
      return {
        ok: true,
        text: [
          '（终端把光标停了一拍。）',
          '这一层没有别的命令了。',
          '三十七行里，三十六行有人在等；剩下那一行是给你留的。',
          '你写的每一个字，都在这页纸的下面。',
        ].join('\n'),
      };
    },

    /* 给档案册/册子/终章用 */
    isOpen() { return !!this.state().open; },
    isPeeled() { return !!this.state().peel; },
    chars() { return this.state().chars.slice(); },
    layers() { return LAYERS; },
    password() { return PASSWORD; },
  };

  global.Strata = Strata;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Strata.init());
  } else {
    Strata.init();
  }
})(window);
