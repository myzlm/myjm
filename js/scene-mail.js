/* ============================================================
   scene-mail.js — 邮件 → 下载
   ============================================================ */
(function (global) {
  'use strict';
  const { $, wait, Fade, Toast, rnd } = global.G;

  const Mail = {
    inited: false,
    init() {
      if (this.inited) return;
      this.inited = true;

      // 邮件未读 → 点击阅读
      $('#mail-row').addEventListener('click', () => {
        Snd.init(); Snd.click();
        $('#mail-row').classList.remove('unread');
        $('.fake-link').focus && $('.fake-link').focus();
      });

      // 下载链接
      $('#download-link').addEventListener('click', async (e) => {
        e.preventDefault();
        Snd.init(); Snd.click();
        await Fade.through(() => {
          App.show('download');
          Download.init();
        });
      });

      /* 下载页自己的键，交给 Download 自己绑 —— 从存档直接回到下载页时，
         邮件屏这一屏根本没进过，绑在这儿就永远绑不上（按钮点不动）。 */
      Download.bind();
    },
  };

  const Download = {
    inited: false,
    running: false,

    /* 只绑一次。谁先进下载页谁绑，不依赖邮件屏。 */
    bind() {
      if (this.inited) return;
      this.inited = true;
      $('#btn-dl').addEventListener('click', () => this.start());
      $('#btn-dl-mirror').addEventListener('click', () => {
        Snd.deny();
        Toast.show('镜像连接超时。只有主站可用。');
      });
      $('#btn-run').addEventListener('click', async () => {
        Snd.init(); Snd.click();
        await Fade.through(() => {
          App.show('login');
          global.Login.start();
        });
      });
    },

    /* 每次进下载页都回到「还没下」的样子 */
    init() {
      this.bind();
      this.running = false;
      this._alerted = false;
      $('#dl-actions').classList.remove('hidden');
      $('#dl-actions').style.display = '';
      $('#dl-progress').classList.remove('on');
      $('#dl-run').classList.remove('on');
      $('#dlp-fill').style.width = '0%';
      $('#dlp-pct').textContent = '0%';
      const spd = $('#dlp-speed');
      const eta = $('#dlp-eta');
      if (spd) spd.textContent = '—';
      if (eta) eta.textContent = '';
    },

    /* 回来的时候：这条进度条已经走完了，别再走一遍 */
    restore() {
      this.init();
      const S = global.State || {};
      if (!S.downloaded && !S.dlDone) return false;
      $('#dl-actions').style.display = 'none';
      $('#dl-progress').classList.add('on');
      $('#dlp-fill').style.width = '100%';
      $('#dlp-pct').textContent = '100%';
      const spd = $('#dlp-speed');
      const eta = $('#dlp-eta');
      if (spd) spd.textContent = '— 校验完成 —';
      if (eta) eta.textContent = '';
      $('#dl-run').classList.add('on');
      return true;
    },

    async start() {
      if (this.running) return;
      this.running = true;
      Snd.init(); Snd.click();
      $('#dl-actions').style.display = 'none';
      $('#dl-progress').classList.add('on');
      const fill = $('#dlp-fill');
      const pct = $('#dlp-pct');
      const spd = $('#dlp-speed');
      const eta = $('#dlp-eta');

      let p = 0;
      const total = 5600;
      const t0 = performance.now();

      await new Promise((resolve) => {
        const tick = (t) => {
          const k = Math.min(1, (t - t0) / total);
          // 非线性：起步快，后面拖
          p = k < 0.7 ? k * 100 * 0.92 : 64.4 + (k - 0.7) / 0.3 * 35.6;
          p = Math.min(99.4, p);
          if (k >= 1) p = 100;
          fill.style.width = p.toFixed(1) + '%';
          pct.textContent = p.toFixed(1) + '%';
          const speed = (12.4 + Math.sin(t / 260) * 3.1 + rnd(-1, 1)).toFixed(1);
          spd.textContent = p < 100 ? speed + ' MB/s' : '— 校验完成 —';
          const left = Math.max(0, (1 - k) * 5.6);
          eta.textContent = p < 100 ? '剩余 ' + left.toFixed(1) + ' 秒' : '';

          if (p >= 62.5 && !this._alerted) {
            this._alerted = true;
            this.flashAlert();
          }
          if (p < 100) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });

      await wait(500);
      $('#dl-run').classList.add('on');
      Snd.ok();
      /* 记下来：这一条进度条走完过。关掉再开，不会再让你等第二遍。 */
      const S = global.State;
      if (S) { S.downloaded = true; S.dlDone = true; }
      try { if (global.Save) global.Save.write(); } catch (e) {}
      this.running = false;
    },

    /* 一闪而过的「Windows 安全策略阻止」 */
    async flashAlert() {
      const ov = $('#ov-alert');
      ov.classList.add('on');
      Snd.glitch(0.22);
      Snd.tone(240, 0.18, { type: 'square', gain: 0.13 });
      Snd.tone(180, 0.3, { type: 'square', gain: 0.1, delay: 0.16 });
      await wait(210);
      ov.classList.remove('on');
      await wait(90);
      // 再闪一次，更短
      ov.classList.add('on');
      ov.style.opacity = '0.55';
      await wait(70);
      ov.classList.remove('on');
      ov.style.opacity = '';
      Toast.show('（刚刚是不是弹出了什么？）', 2600);
    },
  };

  global.Mail = Mail;
  global.Download = Download;
})(window);
