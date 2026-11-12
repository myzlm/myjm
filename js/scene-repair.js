/* ============================================================
   scene-repair.js — 节奏 / 撬机箱 / 密码锁
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Fade, Toast, rnd, irnd, pick } = global.G;

  /* ============================================================
     7a. 节奏：跟着重音敲
     ============================================================ */
  const Rhythm = {
    BPM: 96,
    lead: 2.2,
    hits: [],
    running: false,
    combo: 0,
    tol: 0.5,
    raf: null,
    started: false,

    init() {
      if (this.started) return;
      this.started = true;
      $('#screen-rhythm').addEventListener('pointerdown', (e) => {
        if (!this.running) return;
        this.tryHit(e);
      });
      document.addEventListener('keydown', (e) => {
        if (!this.running) return;
        if (e.code === 'Space' || e.code === 'Enter') {
          e.preventDefault();
          this.tryHit(e);
        }
      });
      // 连输三次给一条退路，免得卡在这一关
      const esc = $('#rh-escape');
      if (esc) {
        esc.addEventListener('click', async (e) => {
          e.stopPropagation();
          this.running = false;
          cancelAnimationFrame(this.raf);
          Snd.duckMusic(0.55);
          await Fade.through(() => { App.show('counter'); Counter.init(); });
        });
      }
    },

    async start() {
      this.init();
      this.fails = 0;
      $('#rh-escape').classList.remove('on');
      this.tol = State.jobIsMusic ? 0.3 : 0.5;
      $('#rh-sub').textContent = State.jobIsMusic
        ? '跟着重音敲。你的耳朵比手快。（判定 ±0.3 秒）'
        : '跟着重音敲。别抢拍。（判定 ±0.5 秒）';

      await this.runRound();
    },

    async runRound() {
      Snd.init();
      const ctx = Snd.ctx;
      if (!ctx) { Lock.start(); return; }

      this.running = true;
      this.combo = 0;
      this.hits = [];
      Snd.duckMusic(0.55);
      $('#rh-hits').innerHTML = '';
      $('#rh-feedback').textContent = '';
      $('#rh-feedback').className = 'rh-feedback';

      const beat = 60 / this.BPM;
      const barLen = beat * 4;
      const t0 = ctx.currentTime + 0.6;
      const bars = 4;

      // 音符：每小节第 1、3 拍
      for (let b = 0; b < bars; b++) {
        [0, 2].forEach((k) => {
          this.hits.push({ time: t0 + b * barLen + k * beat, done: false, el: null });
        });
      }

      // DOM
      const track = $('#rh-track');
      const W = track.clientWidth;
      const lineX = W * 0.16;
      this.hits.forEach((h) => {
        const el = document.createElement('div');
        el.className = 'rh-note';
        el.style.left = '0px';
        el.style.transform = 'translateX(-100px)';
        $('#rh-hits').appendChild(el);
        h.el = el;
      });

      this.updateCounter();

      // 调度音频
      this.scheduleMusic(t0, beat, barLen, bars);

      // 循环
      let last = performance.now();
      const wallStart = performance.now();
      // 音频时钟不推进（无输出设备/上下文被挂起）时的兜底，避免这一关卡死
      const wallLimit = (bars * barLen + this.lead + 4) * 1000;
      const loop = () => {
        if (!this.running) return;
        this.raf = requestAnimationFrame(loop);
        if (performance.now() - wallStart > wallLimit) {
          this.fail(this.hits[this.hits.length - 1], '错过了');
          return;
        }
        const nowT = ctx.currentTime;
        const W2 = track.clientWidth;
        const lx = W2 * 0.16;
        const span = W2 - lx;

        this.hits.forEach((h) => {
          if (!h.el || h.done) return;
          const dt = h.time - nowT;
          const x = lx + (dt / this.lead) * span;
          h.el.style.transform = `translateX(${x}px)`;
          h.el.style.opacity = dt < -0.35 ? '0' : '1';
          if (dt < -this.tol && !h.done) this.fail(h, '漏了');
        });

        // 音符全部过完 → 成功
        const lastHit = this.hits[this.hits.length - 1];
        if (this.hits.every((h) => h.done) && nowT > lastHit.time + 0.9) {
          this.succeed();
        }
      };
      this.raf = requestAnimationFrame(loop);
    },

    scheduleMusic(t0, beat, barLen, bars) {
      const ctx = Snd.ctx;
      const at = (t) => Math.max(0, t - ctx.currentTime);
      const bassNotes = [110, 98, 87.31, 98];
      const M = Snd.music || undefined;

      // 前奏一小节
      for (let i = 0; i < 8; i++) {
        Snd.noise(0.03, { type: 'highpass', freq: 7600, gain: 0.03, bus: M, delay: at(t0 - barLen + i * beat / 2) });
      }

      for (let b = 0; b < bars; b++) {
        const base = t0 + b * barLen;

        // 8 分踩镲
        for (let i = 0; i < 8; i++) {
          Snd.noise(0.03, {
            type: 'highpass', freq: 7200, gain: i % 2 === 0 ? 0.035 : 0.022, bus: M,
            delay: at(base + i * beat / 2),
          });
        }

        // 重音（底鼓）在 1、3 拍 —— 玩家要敲的就是这个
        [0, 2].forEach((k) => {
          const t = base + k * beat;
          Snd.tone(138, 0.26, { type: 'sine', gain: 0.36, to: 40, bus: M, delay: at(t) });
          Snd.noise(0.05, { type: 'lowpass', freq: 760, gain: 0.12, bus: M, delay: at(t) });
          Snd.tone(276, 0.1, { type: 'triangle', gain: 0.08, bus: M, delay: at(t) });
        });

        // 2、4 拍军鼓
        [1, 3].forEach((k) => {
          Snd.noise(0.1, { type: 'bandpass', freq: 1900, q: 1.2, gain: 0.07, bus: M, delay: at(base + k * beat) });
        });

        // 低音线
        const bn = bassNotes[b % bassNotes.length];
        Snd.tone(bn, barLen * 0.92, {
          type: 'sawtooth', gain: 0.075, attack: 0.05, bus: M,
          filter: { type: 'lowpass', freq: 360, q: 3 },
          delay: at(base),
        });
        Snd.tone(bn * 2, barLen * 0.5, {
          type: 'triangle', gain: 0.02, attack: 0.08, bus: M,
          delay: at(base + beat * 2),
        });
      }

      // 收尾长音
      Snd.tone(110, 1.6, {
        type: 'triangle', gain: 0.05, attack: .1, bus: M,
        delay: at(t0 + bars * barLen),
      });
    },

    tryHit() {
      if (!this.running) return;
      const nowT = Snd.ctx.currentTime;
      let best = null, bestD = 1e9;
      this.hits.forEach((h) => {
        if (h.done) return;
        const d = Math.abs(nowT - h.time);
        if (d < bestD) { bestD = d; best = h; }
      });
      if (best && bestD <= this.tol) {
        this.hitFx(best);
      } else {
        // 空拍
        const fb = $('#rh-feedback');
        fb.textContent = '空的';
        fb.className = 'rh-feedback bad';
        Snd.tone(160, 0.06, { type: 'square', gain: 0.03 });
        clearTimeout(this._fbT);
        this._fbT = setTimeout(() => { fb.textContent = ''; fb.className = 'rh-feedback'; }, 450);
      }
    },

    hitFx(h) {
      h.done = true;
      this.combo++;
      h.el.classList.add('hit');
      Snd.tone(520 + this.combo * 26, 0.12, { type: 'triangle', gain: 0.08 });
      const fb = $('#rh-feedback');
      fb.textContent = pick(['好', '对了', '就这个', '嗯']);
      fb.className = 'rh-feedback';
      clearTimeout(this._fbT);
      this._fbT = setTimeout(() => { fb.textContent = ''; }, 620);
      this.updateCounter();
    },

    updateCounter() {
      const done = this.hits.filter((h) => h.done).length;
      $('#rh-combo').textContent = done + ' / ' + this.hits.length;
    },

    fail(h, why) {
      if (!this.running) return;
      h.done = true;
      this.running = false;
      cancelAnimationFrame(this.raf);
      h.el.classList.add('miss');
      Snd.duckMusic(0.0001);
      Snd.glitch(0.4);
      Snd.tone(60, 0.9, { type: 'sine', gain: 0.16, to: 30 });

      const fb = $('#rh-feedback');
      fb.textContent = why + '——电脑黑下去了';
      fb.className = 'rh-feedback bad';

      this.fails = (this.fails || 0) + 1;
      if (this.fails >= 3) {
        const esc = $('#rh-escape');
        if (esc) esc.classList.add('on');
      }

      // 屏幕黑
      $('#screen-rhythm').style.transition = 'filter .3s';
      $('#screen-rhythm').style.filter = 'brightness(.15)';
      setTimeout(() => {
        $('#screen-rhythm').style.filter = '';
        $('#rh-feedback').textContent = '';
        $('#rh-feedback').className = 'rh-feedback';
        $('#screen-rhythm').style.filter = 'brightness(.3)';
        setTimeout(() => {
          $('#screen-rhythm').style.filter = '';
          this.runRound();
        }, 900);
      }, 1500);
    },

    async succeed() {
      if (!this.running) return;
      this.running = false;
      cancelAnimationFrame(this.raf);
      $('#rh-feedback').textContent = '通了。';
      $('#rh-feedback').className = 'rh-feedback';
      $('#rh-escape').classList.remove('on');
      Snd.ok();
      await wait(1200);
      await Fade.through(() => { App.show('lock'); Lock.start(); });
    },
  };

  /* ============================================================
     7b. 撬机箱
     ============================================================ */
  const Pry = {
    inited: false,
    needs: [0, 0, 0, 0],
    counts: [0, 0, 0, 0],
    ran: false,
    hiddenIdx: 0,

    init() {
      if (this.inited) return;
      this.inited = true;
      // 按住不放 = 连续撬，不必一下一下点
      $$('.corner').forEach((c, i) => {
        c.addEventListener('pointerdown', (e) => {
          e.preventDefault();
          e.stopPropagation();
          this.startHold(i);
        });
        c.addEventListener('pointerup', () => this.stopHold());
        c.addEventListener('pointerleave', () => this.stopHold());
        c.addEventListener('pointercancel', () => this.stopHold());
      });
      window.addEventListener('pointerup', () => this.stopHold());
      $('#hidden-spot').addEventListener('click', (e) => { e.stopPropagation(); this.hitHidden(); });
      $('#screen-pry').addEventListener('click', () => {
        // 任意处点击且非角 → 也算误触
      });
    },

    holdTimer: null,

    startHold(i) {
      this.stopHold();
      this.hitCorner(i);
      if (this.counts[i] >= this.needs[i]) return;
      // 越撬越松，间隔略缩短
      this.holdTimer = setInterval(() => {
        if (!App.isCurrent('pry')) { this.stopHold(); return; }
        this.hitCorner(i);
      }, 70);
    },

    stopHold() {
      if (this.holdTimer) { clearInterval(this.holdTimer); this.holdTimer = null; }
    },

    start() {
      this.init();
      if (this.needs[0] === 0) {
        this.needs = [0, 1, 2, 3].map(() => irnd(80, 120));
        this.counts = [0, 0, 0, 0];
      }
      State.hiddenCount = 0;

      // 按已有进度重建视觉
      $$('.corner').forEach((c, i) => {
        const done = this.counts[i] >= this.needs[i];
        c.classList.toggle('open', done);
        c.classList.remove('pried');
        c.style.setProperty('--p', done ? 100 : Math.round(this.counts[i] / this.needs[i] * 100));
        c.querySelector('.corner-num').textContent = done ? '' : (this.counts[i] > 0 ? (this.needs[i] - this.counts[i]) + ' 下' : '');
      });
      const total = this.counts.reduce((a, b) => a + b, 0);
      const totalNeed = this.needs.reduce((a, b) => a + b, 0);
      $('#pry-count').textContent = total > 0 ? total + ' / ' + totalNeed : '';
      $('#pry-hint').textContent = '用撬棍抵住螺丝孔，反复撬动';
      const doneN = this.counts.filter((v, k) => v >= this.needs[k]).length;
      $('#pry-sub').textContent = ['四个角，一个一个来。', '已经松了一个角。', '对角也松了。', '只剩最后一个。'][doneN] || '';
      $('#pry-scratch').classList.toggle('on', total > 0);

      // 隐藏热点随机位置
      const spot = $('#hidden-spot');
      spot.style.left = rnd(30, 62) + '%';
      spot.style.top = rnd(30, 62) + '%';
    },

    hitCorner(i) {
      State.hiddenCount = 0; // 点到正常位置 → 连续误触清零
      if (this.counts[i] >= this.needs[i]) return;

      this.counts[i]++;
      Snd.pry();

      const c = $$('.corner')[i];
      c.classList.add('pried');
      const num = c.querySelector('.corner-num');
      num.textContent = (this.needs[i] - this.counts[i]) + ' 下';
      c.style.setProperty('--p', Math.round(this.counts[i] / this.needs[i] * 100));
      $('#pry-scratch').classList.add('on');

      const total = this.counts.reduce((a, b) => a + b, 0);
      const totalNeed = this.needs.reduce((a, b) => a + b, 0);
      $('#pry-count').textContent = total + ' / ' + totalNeed;

      if (this.counts[i] >= this.needs[i]) {
        this.stopHold();
        c.classList.add('open');
        c.classList.remove('pried');
        c.style.setProperty('--p', 100);
        num.textContent = '';
        Snd.pryDone();
        const done = this.counts.filter((v, k) => v >= this.needs[k]).length;
        $('#pry-sub').textContent = ['四个角，一个一个来。', '已经松了一个角。', '对角也松了。', '只剩最后一个。', '开了。'][done] || '';
        if (this.counts.every((v, k) => v >= this.needs[k])) {
          setTimeout(() => this.opened(), 500);
        }
      }
    },

    /* ---- 隐藏路径：连续三次点到那个"很小的地方" ---- */
    hitHidden() {
      State.hiddenCount++;
      Snd.tone(1200, 0.04, { type: 'square', gain: 0.02 });
      if (State.hiddenCount >= 3) {
        State.hiddenCount = 0;
        this.triggerHidden();
      }
    },

    async triggerHidden() {
      const brk = $('#ov-break');
      const scr = $('#break-screen');
      const sc = $('#ov-scare');
      const txt = $('#scare-text');

      Snd.glitch(0.5);
      brk.classList.add('on');
      scr.classList.add('on');
      await wait(600);
      Snd.boo();
      G.Shake.start($('#screen-pry'), 8, 26);
      brk.classList.remove('on');
      scr.classList.remove('on');
      sc.classList.add('on');
      txt.classList.remove('on');
      txt.textContent = '';
      await wait(700);
      txt.classList.add('on');
      txt.textContent = '你是不小心的吧？';
      Snd.tone(58, 2.4, { type: 'sine', gain: 0.09, attack: .4 });
      await wait(2400);
      G.Shake.stop();
      sc.classList.remove('on');
      await Fade.on(true);
      await wait(200);
      await Fade.off(700);
      this.say('（……没什么。你继续。）');
    },

    say(t) {
      $('#pry-hint').textContent = t;
      setTimeout(() => {
        if ($('#pry-hint').textContent === t) $('#pry-hint').textContent = '用撬棍抵住螺丝孔，反复撬动';
      }, 3200);
    },

    /* ---- 四角全部撬开 ---- */
    async opened() {
      State.pryOpened = true;
      const wrap = $('.pry-wrap');

      // 灰尘
      const dust = document.createElement('div');
      dust.className = 'dust-burst';
      wrap.appendChild(dust);
      dust.classList.add('on');
      Snd.pryDone();
      await wait(500);

      // 喷嚏
      Snd.sneeze();
      G.Shake.start($('#screen-pry'), 12, 22);
      await wait(420);
      G.Shake.stop();
      await wait(600);

      // 洋娃娃 + 纸条
      await this.dollNote();

      // 电脑好了
      State.pcFixed = true;
      await Fade.through(() => {
        App.show('counter');
        Counter.init();
        $('#pc-screen').classList.add('on');
        $('#case-led').classList.add('on');
        Counter.say('（灰尘落定之后，电脑自己亮了。）', 3000);
      });
      await wait(1200);
      await Fade.through(() => { App.show('lock'); Lock.start(); });
    },

    dollNote() {
      return new Promise((resolve) => {
        const ov = document.createElement('div');
        ov.className = 'doll-note';
        ov.innerHTML =
          '<div class="dn-doll"><img src="assets/doll.png" alt=""></div>' +
          '<div class="dn-paper"><div class="dn-text">快走　不要回头</div></div>';
        document.body.appendChild(ov);
        requestAnimationFrame(() => ov.classList.add('on'));
        Snd.noise(0.5, { type: 'bandpass', freq: 500, q: .8, gain: 0.1 });
        Snd.tone(70, 1.6, { type: 'sine', gain: 0.08, attack: .3 });

        // 图片缺失时隐藏
        const img = ov.querySelector('img');
        img.onerror = () => { img.style.display = 'none'; ov.querySelector('.dn-doll').classList.add('broken'); };

        setTimeout(() => {
          const t = ov.querySelector('.dn-text');
          t.style.filter = 'blur(4px)';
          setTimeout(() => {
            t.textContent = '救救我　救救我';
            t.style.filter = '';
            t.classList.add('flip');
            Snd.tone(180, 0.5, { type: 'triangle', gain: 0.06 });
          }, 380);
        }, 2200);

        setTimeout(() => {
          ov.classList.remove('on');
          setTimeout(() => { ov.remove(); resolve(); }, 700);
        }, 5200);
      });
    },
  };

  /* ============================================================
     7c. 密码锁
     ============================================================ */
  const Lock = {
    inited: false,
    input: '',
    uvOn: false,

    init() {
      if (this.inited) return;
      this.inited = true;

      const rows = [
        'qwertyuiop'.split(''),
        'asdfghjkl'.split(''),
        'zxcvbnm'.split(''),
      ];
      const box = $('#lock-keys');
      box.innerHTML = '';
      rows.forEach((r) => {
        const rd = document.createElement('div');
        rd.className = 'lk-row';
        r.forEach((ch) => {
          const k = document.createElement('div');
          k.className = 'lk-key';
          k.dataset.k = ch;
          // fp-num = 紫光下的目标值；my-num = 你按出来的当前值
          k.innerHTML = '<span class="lk-ch">' + ch + '</span>'
            + '<span class="fp-num"></span><span class="my-num"></span>';
          k.addEventListener('click', (e) => { e.stopPropagation(); this.press(ch); });
          rd.appendChild(k);
        });
        box.appendChild(rd);
      });
      const last = document.createElement('div');
      last.className = 'lk-row';
      const del = document.createElement('div');
      del.className = 'lk-key wide';
      del.textContent = '退格';
      del.addEventListener('click', (e) => { e.stopPropagation(); this.backspace(); });
      const clr = document.createElement('div');
      clr.className = 'lk-key wide';
      clr.textContent = '清空';
      clr.addEventListener('click', (e) => { e.stopPropagation(); this.clear(); });
      last.appendChild(del);
      last.appendChild(clr);
      box.appendChild(last);

      document.addEventListener('keydown', (e) => {
        if (!App.isCurrent('lock')) return;
        if (/^[a-zA-Z]$/.test(e.key)) { e.preventDefault(); this.press(e.key.toLowerCase()); }
        if (e.key === 'Backspace') { e.preventDefault(); this.backspace(); }
        if (e.key === 'Enter') { e.preventDefault(); this.check(); }
      });

      // 紫光灯
      $('#uv-lamp').addEventListener('click', (e) => { e.stopPropagation(); this.toggleUV(); });
    },

    start() {
      this.init();
      this.input = '';
      this.uvOn = false;
      $('#uv-lamp').classList.remove('active');
      $('#uv-lamp').classList.toggle('got', State.hasUV);
      $('.lock-case').classList.remove('uvmode');
      $('#lock-hint').textContent = '便签上写着：' + PUZZLE.length + ' 位';
      this.render();
      this.resetHint();

      // 紫光灯没拿时的兜底
      let back = $('.lock-back');
      if (!back) {
        back = document.createElement('div');
        back.className = 'lock-back';
        back.textContent = '回柜台去拿';
        $('.lock-side').appendChild(back);
        back.addEventListener('click', async (e) => {
          e.stopPropagation();
          await Fade.through(() => { App.show('counter'); Counter.init(); });
        });
      }
      back.classList.toggle('on', !State.hasUV);
      $('#uv-note').textContent = State.hasUV
        ? '点击紫光灯，照键盘。'
        : '柜子里有一支紫光灯。';

      if (State.hasUV) Snd.tone(400, 0.6, { type: 'triangle', gain: 0.04 });
    },

    press(ch) {
      if (this.input.length >= PUZZLE.length) return;
      Snd.init();
      this.input += ch;
      Snd.key();
      const k = $(`.lk-key[data-k="${ch}"]`);
      if (k) {
        k.classList.add('pressed');
        setTimeout(() => k.classList.remove('pressed'), 140);
      }
      this.render();
      if (this.input.length === PUZZLE.length) setTimeout(() => this.check(), 320);
    },

    backspace() {
      if (!this.input) return;
      Snd.tone(300, 0.05, { type: 'square', gain: 0.04 });
      this.input = this.input.slice(0, -1);
      this.render();
    },

    clear() {
      if (!this.input) return;
      Snd.tone(220, 0.06, { type: 'square', gain: 0.04 });
      this.input = '';
      this.render();
    },

    resetHint() {
      $('#lock-hint').textContent =
        '便签：密码 ' + PUZZLE.length + ' 位　·　从右往左数，第几位就算几；同一个键出现几次，把这几个数加起来。';
    },

    render() {
      const n = PUZZLE.length;
      const raw = (this.input + '_'.repeat(n)).slice(0, n);
      const el = $('#lock-display');
      // 7~26 位跨度很大，字号按位数自适应
      if (n <= 10) {
        el.textContent = raw.split('').join(' ');
        el.style.fontSize = '34px';
        el.style.letterSpacing = '.4em';
        el.style.paddingLeft = '.5em';
      } else if (n <= 16) {
        el.textContent = raw.split('').join(' ');
        el.style.fontSize = '23px';
        el.style.letterSpacing = '.24em';
        el.style.paddingLeft = '.24em';
      } else if (n <= 21) {
        el.textContent = raw;
        el.style.fontSize = '19px';
        el.style.letterSpacing = '.22em';
        el.style.paddingLeft = '.22em';
      } else {
        el.textContent = raw;
        el.style.fontSize = '16px';
        el.style.letterSpacing = '.14em';
        el.style.paddingLeft = '.14em';
      }
      this.renderMine();
    },

    /* 把你按出来的指纹实时标在键上，方便和紫光下的目标值对照 */
    renderMine() {
      const mine = fingerprintOf(this.input);
      const showTarget = this.uvOn;          // 没照紫光就看不到目标，对照也就无从谈起
      $$('.lk-key').forEach((k) => {
        const ch = k.dataset.k;
        if (!ch) return;
        const target = PUZZLE.prints[ch] || 0;
        const cur = mine[ch] || 0;
        const el = k.querySelector('.my-num');
        if (el) el.textContent = cur ? String(cur) : '';
        k.classList.toggle('over', showTarget && cur > target);
        k.classList.toggle('ok', showTarget && target > 0 && cur === target);
      });
    },

    check() {
      const ok = checkSequence(this.input);
      const disp = $('#lock-display');
      if (ok) {
        Snd.ok();
        disp.style.color = '#fff';
        Snd.tone(520, 0.5, { type: 'triangle', gain: 0.08 });
        Snd.tone(780, 0.7, { type: 'triangle', gain: 0.06, delay: 0.12 });
        State.seq = this.input;
        setTimeout(async () => {
          await Fade.through(() => { App.show('win98'); Win98.start(); });
        }, 900);
      } else {
        Snd.deny();
        disp.classList.add('err');
        // 不清空：保留你按的内容，退格改，边改边看键上的对照
        $('#lock-hint').textContent =
          '指纹对不上。键上方的小字是你按出来的数——按退格改，让它和紫光下的数字一样。';
        setTimeout(() => {
          disp.classList.remove('err');
          this.resetHint();
        }, 2200);
      }
    },

    toggleUV() {
      if (!State.hasUV) {
        Snd.deny();
        Toast.show('（你手里没有能照出痕迹的东西。）');
        return;
      }
      Snd.init();
      this.uvOn = !this.uvOn;
      $('#uv-lamp').classList.toggle('active', this.uvOn);
      const lockCase = $('.lock-case');
      lockCase.classList.toggle('uvmode', this.uvOn);

      if (this.uvOn) {
        Snd.uvOn();
        $$('.lk-key').forEach((k) => {
          const ch = k.dataset.k;
          const p = PUZZLE.prints[ch];
          if (p) {
            k.classList.add('uv');
            k.querySelector('.fp-num').textContent = p;
          }
        });
        $('#lock-hint').textContent =
          '紫光下的数字是「从右往左第几位」的和。键上方的小字是你按出来的，一致就开门。';
        this.renderMine();
      } else {
        Snd.uvOff();
        $$('.lk-key').forEach((k) => k.classList.remove('uv'));
        this.resetHint();
        this.renderMine();
      }
    },
  };

  global.Rhythm = Rhythm;
  global.Pry = Pry;
  global.Lock = Lock;
})(window);
