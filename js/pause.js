/* ============================================================
   pause.js — 先 放 着
   ------------------------------------------------------------
   有几处屏进去就走不开：保险箱、胶片、天平、旧系统桌面。
   卡住了以前只能刷新页面 —— 一刷新，这一章就得从头站定，
   手里做过的东西全没了。

   这里给它们一个共同的出口：右下角一个「先放着」，或者 Esc。
   走的时候不刷新、不重置，东西留在原处。回来接着做。

   Esc 同时接到了各屏自己的返回按钮上：
   凡是能走的屏，Esc 都能走；走不了的屏，按了会说一句为什么。

   —— 致敬《The Stanley Parable》那把"其实一直存在"的门：
      出口不新开，只是让原本就在那儿的按钮，被看见。
   ============================================================ */
(function (global) {
  'use strict';

  const { $, Toast } = global.G;

  /* 四处没有自己的出口：给一个 */
  const PAUSE = {
    pry:   { to: 'counter', tip: '保险箱留在柜台上。回来还在这儿。' },
    film:  { to: 'counter', tip: '胶片摊在台面上，一段也没动。' },
    scale: { to: 'counter', tip: '天平停在这儿，砝码没挪。' },
    win98: { to: 'counter', tip: '窗口开着。风不会把它吹关。' },
  };

  /* 已经有返回按钮的屏：Esc 直接按那个按钮，不用记两个键 */
  const BACK = {
    verify: '#vf-back',
    ledger: '#lg-back',
    stash: '#ps-back',
    rhythm: '#rh-escape',
    oil: '#oil-back',
    clock: '#cl-back',
    scratch: '#kh-back',
    anomaly: '#an-back',
    moyun: '#my-back',
  };

  /* 街上有自己的退法：站里退回街，街上退回柜台 */
  const SPECIAL = {
    street: () => { if (global.Street && global.Street.escBack) global.Street.escBack(); },
  };

  /* 中途真走不开的：按了 Esc 得有一句话，别让人以为键盘坏了 */
  const STUCK = {
    lock: '门锁着。解开了才出得去。',
    login: '正在登录。等它转完。',
    layer: '这条走廊不让人回头。',
    root: '记录库只进不出 —— 从下面那道缝走。',
    soul: '门外有人。现在别动。',
    print: '纸正在出来。等它出来。',
    final: '最后一步了。',
    mail: '先把信读完。',
    download: '正在装。',
  };

  const Pause = {
    _busy: false,
    _el: null,

    init() {
      if (this._el) return;

      const b = document.createElement('button');
      b.id = 'pause-b';
      b.className = 'pause-b';
      b.type = 'button';
      b.innerHTML = '<span>先 放 着</span><i>Esc</i>';
      b.addEventListener('click', (e) => { e.stopPropagation(); this.leave(); });
      document.body.appendChild(b);
      this._el = b;

      document.addEventListener('screenchange', () => this.sync());

      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Escape') return;
        if (e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
        if (this.blocked()) return;

        const cur = (global.App && global.App.current) || '';
        if (SPECIAL[cur]) { e.preventDefault(); SPECIAL[cur](); return; }
        if (PAUSE[cur]) { e.preventDefault(); this.leave(); return; }
        if (BACK[cur]) {
          const btn = $(BACK[cur]);
          if (btn) { e.preventDefault(); btn.click(); }
          return;
        }
        if (STUCK[cur]) {
          e.preventDefault();
          Toast.show(STUCK[cur], 2400);
        }
      });

      this.sync();
    },

    /* 覆盖层开着的时候，Esc 归它们管（便条 / 档案册 / 对话 / 剪贴 / 控制台） */
    blocked() {
      if (global.Notes && global.Notes.on) return true;
      if (global.Archive && global.Archive.open) return true;
      if (global.Dlg && global.Dlg.active) return true;
      if (global.Clips && global.Clips.el && global.Clips.el.classList.contains('on')) return true;
      if (global.Dev && global.Dev.on) return true;
      return false;
    },

    can() { return !!(global.App && PAUSE[global.App.current]); },

    sync() {
      if (!this._el) return;
      this._el.classList.toggle('on', this.can());
    },

    leave() {
      if (this._busy) return;
      const cur = (global.App && global.App.current) || '';
      const cfg = PAUSE[cur];
      if (!cfg) return;
      this._busy = true;

      /* 手还按在角上：先松开，否则计时器会跟着你走 */
      try { if (global.Pry && global.Pry.stopHold) global.Pry.stopHold(); } catch (e) {}
      /* 画面收一下，别让上一屏的动画在后台空转 */
      try { if (global.Film && global.Film.sel !== undefined) global.Film.sel = -1; } catch (e) {}
      try { if (global.Print && global.Print.stop) global.Print.stop(); } catch (e) {}

      const go = () => {
        global.App.show(cfg.to);
        if (global.Counter) {
          global.Counter.init();
          if (global.Counter.refreshHud) global.Counter.refreshHud();
          if (global.Counter.updateHint) global.Counter.updateHint();
        }
        Toast.show(cfg.tip, 3200);
        /* 顺手把这一下写进存档：关了页面再回来，也还站在这一章 */
        setTimeout(() => { try { if (global.Save) global.Save.write(); } catch (e) {} }, 260);
        this._busy = false;
      };

      const f = global.Fade;
      if (f && f.through) f.through(go); else go();
    },
  };

  global.Pause = Pause;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Pause.init());
  } else {
    Pause.init();
  }
})(window);
