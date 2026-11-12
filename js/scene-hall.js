/* ============================================================
   scene-hall.js — 记忆殿：离开 / 前往
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Fade, Shake, Toast } = global.G;

  const Hall = {
    rain: null,
    inited: false,
    busy: false,

    init() {
      const hall = $('#screen-hall .hall');

      if (!this.rain) {
        this.rain = new G.CodeRain($('#code-rain'), { color: '#35ff8b', speed: 1, opacity: .7, fontSize: 13 });
      } else {
        setTimeout(() => this.rain.resize(), 30);
      }

      // 复位视觉
      hall.classList.remove('hot', 'seizure');
      $('#code-rain').classList.remove('fast');
      this.rain.set({ color: '#35ff8b', speed: 1, opacity: .7 });

      // 恢复台词
      $('#hall-line1').textContent = '欢迎来到记忆殿。';
      $('#hall-line2').innerHTML = '您是第 <span class="num">36</span> 个来到这里的人。';
      $('#hall-line3').textContent = '前三十五个，都已经归档了。';

      // 离开按钮
      const leave = $('#btn-leave');
      const note = $('#hall-note');
      if (State.leftClicked) {
        leave.style.display = 'none';
        $('#hall-line1').textContent = '重置完成。';
        $('#hall-line2').innerHTML = '您仍是第 <span class="num">36</span> 个来到这里的人。';
        $('#hall-line3').textContent = '现在是第几遍了，已经不重要。';
        note.textContent = TEXT.hallAfterReboot;
        setTimeout(() => note.classList.add('on'), 1600);
      } else {
        leave.style.display = '';
        note.classList.remove('on');
        note.textContent = '';
      }

      // 台词逐行显现
      $$('#screen-hall .hall-line').forEach((el) => el.classList.remove('on'));
      const lines = $$('#screen-hall .hall-line');
      lines.forEach((el, i) => setTimeout(() => el.classList.add('on'), 420 + i * 760));

      if (!this.inited) {
        this.inited = true;
        leave.addEventListener('click', () => this.doLeave());
        $('#btn-go').addEventListener('click', () => this.doGo());
      }

      Snd.init();
      Snd.tone(60, 3.2, { type: 'sine', gain: 0.05, attack: 1.2 });
    },

    /* ---------- 离开：抽搐 → 红光 → 未响应 → 重启 ---------- */
    async doLeave() {
      if (this.busy || State.leftClicked) return;
      this.busy = true;
      State.leftClicked = true;

      const hall = $('#screen-hall .hall');
      const leave = $('#btn-leave');

      Snd.init();
      Snd.deny();

      // 1. 抽搐 + 红光 + 代码流狂飙
      hall.classList.add('hot', 'seizure');
      this.rain.set({ color: '#ff3b3b', speed: 9, opacity: .95 });
      $('#code-rain').classList.add('fast');
      leave.textContent = '';
      leave.style.borderColor = '#5a1a1a';

      Snd.glitch(0.5);
      let gTick = 0;
      const gInt = setInterval(() => {
        Snd.glitch(0.12 + Math.random() * 0.2);
        if (++gTick > 12) clearInterval(gInt);
      }, 160);

      // 文字也变形
      const line2 = $('#hall-line2');
      const origHTML = line2.innerHTML;
      const junk = '▓▒░█▚▞01#@%&';
      const scramble = setInterval(() => {
        line2.innerHTML = Array.from({ length: 14 }, () => junk[Math.floor(Math.random() * junk.length)]).join('');
      }, 45);

      await wait(1900);

      // 2. 未响应
      clearInterval(scramble);
      line2.innerHTML = origHTML;
      const ov = $('#ov-notresp');
      ov.classList.add('on');
      Snd.tone(110, 0.6, { type: 'square', gain: 0.1 });

      let killed = false;
      const killHandler = () => { killed = true; };
      $('#nr-kill').addEventListener('click', killHandler, { once: true });
      $('#nr-wait').addEventListener('click', () => {
        Snd.click();
        Toast.show('（等待没有用。）', 1600);
      }, { once: true });

      await wait(2600);
      if (!killed) {
        // 自动进入重启
      }
      ov.classList.remove('on');

      // 3. 重启
      clearInterval(gInt);
      $('#code-rain').classList.remove('fast');
      hall.classList.remove('hot', 'seizure');
      this.rain.set({ color: '#35ff8b', speed: 1, opacity: .7 });

      await this.reboot();

      // 4. 回到 hall
      leave.style.display = 'none';
      leave.textContent = '离开';
      leave.style.borderColor = '';
      $('#hall-line1').textContent = '重置完成。';
      $('#hall-line2').innerHTML = '您仍是第 <span class="num">36</span> 个来到这里的人。';
      $('#hall-line3').textContent = '现在是第几遍了，已经不重要。';
      $$('#screen-hall .hall-line').forEach((el, i) => {
        el.classList.remove('on');
        setTimeout(() => el.classList.add('on'), 300 + i * 900);
      });
      const note = $('#hall-note');
      note.textContent = TEXT.hallAfterReboot;
      setTimeout(() => note.classList.add('on'), 2200);

      this.busy = false;
    },

    async reboot() {
      const ov = $('#ov-reboot');
      const txt = $('#rb-text');
      const fill = $('#rb-fill');

      ov.classList.add('on');
      fill.style.width = '0%';
      txt.textContent = '正在重新启动，请稍候……';

      Snd.stopDrone(0.4);
      Snd.tone(70, 2.4, { type: 'sine', gain: 0.06, attack: 1.0, to: 40 });

      await wait(700);
      for (let i = 0; i <= 100; i += 2) {
        fill.style.width = i + '%';
        await wait(22);
      }
      await wait(500);
      txt.textContent = '';
      await wait(340);
      // 闪烁两下
      for (let i = 0; i < 3; i++) {
        ov.style.opacity = '0.15';
        await wait(80);
        ov.style.opacity = '1';
        await wait(120);
      }
      ov.classList.remove('on');
      ov.style.opacity = '';
      Snd.tone(420, 0.5, { type: 'triangle', gain: 0.06 });
      State.rebooted = true;
    },

    /* ---------- 前往 ---------- */
    async doGo() {
      if (this.busy) return;
      this.busy = true;
      Snd.init();
      Snd.ok();
      await Fade.through(() => {
        App.show('contract');
        Contract.start();
      }, false);
      this.busy = false;
    },
  };

  global.Hall = Hall;
})(window);
