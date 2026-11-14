/* ============================================================
   cipher.js — 密码引擎（《墨韵·科技卷轴》内核）
   ------------------------------------------------------------
   九种写法（含对照用的原文）：
     caesar    凯撒（汉字按区位移，不只是英文字母）
     vigenere  维吉尼亚（真名派生密钥流）
     rail      栅栏（字序重排）
     atbash    反转（字母对折、汉字按区镜像）
     morse     摩斯（汉字的五位码）
     bacon     培根（AB 五位）
     aes       AES-GCM（WebCrypto；无 crypto.subtle 时降级为流异或）
     ancient   古法五层（反写 → 隔字换位 → 维吉尼亚 → 凯撒 → Base64）
     plain     原文（对照用）
   后三种不必用钥匙，谁拿到都能试。
   + SHA-256 / Base64 / 可读性打分 / 一键智能检测
   ------------------------------------------------------------
   纯函数，无 DOM 依赖：游戏内终端与独立卷轴页共用这一份。
   ============================================================ */
(function (global) {
  'use strict';

  /* ================= SHA-256（纯 JS，file:// 也能用） ================= */
  const K = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  function utf8Bytes(str) {
    const s = unescape(encodeURIComponent(str));
    const out = new Uint8Array(s.length);
    for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
    return out;
  }

  function sha256bytes(str) {
    const msg = utf8Bytes(str);
    const l = msg.length;
    const withOne = new Uint8Array((((l + 8) >> 6) + 1) << 6);
    withOne.set(msg);
    withOne[l] = 0x80;
    const bits = l * 8;
    const dv = new DataView(withOne.buffer);
    dv.setUint32(withOne.length - 4, bits >>> 0);
    dv.setUint32(withOne.length - 8, Math.floor(bits / 4294967296));

    const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
    const w = new Uint32Array(64);
    const rotr = (x, n) => (x >>> n) | (x << (32 - n));

    for (let off = 0; off < withOne.length; off += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(off + i * 4);
      for (let i = 16; i < 64; i++) {
        const s0 = rotr(w[i - 15], 7) ^ rotr(w[i - 15], 18) ^ (w[i - 15] >>> 3);
        const s1 = rotr(w[i - 2], 17) ^ rotr(w[i - 2], 19) ^ (w[i - 2] >>> 10);
        w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const S1 = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
        const ch = (e & f) ^ (~e & g);
        const t1 = (h + S1 + ch + K[i] + w[i]) >>> 0;
        const S0 = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
        const maj = (a & b) ^ (a & c) ^ (b & c);
        const t2 = (S0 + maj) >>> 0;
        h = g; g = f; f = e; e = (d + t1) >>> 0;
        d = c; c = b; b = a; a = (t1 + t2) >>> 0;
      }
      H[0] = (H[0] + a) >>> 0; H[1] = (H[1] + b) >>> 0;
      H[2] = (H[2] + c) >>> 0; H[3] = (H[3] + d) >>> 0;
      H[4] = (H[4] + e) >>> 0; H[5] = (H[5] + f) >>> 0;
      H[6] = (H[6] + g) >>> 0; H[7] = (H[7] + h) >>> 0;
    }
    const out = new Uint8Array(32);
    const odv = new DataView(out.buffer);
    H.forEach((v, i) => odv.setUint32(i * 4, v));
    return out;
  }

  const hex = (bytes) => Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join('');
  const sha256hex = (s) => hex(sha256bytes(s));

  /* ================= Base64（支持中文） ================= */
  const b64enc = (s) => btoa(unescape(encodeURIComponent(s)));
  const b64dec = (s) => {
    try { return decodeURIComponent(escape(atob(s))); } catch (e) { return null; }
  };

  /* ================= 密钥 → 数字/字母流 ================= */
  function keyBytes(key) {
    const raw = typeof key === 'string' ? key : String(key || '');
    return sha256bytes(raw || '记忆殿');
  }
  function keyShift(key) {
    const b = keyBytes(key);
    return (b[0] % 24) + 1;                     // 1 ~ 24
  }
  function keyLetters(key) {
    const b = keyBytes(key);
    return Array.from(b.slice(0, 16)).map((x) => String.fromCharCode(97 + (x % 26)));
  }
  function keyRails(key) {
    const b = keyBytes(key);
    return 2 + (b[1] % 6);                      // 2 ~ 7
  }

  /* ================= 字符位移（汉字一起搬） ================= */
  const CJK0 = 0x4e00, CJKN = 0x9fa5 - 0x4e00 + 1;
  function shiftChar(ch, k) {
    const c = ch.charCodeAt(0);
    if (c >= 97 && c <= 122) return String.fromCharCode(97 + ((c - 97 + k) % 26 + 26) % 26);
    if (c >= 65 && c <= 90) return String.fromCharCode(65 + ((c - 65 + k) % 26 + 26) % 26);
    if (c >= CJK0 && c < CJK0 + CJKN) return String.fromCharCode(CJK0 + ((c - CJK0 + k) % CJKN + CJKN) % CJKN);
    return ch;
  }

  /* ================= 六种算法 ================= */
  const caesar = (text, k) => Array.from(text).map((c) => shiftChar(c, k)).join('');

  function vigenere(text, key, dir) {
    const ks = keyLetters(key);
    const chars = Array.from(text);
    let j = 0;
    return chars.map((c) => {
      const code = c.charCodeAt(0);
      const latin = (code >= 65 && code <= 90) || (code >= 97 && code <= 122);
      const cjk = code >= CJK0 && code < CJK0 + CJKN;
      if (!latin && !cjk) return c;
      const k = ks[j % ks.length].charCodeAt(0) - 97 + 1;
      j++;
      return shiftChar(c, dir * k);
    }).join('');
  }

  function rail(text, rails) {
    const a = Array.from(text);
    const n = a.length;
    if (rails < 2 || n < 3) return text;
    const rows = Array.from({ length: rails }, () => []);
    let r = 0, step = 1;
    for (let i = 0; i < n; i++) {
      rows[r].push(a[i]);
      if (r === 0) step = 1;
      else if (r === rails - 1) step = -1;
      r += step;
    }
    return rows.map((x) => x.join('')).join('');
  }

  function unrail(text, rails) {
    const a = Array.from(text);
    const n = a.length;
    if (rails < 2 || n < 3) return text;
    const pattern = [];
    let r = 0, step = 1;
    for (let i = 0; i < n; i++) {
      pattern.push(r);
      if (r === 0) step = 1;
      else if (r === rails - 1) step = -1;
      r += step;
    }
    const counts = new Array(rails).fill(0);
    pattern.forEach((x) => counts[x]++);
    const rows = [];
    let p = 0;
    for (let i = 0; i < rails; i++) { rows.push(a.slice(p, p + counts[i])); p += counts[i]; }
    const idx = new Array(rails).fill(0);
    return pattern.map((x) => rows[x][idx[x]++]).join('');
  }

  /* 古法五层：反写 → 隔字换位 → 维吉尼亚 → 凯撒 → Base64 */
  function ancientEnc(text, key) {    const a = Array.from(text);
    let out = a.reverse().join('');
    // 隔字换位：奇数位串 + 偶数位串
    const odd = [], even = [];
    Array.from(out).forEach((c, i) => (i % 2 ? odd : even).push(c));
    out = odd.join('') + even.join('');
    out = vigenere(out, key, 1);
    out = caesar(out, keyShift(key));
    return b64enc(out);
  }

  function ancientDec(text, key) {
    const s = b64dec(text);
    if (s == null) return null;
    let out = caesar(s, -keyShift(key));
    out = vigenere(out, key, -1);
    // 还原隔字换位（加密时是 奇数位串 + 偶数位串）
    const arr = Array.from(out);
    const oddLen = Math.floor(arr.length / 2);
    const odd = arr.slice(0, oddLen), even = arr.slice(oddLen);
    let inter = '';
    for (let i = 0; i < even.length; i++) {
      inter += even[i];
      if (i < odd.length) inter += odd[i];
    }
    return Array.from(inter).reverse().join('');
  }

  /* ================= 摩斯 · 电报 =================
     拉丁、数字、标点照标准电码走；
     汉字没有电报码，就写成「! + 五位码」，
     像一封从很远的电报局发回来的稿子。 */
  const MORSE = {
    a: '.-', b: '-...', c: '-.-.', d: '-..', e: '.', f: '..-.', g: '--.', h: '....',
    i: '..', j: '.---', k: '-.-', l: '.-..', m: '--', n: '-.', o: '---', p: '.--.',
    q: '--.-', r: '.-.', s: '...', t: '-', u: '..-', v: '...-', w: '.--', x: '-..-',
    y: '-.--', z: '--..',
    0: '-----', 1: '.----', 2: '..---', 3: '...--', 4: '....-',
    5: '.....', 6: '-....', 7: '--...', 8: '---..', 9: '----.',
    '.': '.-.-.-', ',': '--..--', '?': '..--..', ';': '-.-.-.', ':': '---...',
    "'": '.----.', '"': '.-..-.', '-': '-....-', '/': '-..-.', '(': '-.--.',
    ')': '-.--.-', '!': '-.-.--', '=': '-...-', '+': '.-.-.',
  };
  const MORSE_REV = (() => {
    const r = {};
    Object.keys(MORSE).forEach((k) => { r[MORSE[k]] = k; });
    return r;
  })();

  function morseEnc(text) {
    return Array.from(text).map((ch) => {
      if (ch === ' ') return '/';
      const hit = MORSE[ch.toLowerCase()];
      if (hit) return hit;
      // 五位码
      return '! ' + String(ch.codePointAt(0)).padStart(5, '0').split('')
        .map((d) => MORSE[d]).join(' ');
    }).join(' ');
  }

  function morseDec(text) {
    const tk = String(text).trim().split(/\s+/);
    let out = '';
    for (let i = 0; i < tk.length; i++) {
      const t = tk[i];
      if (!t) continue;
      if (t === '/') { out += ' '; continue; }
      if (t === '!') {
        let num = '';
        for (let j = 0; j < 5 && i + 1 < tk.length; j++) { i++; num += MORSE_REV[tk[i]] || '0'; }
        out += String.fromCharCode(parseInt(num, 10) || 32);
        continue;
      }
      const ch = MORSE_REV[t];
      if (ch != null) out += ch;
    }
    return out;
  }

  /* ================= 培根 · AB =================
     每个字符取十六位，0 写 A，1 写 B，五位一节。
     密文看上去只是一长串 A 和 B。 */
  function baconEnc(text) {
    const bits = Array.from(text).map((ch) => ch.charCodeAt(0).toString(2).padStart(16, '0')).join('');
    let out = [];
    for (let i = 0; i < bits.length; i += 5) {
      out.push(Array.from(bits.slice(i, i + 5)).map((b) => (b === '1' ? 'B' : 'A')).join(''));
    }
    return out.join(' ');
  }

  function baconDec(text) {
    const bits = String(text).toUpperCase().replace(/[^AB]/g, '');
    let out = '';
    for (let i = 0; i + 16 <= bits.length; i += 16) {
      out += String.fromCharCode(parseInt(bits.slice(i, i + 16).replace(/A/g, '0').replace(/B/g, '1'), 2));
    }
    return out;
  }

  /* ================= 反转（镜像） =================
     字母 a↔z，汉字按字区首尾对折。
     自己做自己的逆运算。 */
  function atbash(text) {
    return Array.from(text).map((ch) => {
      const c = ch.charCodeAt(0);
      if (c >= 97 && c <= 122) return String.fromCharCode(219 - c);
      if (c >= 65 && c <= 90) return String.fromCharCode(155 - c);
      if (c >= CJK0 && c < CJK0 + CJKN) return String.fromCharCode(CJK0 + CJKN - 1 - (c - CJK0));
      return ch;
    }).join('');
  }

  /* ================= AES-GCM（异步，失败降级） ================= */
  const hasSubtle = !!(global.crypto && global.crypto.subtle && global.crypto.subtle.importKey);

  async function aesKey(key) {
    return global.crypto.subtle.importKey('raw', sha256bytes(key), 'AES-GCM', false, ['encrypt', 'decrypt']);
  }

  async function aesEnc(text, key) {
    if (!hasSubtle) return 'x1:' + b64enc(xorStream(text, key));
    const iv = global.crypto.getRandomValues(new Uint8Array(12));
    const buf = await global.crypto.subtle.encrypt(
      { name: 'AES-GCM', iv }, await aesKey(key), utf8Bytes(text));
    const all = new Uint8Array(iv.length + buf.byteLength);
    all.set(iv); all.set(new Uint8Array(buf), iv.length);
    return 'a1:' + b64enc(String.fromCharCode.apply(null, all));
  }

  async function aesDec(text, key) {
    if (text.indexOf('x1:') === 0) return xorStream(b64dec(text.slice(3)) || '', key);
    if (text.indexOf('a1:') !== 0) return null;
    const raw = b64dec(text.slice(3));
    if (raw == null) return null;
    const bytes = utf8Bytes(raw);
    const iv = bytes.slice(0, 12);
    const body = bytes.slice(12);
    try {
      const buf = await global.crypto.subtle.decrypt({ name: 'AES-GCM', iv }, await aesKey(key), body);
      return decodeURIComponent(escape(String.fromCharCode.apply(null, new Uint8Array(buf))));
    } catch (e) { return null; }
  }

  function xorStream(text, key) {
    const kb = keyBytes(key);
    const src = utf8Bytes(text);
    const out = new Uint8Array(src.length);
    for (let i = 0; i < src.length; i++) out[i] = src[i] ^ kb[i % 32];
    return String.fromCharCode.apply(null, out);
  }

  /* ================= 可读性打分（判断解对没有） ================= */
  const COMMON = '的一是在不了有和人这中大为上个国我以要他时来用们生到作地于出就分对成会可主发年动同工也能下过子说产种面而方后多定行学法所民得经十三之进着等部度家电力里如水化高自二理起小物现实加量都两体制机当使点从业本去把性好应开它合还因由其些然前外天政四日那社义事平形相全表间样与关各重新线内数正心反你明看原又么利比或但质气第向道命此变条只没结解问意建月公无系军很情者最立代想已通并提直题党程展五果料象员革位入常文总次品式活设及管特件长求老头基资边流路级少图山统接知较将组见计别她手角期根论运农指几九区强放决西被干做必战先回则任取据处队南给色光门即保治北造百规热领七海口东导器压志世金增争济阶油思术极交受联什认六共权收证改清己美再采转更单风切打白教速花带安场身车例真务具万每目至达走积示议声报斗完类八离华名确才科张信马节话米整空元况今集温传土许步群广石记需段研界拉林律叫且究观越织装影算低持音众书布复容儿须际商非验连断深难近矿千周委素技备半办青省列习响约支般史感劳便团往酸历市克何除消构府称太准精值号率族维划选标写存候毛亲快效斯院查江型眼王按格养易置派层片始却专状育厂京识适属圆包火住调满县局照参红细引听该铁价严龙飞';
  const COMMON_SET = new Set(COMMON.split(''));

  function readability(text) {
    if (!text) return 0;
    const a = Array.from(text).filter((c) => c.trim());
    if (!a.length) return 0;
    let cjk = 0, common = 0, weird = 0, asciiPrint = 0;
    a.forEach((c) => {
      const code = c.charCodeAt(0);
      if (code >= CJK0 && code < CJK0 + CJKN) { cjk++; if (COMMON_SET.has(c)) common++; }
      else if (code >= 32 && code < 127) asciiPrint++;
      else if (code === 10 || code === 13) asciiPrint++;
      else weird++;
    });
    const n = a.length;
    let s = 0;
    s += (cjk / n) * 42;
    if (cjk) s += (common / cjk) * 46;
    s += (asciiPrint / n) * 14;
    s -= (weird / n) * 80;
    return Math.max(0, Math.min(100, s));
  }

  /* ================= 统一封装 ================= */
  const ALGS = [
    { id: 'plain', name: '原文', cn: '对照' },
    { id: 'caesar', name: '凯撒', cn: '位移' },
    { id: 'vigenere', name: '维吉尼亚', cn: '密钥流' },
    { id: 'rail', name: '栅栏', cn: '重排' },
    { id: 'atbash', name: '反转', cn: '镜像' },
    { id: 'morse', name: '摩斯', cn: '电报' },
    { id: 'bacon', name: '培根', cn: 'AB 五位' },
    { id: 'aes', name: 'AES-GCM', cn: '密文块' },
    { id: 'ancient', name: '古法五层', cn: '墨韵' },
  ];

  /* 不需要密钥的几种：谁拿到都能解 */
  const KEYLESS = ['atbash', 'morse', 'bacon', 'plain'];

  function enc(text, key, alg) {
    switch (alg) {
      case 'caesar': return caesar(text, keyShift(key));
      case 'vigenere': return vigenere(text, key, 1);
      case 'rail': return rail(text, keyRails(key));
      case 'atbash': return atbash(text);
      case 'morse': return morseEnc(text);
      case 'bacon': return baconEnc(text);
      case 'ancient': return ancientEnc(text, key);
      case 'aes': return aesEnc(text, key);
      default: return text;
    }
  }

  async function dec(text, key, alg) {
    switch (alg) {
      case 'caesar': return caesar(text, -keyShift(key));
      case 'vigenere': return vigenere(text, key, -1);
      case 'rail': return unrail(text, keyRails(key));
      case 'atbash': return atbash(text);
      case 'morse': return morseDec(text);
      case 'bacon': return baconDec(text);
      case 'ancient': return ancientDec(text, key);
      case 'aes': return aesDec(text, key);
      default: return text;
    }
  }

  /* 同步版：AES 之外的几法（自检、批量试算用） */
  function decSync(text, key, alg) {
    switch (alg) {
      case 'caesar': return caesar(text, -keyShift(key));
      case 'vigenere': return vigenere(text, key, -1);
      case 'rail': return unrail(text, keyRails(key));
      case 'atbash': return atbash(text);
      case 'morse': return morseDec(text);
      case 'bacon': return baconDec(text);
      case 'ancient': return ancientDec(text, key);
      default: return text;
    }
  }

  /* 一键智能检测：把所有算法跑一遍，按可读性排序 */
  async function solve(ciphertext, key) {
    const out = [];
    for (const alg of ALGS) {
      if (alg.id === 'plain') continue;
      let text = null;
      try { text = await dec(ciphertext, key, alg.id); } catch (e) { text = null; }
      if (text == null) continue;
      out.push({ alg: alg.id, name: alg.name, text, score: +readability(text).toFixed(1) });
    }
    out.sort((a, b) => b.score - a.score);
    return out;
  }

  global.Cipher = {
    sha256hex, sha256bytes, hex, b64enc, b64dec,
    keyShift, keyLetters, keyRails,
    enc, dec, decSync, solve, readability, ALGS, KEYLESS,
    hasSubtle,
    // 给自检用
    _caesar: caesar, _vigenere: vigenere, _rail: rail,
    _morse: morseEnc, _bacon: baconEnc, _atbash: atbash,
  };
})(window);
