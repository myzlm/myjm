/* ============================================================
   scene-counter.js — 柜台：艾 / 柜子 / 抽屉 / 电脑 / 门
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Fade, Toast } = global.G;

  const Counter = {
    inited: false,
    busy: false,
    talked: false,      // 是否已经走过开场对话
    introPlayed: false,

    init() {
      if (!this.inited) {
        this.inited = true;
        this.bind();
        this.buildInventory();
      }
      $('#cs-dialogue').classList.remove('on');
      $('#cs-dialogue').textContent = '';

      if (State.pcFixed) {
        $('#pc-screen').classList.add('on');
        $('#case-led').classList.add('on');
      } else {
        $('#pc-screen').classList.remove('on');
        $('#case-led').classList.remove('on');
      }

      // 第二章的可交互物
      $('#cs-drawer').classList.toggle('on', State.ch2 >= 1);
      $('#cs-door').classList.toggle('on', State.ch2 >= 3);
      $('#cs-door').classList.toggle('open', State.ch2 >= 4);
      if (State.ch2 >= 1) this.addItem('book', '证物 · 一本册子');
      this.refreshHud();
      this.updateHint();

      if (!this.introPlayed) {
        this.introPlayed = true;
        this.intro();
      } else {
        this.autoTalk();
      }
    },

    /* 从里间回来，他有时候已经先开口了 */
    autoTalk() {
      const s = (State && State.sys) || null;
      if (!s || !s.pendingTalk) return;
      const id = s.pendingTalk;
      s.pendingTalk = null;
      s.told = s.told || {};
      if (s.told[id]) return;
      s.told[id] = true;
      setTimeout(() => {
        if (Dlg.active) return;
        if (!App.isCurrent('counter')) return;
        this.talked = true;
        Dlg.open(id);
        if (global.Sys) global.Sys.talk('ai');
        this.updateHint();
      }, 1100);
    },

    bind() {
      // 掌柜
      $('#cs-npc').addEventListener('click', (e) => { e.stopPropagation(); this.talk(); });

      // 柜子
      $('#hs-cabinet').addEventListener('click', () => this.clickCabinet());

      // 撬棍
      const cb = $('#pc-crowbar');
      if (cb) cb.addEventListener('click', (e) => { e.stopPropagation(); this.takeCrowbar(); });

      // 电脑：屏幕 / 机箱
      $('#pc-case').addEventListener('click', (e) => { e.stopPropagation(); this.clickCase(); });
      $('#pc-monitor').addEventListener('click', (e) => { e.stopPropagation(); this.clickPC(); });

      // 抽屉 / 门
      $('#cs-drawer').addEventListener('click', (e) => { e.stopPropagation(); this.clickDrawer(); });
      $('#cs-door').addEventListener('click', (e) => { e.stopPropagation(); this.clickDoor(); });

      // 店里的器物
      ['lamp', 'bowl', 'joss', 'cal', 'under', 'oil', 'clock', 'seam'].forEach((k) => {
        const el = $('#om-' + k);
        if (el) el.addEventListener('click', (e) => { e.stopPropagation(); this.clickOmen(k); });
      });

      // 油添过了，灯就一直在亮，回来也认得出
      if (global.State && global.State.sys && global.State.sys.oil) {
        const lamp = $('#om-lamp');
        if (lamp) lamp.classList.add('full');
      }

      // 柜台上那张空白的抵押单 → 记忆核验
      const form = $('#om-form');
      if (form) form.addEventListener('click', (e) => { e.stopPropagation(); this.clickForm(); });

      // 柜台角落那本册子 →《玩家手册》
      const book = $('#om-book');
      if (book) book.addEventListener('click', (e) => { e.stopPropagation(); this.openManual(); });

      // 空白处：跳过独白
      $('#counter-scene').addEventListener('click', () => {
        if (Dlg.active) return;
      });

      // L 进里间 / K 跟他对一局
      document.addEventListener('keydown', (e) => {
        if (!App.isCurrent('counter')) return;
        const tag = (e.target && e.target.tagName) || '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (e.key === 'l' || e.key === 'L') {
          if (State.ch2 >= 1 && global.Space) { Snd.init(); global.Space.open(); }
          else this.say('（柜台后面是墙。墙后面没有东西——现在还没有。）', 2600);
        }
        if (e.key === 'd' || e.key === 'D') {
          if (global.Duel) { Snd.init(); global.Duel.open(); }
        }
      });
    },

    /* ---------------- 独白 ---------------- */
    say(text, dur) {
      if (Dlg.active) return;          // 说话的时候别把独白压在对话框上
      const el = $('#cs-dialogue');
      clearTimeout(this._sayT);
      el.textContent = text;
      el.classList.add('on');
      if (dur !== 0) this._sayT = setTimeout(() => el.classList.remove('on'), dur || 3200);
    },

    /* ---------------- 开场 ---------------- */
    async intro() {
      await wait(700);
      this.say('（柜台后面坐着一个人。他没有抬头，但你知道他在看你。）', 4200);
      await wait(4600);
      this.say('（你可以点他说话。）', 3000);
    },

    /* ---------------- 与艾交谈 ---------------- */
    async talk() {
      if (Dlg.active) return;
      Snd.init();
      this.hideNarration();
      const id = this.talked ? 'menu' : 'intro';
      this.talked = true;
      await Dlg.open(id);
      if (global.Sys) global.Sys.talk('ai');
      document.dispatchEvent(new CustomEvent('eteTalked', { detail: State.sys.talks }));
      this.updateHint();
    },

    /* ---------------- 抵押单 ---------------- */
    async clickForm() {
      if (Dlg.active) return;
      Snd.init(); Snd.click();
      await Fade.through(() => {
        App.show('verify');
        global.Ver.start();
      });
    },

    hideNarration() {
      $('#cs-dialogue').classList.remove('on');
    },

    /* 柜台角落那本被人翻烂的册子 */
    openManual() {
      if (Dlg.active) return;
      Snd.init(); Snd.click();
      const m = $('#manual');
      if (!m) return;
      m.classList.add('on');
      if (m.dataset.bound !== '1') {
        m.dataset.bound = '1';
        const x = $('#mn-x');
        if (x) x.addEventListener('click', () => m.classList.remove('on'));
        m.addEventListener('click', (e) => { if (e.target === m) m.classList.remove('on'); });
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') m.classList.remove('on'); });
      }
      document.dispatchEvent(new CustomEvent('manualOpen'));
    },

    /* ---------------- 状态 ---------------- */
    refreshHud() {
      const d = $('#hud-detail');
      const k = $('#hud-key');
      const lie = $('#hud-lie');
      if (d) d.textContent = State.detail ? State.detail + ' / 8' : '—';
      if (k) {
        const t = KEY_TIERS[State.keyQ];
        k.textContent = t ? t.name : '—';
        k.style.color = t ? t.color : '';
      }
      if (lie) {
        const got = Lies.list().length;
        if (State.exposed > 0) {
          lie.textContent = State.exposed + ' 处对不上';
          lie.style.color = '#c08a6a';
        } else if (got) {
          lie.textContent = got + ' 件，还没问';
          lie.style.color = '#b99a62';
        } else {
          lie.textContent = '—';
          lie.style.color = '';
        }
      }
      $('#cs-hud').classList.toggle('on', State.ch2 >= 1);
      if (State.ch2 >= 1) this.addItem('book', '证物 · 一本册子');
      if (this.inited) this.renderInv();
    },

    updateHint() {
      const h = $('#cs-hint');
      if (!h) return;
      const sys = State.sys || {};
      if (State.ch2 >= 4 && !sys.sawSpace) { h.textContent = '柜台后面那道缝比看起来深 —— L 走进去'; return; }
      if (State.ch2 >= 1 && !sys.sawSpace) { h.textContent = '柜台后面有一道缝 —— L 走进去'; return; }
      if (State.ch2 >= 5) { h.textContent = '门在你身后合上了'; return; }
      if (State.ch2 >= 4 && !State.soulDone) { h.textContent = '门缝里有声音 —— 先听清楚'; return; }
      if (State.ch2 >= 4) { h.textContent = '钥匙在手上 —— 去开那扇门'; return; }
      if (State.ch2 === 3) { h.textContent = '还差一顿饭 —— 点他，问愿望'; return; }
      if (State.ch2 >= 1 && Lies.ready().length) { h.textContent = '手里有东西能问他 —— 点他，把东西摆出来'; return; }
      if (State.ch2 === 2) { h.textContent = '木匣里那卷胶片，接回去'; return; }
      if (State.ch2 === 1) { h.textContent = '打开柜台下面的抽屉'; return; }
      if (State.pcFixed) { h.textContent = '电脑亮着 —— 点屏幕'; return; }
      if (State.selectedItem === 'crowbar') { h.textContent = '撬棍已拿起 —— 去点机箱'; return; }
      if (State.hasUV && !State.hasCrowbar) { h.textContent = '试试那台电脑'; return; }
      if (!State.hasUV) { h.textContent = '房间里还有别的东西'; return; }
      const hp = (global.Hands && global.Hands.undone) ? global.Hands.undone() : 0;
      h.textContent = hp
        ? '柜台底下那只木箱还有 ' + hp + ' 件 —— 按 Y'
        : '点击画面中的物件';
    },

    /* ---------------- 柜子 ---------------- */
    async clickCabinet() {
      if (Dlg.active) return;
      Snd.init();
      const cab = $('#hs-cabinet');
      if (State.hasUV) {
        Snd.deny();
        this.say('（柜子里空了。只有一层很薄的灰。）');
        return;
      }
      if (cab.classList.contains('open')) return;
      cab.classList.add('open');
      Snd.noise(0.5, { type: 'bandpass', freq: 700, q: 2, gain: 0.09 });
      await wait(700);
      this.addItem('uv', '紫光灯');
      State.hasUV = true;
      Snd.ok();
      this.say('（柜子里只有一支紫光灯。灯管是黑的，但握着它是温的。）', 3600);
      this.updateHint();
    },

    /* ---------------- 撬棍 ---------------- */
    takeCrowbar() {
      if (Dlg.active) return;
      if (State.hasCrowbar) return;
      Snd.init();
      State.hasCrowbar = true;
      $('#pc-crowbar').classList.add('taken');
      this.addItem('crowbar', '撬棍');
      Snd.noise(0.16, { type: 'highpass', freq: 2600, gain: 0.08 });
      Snd.tone(420, 0.12, { type: 'square', gain: 0.05 });
      this.say('（一根撬棍。冰凉，握柄上有一圈一圈的旧手印。）', 3000);
      this.updateHint();
    },

    /* ---------------- 店里的器物 ---------------- */
    sayLong(lines, extra) {
      const t = lines.join('\n');
      this.say(t, Math.max(4200, t.length * 165) + (extra || 0));
    },

    async clickOmen(k) {
      if (Dlg.active) return;
      Snd.init();
      const late = State.ch2 >= 1;
      const F = global.FOLK;

      if (k === 'lamp') {
        Snd.tone(300, 0.5, { type: 'sine', gain: 0.03 });
        this.sayLong(late ? F.lamp.late : F.lamp.early);
        return;
      }

      if (k === 'bowl') {
        Snd.tone(520, 0.9, { type: 'sine', gain: 0.028 });
        this.sayLong(late ? F.bowl.late : F.bowl.early);
        return;
      }

      if (k === 'cal') {
        Snd.noise(0.2, { type: 'bandpass', freq: 1500, q: 1.2, gain: 0.06 });
        if (!late) {
          this.say('（墙上挂着一本黄历。纸边卷成了筒，停在一页上。）\n（那一页被红笔圈过很多次，圈到纸都破了。）\n（七月十五。）');
          return;
        }
        this.sayLong(Lies.proofText('calendar'));
        Lies.gain('calendar');
        return;
      }

      if (k === 'joss') {
        Snd.noise(0.18, { type: 'highpass', freq: 2400, gain: 0.06 });
        if (!late) {
          this.say('（柜台上压着一叠黄纸，剪成铜钱的样式。）\n（找零用的。纸很脆，一碰就掉渣。）');
          return;
        }
        this.sayLong(Lies.proofText('joss'));
        Lies.gain('joss');
        return;
      }

      if (k === 'oil') {
        if (!late) {
          Snd.noise(0.3, { type: 'bandpass', freq: 520, q: 1.4, gain: 0.05 });
          this.say('（柜台边上立着一只油壶。满的。）\n（灯还长着，没人想起它。）');
          return;
        }
        Snd.tone(300, 0.3, { type: 'sine', gain: 0.04 });
        this.say('（油壶轻了。三只碗摆在桌上：八钱、五钱、三钱。）');
        await wait(900);
        Fade.through(() => { global.App.show('oil'); global.Oil.start(); });
        return;
      }

      if (k === 'clock') {
        if (!late) {
          this.say('（墙上挂着一只钟。秒针不动。）\n（时针和分针停在差一分的地方——三点十三。）');
          return;
        }
        Snd.tone(180, 0.12, { type: 'square', gain: 0.04 });
        this.say('（钟背上有刻字。凑近看——三。未过半。）');
        await wait(1100);
        Fade.through(() => { global.App.show('clock'); global.ClockG.start(); });
        return;
      }

      if (k === 'seam') {
        if (!late) {
          this.say('（地板有一条缝。踩上去会响。）');
          return;
        }
        if (State.sys && State.sys.scratch) {
          this.say('（暗格开着。铜片还在里面。）');
          return;
        }
        Snd.noise(0.25, { type: 'bandpass', freq: 300, q: 1.2, gain: 0.06 });
        this.say('（你把地板撬起一角。下面全是划痕——六组，每组四道。）');
        await wait(1100);
        Fade.through(() => { global.App.show('scratch'); global.Scratch.start(); });
        return;
      }

      if (k === 'under') {
        if (!late) {
          Snd.noise(0.4, { type: 'bandpass', freq: 380, q: 1.1, gain: 0.07 });
          this.say('（你蹲下去。柜台底下很暗，积着一层灰。）\n（灰上有两道拖痕。你伸手去摸，摸到一张硬纸片的边。）\n（——先办正事吧。）');
          return;
        }
        State.openedUnder = (State.openedUnder || 0) + 1;
        Snd.noise(0.4, { type: 'bandpass', freq: 380, q: 1.1, gain: 0.07 });
        if (State.openedUnder === 1) {
          this.sayLong(F.under.once.slice(0, 2).concat(Lies.proofText('ticket')));
          Lies.gain('ticket');
        } else if (State.openedUnder === 2) {
          this.sayLong(F.under.twice.concat(Lies.proofText('carving').slice(2)));
          Lies.gain('carving');
        } else {
          this.sayLong(F.under.after);
        }
        return;
      }
    },

    /* ---------------- 抽屉 ---------------- */
    async clickDrawer() {
      if (Dlg.active) return;
      if (State.ch2 <= 0) {
        Snd.deny();
        this.say(TEXT.ch2DrawerTooEarly);
        return;
      }
      if (State.ch2 >= 2) {
        if (!Lies.has('page34')) {
          this.sayLong(Lies.proofText('page34'));
          Lies.gain('page34');
          return;
        }
        this.say('（抽屉开着。里面只有一个空木匣。）');
        return;
      }
      Snd.noise(0.28, { type: 'bandpass', freq: 420, q: 1.2, gain: 0.06 });
      await Fade.through(() => { App.show('ledger'); Ledger.start(); });
    },

    /* ---------------- 门 ---------------- */
    async clickDoor() {
      if (Dlg.active) return;
      if (State.ch2 < 3) {
        Snd.deny();
        this.say(State.ch2 >= 1 ? TEXT.ch2DoorNoKey : TEXT.ch2DoorLocked);
        return;
      }
      if (State.ch2 < 4) {
        Snd.deny();
        this.say('（锁孔在等你。可你还没吃东西——手抖得插不进去。）');
        return;
      }

      // 开门之前，门外会有人叫你
      if (!State.soulDone) {
        this.hideNarration();
        Snd.tone(70, 2.4, { type: 'sine', gain: 0.06, attack: .6 });
        this.say('（钥匙插进去，还没转。\n门缝里先出来一点声音——像有人在叫你的名字。）', 0);
        await wait(2600);
        await Soul.run();
        return;
      }

      if (State.doorOpened) return;
      State.doorOpened = true;
      State.ch2 = 5;

      this.hideNarration();
      Snd.noise(0.2, { type: 'highpass', freq: 2200, gain: 0.07 });
      await wait(260);
      Snd.tone(150, 2.2, { type: 'sine', gain: 0.09, attack: .2 });
      Snd.glitch(0.35);
      $('#cs-door').classList.add('opening');
      this.say('（钥匙插进去，只转了半圈就不动了。锁里有什么东西咬住了它。）', 0);
      await wait(2600);
      $('#cs-door').classList.add('light');

      const q = State.keyQ || 'plain';
      const lines = {
        broken: '（门后有人用指甲刮木头。）',
        plain: '（门缝里出来一点风。是热的。）',
        fine: '（门缝外面是白的。白得没有远近。）',
        perfect: '（门开了。外面有一条走廊。）',
      };
      this.say(lines[q], 0);
      Snd.tone(70, 3.2, { type: 'sine', gain: 0.07, attack: .8 });
      await wait(3200);
      // 门后面还有一层。第四章。
      Snd.stopDrone(1.2);
      await Fade.through(() => { App.show('layer'); global.Layer.start(); });
    },

    /* ---------------- 背包 ---------------- */
    items: {},
    buildInventory() {
      $('#inventory').classList.add('on');
      this.renderInv();
    },
    addItem(id, name) {
      if (this.items[id]) return;
      this.items[id] = name;
      this.renderInv();
    },
    renderInv() {
      const box = $('#inv-items');
      box.innerHTML = '';
      // 钥匙是动态的（品级会变），直接同步，避免 addItem 递归
      if (State.keyQ && KEY_TIERS[State.keyQ]) {
        this.items.key = '钥匙 · ' + KEY_TIERS[State.keyQ].name;
      }
      Object.keys(this.items).forEach((id) => {
        const d = document.createElement('div');
        d.className = 'inv-item' + (id === 'book' ? ' inv-book' : '');
        d.textContent = this.items[id];
        d.dataset.id = id;
        d.addEventListener('click', (e) => {
          e.stopPropagation();
          if (Dlg.active) return;
          if (id === 'book') { Press.open(); return; }
          const was = State.selectedItem === id;
          State.selectedItem = was ? null : id;
          $$('.inv-item').forEach((n) => n.classList.toggle('sel', n.dataset.id === State.selectedItem));
          Snd.click();
          this.updateHint();
        });
        box.appendChild(d);
      });
      if (!Object.keys(this.items).length) {
        box.innerHTML = '<span style="font-size:10.5px;color:#33424c">（空）</span>';
      }
    },

    /* ---------------- 电脑 ---------------- */
    clickPC() {
      if (Dlg.active) return;
      Snd.init();
      if (State.pcFixed) {
        Snd.ok();
        Fade.through(() => { App.show('win98'); Win98.start(); });
        return;
      }
      Snd.tone(90, 0.2, { type: 'square', gain: 0.07 });
      this.say('（按下开机键。指示灯亮了一下，风扇转了半圈，然后停了。）', 3400);
    },

    async clickCase() {
      if (Dlg.active) return;
      Snd.init();
      if (State.pcFixed) { this.clickPC(); return; }
      if (this.busy) return;

      const pcCase = $('#pc-case');
      pcCase.classList.add('hit');
      setTimeout(() => pcCase.classList.remove('hit'), 200);
      Snd.tone(70, 0.3, { type: 'sine', gain: 0.22, to: 40 });
      Snd.noise(0.14, { type: 'bandpass', freq: 900, q: 1.4, gain: 0.1 });

      if (State.selectedItem === 'crowbar') {
        this.busy = true;
        this.say('（你把撬棍抵进机箱盖的缝隙。）', 2000);
        await wait(1100);
        this.busy = false;
        Fade.through(() => { App.show('pry'); Pry.start(); });
        return;
      }

      // 空手拍
      if (!State.hasUV) {
        this.say('（拍了两下，机身嗡嗡响，屏幕闪了一下又黑了。）\n（——你需要先找点能看清东西的工具。）', 4200);
        return;
      }

      this.busy = true;
      Snd.tone(120, 0.4, { type: 'square', gain: 0.08 });
      this.say('（又拍了两下。屏幕忽然亮了，很快又暗下去，像喘不上气。）', 2600);
      await wait(2400);
      this.busy = false;
      Fade.through(() => { App.show('rhythm'); Rhythm.start(); });
    },
  };

  global.Counter = Counter;
})(window);
