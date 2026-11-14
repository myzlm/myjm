/* ============================================================
   scene-ch0.js — 序章 · 登录地球online
   ------------------------------------------------------------
   邮件里给了地址和口令。点进来，是一张很旧的登录框。
   服务器只有一台可选，而且它自己也不确定在不在线。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, wait, Fade, Toast } = global.G;

  const PASS = ['00110110', '36', '0110', '0b00110110'];

  const Login = {
    inited: false,
    fails: 0,
    busy: false,

    init() {
      if (this.inited) return;
      this.inited = true;
      const form = $('#lg-form');
      if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.submit(); });
      const btn = $('#lg-btn');
      if (btn) btn.addEventListener('click', () => this.submit());
      const inp = $('#lg-pass');
      if (inp) inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); this.submit(); } });
      const guest = $('#lg-guest');
      if (guest) guest.addEventListener('click', () => {
        Toast.show('访客通道已关闭。要进去，得有名有姓。', 2600);
      });
      const hint = $('#lg-hint');
      if (hint) hint.addEventListener('click', () => {
        this.fails = Math.max(this.fails, 1);
        this.status('提示：口令是"第 36 个"的二进制写法。八位。', 'hint');
      });
    },

    start() {
      this.init();
      $('#lg-pass').value = '';
      $('#lg-err').textContent = '';
      this.status('就绪。', '');
      setTimeout(() => { try { $('#lg-pass').focus(); } catch (e) {} }, 400);
    },

    status(t, cls) {
      const el = $('#lg-status');
      if (!el) return;
      el.textContent = t;
      el.className = 'lg-status ' + (cls || '');
    },

    async submit() {
      if (this.busy) return;
      const v = ($('#lg-pass').value || '').trim().toLowerCase();
      if (!v) { this.status('请输入口令。', 'err'); return; }
      this.busy = true;
      this.status('正在校验……', 'busy');
      await wait(700);

      if (PASS.indexOf(v) < 0) {
        this.fails++;
        this.busy = false;
        const msgs = [
          '口令错误。剩余尝试次数：2。',
          '口令错误。剩余尝试次数：1。',
          '口令错误。',
        ];
        this.status(msgs[Math.min(this.fails, 3) - 1] || '口令错误。', 'err');
        $('#lg-err').textContent = this.fails >= 3
          ? '（第三次了。屏幕上浮出一行小字：\n"别猜了。写信的人已经把口令给你了。"）'
          : '';
        if (this.fails === 3) {
          global.Eggs && global.Eggs.unlock(14);
          Toast.show('有人在你看不见的地方应了一声。', 3000);
        }
        if (this.fails >= 5) {
          this.status('连接被拒绝。这个口令被记住了。', 'err');
        }
        return;
      }

      await this.enter();
    },

    async enter() {
      this.status('口令正确。正在建立连接……', 'ok');
      $('#lg-form').classList.add('dim');
      const box = $('#lg-loading');
      box.classList.add('on');
      document.dispatchEvent(new CustomEvent('ch0loading'));
      global.Eggs && global.Eggs.unlock(5, true);

      const lines = [
        '正在连接地球online服务器……',
        '握手完成。延迟 0 ms（不正常）。',
        '正在验证记忆锚点……',
        '锚点有效。第 36 号位已就绪。',
        '正在加载典当行（记忆殿 · build 0.9.36）……',
      ];
      const fill = $('#lgl-fill');
      const pct = $('#lgl-pct');
      for (let i = 0; i < lines.length; i++) {
        $('#lgl-line').textContent = lines[i];
        const target = Math.round((i + 1) / lines.length * 100);
        fill.style.width = target + '%';
        pct.textContent = target + '%';
        await wait(i === lines.length - 1 ? 900 : 520);
      }
      await wait(400);
      $('#lgl-line').textContent = '正在穿透……';
      await wait(700);
      document.body.classList.add('penetrate');
      await wait(520);
      await Fade.on(true);
      App.show('hall');
      global.Hall.init();
      document.body.classList.remove('penetrate');
      await wait(300);
      await Fade.off(700);
      this.busy = false;
    },
  };

  global.Login = Login;
})(window);
