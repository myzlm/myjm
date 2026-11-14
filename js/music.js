/* ============================================================
   music.js — 分层生成式配乐
   ------------------------------------------------------------
   没有音频文件。整首曲子是当场算出来的：
   一条共同的拍子，几层各自进出的声部，
   一个随剧情收紧的参数。

   参考《破云阶》的走法：
   起手只有一层，一层一层往上垒；
   旋律每四小节沿音阶抬一级，抬到顶再落回来。
   ============================================================ */
(function (global) {
  'use strict';

  const A = {
    ctx: null,
    bus: null,          // 当前主题的总线（换主题时整条淡出）
    timer: null,
    nextStepAt: 0,      // 下一个八分音符的时刻
    step: 0,
    themeId: '',
    theme: null,
    bars: 0,
    tension: 0.38,
    wanted: '',         // 还没拿到音频上下文时先记着要放哪首
    muted: false,
    voices: {},         // 各层增益，用来做进场/退场
  };

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);

  /* 音阶：宫商角徵羽 / 羽调五声 / 自然小调 */
  const SCALES = {
    gong: [0, 2, 4, 7, 9],
    yu: [0, 3, 5, 7, 10],
    minor: [0, 2, 3, 5, 7, 8, 10],
  };

  /* 取音阶第 n 级（可越界，自动升八度），oct 是整体八度偏移 */
  function deg(scale, n, oct) {
    const L = scale.length;
    const o = Math.floor(n / L) + (oct || 0);
    return scale[((n % L) + L) % L] + o * 12;
  }

  /* ---------- 十首曲子 ----------
     prog 用音级写，不是音高；换根音整首就换调。
     layers 决定起手几层；perc: none / soft / drive  */
  const THEMES = {
    mail: {
      name: '邮件', bpm: 52, root: 45, scale: 'yu',
      prog: [0, 0, 5, 3], pad: 0.85, arp: 0, perc: 'none',
      lift: 3, air: 0.5,
    },
    login: {
      name: '登录', bpm: 64, root: 43, scale: 'yu',
      prog: [0, 0, 3, 5], pad: 0.5, arp: 1, perc: 'soft',
      lift: 4, air: 0.35,
    },
    hall: {
      name: '记忆殿', bpm: 58, root: 41, scale: 'gong',
      prog: [0, 4, 2, 0], pad: 0.95, arp: 0, perc: 'none',
      lift: 3, air: 0.8,
    },
    void: {
      name: '无', bpm: 46, root: 36, scale: 'yu',
      prog: [0, 0], pad: 0.7, arp: 0, perc: 'none',
      lift: 1, air: 0.9,
    },
    counter: {
      name: '柜台', bpm: 72, root: 45, scale: 'gong',
      prog: [0, 5, 4, 0], pad: 0.55, arp: 1, perc: 'soft',
      lift: 4, air: 0.3,
    },
    ch2: {
      name: '抵押', bpm: 78, root: 43, scale: 'yu',
      prog: [0, 3, 5, 4], pad: 0.62, arp: 1, perc: 'soft',
      lift: 4, air: 0.25,
    },
    chase: {
      name: '断点', bpm: 112, root: 40, scale: 'minor',
      prog: [0, 0, 5, 6], pad: 0.45, arp: 1, perc: 'drive',
      lift: 5, air: 0.2,
    },
    deep: {
      name: '根目录', bpm: 56, root: 38, scale: 'yu',
      prog: [0, 5, 0, 3], pad: 0.8, arp: 0, perc: 'none',
      lift: 2, air: 0.7,
    },
    moyun: {
      name: '墨韵', bpm: 60, root: 48, scale: 'gong',
      prog: [0, 3, 4, 0], pad: 0.5, arp: 1, perc: 'none',
      lift: 4, air: 0.45,
    },
    final: {
      name: '回响', bpm: 66, root: 41, scale: 'gong',
      prog: [0, 4, 5, 3], pad: 0.85, arp: 1, perc: 'soft',
      lift: 4, air: 0.6,
    },
  };

  /* ---------- 基础发声 ---------- */
  function ctxOk() {
    return A.ctx && A.ctx.state !== 'suspended';
  }

  function env(g, t, peak, atk, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  function pad(freqs, t, dur, gain) {
    if (!ctxOk()) return;
    const bus = A.bus;
    freqs.forEach((f, i) => {
      [0, 1].forEach((k) => {
        const osc = A.ctx.createOscillator();
        osc.type = k ? 'sine' : 'triangle';
        osc.frequency.value = f * (k ? 2 : 1) * (1 + (i - 1) * 0.0016);
        const g = A.ctx.createGain();
        const lp = A.ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.setValueAtTime(600 + A.tension * 1800, t);
        lp.frequency.linearRampToValueAtTime(420 + A.tension * 1200, t + dur);
        lp.Q.value = 0.6;
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(gain / freqs.length * (k ? 0.5 : 1), t + Math.min(1.4, dur * 0.4));
        g.gain.linearRampToValueAtTime(0.0001, t + dur);
        osc.connect(lp); lp.connect(g); g.connect(bus);
        osc.start(t); osc.stop(t + dur + 0.05);
      });
    });
  }

  function pluck(f, t, dur, gain, type) {
    if (!ctxOk()) return;
    const osc = A.ctx.createOscillator();
    osc.type = type || 'triangle';
    osc.frequency.value = f;
    const lp = A.ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(1200 + A.tension * 2600, t);
    lp.frequency.exponentialRampToValueAtTime(320, t + dur);
    lp.Q.value = 2;
    const g = A.ctx.createGain();
    env(g, t, gain, 0.004, dur);
    osc.connect(lp); lp.connect(g); g.connect(A.bus);
    osc.start(t); osc.stop(t + dur + 0.02);
  }

  function bassNote(f, t, dur, gain) {
    if (!ctxOk()) return;
    const osc = A.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = f;
    const g = A.ctx.createGain();
    env(g, t, gain, 0.01, dur);
    g.connect(A.bus);
    osc.connect(g);
    osc.start(t); osc.stop(t + dur + 0.02);
    // 一点点泛音，让低音在笔记本喇叭上也听得见
    const o2 = A.ctx.createOscillator();
    o2.type = 'triangle';
    o2.frequency.value = f * 2;
    const g2 = A.ctx.createGain();
    env(g2, t, gain * 0.22, 0.01, dur * 0.8);
    o2.connect(g2); g2.connect(A.bus);
    o2.start(t); o2.stop(t + dur);
  }

  function hit(kind, t, gain) {
    if (!ctxOk()) return;
    const bus = A.bus;
    if (kind === 'kick') {
      const o = A.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
      const g = A.ctx.createGain();
      env(g, t, gain, 0.004, 0.22);
      o.connect(g); g.connect(bus);
      o.start(t); o.stop(t + 0.24);
      return;
    }
    const len = kind === 'snare' ? 0.12 : 0.04;
    const buf = A.ctx.createBuffer(1, Math.max(1, Math.floor(A.ctx.sampleRate * len)), A.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = A.ctx.createBufferSource();
    src.buffer = buf;
    const f = A.ctx.createBiquadFilter();
    f.type = kind === 'hat' ? 'highpass' : 'bandpass';
    f.frequency.value = kind === 'hat' ? 7000 : 1900;
    f.Q.value = kind === 'hat' ? 0.7 : 1.3;
    const g = A.ctx.createGain();
    env(g, t, gain, 0.002, len);
    src.connect(f); f.connect(g); g.connect(bus);
    src.start(t); src.stop(t + len + 0.01);
  }

  function air(t, dur, gain) {
    if (!ctxOk()) return;
    const len = Math.max(0.1, dur);
    const buf = A.ctx.createBuffer(1, Math.floor(A.ctx.sampleRate * len), A.ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) {
      last = (last + (Math.random() * 2 - 1) * 0.02) * 0.985;   // 布朗噪声，比白噪更"房间"
      d[i] = last;
    }
    const src = A.ctx.createBufferSource();
    src.buffer = buf;
    const f = A.ctx.createBiquadFilter();
    f.type = 'bandpass';
    f.frequency.value = 380 + A.tension * 520;
    f.Q.value = 0.6;
    const g = A.ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(gain, t + 1.2);
    g.gain.linearRampToValueAtTime(0.0001, t + len);
    src.connect(f); f.connect(g); g.connect(A.bus);
    src.start(t); src.stop(t + len);
  }

  /* ---------- 一首曲子的一个八分音符 ---------- */
  function scheduleStep(step, t) {
    const th = A.theme;
    if (!th) return;
    const scale = SCALES[th.scale];
    const sub = step % 8;
    const bar = Math.floor(step / 8);
    const beat = 60 / th.bpm;
    const dur8 = beat / 2;
    const sinceBar = bar - (A.startBar || 0);

    /* 每层依次进场：pad → bass → arp → perc */
    const enterPad = sinceBar >= 0;
    const enterBass = sinceBar >= 1;
    const enterArp = sinceBar >= 2 && th.arp;
    const enterPerc = sinceBar >= 3 || th.perc === 'drive';

    const chordRoot = th.prog[bar % th.prog.length];
    const rootMidi = th.root + deg(scale, chordRoot, 0);

    if (sub === 0) {
      if (enterPad) {
        const notes = [0, 2, 4].map((n) => mtof(rootMidi + deg(scale, n, 0)));
        // 张力高的时候往里塞一个半音，让它开始不舒服
        if (A.tension > 0.72) notes.push(mtof(rootMidi + deg(scale, 2, 0) + 1));
        pad(notes, t, beat * 4.05, 0.10 * th.pad);
      }
      if (enterBass) bassNote(mtof(rootMidi - 12), t, beat * 1.6, 0.16);
      if (A.bars % 6 === 0) air(t, beat * 8, 0.05 * th.air);
    }

    /* 低音的第二下，在第三拍 */
    if (sub === 4 && enterBass) bassNote(mtof(rootMidi - 12), t, beat * 1.1, 0.12);

    /* 琶音：上行的四音，越紧张越密 */
    if (enterArp && (sub % 2 === 0 || A.tension > 0.55)) {
      const seq = [0, 2, 4, 2];
      const n = seq[(step / 2) % seq.length | 0] + (A.tension > 0.6 ? 2 : 0);
      pluck(mtof(rootMidi + deg(scale, n, 1)), t, dur8 * 2.2, 0.045 * (0.5 + A.tension));
    }

    /* 阶梯动机：每四小节，沿音阶往上抬一级 —— 破云阶的走法 */
    if (sub === 0 && bar % 4 === 0 && sinceBar >= 2) {
      const liftIdx = (A.bars / 4 | 0) % Math.max(1, th.lift);
      const base = chordRoot + liftIdx;
      for (let i = 0; i < 4; i++) {
        pluck(mtof(th.root + deg(scale, base + i, 1)), t + i * dur8 * 0.5, dur8 * 3, 0.05, 'sine');
      }
    }

    if (th.perc === 'none' || !enterPerc) return;
    const drive = th.perc === 'drive';
    if (sub === 0 || sub === 4) hit('kick', t, drive ? 0.20 : 0.14);
    if (drive && (sub === 2 || sub === 6)) hit('snare', t, 0.10);
    if (sub % 2 === 1) hit('hat', t, drive ? 0.045 : 0.028);
    if (drive && A.tension > 0.6 && sub % 2 === 0) hit('hat', t, 0.02);
  }

  /* ---------- 走拍 ---------- */
  function tick() {
    if (!ctxOk() || !A.theme) return;
    const dur8 = 60 / A.theme.bpm / 2;
    while (A.nextStepAt < A.ctx.currentTime + 0.18) {
      scheduleStep(A.step, A.nextStepAt);
      A.nextStepAt += dur8;
      A.step++;
      if (A.step % 8 === 0) A.bars++;
    }
  }

  function startClock() {
    if (A.timer) return;
    A.nextStepAt = A.ctx.currentTime + 0.08;
    A.timer = setInterval(tick, 25);
  }

  function stopClock() {
    if (A.timer) { clearInterval(A.timer); A.timer = null; }
  }

  /* ---------- 对外 ---------- */
  const Music = {
    themes: THEMES,

    /* 由 audio.js 在音频上下文建好后调用 */
    boot() {
      A.ctx = global.Snd && global.Snd.ctx;
      if (!A.ctx) return;
      if (A.wanted) {
        const w = A.wanted; A.wanted = '';
        this.play(w);
      }
    },

    /* 换曲：整条总线交叉淡变，拍子不断 */
    play(id, opt) {
      opt = opt || {};
      if (!THEMES[id]) id = 'counter';
      if (A.themeId === id && A.timer) return;
      A.themeId = id;
      A.theme = THEMES[id];
      A.startBar = 0;

      if (!A.ctx || !global.Snd) { A.wanted = id; return; }
      if (A.ctx.state === 'suspended') { A.wanted = id; return; }

      // 新总线，旧总线淡出后拔掉
      const old = A.bus;
      const bus = A.ctx.createGain();
      bus.gain.value = 0.0001;
      bus.connect(global.Snd.music || A.ctx.destination);
      bus.gain.linearRampToValueAtTime(1, A.ctx.currentTime + (opt.fade || 1.6));
      A.bus = bus;
      if (old) {
        try {
          old.gain.cancelScheduledValues(A.ctx.currentTime);
          old.gain.setValueAtTime(old.gain.value, A.ctx.currentTime);
          old.gain.linearRampToValueAtTime(0.0001, A.ctx.currentTime + (opt.fade || 1.6));
          setTimeout(() => { try { old.disconnect(); } catch (e) {} }, (opt.fade || 1.6) * 1000 + 200);
        } catch (e) {}
      }

      // 换曲时把拍的相位对回小节头，避免两首错拍
      A.step = 0;
      A.bars = 0;
      A.nextStepAt = A.ctx.currentTime + 0.1;
      startClock();
    },

    stop(fade) {
      A.themeId = '';
      A.theme = null;
      A.wanted = '';
      stopClock();
      const old = A.bus;
      A.bus = null;
      if (old && A.ctx) {
        const t = A.ctx.currentTime;
        try {
          old.gain.cancelScheduledValues(t);
          old.gain.setValueAtTime(old.gain.value, t);
          old.gain.linearRampToValueAtTime(0.0001, t + (fade || 0.8));
          setTimeout(() => { try { old.disconnect(); } catch (e) {} }, (fade || 0.8) * 1000 + 200);
        } catch (e) {}
      }
    },

    /* 0..1，越高越紧：滤波打开、琶音变密、打击进来、和声开始不干净 */
    tension(v) {
      if (v == null) return A.tension;
      A.tension = Math.max(0, Math.min(1, v));
      return A.tension;
    },

    get current() { return A.themeId; },
    get theme() { return A.theme; },

    /* 自检用：不发声，纯算一首曲子的前两小节，返回音高与层数 */
    describe(id) {
      const th = THEMES[id];
      if (!th) return null;
      const scale = SCALES[th.scale];
      const chords = [];
      for (let bar = 0; bar < 2; bar++) {
        const r = th.root + deg(scale, th.prog[bar % th.prog.length], 0);
        chords.push([0, 2, 4].map((n) => Math.round(mtof(r + deg(scale, n, 0)) * 100) / 100));
      }
      return { id, bpm: th.bpm, chords, root: th.root, prog: th.prog.length, perc: th.perc };
    },
  };

  global.Music = Music;
})(window);
