/* ============================================================
   scene-street.js — 第七章 · 门 外
   ------------------------------------------------------------
   昨晚你在柜台后面写了七行字。今天早上你走出那扇门。
   街上有五个人还站着 —— 他们就是那七行字里的五个。

   你在店里看不见这件事：你只看见纸。
   写下去的时候，"被折了"是一个词；走出来才看清，它是一天。

   三件事只能做一件：走近一点、说一句话、或者走开。
   说完他们也不会好起来。你改不了已经生效的东西。

   —— 借《Kentucky Route Zero》的胆子：一条街只给一束光。
   —— 借《Disco Elysium》的胆子：不给选项，给姿态。
   —— 借《NieR: Automata》的胆子：东西一直在玻璃柜里，只是你从没走近。
   ============================================================ */
(function (global) {
  'use strict';

  const { $, wait, Fade, Toast } = global.G;

  /* ------------------------------------------------------------
     五个人。门牌是他们的此刻，不是他们的过去。
     now 按昨晚那七笔里你写下的字分档：
       kept 保住 / stripped 被折 / voided 作废 / other 没办、抵了、让位
     ------------------------------------------------------------ */
  const STOPS = [
    {
      id: 'zhao', no: '01', name: '赵德海', relic: '一只右手',
      now: {
        kept: ['公交站的塑料椅上，他坐着。右手揣在兜里。',
               '旁边是他儿子，在啃一个包子，啃得很慢。'],
        stripped: ['他站在站牌底下，反复看自己那只手。',
                   '翻过来，翻过去。儿子问他几点，他答慢半拍。'],
        voided: ['站牌上没有他的名字。',
                 '车来了三次。售票员问了三次「你上不上」，他每次都摇头。'],
        other: ['他坐在店门口的台阶上，没走。',
                '那只手还在。他把它放在膝盖上，像放一件别人的东西。'],
      },
      near: '（走近了才看清：他那两指之间捏着一张收据，八百六，纸已经软了。）',
      say: {
        truth: '「你那只手，是替你徒弟挡的。」',
        rule: '「表上第三档。就是这个价。」',
        theirs: '「你说你自己违规。我照你说的写了。」',
        refuse: '（你没说话。你在旁边站着，站了一会儿。）',
      },
      back: '他抬头看你，看了三秒。\n「你是昨天那个。」\n然后低下头。',
      away: '（你走开了。身后有塑料椅被挪动的声音。）',
      prop: 'bench',
    },
    {
      id: 'liu', no: '02', name: '刘小燕', relic: '睡 眠',
      now: {
        kept: ['医院走廊的塑料椅上，她睡着了，头歪着。',
               '手机还亮着，屏保是一张化验单。'],
        stripped: ['她站着也能睡。等红灯的时候整个人晃了一下。',
                   '醒了，看表，又走。走得很准，像量过。'],
        voided: ['透析室的登记本上，她母亲那一栏是空的。',
                 '她把那页翻过来，又翻回去，问窗口：是不是印错了。'],
        other: ['她在店门口等。说「我不急，你慢慢来」。',
                '手里攥着三张缴费单，边角磨得起毛。'],
      },
      near: '（走近了才看清：她的工牌上贴着两张创可贴，遮住了照片。）',
      say: {
        truth: '「你一天睡四个小时。我照实写了。」',
        rule: '「一天算一格。我按规矩写的。」',
        theirs: '「你说你押的是睡着的那一部分。」',
        refuse: '（你没说话。她在睡，你不想叫醒她。）',
      },
      back: '她睁开眼。先看你的手，再看你的脸。\n「办完了？」她问。',
      away: '（你走开了。她没醒。）',
      prop: 'chair',
    },
    {
      id: 'girl', no: '03', name: '穿校服的', relic: '六月七号上午',
      now: {
        kept: ['她背着一个很轻的书包走过去。校服洗得发白，但是干净的。',
               '脚步很快，像怕迟到。'],
        stripped: ['她坐在花坛边上，膝盖上摊着一本习题。',
                   '风把页翻过去，她没管。翻到最后一页，她把它合上了。'],
        voided: ['校门口的值班表上，她那一行被划掉了。',
                 '保安拦下她，问她找谁。她说了三个名字，保安都摇头。'],
        other: ['她蹲在卷帘门底下，抱着膝盖。',
                '看见你，站起来，拍了拍裙子。'],
      },
      near: '（走近了才看清：她校服袖口有一道洗不掉的钢笔水。）',
      say: {
        truth: '「六月七号上午。我照实写了。」',
        rule: '「你还没成年。规矩上只能这么写。」',
        theirs: '「你说你想让家里别再摔东西。我照你说的写了。」',
        refuse: '（你没说话。你从她旁边走过去，像没看见。）',
      },
      back: '她看着你。\n「我十七。」她说。\n停了一下。「我不是十七。」',
      away: '（你走开了。她还坐在那儿，书摊在膝盖上。）',
      prop: 'planter',
    },
    {
      id: 'zhou', no: '04', name: '周敬之', relic: '一本教案 · 六册',
      now: {
        kept: ['早点摊上，他把一叠纸摊开，用筷子压住两个角。',
               '摊主给他加了一勺汤，他没抬头。'],
        stripped: ['他手里空着。走两步，回头看一眼。',
                   '像忘了什么，又想不起来是什么。他站了一会儿，继续走。'],
        voided: ['他站在一所学校门口，看放学的孩子。',
                 '门卫问他找谁。他张开嘴，没说出名字。'],
        other: ['他坐在店门口的台阶上，把教案抱在怀里。',
                '像抱一件外套。'],
      },
      near: '（走近了才看清：那叠纸的边上画着一个小人，两条腿不一样长。）',
      say: {
        truth: '「你要见的那个人，教案里有。我照实写了。」',
        rule: '「一本教案，六册。按页数折的。」',
        theirs: '「你说你想见一个人一面。我照你说的写了。」',
        refuse: '（你没说话。你扶了一下他的手，让教案别滑下去。）',
      },
      back: '他抬头，看了你很久。\n「你教过书吗？」\n你摇头。他说：「那你不懂。」',
      away: '（你走开了。他把那叠纸又摊开一遍。）',
      prop: 'stall',
    },
    {
      id: 'chen', no: '05', name: '陈 立', relic: '一条左膝',
      now: {
        kept: ['他把车停在路边，蹲下系鞋带。',
               '起来的时候没扶车。'],
        stripped: ['他上台阶，上一级，停一下。',
                   '手机响了，他没接。响了三次，他才掏出来看。'],
        voided: ['站点的排班表上没有他。',
                 '他站在那儿刷手机，刷了很久。屏幕的光照着他的脸。'],
        other: ['他的车停在店门口，人不在。',
                '车座上放着一份没送出去的餐，保温袋还拉着。'],
      },
      near: '（走近了才看清：他左膝的裤子上，有一块磨白的印子。）',
      say: {
        truth: '「你那条腿，是那天下雨摔的。我照实写了。」',
        rule: '「一条差评，折一半。规矩是这样。」',
        theirs: '「你说你想撤掉一个差评。我照你说的写了。」',
        refuse: '（你没说话。你帮他把保温袋的拉链拉上了。）',
      },
      back: '他看你一眼，把手机塞回兜里。\n「几点了？」\n你说了。他说：「哦。那我得走了。」',
      away: '（你走开了。他还在刷手机。）',
      prop: 'bike',
    },
  ];

  const FATE_CN = {
    kept: '你写的是「保住」', stripped: '你写的是「照规矩折」',
    voided: '你写的是「作废」', other: '你写的是「另作处置」',
  };

  const Street = {
    inited: false,
    stage: 'intro',   // intro | street | stop | glass | done
    at: null,
    acted: false,
    _timers: [],

    /* ---------- 状态 ---------- */
    book() {
      const S = global.State;
      S.sys = S.sys || {};
      const s = S.sys.street = S.sys.street || {};
      if (!Array.isArray(s.seen)) s.seen = [];
      if (!s.acts || typeof s.acts !== 'object') s.acts = {};
      return s;
    },

    picks() {
      const d = (global.State.sys && global.State.sys.duty) || {};
      return (d.picks || []).filter((p) => p && p.id);
    },

    fateOf(id) {
      const p = this.picks().find((x) => x.id === id);
      if (!p) return 'other';
      const f = p.fate;
      return (f === 'kept' || f === 'stripped' || f === 'voided') ? f : 'other';
    },

    kindOf(id) {
      const p = this.picks().find((x) => x.id === id);
      const k = p && p.kind;
      return (k === 'truth' || k === 'rule' || k === 'theirs') ? k : 'refuse';
    },

    /* ---------- 初始化 ---------- */
    init() {
      if (this.inited) return;
      this.inited = true;

      $('#st-houses').addEventListener('click', (e) => {
        const h = e.target.closest('.st-house');
        if (!h) return;
        if (h.classList.contains('done')) return;
        this.open(h.dataset.id);
      });

      $('#st-end').addEventListener('click', () => {
        if (!$('#st-end').classList.contains('on')) return;
        this.glass();
      });

      $('#st-out').addEventListener('click', (e) => {
        e.stopPropagation();
        this.out();
      });

    },

    clean() {
      this._timers.forEach((t) => clearTimeout(t));
      this._timers = [];
    },

    /* ---------- 进场 ---------- */
    async start() {
      this.init();
      this.clean();
      const S = global.State;
      S.sys = S.sys || {};
      S.ch7 = Math.max(S.ch7 || 0, 1);
      S.pendingTalk = null;

      const b = this.book();
      this.acted = false;
      this.at = null;

      if (global.Chapter) await global.Chapter.show('ch7');

      /* 五站都走过了：直接到街尽头 */
      if (b.seen.length >= STOPS.length) {
        this.renderStreet();
        await this.glass(true);
        return;
      }

      $('#st-wrap').dataset.stage = 'intro';
      $('#st-s').textContent = '';
      $('#st-stop').classList.remove('on');
      $('#st-run').classList.remove('on');

      await this.say([
        '门在你身后合上。很轻，像有人用手扶住门板，慢慢放回去。',
        '街上有雾。早点摊刚支起来，油在锅里响。',
        '天没亮透。路灯还亮着，只是不照亮什么。',
        '你手里有一张纸。七个名字，七个你昨晚写下的词。',
        '纸是凉的。',
      ]);

      await wait(700);
      this.renderStreet();
    },

    async say(lines, gap) {
      const box = $('#st-text');
      box.innerHTML = '';
      for (const t of lines) {
        const p = document.createElement('p');
        p.className = 'st-l';
        p.textContent = t;
        box.appendChild(p);
        await wait(gap || 620);
      }
    },

    /* ---------- 街 ---------- */
    renderStreet() {
      this.stage = 'street';
      const b = this.book();
      const wrap = $('#st-wrap');
      wrap.dataset.stage = 'street';
      $('#st-stop').classList.remove('on');
      $('#st-run').classList.add('on');
      $('#st-t').textContent = '门 外';
      $('#st-s').textContent = '你写下的那个字，落在纸上是一个词。落在人身上，是一天。';

      const box = $('#st-houses');
      box.innerHTML = STOPS.map((s) => {
        const fate = this.fateOf(s.id);
        const done = b.seen.indexOf(s.id) >= 0;
        const tx = (s.now[fate] || s.now.other)[0];
        return '<button class="st-house' + (done ? ' done' : '') + '" data-id="' + s.id + '">' +
          '<span class="st-h-no">' + s.no + '</span>' +
          '<span class="st-h-win"><i></i><i></i></span>' +
          '<span class="st-h-name">' + s.name + '</span>' +
          '<span class="st-h-tx">' + (done ? '（走过了）' : tx) + '</span>' +
          '<span class="st-h-fate f-' + fate + '">' + FATE_CN[fate] + '</span>' +
          '</button>';
      }).join('');

      $('#st-n').textContent = b.seen.length + ' / ' + STOPS.length;
      $('#st-paper').textContent = b.seen.length >= STOPS.length
        ? '纸还在手里' : '手里还有一张纸';

      const all = b.seen.length >= STOPS.length;
      $('#st-end').classList.toggle('on', all);
      if (all) $('#st-s').textContent = '五个门都走过了。街的尽头还有一样东西。';
    },

    /* ---------- 一站 ---------- */
    open(id) {
      const st = STOPS.find((s) => s.id === id);
      if (!st) return;
      const b = this.book();
      if (b.seen.indexOf(id) >= 0) return;

      this.stage = 'stop';
      this.at = st;
      this.acted = false;

      const fate = this.fateOf(id);
      $('#st-wrap').dataset.stage = 'stop';
      $('#st-stop').classList.add('on');
      $('#st-run').classList.remove('on');
      $('#st-s').textContent = '第 ' + st.no + ' 个门 · ' + st.name + ' · 押的是' + st.relic;

      const sc = $('#st-scene');
      sc.dataset.prop = st.prop || 'bench';
      $('#st-prop').className = 'st-prop p-' + (st.prop || 'bench');

      $('#st-text').innerHTML = '';
      $('#st-acts').innerHTML = '';

      const lines = st.now[fate] || st.now.other;
      this.say(lines, 780).then(() => {
        if (this.at !== st) return;
        this.showActs(['near', 'say', 'away']);
      });

      if (global.Snd) {
        try { global.Snd.tone(150, 0.9, { type: 'sine', gain: .026, attack: .3 }); } catch (e) {}
      }
    },

    showActs(list) {
      const LABEL = { near: '走 近', say: '说 一 句', away: '走 开' };
      const SUB = { near: '看清一点', say: '他听得见', away: '不打扰' };
      $('#st-acts').innerHTML = list.map((k) =>
        '<button class="st-a' + (k === 'away' ? ' ghost' : '') + '" data-st="' + k + '">' +
        '<b>' + LABEL[k] + '</b><i>' + SUB[k] + '</i></button>').join('');
    },

    async act(kind) {
      if (!this.at || this.acted) return;
      const st = this.at;
      const box = $('#st-text');
      $('#st-acts').innerHTML = '';

      const push = (t, cls) => {
        const p = document.createElement('p');
        p.className = 'st-l' + (cls ? ' ' + cls : '');
        p.textContent = t;
        box.appendChild(p);
      };

      if (kind === 'near') {
        push(st.near, 'narr');
        if (global.Snd) { try { global.Snd.tone(300, 0.2, { type: 'sine', gain: .02 }); } catch (e) {} }
        await wait(1100);
        if (this.at !== st) return;
        this.showActs(['say', 'away']);
        return;
      }

      this.acted = true;
      this.book().acts[st.id] = kind;

      if (kind === 'say') {
        const k = this.kindOf(st.id);
        push(st.say[k] || st.say.refuse, 'say');
        if (global.Snd) { try { global.Snd.tone(196, 0.5, { type: 'triangle', gain: .034 }); } catch (e) {} }
        await wait(1500);
        if (this.at !== st) return;
        push(st.back, 'back');
        await wait(1300);
      } else {
        push(st.away, 'narr');
        await wait(1100);
      }

      if (this.at !== st) return;
      const left = STOPS.length - (this.book().seen.length + 1);
      $('#st-acts').innerHTML =
        '<button class="st-a" data-st="go"><b>往 前 走</b><i>' +
        (left > 0 ? '还有 ' + left + ' 个门' : '街尽头') + '</i></button>';
      const g = $('#st-acts').querySelector('[data-st="go"]');
      g.addEventListener('click', () => this.leaveStop());
    },

    leaveStop() {
      if (!this.at) return;
      const id = this.at.id;
      const b = this.book();
      if (b.seen.indexOf(id) < 0) b.seen.push(id);
      this.at = null;
      this.acted = false;
      /* 记一笔，中断了也知道走过几站 */
      try { if (global.Save) global.Save.touch(); } catch (e) {}
      this.renderStreet();
      if (global.Snd) { try { global.Snd.tone(120, 0.7, { type: 'sine', gain: .03 }); } catch (e) {} }
    },

    /* ---------- 街尽头：玻璃柜 ---------- */
    async glass(silent) {
      const b = this.book();
      if (b.end) { await this.finish(); return; }

      this.stage = 'glass';
      this.at = null;
      const wrap = $('#st-wrap');
      wrap.dataset.stage = 'stop';
      $('#st-stop').classList.add('on');
      $('#st-run').classList.remove('on');
      $('#st-scene').dataset.prop = 'case';
      $('#st-prop').className = 'st-prop p-case';
      $('#st-acts').innerHTML = '';
      $('#st-t').textContent = '街 尽 头';
      $('#st-s').textContent = '';

      await this.say([
        '街的尽头有一台玻璃柜。里面亮着一盏很小的灯，只照亮柜子里面。',
        '摆着东西：一只右手，一段睡眠，六月七号上午，一本教案，一条左膝。',
        '每一件底下压着一张纸条，写着号码。',
        '玻璃上映着一个人。你看了两秒才认出那是你。',
        '你手里这张纸，还没地方放。',
      ], 780);

      await wait(400);
      $('#st-acts').innerHTML =
        '<button class="st-a" data-st="file"><b>塞 进 柜 子</b><i>它本来就在里面</i></button>' +
        '<button class="st-a" data-st="tear"><b>撕 掉</b><i>七个名字，七个词</i></button>' +
        '<button class="st-a ghost" data-st="keep"><b>收 起 来</b><i>揣在兜里</i></button>';
    },

    async actGlass(kind) {
      const b = this.book();
      b.end = kind;
      $('#st-acts').innerHTML = '';
      const T = {
        file: ['你把纸从柜子底下的缝里塞进去。',
               '纸滑了一段，停在最里面，压在那一只右手下面。',
               '柜子里多了一张。第八个名字。',
               '灯还是那么小，照亮的东西多了一点。'],
        tear: ['你把纸对折，撕开。再对折，再撕。',
               '撕到不能再撕，扔进旁边的垃圾桶。',
               '有一片被风卷起来，贴在玻璃上，没掉。'],
        keep: ['你把纸折好，揣进兜里。',
               '它有点硬，硌着腿。',
               '你站了一会儿，往回走。'],
      };
      await this.say(T[kind], 820);
      try { if (global.Save) global.Save.touch(); } catch (e) {}
      await wait(900);
      $('#st-acts').innerHTML =
        '<button class="st-a" data-st="back"><b>回 柜 台</b><i>灯还亮着</i></button>';
      $('#st-acts').querySelector('[data-st="back"]').addEventListener('click', () => this.finish());
    },

    /* st-stop 上的点击分流 */
    onStopClick(e) {
      const btn = e.target.closest('[data-st]');
      if (!btn) return;
      const k = btn.dataset.st;
      if (k === 'go') return this.leaveStop();
      if (k === 'back') return this.finish();
      if (k === 'file' || k === 'tear' || k === 'keep') return this.actGlass(k);
      return this.act(k);
    },

    /* ---------- 收尾 ---------- */
    async finish() {
      if (this.stage === 'done') return;
      this.stage = 'done';
      this.clean();
      const S = global.State;
      S.ch7 = Math.max(S.ch7 || 0, 3);
      await Fade.through(() => {
        global.App.show('final');
        if (global.Final) global.Final.start();
      });
    },

    /* Esc：站里退回街，街上退回柜台；玻璃柜那一步不放行 */
    escBack() {
      if (this.stage === 'glass') {
        Toast.show('这张纸还没放下。', 2200);
        return;
      }
      if (this.stage === 'stop' && this.at) {
        this.at = null;
        this.acted = false;
        this.renderStreet();
        return;
      }
      this.out();
    },

    /* 中途回柜台 */
    out() {
      if (this.stage === 'done') return;
      this.clean();
      const go = () => {
        global.App.show('counter');
        if (global.Counter) {
          global.Counter.init();
          if (global.Counter.refreshHud) global.Counter.refreshHud();
          if (global.Counter.updateHint) global.Counter.updateHint();
        }
        Toast.show('街上还有人站着。按 Q 再出去。', 4200);
        try { if (global.Save) global.Save.touch(); } catch (e) {}
      };
      if (global.Fade) global.Fade.through(go); else go();
    },

    /* 柜台/侧边坞再进来 */
    reenter() {
      global.App.show('street');
      this.start();
    },

    data() { return STOPS; },
    total() { return STOPS.length; },
  };

  global.Street = Street;

  /* st-stop 的点击：玻璃柜那一段也要走同一条路 */
  document.addEventListener('click', (e) => {
    if (!global.App || global.App.current !== 'street') return;
    if (!e.target.closest('#st-stop')) return;
    Street.onStopClick(e);
  });
})(window);
