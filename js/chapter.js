/* ============================================================
   chapter.js — 九张票根
   ------------------------------------------------------------
   每一章进门之前，柜台给你一张票。
   票上印着：第几章、叫什么、还有两句题记。
   右下角盖一枚章，盖完才放你进去。

   同一章第二遍进来，票只晃一下就走 —— 仪式是给第一次的。
   票根收在档案册里，翻过来能看见它借的是谁的胆子。
   ============================================================ */
(function (global) {
  'use strict';

  const { $, wait } = global.G;

  const LS = 'code_echo_cards_v1';

  /* 九张。id 与章节一一对应，顺序就是玩的顺序。 */
  const CARDS = {
    ch0: {
      no: '序 章',
      name: '登录地球 online',
      seall: '入',
      epi: ['你收到一封没有寄件人的邮件。', '附件是一个游戏，说明只有一句：请在一小时内装好。'],
      foot: ['未登录 · 延迟 —', '访客通道已关闭'],
      back: '借《Pony Island》的胆子：把游戏本身当成一扇门，而不是一段内容。你打开的不是程序，是别人的入口。',
    },
    ch1: {
      no: '第 一 章',
      name: '邮 件',
      seall: '录',
      epi: ['柜台后面坐着一个老人。', '他说，你比前面那三十五个都快。'],
      foot: ['代号 036', '登记 · 已划销'],
      back: '借《The Stanley Parable》：所有选择都是被摆好的，唯一自由的是你什么时候发现这一点。',
    },
    ch2: {
      no: '第 二 章',
      name: '抵 押',
      seall: '押',
      epi: ['登记是给活人看的。', '抵押是给这边看的。'],
      foot: ['今夜', '押品 · 待填'],
      back: '借《The Beginner\u2019s Guide》：讲述者说的和你亲眼看见的，从来不是同一件事。',
    },
    ch3: {
      no: '第 三 章',
      name: '他 说 的 话',
      seall: '证',
      epi: ['他说的每一句话，', '都能在店里找到反证。'],
      foot: ['六件物证', '六句谎'],
      back: '借《Return of the Obra Dinn》：一句证词不算数，得拿东西对上去，对上了才算数。',
    },
    ch4: {
      no: '第 四 章',
      name: '渲 染 层',
      seall: '薄',
      epi: ['这里所有的东西都是画上去的，', '侧面零像素。'],
      foot: ['走廊的正面', '背面未渲染'],
      back: '借《Superliminal》与《P.T.》：走廊会自己重排，你以为自己在往前走。',
    },
    ch5: {
      no: '第 五 章',
      name: '根 目 录',
      seall: '根',
      epi: ['三十七不是上限。', '是这一版列表的长度。'],
      foot: ['记录库', '第 036 行'],
      back: '借《Undertale》与《DDLC》：存档、删档、改一行注释，都是叙事的一部分。',
    },
    ch6: {
      no: '第 六 章',
      name: '收 摊',
      seall: '当',
      epi: ['七个人，九格油。', '你写下的那一行，会跟着他们三年。'],
      foot: ['九格油', '七位客人'],
      back: '借《Papers, Please》：一张表格，一支笔，和一条不许你全都放过的规矩。',
    },
    ch7: {
      no: '第 七 章',
      name: '门 外',
      seall: '外',
      epi: ['打烊以后你走了一条街。', '昨晚写的字，已经落到人身上了。'],
      foot: ['五个门', '一张纸'],
      back: '借《Kentucky Route Zero》与《That Dragon, Cancer》的胆子：一条街只给一束光，人自己站着，不等旁白介绍。也借《Disco Elysium》：不给选项，给三个姿态 —— 走近、说一句、走开。',
    },
    ch8: {
      no: '终 章',
      name: '回 响',
      seall: '回',
      epi: ['结局不看你最后点了哪张纸，', '而看你做过的事的形状。'],
      foot: ['二十三种', '写完就落一张卡'],
      back: '借《NieR: Automata》：结局不是奖励，是你做过的事的形状。',
    },
  };

  const ORDER = ['ch0', 'ch1', 'ch2', 'ch3', 'ch4', 'ch5', 'ch6', 'ch7', 'ch8'];

  /* ---------- 票根存根 ---------- */
  function read() {
    try {
      const a = JSON.parse(localStorage.getItem(LS) || '[]');
      return Array.isArray(a) ? a.filter((x) => CARDS[x]) : [];
    } catch (e) { return []; }
  }
  function write(a) {
    try { localStorage.setItem(LS, JSON.stringify(a.filter((x, i) => a.indexOf(x) === i))); } catch (e) {}
  }

  /* 旧存根里 ch7 是终章。现在第七章占了 ch7，终章挪到 ch8。
     老玩家的票要挪一格，否则第七章的票会被当成"已经看过"。 */
  (function migrate() {
    try {
      const a = read();
      const i = a.indexOf('ch7');
      if (i >= 0 && a.indexOf('ch8') < 0) {
        a[i] = 'ch8';
        write(a);
      }
    } catch (e) {}
  })();

  const Chapter = {
    CARDS: CARDS,
    ORDER: ORDER,
    _busy: false,
    _el: null,

    seen(id) { return read().indexOf(id) >= 0; },
    count() { return read().length; },
    mark(id) {
      if (!CARDS[id]) return;
      const a = read();
      if (a.indexOf(id) < 0) { a.push(id); write(a); }
      if (global.Sys && global.Sys.state) global.Sys.state();
    },
    /* 档案册要的：按顺序，带 seen */
    list() {
      const got = read();
      return ORDER.map((id) => {
        const c = CARDS[id];
        return {
          id: id, no: c.no, name: c.name.replace(/\s/g, ''), seall: c.seall,
          epi: c.epi, foot: c.foot, back: c.back,
          seen: got.indexOf(id) >= 0,
        };
      });
    },
    miss() { return ORDER.filter((id) => !this.seen(id)); },

    /* ---------- 造那张票 ---------- */
    build() {
      if (this._el && document.body.contains(this._el)) return this._el;
      const d = document.createElement('div');
      d.className = 'cc';
      d.id = 'chapcard';
      d.innerHTML =
        '<div class="cc-grain"></div>' +
        '<div class="cc-body">' +
        '  <div class="cc-stamp"><b></b></div>' +
        '  <div class="cc-no"></div>' +
        '  <div class="cc-name"></div>' +
        '  <div class="cc-rule"></div>' +
        '  <div class="cc-epi"></div>' +
        '  <div class="cc-foot"></div>' +
        '</div>' +
        '<div class="cc-tip">点一下，或者按任意键</div>';
      document.body.appendChild(d);
      this._el = d;
      return d;
    },

    /**
     * 放一张票。
     * @param {string} id  ch0..ch8
     * @param {number} [hold] 停留毫秒（默认 2000）
     */
    show(id, hold) {
      const c = CARDS[id];
      if (!c) return Promise.resolve();
      if (this._busy) return Promise.resolve();

      const again = this.seen(id);
      const el = this.build();
      const body = el.querySelector('.cc-body');
      const no = el.querySelector('.cc-no');
      const nm = el.querySelector('.cc-name');
      const epi = el.querySelector('.cc-epi');
      const foot = el.querySelector('.cc-foot');
      const st = el.querySelector('.cc-stamp');

      no.textContent = c.no;
      /* 中文一字一帧，西文连成一串 —— 否则 "online" 会被拆成五个字母慢慢飘出来 */
      const seq = [];
      let buf = '';
      c.name.split('').forEach((ch) => {
        if (/[A-Za-z0-9'.]/.test(ch)) { buf += ch; return; }
        if (buf) { seq.push({ t: buf, en: 1 }); buf = ''; }
        seq.push({ t: ch });
      });
      if (buf) seq.push({ t: buf, en: 1 });
      let k = 0;
      nm.innerHTML = seq.map((s) => {
        if (s.t === ' ') return '<i style="width:.32em"></i>';
        const d = 420 + (k++) * 62;
        return '<span' + (s.en ? ' class="en"' : '') + ' style="animation-delay:' + d + 'ms">' +
          s.t.replace(/</g, '&lt;') + '</span>';
      }).join('');
      epi.innerHTML = c.epi.map((t) => '<p>' + t + '</p>').join('');
      foot.innerHTML = c.foot.map((t) => '<span>' + t + '</span>').join('');
      st.querySelector('b').textContent = c.seall;

      this._busy = true;
      el.dataset.short = again ? '1' : '0';
      el.classList.remove('out', 'in');
      void el.offsetWidth;
      el.classList.add('in', 'on');
      this.mark(id);

      if (global.Snd) {
        try {
          global.Snd.init();
          global.Snd.tone(220, 1.1, { type: 'sine', gain: .035, attack: .28 });
        } catch (e) {}
      }
      /* 章落下来的那一下，和动画里的 1.62s 对齐 */
      const stampT = again ? 0 : setTimeout(() => {
        try { global.Snd.stamp(); } catch (e) {}
      }, 1600);

      return new Promise((resolve) => {
        let done = false;
        let t1 = 0;
        const finish = () => {
          if (done) return;
          done = true;
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(stampT);
          document.removeEventListener('keydown', onKey, true);
          el.removeEventListener('click', finish);
          el.classList.add('out');
          el.classList.remove('in');
          setTimeout(() => {
            el.classList.remove('on', 'out');
            this._busy = false;
            resolve();
          }, again ? 260 : 620);
        };
        const onKey = (e) => {
          if (e.key === 'Escape' || e.key === ' ' || e.key === 'Enter' || e.key.length === 1) {
            e.preventDefault(); e.stopPropagation(); finish();
          }
        };
        el.addEventListener('click', finish);
        document.addEventListener('keydown', onKey, true);
        var t2 = 0;
        if (again) {
          t1 = setTimeout(finish, 1000);
        } else {
          t1 = setTimeout(finish, hold || 3000);
        }
      });
    },

    /* 调试：?cards=0 关掉；?cards=reset 清空存根 */
    off() {
      const qs = new URLSearchParams(location.search);
      return qs.get('cards') === '0';
    },
  };

  if (typeof URLSearchParams !== 'undefined' && location.search.indexOf('cards=reset') >= 0) write([]);

  global.Chapter = Chapter;
})(window);
