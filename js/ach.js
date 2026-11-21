/* ============================================================
   ach.js — 成就
   ------------------------------------------------------------
   成就不是奖励。是这间店替你记下的一句「你确实到过这里」。
   分成四类：摸（动手）、看（读完）、通（走完）、疯（不必如此）。

   每条都挂着真实的动作，不挂进度条：
     摸  ——  手在某样东西上停过
     看  ——  眼睛在某段字上停过
     通  ——  一条路走到了头
     疯  ——  没人要求你做，你还是做了

   本周目的记在 State.ach 里，跟着存档走；
   历来的另记一份，删档也不清 —— 那是你，不是这一局。
   ============================================================ */
(function (global) {
  'use strict';

  const LS = 'code_echo_ach_v1';

  const LIST = [
    {
      id: 'rush', cat: '疯', at: '序章 · 那二十秒',
      name: '急也没用', desc: '点了第一百下。声音没变，屏幕没变，你还是点完了。',
      hint: '黑暗里，点满一百下。',
    },
    {
      id: 'steady', cat: '摸', at: '第一章 · 机箱',
      name: '手很稳', desc: '四个角，一颗一颗松开。手一次没抖。',
      hint: '撬开机箱，别去碰那块很小的地方。',
    },
    {
      id: 'uv', cat: '摸', at: '第一章 · 键盘',
      name: '紫 光', desc: '把灯举到键盘上。指纹浮出来，像退潮后留在石头上的水痕。',
      hint: '那把锁，得用紫光灯照着开。',
    },
    {
      id: 'print', cat: '看', at: '第一章 · 旧系统',
      name: '一 页 纸', desc: '从一台九八年的机器里，把自己打印了出来。',
      hint: '在旧系统里右键，选「打印」。',
    },
    {
      id: 'balance', cat: '摸', at: '第二章 · 天平',
      name: '一 斤 八 两', desc: '愿望放一边，石头放另一边。天平认了这个数。',
      hint: '天平上，把该放的那块石头放上去。',
    },
    {
      id: 'soul', cat: '看', at: '第二章 · 叫魂',
      name: '应 声', desc: '叫了七声，七声都应了。最后那一声，你没敢应。',
      hint: '叫魂，一声都别叫错。',
    },
    {
      id: 'wall', cat: '看', at: '第四章 · 渲染层',
      name: '墙 后', desc: '你把墙挪开。它一直站在那儿，只是没有层。',
      hint: '在检查器里，把那面墙的层级改掉。',
    },
    {
      id: 'root37', cat: '通', at: '第五章 · 名单',
      name: '第三十六个', desc: '三十七行。第三十七行原本没有名字，现在有了。',
      hint: '第五章，认下空着的那一行。',
    },
    {
      id: 'cards', cat: '通', at: '贯穿 · 票根',
      name: '九 张 票 根', desc: '九道门，九张票，一个不缺。边角都磨圆了。',
      hint: '九章，章章进门。',
    },
    {
      id: 'box', cat: '摸', at: '木箱 · 柜台底下',
      name: '六 件 旧 物', desc: '木箱见底了。六个人丢下的东西，都修好了。',
      hint: '柜台底下那只木箱（Y），六件全修好。',
    },
    {
      id: 'six', cat: '通', at: '未竟 · 七件',
      name: '七 件 未 竟', desc: '七个人把没走完的事押在这儿。你都替他们收了尾。',
      hint: '档案册 · 未竟，七件事全做完。',
    },
    {
      id: 'mem35', cat: '看', at: '里间 · 三十五段',
      name: '三 十 五 段', desc: '读到最后一个，你已经记不住自己的了。',
      hint: '里间，三十五段记忆全读完。',
    },
    {
      id: 'duel', cat: '通', at: '对局 · 柜台',
      name: '七 局', desc: '他输第七次的时候笑了笑，说下一次换他学你。',
      hint: '对局，连赢七场。',
    },
    {
      id: 'night', cat: '看', at: '守夜 · 打烊以后',
      name: '七 则', desc: '灯灭以后，这条街才开始讲它原来的名字。',
      hint: '守夜，七则全听完。',
    },
    {
      id: 'speed', cat: '疯', at: '全程 · 一小时',
      name: '一 小 时', desc: '从登录到最后一页，没超过一个钟头。你舍不得停。',
      hint: '一小时之内走到终章。',
    },
    {
      id: 'ends', cat: '通', at: '结局册',
      name: '全 部 出 口', desc: '每个出口都走过一遍，才发现门是同一扇。',
      hint: '把结局册集齐。',
    },
  ];

  const BY = {};
  LIST.forEach((d) => { BY[d.id] = d; });

  /* 每类一个印色 —— 档案册里那一列小字用它 */
  const CAT = {
    '摸': '#c9a45c',
    '看': '#8fa9b8',
    '通': '#a8c0a0',
    '疯': '#b8201c',
  };

  const $ = (s) => document.querySelector(s);

  const Ach = {
    LIST: LIST,
    BY: BY,
    CAT: CAT,
    _timer: 0,
    _t0: 0,
    _popped: {},

    /* ---------- 读 ---------- */
    ever() {
      try {
        const o = JSON.parse(localStorage.getItem(LS) || '{}');
        return o && typeof o === 'object' ? o : {};
      } catch (e) { return {}; }
    },
    _everSave(o) {
      try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) {}
    },
    total() { return LIST.length; },

    /* 本局拿到的 */
    inRun(id) {
      const S = global.State || {};
      return !!(S.ach && S.ach[id]);
    },
    /* 拿到过（本局或历来） */
    has(id) {
      return this.inRun(id) || !!this.ever()[id];
    },
    count() { return LIST.filter((d) => this.inRun(d.id)).length; },
    everCount() { return LIST.filter((d) => this.ever()[d.id] || this.inRun(d.id)).length; },
    when(id) {
      const S = global.State || {};
      return (S.ach && S.ach[id]) || this.ever()[id] || 0;
    },

    /* ---------- 给 ---------- */
    give(id, opt) {
      const d = BY[id];
      if (!d) return false;
      const S = global.State || (global.State = {});
      S.ach = S.ach || {};
      const firstRun = !S.ach[id];
      if (firstRun) S.ach[id] = Date.now();

      const e = this.ever();
      const firstEver = !e[id];
      if (firstEver) { e[id] = Date.now(); this._everSave(e); }

      if (!firstRun) return false;
      this.pop(d, firstEver);
      if (global.Save && global.Save.touch) global.Save.touch();
      return true;
    },

    /* ---------- 弹 ---------- */
    pop(d, firstEver) {
      const ov = $('#ov-ach');
      if (!ov) return;
      if (this._timer) clearTimeout(this._timer);
      const n = this.count();
      const all = n >= LIST.length;
      const prog = $('#ach-prog');
      if (prog) prog.textContent = n + ' / ' + LIST.length + (firstEver ? '' : '　·　历来已有');
      const cat = $('#ach-cat');
      if (cat) { cat.textContent = d.cat; cat.style.color = CAT[d.cat] || '#4d7a63'; }
      const nm = $('#ach-name');
      if (nm) nm.textContent = d.name;
      const ds = $('#ach-desc');
      if (ds) ds.textContent = d.desc;
      const lb = $('#ach-label');
      if (lb) lb.textContent = firstEver ? '成 就 达 成' : '又 记 了 一 笔';
      const card = $('#ach-card');
      if (card) {
        card.dataset.cat = d.cat;
        card.style.borderColor = (CAT[d.cat] || '#23543c') + '88';
      }
      ov.classList.add('on');
      try { global.Snd && global.Snd.ok(); } catch (e) {}
      this._timer = setTimeout(() => ov.classList.remove('on'), 4600);

      if (all && !this._popped.all) {
        this._popped.all = true;
        setTimeout(() => {
          const ov2 = $('#ov-ach');
          if (!ov2) return;
          const nm2 = $('#ach-name');
          if (nm2) nm2.textContent = LIST.length + ' 笔，齐了';
          const ds2 = $('#ach-desc');
          if (ds2) ds2.textContent = '这间店能记的都记了。剩下的，你自己记着。';
          const lb2 = $('#ach-label');
          if (lb2) lb2.textContent = '全 收';
          const pr2 = $('#ach-prog');
          if (pr2) pr2.textContent = LIST.length + ' / ' + LIST.length;
          const ct2 = $('#ach-cat');
          if (ct2) { ct2.textContent = '全'; ct2.style.color = '#c9a45c'; }
          const lb2b = $('#ach-label');
          if (lb2b) lb2b.textContent = '全 收';
          ov2.classList.add('on');
          try { global.Snd && global.Snd.ok(); } catch (e) {}
          this._timer = setTimeout(() => ov2.classList.remove('on'), 6200);
        }, 4200);
      }
    },

    /* 旧调用方式：Ach.show('名', '描述') */
    show(name, desc, dur) {
      const hit = LIST.find((d) => d.name === name || d.id === name);
      if (hit) return this.give(hit.id);
      const ov = $('#ov-ach');
      if (!ov) return false;
      const nm = $('#ach-name'); if (nm) nm.textContent = name;
      const ds = $('#ach-desc'); if (ds) ds.textContent = desc || '';
      ov.classList.add('on');
      setTimeout(() => ov.classList.remove('on'), dur || 4200);
      return true;
    },

    /* ---------- 扫 ----------
       不往每个谜题里插钩子，隔两秒看一眼状态就够了。
       门槛都取自真正被写下的东西，不另开一套计数器。 */
    scan() {
      const S = global.State;
      if (!S) return;
      const sys = S.sys || {};
      const app = global.App || {};
      const cur = app.current || '';

      /* 起点：第一次进记忆殿 */
      if (!this._t0) {
        if (sys.t0) this._t0 = sys.t0;
        else if (cur === 'hall' || cur === 'contract' || cur === 'counter') {
          sys.t0 = Date.now();
          this._t0 = sys.t0;
        }
      }

      /* 摸 */
      if (S.pryOpened && !sys.pryScare) this.give('steady');
      if (S.seq) this.give('uv');
      if (S.printed) this.give('print');
      if (S.wish && (S.ch2 >= 3 || S.doorOpened)) this.give('balance');

      /* 看 */
      if (S.soulDone && (S.soulWrong || 0) === 0) this.give('soul');
      if (S.figureSeen) this.give('wall');
      if (global.Strata && global.Strata.state && global.Strata.state().rootRead) this.give('root37');
      if (global.Night && global.Night.read && global.Night.read().length >= 7) this.give('night');
      if (global.Memory && global.Memory.stats) {
        const st = global.Memory.stats();
        if (st && st.total && st.read >= st.total) this.give('mem35');
      }

      /* 通 */
      if (global.Chapter && global.Chapter.list) {
        const l = global.Chapter.list();
        if (l.length && l.every((c) => c.seen)) this.give('cards');
      }
      if (global.Quests && global.Quests.doneCount && global.Quests.doneCount() >= global.Quests.count()) {
        this.give('six');
      }
      if (global.Hands && global.Hands.KIT && S.hands) {
        const kit = global.Hands.KIT;
        if (kit.length && kit.every((k) => S.hands[k.id] && S.hands[k.id].done)) this.give('box');
      }
      if (global.Duel && global.Duel.wins && global.Duel.wins() >= 7) this.give('duel');
      if (global.Endings && global.Endings.list) {
        const got = new Set(global.Endings.reached ? global.Endings.reached() : []);
        (sys.endings || []).forEach((e) => got.add(e));
        if (got.size >= global.Endings.list.length) this.give('ends');
      }

      /* 疯 */
      if (this._t0 && cur === 'final' && Date.now() - this._t0 < 3600 * 1000) this.give('speed');
    },

    start() {
      if (this._booted) return;
      this._booted = true;
      document.addEventListener('screenchange', () => setTimeout(() => this.scan(), 260));
      setInterval(() => this.scan(), 2600);
      setTimeout(() => this.scan(), 1200);
    },
  };

  global.Ach = Ach;
  if (global.G) global.G.Ach = Ach;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => Ach.start());
  } else {
    Ach.start();
  }
})(window);
