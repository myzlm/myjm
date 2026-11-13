/* ============================================================
   scene-ch4.js — 第四章 · 渲染层
   ------------------------------------------------------------
   门后不是走廊，是一条走廊的正面。
   这里的东西只有一面，人只有正面，门没有被绑过事件。
   三个谜题：
     ① 检查器：把墙的 z-index 降到人后面
     ② 断点：冻结帧，在它够到你之前走到门
     ③ 一扇没有 onclick 的门：用开发者模式 open 它
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Fade, Toast, Shake } = global.G;

  // Shake 只有 start/stop，这里包一层"震一下就停"
  const shake = (ms, amp) => {
    try {
      Shake.start(document.body, amp || 7, 30);
      setTimeout(() => Shake.stop(), ms || 300);
    } catch (e) {}
  };

  const Layer = {
    stage: 'room',
    started: false,

    /* ---------------- 进入 ---------------- */
    async start() {
      this.started = true;
      State.ch4 = 1;
      $('#ly-wrap').dataset.stage = 'room';
      $('#ly-nar').textContent = '';
      $('#ly-ins').classList.remove('on');
      $('#ly-run').classList.remove('on');
      $('#ly-doorwrap').classList.remove('on');
      $('#ly-badge').classList.remove('on');
      $('#ly-figure').className = 'ly-figure';
      State.wallZ = 9;
      this.applyZ();
      this.buildInspector();
      Snd.startDrone();

      await this.say('门开了。\n后面不是走廊——是一条走廊的正面。', 0);
      await wait(2600);
      await this.say('你往前走。走了三步才发现：\n两侧的墙一直在跟着你转。\n不是它们在转，是它们只有一面。', 0);
      await wait(4200);
      await this.say('（侧面是 0 像素。这里所有的东西，都是画上去的。）', 3600);
      await wait(2200);
      await this.stageWall();
    },

    /* ---------------- 独白 ---------------- */
    async say(text, dur) {
      const el = $('#ly-nar');
      el.textContent = text;
      el.classList.add('on');
      if (dur !== 0) setTimeout(() => el.classList.remove('on'), dur || 3200);
    },

    /* ============================================================
       ① 检查器 · 墙后的东西
       ============================================================ */
    layers: [
      { id: 'ly-backwall', name: '#backwall', z: 0, lock: true },
      { id: 'ly-figure', name: '#npc.艾', z: 2, lock: false },
      { id: 'ly-floor', name: '#floor', z: 3, lock: true },
      { id: 'ly-wall', name: '#wall', z: 9, lock: false },
      { id: 'ly-nar', name: '#narration', z: 20, lock: true },
    ],

    buildInspector() {
      const box = $('#ly-ins-list');
      box.innerHTML = '';
      this.layers.forEach((L) => {
        const d = document.createElement('div');
        d.className = 'ly-row' + (L.id === 'ly-wall' ? ' hot' : '');
        d.innerHTML = '<span class="ly-lname">' + L.name + '</span>'
          + '<span class="ly-lz" id="z-' + L.id + '">' + L.z + '</span>'
          + '<span class="ly-lbtns">'
          + '<button data-id="' + L.id + '" data-d="-1"' + (L.lock ? ' disabled' : '') + '>−</button>'
          + '<button data-id="' + L.id + '" data-d="1"' + (L.lock ? ' disabled' : '') + '>＋</button>'
          + '</span>';
        box.appendChild(d);
      });
      box.addEventListener('click', (e) => {
        const b = e.target.closest('button');
        if (!b) return;
        this.shiftZ(b.dataset.id, +b.dataset.d);
      });
      // Tab 收起 / 打开检查器
      document.addEventListener('keydown', (e) => {
        if (e.key !== 'Tab') return;
        if (!App.isCurrent('layer')) return;
        e.preventDefault();
        $('#ly-ins').classList.toggle('on');
        Snd.click();
      });
    },

    applyZ() {
      const fig = this.layers.find((l) => l.id === 'ly-figure');
      const wall = this.layers.find((l) => l.id === 'ly-wall');
      $('#ly-figure').style.zIndex = fig.z;
      $('#ly-wall').style.zIndex = wall.z;
      const fz = $('#z-ly-figure'); const wz = $('#z-ly-wall');
      if (fz) fz.textContent = fig.z;
      if (wz) wz.textContent = wall.z;
      // 墙盖在人前面 = 看不见人
      $('#ly-wall').classList.toggle('thin', wall.z <= fig.z);
      $('#ly-figure').classList.toggle('seen', fig.z > wall.z);
    },

    shiftZ(id, d) {
      const L = this.layers.find((l) => l.id === id);
      if (!L || L.lock) return;
      L.z = Math.max(0, Math.min(30, L.z + d));
      State.wallZ = this.layers.find((l) => l.id === 'ly-wall').z;
      Snd.tone(520 + L.z * 26, 0.05, { type: 'square', gain: 0.03 });
      this.applyZ();
      if (!State.figureSeen && this.revealed()) this.onReveal();
    },

    revealed() {
      const fig = this.layers.find((l) => l.id === 'ly-figure');
      const wall = this.layers.find((l) => l.id === 'ly-wall');
      return fig.z > wall.z;
    },

    async stageWall() {
      this.stage = 'room';
      $('#ly-ins').classList.add('on');
      await this.say('（前面站着一个人。你只看得见墙。）\n（这一层上面还有一层。按 Tab。）', 0);
      Snd.tone(90, 1.6, { type: 'sine', gain: 0.05, attack: .4 });
    },

    async onReveal() {
      if (State.figureSeen) return;
      State.figureSeen = true;
      Snd.glitch(0.25);
      shake(260);
      await this.say('墙在你手里薄了下去。\n后面站着掌柜。他正面朝你，一动不动。', 0);
      await wait(3400);
      $('#ly-figure').classList.add('flip');
      Snd.tone(120, 1.8, { type: 'triangle', gain: 0.06, attack: .3 });
      await wait(1200);
      await this.say('你绕到侧面去看他——\n他不见了。只剩一条线。', 0);
      await wait(3600);
      await this.say('他没有背面。\n\n人是需要背面的。', 0);
      await wait(4200);
      await this.say('（他的声音从你背后过来。你没有转身。）', 3600);
      Snd.tone(110, 1.2, { type: 'sine', gain: 0.05 });
      await wait(1800);
      this.toRun();
    },

    /* ============================================================
       ② 断点 · 两帧之间的东西
       ============================================================ */
    me: 0,
    it: -2,
    freezes: 3,
    frozen: false,
    caught: 0,
    timer: null,
    doorAt: 8,

    toRun() {
      this.stage = 'run';
      $('#ly-ins').classList.remove('on');
      $('#ly-wrap').dataset.stage = 'run';
      $('#ly-run').classList.add('on');
      this.me = 0; this.it = -2; this.freezes = 3; this.frozen = false; this.caught = 0;
      this.paint();
      this.say('走廊的灯灭了。\n有什么东西开始跟着你。它只在两帧之间移动。', 0);
      setTimeout(() => this.say('（按 P 打一个断点。断点里它停在原地——你能走。）', 0), 3000);
      this.startTimer();

      $('#ly-step').onclick = () => this.step();
      $('#ly-frz').onclick = () => this.freeze();
      if (!this.keyBound) {
        this.keyBound = true;
        document.addEventListener('keydown', (e) => {
          if (!App.isCurrent('layer') || this.stage !== 'run') return;
          if (e.key === 'p' || e.key === 'P') { e.preventDefault(); this.freeze(); }
          if (e.key === 'ArrowRight' || e.key === 'Enter') { e.preventDefault(); this.step(); }
        });
        document.addEventListener('dev:open', () => this.pauseTimer(true));
        document.addEventListener('dev:close', () => this.pauseTimer(false));
      }
    },

    pauseTimer(devPause) {
      if (this.stage !== 'run') return;
      if (devPause) { clearInterval(this.timer); this.timer = null; }
      else if (!this.timer && !this.frozen) this.startTimer();
    },

    startTimer() {
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (this.frozen) return;
        if (Dev.open) return;
        this.it++;
        Snd.tone(58, 0.22, { type: 'sine', gain: 0.05 });
        this.paint();
        if (this.it >= this.me) this.onCaught();
      }, 450);
    },

    paint() {
      const step = 84 / this.doorAt;
      const me = $('#ly-me'); const it = $('#ly-it');
      me.style.left = (6 + this.me * step) + '%';
      it.style.left = (6 + this.it * step) + '%';
      it.style.opacity = this.frozen ? 1 : 0;
      $('#ly-left').textContent = '已走 ' + this.me + ' / ' + this.doorAt + '　·　断点 '
        + this.freezes + ' 次　·　' + (this.frozen ? '帧已冻结' : '它在动');
      $('#ly-frz').disabled = this.freezes <= 0 || this.frozen;
      const st = $('#ly-step');
      if (st) st.disabled = !!this.locked || this.me >= this.doorAt;
      $('#ly-run').classList.toggle('frozen', this.frozen);
    },

    step() {
      if (this.stage !== 'run' || this.locked) return;
      if (this.me >= this.doorAt) return;
      this.me++;
      this.locked = true;
      setTimeout(() => { this.locked = false; this.paint(); }, 480);
      Snd.tone(220 + this.me * 18, 0.06, { type: 'square', gain: 0.04 });
      this.paint();
      if (this.me >= this.doorAt) {
        clearInterval(this.timer); this.timer = null;
        this.toDoor();
      }
    },

    freeze() {
      if (this.stage !== 'run' || this.frozen || this.freezes <= 0) return;
      this.freezes--;
      this.frozen = true;
      Snd.glitch(0.18);
      Snd.uvOn();
      this.paint();
      // 帧计数
      let f = 0;
      clearInterval(this.frameT);
      this.frameT = setInterval(() => {
        f += 7;
        const el = $('#ly-frame');
        if (el) el.textContent = '帧 ' + String(f).padStart(4, '0');
      }, 60);
      setTimeout(() => {
        this.frozen = false;
        clearInterval(this.frameT);
        Snd.uvOff();
        this.paint();
        if (this.it >= this.me) this.onCaught();
      }, 1600);
    },

    async onCaught() {
      if (this.stage !== 'run' || this.ending) return;
      this.ending = true;
      clearInterval(this.timer); this.timer = null;
      this.caught++;
      this.stage = 'caught';
      Snd.boo();
      shake(700);
      $('#screen-layer').classList.add('ly-grab');
      const hit = document.createElement('div');
      hit.className = 'ly-hit';
      hit.textContent = '你踩到了它。';
      $('#ly-run').appendChild(hit);
      // 只闪 0.5 秒：它不属于这一帧，所以只能看见这么一下
      const face = document.createElement('div');
      face.className = 'ly-face';
      face.innerHTML = '<img src="assets/doll.png" alt="">';
      $('#ly-run').appendChild(face);
      setTimeout(() => face.remove(), 520);
      await wait(900);
      Snd.glitch(0.5);
      await this.say('（它比你快半帧。）\n（这半帧，是它留在这个页面上的唯一位置。）', 0);
      await wait(3000);
      $('#ly-run').classList.remove('frozen');
      $('#screen-layer').classList.remove('ly-grab');
      if (hit.parentNode) hit.parentNode.removeChild(hit);
      this.ending = false;
      this.me = 0; this.it = -2; this.freezes = 3; this.frozen = false;
      this.paint();
      this.stage = 'run';
      this.startTimer();
      this.say('（再走一遍。它记得你走到哪儿。）', 3200);
    },

    /* ============================================================
       ③ 门 · 它没有被绑过任何东西
       ============================================================ */
    toDoor() {
      this.stage = 'door';
      $('#ly-run').classList.remove('on');
      $('#ly-wrap').dataset.stage = 'door';
      $('#ly-doorwrap').classList.add('on');
      State.ch4 = 4;
      Snd.tone(80, 2.2, { type: 'sine', gain: 0.06, attack: .5 });
      this.say('走廊到头了。门在这儿。', 0);
      setTimeout(() => this.say('没有把手。你推它——\n它没有反应，因为它没有绑过任何东西。', 0), 2600);
      setTimeout(() => this.say('（它只是一个 div。）', 0), 6400);
      setTimeout(() => {
        $('#ly-badge').classList.add('on');
        Toast.show('右下角亮起一个小图标：</>  F2', 5200);
      }, 8200);

      $('#ly-door3').addEventListener('click', () => {
        Snd.deny();
        this.say('（门不动。它没有被写过要动。）', 2600);
      });

      // 注册给开发者控制台：这是唯一能开它的方式
      global.Dev.opens['#ly-door3'] = () => this.forceDoor();
    },

    async forceDoor() {
      if (this.stage !== 'door') return;
      this.stage = 'open';
      State.ch4 = 5;
      State.devMode = true;
      Snd.uvOn();
      Snd.glitch(0.3);
      $('#ly-door3').classList.add('open');
      $('#ly-badge').classList.add('done');
      await this.say('门被"点"开了。\n不是被推开的——是被点开的。', 0);
      await wait(3000);
      await this.say('（你学会了这里唯一一种开门的方式。）', 3600);
      await wait(2600);
      Snd.tone(64, 3, { type: 'sine', gain: 0.07, attack: 1 });
      await this.say('掌柜的声音从很远的地方过来：\n\n"您不该学会这个。"', 0);
      await wait(4200);
      await this.say('门后是往下的。\n不是楼梯——是往下滚动的行。', 0);
      await wait(3600);
      Snd.stopDrone(1.2);
      if (global.Dev) global.Dev.close();
      await Fade.through(() => { App.show('root'); Root.start(); });
    },
  };

  global.Layer = Layer;
})(window);
