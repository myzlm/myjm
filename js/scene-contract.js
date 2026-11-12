/* ============================================================
   scene-contract.js — 机械化欢迎 / 递交合同 / 20 秒黑暗 / 突脸
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Fade, Shake, Toast, rnd, irnd } = global.G;

  const Contract = {
    inited: false,
    busy: false,
    fpFilled: false,
    fpTimer: null,
    fpStart: 0,
    rain: null,

    init() {
      if (!this.inited) {
        this.inited = true;
        this.bindForm();
      }
    },

    async start() {
      this.init();
      this.busy = true;

      // 复位
      $('#ct-voice').classList.remove('on');
      $('#voice-line').innerHTML = '';
      $('#ct-room').classList.remove('on');
      $('#contract-paper').classList.remove('on');
      $('#ct-figure').classList.remove('on');
      $('#ct-figure-near').classList.remove('on');
      $('#ct-hint').classList.remove('on');
      $('#form-wrap').classList.remove('on');
      $('.contract-doc').classList.remove('signed');

      if (!this.rain) {
        this.rain = new G.CodeRain($('#ct-rain'), { color: '#35ff8b', speed: .5, opacity: .32, fontSize: 11 });
      } else {
        setTimeout(() => this.rain.resize(), 30);
      }

      Snd.init();

      // ---- 1. 机械化欢迎 ----
      const voice = $('#ct-voice');
      const line = $('#voice-line');
      voice.classList.add('on');
      await wait(600);
      await this.speak(line, TEXT.voice);
      await wait(1100);
      voice.classList.remove('on');
      await wait(700);

      // ---- 2. 房间 ----
      $('#ct-room').classList.add('on');
      Snd.tone(58, 4, { type: 'sine', gain: 0.05, attack: 1.6 });
      await wait(900);

      // ---- 3. 合同出现 ----
      $('#contract-paper').classList.add('on');
      Snd.tone(520, 0.4, { type: 'triangle', gain: 0.05 });
      await wait(1400);

      // ---- 4. 人影出现在柜台前，拿起合同 ----
      $('#ct-figure').classList.add('on');
      Snd.noise(0.6, { type: 'bandpass', freq: 300, q: .7, gain: 0.08 });
      await wait(700);

      // 拿走合同
      const paper = $('#contract-paper');
      paper.style.transition = 'transform .55s cubic-bezier(.4,0,.7,1), opacity .55s';
      paper.style.transform = 'translateX(-38%) translateY(-26%) scale(.72) rotate(-9deg)';
      paper.style.opacity = '0';
      Snd.noise(0.35, { type: 'highpass', freq: 2200, gain: 0.06 });
      await wait(620);

      $('#ct-figure').classList.remove('on');
      Snd.tone(90, 0.5, { type: 'sine', gain: 0.09, to: 40 });
      await wait(420);

      // ---- 5. 瞬移到面前（这一瞬头身分离）----
      const near = $('#ct-figure-near');
      near.classList.add('on');
      near.classList.add('sep');
      Shake.start($('.ct-scene'), 14, 24);
      Snd.boo();
      // 低沉的持续压迫
      Snd.tone(46, 3.4, { type: 'sine', gain: 0.1, attack: .3 });

      await wait(430);
      near.classList.remove('sep');
      await wait(700);
      Shake.stop();

      // ---- 6. 他把合同递回来 ----
      $('#ct-hint').textContent = '（他没有脸。但你知道他在看你。）';
      $('#ct-hint').classList.add('on');
      await wait(1600);

      $('#ct-hint').textContent = '（他把一张纸推到你面前。纸是新的。）';
      await wait(1500);

      // ---- 7. 表单 ----
      near.classList.remove('on');
      paper.style.opacity = '';
      paper.style.transform = '';
      paper.style.transition = '';
      $('#ct-hint').classList.remove('on');
      this.resetForm();
      $('#form-wrap').classList.add('on');
      Snd.tone(300, 0.6, { type: 'triangle', gain: 0.05 });

      this.busy = false;
    },

    /* 机械化的"逐字发声" */
    async speak(el, text) {
      const chars = Array.from(text);
      for (let i = 0; i < chars.length; i++) {
        const c = chars[i];
        const span = document.createElement('span');
        span.className = 'vch';
        span.textContent = c;
        el.appendChild(span);
        if (c !== '—' && c !== ' ') Snd.robotSyl(i, chars.length);
        // 破折号停顿长
        await wait(c === '—' ? 300 : 168);
      }
    },

    /* ---------------- 表单 ---------------- */
    bindForm() {
      const fpBox = $('#fp-box');
      const fpRing = $('#fp-ring');

      const startPress = (e) => {
        e.preventDefault();
        if (this.fpFilled) return;
        Snd.init();
        this.fpStart = performance.now();
        fpBox.classList.add('pressing');
        let lastTick = 0;
        const total = 1150;
        const step = (t) => {
          if (!this.fpStart) return;
          const p = Math.min(1, (t - this.fpStart) / total);
          const deg = p * 360;
          fpRing.style.background =
            `conic-gradient(#7a2b2b ${deg}deg, rgba(0,0,0,0) ${deg}deg)`;
          if (p - lastTick > 0.16) { lastTick = p; Snd.charge(p); }
          if (p >= 1) { this.fillFP(); return; }
          this.fpTimer = requestAnimationFrame(step);
        };
        this.fpTimer = requestAnimationFrame(step);
      };

      const endPress = () => {
        if (this.fpFilled) return;
        cancelAnimationFrame(this.fpTimer);
        this.fpTimer = null;
        this.fpStart = 0;
        fpBox.classList.remove('pressing');
        fpRing.style.background = 'conic-gradient(#7a2b2b 0deg, transparent 0deg)';
        Snd.tone(140, 0.12, { type: 'square', gain: 0.06 });
      };

      fpBox.addEventListener('pointerdown', startPress);
      fpBox.addEventListener('pointerup', endPress);
      fpBox.addEventListener('pointerleave', endPress);
      fpBox.addEventListener('pointercancel', endPress);

      // 输入监听
      ['#in-name', '#in-job'].forEach((sel) => {
        $(sel).addEventListener('input', () => this.validate());
        $(sel).addEventListener('keydown', (e) => {
          e.stopPropagation();
          if (e.key === 'Enter') this.submit();
        });
      });
      $$('input[name="sex"]').forEach((r) => r.addEventListener('change', () => this.validate()));
      $('#doc-submit').addEventListener('click', () => this.submit());
    },

    fillFP() {
      this.fpFilled = true;
      this.fpStart = 0;
      cancelAnimationFrame(this.fpTimer);
      $('#fp-box').classList.remove('pressing');
      $('#fp-box').classList.add('filled');
      $('#fp-ring').style.background = 'conic-gradient(#7a2b2b 360deg, #7a2b2b 360deg)';
      Snd.ok();
      Snd.tone(880, 0.5, { type: 'triangle', gain: 0.05 });

      // 指纹下方的字符：唯一，依据本机硬件生成
      const fpc = $('#fp-code');
      const fp = G.hwFingerprint();
      State.hwFp = fp;
      fpc.innerHTML =
        '指纹序列已归档<br>' +
        '<b>' + fp + '</b><br>' +
        '<span style="opacity:.65">（这不是你的指纹。这是这台机器的。）</span>';
      fpc.classList.add('on');
      this.validate();
    },

    validate() {
      const name = $('#in-name').value.trim();
      const job = $('#in-job').value.trim();
      const sex = $('input[name="sex"]:checked');
      const ok = !!(name && job && sex && this.fpFilled);
      $('#doc-submit').disabled = !ok;
      return ok;
    },

    resetForm() {
      this.fpFilled = false;
      $('#in-name').value = '';
      $('#in-job').value = '';
      $('#in-name').disabled = false;
      $('#in-job').disabled = false;
      $$('input[name="sex"]').forEach((r) => { r.checked = false; r.disabled = false; });
      $('#fp-box').classList.remove('filled', 'pressing');
      $('#fp-ring').style.background = 'conic-gradient(#7a2b2b 0deg, transparent 0deg)';
      $('#fp-code').classList.remove('on');
      $('#fp-code').innerHTML = '';
      $('#redline').classList.remove('on');
      $('#red-36').classList.remove('on');
      $('#job-flag').classList.remove('on');
      $('#row-sex').classList.remove('gone', 'vanished');
      const btn = $('#doc-submit');
      btn.disabled = true;
      btn.textContent = '交 给 他';
      btn.style.display = '';
    },

    async submit() {
      if (this.busy) return;
      if (!this.validate()) {
        Snd.deny();
        Toast.show('还有没填完的地方。');
        return;
      }
      this.busy = true;

      const name = $('#in-name').value.trim();
      const job = $('#in-job').value.trim();
      const sex = $('input[name="sex"]:checked').value;

      State.playerName = name;
      State.job = job;
      State.sex = sex;
      State.jobIsCode = G.isCodeJob(job);
      State.jobIsMusic = G.isMusicJob(job);

      Snd.click();
      const doc = $('.contract-doc');
      doc.classList.add('signed');
      $('#in-name').disabled = true;
      $('#in-job').disabled = true;
      $$('input[name="sex"]').forEach((r) => { r.disabled = true; });
      $('#doc-submit').style.display = 'none';

      await wait(420);

      // 1) 名字被划掉，旁边红笔写"三十六"
      $('#redline').classList.add('on');
      Snd.noise(0.4, { type: 'bandpass', freq: 1200, q: 2, gain: 0.06 });
      await wait(560);
      $('#red-36').classList.add('on');
      Snd.tone(180, 0.3, { type: 'sawtooth', gain: 0.07 });
      await wait(520);

      // 2) 性别一栏消失
      const rowSex = $('#row-sex');
      rowSex.classList.add('gone');
      Snd.glitch(0.34);
      await wait(1150);
      rowSex.classList.add('vanished');

      // 3) 职业判定
      if (State.jobIsCode) {
        $('#job-flag').classList.add('on');
        Snd.tone(120, 0.5, { type: 'square', gain: 0.06 });
        await wait(900);
      }

      // 4) 纸被抽走
      await wait(1400);
      Snd.noise(0.3, { type: 'highpass', freq: 1800, gain: 0.07 });
      doc.style.transition = 'transform .7s cubic-bezier(.6,0,.8,1), opacity .7s';
      doc.style.transform = 'translateY(-40px) scale(.92) rotate(-1deg)';
      doc.style.opacity = '0';
      await wait(760);

      $('#form-wrap').classList.remove('on');
      doc.style.transition = '';
      doc.style.transform = '';
      doc.style.opacity = '';

      // 5) 20 秒黑暗
      Dark.start();
      this.busy = false;
    },
  };

  /* ============================================================
     20 秒黑暗 → 突脸 → 柜台
     ============================================================ */
  const Dark = {
    running: false,
    clicks: 0,

    async start() {
      if (this.running) return;
      this.running = true;
      this.clicks = 0;
      State.darkClicks = 0;

      await Fade.through(() => {
        App.show('dark');
        $('#dark-room').classList.remove('hidden');
        $('#dark-hint').textContent = TEXT.darkHint;
        $('#dark-hint').style.color = '#0d0d0d';
      }, true);

      Snd.startDrone();

      const room = $('#dark-room');
      const onClick = () => {
        if (!this.running) return;
        this.clicks++;
        State.darkClicks = this.clicks;
        // 轻微反馈
        if (this.clicks % 7 === 0) Snd.tone(70 + Math.random() * 40, 0.06, { type: 'sine', gain: 0.03 });
        if (this.clicks === 40) { $('#dark-hint').textContent = '……'; $('#dark-hint').style.color = '#1a1a1a'; }
        if (this.clicks === 70) { $('#dark-hint').style.color = '#242424'; }
        if (this.clicks >= 100 && !State.achievementRush) {
          State.achievementRush = true;
          G.Ach.show('急也没用', '在黑暗里按了一百下。', 4600);
          Snd.tone(300, 0.4, { type: 'triangle', gain: 0.04 });
        }
      };
      room.addEventListener('pointerdown', onClick);

      // 20 秒
      const t0 = performance.now();
      await new Promise((r) => {
        const check = () => {
          const el = performance.now() - t0;
          if (el >= 20000) r();
          else requestAnimationFrame(check);
        };
        requestAnimationFrame(check);
      });

      room.removeEventListener('pointerdown', onClick);
      Snd.stopDrone(0.4);
      this.running = false;

      await this.scare();
    },

    async scare() {
      await Fade.through(() => {
        App.show('doll');
        const img = $('#doll-img');
        // 图片加载失败时用 CSS 兜底
        img.onerror = () => {
          img.style.display = 'none';
          const stage = $('#doll-stage');
          if (!stage.querySelector('.doll-fallback')) {
            const d = document.createElement('div');
            d.className = 'doll-fallback';
            d.innerHTML = '<div class="df-face"><i class="df-eye l"></i><i class="df-eye r"></i>'
              + '<i class="df-mouth"></i><i class="df-line a"></i><i class="df-line b"></i>'
              + '<i class="df-blush l"></i><i class="df-blush r"></i></div>';
            stage.appendChild(d);
          }
        };
        if (img.complete && img.naturalWidth === 0) img.onerror();
      }, true);

      Snd.boo();
      G.Shake.start($('#doll-stage'), 10, 26);
      await wait(1200);
      G.Shake.stop();

      await Fade.on(true);
      await wait(420);

      // 黑一下
      App.show('counter');
      Counter.init();
      await Fade.off(900);
    },
  };

  global.Contract = Contract;
  global.Dark = Dark;
})(window);
