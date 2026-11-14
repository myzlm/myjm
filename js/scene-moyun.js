/* ============================================================
   scene-moyun.js — 墨韵 · 科技卷轴
   ------------------------------------------------------------
   "以古法落墨，以科技解迷。"
   二楼工作台上的东西。八段密文，四层密钥，三种不用钥匙的写法。
   密钥不是猜的——是你自己：来的时间、押下的记忆、做过的选择。
   解开的结果会自己回写到世界里。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Toast } = global.G;

  const PLAIN = [
    {
      id: 'photo', name: '林墨 · 照片背面', src: '档案盒 #3 夹层', alg: 'caesar', key: 'base',
      plain: '不要相信典当行主人', hint: '照片背面有一行很淡的字。像是用指甲划的。',
      reward: '照片背面还压着半句话：他不是在典当记忆，他在收。', unlock: 'record0',
    },
    {
      id: 'code', name: '陈一鸣 · 代码注释', src: '/app/hall.js 第 41 行', alg: 'vigenere', key: 'base',
      plain: '隐藏功能：输入密码打开', hint: '注释里藏着一句不属于这个项目的话。',
      reward: '注释下面多了一行：// 写给下一个会看代码的人', unlock: 'hint',
    },
    {
      id: 'key', name: '张雨桐 · 钥匙柄', src: '档案盒 #17', alg: 'aes', key: 'memory',
      plain: '里空间新入口在祠堂', hint: '钥匙柄内侧刻着一串看不懂的东西。',
      reward: '里空间的入口，从这一刻起是稳定的。', unlock: 'inner',
    },
    {
      id: 'diary', name: '王未 · 日记残页', src: '档案盒 #28', alg: 'rail', key: 'action',
      plain: '典当行主人是第0号玩家', hint: '残页上有被水泡开的墨，字是反着的。',
      reward: '第 0 号。不是第 36 个——是第 0 个。', unlock: 'zero',
    },
    {
      id: 'root', name: '控制室 · 终端', src: 'root/tty0', alg: 'ancient', key: 'sigil',
      plain: '地球online v0.1 最初的回响', hint: '终端上闪着一串东西。要五层才解得开。',
      reward: '「最初的回响」程序已激活。连接成功。你好，编写者。', unlock: 'final',
    },
    /* --- 后三段：不用钥匙的新法 --- */
    {
      id: 'tele', name: '电报局 · 未发出的电文', src: '档案盒 #37 夹层', alg: 'morse', key: 'base',
      plain: '三十七号从来没有存在过',
      hint: '一长串点和横。像电报。中间夹着单独的「!」，那不是标点，是另一种字的开头。',
      reward: '三十七号不是一个玩家。是一个位置——谁坐上去，谁就是三十七。', unlock: 'tele',
    },
    {
      id: 'ash', name: '灰里剩下的稿纸', src: '柜台下的铁盒', alg: 'bacon', key: 'base',
      plain: '你不姓你以为的那个姓',
      hint: '纸上只有 A 和 B，五个一组。像有人用两种字重写了一遍，然后把墨水抽走了。',
      reward: '你在合同上签字的时候，笔尖停了一下。因为那个姓，你不熟。', unlock: 'ash',
    },
    {
      id: 'mirror', name: '镜子背面', src: '里空间 · 第三面镜', alg: 'atbash', key: 'base',
      plain: '镜子里的人先眨眼',
      hint: '每个字都是对的形状，但拼在一起读不通。像是把整张纸对着光翻了一次。',
      reward: '你把镜子翻过来，背面没有水银。后面是一行正着写的字：我比你先到。', unlock: 'mirror',
    },
  ];

  const Moyun = {
    inited: false,
    built: false,
    items: [],
    cur: 0,
    keyLevel: 'base',
    solved: {},
    used: {},
    prev: 'counter',
    busy: false,

    /* ---------- 构建密文（每局按真名现算） ---------- */
    async build() {
      if (this.built) return;
      this.built = true;
      const out = [];
      for (const p of PLAIN) {
        const k = global.TrueName.key(p.key);
        let ct = '';
        try { ct = await global.Cipher.enc(p.plain, k, p.alg); } catch (e) { ct = '（生成失败）'; }
        out.push(Object.assign({}, p, { ct: String(ct) }));
      }
      this.items = out;
      this.renderList();
    },

    init() {
      if (this.inited) return;
      this.inited = true;
      $('#my-back').addEventListener('click', () => this.back());
      $('#my-solve').addEventListener('click', () => this.smart());
      $$('.my-key').forEach((b) => {
        b.addEventListener('click', () => {
          this.keyLevel = b.dataset.k;
          $$('.my-key').forEach((x) => x.classList.toggle('on', x === b));
          $('#my-keyval').textContent = global.TrueName.key(this.keyLevel);
          this.clearOut();
        });
      });
      $$('.my-alg').forEach((b) => {
        b.addEventListener('click', () => this.tryAlg(b.dataset.a));
      });
      $('#my-copy').addEventListener('click', () => {
        const t = $('#my-plain').textContent;
        if (!t) return;
        try { navigator.clipboard.writeText(t); Toast.show('已抄下。', 1600); } catch (e) { Toast.show(t, 2600); }
      });
      $('#my-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.checkManual(); }
      });
      $('#my-check').addEventListener('click', () => this.checkManual());
      $('#my-cipher').addEventListener('click', () => {
        const it = this.items[this.cur];
        if (!it) return;
        try { navigator.clipboard.writeText(it.ct); Toast.show('密文已抄下。', 1600); }
        catch (e) { Toast.show(it.ct.slice(0, 40) + '…', 2600); }
      });
    },

    /* 从侧边坞 / 键盘 K 打开：记住来处，收起时回去 */
    show() {
      const prev = (global.App && global.App.current) || 'counter';
      if (prev === 'moyun') return;
      if (global.App) global.App.show('moyun');
      this.start(prev);
    },

    async start(prevScene) {
      this.init();
      this.prev = prevScene || (global.App && global.App.current) || 'counter';
      await this.build();
      this.keyLevel = 'base';
      $$('.my-key').forEach((x) => x.classList.toggle('on', x.dataset.k === 'base'));
      $('#my-keyval').textContent = global.TrueName.key('base');
      this.clearOut();
      this.renderList();
      if (this.items.length) this.select(0);

      // 墨韵本体彩蛋
      if (!this.typed) {
        this.typed = true;
        setTimeout(() => {
          if (global.Eggs) global.Eggs.unlock(51, true);
          Toast.show('卷轴上浮出一行小字：墨落成韵，韵外无字。', 3200);
        }, 1800);
      }
    },

    back() {
      if (global.App) { global.App.show(this.prev); }
      if (this.prev === 'counter' && global.Counter) global.Counter.init();
    },

    renderList() {
      const box = $('#my-list');
      if (!box) return;
      box.innerHTML = this.items.map((it, i) => {
        const on = !!this.solved[it.id];
        return '<button class="my-item ' + (i === this.cur ? 'on' : '') + (on ? ' done' : '') + '" data-i="' + i + '">' +
          '<span class="mi-n">' + it.name + '</span>' +
          '<span class="mi-s">' + (on ? '已解 · ' + it.plain : it.src) + '</span>' +
          '<span class="mi-l">' + (on ? '✓' : '？') + '</span></button>';
      }).join('');
      $$('.my-item').forEach((b) => {
        b.addEventListener('click', () => this.select(+b.dataset.i));
      });
    },

    select(i) {
      this.cur = i;
      const it = this.items[i];
      this.renderList();
      $('#my-title').textContent = it.name;
      $('#my-place').textContent = it.src;
      $('#my-cipher').textContent = it.ct;
      $('#my-hint').textContent = it.hint;
      $('#my-alg-tip').textContent = '';
      this.clearOut();
      if (this.solved[it.id]) {
        $('#my-plain').textContent = it.plain;
        $('#my-output').classList.add('on');
        $('#my-reward').textContent = it.reward;
      }
    },

    clearOut() {
      $('#my-plain').textContent = '';
      $('#my-reward').textContent = '';
      $('#my-cands').innerHTML = '';
      $('#my-output').classList.remove('on');
      $('#my-input').value = '';
    },

    /* ---------- 智能检测 ---------- */
    async smart() {
      if (this.busy) return;
      const it = this.items[this.cur];
      if (!it) return;
      this.busy = true;
      $('#my-cands').innerHTML = '<div class="my-scan">正在依次试：' +
        global.Cipher.ALGS.filter((a) => a.id !== 'plain').map((a) => a.name).join(' · ') + '……</div>';
      const key = global.TrueName.key(this.keyLevel);
      const cands = await global.Cipher.solve(it.ct, key);
      this.busy = false;
      if (!cands.length) { $('#my-cands').innerHTML = '<div class="my-scan bad">所有算法都吐出了乱码。密钥不对。</div>'; return; }
      $('#my-cands').innerHTML = cands.map((c, i) =>
        '<button class="my-cand" data-i="' + i + '">' +
        '<span class="mc-a">' + c.name + '</span>' +
        '<span class="mc-s">' + c.score.toFixed(1) + '</span>' +
        '<span class="mc-t">' + (c.text || '').slice(0, 60) + '</span>' +
        '</button>').join('');
      $$('.my-cand').forEach((b) => {
        b.addEventListener('click', () => this.accept(it, cands[+b.dataset.i]));
      });
    },

    /* ---------- 手动选算法 ---------- */
    async tryAlg(alg) {
      const it = this.items[this.cur];
      if (!it) return;
      const key = global.TrueName.key(this.keyLevel);
      this.used[alg] = true;
      this.reportUsed();
      let t = null;
      try { t = await global.Cipher.dec(it.ct, key, alg); } catch (e) { t = null; }
      this.accept(it, { alg: alg, text: t, score: global.Cipher.readability(t || '') });
    },

    reportUsed() {
      const used = Object.keys(this.used);
      const total = global.Cipher.ALGS.filter((a) => a.id !== 'plain').length;
      document.dispatchEvent(new CustomEvent('moyunAlgs', { detail: used }));
      if (used.length >= total) Toast.show('八种写法都用过了。卷轴认了你。', 2600);
    },

    checkManual() {
      const it = this.items[this.cur];
      const v = ($('#my-input').value || '').trim();
      if (!v || !it) return;
      if (global.Cipher.readability(v) > 0 && v === it.plain) {
        this.accept(it, { text: v, alg: 'manual', score: 100 });
      } else {
        Toast.show('不对。或者缺字。', 2200);
        $('#my-input').value = '';
      }
    },

    accept(it, cand) {
      const t = (cand.text || '').replace(/\s+$/, '');
      if (!t) { $('#my-alg-tip').textContent = '这组算法配这把钥匙，什么也解不出来。'; return; }
      const right = t === it.plain || (t.indexOf(it.plain) >= 0);
      $('#my-plain').textContent = t;
      $('#my-output').classList.add('on');
      if (!right) {
        $('#my-alg-tip').textContent = '解出来了，但不像人话。得分 ' + (cand.score || 0).toFixed(1) + '。换个密钥层级试试。';
        $('#my-reward').textContent = '';
        return;
      }
      this.solved[it.id] = true;
      if (cand.alg === 'ancient' && global.Eggs) global.Eggs.unlock(53, true);
      $('#my-alg-tip').textContent = cand.alg === 'ancient'
        ? '解开了。古法显影：反写 · 交错 · 匙移 · 错排 · 九宫 · 摩斯 · 游程。'
        : '解开了。';
      $('#my-reward').textContent = it.reward;
      this.renderList();
      this.applyUnlock(it);
      // 给支线用：哪一条、用的什么算法（#35 赵回要"另一种方法"）
      document.dispatchEvent(new CustomEvent('moyunSolved', { detail: { key: it.id, alg: cand.alg, plain: t } }));
    },

    applyUnlock(it) {
      const S = global.State;
      const sys = (S.sys = S.sys || {});
      if (sys.moyunSolved.indexOf(it.id) < 0) sys.moyunSolved.push(it.id);
      if (it.unlock === 'inner') sys.innerSpace = true;
      if (it.unlock === 'zero') sys.zero = true;
      if (it.unlock === 'tele') { sys.tele = true; }
      if (it.unlock === 'ash') { sys.ash = true; }
      if (it.unlock === 'mirror') {
        sys.mirrorBack = true;
        // 三面镜子都解出来了 → 里空间的门是开的
        if (sys.tele && sys.ash) sys.innerSpace = true;
      }
      if (it.unlock === 'final') {
        sys.cipherFinal = true;
        document.dispatchEvent(new CustomEvent('cipherFinal'));
        setTimeout(() => Toast.show('「最初的回响」已写入。你可以在代码里写东西了。', 3600), 800);
      }
      const n = sys.moyunSolved.length;
      if (n >= 3 && !sys.linf) {
        sys.linf = true;
        setTimeout(() => Toast.show('权限提升：L∞ 编写者。按 P，然后点「编写」。', 4200), 1200);
      }
      document.body.classList.add('moyun-flash');
      setTimeout(() => document.body.classList.remove('moyun-flash'), 900);
      if (global.Snd && global.Snd.ok) global.Snd.ok();
      // 真名印记里的 37 → 同频
      if (global.TrueName && global.TrueName.data.sigil.indexOf('37') >= 0 && global.Eggs) {
        global.Eggs.unlock(52, true);
      }
    },
  };

  global.Moyun = Moyun;
})(window);
