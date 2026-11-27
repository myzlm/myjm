/* ============================================================
   music.js — 分层生成式配乐 · v2
   ------------------------------------------------------------
   没有音频文件。整首曲子是当场算出来的：
   一条共同的拍子，几层各自进出的声部，
   一个随剧情收紧的参数。

   参考《破云阶》的走法：
   起手只有一层，一层一层往上垒；
   旋律每四小节沿音阶抬一级，抬到顶再落回来。

   v2 加了四样东西：
     一、一间屋子 —— 卷积混响，屋子的大小按主题给（room）。
     二、两只耳朵 —— 琶音与主旋律有左右；低音在中间，人声也在中间。
     三、一句动机 —— 每首曲子都藏同一句三音动机，移调、倒影、
         拆开、只留一半。它走到哪儿，这间店就跟到哪儿。
     四、前后两段 —— 八小节一段，第二段换答句、换琶音方向，
         三十五分钟里不会听见同一句第三遍。

   十六首。换曲走交叉淡变，拍子不停。
   ============================================================ */
(function (global) {
  'use strict';

  const A = {
    ctx: null,
    bus: null,          // 当前主题的总线（换主题时整条淡出）
    rev: null,          // 混响
    revSend: null,
    timer: null,
    nextStepAt: 0,      // 下一个八分音符的时刻
    step: 0,
    themeId: '',
    theme: null,
    bars: 0,
    startBar: 0,
    tension: 0.38,
    wanted: '',         // 还没拿到音频上下文时先记着要放哪首
    muted: false,
    voices: {},
  };

  /* 总电平。曲子是垫在底下的，但不能低到听不见——
     这个数是拿分析器量出来的：稳定段峰值落在 -20 dBFS 上下。 */
  const LEVEL = 4.0;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* 音阶：宫商角徵羽 / 羽调五声 / 自然小调 / 都节（日本，五声，带半音） */
  const SCALES = {
    gong: [0, 2, 4, 7, 9],
    yu: [0, 3, 5, 7, 10],
    minor: [0, 2, 3, 5, 7, 8, 10],
    miyako: [0, 1, 5, 7, 8],
  };

  /* 取音阶第 n 级（可越界，自动升八度），oct 是整体八度偏移 */
  function deg(scale, n, oct) {
    const L = scale.length;
    const o = Math.floor(n / L) + (oct || 0);
    return scale[((n % L) + L) % L] + o * 12;
  }

  /* ---------- 十六首 ----------
     prog 用音级写，不是音高；换根音整首就换调。
     layers 决定起手几层；perc: none / soft / drive / brush
     mel  每首一句，八个音级；负数是往下走。
     room 0..1 屋子大小；lead 主旋律音量；swing 摇摆量（0..1） */
  const THEMES = {
    mail: {
      name: '邮件', bpm: 52, root: 45, scale: 'yu',
      prog: [0, 0, 5, 3], pad: 0.85, arp: 0, perc: 'none',
      lift: 3, air: 0.5, room: 0.62, lead: 0.5, swing: 0,
      mel: [4, 2, 0, -1, 0, 2, 4, 5],
    },
    login: {
      name: '登录', bpm: 64, root: 43, scale: 'yu',
      prog: [0, 0, 3, 5], pad: 0.5, arp: 1, perc: 'soft',
      lift: 4, air: 0.35, room: 0.4, lead: 0.42, swing: 0.18,
      mel: [0, 2, 4, 2, 5, 4, 2, 0],
    },
    hall: {
      name: '记忆殿', bpm: 58, root: 41, scale: 'gong',
      prog: [0, 4, 2, 0], pad: 0.95, arp: 0, perc: 'none',
      lift: 3, air: 0.8, room: 0.95, lead: 0.3, swing: 0,
      mel: [2, 4, 5, 4, 2, 0, -1, 0],
    },
    void: {
      name: '无', bpm: 46, root: 36, scale: 'yu',
      prog: [0, 0], pad: 0.7, arp: 0, perc: 'none',
      lift: 1, air: 0.9, room: 1, lead: 0.18, swing: 0,
      mel: [0, -1, 0, 0, 0, -2, 0, 0],
    },
    counter: {
      name: '柜台', bpm: 72, root: 45, scale: 'gong',
      prog: [0, 5, 4, 0], pad: 0.55, arp: 1, perc: 'soft',
      lift: 4, air: 0.3, room: 0.38, lead: 0.55, swing: 0.22,
      mel: [4, 5, 4, 2, 0, 2, -1, 0],
    },
    ch2: {
      name: '抵押', bpm: 78, root: 43, scale: 'yu',
      prog: [0, 3, 5, 4], pad: 0.62, arp: 1, perc: 'soft',
      lift: 4, air: 0.25, room: 0.42, lead: 0.5, swing: 0.2,
      mel: [0, 3, 5, 3, 2, 0, -1, 0],
    },
    chase: {
      name: '断点', bpm: 112, root: 40, scale: 'minor',
      prog: [0, 0, 5, 6], pad: 0.45, arp: 1, perc: 'drive',
      lift: 5, air: 0.2, room: 0.28, lead: 0.6, swing: 0,
      mel: [0, 0, 3, 5, 5, 3, 7, 3],
    },
    deep: {
      name: '根目录', bpm: 56, root: 38, scale: 'yu',
      prog: [0, 5, 0, 3], pad: 0.8, arp: 0, perc: 'none',
      lift: 2, air: 0.7, room: 0.82, lead: 0.34, swing: 0,
      mel: [-1, 0, 2, 0, -1, -3, -1, 0],
    },
    moyun: {
      name: '墨韵', bpm: 60, root: 48, scale: 'gong',
      prog: [0, 3, 4, 0], pad: 0.5, arp: 1, perc: 'none',
      lift: 4, air: 0.45, room: 0.7, lead: 0.58, swing: 0.1,
      mel: [4, 2, 4, 5, 7, 5, 4, 2],
    },
    final: {
      name: '回响', bpm: 66, root: 41, scale: 'gong',
      prog: [0, 4, 5, 3], pad: 0.85, arp: 1, perc: 'soft',
      lift: 4, air: 0.6, room: 0.88, lead: 0.55, swing: 0.12,
      mel: [0, 2, 4, 5, 7, 5, 4, 2],
    },

    /* ---- v2 新曲 ---- */
    paper: {
      name: '纸的眼睛', bpm: 50, root: 44, scale: 'miyako',
      prog: [0, 0, 3, 1], pad: 0.9, arp: 1, perc: 'none',
      lift: 2, air: 0.85, room: 1, lead: 0.46, swing: 0,
      mel: [0, 1, 0, -1, 3, 1, 0, -1],
    },
    night: {
      name: '守夜', bpm: 44, root: 37, scale: 'gong',
      prog: [0, 2, 0, 4], pad: 0.95, arp: 0, perc: 'brush',
      lift: 2, air: 0.95, room: 0.92, lead: 0.32, swing: 0.3,
      mel: [2, 0, -1, 0, 2, 4, 2, 0],
    },
    hands: {
      name: '手', bpm: 68, root: 42, scale: 'yu',
      prog: [0, 5, 3, 0], pad: 0.5, arp: 1, perc: 'soft',
      lift: 4, air: 0.3, room: 0.36, lead: 0.5, swing: 0.26,
      mel: [3, 2, 0, 2, 3, 5, 3, 2],
    },
    verify: {
      name: '核验', bpm: 86, root: 40, scale: 'miyako',
      prog: [0, 1, 0, 4], pad: 0.55, arp: 1, perc: 'brush',
      lift: 5, air: 0.3, room: 0.32, lead: 0.48, swing: 0,
      mel: [0, 1, 4, 1, 0, -1, 1, 0],
    },
    hollow: {
      name: '空行', bpm: 42, root: 35, scale: 'yu',
      prog: [0, 5], pad: 0.75, arp: 0, perc: 'none',
      lift: 1, air: 1, room: 1, lead: 0.14, swing: 0,
      mel: [0, 0, -1, 0, 0, -3, 0, 0],
    },
    tide: {
      name: '收摊', bpm: 62, root: 46, scale: 'gong',
      prog: [0, 4, 2, 5], pad: 0.6, arp: 1, perc: 'brush',
      lift: 3, air: 0.5, room: 0.6, lead: 0.52, swing: 0.24,
      mel: [4, 4, 2, 4, 5, 4, 2, 0],
    },
    street: {
      name: '街上', bpm: 54, root: 43, scale: 'yu',
      prog: [0, 3, 0, 5], pad: 0.7, arp: 0, perc: 'brush',
      lift: 3, air: 0.75, room: 0.8, lead: 0.44, swing: 0.14,
      mel: [0, 2, 3, 2, 0, -1, 0, 2],
    },
    duty: {
      name: '当班', bpm: 74, root: 44, scale: 'gong',
      prog: [0, 5, 3, 4], pad: 0.58, arp: 1, perc: 'soft',
      lift: 4, air: 0.28, room: 0.4, lead: 0.5, swing: 0.16,
      mel: [0, 2, 4, 5, 4, 2, 0, -1],
    },
  };

  /* ---------- 屋子：卷积混响 ---------- */
  function makeRoom(ctx, sec, decay) {
    const sr = ctx.sampleRate;
    const len = Math.max(1, Math.floor(sr * sec));
    const buf = ctx.createBuffer(2, len, sr);
    for (let ch = 0; ch < 2; ch++) {
      const d = buf.getChannelData(ch);
      let lp = 0;
      for (let i = 0; i < len; i++) {
        const k = i / len;
        // 前 40ms 是空的：那一段是屋子里的距离，不是回声
        const pre = i < sr * 0.04 ? 0 : 1;
        const n = (Math.random() * 2 - 1) * pre;
        // 一点点低通：石头屋子不会把高频还给你
        lp = lp * 0.72 + n * 0.28;
        d[i] = lp * Math.pow(1 - k, decay);
      }
    }
    return buf;
  }

  function room() {
    if (!A.ctx) return null;
    if (A.rev) return A.rev;
    try {
      A.rev = A.ctx.createConvolver();
      A.rev.buffer = makeRoom(A.ctx, 3.4, 2.6);
      A.rev.normalize = true;
      const out = A.ctx.createGain();
      out.gain.value = 0.9;
      A.rev.connect(out);
      out.connect(global.Snd && global.Snd.music ? global.Snd.music : A.ctx.destination);
      A.revSend = A.ctx.createGain();
      A.revSend.gain.value = 0.5;
      A.revSend.connect(A.rev);
    } catch (e) { A.rev = null; }
    return A.rev;
  }

  /* ---------- 基础发声 ---------- */
  function ctxOk() {
    return A.ctx && A.ctx.state !== 'suspended';
  }

  function env(g, t, peak, atk, dur) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + atk);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }

  /* 左右：pan 为 null 时不建节点，省一点 */
  function out(node, pan, wet) {
    let n = node;
    if (pan != null && A.ctx.createStereoPanner) {
      const p = A.ctx.createStereoPanner();
      p.pan.value = clamp(pan, -1, 1);
      n.connect(p); n = p;
    }
    n.connect(A.bus);
    if (wet && A.revSend) {
      const g = A.ctx.createGain();
      g.gain.value = wet;
      n.connect(g); g.connect(A.revSend);
    }
  }

  function pad(freqs, t, dur, gain, pan) {
    if (!ctxOk()) return;
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
        osc.connect(lp); lp.connect(g);
        // 左右各偏一点：同一个和弦，两把琴
        const side = pan == null ? (i - 1) * 0.16 + (k ? 0.05 : -0.05) : pan;
        out(g, side, 0.16);
        osc.start(t); osc.stop(t + dur + 0.05);
      });
    });
  }

  function pluck(f, t, dur, gain, type, pan, wet) {
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
    osc.connect(lp); lp.connect(g);
    out(g, pan, wet == null ? 0.22 : wet);
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

  function hit(kind, t, gain, pan) {
    if (!ctxOk()) return;
    if (kind === 'kick') {
      const o = A.ctx.createOscillator();
      o.type = 'sine';
      o.frequency.setValueAtTime(120, t);
      o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
      const g = A.ctx.createGain();
      env(g, t, gain, 0.004, 0.22);
      o.connect(g); out(g, 0, 0.05);
      o.start(t); o.stop(t + 0.24);
      return;
    }
    const len = kind === 'snare' ? 0.12 : kind === 'brush' ? 0.08 : 0.04;
    const buf = A.ctx.createBuffer(1, Math.max(1, Math.floor(A.ctx.sampleRate * len)), A.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const src = A.ctx.createBufferSource();
    src.buffer = buf;
    const f = A.ctx.createBiquadFilter();
    f.type = kind === 'hat' ? 'highpass' : 'bandpass';
    f.frequency.value = kind === 'hat' ? 7000 : kind === 'brush' ? 3200 : 1900;
    f.Q.value = kind === 'hat' ? 0.7 : kind === 'brush' ? 0.5 : 1.3;
    const g = A.ctx.createGain();
    env(g, t, gain, 0.002, len);
    src.connect(f); f.connect(g);
    out(g, pan == null ? (kind === 'hat' ? 0.3 : -0.15) : pan, kind === 'brush' ? 0.5 : 0.18);
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
    src.connect(f); f.connect(g);
    out(g, null, 0.9);
    src.start(t); src.stop(t + len);
  }

  /* 同一句三音动机：全曲共用。移位、倒影，或者只留一个音。 */
  const MOTIF = [0, 2, -1];

  function motifNote(scale, base, k, oct) {
    const shape = k < 0 ? MOTIF.map((n) => -n) : MOTIF;
    return base + deg(scale, shape[Math.abs(k) % shape.length], oct);
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
    const phrase = Math.floor(bar / 8);       // 第几段
    const inB = phrase % 2 === 1;             // 前段 / 后段
    const hum = (Math.random() * 2 - 1) * 0.006;   // 人味：早一点或者晚一点

    /* 每层依次进场：pad → bass → arp → perc → lead */
    const enterPad = sinceBar >= 0;
    const enterBass = sinceBar >= 1;
    const enterArp = sinceBar >= 2 && th.arp;
    const enterPerc = sinceBar >= 3 || th.perc === 'drive';
    const enterLead = sinceBar >= 4 && th.lead > 0.25;

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

    /* 琶音：上行的四音，越紧张越密；后段改成下行的回环 */
    if (enterArp && (sub % 2 === 0 || A.tension > 0.55)) {
      const up = [0, 2, 4, 2];
      const down = [4, 2, 0, 2];
      const seq = inB ? down : up;
      const n = seq[(step / 2) % seq.length | 0] + (A.tension > 0.6 ? 2 : 0);
      const pan = (inB ? -1 : 1) * ((step % 4 === 0) ? 0.34 : 0.18);
      pluck(mtof(rootMidi + deg(scale, n, 1)), t + hum, dur8 * 2.2, 0.045 * (0.5 + A.tension), 'triangle', pan, 0.26);
    }

    /* 阶梯动机：每四小节，沿音阶往上抬一级 —— 破云阶的走法 */
    if (sub === 0 && bar % 4 === 0 && sinceBar >= 2) {
      const liftIdx = (A.bars / 4 | 0) % Math.max(1, th.lift);
      const base = chordRoot + liftIdx;
      for (let i = 0; i < 4; i++) {
        pluck(mtof(th.root + deg(scale, base + i, 1)), t + i * dur8 * 0.5, dur8 * 3, 0.05, 'sine', (i - 1.5) * 0.12, 0.3);
      }
    }

    /* 主旋律：前段一句，后段同一句翻过来。动机藏在里面。
       两个八分音符一个音，落在 0 / 2 / 4 / 6 上。 */
    if (enterLead && th.mel && sub % 2 === 0) {
      const idx = (sub / 2 + (inB ? 4 : 0)) % th.mel.length;
      let nn = th.mel[idx];
      if (inB) nn = nn + (idx % 2 ? -1 : 1);          // 后段微调，不是同一句
      const f = mtof(th.root + deg(scale, nn + 2, 1));
      const g0 = 0.062 * th.lead * (inB ? 1.1 : 1);
      const pan = inB ? 0.22 : -0.22;
      pluck(f, t + hum, dur8 * 6.4, g0, 'sine', pan, 0.42);
      /* 一遍答句：晚一个八分，轻一半，落在另一边 */
      if (inB) pluck(f * 1.5, t + dur8 * 1.0, dur8 * 3.2, g0 * 0.4, 'sine', -pan, 0.5);
    }

    /* 动机回声：每段最后一小节，把三个音一个一个放出来 */
    if (enterLead && sub === 6 && bar % 8 === 7) {
      for (let i = 0; i < 3; i++) {
        pluck(mtof(th.root + motifNote(scale, chordRoot, i, 1)),
          t + i * dur8 * 0.66, dur8 * 2, 0.04, 'sine', (i - 1) * 0.3, 0.6);
      }
    }

    if (th.perc === 'none' || !enterPerc) return;
    const drive = th.perc === 'drive';
    const brush = th.perc === 'brush';
    const swing = th.swing ? dur8 * th.swing * 0.5 : 0;
    const ts = (sub % 2 === 1) ? t + swing : t;
    if (sub === 0 || sub === 4) hit('kick', t, drive ? 0.20 : brush ? 0.10 : 0.14);
    if (drive && (sub === 2 || sub === 6)) hit('snare', ts, 0.10);
    if (brush && (sub === 2 || sub === 6)) hit('brush', ts, 0.075);
    if (sub % 2 === 1) hit('hat', ts, drive ? 0.045 : brush ? 0.02 : 0.028);
    if (drive && A.tension > 0.6 && sub % 2 === 0) hit('hat', t, 0.02);
    if (brush && sub % 4 === 2) hit('hat', t + dur8 * 0.5, 0.014);
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
      room();
      if (A.wanted) {
        const w = A.wanted; A.wanted = '';
        this.play(w);
      }
    },

    /* 换曲：整条总线交叉淡变，拍子不断 */
    play(id, opt) {
      opt = opt || {};
      if (!THEMES[id]) id = 'counter';
      if (A.themeId === id && A.timer && !opt.restart) return;
      const first = !A.themeId;
      A.themeId = id;
      A.theme = THEMES[id];
      A.startBar = 0;

      if (!A.ctx || !global.Snd) { A.wanted = id; return; }
      if (A.ctx.state === 'suspended') { A.wanted = id; return; }

      room();

      // 新总线，旧总线淡出后拔掉
      const old = A.bus;
      const bus = A.ctx.createGain();
      bus.gain.value = 0.0001;
      bus.connect(global.Snd.music || A.ctx.destination);
      bus.gain.linearRampToValueAtTime(LEVEL, A.ctx.currentTime + (opt.fade == null ? (first ? 2.2 : 1.6) : opt.fade));
      A.bus = bus;

      // 屋子按主题给：大屋子多一点，小屋子几乎干
      if (A.revSend) {
        const want = clamp((A.theme.room == null ? 0.5 : A.theme.room) * 0.85, 0, 0.9);
        A.revSend.gain.cancelScheduledValues(A.ctx.currentTime);
        A.revSend.gain.setTargetAtTime(want, A.ctx.currentTime, 0.4);
      }

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
      const mel = (th.mel || []).map((n) => Math.round(mtof(th.root + deg(scale, n + 2, 1)) * 100) / 100);
      return {
        id, bpm: th.bpm, chords, root: th.root, prog: th.prog.length, perc: th.perc,
        lead: th.lead, room: th.room, mel, motif: MOTIF.slice(),
      };
    },
  };

  global.Music = Music;
})(window);
