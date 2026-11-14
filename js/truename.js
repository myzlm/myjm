/* ============================================================
   truename.js — 「真名」系统
   ------------------------------------------------------------
   基础码 BASE    首次登录时间 + 本机指纹 → SHA-256 → 8 位十六进制
   记忆码 MEMORY  所有通过核验的记忆 → 逐条哈希 → 聚合 → 16 位十六进制
   行为码 ACTION  结局 / 删节点 / 改节点 / 彩蛋 / 核验次数 → 6 位十进制
   真名印记 SIGIL 三层合成 → SHA-256 → Base64 前 32 位

   真名同时是《墨韵·科技卷轴》的密钥：不同层级对应不同算法。
   极少数人的基础码里带「远古印记」（1/37）——这是给社区的东西。
   ============================================================ */
(function (global) {
  'use strict';

  const LS = 'code_echo_truename';
  const VER = 3;

  function hw() {
    if (global.G && global.G.hwFingerprint) return global.G.hwFingerprint();
    // 独立卷轴页没有 fx.js，这里自己算一份同构指纹
    const parts = [
      navigator.userAgent, navigator.language, screen.width, screen.height,
      screen.colorDepth, new Date().getTimezoneOffset(), navigator.hardwareConcurrency || 0,
    ];
    return global.Cipher.sha256hex(parts.join('|')).slice(0, 16).toUpperCase();
  }

  function pad(n, w) { return String(n).padStart(w, '0'); }

  const TrueName = {
    data: null,

    /* ---------- 读盘 ---------- */
    load() {
      try {
        const raw = localStorage.getItem(LS);
        if (!raw) return null;
        const o = JSON.parse(raw);
        if (!o || o.ver !== VER || !o.base) return null;
        this.data = o;
        return o;
      } catch (e) { return null; }
    },

    save() {
      try { localStorage.setItem(LS, JSON.stringify(this.data)); } catch (e) {}
      this.sync();
      return this.data;
    },

    /* 给独立卷轴页 / 事件监听者用的同步副本 */
    sync() {
      try { localStorage.setItem('code_echo_truename', JSON.stringify(this.data)); } catch (e) {}
      try {
        global.dispatchEvent(new CustomEvent('codeEchoTruename', { detail: this.data }));
      } catch (e) {}
    },

    /* ---------- 生成 / 取用 ---------- */
    ensure() {
      if (this.data) return this.data;
      if (this.load()) return this.data;

      const now = Date.now();
      const base = global.Cipher.sha256hex(now + '|' + hw() + '|earth-online').slice(0, 8).toUpperCase();
      this.data = {
        ver: VER,
        at: now,
        base,
        memory: '0000000000000000',
        action: '000000',
        sigil: '',
        memories: [],     // 字符串（原文）用于重算
        marks: [],        // 用过的记忆哈希
        counts: { end: 0, del: 0, mod: 0, egg: 0, ver: 0, talk: 0 },
      };
      this.recompute();
      this.save();
      return this.data;
    },

    recompute() {
      const d = this.data;
      if (!d) return;

      // 记忆码
      if (d.marks && d.marks.length) {
        d.memory = global.Cipher.sha256hex(d.marks.join('|')).slice(0, 16).toUpperCase();
      } else {
        d.memory = '0000000000000000';
      }

      // 行为码：加权后取模 1e6
      const c = d.counts || {};
      const n = (c.end || 0) * 137 + (c.del || 0) * 911 + (c.mod || 0) * 313 +
        (c.egg || 0) * 37 + (c.ver || 0) * 53 + (c.talk || 0) * 7 + (c.soul ? 1 : 0);
      d.action = pad(n % 1000000, 6);

      // 真名印记
      const sig = global.Cipher.b64enc(
        global.Cipher.sha256hex(d.base + '|' + d.memory + '|' + d.action + '|' + d.at)
      ).replace(/=+$/, '');
      d.sigil = sig.slice(0, 32);

      // 远古印记
      d.ancient = (parseInt(d.base.slice(0, 6), 16) % 37) === 0;
    },

    /* ---------- 记账 ---------- */
    bump(k, n) {
      this.ensure();
      this.data.counts[k] = (this.data.counts[k] || 0) + (n || 1);
      this.recompute();
      this.save();
      return this.data;
    },

    addMemory(text) {
      this.ensure();
      const h = global.Cipher.sha256hex(text).slice(0, 32);
      if (this.data.marks.indexOf(h) < 0) {
        this.data.marks.push(h);
        this.data.memories.push(text.slice(0, 400));
        if (this.data.memories.length > 20) { this.data.memories.shift(); this.data.marks.shift(); }
        this.bump('ver', 0);
        this.recompute();
        this.save();
      }
      return this.data;
    },

    /* ---------- 密钥 ---------- */
    key(level) {
      const d = this.ensure();
      switch (level) {
        case 'memory': return d.memory;
        case 'action': return d.action;
        case 'sigil': return d.sigil;
        case 'base':
        default: return d.base;
      }
    },

    label(level) {
      return { base: '基础码 BASE', memory: '记忆码 MEMORY', action: '行为码 ACTION', sigil: '真名印记 SIGIL' }[level] || level;
    },

    /* ---------- 渲染一张真名卡 ---------- */
    cardHTML() {
      const d = this.ensure();
      const row = (k, label, v, cls) =>
        '<div class="tn-row ' + (cls || '') + '"><span class="tn-k">' + label + '</span>' +
        '<span class="tn-v" data-copy="' + v + '">' + v + '</span></div>';
      return '' +
        '<div class="tn-card">' +
        '<div class="tn-head"><span>真名 · ' + (global.State && State.playerName ? State.playerName : '未登记') + '</span>' +
        '<span class="tn-no">No.' + (d.ancient ? '0037' : '0036') + '</span></div>' +
        '<div class="tn-sigil">' + d.sigil.replace(/[^A-Za-z0-9]/g, '').slice(0, 8) + '</div>' +
        row('base', '基础码 · BASE', d.base) +
        row('memory', '记忆码 · MEMORY', d.memory) +
        row('action', '行为码 · ACTION', d.action) +
        row('sigil', '真名印记 · SIGIL', d.sigil, 'wide') +
        '<div class="tn-foot">' +
        '<span>登记于 ' + new Date(d.at).toLocaleString('zh-CN', { hour12: false }) + '</span>' +
        '<span>' + (d.ancient ? '<b class="tn-ancient">远古印记</b>' : '已抵押记忆 ' + d.memories.length + ' 段') + '</span>' +
        '</div>' +
        '<div class="tn-tip">真名是密钥。去《墨韵·科技卷轴》里用它。</div>' +
        '</div>';
    },
  };

  /* 首次进入即登记（序章之前也算：登录时间就是"第一次登录"） */
  TrueName.ensure();

  global.TrueName = TrueName;
})(window);
