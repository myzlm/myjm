/* ============================================================
   audio.js — 全程序化音频合成，无外部素材
   ============================================================ */
(function (global) {
  'use strict';

  const A = {
    ctx: null,
    master: null,
    musicGain: null,
    sfxGain: null,
    drone: null,
    droneGain: null,
    ready: false,
    muted: false,
  };

  function init() {
    if (A.ctx) {
      if (A.ctx.state === 'suspended') A.ctx.resume();
      return A.ctx;
    }
    const Ctx = global.AudioContext || global.webkitAudioContext;
    if (!Ctx) return null;
    A.ctx = new Ctx();

    A.master = A.ctx.createGain();
    A.master.gain.value = 0.9;
    A.master.connect(A.ctx.destination);

    A.musicGain = A.ctx.createGain();
    A.musicGain.gain.value = 0.55;
    A.musicGain.connect(A.master);

    A.sfxGain = A.ctx.createGain();
    A.sfxGain.gain.value = 0.85;
    A.sfxGain.connect(A.master);

    A.ready = true;
    if (A.ctx.state === 'suspended') A.ctx.resume();
    // 配乐引擎在上下文建好之后才能起拍
    if (global.Music && global.Music.boot) setTimeout(() => global.Music.boot(), 0);
    return A.ctx;
  }

  function now() { return A.ctx ? A.ctx.currentTime : 0; }

  function noiseBuffer(dur) {
    const sr = A.ctx.sampleRate;
    const len = Math.max(1, Math.floor(sr * dur));
    const buf = A.ctx.createBuffer(1, len, sr);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  /* ---------- 基础音 ---------- */
  function tone(freq, dur, o) {
    if (!A.ctx) return;
    o = o || {};
    const t = (o.at || now()) + (o.delay || 0);
    const osc = A.ctx.createOscillator();
    const g = A.ctx.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, t);
    if (o.to) osc.frequency.exponentialRampToValueAtTime(Math.max(20, o.to), t + dur);

    const peak = o.gain == null ? 0.18 : o.gain;
    const atk = o.attack == null ? 0.006 : o.attack;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);

    let node = osc;
    if (o.filter) {
      const f = A.ctx.createBiquadFilter();
      f.type = o.filter.type || 'lowpass';
      f.frequency.value = o.filter.freq || 1200;
      f.Q.value = o.filter.q || 1;
      osc.connect(f); node = f;
    }
    node.connect(g);
    g.connect(o.bus || A.sfxGain);
    osc.start(t); osc.stop(t + dur + 0.03);
  }

  function noise(dur, o) {
    if (!A.ctx) return;
    o = o || {};
    const t = (o.at || now()) + (o.delay || 0);
    const src = A.ctx.createBufferSource();
    src.buffer = noiseBuffer(Math.max(0.02, dur));
    const f = A.ctx.createBiquadFilter();
    f.type = o.type || 'bandpass';
    f.frequency.setValueAtTime(o.freq || 1600, t);
    if (o.to) f.frequency.exponentialRampToValueAtTime(Math.max(30, o.to), t + dur);
    f.Q.value = o.q == null ? 1.1 : o.q;
    const g = A.ctx.createGain();
    const peak = o.gain == null ? 0.16 : o.gain;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + (o.attack || 0.004));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(o.bus || A.sfxGain);
    src.start(t); src.stop(t + dur + 0.02);
  }

  function chord(freqs, dur, o) {
    freqs.forEach((f, i) => {
      tone(f, dur, Object.assign({}, o, {
        type: (o && o.type) || 'triangle',
        gain: ((o && o.gain) || 0.1) / Math.sqrt(freqs.length),
        delay: ((o && o.delay) || 0) + i * 0.006,
      }));
    });
  }

  /* ---------- 常用音效 ---------- */
  const S = {
    init,
    ready: () => A.ready,
    setMute(m) {
      if (!A.master) return;
      A.master.gain.value = m ? 0.0001 : 0.9;
    },
    /* 音乐总线：节奏关失败时可整体压低，避免上一轮已调度的音符继续响 */
    get music() { return A.musicGain; },
    duckMusic(v) {
      if (!A.musicGain) return;
      A.musicGain.gain.cancelScheduledValues(now());
      A.musicGain.gain.setTargetAtTime(v, now(), 0.03);
    },

    click() { tone(880, 0.05, { type: 'square', gain: 0.05 }); },
    hover() { tone(1320, 0.03, { type: 'sine', gain: 0.025 }); },
    key() {
      noise(0.045, { freq: 2600 + Math.random() * 900, q: 2.4, gain: 0.07 });
      tone(160 + Math.random() * 40, 0.05, { type: 'square', gain: 0.03 });
    },
    deny() {
      tone(180, 0.14, { type: 'square', gain: 0.1 });
      tone(140, 0.22, { type: 'square', gain: 0.08, delay: 0.09 });
    },
    ok() {
      tone(660, 0.1, { type: 'triangle', gain: 0.08 });
      tone(990, 0.18, { type: 'triangle', gain: 0.07, delay: 0.07 });
    },
    window() {
      tone(720, 0.1, { type: 'sine', gain: 0.07 });
      tone(1080, 0.16, { type: 'sine', gain: 0.05, delay: 0.06 });
    },
    glitch(dur) {
      dur = dur || 0.25;
      noise(dur, { type: 'bandpass', freq: 400, to: 3200, q: 0.7, gain: 0.14 });
      tone(70, dur, { type: 'sawtooth', gain: 0.07, to: 38 });
      for (let i = 0; i < 5; i++) {
        tone(200 + Math.random() * 1800, 0.03, { type: 'square', gain: 0.035, delay: Math.random() * dur });
      }
    },

    /* 突脸：爆音 + 下扫 + 失真 */
    boo() {
      if (!A.ctx) return;
      noise(0.9, { type: 'lowpass', freq: 6000, to: 180, q: 0.6, gain: 0.5 });
      tone(900, 0.7, { type: 'sawtooth', gain: 0.24, to: 42 });
      tone(450, 0.9, { type: 'square', gain: 0.16, to: 28, delay: 0.02 });
      noise(0.25, { type: 'highpass', freq: 3800, gain: 0.2 });
      setTimeout(() => {
        tone(55, 1.6, { type: 'sine', gain: 0.16, to: 30 });
        noise(1.2, { type: 'bandpass', freq: 220, q: 0.9, gain: 0.08 });
      }, 220);
    },

    /* 机械化的"字"音 */
    robotSyl(i, total) {
      if (!A.ctx) return;
      const t = now();
      const base = 128 - (i / Math.max(1, total)) * 26 + (Math.random() * 8 - 4);
      // 共振峰近似
      [1, 2.02, 3.1].forEach((mul, k) => {
        const f = A.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = base * mul * (1 + Math.random() * 0.06);
        f.Q.value = 6 + k * 2;
        const osc = A.ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = base;
        const g = A.ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.exponentialRampToValueAtTime(0.055 / (k + 1), t + 0.02);
        g.gain.exponentialRampToValueAtTime(0.0001, t + 0.3);
        osc.connect(f); f.connect(g); g.connect(A.sfxGain);
        osc.start(t); osc.stop(t + 0.34);
      });
      noise(0.03, { type: 'highpass', freq: 3000, gain: 0.03 });
    },

    /* 20 秒黑暗里的低频压迫 */
    startDrone() {
      if (!A.ctx || A.drone) return;
      const g = A.ctx.createGain();
      g.gain.value = 0.0001;
      g.connect(A.master);
      const o1 = A.ctx.createOscillator();
      o1.type = 'sine'; o1.frequency.value = 42;
      const o2 = A.ctx.createOscillator();
      o2.type = 'sine'; o2.frequency.value = 42.7;
      o1.connect(g); o2.connect(g);
      o1.start(); o2.start();
      g.gain.exponentialRampToValueAtTime(0.1, now() + 2.5);
      A.drone = { o1, o2, g };
      A.droneGain = g;
    },
    stopDrone(fade) {
      if (!A.drone) return;
      const { o1, o2, g } = A.drone;
      const t = now();
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + (fade || 0.8));
      setTimeout(() => { try { o1.stop(); o2.stop(); } catch (e) {} }, (fade || 0.8) * 1000 + 120);
      A.drone = null; A.droneGain = null;
    },

    /* 紫光灯电流声 */
    uvOn() {
      if (!A.ctx) return;
      const g = A.ctx.createGain();
      g.gain.value = 0.0001;
      g.connect(A.sfxGain);
      const o = A.ctx.createOscillator();
      o.type = 'sawtooth'; o.frequency.value = 100;
      const f = A.ctx.createBiquadFilter();
      f.type = 'bandpass'; f.frequency.value = 800; f.Q.value = 3;
      o.connect(f); f.connect(g); o.start();
      g.gain.exponentialRampToValueAtTime(0.035, now() + 0.4);
      A.uv = { o, g };
    },
    uvOff() {
      if (!A.uv) return;
      const { o, g } = A.uv;
      const t = now();
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
      setTimeout(() => { try { o.stop(); } catch (e) {} }, 320);
      A.uv = null;
    },

    /* 打印机步进 */
    printer(dur) {
      const steps = Math.floor((dur || 2) * 26);
      for (let i = 0; i < steps; i++) {
        noise(0.028, { type: 'bandpass', freq: 900, q: 4, gain: 0.05, delay: i * 0.038 });
        if (i % 4 === 0) tone(160, 0.05, { type: 'square', gain: 0.03, delay: i * 0.038 });
      }
    },

    /* 长按蓄力 */
    charge(p) {
      tone(180 + p * 520, 0.09, { type: 'sine', gain: 0.035 });
    },

    /* 敲击重音 */
    kick() {
      tone(132, 0.22, { type: 'sine', gain: 0.34, to: 42 });
      noise(0.05, { type: 'lowpass', freq: 900, gain: 0.1 });
    },
    hat() { noise(0.04, { type: 'highpass', freq: 7200, gain: 0.055 }); },
    snare() {
      noise(0.11, { type: 'bandpass', freq: 1900, q: 1.2, gain: 0.09 });
      tone(220, 0.09, { type: 'triangle', gain: 0.05 });
    },
    bass(freq, dur) {
      tone(freq, dur, { type: 'sawtooth', gain: 0.1, filter: { type: 'lowpass', freq: 420, q: 4 } });
    },

    /* 撬动 */
    pry() {
      noise(0.09, { type: 'bandpass', freq: 2400, q: 3, gain: 0.08 });
      tone(320 + Math.random() * 120, 0.06, { type: 'square', gain: 0.03 });
    },
    pryDone() {
      noise(0.5, { type: 'lowpass', freq: 2200, to: 300, gain: 0.16 });
      tone(90, 0.4, { type: 'sine', gain: 0.12, to: 40 });
    },
    sneeze() {
      noise(0.16, { type: 'bandpass', freq: 1400, q: 0.8, gain: 0.28 });
      setTimeout(() => noise(0.3, { type: 'lowpass', freq: 1800, gain: 0.22 }), 150);
    },
    // 可外部调用
    tone, noise, chord,
    get ctx() { return A.ctx; },
  };

  global.Snd = S;
})(window);
