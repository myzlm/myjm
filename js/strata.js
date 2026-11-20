/* ============================================================
   strata.js — 五层空间
   ------------------------------------------------------------
   你站的这间屋子，不是一层。

     0  地 球 层   你坐着的地方。灯开着。（这一层没有源码）
     1  店    面   你看得见的：灯、碗、抽屉、那台电脑。
     2  渲 染 层   墙是 div，影子是 clip-path。人也是。
     3  根 目 录   三十七行。一行没有名字。
     4  源 码 层   写出来的那个东西。它被一块墙皮盖着。

   一至四层各藏一个字：无 人 认 领。
   头两个在页面源码里，你翻得见；
   第三个在 /var/records/37，得去终端里读；
   第四个得动手删——把盖住它的那块墙皮删掉。

   第 0 层不藏字。它藏的是你。
   这一层不催你。它只是不打算解释自己。
   ============================================================ */
(function (global) {
  'use strict';
  const { $ } = global.G;

  const PASSWORD = '无人认领';

  const LAYERS = [
    {
      n: 0, key: 'earth', name: '地 球 层', ch: '你', outer: true,
      at: '你坐着的地方。灯亮着，桌上有杯水，杯壁上结了水汽。',
      hint: '不用找。这一层没有源码，也没有注释——你正站在上面。',
    },
    {
      n: 1, key: 'shop', name: '店    面', ch: '无',
      at: '柜台。你摸得到的一切：灯、碗、抽屉、那台电脑。',
      hint: '看页面源码，#screen-counter 上面有一段注释。',
    },
    {
      n: 2, key: 'render', name: '渲 染 层', ch: '人',
      at: '墙是 div，影子是 clip-path。人也是。',
      hint: '按 F12 打开检查器，展开 #screen-layer，翻注释节点。',
    },
    {
      n: 3, key: 'root', name: '根 目 录', ch: '认',
      at: '三十七行。一行没有名字，认领栏空着。',
      hint: '终端里 ls /var/records，然后 cat /var/records/37。',
    },
    {
      n: 4, key: 'src', name: '源 码 层', ch: '领',
      at: '墙皮底下。三十五张写好的路引，一张空的。',
      hint: '在检查器里删掉 #screen-counter .cs-wall（或给它 display:none）。',
    },
  ];

  const PASSWORD_LAYERS = LAYERS.filter((L) => !L.outer);

  const Strata = {
    inited: false,
    _timer: 0,

    init() {
      if (this.inited) return;
      this.inited = true;
      const st = this.state();
      /* 旧存档里没有 rootRead：已经念过四个字的，第三个字当然读过了 */
      if (st.open) st.rootRead = true;

      /* 揭开过一次，就记住：下次进来墙皮不再补上 */
      if (st.peel) this.applyPeel();

      /* 盯住那块墙皮：被删掉 / 被 display:none，都算揭开 */
      this._timer = setInterval(() => this.watch(), 900);
      document.addEventListener('screenchange', () => this.watch());

      /* 控制台里那一个入口：打开 F12，输入 __strata() */
      global.__strata = () => this.report(true);
    },

    state() {
      const S = global.State;
      S.sys = S.sys || {};
      if (!S.sys.strata) S.sys.strata = { peel: false, rootRead: false, chars: [], open: false };
      const st = S.sys.strata;
      if (st.rootRead == null) st.rootRead = !!st.open;
      return st;
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
      try {
        console.log('%c第四层 · 领\n%c三十五张写好了。第三十六张，空着。\n四个字：无 人 认 领。去终端里念一遍。',
          'color:#c9a45c', 'color:#7a6a52');
      } catch (e) {}
    },

    /* 第三个字：/var/records/37 被读了一次。
       「认」不在页面上，也不在墙皮底下——它在一行没有名字的记录里，
       押品那一栏写着：认。 */
    markRoot(src) {
      const st = this.state();
      if (st.rootRead) return false;
      st.rootRead = true;
      if (global.Snd) { try { global.Snd.tone(196, 1.8, { type: 'sine', gain: 0.05, attack: 0.5 }); } catch (e) {} }
      if (global.G && global.G.Toast) global.G.Toast.show('第 37 行 · 认', 3600);
      if (global.Save && global.Save.touch) global.Save.touch();
      try {
        console.log('%c第三层 · 认\n%c第三十六行有人在等。第三十七行在等一个签名。\n押品那一栏写着：认。\n四个字还差一个。最后一个在墙皮底下。',
          'color:#c9a45c', 'color:#7a6a52');
      } catch (e) {}
      return true;
    },

    /* 终端/控制台共用的一张表 */
    report(toConsole) {
      const st = this.state();
      const got = (L) => {
        if (L.outer) return '[' + L.ch + ']';        /* 你，不用找 */
        if (L.key === 'root') return st.rootRead ? '[认]' : '[ ]';
        if (L.key === 'src') return st.peel ? '[领]' : '[ ]';
        return '[' + L.ch + ']';                     /* 源码里写着，翻得见 */
      };
      const rows = LAYERS.map((L) => L.n + '  ' + L.name + '　' + got(L) + '　' + L.at);

      let tail;
      if (st.open) tail = '四个字已经念过了。它们认得你。第五层不用找——你正站在上面。';
      else if (!st.peel) tail = '第 4 个字还盖在墙皮底下。（检查器里删 #screen-counter .cs-wall）';
      else if (!st.rootRead) tail = '第 3 个字在 /var/records/37。那一行没有名字，认领栏空着。';
      else tail = '四个字齐了。去终端里念：无人认领';

      if (toConsole) {
        try {
          console.log('%c五层空间 —— 你走到第几层', 'color:#c9a45c;font-size:13px');
          rows.forEach((r) => console.log('%c' + r, 'color:#8b7c63'));
          console.log('%c' + tail, 'color:#6f6350');
        } catch (e) {}
        return { rows, tail };
      }
      return { head: '五层空间 —— 你走到第几层', rows, tail };
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
      if (!st.rootRead) {
        return {
          ok: false,
          text: '字不全。第 3 个字在 /var/records/37 里。\n（那一行没有名字。cat 一下。）',
        };
      }
      st.open = true;
      st.rootRead = true;
      st.chars = PASSWORD_LAYERS.map((L) => L.ch);
      const S = global.State;
      S.sys = S.sys || {};
      S.sys.strataOpen = true;
      if (global.Save && global.Save.write) global.Save.write();
      if (global.Snd) { try { global.Snd.tone(70, 2.6, { type: 'sine', gain: 0.06, attack: 0.7 }); } catch (e) {} }
      if (global.G && global.G.Toast) global.G.Toast.show('四个字。无人认领。', 4200);
      try {
        console.log('%c无人认领\n%c第 37 行亮了。它有了一个名字。\n%c第 0 层不在这四个字里——它在你坐的地方。',
          'color:#c9a45c;font-size:13px', 'color:#8b7c63', 'color:#6f6350');
      } catch (e) {}
      return {
        ok: true,
        text: [
          '（终端把光标停了一拍。）',
          '这一层没有别的命令了。',
          '三十七行里，三十六行有人在等；剩下那一行是给你留的。',
          '你写的每一个字，都在这页纸的下面。',
          '',
          '还有第五层。它不在这四个字里——',
          '它在你坐的地方。灯亮着，桌上有杯水。',
        ].join('\n'),
      };
    },

    /* 给档案册/册子/终章用 */
    isOpen() { return !!this.state().open; },
    isPeeled() { return !!this.state().peel; },
    isRootRead() { return !!this.state().rootRead; },
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
