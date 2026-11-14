/* ============================================================
   scene-anomaly.js — 三十七行里的七行假记录
   ------------------------------------------------------------
   记录库自己会往下跑。跑久了，总有人往里塞东西。
   七行是假的。假的都有破绽，破绽都不难看懂。

   找出来，那一行底下压着的一句注释才会浮上来。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, Fade, Toast } = global.G;

  const SURNAME = ['陈', '林', '张', '李', '王', '赵', '周', '郑', '沈', '何', '吴', '顾', '叶', '程', '许', '温', '罗', '白', '苏', '邵'];
  const GIVEN = ['默', '砚', '迟', '青', '守', '桐', '露', '南', '声', '观', '渡', '言', '生', '一鸣', '雨桐', '知远', '未', '眠', '回'];
  const COL = ['记忆', '声音', '名字', '手', '影子', '一段路', '一个下午', '母亲的脸'];
  const STATE_OK = ['已释放', '待覆盖'];

  const TYPES = [
    { id: 'dup', why: '两个记录不可能同名同姓。' },
    { id: 'state', why: '押品是「身」的，不可能已经释放。' },
    { id: 'time', why: '日期只会往后走。这一行比上一行还早。' },
    { id: 'gap', why: '编号是连着的。这一格是空的。' },
    { id: 'self', why: '你的名字不该出现在别人的行里。' },
    { id: 'log', why: '「第一次来」是日志里的话，不是状态。' },
    { id: 'none', why: '什么都没押，不可能是「已释放」。' },
  ];

  const Anomaly = {
    inited: false,
    rows: [],
    marks: {},
    hintLv: 0,
    done: false,
    tries: 0,

    init() {
      if (this.inited) return;
      this.inited = true;
      $('#an-hint').addEventListener('click', () => this.hint());
      $('#an-back').addEventListener('click', async () => {
        await Fade.through(() => { global.App.show('root'); global.Root.start(); });
      });
      $('#an-check').addEventListener('click', () => this.check());
    },

    start() {
      this.init();
      this.marks = {};
      this.hintLv = 0;
      this.tries = 0;
      this.done = false;
      $('#an-msg').textContent = '';
      $('#an-msg').className = 'an-msg';
      $('#an-reveal').textContent = '';
      $('#an-count').textContent = '0 / 7';
      if (!this.rows.length) this.build();
      this.render();
    },

    build() {
      const n = 37;
      const rows = [];
      const d0 = new Date(1998, 2, 14).getTime();
      for (let i = 0; i < n; i++) {
        rows.push({
          no: String(i + 1).padStart(3, '0'),
          name: SURNAME[i % SURNAME.length] + GIVEN[(i * 3 + Math.floor(i / SURNAME.length)) % GIVEN.length],
          col: COL[i % COL.length],
          state: i % 5 === 0 ? '待覆盖' : '已释放',
          date: new Date(d0 + i * 86_400_000 * 73).toISOString().slice(0, 10),
          bad: false, why: '',
        });
      }
      // 挑七个位置（避开前三行，别一上来就是雷）
      const pool = [];
      for (let i = 3; i < n; i++) pool.push(i);
      const picks = [];
      while (picks.length < 7) {
        const k = Math.floor(Math.random() * pool.length);
        picks.push(pool.splice(k, 1)[0]);
      }
      picks.sort((a, b) => a - b);

      const player = (global.State && global.State.playerName) || '你';
      picks.forEach((idx, k) => {
        const t = TYPES[k];
        const r = rows[idx];
        r.bad = true;
        r.why = t.why;
        r.type = t.id;
        if (t.id === 'dup') r.name = rows[Math.max(0, idx - 3)].name;
        else if (t.id === 'state') { r.col = '身'; r.state = '已释放'; }
        else if (t.id === 'time') {
          const prev = new Date(rows[idx - 1].date).getTime();
          r.date = new Date(prev - 86_400_000 * (120 + k * 9)).toISOString().slice(0, 10);
        } else if (t.id === 'gap') r.no = '';
        else if (t.id === 'self') r.name = player;
        else if (t.id === 'log') { r.state = '第一次来 03:14'; }
        else if (t.id === 'none') { r.col = '（无）'; r.state = '已释放'; }
      });

      this.rows = rows;
      this.badSet = picks;
    },

    render() {
      const box = $('#an-list');
      box.innerHTML = this.rows.map((r, i) => {
        const on = !!this.marks[i];
        return '<button class="an-row' + (on ? ' on' : '') + '" data-i="' + i + '">' +
          '<span class="an-no">' + (r.no || '　') + '</span>' +
          '<span class="an-name">' + r.name + '</span>' +
          '<span class="an-col">' + r.col + '</span>' +
          '<span class="an-state">' + r.state + '</span>' +
          '<span class="an-date">' + r.date + '</span>' +
          '<span class="an-flag">' + (on ? '假' : '') + '</span>' +
          '</button>';
      }).join('');
      $$('.an-row').forEach((b) => {
        b.addEventListener('click', () => this.toggle(+b.dataset.i));
      });
    },

    toggle(i) {
      if (this.done) return;
      Snd.init();
      this.marks[i] = !this.marks[i];
      if (this.marks[i]) Snd.tone(300, 0.05, { type: 'square', gain: 0.05 });
      else Snd.tone(220, 0.04, { type: 'square', gain: 0.03 });
      const c = Object.keys(this.marks).filter((k) => this.marks[k]).length;
      $('#an-count').textContent = c + ' / 7';
      this.render();
      if (c === 7) setTimeout(() => this.check(true), 220);
    },

    check(auto) {
      if (this.done) return;
      const marked = Object.keys(this.marks).filter((k) => this.marks[k]).map(Number);
      if (marked.length !== 7) {
        $('#an-msg').className = 'an-msg';
        $('#an-msg').textContent = '标了 ' + marked.length + ' 行。要正好七行。';
        if (!auto) Snd.deny();
        return;
      }
      const wrongMarked = marked.filter((i) => !this.rows[i].bad);
      const missed = this.badSet.filter((i) => marked.indexOf(i) < 0);
      if (!wrongMarked.length && !missed.length) {
        this.done = true;
        Snd.ok();
        $('#an-msg').className = 'an-msg good';
        $('#an-msg').textContent = '七行都挑出来了。它们同时变灰，像被抽走。';
        $('#an-reveal').textContent =
          '—— 每一行底下都压着同一句注释 ——\n' +
          '// 记录不是被写进来的。是被留出来的。\n' +
          '// 谁把名字留在这儿，谁的那一行就会一直跑。\n' +
          '// 三十七不是上限。是这一版列表的长度。';
        (global.State.sys = global.State.sys || {}).anomaly = true;
        document.dispatchEvent(new CustomEvent('anomalyFound', { detail: { n: 7 } }));
        if (global.Eggs) global.Eggs.unlock(21, true);
        return;
      }
      this.tries++;
      Snd.deny();
      $('#an-msg').className = 'an-msg';
      $('#an-msg').textContent = wrongMarked.length
        ? '有 ' + wrongMarked.length + ' 行是冤枉的。' + (missed.length ? '还漏了 ' + missed.length + ' 行。' : '')
        : '漏了 ' + missed.length + ' 行。';
      // 把冤枉的标红一下
      wrongMarked.forEach((i) => {
        const el = $('.an-row[data-i="' + i + '"]');
        if (el) { el.classList.add('bad'); setTimeout(() => el.classList.remove('bad'), 900); }
      });
      if (this.tries >= 2) $('#an-msg').textContent += ' 左边那张纸上写了什么算假。';
    },

    hint() {
      this.hintLv = Math.min(3, this.hintLv + 1);
      const hs = [
        '先看名字那一列。三十七个人，不该有重名。',
        '再看日期那一列。它只会往后走，有一天往回跳了。',
        '最后看状态：只有「已释放」和「待覆盖」两种。别的都是话，不是状态。',
      ];
      $('#an-msg').className = 'an-msg';
      $('#an-msg').textContent = hs[this.hintLv - 1];
      Toast.show('提示 ' + this.hintLv + '/3：' + hs[this.hintLv - 1], 4200);
    },
  };

  global.Anomaly = Anomaly;
})(window);
