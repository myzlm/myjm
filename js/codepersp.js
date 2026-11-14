/* ============================================================
   codepersp.js — 代码透视
   ------------------------------------------------------------
   按下 P（或侧边「视」），现实半透明，底下的节点浮出来。
   绿：只读　黄：可改　红：锁定　灰：已删
   L0 观察者 → L1 修改者 → L2 窥视者 → L3 掌控者 → L∞ 编写者

   这一层不"暂停"游戏。你改的东西，会立刻在这一层之上生效。
   ============================================================ */
(function (global) {
  'use strict';

  const { $, $$, Toast } = global.G;

  const NODES = [
    { id: 'root', n: '/ 根叙事', x: 50, y: 17, t: 'lock', p: { version: 'v37.0.0', owner: 'GM', visible: true },
      d: '整座殿从这里开始渲染。' },
    { id: 'hall', n: 'hall.js', x: 50, y: 29, t: 'ro', p: { floor: 1, walls: 6 }, d: '一面墙，六次渲染。' },
    { id: 'counter', n: 'counter', x: 50, y: 44, t: 'ro', p: { interact: 6 }, d: '柜台。所有东西都摆在这上面。' },
    { id: 'ai', n: 'npc.ai', x: 22, y: 44, t: 'mod', p: { face: '馆主', alive: true, knows: 35 },
      d: '他不叫艾。艾是这一层给他的名字。' },
    { id: 'wall', n: 'wall', x: 78, y: 44, t: 'mod', p: { zIndex: 9, solid: true },
      d: '检查器里它是第 9 层。人应该在它后面。' },
    { id: 'ledger', n: 'ledger', x: 12, y: 30, t: 'mod', p: { pages: 35, missing: 3 }, d: '抵押账。缺三页。' },
    { id: 'player', n: 'player', x: 50, y: 60, t: 'mod', p: { name: '—', body: 'rendered', soul: true },
      d: '这一格是你。属性表可以打开。' },
    { id: 'memory', n: 'memory.store', x: 22, y: 60, t: 'mod', p: { count: 0, writable: true },
      d: '你抵押过的每一段。写在这。' },
    { id: 'door', n: '/end/door', x: 78, y: 60, t: 'lock', p: { open: false, needs: 'key' }, d: '尽头之门。门后是控制室。' },
    { id: 'rec36', n: '#036', x: 34, y: 75, t: 'del', p: { state: '待覆盖', owner: '你' },
      d: '第三十六行。名字还空着。' },
    { id: 'records', n: '/var/records', x: 10, y: 73, t: 'lock', p: { count: 36, mount: '/mnt/old' },
      d: '挂载进来的。不在这一页里。' },
    { id: 'bigbrother', n: 'bigbrother', x: 90, y: 30, t: 'lock', p: { watching: true, blink: 'never' },
      d: '它在看着你。它一直都在。' },
    { id: 'mirror', n: 'mirror', x: 90, y: 75, t: 'ro', p: { reflect: 'lag 0.4s' }, d: '镜子里那个，比你慢半拍。' },
    { id: 'gm', n: 'GM', x: 50, y: 87, t: 'lock', p: { id: '—', online: false }, d: '这一层没有这个节点。它不该在这。' },
  ];

  const EDGES = [
    ['root', 'hall'], ['hall', 'counter'], ['counter', 'ai'], ['counter', 'wall'],
    ['counter', 'player'], ['player', 'memory'], ['player', 'rec36'], ['wall', 'door'],
    ['door', 'root'], ['ledger', 'counter'], ['records', 'rec36'], ['bigbrother', 'root'],
    ['mirror', 'player'], ['gm', 'root'], ['rec36', 'gm'], ['memory', 'gm'],
  ];

  const TYPE_CN = { ro: '只读', mod: '可改', lock: '锁定', del: '已删' };

  const Persp = {
    open: false,
    rot: 0,
    sel: null,
    deleted: {},
    modified: {},
    stareT: 0,

    level() {
      const S = global.State || {};
      const sys = S.sys || {};
      if (sys.linf) return 4;
      if ((sys.endings || []).length) return 3;
      if (S.ch4 >= 1 || (sys.innerSpace)) return 2;
      if ((sys.verified || 0) >= 3) return 1;
      return 0;
    },

    levelName() {
      return ['L0 观察者', 'L1 修改者', 'L2 窥视者', 'L3 掌控者', 'L∞ 编写者'][this.level()];
    },

    toggle() { this.open ? this.close() : this.show(); },

    show() {
      if (this.open) return;
      this.open = true;
      this.build();
      const el = $('#persp');
      el.classList.add('on');
      document.body.classList.add('persp-on');
      const S = global.State;
      if (S && S.sys) S.sys.perspOpened++;
      document.dispatchEvent(new CustomEvent('perspOpen', {
        detail: { layer: document.body.classList.contains('in-layer'), level: this.level() },
      }));
      if (global.Snd && global.Snd.glitch) global.Snd.glitch(0.15);
    },

    close() {
      this.open = false;
      const el = $('#persp');
      if (el) el.classList.remove('on');
      document.body.classList.remove('persp-on');
      this.sel = null;
    },

    build() {
      const el = $('#persp');
      if (!el) return;
      const lv = this.level();
      const SS = global.State;
      const rot = (SS && SS.sys && SS.sys.rotations) || 0;
      // bigbrother 要 L2 才看得见；mirror 要转满 360 度（四次）才浮出来
      const hiddenOf = (id) => (id === 'bigbrother' && lv < 2) || (id === 'mirror' && rot < 4);
      el.innerHTML =
        '<svg class="pp-lines" viewBox="0 0 100 100" preserveAspectRatio="none">' +
        EDGES.map(([a, b]) => {
          const A = NODES.find((x) => x.id === a), B = NODES.find((x) => x.id === b);
          if (!A || !B) return '';
          if (hiddenOf(a) || hiddenOf(b)) return '';
          if (this.deleted[a] || this.deleted[b]) return '';
          return '<line x1="' + A.x + '" y1="' + A.y + '" x2="' + B.x + '" y2="' + B.y + '"/>';
        }).join('') +
        '</svg>' +
        '<div class="pp-grid"></div>' +
        '<div class="pp-nodes">' +
        NODES.map((nd) => {
          const gone = this.deleted[nd.id];
          const hidden = hiddenOf(nd.id);
          const mod = this.modified[nd.id];
          if (hidden) return '';
          return '<div class="pp-node pp-' + (gone ? 'del' : nd.t) + (mod ? ' pp-mod' : '') +
            '" data-id="' + nd.id + '" style="left:' + nd.x + '%;top:' + nd.y + '%">' +
            '<i></i><b>' + nd.n + '</b><em>' + (gone ? '已删' : TYPE_CN[nd.t]) + '</em>' +
            '</div>';
        }).join('') +
        '</div>' +
        '<div class="pp-hud">' +
        '<div class="pp-hud-l"><b>代码透视</b><span>root · v37.0.0</span></div>' +
        '<div class="pp-hud-r"><span class="pp-lv">' + this.levelName() + '</span>' +
        '<span class="pp-n">节点 ' + (NODES.length - Object.keys(this.deleted).length) + '/' + NODES.length + '</span>' +
        '<button class="pp-rot" id="pp-rot">旋转</button>' +
        '<button class="pp-code" id="pp-code">编写</button>' +
        '<button class="pp-x" id="pp-x">关闭</button></div>' +
        '</div>' +
        '<div class="pp-panel" id="pp-panel"></div>' +
        '<div class="pp-hint" id="pp-hint">点击节点查看。改与删，都要付一点东西。</div>';

      this.bind(el);
    },

    bind(el) {
      el.querySelectorAll('.pp-node').forEach((n) => {
        const id = n.dataset.id;
        n.addEventListener('click', () => this.select(id, n));
        n.addEventListener('pointerdown', () => {
          clearTimeout(this.stareT);
          this.stareT = setTimeout(() => {
            if (id !== 'bigbrother') return;
            document.dispatchEvent(new CustomEvent('perspStare'));
            n.classList.add('pp-stared');
            if (global.G.Toast) global.G.Toast.show('它也在看你。', 2600);
          }, 5000);
        });
        ['pointerup', 'pointerleave'].forEach((ev) => n.addEventListener(ev, () => clearTimeout(this.stareT)));
      });
      const x = el.querySelector('#pp-x'); if (x) x.onclick = () => this.close();
      const r = el.querySelector('#pp-rot'); if (r) r.onclick = () => this.rotate();
      const c = el.querySelector('#pp-code'); if (c) c.onclick = () => this.code();
    },

    rotate() {
      this.rot = (this.rot + 90) % 360;
      const nodes = $('#persp .pp-nodes');
      if (nodes) {
        nodes.style.transform = 'rotate(' + this.rot + 'deg)';
        const svg = $('#persp .pp-lines');
        if (svg) svg.style.transform = 'rotate(' + this.rot + 'deg)';
      }
      const S = global.State;
      if (S && S.sys) S.sys.rotations++;
      document.dispatchEvent(new CustomEvent('perspRotate', { detail: (S && S.sys ? S.sys.rotations : 1) }));
      if (this.rot === 180 && global.G.Toast) global.G.Toast.show('转过来，墙就在你身后。', 2200);
      // 转满一圈（第 4 次）才浮出镜子节点，跟设计稿的 #28 对齐
      if (S && S.sys && S.sys.rotations === 4) {
        this.build();
        const nodes = $('#persp .pp-nodes');
        if (nodes) nodes.style.transform = 'rotate(' + this.rot + 'deg)';
        if (global.G.Toast) global.G.Toast.show('多了一个节点。它在等你转过来。', 3000);
      }
    },

    code() {
      if (this.level() < 4) {
        Toast.show('需要 L∞ 编写者权限。去卷轴把密文解开。', 2800);
        return;
      }
      if (global.CodeEd) global.CodeEd.show();
    },

    select(id, nodeEl) {
      this.sel = id;
      const nd = NODES.find((x) => x.id === id);
      if (!nd) return;
      document.querySelectorAll('.pp-node').forEach((n) => n.classList.toggle('sel', n === nodeEl));
      document.dispatchEvent(new CustomEvent('perspNode', { detail: id }));
      const lv = this.level();
      const gone = !!this.deleted[id];
      const p = Object.keys(nd.p).map((k) => k + ': ' + String(nd.p[k])).join('　');
      let acts = '<button class="ppc" data-a="look">查看</button>';
      if (!gone) {
        if (nd.t === 'mod' && lv >= 1) acts += '<button class="ppc" data-a="mod">修改</button>';
        if (nd.t === 'lock' && lv >= 3) acts += '<button class="ppc" data-a="mod">解锁并修改</button>';
        if ((nd.t === 'mod' && lv >= 1) || (nd.t === 'lock' && lv >= 3)) acts += '<button class="ppc danger" data-a="del">删除</button>';
        acts += '<button class="ppc" data-a="note">留言</button>';
      } else {
        acts = '<button class="ppc" data-a="look">查看残骸</button>';
        if (lv >= 3) acts += '<button class="ppc" data-a="restore">重建</button>';
      }
      const panel = $('#pp-panel');
      panel.classList.add('on');
      panel.innerHTML =
        '<div class="pp-p-h"><b>' + nd.n + '</b><span class="pp-tag pp-' + nd.t + '">' + TYPE_CN[nd.t] + '</span>' +
        '<span class="pp-id">' + nd.id + '</span></div>' +
        '<div class="pp-p-d">' + nd.d + '</div>' +
        '<div class="pp-p-k">' + p + '</div>' +
        '<div class="pp-p-b">' + acts + '</div>' +
        '<div class="pp-p-out" id="pp-out"></div>';
      panel.querySelectorAll('.ppc').forEach((b) => {
        b.onclick = () => this.act(nd, b.dataset.a);
      });
    },

    act(nd, a) {
      const out = $('#pp-out');
      const lv = this.level();
      if (a === 'look') {
        if (nd.id === 'player' && global.State) {
          const s = global.State.sys || {};
          out.innerHTML =
            '<div class="pp-attr"><div><span>NAME</span><b>' + (global.State.playerName || '未登记') + '</b></div>' +
            '<div><span>ROLE</span><b>第 ' + (global.TrueName && global.TrueName.data.ancient ? '37' : '36') + ' 位</b></div>' +
            '<div><span>VERIFIED</span><b>' + (s.verified || 0) + '</b></div>' +
            '<div><span>DELETED</span><b>' + (s.deleted || 0) + '</b></div>' +
            '<div><span>SOUL</span><b>' + (global.State.soulAnswered ? 'bound' : 'unbound') + '</b></div>' +
            '<div><span>BODY</span><b>rendered</b></div></div>';
        } else {
          out.innerHTML = '<div class="pp-quote">' + this.quoteFor(nd.id) + '</div>';
        }
        return;
      }
      if (a === 'mod') { this.modify(nd); return; }
      if (a === 'del') { this.remove(nd); return; }
      if (a === 'restore') {
        delete this.deleted[nd.id];
        if (global.State.sys) global.State.sys.restored = true;
        Toast.show('重建了。它回来得不太一样。', 2400);
        this.build();
        return;
      }
      if (a === 'note') {
        const t = prompt('留一句话。它会一直在这里：', '');
        if (t) Toast.show('已写入 ' + nd.id + '：' + t.slice(0, 20), 3000);
        return;
      }
    },

    quoteFor(id) {
      const m = {
        root: '版本号里那个 37，不是更新次数。是失败次数。',
        ai: '他有 35 份记忆，没有一份是自己的。',
        wall: '墙不是用来挡人的。是用来挡住"墙后面"的。',
        door: '门后没有控制室。门后是另一个门。',
        memory: '被拒绝的记忆，会掉进地下室。它们还在动。',
        rec36: '这一行的名字，在你来之前是空的。',
        records: '挂载点在 /mnt/old。旧的东西一直没卸载。',
        bigbrother: '它不眨眼。因为眨眼的那一帧，会露出来。',
        mirror: '镜子里那个慢半拍，是因为它要先算一下。',
        gm: 'GM 不在线。但每一次你改代码，它都会记一笔。',
        counter: '柜台上的灰，每天都会重新落一遍。',
        hall: '六面墙。第七面是你看的方向。',
        ledger: '缺的三页，是三个不肯签名的人。',
      };
      return m[id] || '——';
    },

    modify(nd) {
      const lv = this.level();
      const opts = [];
      if (nd.id === 'wall') opts.push(['zIndex', '9 → 2', () => { document.body.classList.add('wall-open'); return '墙退到人后面了。'; }]);
      if (nd.id === 'ai') opts.push(['face', '馆主 → 纸', () => { document.body.classList.add('npc-paper'); return '他脸上有折痕。'; }]);
      if (nd.id === 'memory') opts.push(['count', '只读 → 可写', () => { if (global.Verify) global.Verify.reset(); return '记忆库清空了。历史比对会从零开始。'; }]);
      if (nd.id === 'player') opts.push(['name', '改写登记名', () => {
        const v = prompt('在属性表里改掉你的名字：', global.State.playerName || '');
        if (v) { global.State.playerName = v; return '登记名改成了：' + v; }
        return '没有改。';
      }]);
      if (nd.id === 'door') opts.push(['open', 'false → true', () => { if (global.State) global.State.doorOpened = true; return '门开了。门后是空的。'; }]);
      if (nd.id === 'gm' && lv >= 4) opts.push(['online', 'false → ???', () => { if (global.State.sys) global.State.sys.gmSeen = true; return '有个东西上线了。'; }]);

      const out = $('#pp-out');
      if (!opts.length) { out.innerHTML = '<div class="pp-quote">这个节点改不动。它的参数是写死的。</div>'; return; }
      out.innerHTML = '<div class="pp-opts">' + opts.map((o, i) =>
        '<button class="pp-opt" data-i="' + i + '"><b>' + o[0] + '</b><span>' + o[1] + '</span></button>').join('') + '</div>';
      out.querySelectorAll('.pp-opt').forEach((b) => {
        b.onclick = () => {
          const r = opts[+b.dataset.i][2]();
          this.modified[nd.id] = true;
          if (global.State.sys) global.State.sys.modified++;
          out.innerHTML = '<div class="pp-quote">' + r + '</div>';
          if (global.Snd && global.Snd.tone) global.Snd.tone(160, 0.2, { type: 'sawtooth', gain: 0.06 });
          this.build();
          setTimeout(() => {
            const nd2 = document.querySelector('.pp-node[data-id="' + nd.id + '"]');
            if (nd2) nd2.classList.add('pp-mod');
          }, 30);
        };
      });
    },

    remove(nd) {
      if (nd.id === 'player') {
        if (global.State.sys) global.State.sys.selfDeleted = true;
        if (global.Endings) global.Endings.mark('recycler');
        document.dispatchEvent(new CustomEvent('selfDeleted'));
        Toast.show('你删掉了 player。', 2600);
      }
      this.deleted[nd.id] = true;
      if (global.State.sys) global.State.sys.deleted++;
      document.body.classList.add('glitch-once');
      setTimeout(() => document.body.classList.remove('glitch-once'), 420);
      if (global.Snd && global.Snd.glitch) global.Snd.glitch(0.3);
      Toast.show('节点 ' + nd.n + ' 已删除。世界缺了一块。', 2400);
      this.build();
    },
  };

  global.Persp = Persp;
  global.PERSP_NODES = NODES;
})(window);
