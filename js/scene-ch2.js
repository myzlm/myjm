/* ============================================================
   scene-ch2.js — 第二章：账本抽屉 / 记忆胶片 / 愿望天平
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Fade, Toast, Shake, Ach } = global.G;

  /* ============================================================
     1. 账本 · 抽屉锁
     ============================================================ */
  const Ledger = {
    inited: false,
    sel: [null, null, null],   // null 或 'broken'/'plain'/'fine'/'perfect'
    tries: 0,

    init() {
      if (this.inited) return;
      this.inited = true;

      // 三行账
      const box = $('#lg-rows');
      box.innerHTML = '';
      LEDGER.rows.forEach((row, i) => {
        const d = document.createElement('div');
        d.className = 'lg-row';
        d.innerHTML =
          '<div class="lg-no">' + row.no + '</div>' +
          '<div class="lg-mem">' + row.memory + '</div>' +
          '<button class="lg-key" data-i="' + i + '">' +
            '<span class="lg-key-dot"></span><span class="lg-key-name">？</span>' +
          '</button>';
        box.appendChild(d);
        d.querySelector('.lg-key').addEventListener('click', (e) => {
          e.stopPropagation();
          this.cycle(i);
        });
      });

      // 缺页：让这本账有年头
      const gap = document.createElement('div');
      gap.className = 'lg-gap';
      gap.textContent = '—— 第三十四、三十五页，被撕走了 ——';
      box.appendChild(gap);

      // 第三十六行：留给你自己
      const mine = document.createElement('div');
      mine.className = 'lg-row mine';
      mine.innerHTML =
        '<div class="lg-no">三十六</div>' +
        '<div class="lg-mem">（这一行还是空的。笔是新的。）</div>' +
        '<div class="lg-key-ro">？？</div>';
      box.appendChild(mine);

      // 页脚线索
      const cl = $('#lg-clue-list');
      cl.innerHTML = '';
      LEDGER.clues.forEach((c) => {
        const p = document.createElement('div');
        p.className = 'lg-clue' + (c.hard ? '' : ' soft');
        p.textContent = c.t;
        cl.appendChild(p);
      });
      $('#lg-rule').innerHTML = LEDGER.rule;

      // 锁孔
      const slots = $('#lg-slots');
      slots.innerHTML = '';
      for (let i = 0; i < 3; i++) {
        const s = document.createElement('div');
        s.className = 'lg-slot';
        s.dataset.i = i;
        s.textContent = '？';
        slots.appendChild(s);
      }

      $('#lg-check').addEventListener('click', (e) => { e.stopPropagation(); this.check(); });
      $('#lg-back').addEventListener('click', async (e) => {
        e.stopPropagation();
        await Fade.through(() => { App.show('counter'); Counter.init(); });
      });
    },

    start() {
      this.init();
      if (State.ledgerSolved) {
        this.sel = LEDGER.rows.map((r) => r.key);
      }
      this.tries = 0;
      $('#lg-msg').textContent = '';
      this.render();
      $('#lg-hint').textContent = '锁上有三格。一格对一行账。';
    },

    cycle(i) {
      Snd.init();
      const order = [null].concat(TIER_ORDER);
      const cur = order.indexOf(this.sel[i]);
      this.sel[i] = order[(cur + 1) % order.length];
      Snd.key();
      this.render();
    },

    render() {
      $$('.lg-key').forEach((b) => {
        const i = +b.dataset.i;
        const k = this.sel[i];
        const t = k ? KEY_TIERS[k] : null;
        b.querySelector('.lg-key-name').textContent = t ? t.name : '？';
        b.style.setProperty('--kc', t ? t.color : '#4a4136');
        b.classList.toggle('set', !!k);
      });
      $$('.lg-slot').forEach((s) => {
        const k = this.sel[+s.dataset.i];
        s.textContent = k ? KEY_TIERS[k].name.slice(0, 1) : '？';
        s.classList.toggle('set', !!k);
        s.style.borderColor = k ? KEY_TIERS[k].color : '';
        s.style.color = k ? KEY_TIERS[k].color : '';
      });
    },

    check() {
      if (this.sel.some((k) => !k)) {
        Snd.deny();
        $('#lg-msg').textContent = '三格都得填。账不能留空。';
        return;
      }
      const ok = this.sel.every((k, i) => k === LEDGER.rows[i].key);
      if (ok) {
        Snd.ok();
        Snd.tone(520, 0.4, { type: 'triangle', gain: 0.07 });
        $('#lg-msg').textContent = '咔。三道锁舌一起退回去了。';
        $('#lg-msg').classList.add('good');
        $('.lg-lock').classList.add('open');
        setTimeout(() => this.succeed(), 1100);
      } else {
        this.tries++;
        Snd.deny();
        Shake.start($('.lg-book'), 3, 40);
        setTimeout(() => Shake.stop(), 420);
        $('#lg-msg').classList.remove('good');
        $('#lg-msg').textContent = this.tries >= 2
          ? '锁芯不动。……再想想：齿最浅的是谁？'
          : '锁芯不动。账上不是这么写的。';
      }
    },

    async succeed() {
      State.ledgerSolved = true;
      State.ch2 = Math.max(State.ch2, 2);
      Ach.show('账房先生', '没问人，自己把旧账算明白了。');
      await Fade.through(() => { App.show('counter'); Counter.init(); });
      await Dlg.open('afterLedger');
      Lies.gain('margin');
      await wait(900);
      await Fade.through(() => { App.show('film'); Film.start(); });
    },
  };

  /* ============================================================
     2. 胶片 · 接回去
     ============================================================ */
  const Film = {
    inited: false,
    order: [],        // 当前槽位上的原始行号
    sel: -1,
    errors: 0,
    hintUsed: 0,

    init() {
      if (this.inited) return;
      this.inited = true;
      $('#fm-check').addEventListener('click', (e) => { e.stopPropagation(); this.check(); });
      $('#fm-hint').addEventListener('click', (e) => { e.stopPropagation(); this.readAloud(); });
      $('#fm-strips').addEventListener('click', (e) => {
        const s = e.target.closest('.fm-strip');
        if (s) this.pick(+s.dataset.slot);
      });
    },

    start() {
      this.init();
      this.sel = -1;
      if (!State.filmSolved) {
        this.errors = 0;
        this.order = this.shuffle();
      } else {
        this.order = FILM_LINES.map((_, i) => i);
      }
      this.render();
      $('#fm-msg').textContent = '';
      $('#fm-msg').className = 'fm-msg';
      $('#fm-hint').textContent = '让他念一遍（会少一点细节）';
      this.updateHead();
    },

    shuffle() {
      const idx = FILM_LINES.map((_, i) => i);
      for (let t = 0; t < 40; t++) {
        for (let i = idx.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          const tmp = idx[i]; idx[i] = idx[j]; idx[j] = tmp;
        }
        // 至少要有 6 段不在原位，不然开局就像已经接好了
        const wrong = idx.filter((v, i) => v !== i).length;
        if (wrong >= 6) break;
      }
      return idx;
    },

    render() {
      const box = $('#fm-strips');
      box.innerHTML = '';
      this.order.forEach((lineNo, slot) => {
        const d = document.createElement('div');
        d.className = 'fm-strip' + (this.sel === slot ? ' sel' : '');
        d.dataset.slot = slot;
        d.innerHTML =
          '<span class="fm-no">' + String(slot + 1).padStart(2, '0') + '</span>' +
          '<span class="fm-tx">' + FILM_LINES[lineNo] + '</span>';
        box.appendChild(d);
      });
    },

    pick(slot) {
      Snd.init();
      if (this.sel === -1) {
        this.sel = slot;
        Snd.tone(700, 0.05, { type: 'triangle', gain: 0.04 });
        this.render();
        $('#fm-msg').textContent = '再点一段，和它换位置。';
      } else if (this.sel === slot) {
        this.sel = -1;
        Snd.tone(420, 0.05, { type: 'triangle', gain: 0.035 });
        this.render();
        $('#fm-msg').textContent = '';
      } else {
        const a = this.sel;
        const t = this.order[a];
        this.order[a] = this.order[slot];
        this.order[slot] = t;
        this.sel = -1;
        Snd.noise(0.08, { type: 'highpass', freq: 3000, gain: 0.05 });
        Snd.tone(880, 0.06, { type: 'triangle', gain: 0.04 });
        this.render();
        $('#fm-msg').textContent = '';
      }
    },

    updateHead() {
      const correct = this.order.filter((v, i) => v === i).length;
      $('#fm-detail').textContent = State.filmSolved
        ? '记忆细节：' + State.detail + ' / 8'
        : '已经接对：' + correct + ' / 8';
    },

    async readAloud() {
      if (State.filmSolved) return;
      this.hintUsed++;
      this.errors = Math.min(5, this.errors + 1);
      Snd.noise(0.3, { type: 'bandpass', freq: 700, q: 1, gain: 0.05 });
      const first = FILM_LINES[0];
      Toast.show('艾：「' + first + '」', 4200);
      $('#fm-msg').textContent = '他念了第一段。你少了一点细节。';
      this.updateHead();
    },

    async check() {
      const wrong = this.order.filter((v, i) => v !== i).length;
      if (wrong === 0) return this.succeed();
      this.errors++;
      Snd.deny();
      Shake.start($('.fm-strips'), 3, 40);
      setTimeout(() => Shake.stop(), 400);
      $('#fm-msg').className = 'fm-msg bad';
      if (this.errors >= 3) {
        $('#fm-msg').textContent = '接不上。' + (wrong <= 2
          ? '只剩 ' + wrong + ' 段位置不对了，找找哪句接不上。'
          : '先从「那年夏天」开始，时间是往下的。');
      } else {
        $('#fm-msg').textContent = '有 ' + wrong + ' 段接错了。胶片的边会亮一下。';
      }
      this.updateHead();
    },

    async succeed() {
      State.filmSolved = true;
      const detail = Math.max(3, 8 - Math.min(5, this.errors));
      State.detail = detail;
      State.keyQ = tierOfDetail(detail);
      State.ch2 = Math.max(State.ch2, 3);
      Snd.ok();
      Snd.tone(660, 0.5, { type: 'triangle', gain: 0.06 });
      this.updateHead();
      $('#fm-msg').className = 'fm-msg good';
      $('#fm-msg').textContent = '接上了。八段，一段不少。';
      Ach.show('细节控', '把一段记忆接得一段不差。');
      await wait(1200);
      await Fade.through(() => { App.show('counter'); Counter.init(); });
      await Dlg.open('afterFilm');
      Counter.refreshHud();
      Counter.updateHint();
    },
  };

  /* ============================================================
     3. 天平 · 抵押愿望
     ============================================================ */
  const Scale = {
    inited: false,
    wish: null,
    on: [false, false, false, false, false],
    STONES: [1, 2, 4, 8, 16],
    balanced: false,

    init() {
      if (this.inited) return;
      this.inited = true;
      $('#sc-wishes').addEventListener('click', (e) => {
        const c = e.target.closest('.sc-wish');
        if (c) this.pickWish(c.dataset.id);
      });
      $('#sc-stones').addEventListener('click', (e) => {
        const s = e.target.closest('.sc-stone');
        if (s) this.toggleStone(+s.dataset.w);
      });
    },

    start() {
      this.init();
      this.wish = State.wish ? (WISHES.find((w) => w.id === State.wish) || null) : null;
      this.on = [false, false, false, false, false];
      this.balanced = false;
      $('#sc-stage').classList.remove('on', 'done');
      $('#sc-sub').textContent = '选一个愿望。选完了，就不能反悔。';
      this.renderWishes();
      this.renderStones();
      this.renderBeam();
      this.syncWishState();
    },
    renderWishes() {
      const box = $('#sc-wishes');
      box.classList.remove('gone');
      box.innerHTML = '';
      WISHES.forEach((w) => {
        const d = document.createElement('button');
        d.className = 'sc-wish' + (State.wish === w.id ? ' taken' : '');
        d.dataset.id = w.id;
        d.innerHTML =
          '<span class="sc-wish-tx">' + w.label + '</span>' +
          '<span class="sc-wish-note">' + w.note + '</span>';
        box.appendChild(d);
      });
      box.classList.add('on');
    },

    syncWishState() {
      if (State.wish) {
        $$('.sc-wish').forEach((c) => {
          c.classList.toggle('taken', c.dataset.id === State.wish);
          c.disabled = true;
        });
      }
    },

    pickWish(id) {
      if (State.wish) return;
      Snd.init();
      const w = WISHES.find((x) => x.id === id);
      if (!w) return;
      State.wish = id;
      this.wish = w;
      Snd.tone(240, 0.5, { type: 'triangle', gain: 0.06 });
      $$('.sc-wish').forEach((c) => {
        c.classList.toggle('taken', c.dataset.id === id);
        c.disabled = true;
      });
      $('#sc-stage').classList.add('on');
      $('#sc-sub').textContent = '把秤配平。砝码只有这五块。';
      $$('.sc-stone').forEach((b) => { b.disabled = false; });
      this.renderBeam();
    },

    renderStones() {
      const box = $('#sc-stones');
      box.innerHTML = '';
      this.STONES.forEach((w) => {
        const b = document.createElement('button');
        b.className = 'sc-stone';
        b.dataset.w = w;
        b.textContent = w + ' 两';
        b.disabled = !State.wish;      // 先把愿望放上去，砝码才让动
        box.appendChild(b);
      });
    },

    toggleStone(w) {
      if (!this.wish || this.balanced) return;
      Snd.init();
      const i = this.STONES.indexOf(w);
      this.on[i] = !this.on[i];
      Snd.tone(this.on[i] ? 520 + i * 80 : 300, 0.07, { type: 'square', gain: 0.05 });
      $$('.sc-stone').forEach((b) => b.classList.toggle('on', this.on[this.STONES.indexOf(+b.dataset.w)]));
      this.renderBeam();
      const sum = this.sum();
      if (sum === this.wish.weight) this.balance();
    },

    sum() {
      return this.on.reduce((a, v, i) => a + (v ? this.STONES[i] : 0), 0);
    },

    renderBeam() {
      const left = this.wish ? this.wish.weight : 0;
      const right = this.sum();
      const diff = right - left;
      const deg = Math.max(-13, Math.min(13, diff * 1.6));
      $('#sc-beam').style.transform = 'rotate(' + deg + 'deg)';
      // 秤盘要一直垂着，跟着梁反着转
      $$('.sc-arm').forEach((a) => { a.style.transform = 'rotate(' + (-deg) + 'deg)'; });
      $('#sc-left-txt').textContent = this.wish ? left + ' 两' : '愿';
      $('#sc-right-txt').textContent = right > 0 ? right + ' 两' : '0';
      const p = $('#sc-poise');
      if (!this.wish) { p.textContent = '左：空　右：0 两'; return; }
      if (right === left) {
        p.textContent = '左 ' + left + ' 两　右 ' + right + ' 两　·　平了';
        p.classList.add('ok');
      } else {
        p.classList.remove('ok');
        p.textContent = '左 ' + left + ' 两　右 ' + right + ' 两　·　'
          + (right > left ? '右边沉下去了' : (right === 0 ? '还没放砝码' : '左边沉下去了'));
      }
    },

    async balance() {
      if (this.balanced) return;
      this.balanced = true;
      Snd.ok();
      Snd.tone(440, 0.6, { type: 'triangle', gain: 0.06 });
      $('#sc-stage').classList.add('done');
      $('#sc-sub').textContent = '秤平了。他把碗端了上来。';

      // 愿望被收走：纸条烧掉
      const card = $('.sc-wish.taken');
      if (card) {
        card.classList.add('burn');
        Snd.noise(0.9, { type: 'lowpass', freq: 2600, to: 400, gain: 0.08 });
      }

      await wait(1400);
      State.ateFood = true;
      State.ch2 = Math.max(State.ch2, 4);
      const w = this.wish;
      $('#sc-wishes').classList.add('gone');
      Toast.show('他端来：' + w.dish, 4200);
      Snd.tone(300, 2.4, { type: 'sine', gain: 0.05, attack: .4 });
      await wait(900);
      Ach.show('愿者上钩', '用一个愿望，换了一顿' + (w.weight >= 26 ? '像样的' : '能吃的') + '饭。');
      await wait(2000);
      Toast.show(w.flavor, 6400);

      await wait(4600);
      await Fade.through(() => { App.show('counter'); Counter.init(); });
      await Dlg.open('afterEat');
      Counter.refreshHud();
      Counter.updateHint();
    },
  };

  global.Ledger = Ledger;
  global.Film = Film;
  global.Scale = Scale;
})(window);
