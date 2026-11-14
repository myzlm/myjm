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

  /* ------------------------------------------------------------
     账 与 油
     ------------------------------------------------------------
     账面上的「账」是从客人身上折出来的东西，越多，灯越亮。
     「油」是你自己的那一份：一天就这么多，用一格少一格。

     照实写，保住他，但两格油从你身上出。
     照规矩写，折他一半，油也出一格。
     照他说的写，他一笔不算，你一格不烧。
     不收这一笔，你陪他耗掉三格，账上还倒扣。

     所以：把七个人都保住，需要十四格油。你只有八格。
     这不是算术题，这是一个必须有人受损的局。
     ------------------------------------------------------------ */
  const OIL = 9;

  const LEDGER = {
    truth:  { cost: 2, gain: 0,  name: '照实写',
              why: '两格油从你身上出。' },
    rule:   { cost: 1, gain: 2,  name: '照规矩写',
              why: '一格油。折他一半，账上进两格。' },
    theirs: { cost: 0, gain: 3,  name: '照他说的写',
              why: '不烧油。他一笔不算，账上进三格。' },
    refuse: { cost: 3, gain: -2, name: '不收这一笔',
              why: '三格油。你陪他耗着，账上倒扣两格。' },
  };
  const FATE_CN = {
    kept: '保住了', stripped: '被折了', voided: '作废', refused: '没办',
    seat: '让了位', paid: '抵了',
  };
  const WRITE_CN = {
    truth: '照实写', rule: '照规矩写', theirs: '照他说的写', refuse: '不收这一笔',
    selfpay: '拿自己的东西抵',
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
      peekSay: [
        '（你伸手去掀他按着的那张纸。）',
        '他没拦。他只是把手挪开，掌心朝上，放在旁边。',
        '纸是那张八百六的收据。背面有一行铅笔字：「徒工：王，十九。」',
        '（他把收据按回去。）「你看吧。我没什么可藏的。」',
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
      peekSay: [
        '（你把她包上那沓单子抽出来。）',
        '最上面一张是上个月的。姓名栏写着「刘秀兰」，后面盖了一个方章。',
        '死亡登记。日期在缴费日期之前。',
        '（她伸手想按，没按住。）',
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
      peekSay: [
        '（她书包侧袋里有一张折成小方块的作文纸。）',
        '展开只有两百多字。八百个格子，剩下的都空着。',
        '最后一行：「老师对不起，我编不下去了。」',
        '（她一把抢回去，又慢慢放回柜台上。）',
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
      peekSay: [
        '（教案最后一页夹着一张成绩单。）',
        '五十四个人。最后一名的名字被圈了两圈，旁边写着「已劝退」。',
        '再旁边用更细的笔写：「一九九八·三·十七」。',
        '（他把成绩单抽走，折好，放回口袋。）',
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
      peekSay: [
        '（他的手机扣在柜台上，屏幕还亮着。）',
        '申诉记录四条。最后一条：「已处理」。',
        '再往下是一条他发给自己的备忘：「汤洒了一半。我说没洒。」',
        '（他把手机翻过去，屏幕朝下。）',
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
      peekSay: [
        '（襁褓里没有孩子。只有一件叠好的小上衣。）',
        '标签还在，写着「0—3 个月」。',
        '（她把衣服按回去，按了很久。）',
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
      /* 第三条路：不动油，拿你自己身上的一件东西抵 */
      extra2: {
        kind: 'selfpay',
        line: '柜台下面的抽屉里，有你从里间拿出来的东西。拿一件压在纸上。',
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
        paid: [
          '名字留下了。她也留下了——只是忘了一半。',
          '她抱着空襁褓走出去，走到门口回头问：我是不是忘了什么。',
          '你说没有。',
          '你少了一件东西。想不起来是哪一件了。',
          '抽屉里那格是空的。空得很整齐，像被人擦过。',
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
      peekSay: [
        '（你伸手过去。他没有让。）',
        '你的手穿过去了。像伸进一盆凉水。',
        '（他说：「你看，我这儿是空的。」）',
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
    stage: 'intro',      // intro | say | ask | peek | write | review | done
    picks: [],
    cur: null,
    revealed: false,
    oil: OIL,
    book: 0,
    peekCount: 0,
    rewrote: false,

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
      this.revealed = false;

      this.oil = OIL - done.reduce((a, p) => a + (p.cost || 0), 0);
      this.book = done.reduce((a, p) => a + (p.gain || 0), 0);
      this.peekCount = d.peek || 0;
      this.rewrote = !!d.rewrote;

      const wrap = $('#dt-wrap');
      wrap.dataset.stage = 'intro';
      $('#dt-name').textContent = '—';
      $('#dt-meta').textContent = '';
      $('#dt-no').textContent = '';
      $('#dt-relic').textContent = '';
      $('#dt-say').innerHTML = '';
      $('#dt-acts').innerHTML = '';
      $('#dt-sum').classList.remove('on');

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
        say.innerHTML =
          '<div class="dt-note">' +
          '<div class="dt-note-t">今 日 当 班 · 续</div>' +
          '<div class="dt-note-b">前面 ' + n + ' 位办完了。<br>' +
          '还剩 ' + left + ' 位。你手上还有 ' + this.oil + ' 格油，账上 ' +
          (this.book >= 0 ? '+' : '') + this.book + '。<br><br>' +
          '椅子还是温的。<br>你刚才出去了多久，没人问。</div>' +
          '<div class="dt-note-s">—— 纸旁边多了一道折痕。</div>' +
          '</div>';
      } else {
        say.innerHTML =
          '<div class="dt-note">' +
          '<div class="dt-note-t">今 日 当 班</div>' +
          '<div class="dt-note-b">七位。油是<b>你自己的</b>，一共 ' + OIL + ' 格。<br><br>' +
          '照实写——他保住，两格油从你身上出。<br>' +
          '照规矩写——折他一半，一格。<br>' +
          '照他说的写——他一笔不算，你一格不烧。<br>' +
          '不收这一笔——你陪他耗三格，账上还倒扣。<br><br>' +
          '七个人全保住，要十四格。<br>' +
          '你只有 ' + OIL + ' 格。</div>' +
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

      /* 第七位会先看一眼灯 —— 你手上的油，他比你还清楚 */
      let lines = g.lines;
      if (this.i === GUESTS.length - 1) {
        const eye = this.oil <= 0
          ? '（他进来的时候先看了一眼灯。灯芯是黑的。他没说什么。）'
          : (this.oil >= 5
            ? '（他进来的时候先看了一眼灯。灯很亮。他皱了皱眉。）'
            : '（他进来的时候先看了一眼灯。灯在闪。）');
        lines = [eye].concat(g.lines);
      }

      /* 逐行渐入 —— 一次全部铺开，节奏靠延迟 */
      lines.forEach((t, k) => {
        const p = document.createElement('p');
        p.className = 'dt-l';
        p.textContent = t;
        p.style.animationDelay = (k * 0.34) + 's';
        say.appendChild(p);
      });

      await wait(lines.length * 340 + 500);
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
        '</div>' +
        '<div class="dt-ask-h dt-ask-h2">或 者</div>' +
        '<button class="dt-opt dt-peek" data-peek="1">' +
        '<b>掀 开 他 的 手<i class="dt-peek-c">−1 格油</i></b>' +
        '<i>他会让你看。你会知道他不想说的那些。你自己的油少一格。</i>' +
        '</button>';
      acts.querySelectorAll('[data-ask]').forEach((b) => {
        b.onclick = () => this.ask(+b.dataset.ask);
      });
      const pk = acts.querySelector('[data-peek]');
      if (pk) pk.onclick = () => this.peek();
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
      } else {
        await wait(600);
      }
      say.scrollTop = say.scrollHeight;
      this.writePhase();
    },

    /* ---------- 掀开他的手（偷看） ---------- */
    async peek() {
      if (this.stage !== 'ask') return;
      const g = this.cur;
      this.stage = 'peek';
      const acts = $('#dt-acts');
      acts.innerHTML = '';
      Snd.tone(132, 0.8, { type: 'sine', gain: 0.045, attack: 0.06 });

      this.oil = Math.max(0, this.oil - 1);
      this.peekCount++;
      const dd = State.sys.duty = State.sys.duty || {};
      dd.peek = this.peekCount;
      this.ledgerView();

      const say = $('#dt-say');
      const head = document.createElement('p');
      head.className = 'dt-l dt-line';
      head.textContent = '（你自己的一格油，没了。）';
      say.appendChild(head);
      await wait(560);

      for (const t of (g.peekSay || [])) {
        const p = document.createElement('p');
        p.className = 'dt-l dt-rv dt-peek-l';
        p.textContent = t;
        say.appendChild(p);
        await wait(340);
      }
      await wait(360);
      say.scrollTop = say.scrollHeight;
      this.revealed = true;
      this.writePhase();
    },

    /* ---------- 写一行 ---------- */
    writePhase() {
      this.stage = 'write';
      $('#dt-wrap').dataset.stage = 'write';
      const g = this.cur;
      const acts = $('#dt-acts');
      const kinds = ['truth', 'rule', 'theirs'];
      const oilNow = this.oil;

      const btn = (k) => {
        const w = g.writes[k];
        const L = LEDGER[k];
        const poor = oilNow < L.cost;
        const dis = ((!this.revealed && k !== 'theirs') || poor);
        const tag = poor ? '油不够' : (L.cost === 0 ? '不 烧 油' : ('−' + L.cost + ' 格'));
        return '<button class="dt-opt dt-w dt-w-' + k + '" data-w="' + k + '"' +
          (dis ? ' disabled' : '') + '>' +
          '<b>' + WRITE_CN[k] + '<em class="dt-w-cost' + (poor ? ' poor' : '') + '">' +
          tag + '</em></b><i>' + w.line + '</i></button>';
      };

      acts.innerHTML =
        '<div class="dt-ask-h">记 一 行' +
        (this.revealed ? '' : '<i class="dt-ask-warn">（你没问到点子上。你只能照他说的写。）</i>') +
        '</div>' +
        '<div class="dt-oil-line">你手上 <b>' + oilNow + '</b> 格' +
        (oilNow <= 1 ? '　灯芯发黑了，只剩下照他说的写这一条路。'
          : (oilNow <= 3 ? '　剩下的够救一个人。'
            : (oilNow <= 5 ? '　剩下的够救两个人。' : '　剩下的够救三个人。'))) +
        '</div>' +
        '<div class="dt-opts dt-opts-w">' +
        kinds.map(btn).join('') +
        (g.extra ? '<button class="dt-opt dt-w dt-w-refuse" data-w="refuse"' +
          (oilNow < LEDGER.refuse.cost ? ' disabled' : '') + '>' +
          '<b>' + WRITE_CN.refuse + '<em class="dt-w-cost' +
          (oilNow < LEDGER.refuse.cost ? ' poor' : '') + '">' +
          (oilNow < LEDGER.refuse.cost ? '油不够' : '−' + LEDGER.refuse.cost + ' 格') +
          '</em></b><i>' + g.extra.line + '</i></button>' : '') +
        (g.extra2 ? (function () {
          const has = !!(global.Memory && global.Memory.stats().relics > 0);
          return '<button class="dt-opt dt-w dt-w-selfpay" data-w="selfpay"' +
            (has ? '' : ' disabled') + '>' +
            '<b>' + WRITE_CN.selfpay + '<em class="dt-w-cost' + (has ? '' : ' poor') +
            '">' + (has ? '不 动 油' : '身 上 没 有') + '</em></b>' +
            '<i>' + g.extra2.line + '</i></button>';
        })() : '') +
        '</div>';

      acts.querySelectorAll('[data-w]').forEach((b) => {
        b.onclick = () => this.write(b.dataset.w);
      });
      const box = $('#dt-say');
      box.scrollTop = box.scrollHeight;
    },

    async write(kind) {
      if (this.stage !== 'write') return;
      const g = this.cur;
      const L = LEDGER[kind] || { cost: 0, gain: 1 };
      if (this.oil < L.cost) return;

      /* 拿自己的东西抵：真的从存档里拿掉一件 */
      let spent = null;
      if (kind === 'selfpay') {
        spent = global.Memory && global.Memory.spend();
        if (!spent) return;
      }

      this.stage = 'stamp';
      Snd.tone(kind === 'truth' ? 320 : (kind === 'refuse' ? 180 : 240), 0.5, {
        type: 'sine', gain: 0.05, attack: 0.02,
      });

      const fate = g.seat && kind === 'theirs' ? 'seat'
        : (kind === 'truth' ? 'kept' : (kind === 'rule' ? 'stripped'
          : (kind === 'refuse' ? 'refused'
            : (kind === 'selfpay' ? 'paid' : 'voided'))));

      this.oil -= L.cost;
      this.book += L.gain;

      this.picks.push({
        no: this.i + 1, id: g.id, name: g.name, relic: g.relic,
        kind: kind, fate: fate, gain: L.gain, cost: L.cost,
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
      p.className = 'dt-l dt-line' + (kind === 'selfpay' ? ' dt-dark' : '');
      p.textContent = spent
        ? '（你把「' + spent.relic + '」压在那张纸下面。那是' + spent.name + '的东西。）'
        : '（你在那一行后面签了字。）';
      say.appendChild(p);

      if (this.oil <= 0) {
        const q = document.createElement('p');
        q.className = 'dt-l dt-line dt-dark';
        q.textContent = '（灯芯短了一截。你再没有什么可以拿出来的了。）';
        say.appendChild(q);
      } else if (this.oil <= 2) {
        const q = document.createElement('p');
        q.className = 'dt-l dt-line';
        q.textContent = '（灯芯开始发黑。剩下的油，你自己算。）';
        say.appendChild(q);
      }
      say.scrollTop = say.scrollHeight;

      this.ledgerView();

      if (fate === 'seat') {
        await wait(1400);
        this.seatEnd();
        return;
      }

      await wait(1500);

      /* 第六位写完、第七位还没进来 —— 中间这一小段，留给你反悔一次 */
      if (this.i === GUESTS.length - 2 && !this.rewrote) {
        this.reviewPhase();
        return;
      }

      const last = this.i === GUESTS.length - 1;
      acts.innerHTML = '<button class="dt-btn dt-btn-go" data-go="1">' +
        (last ? '打 烊' : '下 一 位') + '</button>';
      acts.querySelector('[data-go]').onclick = () => { Snd.click(); this.next(); };
    },

    /* ---------- 划掉一行（只一次） ---------- */
    async reviewPhase() {
      this.stage = 'review';
      $('#dt-wrap').dataset.stage = 'review';
      /* 第七位还没进来 —— 把上一位的名字从柜台上撤掉 */
      $('#dt-no').textContent = '门 外';
      $('#dt-name').textContent = '第七位';
      $('#dt-meta').textContent = '还没进来';
      $('#dt-relic').innerHTML = '';
      const say = $('#dt-say');
      say.innerHTML = '';
      const lines = [
        '（门外有脚步声。停了一下，又走了。）',
        '（还没进来。）',
        '（你手上还有 ' + this.oil + ' 格油。）',
        '（这一页可以划掉一行，重写。）',
        '（只这一次。划掉的，会留印子。）',
      ];
      for (const t of lines) {
        const p = document.createElement('p');
        p.className = 'dt-l';
        p.textContent = t;
        say.appendChild(p);
        await wait(520);
      }
      say.scrollTop = say.scrollHeight;
      this.reviewList();
    },

    reviewList() {
      const acts = $('#dt-acts');
      acts.innerHTML =
        '<div class="dt-ask-h">划 掉 一 行</div>' +
        '<div class="dt-opts dt-opts-r">' +
        this.picks.map((p, k) =>
          '<button class="dt-opt dt-rw" data-rw="' + k + '">' +
          '<b>' + String(p.no).padStart(2, '0') + '　' + p.name + '</b>' +
          '<i>' + WRITE_CN[p.kind] + '　·　' + FATE_CN[p.fate] +
          '　·　' + (p.cost ? '−' + p.cost + ' 格' : '不烧油') + '</i></button>'
        ).join('') +
        '<button class="dt-opt dt-w dt-w-skip" data-rw="skip">' +
        '<b>不 划 了</b><i>就这样交上去。手印已经按过，改不改都是今天。</i></button>' +
        '</div>';

      acts.querySelectorAll('[data-rw]').forEach((b) => {
        b.onclick = () => {
          Snd.click();
          if (b.dataset.rw === 'skip') {
            this.rewrote = true;
            State.sys.duty.rewrote = false;
            this.next();
          } else {
            this.reviewPick(+b.dataset.rw);
          }
        };
      });
    },

    reviewPick(k) {
      const p = this.picks[k];
      const g = GUESTS.find((x) => x.id === p.id);
      const kinds = ['truth', 'rule', 'theirs'].filter((x) => x !== p.kind);
      const acts = $('#dt-acts');

      acts.innerHTML =
        '<div class="dt-ask-h">把第 ' + String(p.no).padStart(2, '0') + ' 行，改成</div>' +
        '<div class="dt-opts dt-opts-w">' +
        kinds.map((x) => {
          const L = LEDGER[x];
          const diff = L.cost - (p.cost || 0);
          const poor = this.oil - diff < 0;
          return '<button class="dt-opt dt-w dt-w-' + x + '" data-rk="' + x + '"' +
            (poor ? ' disabled' : '') + '>' +
            '<b>' + WRITE_CN[x] + '<em class="dt-w-cost' + (poor ? ' poor' : '') + '">' +
            (poor ? '油不够' : (diff === 0 ? '不额外烧油' : ('−' + diff + ' 格'))) +
            '</em></b><i>' + g.writes[x].line + '</i></button>';
        }).join('') +
        '<button class="dt-opt dt-w dt-w-skip" data-rk="back">' +
        '<b>算 了</b><i>退回去，挑别的行。</i></button>' +
        '</div>' +
        '<div class="dt-lg-hint">改判不收回已经说出口的话。他记得原来的那一版。</div>';

      acts.querySelectorAll('[data-rk]').forEach((b) => {
        b.onclick = () => {
          Snd.click();
          if (b.dataset.rk === 'back') this.reviewList();
          else this.applyRewrite(k, b.dataset.rk);
        };
      });
    },

    async applyRewrite(k, kind) {
      const p = this.picks[k];
      const g = GUESTS.find((x) => x.id === p.id);
      const L = LEDGER[kind];
      const diff = L.cost - (p.cost || 0);
      if (this.oil - diff < 0) return;

      const oldKind = p.kind;
      this.oil -= diff;
      p.oldKind = oldKind;
      p.kind = kind;
      p.cost = L.cost;
      p.gain = L.gain;
      p.fate = g.seat && kind === 'theirs' ? 'seat'
        : (kind === 'truth' ? 'kept' : (kind === 'rule' ? 'stripped' : 'voided'));
      p.rewritten = true;
      this.rewrote = true;

      const dd = State.sys.duty = State.sys.duty || {};
      dd.rewrote = true;
      dd.picks = this.picks.slice();
      writeLS(this.picks);
      this.ledgerView();

      const say = $('#dt-say');
      const p1 = document.createElement('p');
      p1.className = 'dt-l dt-line dt-dark';
      p1.textContent = '（你把第 ' + String(p.no).padStart(2, '0') + ' 行划掉了。' +
        '一条横线，从「' + WRITE_CN[oldKind] + '」划到「' + WRITE_CN[kind] + '」。）';
      say.appendChild(p1);
      await wait(700);
      const p2 = document.createElement('p');
      p2.className = 'dt-l dt-rv';
      p2.textContent = '（划得不太直。纸上起了一点毛。）';
      say.appendChild(p2);
      say.scrollTop = say.scrollHeight;
      await wait(1100);
      this.next();
    },

    /* ---------- 账面 ---------- */
    ledgerView() {
      const el = $('#dt-ledger-n');
      if (el) el.textContent = String(this.oil);
      const bk = $('#dt-book-n');
      if (bk) bk.textContent = (this.book >= 0 ? '+' : '') + this.book;
      const bar = $('#dt-ledger-bar');
      if (bar) bar.style.width = Math.max(0, Math.min(100, (this.oil / OIL) * 100)) + '%';
      const lamp = $('#dt-lamp');
      if (lamp) lamp.dataset.lvl = this.oil >= 5 ? 'good' : (this.oil >= 2 ? 'dim' : 'low');
      const led = $('#dt-ledger');
      if (led) led.dataset.low = this.oil <= 2 ? '1' : '0';
    },

    /* ---------- 让位 ---------- */
    async seatEnd() {
      State.sys.duty = State.sys.duty || {};
      State.sys.duty.seat = true;
      State.sys.duty.picks = this.picks;
      State.sys.duty.oil = this.oil;
      State.sys.duty.book = this.book;
      writeLS([]);
      const say = $('#dt-say');
      say.innerHTML = '';
      const lines = [
        '（他站起来，绕过柜台，坐下。）',
        '坐下的时候他先看了一眼灯。',
        '「油还有 ' + this.oil + ' 格。」他说，「够到天亮。」',
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
      /* 从明细重算一遍：中途续接、外部注入都不会算错 */
      const total = this.picks.reduce((a, p) => a + (p.gain || 0), 0);
      const lamp = this.oil > 0;

      const d = State.sys.duty = State.sys.duty || {};
      d.picks = this.picks;
      d.total = total;
      d.book = total;
      d.oil = this.oil;
      d.lamp = lamp;
      d.truth = this.picks.filter((p) => p.kind === 'truth').length;
      d.rule = this.picks.filter((p) => p.kind === 'rule').length;
      d.theirs = this.picks.filter((p) => p.kind === 'theirs').length;
      d.refused = this.picks.filter((p) => p.kind === 'refuse').length;
      d.kept = this.picks.filter((p) => p.fate === 'kept').length;
      d.hurt = this.picks.filter((p) => p.fate === 'stripped').length;
      d.voided = this.picks.filter((p) => p.fate === 'voided').length;
      d.paid = this.picks.filter((p) => p.fate === 'paid').length;
      d.peek = this.peekCount;
      d.rewrote = this.rewrote && this.picks.some((p) => p.rewritten);
      d.partial = 0;
      writeLS([]);

      const kept = d.kept, hurt = d.hurt, voided = d.voided, refused = d.refused;
      const judge = lamp
        ? (kept >= 4 ? '灯亮着。四个人还站着，三个人的名字你没记住。'
          : (kept >= 2 ? '灯亮着。今晚你救的人，一只手数得过来。'
            : '灯亮着。这一晚的账很干净，干净得像没人来过。'))
        : (voided === 0 ? '灯灭在你收摊之前。七个人都还在纸上，一个也没被划掉。'
          : (kept >= 3 ? '灯灭在你收摊之前。你救了人，代价是明天这里没有灯。'
            : '灯灭了。你把油都用在了该用的地方，或者用在了不该用的地方。'));

      $('#dt-wrap').dataset.stage = 'sum';
      const sum = $('#dt-sum');
      sum.classList.add('on');
      sum.innerHTML =
        '<div class="dt-sum-in">' +
        '<div class="dt-sum-h">打 烊</div>' +
        '<div class="dt-sum-sub">今日七笔 · 账 ' + (total >= 0 ? '+' : '') + total +
        ' · 油剩 ' + this.oil + ' 格</div>' +
        '<div class="dt-sum-list">' +
        this.picks.map((p) => {
          const g = GUESTS.find((x) => x.id === p.id);
          const aft = (p.rewritten && g.after.re && p.fate === p.fate)
            ? (g.after[p.fate] || []).concat(g.after.re || [])
            : (g.after[p.fate] || []);
          return '<div class="dt-sum-row' + (p.rewritten ? ' rewritten' : '') +
            '" data-row="' + p.id + '">' +
            '<span class="dt-sr-no">' + String(p.no).padStart(2, '0') + '</span>' +
            '<span class="dt-sr-name">' + p.name + '</span>' +
            '<span class="dt-sr-relic">' + p.relic + '</span>' +
            '<span class="dt-sr-w">' + (p.rewritten ? '↺ ' : '') +
            WRITE_CN[p.kind] + '</span>' +
            '<span class="dt-sr-f dt-f-' + p.fate + '">' + FATE_CN[p.fate] + '</span>' +
            '</div>' +
            '<div class="dt-sum-after" data-after="' + p.id + '">' +
            aft.join('<br>') + '</div>';
        }).join('') +
        '</div>' +
        '<div class="dt-sum-tally">' +
        '<span>保住 <b class="dt-t-kept">' + kept + '</b></span>' +
        '<span>被折 <b class="dt-t-hurt">' + hurt + '</b></span>' +
        '<span>作废 <b class="dt-t-void">' + voided + '</b></span>' +
        (refused ? '<span>没办 <b class="dt-t-ref">' + refused + '</b></span>' : '') +
        (d.paid ? '<span>抵了 <b class="dt-t-paid">' + d.paid + '</b></span>' : '') +
        '</div>' +
        '<div class="dt-sum-moral">' + judge + '</div>' +
        '<div class="dt-sum-tail">' +
        (this.peekCount
          ? '你翻过 ' + this.peekCount + ' 次他们的东西。' +
            (this.peekCount >= 4 ? '你比他们自己更清楚他们的事。' : '') + '<br>'
          : '') +
        (this.rewrote && this.picks.some((p) => p.rewritten)
          ? '有一行被划掉了。纸上留着印子，擦不掉。<br>' : '') +
        (d.paid
          ? '抽屉里少了一件东西。你记得它的名字，不太记得它是谁的。<br>' : '') +
        (lamp
          ? '你把手放在灯罩上，是热的。<br>外面开始有人扫地。'
          : '你去拧灯芯，拧不动。<br>柜台上的纸被风吹起来一张，又落回去。') +
        '</div>' +
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
    OIL: OIL,
    LEDGER: LEDGER,
  };

  global.Duty = Duty;
  global.DUTY_GUESTS = GUESTS;
})(window);
