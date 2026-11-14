/* ============================================================
   space.js — 里间
   ------------------------------------------------------------
   柜台后面那道缝，一直比看起来深。
   走进去是一条走廊：七只柜子，三十五个人的东西，六个还站着的人。
   走廊只有一面。所以你要换个角度，才看得见另一面。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Fade, Toast } = global.G;

  /* 六个人：不是 NPC，是没走成的人 */
  const FIGURES = [
    { id: 'zhou', name: '老周', tip: '一个背着手的影子', lines: [
      '我在等一个人回来。她说去去就回。',
      '这走廊没有钟，我只好数自己的呼吸。数到第几下了？',
      '……你别告诉我。知道了，就不好等了。',
    ] },
    { id: 'xie', name: '小谢', tip: '一个背对着你的影子', lines: [
      '别看我后面。我没有后面。',
      '我进来的时候，把脸留在了外面，因为那张脸欠了钱。',
      '你要是走出去，能不能替我看一眼我女儿。她六岁，叫笑笑。',
    ] },
    { id: 'wu', name: '无名', tip: '一个没有名字的影子', lines: [
      '名字我卖了。卖了八十块，够吃三天。',
      '卖了以后我发现，别人叫我的时候我不回头了。',
      '有时候我想，那八十块买走的，是不是不止一个名字。',
    ] },
    { id: 'lan', name: '阿岚', tip: '一个在屋檐下的影子', lines: [
      '我只想再看一次那天的雨。就一次。',
      '那天下雨，我妈来接我，伞是破的。她把伞全往我这边倾。',
      '我那时候嫌她走得慢。我现在愿意用任何东西，换那条路再长一点。',
    ] },
    { id: 'cao', name: '老曹', tip: '一个在数东西的影子', lines: [
      '我记得价，不记得人。',
      '三块二、五块八、十二块。我记得每一个价，因为每一个价都是我定的。',
      '有一天我孙子问我，爷爷你这一辈子卖过什么。我想了半天，说：卖过别人需要的东西。',
    ] },
    { id: 'man', name: '小满', tip: '一个抱着膝盖的影子', lines: [
      '他们说会来接我。',
      '我在这里坐着，听见外面有人喊，我就站起来。站起来十九次了。',
      '你别劝我走。走了，他们来了就找不到我了。',
    ] },
  ];

  const VIEWS = [
    { id: 'front', n: '正面', hint: '走廊只有一面。正面看，只有最浅的那些。' },
    { id: 'side', n: '侧面', hint: '偏过头去。贴着墙的东西，这时候才露出来。' },
    { id: 'hang', n: '倒吊', hint: '把头低下来，从腿中间往回看。上下颠倒了，第七只柜子就接上了第八只。' },
  ];

  const Space = {
    inited: false,
    built: false,
    view: 'front',
    shifted: false,
    cur: null,
    from: 'counter',

    init() {
      if (this.inited) return;
      this.inited = true;
      const back = $('#sp-back');
      if (back) back.addEventListener('click', () => this.close());
      document.addEventListener('keydown', (e) => {
        if (!App.isCurrent('space')) return;
        if (e.key === 'Escape') this.close();
        if (e.key === '1') this.setView('front');
        if (e.key === '2') this.setView('side');
        if (e.key === '3') this.setView('hang');
      });
    },

    open() {
      this.init();
      const S = global.State;
      S.sys = S.sys || {};
      S.sys.sawSpace = true;
      this.from = App.current === 'space' ? this.from : (App.current || 'counter');
      this.build();
      this.refresh();
      Fade.through(() => App.show('space'));
      if (global.Snd) {
        try {
          global.Snd.noise(0.5, { type: 'bandpass', freq: 420, q: 0.8, gain: 0.05 });
          global.Snd.tone(84, 2.4, { type: 'sine', gain: 0.04, attack: 0.6 });
        } catch (e) {}
      }
    },

    close() {
      App.show(this.from === 'space' ? 'counter' : this.from);
      if (App.current === 'counter' && global.Counter) global.Counter.init();
    },

    /* ---------------- 建一次就够 ---------------- */
    build() {
      if (this.built) return;
      this.built = true;
      const stage = $('#sp-stage');
      if (!stage) return;
      const list = global.MEMORY || [];

      let h = '<div class="sp-hall"></div>' +
        '<div class="sp-fog"></div>' +
        '<div class="sp-cases">';
      // 七只柜子 + 第八只空柜（错位之后接上）
      for (let c = 0; c < 8; c++) {
        h += '<div class="sp-case' + (c === 7 ? ' sp-empty' : '') + '" data-case="' + c + '">' +
          '<div class="sp-case-top"></div><div class="sp-case-body">';
        if (c === 7) {
          h += '<div class="sp-case-empty">第 36 只<br><i>空着</i></div>';
        }
        h += '</div><div class="sp-case-plate">' + (c === 7 ? '' : (1987 + c * 6) + '′') + '</div></div>';
      }
      h += '</div><div class="sp-figs">';
      FIGURES.forEach((f, i) => {
        h += '<div class="sp-fig" data-fig="' + f.id + '" style="--i:' + i + '">' +
          '<div class="sp-fig-body"></div><div class="sp-fig-head"></div>' +
          '<span class="sp-fig-tip">' + f.name + '</span></div>';
      });
      h += '</div>' +
        '<div class="sp-hud">' +
        '<div class="sp-views">' + VIEWS.map((v, i) =>
          '<button class="sp-vb" data-v="' + v.id + '"><b>' + v.n + '</b><i>' + (i + 1) + '</i></button>').join('') +
        '</div>' +
        '<div class="sp-count"><b id="sp-n-read">0</b> / 35 读过　·　<b id="sp-n-take">0</b> 拿走</div>' +
        '<div class="sp-acts"><button id="sp-duel" class="sp-back">跟他赌一把</button>' +
        '<button id="sp-shift" class="sp-shift" disabled>错 位</button>' +
        '<button id="sp-back" class="sp-back">回去</button></div>' +
        '</div>' +
        '<div class="sp-card" id="sp-card"></div>' +
        '<div class="sp-say" id="sp-say"></div>';
      stage.innerHTML = h;

      // 物件按年份分到七只柜子里，每柜五件
      const cases = $$('.sp-case', stage);
      list.forEach((m) => {
        const c = Math.min(6, Math.floor((m.no - 1) / 5));
        const body = cases[c].querySelector('.sp-case-body');
        const d = document.createElement('button');
        d.className = 'sp-relic';
        d.dataset.no = m.no;
        // 侧面 / 倒吊 / 错位 才看得见的那几件
        const vis = [3, 12, 20, 27, 33].indexOf(m.no) >= 0 ? 'side'
          : [24, 35].indexOf(m.no) >= 0 ? 'hang'
            : m.no === 35 ? 'shift' : 'front';
        d.dataset.vis = m.no === 35 ? 'shift' : vis;
        d.innerHTML = '<span class="sp-ic">' + m.icon + '</span><span class="sp-tip">' + m.relic + '</span>';
        body.appendChild(d);
        d.addEventListener('click', (e) => { e.stopPropagation(); this.peek(m.no); });
      });

      $$('.sp-vb', stage).forEach((b) => b.addEventListener('click', () => this.setView(b.dataset.v)));
      $$('.sp-fig', stage).forEach((f) => f.addEventListener('click', () => this.fig(f.dataset.fig)));
      $('#sp-shift').addEventListener('click', () => this.shift());
      const du = $('#sp-duel');
      if (du) du.addEventListener('click', () => { if (global.Duel) global.Duel.open(); });
      const bk = $('#sp-back');
      if (bk) bk.addEventListener('click', () => this.close());
      this.stage = stage;
      this.setView('front', true);
    },

    /* ---------------- 视角 ---------------- */
    setView(v, silent) {
      this.view = v;
      const vv = VIEWS.find((x) => x.id === v) || VIEWS[0];
      if (this.stage) this.stage.dataset.view = v;
      $$('.sp-vb').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
      const sh = $('#sp-shift');
      if (sh) sh.disabled = !(v === 'hang' && !this.shifted);
      if (!silent) {
        this.say(vv.hint);
        if (global.Snd) { try { global.Snd.tone(v === 'hang' ? 92 : 300, 0.12, { type: 'square', gain: 0.03 }); } catch (e) {} }
      }
    },

    /* ---------------- 错位：两只柜子接上 ---------------- */
    shift() {
      if (this.view !== 'hang' || this.shifted) return;
      this.shifted = true;
      if (this.stage) this.stage.dataset.shift = '1';
      $('#sp-shift').disabled = true;
      const S = global.State;
      S.sys = S.sys || {};
      S.sys.shifted = true;
      if (global.Snd) { try { global.Snd.glitch(0.3); } catch (e) {} }
      this.say('你把脚跟提起来一点，头往下沉。\n第七只柜子的顶，接上了第八只柜子的底。\n\n它们本来就是一只。只是站着看的时候，中间隔着一个人的高度。');
    },

    /* ---------------- 看一件东西 ---------------- */
    peek(no) {
      const m = global.Memory.get(no);
      if (!m) return;
      const taken = global.Memory.hasRelic(no);
      global.Memory.markRead(no);
      this.cur = no;
      const card = $('#sp-card');
      card.innerHTML =
        '<div class="spc-head"><span class="spc-ic">' + m.icon + '</span>' +
        '<div class="spc-id"><b>' + m.name + '</b><i>第 ' + String(no).padStart(2, '0') + ' 号 · ' + m.year + ' · ' + m.job + '</i></div>' +
        '<button class="spc-x" id="spc-x">×</button></div>' +
        '<div class="spc-relic"><span>押在这儿的东西</span><b>' + m.relic + '</b><p>' + m.touch + '</p></div>' +
        '<div class="spc-logs">' + m.logs.map((t, i) =>
          '<p class="spc-log"><i>' + ['一', '二', '三'][i] + '</i>' + t + '</p>').join('') + '</div>' +
        '<div class="spc-last">遗言：' + m.last + '</div>' +
        '<div class="spc-acts">' +
        (taken ? '<span class="spc-got">已经在你手上了</span>' : '<button id="spc-take">把它拿走</button>') +
        (no === 7 && !(State.sys && State.sys.copy7) ? '<button id="spc-copy">照他写的做</button>' : '') +
        '</div>';
      card.classList.add('on');
      $('#spc-x').addEventListener('click', () => card.classList.remove('on'));
      const tk = $('#spc-take');
      if (tk) tk.addEventListener('click', () => this.take(no));
      const cp = $('#spc-copy');
      if (cp) cp.addEventListener('click', () => this.copy7());
      if (global.Snd) { try { global.Snd.noise(0.12, { type: 'highpass', freq: 3000, gain: 0.04 }); } catch (e) {} }
      this.refresh();
    },

    take(no) {
      const n = global.Memory.takeRelic(no);
      const S = global.State;
      S.sys.memRelics = n;
      if (global.Snd) { try { global.Snd.tone(392 + n * 6, 0.18, { type: 'triangle', gain: 0.04 }); } catch (e) {} }
      Toast.show('你把它收起来了。（' + n + ' / 35）', 2400);
      this.peek(no);
      this.refresh();
      if (n === 35) {
        this.say('三十五件都在你身上了。\n你忽然很沉。\n\n不是东西沉，是三十五个人一起靠过来，重量就到你身上了。');
      }
    },

    /* ---------------- 7 号的抄写：模仿者 ---------------- */
    copy7() {
      const S = global.State;
      const qs = global.Memory.copy7();
      const card = $('#sp-card');
      let i = 0;
      let ok = true;
      const step = () => {
        if (i >= qs.length) {
          if (ok) {
            S.sys.copy7 = true;
            card.innerHTML = '<div class="spc-head"><span class="spc-ic">▣</span>' +
              '<div class="spc-id"><b>一字不差</b><i>第 07 号 · 周小满</i></div></div>' +
              '<div class="spc-logs"><p class="spc-log">你把他记得的东西，按他的顺序，又记了一遍。</p>' +
              '<p class="spc-log">柜台那边的灯晃了一下。像有人在很远的地方，认出了自己的字。</p></div>' +
              '<div class="spc-acts"><span class="spc-got">你已经不完全是你了。</span></div>';
            if (global.Snd) { try { global.Snd.glitch(0.22); } catch (e) {} }
          } else {
            card.innerHTML = '<div class="spc-head"><span class="spc-ic">▣</span>' +
              '<div class="spc-id"><b>不对</b><i>第 07 号 · 周小满</i></div></div>' +
              '<div class="spc-logs"><p class="spc-log">你抄错了一处。抄错的地方，也是你自己。</p>' +
              '<p class="spc-log">（回去把他的三段日志再看一遍。）</p></div>';
          }
          return;
        }
        const q = qs[i];
        card.innerHTML = '<div class="spc-head"><span class="spc-ic">▣</span>' +
          '<div class="spc-id"><b>照他写的做 ' + (i + 1) + ' / ' + qs.length + '</b><i>第 07 号 · 周小满</i></div></div>' +
          '<div class="spc-logs"><p class="spc-log">' + q.q + '</p></div>' +
          '<div class="spc-acts spc-opts">' + q.opts.map((o, k) =>
            '<button data-k="' + k + '">' + o + '</button>').join('') + '</div>';
        $$('.spc-opts button').forEach((b) => b.addEventListener('click', () => {
          const pick = q.opts[+b.dataset.k];
          if (pick !== q.a) ok = false;
          i++;
          step();
        }));
      };
      step();
    },

    /* ---------------- 纸人 ---------------- */
    fig(id) {
      const f = FIGURES.find((x) => x.id === id);
      if (!f) return;
      const S = global.State;
      S.sys = S.sys || {};
      S.sys.npcs = S.sys.npcs || {};
      const torn = S.sys.torn = S.sys.torn || {};
      if (torn[id]) {
        this.say('（地上剩下一堆纸。你踩过去的时候，它响了一下。）');
        return;
      }
      const first = !(S.sys.npcs && S.sys.npcs[id]);
      if (first && global.Sys) global.Sys.talk(id);
      else if (first) { S.sys.npcs = S.sys.npcs || {}; S.sys.npcs[id] = true; S.sys.talks = Object.keys(S.sys.npcs).length; }
      const card = $('#sp-card');
      card.innerHTML = '<div class="spc-head"><span class="spc-ic">▤</span>' +
        '<div class="spc-id"><b>' + f.name + '</b><i>' + f.tip + '</i></div>' +
        '<button class="spc-x" id="spc-x">×</button></div>' +
        '<div class="spc-logs">' + f.lines.map((t) =>
          '<p class="spc-log">' + t + '</p>').join('') + '</div>' +
        '<div class="spc-acts"><button id="spc-tear" class="spc-tear">撕掉它</button></div>';
      card.classList.add('on');
      $('#spc-x').addEventListener('click', () => card.classList.remove('on'));
      $('#spc-tear').addEventListener('click', () => this.tear(id));
      if (global.Snd) { try { global.Snd.noise(0.3, { type: 'bandpass', freq: 900, q: 1, gain: 0.05 }); } catch (e) {} }
      S.sys.mercy = !(S.sys.hurt > 0);
      this.refresh();
      if (S.sys.talks >= 7) {
        this.say('七个人你都说过话了。\n走廊没有变，可是它听起来不像刚才那么空了。');
      }
    },

    tear(id) {
      const S = global.State;
      if (global.Sys) global.Sys.hurt(id);
      else { S.sys.torn[id] = true; S.sys.hurt = (S.sys.hurt || 0) + 1; S.sys.mercy = false; }
      const n = Object.keys(S.sys.torn).length;
      const card = $('#sp-card');
      card.innerHTML = '<div class="spc-head"><span class="spc-ic">▤</span>' +
        '<div class="spc-id"><b>——</b><i>这里原来站着一个人</i></div></div>' +
        '<div class="spc-logs"><p class="spc-log">你伸手一撕。它没有反抗，纸本来就该这样。</p>' +
        '<p class="spc-log">落下来的时候，有一角还带着一个人的形状。</p></div>';
      if (global.Snd) { try { global.Snd.noise(0.5, { type: 'highpass', freq: 1800, gain: 0.08 }); } catch (e) {} }
      const el = document.querySelector('.sp-fig[data-fig="' + id + '"]');
      if (el) el.classList.add('torn');
      this.refresh();
      if (n >= 6) {
        this.say('六个都撕完了。\n地上很干净。\n\n干净得像这里从来没有站过人。');
      } else if (n === 1) {
        this.say('走廊里少了一个影子。\n你发现少一个影子，光并不会变亮。');
      }
    },

    /* ---------------- 状态 ---------------- */
    refresh() {
      const st = global.Memory.stats();
      const S = global.State;
      S.sys = S.sys || {};
      S.sys.memRead = st.read;
      S.sys.memRelics = st.relics;
      S.sys.readAll = st.read >= st.total;
      const r = $('#sp-n-read'); const t = $('#sp-n-take');
      if (r) r.textContent = st.read;
      if (t) t.textContent = st.relics;
      $$('.sp-relic').forEach((b) => {
        if (global.Memory.hasRelic(+b.dataset.no)) b.classList.add('got');
        if (global.Memory.hasRead(+b.dataset.no)) b.classList.add('read');
      });
    },

    say(t) {
      const el = $('#sp-say');
      if (!el) return;
      el.textContent = t;
      el.classList.add('on');
      clearTimeout(this._t);
      this._t = setTimeout(() => el.classList.remove('on'), 5200);
    },
  };

  global.Space = Space;
})(window);
