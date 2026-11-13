/* ============================================================
   dialogue.js — 对话系统（打字机 / 选项 / 话题树）
   ============================================================ */
(function (global) {
  'use strict';
  const { $, wait } = global.G;

  const Dlg = {
    active: false,
    nodeId: null,
    node: null,
    lines: [],
    lineIdx: 0,
    typing: false,
    timer: null,
    resolve: null,
    onClose: null,
    seenChoice: {},
    inited: false,

    init() {
      if (this.inited) return;
      this.inited = true;

      const panel = $('#cs-dlg');
      panel.addEventListener('click', (e) => {
        if (e.target.closest('.dlg-choice')) return;
        e.stopPropagation();
        this.advance();
      });

      document.addEventListener('keydown', (e) => {
        if (!this.active) return;
        if (e.code === 'Space' || e.code === 'Enter' || e.code === 'NumpadEnter') {
          e.preventDefault();
          this.advance();
        }
        if (e.key === 'Escape') { e.preventDefault(); this.close(); }
      });
    },

    /* ---------------- 打开一个节点 ---------------- */
    open(id, opts) {
      this.init();
      if (!id || !global.DLG[id]) { if (opts && opts.onClose) opts.onClose(); return Promise.resolve(); }
      this.onClose = opts && opts.onClose;
      return new Promise((resolve) => {
        this.resolve = resolve;
        this.openNode(global.DLG[id], id);
      });
    },

    openNode(node, idForSeen) {
      this.active = true;
      this.node = node;
      this.nodeId = idForSeen || null;
      this.lineIdx = 0;
      this.lines = typeof node.lines === 'function' ? (node.lines() || []) : (node.lines || []);

      // 对话一开，先把场景里的独白收掉，免得两行字压在一起
      const nar = $('#cs-dialogue');
      if (nar) nar.classList.remove('on');
      document.body.classList.add('dlging');

      const panel = $('#cs-dlg');
      panel.classList.add('on');
      panel.classList.remove('choosing');
      $('#dlg-choices').innerHTML = '';
      $('#dlg-choices').classList.remove('on');
      $('#dlg-text').textContent = '';
      this.setName(node.who || '艾');

      if (this.lines.length) this.typeLine(this.lines[0]);
      else this.afterLines();
    },

    setName(who) {
      const el = $('#dlg-name');
      el.textContent = who;
      el.className = 'dlg-name ' + (who === '你' ? 'me' : 'npc');
    },

    /* ---------------- 打字机 ---------------- */
    typeLine(text) {
      const el = $('#dlg-text');
      el.textContent = '';
      this.typing = true;
      $('#dlg-tip').textContent = '点击跳过';
      let i = 0;
      clearInterval(this.timer);
      this.timer = setInterval(() => {
        if (i >= text.length) {
          clearInterval(this.timer);
          this.typing = false;
          $('#dlg-tip').textContent = '点击继续';
          return;
        }
        const ch = text[i++];
        el.textContent += ch;
        if (ch !== '，' && ch !== '。' && i % 3 === 0) {
          global.Snd.tone(1500, 0.014, { type: 'square', gain: 0.008 });
        }
      }, 26);
    },

    finishTyping() {
      clearInterval(this.timer);
      this.typing = false;
      $('#dlg-text').textContent = this.lines[this.lineIdx];
      $('#dlg-tip').textContent = '点击继续';
    },

    /* ---------------- 推进 ---------------- */
    advance() {
      if (!this.active) return;
      global.Snd.init();
      if (this.typing) { this.finishTyping(); return; }
      if ($('#dlg-choices').classList.contains('on')) return;   // 等选择

      this.lineIdx++;
      if (this.lineIdx < this.lines.length) {
        this.typeLine(this.lines[this.lineIdx]);
        return;
      }
      this.afterLines();
    },

    afterLines() {
      const node = this.node;
      if (node.choices) {
        const list = typeof node.choices === 'function' ? (node.choices() || []) : node.choices;
        this.showChoices(list);
        return;
      }
      const nxt = typeof node.next === 'function' ? node.next() : node.next;
      if (nxt && global.DLG[nxt]) { this.openNode(global.DLG[nxt], nxt); return; }
      this.close();
    },

    /* ---------------- 选项 ---------------- */
    showChoices(list) {
      const box = $('#dlg-choices');
      box.innerHTML = '';
      const avail = list.filter((c) => {
        if (c.if && !c.if()) return false;
        if (c.once) {
          const k = (this.nodeId || '') + '|' + c.text;
          if (this.seenChoice[k]) return false;
        }
        return true;
      });
      if (!avail.length) { this.close(); return; }

      avail.forEach((c) => {
        const b = document.createElement('button');
        b.className = 'dlg-choice' + (c.key ? ' dlg-key' : '');
        b.textContent = c.text;
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          global.Snd.click();
          if (c.once) this.seenChoice[(this.nodeId || '') + '|' + c.text] = true;
          box.classList.remove('on');
          box.innerHTML = '';
          if (!c.to) { this.close(); return; }
          // 把玩家的话念出来，再进下一个节点
          const echo = { who: '你', lines: [c.text], next: c.to };
          this.openNode(echo, null);
        });
        box.appendChild(b);
      });
      box.classList.add('on');
      $('#cs-dlg').classList.add('choosing');
      $('#dlg-tip').textContent = '选择一句话';
    },

    /* ---------------- 关闭 ---------------- */
    close() {
      if (!this.active) return;
      this.active = false;
      clearInterval(this.timer);
      this.typing = false;
      document.body.classList.remove('dlging');
      $('#cs-dlg').classList.remove('on');
      $('#dlg-choices').classList.remove('on');
      $('#dlg-choices').innerHTML = '';
      const cb = this.onClose;
      this.onClose = null;
      const r = this.resolve;
      this.resolve = null;
      if (r) r();
      if (cb) cb();
    },

    // 外部常用：一段独白（不进话题树）
    async say(who, lines, opts) {
      this.init();
      const node = { who: who, lines: lines, next: null };
      return new Promise((resolve) => {
        this.onClose = () => resolve();
        this.resolve = resolve;
        this.openNode(node, null);
        if (opts && opts.auto) {
          // 自动播完关闭，不打断流程太多
          const total = lines.join('').length * 26 + 900;
          setTimeout(() => { if (this.active && this.node === node) this.close(); }, total);
        }
      });
    },
  };

  global.Dlg = Dlg;
})(window);
