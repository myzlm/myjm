/* ============================================================
   fx.js — 转场、抖动、代码流、提示、硬件指纹
   ============================================================ */
(function (global) {
  'use strict';

  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd = (a, b) => a + Math.random() * (b - a);
  const irnd = (a, b) => Math.floor(rnd(a, b + 1));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

  /* ---------- 淡入淡出 ---------- */
  const Fade = {
    el: null,
    on(instant) {
      this.el = this.el || $('#fade');
      if (instant) this.el.classList.add('instant');
      this.el.classList.add('on');
      if (instant) requestAnimationFrame(() => this.el.classList.remove('instant'));
      return wait(instant ? 20 : 460);
    },
    off(speed) {
      this.el = this.el || $('#fade');
      this.el.classList.remove('on');
      return wait(speed || 460);
    },
    async through(cb, instant) {
      await this.on(instant);
      if (cb) await cb();
      await wait(60);
      await this.off(instant ? 30 : 520);
    },
  };

  /* ---------- 抖动 ---------- */
  const Shake = {
    timer: null,
    start(el, amp, speed) {
      this.stop();
      el = el || document.body;
      const a = amp || 6;
      const x0 = el.style.transform;
      let t = 0;
      this.timer = setInterval(() => {
        t++;
        const x = (Math.random() * 2 - 1) * a;
        const y = (Math.random() * 2 - 1) * a;
        const r = (Math.random() * 2 - 1) * a * 0.09;
        el.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
      }, speed || 30);
      this._restore = () => { el.style.transform = x0 || ''; };
    },
    stop() {
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
      if (this._restore) { this._restore(); this._restore = null; }
    },
  };

  /* ---------- 提示 ---------- */
  let toastTimer = null;
  const Toast = {
    show(msg, dur) {
      const el = $('#toast');
      el.textContent = msg;
      el.classList.add('on');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.classList.remove('on'), dur || 2400);
    },
    hide() { $('#toast').classList.remove('on'); },
  };

  /* ---------- 成就 ---------- */
  const Ach = {
    shown: new Set(),
    show(name, desc, dur) {
      if (this.shown.has(name)) return false;
      this.shown.add(name);
      const ov = $('#ov-ach');
      $('#ach-name').textContent = name;
      $('#ach-desc').textContent = desc;
      ov.classList.add('on');
      Snd.ok();
      setTimeout(() => ov.classList.remove('on'), dur || 4200);
      return true;
    },
  };

  /* ---------- 代码流 ---------- */
  class CodeRain {
    constructor(canvas, opts) {
      this.cv = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = Object.assign({
        color: '#35ff8b',
        speed: 1,
        fontSize: 13,
        opacity: 0.75,
        density: 1,
        chars: 'アイウエオカキクケコサシスセソタチツテトナニヌネノ01{}[]();=<>/\\|+*#$%&@!?'
      }, opts || {});
      this.drops = [];
      this.raf = null;
      this.resize();
      this._onResize = () => this.resize();
      window.addEventListener('resize', this._onResize);
      this.start();
    }
    resize() {
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const r = this.cv.getBoundingClientRect();
      this.cv.width = Math.max(1, r.width * dpr);
      this.cv.height = Math.max(1, r.height * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.w = r.width; this.h = r.height;
      const cols = Math.floor(this.w / (this.opts.fontSize * 1.15));
      this.drops = Array.from({ length: cols }, () => rnd(-40, this.h / this.opts.fontSize));
    }
    set(opts) { Object.assign(this.opts, opts); }
    start() {
      if (this.raf) return;
      let last = performance.now();
      const loop = (t) => {
        this.raf = requestAnimationFrame(loop);
        const dt = Math.min(60, t - last); last = t;
        this.draw(dt / 16.67);
      };
      this.raf = requestAnimationFrame(loop);
    }
    draw(step) {
      const { ctx } = this;
      const fs = this.opts.fontSize;
      ctx.fillStyle = `rgba(0,0,0,${0.06 + 0.02 * this.opts.speed})`;
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.font = `${fs}px "Cascadia Mono", Consolas, monospace`;
      ctx.textBaseline = 'top';
      const colW = fs * 1.15;
      for (let i = 0; i < this.drops.length; i++) {
        const ch = this.opts.chars[Math.floor(Math.random() * this.opts.chars.length)];
        const x = i * colW;
        const y = this.drops[i] * fs;
        // 头部更亮
        ctx.fillStyle = this.opts.color;
        ctx.globalAlpha = this.opts.opacity;
        ctx.fillText(ch, x, y);
        ctx.globalAlpha = this.opts.opacity * 0.35;
        ctx.fillText(this.opts.chars[Math.floor(Math.random() * this.opts.chars.length)], x, y - fs);
        ctx.globalAlpha = 1;
        this.drops[i] += this.opts.speed * step * 0.45 * (0.4 + (i % 5) * 0.18);
        if (y > this.h && Math.random() > 0.975) this.drops[i] = rnd(-30, 0);
      }
    }
    destroy() {
      if (this.raf) cancelAnimationFrame(this.raf);
      this.raf = null;
      window.removeEventListener('resize', this._onResize);
    }
  }

  /* ---------- 硬件指纹（"根据主板编写"的那串字符） ---------- */
  function hwFingerprint() {
    let seed = '';
    try {
      seed += (navigator.hardwareConcurrency || 0) + '|';
      seed += (screen.width + 'x' + screen.height + 'x' + (screen.colorDepth || 0)) + '|';
      seed += (navigator.platform || '') + '|';
      seed += (Intl.DateTimeFormat().resolvedOptions().timeZone || '') + '|';
      seed += (navigator.language || '') + '|';
      // canvas 指纹
      const c = document.createElement('canvas');
      c.width = 120; c.height = 40;
      const x = c.getContext('2d');
      x.textBaseline = 'top';
      x.font = '14px monospace';
      x.fillStyle = '#f60'; x.fillRect(0, 0, 120, 40);
      x.fillStyle = '#069'; x.fillText('代码之下/36', 4, 10);
      x.fillStyle = 'rgba(102,204,0,.7)'; x.fillText('UNDER', 10, 24);
      seed += c.toDataURL().slice(-64);
    } catch (e) { seed += 'fallback'; }

    // FNV-1a 32bit 双通道 → 20 位 base32
    let h1 = 0x811c9dc5, h2 = 0x01000193;
    for (let i = 0; i < seed.length; i++) {
      h1 ^= seed.charCodeAt(i); h1 = Math.imul(h1, 0x01000193) >>> 0;
      h2 = (Math.imul(h2 ^ seed.charCodeAt(i), 0x85ebca6b) + i) >>> 0;
    }
    const B32 = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let out = '';
    let a = h1, b = h2;
    for (let i = 0; i < 20; i++) {
      const v = i % 2 === 0 ? a : b;
      out += B32[(v >>> ((i % 3) * 5)) & 31];
      a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
      b = (Math.imul(b, 22695477) + 1) >>> 0;
    }
    return out.replace(/(.{5})(?=.)/g, '$1-');
  }

  /* ---------- 职业判定 ---------- */
  const CODE_WORDS = ['程序员', '开发', '编程', '代码', '工程师', '前端', '后端', '全栈', '算法', '架构', '运维', '测试', '码农', '计算机', '软件', 'IT', 'coder', 'dev', 'program', 'engineer', '码', '程序'];
  const MUSIC_WORDS = ['音乐', '乐手', '鼓', '钢琴', '作曲', '编曲', '歌手', '演奏', '音频', '乐队', 'DJ', '音乐人', '调音', '录音', '贝斯', '吉他', '打击乐', 'music', 'drum', 'piano'];

  function isCodeJob(s) {
    const t = (s || '').toLowerCase();
    return CODE_WORDS.some((w) => t.includes(w.toLowerCase()));
  }
  function isMusicJob(s) {
    const t = (s || '').toLowerCase();
    return MUSIC_WORDS.some((w) => t.includes(w.toLowerCase()));
  }

  global.G = {
    $, $$, wait, clamp, rnd, irnd, pick,
    Fade, Shake, Toast, Ach, CodeRain, hwFingerprint, isCodeJob, isMusicJob,
  };
})(window);
