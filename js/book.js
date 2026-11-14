/* ============================================================
   book.js — 柜台底下那本册子
   ------------------------------------------------------------
   游戏里所有的记录都在讲"别人"：三十五件东西、三十六行名单、
   七个客人。这一本不讲别人。

   它记的是你：你走到这里几次、每次走到了哪一种结局、
   你给自己起过几个名字、你撕过几个纸人、你掀过几次别人的东西。

   它跨存档、跨周目，重开也不清——因为它记的不是这一局。
   同一个人把它还回来的时候，它应该还是热的。
   ============================================================ */
(function (global) {
  'use strict';

  const LS = 'code_echo_book_v1';

  const EMPTY = () => ({
    v: 1,
    runs: 0,        // 走到终章并按下纸的次数
    first: 0,
    last: 0,
    reached: {},    // 结局 id → 次数
    names: [],      // 用过名字（去重、保序）
    hurt: 0,        // 累计撕掉的纸人
    deleted: 0,     // 累计删除的节点
    relics: 0,      // 单局最多带过几件
    read35: 0,      // 单局最多读过几个人
    peaks: 0,       // 累计掀开别人东西的次数
    sealed: 0,      // 合上册子的次数
  });

  const Book = {
    key: LS,

    read() {
      const d = EMPTY();
      try {
        const o = JSON.parse(localStorage.getItem(LS) || '{}') || {};
        d.runs = o.runs | 0;
        d.first = Number(o.first) || 0;
        d.last = Number(o.last) || 0;
        d.reached = (o.reached && typeof o.reached === 'object') ? o.reached : {};
        d.names = Array.isArray(o.names) ? o.names.filter((x) => typeof x === 'string') : [];
        d.hurt = o.hurt | 0;
        d.deleted = o.deleted | 0;
        d.relics = o.relics | 0;
        d.read35 = o.read35 | 0;
        d.peaks = o.peaks | 0;
        d.sealed = o.sealed | 0;
      } catch (e) { /* 坏了就当新的，别弄崩游戏 */ }
      return d;
    },

    save(d) {
      try { localStorage.setItem(LS, JSON.stringify(d)); } catch (e) {}
      return d;
    },

    clear() { try { localStorage.removeItem(LS); } catch (e) {} },

    /* 一局结束记一笔。只在终章按下纸之后调用。 */
    run(S, e) {
      const d = this.read();
      const s = (S && S.sys) || {};
      const now = Date.now();
      d.runs += 1;
      if (!d.first) d.first = now;
      d.last = now;
      if (e && e.id) d.reached[e.id] = (d.reached[e.id] || 0) + 1;

      const nm = String((S && S.playerName) || '').trim();
      if (nm && nm !== '未登记' && d.names.indexOf(nm) < 0) {
        d.names.push(nm);
        if (d.names.length > 12) d.names.shift();
      }

      d.hurt += s.hurt || 0;
      d.deleted += s.deleted || 0;
      d.relics = Math.max(d.relics, s.memRelics || 0);
      d.read35 = Math.max(d.read35, s.memRead || 0);
      d.peaks += (s.duty && s.duty.peek) || 0;
      return this.save(d);
    },

    seal() {
      const d = this.read();
      d.sealed += 1;
      return this.save(d);
    },

    /* 够不够格看见第十张纸：
       得走过两次以上，而且两次不是同一种结局。
       只走一遍的人，不该知道自己正在被读。 */
    ok() {
      const d = this.read();
      const ids = Object.keys(d.reached);
      const total = ids.reduce((a, k) => a + (d.reached[k] | 0), 0);
      return total >= 2 && ids.length >= 2;
    },

    /* 念给你听的那几行。宁可少一句，不要凑数。 */
    report(S) {
      const d = this.read();
      const E = global.Endings;
      const nameOf = (id) => {
        const e = E && E.get ? E.get(id) : null;
        return e ? e.name : '某个没有名字的地方';
      };
      const ids = Object.keys(d.reached).sort((a, b) => (d.reached[b] | 0) - (d.reached[a] | 0));
      const out = [];

      out.push('你走到这里 ' + d.runs + ' 次。');

      if (ids.length) {
        const top = ids.slice(0, 3).map((id) => {
          const n = d.reached[id] | 0;
          return '「' + nameOf(id) + '」' + n + ' 次';
        });
        out.push('你落下的地方：' + top.join('，') + '。');
      }

      const rep = ids.find((id) => (d.reached[id] | 0) >= 2);
      if (rep) out.push('「' + nameOf(rep) + '」那一页，你翻回去了不止一次。');

      if (d.names.length >= 3) {
        out.push('你给自己起过 ' + d.names.length + ' 个名字：' + d.names.join('、') + '。');
      } else if (d.names.length === 2) {
        out.push('你用过两个名字：' + d.names.join('、') + '。');
      } else if (d.names.length === 1) {
        out.push('你叫「' + d.names[0] + '」。每一次都是。');
      }

      if (d.hurt >= 4) out.push('你一共撕掉过 ' + d.hurt + ' 个纸人。');
      if (d.deleted >= 20) out.push('你删掉过 ' + d.deleted + ' 个节点。它们没有回来。');
      if (d.peaks >= 6) out.push('你掀开过 ' + d.peaks + ' 次别人的东西。');

      const dd = (S && S.sys && S.sys.duty) || null;
      if (dd && dd.picks && dd.picks.length) {
        out.push('这一次你办了 ' + dd.picks.length + ' 笔，油剩 ' + dd.oil + ' 格，' +
          (dd.lamp ? '灯续上了。' : '灯灭了。'));
      }

      const stt = (S && S.sys && S.sys.street) || null;
      if (stt && stt.seen && stt.seen.length) {
        const endTx = stt.end === 'file' ? '，把那张纸塞进了玻璃柜'
          : stt.end === 'tear' ? '，把那张纸撕了'
            : stt.end === 'keep' ? '，把那张纸收进了兜里' : '';
        out.push('打烊以后你出过一次门，走过 ' + stt.seen.length + ' 个门' + endTx + '。');
      }

      const hh = (S && S.hands) || null;
      if (hh) {
        const all = Object.keys(hh).filter((k) => hh[k] && hh[k].done);
        if (all.length) {
          const n = (a) => all.filter((k) => hh[k].act === a).length;
          const bits = [];
          if (n('give')) bits.push('交回去 ' + n('give'));
          if (n('keep')) bits.push('收进册子 ' + n('keep'));
          if (n('burn')) bits.push('烧掉 ' + n('burn'));
          out.push('你修好了 ' + all.length + ' 件东西' + (bits.length ? '：' + bits.join('，') + '。' : '。'));
        }
      }

      if (d.sealed > 0) out.push('上一次，你把这本册子合上了。');
      return out;
    },

    /* 数字，给档案册用 */
    stats() {
      const d = this.read();
      const ids = Object.keys(d.reached);
      return {
        runs: d.runs,
        kinds: ids.length,
        total: ids.reduce((a, k) => a + (d.reached[k] | 0), 0),
        names: d.names.length,
        sealed: d.sealed,
        hurt: d.hurt,
      };
    },
  };

  global.Book = Book;
})(window);
