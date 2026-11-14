/* ============================================================
   duel.js — 跟艾赌一把
   ------------------------------------------------------------
   他出题，你答。题都出自你真正读过的那几份记忆。
   赢够七局，他会换一张脸坐下来。
   （征服者 · 复仇女神系统：他记得你赢过几次。）
   ============================================================ */
(function (global) {
  'use strict';
  const { $ } = global.G;

  const Duel = {
    box: null,
    q: null,
    won: false,

    wins() {
      const S = global.State;
      S.sys = S.sys || {};
      S.sys.boss = S.sys.boss || {};
      return S.sys.boss.ai || 0;
    },

    canPlay() {
      const M = global.Memory;
      return !!M && M.stats().read >= 3;
    },

    open() {
      if (!this.canPlay()) {
        if (global.Toast) global.Toast.show('他看了你一眼："你连他们的事都没读过，赌什么。"', 3000);
        return;
      }
      this.build();
      this.box.classList.add('on');
      this.round();
    },

    close() {
      if (this.box) this.box.classList.remove('on');
    },

    build() {
      if (this.box) return;
      const d = document.createElement('div');
      d.className = 'duel';
      d.id = 'duel';
      d.innerHTML =
        '<div class="duel-in">' +
        '<div class="duel-top"><span>对 局 · 他 出 题</span>' +
        '<b id="duel-win">0</b><i>/ 7</i>' +
        '<button class="duel-x" id="duel-x">×</button></div>' +
        '<div class="duel-q" id="duel-q"></div>' +
        '<div class="duel-opts" id="duel-opts"></div>' +
        '<div class="duel-ft" id="duel-ft">答对七局，你就赢了他。答错，他赢你一句。</div>' +
        '</div>';
      document.body.appendChild(d);
      this.box = d;
      $('#duel-x').addEventListener('click', () => this.close());
      $('#duel-win').textContent = this.wins();
    },

    pick() {
      // 偶尔不问人，问报纸：同一个年份，两种说法
      if (global.Clips && Math.random() < 0.3) {
        const cq = global.Clips.pick();
        if (cq) return cq;
      }
      const M = global.Memory;
      const d = M.read();
      const pool = d.read.filter((n) => n <= M.total);
      const no = pool[Math.floor(Math.random() * pool.length)];
      const m = M.get(no) || M.list[0];
      // 四种问法，答案都在日志里
      const kind = Math.floor(Math.random() * 4);
      const others = M.list.filter((x) => x.no !== m.no);
      const shuffle = (a) => a.sort(() => Math.random() - 0.5);
      let q, ans, opts;
      if (kind === 0) {
        q = '第 ' + String(m.no).padStart(2, '0') + ' 号押在这儿的东西是什么？';
        ans = m.relic;
        opts = shuffle([ans, others[0].relic, others[1].relic, others[2].relic]);
      } else if (kind === 1) {
        q = '第 ' + String(m.no).padStart(2, '0') + ' 号，是哪一年进来的？';
        ans = m.year;
        opts = shuffle([ans, others[0].year, others[1].year, others[2].year]);
      } else if (kind === 2) {
        q = '「' + m.relic + '」是谁押下的？';
        ans = m.name;
        opts = shuffle([ans, others[0].name, others[1].name, others[2].name]);
      } else {
        q = '他留下的话里，有这一句：';
        ans = m.last;
        opts = shuffle([ans, others[0].last, others[1].last, others[2].last]).filter((v, i, a) => a.indexOf(v) === i);
        while (opts.length < 2) opts.push(m.relic);
      }
      opts = opts.slice(0, 4);
      if (opts.indexOf(ans) < 0) opts[0] = ans;
      return { q, ans, opts: shuffle(opts) };
    },

    round() {
      this.q = this.pick();
      $('#duel-q').textContent = this.q.q;
      const box = $('#duel-opts');
      box.innerHTML = '';
      this.q.opts.forEach((o, i) => {
        const b = document.createElement('button');
        b.textContent = o;
        b.addEventListener('click', () => this.answer(o, b));
        box.appendChild(b);
      });
      $('#duel-ft').textContent = '（这些题，只有读过的人答得上来。）';
    },

    answer(o, btn) {
      const S = global.State;
      S.sys = S.sys || {};
      S.sys.boss = S.sys.boss || {};
      const ok = o === this.q.ans;
      $$btn().forEach((b) => { b.disabled = true; });
      btn.classList.add(ok ? 'ok' : 'no');
      if (!ok) {
        // 把对的标出来
        $$btn().forEach((b) => { if (b.textContent === this.q.ans) b.classList.add('ok'); });
      }
      const n = global.Sys ? global.Sys.win('ai', ok ? 1 : -1)
        : Math.max(0, (S.sys.boss.ai || 0) + (ok ? 1 : -1));
      $('#duel-win').textContent = n;
      const ft = $('#duel-ft');
      if (n >= 7) {
        ft.textContent = '七局。他把手从柜台上收回去了。\n"不用再答了。"他说，"你比我记得的多。"';
        S.sys.bossMax = Math.max(S.sys.bossMax || 0, 7);
        const box = $('#duel-opts');
        box.innerHTML = '';
        const b = document.createElement('button');
        b.textContent = '收起';
        b.className = 'duel-end';
        b.addEventListener('click', () => this.close());
        box.appendChild(b);
        $('#duel-q').textContent = '（他不再出题了。灯芯短了一截。）';
        if (global.Snd) { try { global.Snd.tone(74, 2.6, { type: 'sine', gain: 0.06, attack: 0.6 }); } catch (e) {} }
        return;
      }
      if (n >= 3) {
        ft.textContent = '他停了一下。"你记得比我以为的多。"（' + n + ' / 7）';
      } else {
        ft.textContent = ok ? '对。（' + n + ' / 7）' : '错。他把你答错的那一条，记在了本子上。（' + n + ' / 7）';
      }
      if (global.Snd) { try { global.Snd.tone(ok ? 620 : 150, 0.14, { type: 'square', gain: 0.04 }); } catch (e) {} }
      setTimeout(() => { if (this.box && this.box.classList.contains('on')) this.round(); }, 1500);
    },
  };

  function $$btn() { return Array.prototype.slice.call(document.querySelectorAll('#duel-opts button')); }

  global.Duel = Duel;
})(window);
