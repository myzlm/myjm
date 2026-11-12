/* ============================================================
   scene-counter.js — 柜台：老人 / 柜子 / 撬棍 / 电脑
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Fade, Toast } = global.G;

  const Counter = {
    inited: false,
    busy: false,
    talked: false,

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
        this.say('（电脑亮着。屏幕上是一个很旧的桌面。）', 0);
      } else {
        $('#pc-screen').classList.remove('on');
        $('#case-led').classList.remove('on');
      }

      this.updateHint();
      if (!this.talked) this.intro();
    },

    bind() {
      // 柜子
      $('#hs-cabinet').addEventListener('click', () => this.clickCabinet());

      // 撬棍
      const cb = $('#pc-crowbar');
      if (cb) cb.addEventListener('click', (e) => { e.stopPropagation(); this.takeCrowbar(); });

      // 电脑：屏幕 / 机箱
      $('#pc-case').addEventListener('click', (e) => { e.stopPropagation(); this.clickCase(); });
      $('#pc-monitor').addEventListener('click', (e) => { e.stopPropagation(); this.clickPC(); });

      // 点击空白推进
      $('#counter-scene').addEventListener('click', () => {
        if (this.dlgQueue.length) this.advanceDialogue();
      });
    },

    /* ---------------- 对话 ---------------- */
    dlgQueue: [],
    dlgTimer: null,

    async intro() {
      this.talked = true;
      this.lockHotspots(true);
      this.dlgQueue = [TEXT.oldman1, TEXT.oldman2, TEXT.oldman3];
      await this.playDialogue();
      this.lockHotspots(false);
      this.updateHint();
    },

    async playDialogue() {
      while (this.dlgQueue.length) {
        const text = this.dlgQueue[0];
        await this.typeText(text);
        await wait(1900);
        if (this.dlgQueue.length) {
          this.dlgQueue.shift();
          if (this.dlgQueue.length) $('#cs-dialogue').classList.remove('on');
          await wait(360);
        }
      }
      $('#cs-dialogue').classList.remove('on');
    },

    advanceDialogue() {
      this.dlgQueue.shift();
      $('#cs-dialogue').classList.remove('on');
    },

    typeText(text) {
      return new Promise((resolve) => {
        const el = $('#cs-dialogue');
        el.classList.add('on');
        el.textContent = '';
        let i = 0;
        clearInterval(this.dlgTimer);
        this.dlgTimer = setInterval(() => {
          if (i >= text.length) { clearInterval(this.dlgTimer); resolve(); return; }
          const ch = text[i++];
          el.textContent += ch;
          if (ch !== '\n' && (i % 3 === 0)) Snd.tone(1400, 0.02, { type: 'square', gain: 0.012 });
        }, 62);
      });
    },

    say(text, dur) {
      const el = $('#cs-dialogue');
      el.textContent = text;
      el.classList.add('on');
      if (dur !== 0) setTimeout(() => el.classList.remove('on'), dur || 3200);
    },

    lockHotspots(on) {
      $$('.hotspot').forEach((h) => { h.style.pointerEvents = on ? 'none' : ''; });
      const cb = $('#pc-crowbar');
      if (cb) cb.style.pointerEvents = on ? 'none' : '';
    },

    /* ---------------- 柜子 ---------------- */
    async clickCabinet() {
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
      Object.keys(this.items).forEach((id) => {
        const d = document.createElement('div');
        d.className = 'inv-item';
        d.textContent = this.items[id];
        d.dataset.id = id;
        d.addEventListener('click', (e) => {
          e.stopPropagation();
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

    updateHint() {
      const h = $('#cs-hint');
      if (State.pcFixed) {
        h.textContent = '点击电脑';
        return;
      }
      if (State.selectedItem === 'crowbar') {
        h.textContent = '撬棍已拿起 —— 去点机箱';
      } else if (State.hasUV && !State.hasCrowbar) {
        h.textContent = '试试那台电脑';
      } else if (!State.hasUV) {
        h.textContent = '房间里还有别的东西';
      } else {
        h.textContent = '点击画面中的物件';
      }
    },

    /* ---------------- 电脑 ---------------- */
    clickPC() {
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
