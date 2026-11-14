/* ============================================================
   scene-stash.js — 证物册：他说的每句话，都能对上一样东西
   ============================================================ */
(function (global) {
  'use strict';
  const { $, Fade } = global.G;

  const Press = {
    inited: false,
    from: 'counter',

    init() {
      if (this.inited) return;
      this.inited = true;
      $('#ps-back').addEventListener('click', () => this.close());
      document.addEventListener('keydown', (e) => {
        if (e.key === 'j' || e.key === 'J') {
          if (e.target.tagName === 'INPUT') return;
          if (App.isCurrent('stash')) this.close();
          else if (App.isCurrent('counter') && State.ch2 >= 1) this.open();
        }
        if (e.key === 'Escape' && App.isCurrent('stash')) this.close();
      });
    },

    open() {
      this.init();
      this.from = App.current === 'stash' ? this.from : App.current;
      this.refresh();
      Fade.through(() => App.show('stash'));
      Snd.noise(0.22, { type: 'bandpass', freq: 1800, q: 1.4, gain: 0.05 });
    },

    close() {
      App.show(this.from === 'stash' ? 'counter' : this.from);
      if (App.current === 'counter' && global.Counter) Counter.refreshHud();
    },

    refresh() {
      const box = $('#ps-list');
      if (!box) return;
      box.innerHTML = '';
      const got = Lies.list();

      $('#ps-count').textContent = got.length + ' / ' + Lies.total() + '　　拆穿 ' + State.exposed + ' 处';
      if (global.State.sys) State.sys.relics = got.length;

      if (!got.length) {
        box.innerHTML = '<div class="ps-empty">（还没有东西。柜台上有灯、有碗、有黄纸；墙上有黄历；蹲下去，柜台底下也别放过。）</div>';
        return;
      }

      got.forEach((id) => {
        const p = global.PROOFS[id];
        const c = global.CLAIMS[p.claim];
        const done = !!(State.pressed && State.pressed[p.claim]);

        const d = document.createElement('div');
        d.className = 'ps-item' + (done ? ' done' : '');

        const head = document.createElement('div');
        head.className = 'ps-line';
        head.innerHTML = '<span class="ps-ic">' + p.icon + '</span>'
          + '<span class="ps-nm">' + p.name + '</span>'
          + '<span class="ps-where">' + p.where + '</span>';
        d.appendChild(head);

        const body = document.createElement('div');
        body.className = 'ps-tx';
        body.textContent = Lies.proofText(id).join('\n');
        d.appendChild(body);

        if (c) {
          const q = document.createElement('div');
          q.className = 'ps-claim';
          q.innerHTML = '<span class="ps-q">他说</span>「' + c.quote + '」';
          d.appendChild(q);

          const st = document.createElement('div');
          st.className = 'ps-st' + (done ? ' ok' : '');
          st.textContent = done
            ? '已拆穿　·　' + c.leak
            : '还没当面问过。点掌柜，把东西摆出来。';
          d.appendChild(st);
        }
        box.appendChild(d);
      });
    },
  };

  global.Press = Press;
})(window);
