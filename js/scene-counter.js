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
      this.refreshHud();
      this.updateHint();

      if (!this.introPlayed) {
        this.introPlayed = true;
        this.intro();
      }
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

      // 空白处：跳过独白
      $('#counter-scene').addEventListener('click', () => {
        if (Dlg.active) return;
      });
    },

    /* ---------------- 独白 ---------------- */
    say(text, dur) {
      const el = $('#cs-dialogue');
      el.textContent = text;
      el.classList.add('on');
      if (dur !== 0) setTimeout(() => el.classList.remove('on'), dur || 3200);
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
      this.updateHint();
    },

    hideNarration() {
      $('#cs-dialogue').classList.remove('on');
    },

    /* ---------------- 状态 ---------------- */
    refreshHud() {
      const d = $('#hud-detail');
      const k = $('#hud-key');
      if (d) d.textContent = State.detail ? State.detail + ' / 8' : '—';
      if (k) {
        const t = KEY_TIERS[State.keyQ];
        k.textContent = t ? t.name : '—';
        k.style.color = t ? t.color : '';
      }
      $('#cs-hud').classList.toggle('on', State.ch2 >= 1);
      if (this.inited) this.renderInv();
    },

    updateHint() {
      const h = $('#cs-hint');
      if (State.ch2 >= 4) { h.textContent = '钥匙在手上 —— 去开那扇门'; return; }
      if (State.ch2 === 3) { h.textContent = '还差一顿饭 —— 点他，问愿望'; return; }
      if (State.ch2 === 2) { h.textContent = '木匣里那卷胶片，接回去'; return; }
      if (State.ch2 === 1) { h.textContent = '打开柜台下面的抽屉'; return; }
      if (State.pcFixed) { h.textContent = '电脑亮着 —— 点屏幕'; return; }
      if (State.selectedItem === 'crowbar') { h.textContent = '撬棍已拿起 —— 去点机箱'; return; }
      if (State.hasUV && !State.hasCrowbar) { h.textContent = '试试那台电脑'; return; }
      if (!State.hasUV) { h.textContent = '房间里还有别的东西'; return; }
      h.textContent = '点击画面中的物件';
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

    /* ---------------- 抽屉 ---------------- */
    async clickDrawer() {
      if (Dlg.active) return;
      if (State.ch2 <= 0) {
        Snd.deny();
        this.say(TEXT.ch2DrawerTooEarly);
        return;
      }
      if (State.ch2 >= 2) {
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
      End.show();
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
        d.className = 'inv-item';
        d.textContent = this.items[id];
        d.dataset.id = id;
        d.addEventListener('click', (e) => {
          e.stopPropagation();
          if (Dlg.active) return;
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
