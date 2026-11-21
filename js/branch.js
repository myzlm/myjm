/* ============================================================
   branch.js — 岔口
   ------------------------------------------------------------
   之前店里只有一种走法：看见什么，点一下，听他说完。
   点完就没有第二条路了。

   现在多两样东西：

   一、手里拿着的东西，能用在别的东西上。
       拿着什么，就看到什么。用得对，开一条路；用错了，
       他不拦你 —— 他只是不接话。

   二、柜台可以换一只眼睛看。
       活人的眼睛看人，纸的眼睛看名字。
       同一间屋子，两套东西；两套东西加起来，才是一间屋子。
   ============================================================ */
(function (global) {
  'use strict';

  const { $, $$, wait } = global.G;
  const S = () => global.State;
  const sy = () => (S().sys = S().sys || {});

  /* 店里的短句：不抢对白，只顶一行独白 */
  function narr(text, dur) {
    const C = global.Counter;
    if (C && C.say && (!global.Dlg || !global.Dlg.active)) { C.say(text, dur || 4200); return; }
    if (global.Dlg) global.Dlg.say('旁白', [text]);
  }

  function got(id, name) {
    const C = global.Counter;
    if (C && C.addItem) C.addItem(id, name);
    else { S().inv = S().inv || {}; S().inv[id] = name; }
    if (global.Save) global.Save.touch();
    if (global.G.Toast) global.G.Toast.show('拿到了：' + name, 2200);
  }

  /* ============================================================
     一、持物
     ============================================================ */

  /* 三样能捡的小东西。都不是钥匙，都是"再想一步"的东西。 */
  const PICK = {
    ash: '一撮纸灰',
    brass: '一块铜片',
    nail: '一枚锈钉',
  };

  /* 用错的时候，他那一句。不解释，只让人知道用错了。 */
  const WRONG = {
    ash: '（灰撒下去就散了。他没有躲。）',
    brass: '（铜片搁上去，凉的。没有东西认得它。）',
    nail: '（钉子尖对着它，找不到地方扎。）',
    uv: '（紫光照过去，什么也没有浮出来。）',
    crowbar: '（撬棍举起来，又放下了。不是这里。）',
    punch: '（纸卡插不进去。这里没有缝。）',
    key: '（钥匙在手里。它不是用来开这个的。）',
    book: '（册子翻开来，里面全是别人的字。）',
  };

  /* 组合表：key 是热点名，跟 scene-counter 里那套一致 */
  const USES = {
    ash: {
      'om-bowl': {
        once: 'u_ashBowl',
        run() {
          sy().halfName = '守';
          sy().ashBowl = 1;
          narr('（你把纸灰倒在碗里。灰没有沉下去。）\n'
            + '（它浮在水面上，散成两笔。一笔是「守」，一笔断了。）');
          if (global.Snd) global.Snd.tone(660, 0.7, { type: 'sine', gain: 0.03 });
        },
      },
      'cs-npc': {
        once: 'u_ashNpc',
        run() {
          sy().ashTold = 1;
          narr('（你把灰撒在他面前。他没躲，只是咳了一声。）\n'
            + '「这个味道我认得。是我自己的。」\n'
            + '（他抬起眼看你。）「你想问的，不是这个。」');
          if (global.Snd) global.Snd.noise(0.4, { type: 'highpass', freq: 2000, gain: 0.05 });
        },
      },
    },

    brass: {
      'om-clock': {
        once: 'u_brassClock',
        run() {
          sy().clockMoved = 1;
          narr('（你把铜片塞进钟背那道缺口。严丝合缝。）\n'
            + '（秒针抖了一下，然后走了。三点十三，走到三点十四。）\n'
            + '（灯芯矮了一截。这间屋子的时间，是从灯里借的。）');
          const lamp = $('#om-lamp');
          if (lamp) lamp.classList.add('low');
          if (global.Snd) { global.Snd.tone(320, 0.4, { type: 'triangle', gain: 0.04 }); }
        },
      },
      'om-lamp': {
        once: 'u_brassLamp',
        run() {
          narr('（铜片在火上烧红了。你捏着它，指尖烫了一下。）\n（他伸手把铜片接过去，放进抽屉。「留着。会有人来认。」）');
          if (global.Snd) global.Snd.tone(880, 0.3, { type: 'sine', gain: 0.03 });
        },
      },
    },

    nail: {
      'om-joss': {
        once: 'u_nailJoss',
        run() {
          if (S().inv.punch) { narr('（黄纸上已经扎过了。）'); return; }
          sy().punched = 1;
          got('punch', '打孔的黄纸');
          narr('（你把锈钉扎进黄纸。一下，两下——七下。）\n'
            + '（七个孔排成一行，间距一样。这不是纸钱，是一张卡。）');
          if (global.Snd) global.Snd.noise(0.12, { type: 'bandpass', freq: 1800, q: 2, gain: 0.07 });
        },
      },
      'cs-npc': {
        once: 'u_nailNpc',
        run() {
          sy().pricked = 1;
          sy().hurt = (sy().hurt || 0) + 1;
          S().sys.mercy = false;
          narr('（钉子扎进他的手背。他没有缩。）\n'
            + '（拔出来的时候，针眼上没有血，渗出来一点墨。）\n'
            + '「你试吧。」他说，「我这儿的东西，都是别人的。」');
          if (global.Snd) global.Snd.tone(140, 0.5, { type: 'sawtooth', gain: 0.05 });
        },
      },
    },

    punch: {
      'pc-monitor': {
        once: 'u_punchPC',
        need: () => S().pcFixed,
        no: '（屏幕是黑的。得先让机器醒过来。）',
        run() {
          sy().record7 = 1;
          narr('（你把打孔的黄纸举到屏幕前。屏幕闪了一下，闪出一行字：）\n'
            + '（工号 007　在岗 11 小时 47 分　本月第 26 天）\n'
            + '（下面还有一行，被磨掉了。只看得见最后一个字：停。）');
          if (global.Snd) global.Snd.ok();
        },
      },
    },

    uv: {
      'om-cal': {
        once: 'u_uvCal',
        run() {
          sy().calUV = 1;
          narr('（紫光扫过黄历。红圈下面浮出第二层字，很小：）\n'
            + '（「十五。她自己写的。」）\n'
            + '（圈不是别人圈的。是她自己圈的。）');
          if (global.Snd) global.Snd.tone(1200, 0.5, { type: 'sine', gain: 0.025 });
        },
      },
    },

    crowbar: {
      'cs-door': {
        once: 'u_crowDoor',
        need: () => S().ch2 >= 3,
        no: '（门还没到能撬的时候。他也不会让你撬。）',
        run() {
          sy().doorBroken = 1;
          narr('（你把撬棍插进门缝。木头裂开的声音，比你想的轻。）\n'
            + '（门开了。锁舌掉在地上，摔成两半。）\n'
            + '「锁坏了。」他说，没有生气，「以后这扇门，谁都能进。」');
          S().doorOpened = true;
          S().ch2 = 5;
          if (global.Snd) global.Snd.noise(0.5, { type: 'bandpass', freq: 400, q: 1.2, gain: 0.1 });
        },
      },
      'om-seam': {
        once: 'u_crowSeam',
        run() {
          narr('（你把撬棍塞进地板缝。木头一翘，缝里那点黑更深了。）\n（——这块地板下面，不止一层。）');
          simSeam();
        },
      },
    },
  };

  /* 拿着东西时，只有这几处要交回老逻辑：
     撬棍点机箱本来就能撬开，不能被一句「用不上」吃掉。 */
  const EXEMPT = {
    crowbar: ['pc-case'],
  };

  /* 撬地板：跟 om-seam 原本那段一样，只是从这儿也能进去 */
  function simSeam() {
    if (sy().scratch) { narr('（暗格开着。铜片还在里面。）'); return; }
    if (global.Fade) global.Fade.through(() => { global.App.show('scratch'); global.Scratch.start(); });
  }

  const Carry = {
    /* 手上那件东西的名字（给提示行用） */
    heldName() {
      const id = S().selectedItem;
      if (!id) return '';
      const inv = S().inv || {};
      return inv[id] || PICK[id] || id;
    },

    give(id) {
      const name = PICK[id] || id;
      const inv = S().inv || (S().inv = {});
      if (inv[id]) return false;
      got(id, name);
      return true;
    },

    /* 拿着东西点东西。返回 true = 这一次点击归它管 */
    tryUse(target) {
      const id = S().selectedItem;
      if (!id) return false;
      const exemptions = EXEMPT[id] || [];
      const row = USES[id] && USES[id][target];
      const w = WRONG[id] || '（用不上。）';

      if (!row) {
        /* 老逻辑优先的那一两个地方，交回去 */
        if (exemptions.indexOf(target) >= 0) return false;
        /* 用错了也有回响；东西放回包里，不把人卡在这儿 */
        narr(w, 2600);
        if (global.Snd) global.Snd.deny();
        this.drop();
        return true;
      }
      if (row.need && !row.need()) {
        narr(row.no || w, 3000);
        if (global.Snd) global.Snd.deny();
        this.drop();
        return true;
      }
      sy().used = sy().used || {};
      if (row.once && sy().used[row.once]) {
        narr('（已经用过了。）', 2200);
        this.drop();
        return true;
      }
      if (row.once) sy().used[row.once] = 1;
      row.run();
      /* 用掉的就从手上放下 —— 但东西还在包里 */
      this.drop();
      if (global.Save) global.Save.touch();
      if (global.Ach) { try { global.Ach.scan(); } catch (e) {} }
      return true;
    },

    /* 放下：手上空了，包里还在 */
    drop() {
      S().selectedItem = null;
      $$('.inv-item').forEach((n) => n.classList.remove('sel'));
      if (global.Counter) { try { global.Counter.updateHint(); } catch (e) {} }
    },

    /* 每开一屏，手上那把东西也跟着走 */
    syncSel() {
      const id = S().selectedItem;
      $$('.inv-item').forEach((n) => n.classList.toggle('sel', n.dataset.id === id));
    },
  };

  /* ============================================================
     二、纸的眼睛
     ------------------------------------------------------------
     活人看见的是"他"。纸看见的是"名"。
     这间屋子里的东西，一半是给人看的，一半是给纸看的。
     ============================================================ */

  const PaperEye = {
    on: false,

    init() {
      if (this._bound) return;
      this._bound = true;
      const btn = $('#pp-toggle');
      if (btn) btn.addEventListener('click', (e) => { e.stopPropagation(); this.toggle(); });

      const spots = [
        ['pp-name', 'name'],
        ['pp-wall', 'wall'],
        ['pp-under', 'under'],
        ['pp-self', 'self'],
      ];
      spots.forEach(([id, key]) => {
        const el = $('#' + id);
        if (el) el.addEventListener('click', (e) => { e.stopPropagation(); this.watch(key); });
      });

      /* P 换眼。人在柜台才管用。 */
      document.addEventListener('keydown', (e) => {
        if (!global.App || global.App.current !== 'counter') return;
        if (global.G.typing(e.target)) return;
        if (global.Dlg && global.Dlg.active) return;
        if (e.key === 'e' || e.key === 'E') { e.preventDefault(); this.toggle(); }
      });
    },

    toggle() {
      if (!global.App || global.App.current !== 'counter') return;
      this.on = !this.on;
      this.paint();
      sy().perspPaper = (sy().perspPaper || 0) + 1;
      if (global.Snd) {
        if (this.on) global.Snd.tone(240, 0.6, { type: 'sine', gain: 0.035, to: 150 });
        else global.Snd.tone(150, 0.5, { type: 'sine', gain: 0.035, to: 260 });
      }
      if (this.on) {
        narr('（你把眼睛闭了一下，再睁开。）\n（屋里没有变暗。是变薄了。）', 3600);
      }
      if (global.Save) global.Save.touch();
    },

    paint() {
      const cs = $('#counter-scene');
      if (cs) cs.classList.toggle('paper-view', this.on);
      const btn = $('#pp-toggle');
      if (btn) btn.classList.toggle('on', this.on);
    },

    /* 换屏之后要重新贴一次 */
    refresh() {
      this.paint();
    },

    watch(key) {
      const sy0 = sy();
      const seen = sy0.paper = sy0.paper || {};
      const el = $('#pp-' + key);
      if (el) el.classList.add('seen');

      if (key === 'name') {
        narr('（纸看人，先看名字。三十五个名字都在，浮在各自的头顶上，淡得像水印。）\n'
          + '（他头顶那一块是空的。空的边缘还在往里缩。）', 6200);
        seen.name = 1;
      } else if (key === 'wall') {
        narr('（墙是活的。里面有东西在数数。）\n'
          + '（哒。哒哒。数到第三十六下，停了。）\n'
          + '（第三十七下没有来。它在等一个人替它数。）', 7000);
        seen.wall = 1;
        sy0.heardWall = (sy0.heardWall || 0) + 1;
      } else if (key === 'under') {
        narr('（柜台底下压着一张纸。人弯下腰看不见，纸看得见。）\n'
          + '（第三十六张。上面已经写好了字，只是墨还没干：）\n'
          + '（「押品：身。赎期：不赎。」）', 7200);
        seen.under = 1;
        sy0.saw36 = 1;
      } else if (key === 'self') {
        narr('（你低头看自己。）\n'
          + '（你头顶上也有字。不是名字——是号。）\n'
          + '（三十六。）', 6200);
        seen.self = 1;
      }

      if (global.Snd) global.Snd.tone(300, 0.5, { type: 'sine', gain: 0.028 });
      if (seen.name && seen.wall && seen.under && seen.self && !sy0.paperAll) {
        sy0.paperAll = 1;
        setTimeout(() => {
          narr('（四处都看过了。你现在知道这间屋子的另一半是怎么摆的了。）', 4200);
        }, 300);
      }
      if (global.Save) global.Save.touch();
      if (global.Ach) { try { global.Ach.scan(); } catch (e) {} }
    },
  };

  /* ============================================================
     三、露出来的接口
     ============================================================ */
  global.Carry = Carry;
  global.PaperEye = PaperEye;
  global.BRANCH = { PICK: PICK, USES: USES, WRONG: WRONG };

  /* 柜台一开，按钮和纸眼就位 */
  document.addEventListener('screenchange', () => {
    if (!global.App || global.App.current !== 'counter') {
      if (PaperEye.on) { PaperEye.on = false; PaperEye.paint(); }
      return;
    }
    PaperEye.init();
    PaperEye.refresh();
    Carry.syncSel();
  });
})(window);
