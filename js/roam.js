/* ============================================================
   roam.js — 店里的平面图
   ------------------------------------------------------------
   这间店不是一条走廊。做过的关可以回头，没做的可以绕开。
   按 G，从上面挑一间屋子进去。
   ------------------------------------------------------------
   解锁只看"你走到过哪儿"，不看"你该走到哪儿"。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, Fade, Toast } = global.G;

  /* 区域 / 名字 / 一句描述 / 去哪 / 解锁判定 */
  const PLACES = [
    { zone: '外面', id: 'mail', name: '那封邮件', desc: '收件人是你，寄件人空着。', ok: () => true,
      go: () => { global.App.show('mail'); global.Mail.init(); } },
    { zone: '外面', id: 'login', name: '登录框', desc: '服务器只有一台，在线一人。', ok: () => true,
      go: () => { global.App.show('login'); global.Login.start(); } },
    { zone: '店里', id: 'hall', name: '记忆殿', desc: '「第 36 个」，两个按钮。', ok: () => true,
      go: () => { global.App.show('hall'); global.Hall.init(); } },
    { zone: '店里', id: 'counter', name: '柜台', desc: '艾在后面坐着。灯一直亮。', ok: () => true,
      go: () => { global.App.show('counter'); global.Counter.init(); } },
    { zone: '店里', id: 'verify', name: '抵押 · 记忆核验', desc: '柜台上那张空白单子。', ok: () => true,
      go: () => { global.App.show('verify'); global.Ver.start(); } },

    { zone: '抽屉', id: 'ledger', name: '账本', desc: '锁不是数字，是账。', ok: (S) => (S.ch2 || 0) >= 1,
      go: () => { global.App.show('ledger'); global.Ledger.start(); } },
    { zone: '抽屉', id: 'film', name: '记忆胶片', desc: '八段被剪散的停电夜。', ok: (S) => (S.ch2 || 0) >= 1,
      go: () => { global.App.show('film'); global.Film.start(); } },
    { zone: '抽屉', id: 'scale', name: '愿望天平', desc: '押一个愿望，换一顿饭。', ok: (S) => (S.ch2 || 0) >= 1,
      go: () => { global.App.show('scale'); global.Scale.start(); } },
    { zone: '抽屉', id: 'oil', name: '长明灯的油', desc: '八钱油，三只碗，两盏灯。', ok: (S) => (S.ch2 || 0) >= 1,
      go: () => { global.App.show('oil'); global.Oil.start(); } },
    { zone: '抽屉', id: 'clock', name: '墙上的钟', desc: '停在差一分的地方。', ok: (S) => (S.ch2 || 0) >= 1,
      go: () => { global.App.show('clock'); global.ClockG.start(); } },
    { zone: '抽屉', id: 'scratch', name: '地板上的刻痕', desc: '六组，每组四道。深浅不一。', ok: (S) => (S.ch2 || 0) >= 1,
      go: () => { global.App.show('scratch'); global.Scratch.start(); } },

    { zone: '楼上', id: 'moyun', name: '墨韵 · 科技卷轴', desc: '八段密文，四层密钥。', ok: () => true,
      go: () => { if (global.Moyun) global.Moyun.show(); } },
    { zone: '楼上', id: 'persp', name: '代码透视', desc: '让屋子半透明。', ok: () => true,
      go: () => { global.App.show('counter'); global.Counter.init(); setTimeout(() => global.Persp.show(), 320); } },
    { zone: '楼上', id: 'code', name: 'L∞ 编辑器', desc: '这里的代码真的会跑。', ok: (S) => !!(S.sys && S.sys.linf),
      no: '卷轴解开三条密文，才拿得到写权限。',
      go: () => { global.App.show('counter'); global.Counter.init(); setTimeout(() => global.CodeEd.show(), 320); } },
    { zone: '楼上', id: 'archive', name: '档案册', desc: '你还剩多少没看见。', ok: () => true,
      go: () => { global.App.show('counter'); global.Counter.init(); setTimeout(() => global.Archive.show(), 320); } },

    { zone: '下面', id: 'root', name: '记录库', desc: '三十七行，自己在往下跑。', ok: (S) => !!((S.ch5 || 0) >= 1 || S.recordFound || (S.ch4 || 0) >= 1),
      no: '得先走到那扇没有 onclick 的门后面。',
      go: () => { global.App.show('root'); global.Root.start(); } },
    { zone: '下面', id: 'anomaly', name: '七行假记录', desc: '三十七行里有七行不对。', ok: (S) => !!((S.ch5 || 0) >= 1 || S.recordFound),
      no: '得先在记录库里找到自己那一行。',
      go: () => { global.App.show('anomaly'); global.Anomaly.start(); } },
    { zone: '下面', id: 'final', name: '终章 · 回响', desc: '八张纸，十八个结局。', ok: (S) => !!(S.sys && (S.sys.endings || []).length > 0),
      no: '先走完任何一个结局。',
      go: () => { global.App.show('final'); global.Final.start(); } },
  ];

  const Roam = {
    el: null,
    inited: false,

    boot() {
      if (this.inited) return;
      this.inited = true;
      const d = document.createElement('div');
      d.className = 'roam';
      d.id = 'roam';
      d.innerHTML =
        '<div class="roam-page" role="dialog" aria-label="店里的平面图">' +
          '<div class="roam-head">' +
            '<div class="roam-t">店 里 的 平 面 图</div>' +
            '<div class="roam-s">做过的可以回头。没做的可以绕开。</div>' +
            '<button class="roam-x" id="roam-x">关</button>' +
          '</div>' +
          '<div class="roam-body" id="roam-body"></div>' +
          '<div class="roam-foot">按 <b>G</b> 随时打开 · <b>Esc</b> 回柜台 · 走到哪儿，记住哪儿</div>' +
        '</div>';
      document.body.appendChild(d);
      this.el = d;
      $('#roam-x').addEventListener('click', () => this.close());
      d.addEventListener('click', (e) => { if (e.target === d) this.close(); });
      d.addEventListener('click', (e) => {
        const b = e.target.closest('.roam-p');
        if (!b) return;
        this.go(b.dataset.id, b.classList.contains('lock'));
      });

      document.addEventListener('keydown', (e) => {
        const tag = (e.target.tagName || '').toUpperCase();
        if (tag === 'INPUT' || tag === 'TEXTAREA') return;
        if (e.key === 'g' || e.key === 'G') {
          e.preventDefault();
          this.toggle();
        } else if (e.key === 'Escape') {
          if (this.isOpen()) { this.close(); return; }
          this.escBack();
        }
      });
    },

    isOpen() { return this.el && this.el.classList.contains('on'); },
    toggle() { if (this.isOpen()) this.close(); else this.open(); },

    open() {
      this.boot();
      this.render();
      this.el.classList.add('on');
      global.Snd && global.Snd.click && global.Snd.click();
    },

    close() {
      if (!this.el) return;
      this.el.classList.remove('on');
    },

    /* 谜题里按 Esc：不丢进度，回柜台 */
    escBack() {
      const S = global.App && global.App.current;
      const backable = ['ledger', 'film', 'scale', 'oil', 'clock', 'scratch'];
      if (backable.indexOf(S) >= 0) {
        Fade.through(() => { global.App.show('counter'); global.Counter.init(); });
      }
    },

    render() {
      const S = global.State || {};
      const seen = (S.sys && S.sys.visited) || {};
      let html = '';
      let zone = '';
      PLACES.forEach((p) => {
        if (p.zone !== zone) {
          if (zone) html += '</div>';
          zone = p.zone;
          html += '<div class="roam-zone"><span>' + zone + '</span></div><div class="roam-grid">';
        }
        const open = p.ok(S);
        html += '<button class="roam-p' + (open ? '' : ' lock') + (seen[p.id] ? ' seen' : '') + '" data-id="' + p.id + '">' +
          '<span class="rp-n">' + p.name + '</span>' +
          '<span class="rp-d">' + (open ? p.desc : (p.no || '还没走到。')) + '</span>' +
          (seen[p.id] ? '<span class="rp-k">到过</span>' : '') +
          '</button>';
      });
      html += '</div>';
      $('#roam-body').innerHTML = html;
    },

    go(id, locked) {
      if (locked) { global.Snd && global.Snd.deny && global.Snd.deny(); return; }
      const p = PLACES.filter((x) => x.id === id)[0];
      if (!p) return;
      // 记一笔"到过"
      const S = global.State;
      S.sys = S.sys || {};
      S.sys.visited = S.sys.visited || {};
      S.sys.visited[id] = true;
      this.close();
      global.Snd && global.Snd.click && global.Snd.click();
      Fade.through(() => { try { p.go(); } catch (e) { Toast.show('这扇门暂时打不开。', 2000); } });
    },

    places: PLACES,
  };

  global.Roam = Roam;
})(window);
