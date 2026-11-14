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

      // 下载页
      $('#btn-dl').addEventListener('click', () => Download.start());
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
  };

  const Download = {
    inited: false,
    running: false,
    init() {
      if (this.inited) return;
      this.inited = true;
      $('#dl-actions').classList.remove('hidden');
      $('#dl-progress').classList.remove('on');
      $('#dl-run').classList.remove('on');
      $('#dlp-fill').style.width = '0%';
      $('#dlp-pct').textContent = '0%';
      $('#dl-actions').style.display = '';
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
