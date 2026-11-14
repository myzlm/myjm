/* ============================================================
   duty.js — 第六章 · 收 摊
   ------------------------------------------------------------
   你从记录库上来，门在身后合上。
   柜台里没有人。台上压着一张纸：
     「今日当班：你。七位。灯油只够到打烊。」

   每位客人三件事：问一句、写一行。
   你写的那一行，决定他往后三年。
   也决定灯还亮不亮。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Fade, Toast } = global.G;

  /* 这一班的进度单独存一份：整页刷新也不丢 */
  const LS = 'code_echo_duty_v1';
  const readLS = () => {
    try {
      const a = JSON.parse(localStorage.getItem(LS) || '[]');
      return Array.isArray(a) ? a : [];
    } catch (e) { return []; }
  };
  const writeLS = (a) => {
    try { localStorage.setItem(LS, JSON.stringify(a)); } catch (e) {}
  };

  /* 一行账值多少油 —— 照实不赚，照规矩赚，照他说的最赚 */
  const LEDGER = { truth: 0, rule: 2, theirs: 3, refuse: -2 };
  const FATE_CN = {
    kept: '保住了', stripped: '被折了', voided: '作废', refused: '没办', seat: '让了位',
  };
  const WRITE_CN = {
    truth: '照实写', rule: '照规矩写', theirs: '照他说的写', refuse: '不收这一笔',
  };

  /* ============================================================
     七位
     ============================================================ */
  const GUESTS = [
    /* ---------------- 01 ---------------- */
    {
      id: 'zhao',
      name: '赵德海', meta: '五十六 · 钳工 · 右手只剩两指',
      relic: '一只右手', want: '儿子下学期的学费 · 四千八',
      lines: [
        '我这只手，能值多少？',
        '二十三年前。冲床。',
        '厂里说我自己违规。判了。赔了八百六。',
        '八百六，是那副手套的钱。手套是我自己买的。',
        '儿子今年考上大专。学费四千八。',
        '少三根指头，能少算一点吗。',
      ],
      asks: [
        { q: '厂里当时赔了多少？', r: '八百六。' },
        { q: '那台冲床，后来装护栏了吗？', r: '装了。第二年装的。花了两千四。', ok: true },
        { q: '你儿子知道你手的事吗？', r: '知道。他不说。' },
      ],
      reveal: [
        '两千四。比我的手贵。',
        '……那天我徒弟在机器上。十九岁，刚进厂，手还没长开。',
        '我把他的手推开了。我的没来得及。',
        '厂里问我，是不是自己违规。我说是。',
        '我要说不是，就算工伤，就得全赔。全赔，厂子那年就过不去。',
        '（他把手放在柜台上，掌心朝下。）签字的时候我也没抖。',
      ],
      writes: {
        truth: { line: '押品：右手（残缺）。按工伤全额折算。备注：替徒工挡刀，非本人违规。' },
        rule: { line: '押品：右手（残缺）。按《残缺肢体折价表》第三档计价。' },
        theirs: { line: '押品：右手（残缺）。本人自述违规，责任自负，不予折算。' },
      },
      after: {
        kept: [
          '儿子念完了。第三年他来过一次。',
          '不是来赎手。他说，我来看看它还在不在。',
          '柜台上放着，他摸了很久，没拿走。',
        ],
        stripped: [
          '儿子念了一年，退学去打工。',
          '他后来又来过一次，押了另一样东西。',
          '纸上写着「剩下的那只」。',
        ],
        voided: [
          '记录作废。系统里查不到这个人。',
          '三年后有人来问赵德海，账翻了半天。',
          '柜台说：没有这个人。',
        ],
      },
    },

    /* ---------------- 02 ---------------- */
    {
      id: 'liu',
      name: '刘小燕', meta: '二十三 · 医院护工',
      relic: '睡 眠', want: '母亲一周三次的透析',
      lines: [
        '我押睡觉。',
        '不是不睡。是睡着的那一部分。',
        '三年了。一天四个小时。',
        '四个小时里我还能梦见我在走路。走很远，不累。',
        '透析一次四百二。一周三次。',
      ],
      asks: [
        { q: '一天睡四个小时，够吗？', r: '够。习惯了。' },
        { q: '你母亲现在住哪个科？', r: '……', ok: true },
        { q: '你自己身体查过吗？', r: '没空。' },
      ],
      reveal: [
        '（她愣了很久。）',
        '上个月。上个月就不在了。',
        '（她自己也是一愣，像刚听见这句话。）',
        '我知道。',
        '我知道她走了。我就是还在交钱。',
        '每周一、三、五。我不交，那边就不给我妈排床位。',
        '（她把手缩回袖子里。）排了三年。我不知道停了会怎么样。',
      ],
      writes: {
        truth: { line: '押品：睡眠。备注：委托人母亲已于上月病故，缴费仍在继续。建议停止扣款，退还三个月。' },
        rule: { line: '押品：睡眠（连续三年，日均四小时）。按最深一层折算。' },
        theirs: { line: '押品：睡眠。本人要求：连梦一起。' },
      },
      after: {
        kept: [
          '她第二天没来。三个月后来的，退了三千七。',
          '「我不知道拿这个干什么。」她坐了一下午。',
          '走的时候说了句谢谢。她什么都没押。',
        ],
        stripped: [
          '睡着的那部分被取走了。她还是每天来交钱。',
          '护士说她有时候站在走廊里，站着就睡着了。',
          '眼睛是睁着的。',
        ],
        voided: [
          '她的记录被并进了母亲那一栏。',
          '两个人的名字挤在一格里。',
          '看不出来是两个。',
        ],
      },
    },

    /* ---------------- 03 ---------------- */
    {
      id: 'girl',
      name: '一个穿校服的', meta: '十六（她自己说十七）· 高三',
      relic: '六月七号上午', want: '让家里别再摔东西',
      lines: [
        '我押一场考试。',
        '六月七号上午。语文。',
        '我不想记得那天。',
        '作文题是《我的家》。',
        '我写了八百字。写完还剩二十分钟，我就坐着。',
        '……你能不能不问我叫什么。',
      ],
      asks: [
        { q: '你考得怎么样？', r: '不知道。我没等成绩。' },
        { q: '你家为什么吵？', r: '（她把脸转过去。）' },
        { q: '你那八百字，写了什么？', r: '……', ok: true },
      ],
      reveal: [
        '（她盯着柜台上的木纹。）',
        '我写我家有一扇门。门后面是楼梯。我坐在楼梯上写作业。',
        '因为我房间那面墙在响。隔壁在摔东西。',
        '（她停了一下。）',
        '我骗人的。我家没有楼梯。',
        '我坐在厕所里。坐在马桶盖上，把作文本摊在膝盖上。',
        '写到「我的家很温暖」那句，我听见我妈在哭。',
        '我还是写完了。老师说不能空着。',
      ],
      writes: {
        truth: { line: '押品：六月七日上午。备注：委托人未成年，且押品涉及家暴线索。建议不予办理，转介。' },
        rule: { line: '押品：六月七日上午（语文科）。未成年档，减半计价。' },
        theirs: { line: '押品：六月七日上午。本人要求：连考场一起。' },
      },
      after: {
        kept: [
          '你没办。她在门口站了一会儿，说「那我回去了」。',
          '第二年六月，店门口放了一瓶水。',
          '没留字。',
        ],
        stripped: [
          '她忘了那天，也忘了作文题。',
          '九月她去复读。老师问她去年为什么缺考。',
          '她说：我没有缺考。她真的这么以为。',
        ],
        voided: [
          '她的记录和另外六个未成年人的并在一起。',
          '编成一个号。号还在用。',
          '押品栏统一填「家庭」。',
        ],
      },
    },

    /* ---------------- 04 ---------------- */
    {
      id: 'zhou',
      name: '周敬之', meta: '六十一 · 退休语文教师',
      relic: '一本教案 · 六册', want: '见一个人一面',
      lines: [
        '我押一本教案。',
        '三十年，六册。蓝墨水。',
        '我要见一个人。',
        '他叫李建国。九八年，我劝他退学。',
        '他成绩不好。我说，你读下去也是浪费。',
        '后来听说他在工地上。再后来，听说没了。',
        '……我不是想见他。我是想跟他说句话。',
      ],
      asks: [
        { q: '你为什么劝他退学？', r: '为了升学率。' },
        { q: '你想跟他说什么？', r: '……', ok: true },
        { q: '他现在在哪儿？', r: '（他知道。他不说。）' },
      ],
      reveal: [
        '（他把手按在教案上，按得很平。）',
        '我想说，那年我判断错了。',
        '不是他读不下去。是我不想在他身上花时间。',
        '一个班五十四个人。他一个人占我半节课。',
        '我算过。我算得很清楚。',
        '这句话我准备了二十三年。',
        '我不知道跟谁说。',
      ],
      writes: {
        truth: { line: '押品：教案六册（手写）。备注：所述李建国已于二〇〇三年工亡。建议不予办理，告知实情。' },
        rule: { line: '押品：教案六册。按手写本全价。附：见字如面，一次。' },
        theirs: { line: '押品：教案六册。本人要求代写一封。收件人已故，投递方式另议。' },
      },
      after: {
        kept: [
          '你告诉了他。他坐着，没哭，把教案抱回去。',
          '「那我改天再来。」他没再来过。',
          '第三年有人送来一本书，他自费印的。扉页写着：给李建国，一九九八。',
        ],
        stripped: [
          '他见了。那东西不是李建国，但很像。',
          '他把那句话说了。那东西点了点头。',
          '三天后他在家里走了。教案摊在桌上，翻到九八年那一页。',
        ],
        voided: [
          '信寄出去了。地址是工地。',
          '工地二〇〇三年就拆了。信退回来，盖着「查无此人」。',
          '他把信烧了。灰里能看见「对不起」三个字的一半。',
        ],
      },
    },

    /* ---------------- 05 ---------------- */
    {
      id: 'chen',
      name: '陈 立', meta: '三十四 · 骑手 · 左膝里有响',
      relic: '一条左膝', want: '撤掉一个差评',
      lines: [
        '一个差评。',
        '不是给我的。是给商家的。汤洒了。',
        '客户点的差评，系统算在我头上。',
        '一个差评扣三百。我这一单挣四块二。',
        '我膝盖里有点东西。跑起来会响。',
        '押这个，够不够撤一个？',
      ],
      asks: [
        { q: '汤是怎么洒的？', r: '电梯坏了。我爬了十七楼。' },
        { q: '你有没有申诉过？', r: '……', ok: true },
        { q: '膝盖看过医生吗？', r: '没看。挂号要钱。' },
      ],
      reveal: [
        '申诉过。三次。',
        '第一次说超时。第二次说态度。',
        '第三次系统直接把工单关了，回我三个字：已处理。',
        '（他笑了一下。）',
        '已处理。这三个字，扣我三百。',
        '我那天爬了十七楼。到门口的时候腿在抖，汤没洒。',
        '汤是商家没盖紧。',
      ],
      writes: {
        truth: { line: '押品：左膝。备注：差评系商品问题，责任方为商户。建议撤销差评，退回扣款。' },
        rule: { line: '押品：左膝。按《骑手关节折旧》第二档计价。差评按流程申诉。' },
        theirs: { line: '押品：左膝。本人自愿以押品冲抵，结清。' },
      },
      after: {
        kept: [
          '差评撤了，三百退了。',
          '他又跑了两年。膝盖做了手术，三万八。',
          '手术前一天他来了一趟，说：那三百，我记着。',
        ],
        stripped: [
          '差评没撤。膝盖押了。他还是跑。',
          '第四年有一天他在路口跪下去，起不来。',
          '平台判定：主动放弃订单。',
        ],
        voided: [
          '他的记录标成「已结清」。系统里查不到申诉过。',
          '他后来在另一个平台注册。',
          '用的是他弟弟的身份证。',
        ],
      },
    },

    /* ---------------- 06 ---------------- */
    {
      id: 'woman',
      name: '一个抱襁褓的女人', meta: '年龄不详 · 襁褓是空的',
      relic: '一个还没取的名字', want: '忘掉',
      lines: [
        '……',
        '我押一个名字。',
        '还没取。',
        '在医院的时候我一直在想。想了七个月。',
        '想过很多个。最后一个都没用上。',
        '我押这个。押一个还没取的名字。',
        '能换吗。换我忘掉。',
      ],
      asks: [
        { q: '你想给他取什么名字？', r: '（她摇头。很久。）' },
        { q: '你家里人呢？', r: '在外面。' },
        { q: '他是什么时候走的。', r: '……', ok: true },
      ],
      reveal: [
        '（她把襁褓抱得更紧了一点。）',
        '生下来的时候还有气。',
        '我听见了一声。就一声。',
        '后来护士抱走了。抱走之前我问她，能不能让我知道他叫什么。',
        '她说：你还没取。',
        '（她低头看那个空的襁褓。）',
        '我现在取，还来得及吗。',
      ],
      writes: {
        truth: { line: '押品：无。未取之名不构成押品。建议不予办理，留座。' },
        rule: { line: '押品：未取之名（虚拟）。按虚拟押品计价，记零。' },
        theirs: { line: '押品：未取之名。本人要求：连想一起。' },
      },
      extra: {
        kind: 'refuse',
        line: '（把襁褓推回去）这一笔，不办。',
      },
      after: {
        kept: [
          '你没收。她在柜台前坐了很久，襁褓一直抱着。',
          '走的时候她说：我给他取个名字吧。',
          '然后她说了一个字。很轻。你没听清。',
        ],
        stripped: [
          '她忘了。彻底不记得有过这回事。',
          '第二年她来押了「想要孩子」这个愿望。',
          '换了一笔钱。',
        ],
        voided: [
          '她把名字押了。系统里多了一条没有名字的记录。',
          '编号 037。押品栏：空。状态：在。',
        ],
        refused: [
          '你把她请出去了。门关上的时候，柜台上落了一根线头。',
          '很细。是新的。',
          '你把它放进抽屉。抽屉里已经有三十五根了。',
        ],
      },
    },

    /* ---------------- 07 ---------------- */
    {
      id: 'self',
      name: '最后一位', meta: '没有登记 · 不必登记',
      relic: '剩下这一天', want: '交班',
      lines: [
        '……',
        '不用登记了。我知道流程。',
        '我押的，你收不了。',
        '我押的是剩下这一天。',
        '你写了一整天。七笔。',
        '你知道账是怎么平的吗。',
        '……现在你知道了。',
        '所以——你坐这儿，还是我坐这儿。',
      ],
      asks: [
        { q: '你押了什么？', r: '我不押。押品栏空着，就是我的押品。' },
        { q: '外面还有几个人排队？', r: '没有了。你是最后一个客人。' },
        { q: '你是谁。', r: '……', ok: true },
      ],
      reveal: [
        '（他抬起头。那张脸和你一样，只是旧一些。）',
        '我是你今天早上看见的那一行。',
        '第三十六。',
        '我不是来押东西的。我是来交班的。',
        '十七年。我每天写七笔。',
        '第一年我照实写。第六年我开始照规矩写。',
        '第十年，我就不看他们的脸了。',
        '（他把手放在柜台上。）现在轮到你了。',
      ],
      writes: {
        truth: { line: '押品：无。本日值班人自述，无法办理。建议：关灯。' },
        rule: { line: '押品：一个位置。全价。备注：接替第三十六。' },
        theirs: { line: '押品：无。本人自愿让位。第三十六号，重开。' },
      },
      after: {
        kept: [
          '你关灯了。你们两个一起走出去。',
          '街上天快亮了。他走在前面，一直没回头。',
          '走到路口，他停下来，说了一句什么。你听见了。',
        ],
        stripped: [
          '灯续上了。柜台后面坐着你。',
          '第二天早上门口进来一个人，很年轻，攥着一张纸。',
          '你说：哦——来了啊。别站着，坐。',
        ],
        voided: [
          '他坐下了。你走到门外。',
          '门在你身后合上，很轻。',
          '你手里有一张纸，上面写着今天的日期，和七个名字。',
        ],
      },
      /* 第七位的「照他说的」= 让位，不是作废 */
      seat: true,
    },
  ];

  /* ============================================================
     运行
     ============================================================ */
  const Duty = {
    i: -1,
    stage: 'intro',      // intro | say | ask | write | done
    picks: [],
    cur: null,
    asked: false,
    revealed: false,

    /* ---------- 进入 ---------- */
    async start() {
      State.ch6 = Math.max(State.ch6 || 1, 1);
      State.sys = State.sys || {};
      const d = State.sys.duty = State.sys.duty || {};

      /* 上一班没走完就关掉了 —— 接着来，别让七笔从头再写一遍 */
      const pool = (d.picks && d.picks.length) ? d.picks : readLS();
      let done = (pool || []).filter((p) => p && p.no >= 1 && p.no <= GUESTS.length);
      /* 上一班已经打烊了：再进来就是新的一班 */
      if (done.length >= GUESTS.length) { done = []; d.picks = []; }
      this.picks = done.slice();
      this.i = done.length - 1;
      this.stage = 'intro';
      this.cur = null;

      const wrap = $('#dt-wrap');
      wrap.dataset.stage = 'intro';
      $('#dt-name').textContent = '—';
      $('#dt-meta').textContent = '';
      $('#dt-no').textContent = '';
      $('#dt-relic').textContent = '';
      $('#dt-say').innerHTML = '';
      $('#dt-acts').innerHTML = '';
      $('#dt-sum').classList.remove('on');
      $('#dt-ledger-n').textContent = '0';

      this.ledgerView();

      /* 开场：柜台上那张纸 */
      await wait(600);
      this.showNote();
    },

    /* 开场那张纸 */
    showNote() {
      const say = $('#dt-say');
      const n = this.picks.length;
      const left = GUESTS.length - n;
      if (n > 0) {
        const book = this.picks.reduce((a, p) => a + (p.gain || 0), 0);
        say.innerHTML =
          '<div class="dt-note">' +
          '<div class="dt-note-t">今 日 当 班 · 续</div>' +
          '<div class="dt-note-b">前面 ' + n + ' 位办完了。<br>' +
          '还剩 ' + left + ' 位。账上 ' + (book >= 0 ? '+' : '') + book + '。<br><br>' +
          '椅子还是温的。<br>你刚才出去了多久，没人问。</div>' +
          '<div class="dt-note-s">—— 纸旁边多了一道折痕。</div>' +
          '</div>';
      } else {
        say.innerHTML =
          '<div class="dt-note">' +
          '<div class="dt-note-t">今 日 当 班</div>' +
          '<div class="dt-note-b">七位。<br>灯油只够到打烊。<br><br>' +
          '每位三件事：问一句，写一行。<br>写下的那一行，决定他往后三年。<br>' +
          '账不进，灯不续。</div>' +
          '<div class="dt-note-s">—— 字迹是新的。墨还没干。</div>' +
          '</div>';
      }
      const acts = $('#dt-acts');
      acts.innerHTML = '<button class="dt-btn dt-btn-go" data-go="1">' +
        (n > 0 ? '坐 回 去' : '坐 下') + '</button>';
      acts.querySelector('[data-go]').onclick = () => {
        Snd.click();
        this.next();
      };
      $('#dt-wrap').dataset.stage = 'note';
      this.ledgerView();
    },

    /* ---------- 下一位 ---------- */
    async next() {
      this.i++;
      if (this.i >= GUESTS.length) { this.close(); return; }
      const g = GUESTS[this.i];
      this.cur = g;
      this.stage = 'say';
      this.asked = false;
      this.revealed = false;

      const wrap = $('#dt-wrap');
      wrap.dataset.stage = 'say';
      wrap.dataset.n = String(this.i + 1);

      $('#dt-no').textContent = '第 ' + String(this.i + 1).padStart(2, '0') + ' 位';
      $('#dt-name').textContent = g.name;
      $('#dt-meta').textContent = g.meta;
      $('#dt-relic').innerHTML =
        '<span class="dt-rl-k">押 品</span><span class="dt-rl-v">' + g.relic + '</span>' +
        '<span class="dt-rl-k">换</span><span class="dt-rl-v">' + g.want + '</span>';

      const say = $('#dt-say');
      say.innerHTML = '';
      const acts = $('#dt-acts');
      acts.innerHTML = '';

      /* 逐行渐入 —— 一次全部铺开，节奏靠延迟 */
      g.lines.forEach((t, k) => {
        const p = document.createElement('p');
        p.className = 'dt-l';
        p.textContent = t;
        p.style.animationDelay = (k * 0.34) + 's';
        say.appendChild(p);
      });

      await wait(g.lines.length * 340 + 500);
      if (this.cur !== g) return;
      this.askPhase();
    },

    /* ---------- 问话 ---------- */
    askPhase() {
      this.stage = 'ask';
      $('#dt-wrap').dataset.stage = 'ask';
      const g = this.cur;
      const acts = $('#dt-acts');
      acts.innerHTML =
        '<div class="dt-ask-h">问 一 句</div>' +
        '<div class="dt-opts">' +
        g.asks.map((a, k) =>
          '<button class="dt-opt" data-ask="' + k + '">' + a.q + '</button>'
        ).join('') +
        '</div>';
      acts.querySelectorAll('[data-ask]').forEach((b) => {
        b.onclick = () => this.ask(+b.dataset.ask);
      });
    },

    async ask(k) {
      if (this.stage !== 'ask') return;
      const g = this.cur;
      const a = g.asks[k];
      Snd.click();
      const say = $('#dt-say');
      const p = document.createElement('p');
      p.className = 'dt-l dt-q';
      p.textContent = '「' + a.q + '」';
      say.appendChild(p);
      await wait(420);

      const r = document.createElement('p');
      r.className = 'dt-l dt-r' + (a.ok ? '' : ' dt-flat');
      r.textContent = a.r;
      say.appendChild(r);

      if (a.ok) {
        this.revealed = true;
        await wait(760);
        for (const t of g.reveal) {
          const q = document.createElement('p');
          q.className = 'dt-l dt-rv';
          q.textContent = t;
          say.appendChild(q);
          await wait(300);
        }
        await wait(400);
        say.scrollTop = say.scrollHeight;
      } else {
        await wait(600);
      }
      say.scrollTop = say.scrollHeight;
      this.writePhase();
    },

    /* ---------- 写一行 ---------- */
    writePhase() {
      this.stage = 'write';
      $('#dt-wrap').dataset.stage = 'write';
      const g = this.cur;
      const acts = $('#dt-acts');
      const kinds = ['truth', 'rule', 'theirs'];
      acts.innerHTML =
        '<div class="dt-ask-h">记 一 行' +
        (this.revealed ? '' : '<i class="dt-ask-warn">（你没问到点子上。你只能照他说的写。）</i>') +
        '</div>' +
        '<div class="dt-opts dt-opts-w">' +
        kinds.map((k) => {
          const w = g.writes[k];
          const dis = (!this.revealed && k !== 'theirs') ? ' disabled' : '';
          return '<button class="dt-opt dt-w dt-w-' + k + '" data-w="' + k + '"' + dis + '>' +
            '<b>' + WRITE_CN[k] + '</b><i>' + w.line + '</i></button>';
        }).join('') +
        (g.extra ? '<button class="dt-opt dt-w dt-w-refuse" data-w="refuse">' +
          '<b>' + WRITE_CN.refuse + '</b><i>' + g.extra.line + '</i></button>' : '') +
        '</div>' +
        '<div class="dt-lg-hint">照实写不记油。照规矩写记两格。照他说的写记三格。</div>';

      acts.querySelectorAll('[data-w]').forEach((b) => {
        b.onclick = () => this.write(b.dataset.w);
      });
      const box = $('#dt-say');
      box.scrollTop = box.scrollHeight;
    },

    async write(kind) {
      if (this.stage !== 'write') return;
      const g = this.cur;
      this.stage = 'stamp';
      Snd.tone(kind === 'truth' ? 320 : (kind === 'refuse' ? 180 : 240), 0.5, {
        type: 'sine', gain: 0.05, attack: 0.02,
      });

      const fate = g.seat && kind === 'theirs' ? 'seat'
        : (kind === 'truth' ? 'kept' : (kind === 'rule' ? 'stripped'
          : (kind === 'refuse' ? 'refused' : 'voided')));

      this.picks.push({
        no: this.i + 1, id: g.id, name: g.name, relic: g.relic,
        kind: kind, fate: fate, gain: LEDGER[kind] || 0,
      });
      /* 落盘：中途关掉也不丢这一班 */
      const dd = State.sys.duty = State.sys.duty || {};
      dd.picks = this.picks.slice();
      dd.partial = this.picks.length;
      writeLS(this.picks);

      /* 盖戳 */
      const acts = $('#dt-acts');
      acts.innerHTML = '<div class="dt-stamp dt-stamp-' + fate + '">' +
        '<div class="dt-stamp-k">' + WRITE_CN[kind] + '</div>' +
        '<div class="dt-stamp-v">' + FATE_CN[fate] + '</div></div>';
      const say = $('#dt-say');
      const p = document.createElement('p');
      p.className = 'dt-l dt-line';
      p.textContent = '（你在那一行后面签了字。）';
      say.appendChild(p);
      say.scrollTop = say.scrollHeight;

      this.ledgerView();

      if (fate === 'seat') {
        await wait(1400);
        this.seatEnd();
        return;
      }

      await wait(1500);
      const last = this.i === GUESTS.length - 1;
      acts.innerHTML = '<button class="dt-btn dt-btn-go" data-go="1">' +
        (last ? '打 烊' : '下 一 位') + '</button>';
      acts.querySelector('[data-go]').onclick = () => { Snd.click(); this.next(); };
    },

    /* ---------- 账面 ---------- */
    ledgerView() {
      const n = this.picks.reduce((a, p) => a + p.gain, 0);
      const el = $('#dt-ledger-n');
      if (el) el.textContent = String(n);
      const bar = $('#dt-ledger-bar');
      if (bar) bar.style.width = Math.max(0, Math.min(100, (n / 7) * 100)) + '%';
      const lamp = $('#dt-lamp');
      if (lamp) lamp.dataset.lvl = n >= 7 ? 'good' : (n >= 4 ? 'dim' : 'low');
    },

    /* ---------- 让位 ---------- */
    async seatEnd() {
      State.sys.duty = State.sys.duty || {};
      State.sys.duty.seat = true;
      State.sys.duty.picks = this.picks;
      writeLS([]);
      const say = $('#dt-say');
      say.innerHTML = '';
      const lines = [
        '（他站起来，绕过柜台，坐下。）',
        '坐下的时候他先看了一眼灯。',
        '「油还有一格。」他说，「够到天亮。」',
        '（你走到门口。）',
        '门在你身后合上。很轻。',
        '',
        '手里有一张纸。上面写着今天的日期，',
        '和七个名字。',
      ];
      for (const t of lines) {
        const p = document.createElement('p');
        p.className = 'dt-l';
        p.textContent = t;
        say.appendChild(p);
        await wait(560);
      }
      $('#dt-acts').innerHTML = '<button class="dt-btn dt-btn-go" data-go="1">走出门</button>';
      $('#dt-acts').querySelector('[data-go]').onclick = () => {
        Snd.click();
        this.toFinal();
      };
    },

    /* ---------- 打烊 ---------- */
    async close() {
      this.stage = 'done';
      State.ch6 = 3;
      const total = this.picks.reduce((a, p) => a + p.gain, 0);
      const lamp = total >= 7;

      const d = State.sys.duty = State.sys.duty || {};
      d.picks = this.picks;
      d.total = total;
      d.lamp = lamp;
      d.truth = this.picks.filter((p) => p.kind === 'truth').length;
      d.rule = this.picks.filter((p) => p.kind === 'rule').length;
      d.theirs = this.picks.filter((p) => p.kind === 'theirs').length;
      d.refused = this.picks.filter((p) => p.kind === 'refuse').length;
      d.kept = this.picks.filter((p) => p.fate === 'kept').length;
      d.partial = 0;
      writeLS([]);
      d.voided = this.picks.filter((p) => p.fate === 'voided').length;

      $('#dt-wrap').dataset.stage = 'sum';
      const sum = $('#dt-sum');
      sum.classList.add('on');
      sum.innerHTML =
        '<div class="dt-sum-in">' +
        '<div class="dt-sum-h">打 烊</div>' +
        '<div class="dt-sum-sub">今日七笔 · 账 ' + (total >= 0 ? '+' : '') + total + '</div>' +
        '<div class="dt-sum-list">' +
        this.picks.map((p) =>
          '<div class="dt-sum-row" data-row="' + p.id + '">' +
          '<span class="dt-sr-no">' + String(p.no).padStart(2, '0') + '</span>' +
          '<span class="dt-sr-name">' + p.name + '</span>' +
          '<span class="dt-sr-relic">' + p.relic + '</span>' +
          '<span class="dt-sr-w">' + WRITE_CN[p.kind] + '</span>' +
          '<span class="dt-sr-f dt-f-' + p.fate + '">' + FATE_CN[p.fate] + '</span>' +
          '</div>' +
          '<div class="dt-sum-after" data-after="' + p.id + '">' +
          (GUESTS.find((g) => g.id === p.id).after[p.fate] || []).join('<br>') +
          '</div>'
        ).join('') +
        '</div>' +
        '<div class="dt-sum-lamp">' + (lamp
          ? '账平了。灯续上了一格。'
          : '账不平。灯芯短了一截。') + '</div>' +
        '<div class="dt-sum-tail">' + (lamp
          ? '你把手放在灯罩上，是热的。<br>外面开始有人扫地。'
          : '你去拧灯芯，拧不动。<br>柜台上的纸被风吹起来一张，又落回去。') + '</div>' +
        '<button class="dt-btn dt-btn-go dt-sum-go" id="dt-sum-go">熄 灯</button>' +
        '</div>';

      sum.querySelectorAll('.dt-sum-row').forEach((r) => {
        r.onclick = () => {
          const a = sum.querySelector('[data-after="' + r.dataset.row + '"]');
          if (a) a.classList.toggle('on');
        };
      });
      $('#dt-sum-go').onclick = () => {
        Snd.tone(96, 2.4, { type: 'sine', gain: 0.06, attack: 1.2 });
        this.toFinal();
      };
      Toast.show('七位都走了。', 2200);
    },

    /* ---------- 进终章 ---------- */
    toFinal() {
      Fade.through(() => {
        if (global.Final) {
          global.App.show('final');
          global.Final.start();
        } else if (global.End && global.End.show) {
          global.End.show();
        }
      });
    },

    /* 供自检与档案册使用 */
    data() { return GUESTS; },
    total() { return GUESTS.length; },
  };

  global.Duty = Duty;
  global.DUTY_GUESTS = GUESTS;
})(window);
