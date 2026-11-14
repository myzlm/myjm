/* ============================================================
   hands.js — 六件手上的活
   ------------------------------------------------------------
   柜台底下有一只木箱。
   押的东西在里间，丢的东西在这儿。
   六样东西，六个人没做完的事。修好一件，就多知道一个人。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Toast } = global.G;

  const chOf = (S) => (global.Save && global.Save.chapterOf ? global.Save.chapterOf(S) : 0);
  const S = () => global.State || {};
  const boxOf = () => {
    const s = S();
    s.hands = s.hands || {};
    return s.hands;
  };
  const recOf = (id) => boxOf()[id] || null;
  const isDone = (id) => { const r = recOf(id); return !!(r && r.done); };

  /* ============================================================
     六件东西
     ============================================================ */
  const KIT = [
    {
      id: 'candle',
      tip: '烧剩两指高的一截，指甲印还在', ch: 1, no: '三十一', name: '一 截 蜡 烛', cap: '蜡',
      who: '陈诺诺 · 十七岁 · 高三',
      brief: '三十一号丢在门口的东西。一截蜡，烧得只剩两指高，' +
             '蜡身上有一道指甲印，是掰下来的时候留下的。<br>' +
             '箱底压着一封没寄出去的信。正面是空的，只有一道折痕。',
      goal: '把蜡点上，照一照信纸的背面。',
      hints: [
        '蜡有三个位置：贴着墙、离半尺、伸出一臂。',
        '影子要清楚，光得近；可太近了，影子就糊成一片。',
        '挪到当中那一档，再点纸面。字是一个一个浮上来的。',
      ],
      narr: [
        '旁白：你已经挪了三次。它只有三个位置。',
        '旁白：三十五个里，有三十四个没挪过第二次。',
      ],
      solve: '陈诺诺，十七岁。她妈替她填了转学申请，让她躲开那些人。' +
             '她在申请表的背面写了四个字，又没交。' +
             '她把这张纸丢在门口，押下的是另一句话：她不想躲，她想留下。' +
             '后来她既没转学，也没回学校。她在这间店里坐着，等一个说法，等了很久。',
      acts: {
        give: { label: '交 给 他', text: '他把蜡和信一起收进抽屉。「她会来取的。」' },
        keep: { label: '收 进 册 子', text: '你把蜡夹进册子。册子厚了一点，也多了一个人的重量。' },
        burn: { label: '烧 掉', text: '蜡烧到底。四个字最后亮了一下，黑了。' },
      },
    },
    {
      id: 'paper',
      tip: '杆上刻着两个字：右起', ch: 2, no: '三十四', name: '一 支 铅 笔', cap: '纸',
      who: '周宁 · 独生子女 · 一个',
      brief: '三十四号的铅笔。抽屉底板是空的，撕走的两页压在最底下。<br>' +
             '铅笔杆上刻着两个字：右起。',
      goal: '把两页拓出来。',
      hints: [
        '铅笔刻着「右起」。这纸是竖排的。',
        '从最右边那一格开始涂，一格一格往左。',
        '涂错一格，纸就皱了，得从头来。',
      ],
      narr: [
        '旁白：铅笔不心疼纸。它只顺着你手的方向走。',
        '旁白：第三十五个一遍就涂对了。他认得自己是从哪一头开始的。',
      ],
      solve: '周宁。父亲瘫了三年，母亲糖尿病。护工走了七个，' +
             '两头跑的高铁坐了四十六趟。火化、销户、退租、清空那间住了四十年的房子，' +
             '都是他一个人办的。办完他回到这里，把账上第三十四页撕了。' +
             '他不想让后面的人看见「一个人」是什么下场。' +
             '他最后押下的是一句很轻的话：还有没有人会来。',
      acts: {
        give: { label: '交 给 他', text: '他把两页纸压回抽屉底，压得很平。「下一页还空着。」' },
        keep: { label: '收 进 册 子', text: '你把拓出来的那张纸折得很小，收进册子。' },
        burn: { label: '烧 掉', text: '纸烧起来很快。八个字在火里还是浅的。' },
      },
    },
    {
      id: 'tape',
      tip: '带盒上贴着：十二秒那儿有一声咔', ch: 3, no: '三十三', name: '一 盘 磁 带', cap: '带',
      who: '唐甜 · 跨境电商 · 通宵',
      brief: '三十三号的录音带。她给客户录过很多条，这一条被剪过。<br>' +
             '带盒上贴着字条：十二秒那儿有一声咔。',
      goal: '听听被剪掉的那一段。',
      hints: [
        '先放一遍。听见「咔」，就在那一小段按倒放。',
        '咔在十二秒。倒放得按在十二秒到十四秒之间。',
        '放到十二秒左右停手，马上按倒放。别过十四秒。',
      ],
      narr: [
        '旁白：带子只有二十秒。你已经把它放完两遍了。',
        '旁白：她说过三十七遍同一句话。你听两遍就烦了。',
      ],
      solve: '唐甜。做跨境，通宵，房间一年没开过窗帘。' +
             '她把三个月工资垫给供应商，供应商跑了。三十七个客户，她一个一个回，' +
             '说同一句话：货已经在路上了。说到第三十七遍，她自己都信了。' +
             '她把这句话留在这盘带子上，押掉的是那个「明天」。',
      acts: {
        give: { label: '交 给 他', text: '他把带子收进抽屉，标签朝外。「路上。」他说了一遍，像在念别人的话。' },
        keep: { label: '收 进 册 子', text: '你把带子收进册子。它比看上去重。' },
        burn: { label: '烧 掉', text: '磁铁压过去，带子哑了。那句「在路上」没了。' },
      },
    },
    {
      id: 'cards',
      tip: '三张撕口，对不齐', ch: 4, no: '三十', name: '三 张 透 卡', cap: '片',
      who: '许诺 · 原画 · 八年',
      brief: '三十号的分镜透卡，三张。她画了八年原画，最后一张稿被撕成了三份。<br>' +
             '每张卡转一次，上面的数字就换一个。<br>' +
             '三个数字要连成一个号。',
      goal: '把三张卡转成一个号。',
      hints: [
        '三张卡各转四次，数字会变。',
        '那个号你见过：三位，前面有个零。',
        '是 036。你自己那个号。',
      ],
      narr: [
        '旁白：三个数字，六十四种排法。你在找一个你自己。',
        '旁白：她画这张稿的时候，也转了三次。',
      ],
      solve: '许诺，画了八年。她的活一夜之间没了：甲方说 AI 一分钟四十张，一张两毛。' +
             '她学了三个月，画得比 AI 还快。甲方说，那你画得比它便宜。' +
             '最后一张稿叫《一碗面》，画的是桌子底下扣着一只碗。' +
             '甲方在碗边加了一行字：加 logo。她把稿撕成三份，塞进抽屉。' +
             '她押掉的是画完的力气。现在她教小孩画素描，不太敢动笔。',
      acts: {
        give: { label: '交 给 他', text: '他把三张卡按顺序叠好，收进抽屉。「她要是回来拿，得是齐的。」' },
        keep: { label: '收 进 册 子', text: '你把三张卡夹进册子。合上的时候，卡边响了一声。' },
        burn: { label: '烧 掉', text: '三张卡一起烧。数字先黑，画最后黑。' },
      },
    },
    {
      id: 'punch',
      tip: '第五列是校验位，天生单数', ch: 5, no: '二十八', name: '一 条 纸 带', cap: '孔',
      who: '彭宇 · 大厂 · 第八年',
      brief: '二十八号的打孔纸带。机器读它，人也读它。<br>' +
             '每一列的孔都得成对。<br>' +
             '第五列是校验位，天生是单数。',
      goal: '找出那一列不对的孔。',
      hints: [
        '数一数每一列有几个孔。',
        '有两列是单数。一列是故意的，一列是错的。',
        '错的是第三列：三个孔，配不成对。',
      ],
      narr: [
        '旁白：机器读完这条带子用了零点四秒。你用了四分钟。',
        '旁白：他删了三千行，只留一行。你正在找那一行。',
      ],
      solve: '彭宇，大厂第八年。裁员那天，他把自己写的三千行删干净，' +
             '只留了一行注释：// 记得删掉这行。他不是忘了删。' +
             '他是想留个东西，证明自己在这儿待过。' +
             '系统每跑一次，就把这一行读一遍。读给谁听，没人知道。',
      acts: {
        give: { label: '交 给 他', text: '他把纸带卷起来，用橡皮筋扎好。「机器不认得，人认得。」' },
        keep: { label: '收 进 册 子', text: '你把纸带收进册子。合上册子，它还在里面轻轻响。' },
        burn: { label: '烧 掉', text: '纸带烧起来有一股焦糖味。孔还在，只是不再成列了。' },
      },
    },
    {
      id: 'roster',
      tip: '填到第七床，笔停了', ch: 6, no: '三十二', name: '一 张 值 夜 表', cap: '表',
      who: '吴大夫 · 县医院 · 急诊',
      brief: '三十二号的值夜表。七张床，四条规矩。他填到第七床，笔停了。',
      goal: '把七张床排对。',
      hints: [
        '先看血压最低的是谁。他一定在第一床。',
        '三十九度那个要挨着第一床。',
        '三个家属的排最里面；没有名字的排最后一床。',
      ],
      narr: [
        '旁白：这张表他值了十三年。你用了五分钟。',
        '旁白：他写第七床的时候停了一下。你也停一下吧。',
      ],
      solve: '吴大夫，县医院急诊，二十六年。最忙的一夜，他看了九十一个病人。' +
             '最后一个没有家属，也没有名字，送来时身上只有一张纸，' +
             '纸上是个电话号码，打过去是空号。' +
             '他在值夜表「陪护」一栏写了自己的名字。' +
             '第二天交班，他在走廊的椅子上睡着了。护士说，他那天没下班。',
      acts: {
        give: { label: '交 给 他', text: '他把表折起来，塞进白大褂口袋。「交班要用的。」' },
        keep: { label: '收 进 册 子', text: '你把表夹进册子。第七床那一栏，多了一个名字。' },
        burn: { label: '烧 掉', text: '表烧了。纸灰上还剩七道横线，像七张床。' },
      },
    },
  ];

  /* 解锁：走到第几章，就多一件 */
  function need(id, s) {
    const c = chOf(s);
    if (id === 'roster') return c >= 6 || (s.ch5 >= 3);
    const k = KIT.find((x) => x.id === id);
    return c >= k.ch;
  }

  /* ============================================================
     六道活
     ============================================================ */
  const PUZ = {};

  /* ---------- 一 · 蜡 ---------- */
  PUZ.candle = {
    pos: 0, lit: false, reads: 0,
    CHARS: ['我', '不', '转', '学'],
    POS: ['贴着墙', '离半尺', '伸出一臂'],
    build(root, api) {
      root.innerHTML =
        '<div class="hx-cn" id="cn-wrap" data-pos="0">' +
          '<div class="hx-cn-wall">' +
            '<div class="hx-cn-sheet" id="cn-sheet" title="信纸">' +
              '<span class="cn-line" id="cn-line"></span>' +
              '<span class="cn-fold"></span>' +
            '</div>' +
            '<div class="hx-cn-shadow" id="cn-shadow"></div>' +
          '</div>' +
          '<div class="hx-cn-floor">' +
            '<button class="hx-cn-candle" id="cn-candle" title="蜡">' +
              '<span class="cn-flame"></span><span class="cn-wick"></span><span class="cn-stick"></span>' +
            '</button>' +
            '<span class="hx-cn-tag" id="cn-tag">蜡还没点</span>' +
          '</div>' +
        '</div>';
      const wrap = $('#cn-wrap');
      const candle = $('#cn-candle');
      const sheet = $('#cn-sheet');
      const line = $('#cn-line');
      const tag = $('#cn-tag');

      const paint = () => {
        wrap.dataset.pos = String(this.pos);
        tag.textContent = this.lit ? ('蜡 · ' + this.POS[this.pos]) : '蜡还没点';
        candle.classList.toggle('lit', this.lit);
      };

      candle.addEventListener('click', (e) => {
        e.stopPropagation();
        global.Snd.init();
        if (!this.lit) {
          this.lit = true;
          global.Snd.noise(0.5, { type: 'highpass', freq: 3400, gain: 0.05 });
          global.Snd.tone(520, 0.5, { type: 'sine', gain: 0.05, attack: 0.12 });
          api.msg('划了三下才着。火苗歪了一下，又立起来。');
          paint();
          return;
        }
        this.pos = (this.pos + 1) % 3;
        global.Snd.noise(0.14, { type: 'bandpass', freq: 1200, q: 1.4, gain: 0.05 });
        api.msg(this.pos === 0 ? '你把蜡贴到墙上。'
          : this.pos === 1 ? '你把它挪开半尺。' : '你把它伸出一臂远。');
        paint();
      });

      sheet.addEventListener('click', (e) => {
        e.stopPropagation();
        global.Snd.init();
        if (!this.lit) { api.bad('纸是白的。你什么也看不见。'); return; }
        if (this.pos === 0) { api.bad('影子糊在纸上，字连成一片。'); return; }
        if (this.pos === 2) { api.bad('光散开了。纸还是白的。'); return; }
        if (this.reads >= this.CHARS.length) return;
        const c = this.CHARS[this.reads++];
        line.textContent += c;
        line.classList.add('on');
        global.Snd.tone(380 + this.reads * 60, 0.22, { type: 'triangle', gain: 0.05 });
        if (this.reads < this.CHARS.length) {
          api.msg('纸上浮出一个字。还有。');
        } else {
          api.msg('四个字浮齐了。是压在背面、又从正面透出来的。');
          line.classList.add('struck');
          global.Snd.tone(180, 1.6, { type: 'sine', gain: 0.05, attack: 0.3 });
          setTimeout(() => api.solve(), 1500);
        }
      });

      paint();
      api.msg('蜡很短。烧到底，也只够照一张纸。');
    },
  };

  /* ---------- 二 · 纸 ---------- */
  PUZ.paper = {
    next: 7, chars: ['有', '所', '了', '完', '办', '人', '个', '一'],
    build(root, api) {
      root.innerHTML =
        '<div class="hx-pp">' +
          '<div class="hx-pp-sheet" id="pp-sheet"></div>' +
          '<div class="hx-pp-foot">铅笔杆上刻着两个字：<b>右起</b>。</div>' +
        '</div>';
      const sheet = $('#pp-sheet');
      sheet.innerHTML = this.chars.map((c, i) =>
        '<button class="hx-pp-cell" data-i="' + i + '"><span>' + c + '</span></button>'
      ).join('');

      $$('.hx-pp-cell', sheet).forEach((cell) => {
        cell.addEventListener('click', (e) => {
          e.stopPropagation();
          global.Snd.init();
          const i = +cell.dataset.i;
          if (i !== this.next) {
            this.smudge(sheet, api);
            return;
          }
          cell.classList.add('on');
          this.next--;
          global.Snd.noise(0.16, { type: 'highpass', freq: 2400, gain: 0.045 });
          if (this.next < 0) {
            api.msg('八个字都出来了。浅得几乎看不见。');
            setTimeout(() => api.solve(), 1200);
          } else {
            api.msg('一格。还有 ' + (this.next + 1) + ' 格。');
          }
        });
      });
      api.msg('铅笔削得很尖。纸上什么也没有。');
    },
    smudge(sheet, api) {
      global.Snd.deny();
      global.Snd.noise(0.3, { type: 'bandpass', freq: 800, q: 1.1, gain: 0.06 });
      sheet.classList.add('wrinkle');
      setTimeout(() => sheet.classList.remove('wrinkle'), 420);
      $$('.hx-pp-cell', sheet).forEach((c) => c.classList.remove('on'));
      this.next = 7;
      api.bad('纸皱了。铅笔打了个滑，得从头涂。');
    },
  };

  /* ---------- 三 · 带 ---------- */
  PUZ.tape = {
    t: 0, timer: null, marks: {}, done: false,
    build(root, api) {
      root.innerHTML =
        '<div class="hx-tp">' +
          '<div class="hx-tp-case">' +
            '<span class="hx-tp-reel r1"></span><span class="hx-tp-reel r2"></span>' +
            '<span class="hx-tp-win"></span>' +
            '<span class="hx-tp-tag">12″ 咔</span>' +
          '</div>' +
          '<div class="hx-tp-bar"><i id="tp-fill"></i>' +
            '<em class="tk" style="left:60%"></em><em class="tk" style="left:70%"></em>' +
          '</div>' +
          '<div class="hx-tp-time" id="tp-time">0.0″</div>' +
          '<div class="hx-tp-line" id="tp-line">（还没按。）</div>' +
          '<div class="hx-tp-btns">' +
            '<button class="hx-b" id="tp-play">放</button>' +
            '<button class="hx-b" id="tp-stop">停</button>' +
            '<button class="hx-b" id="tp-rev">倒 放</button>' +
          '</div>' +
        '</div>';

      const fill = $('#tp-fill');
      const time = $('#tp-time');
      const line = $('#tp-line');

      const tick = () => {
        this.t = Math.min(20, this.t + 0.1);
        fill.style.width = (this.t / 20 * 100) + '%';
        time.textContent = this.t.toFixed(1) + '″';
        [0.6, 4, 8, 12, 14].forEach((m) => {
          if (this.t >= m && !this.marks[m]) {
            this.marks[m] = true;
            this.beat(m, line);
          }
        });
        if (this.t >= 20) this.stop();
      };

      $('#tp-play').addEventListener('click', (e) => {
        e.stopPropagation();
        global.Snd.init();
        if (this.done) return;
        if (this.timer) return;
        global.Snd.noise(0.4, { type: 'bandpass', freq: 1800, q: 0.8, gain: 0.04 });
        this.timer = setInterval(tick, 100);
      });
      $('#tp-stop').addEventListener('click', (e) => {
        e.stopPropagation();
        global.Snd.click();
        this.stop();
        line.textContent = '（带子停了。）';
      });
      $('#tp-rev').addEventListener('click', (e) => {
        e.stopPropagation();
        global.Snd.init();
        if (this.done) return;
        if (this.t >= 12 && this.t <= 14) {
          this.done = true;
          this.stop();
          global.Snd.noise(1.1, { type: 'bandpass', freq: 520, q: 0.9, gain: 0.06, to: 260 });
          global.Snd.tone(120, 1.2, { type: 'sawtooth', gain: 0.03, to: 70 });
          line.textContent = '……有 没 货。';
          api.msg('倒过来才听得清。正着放，那句是「已经在路上」。');
          setTimeout(() => api.solve(), 1600);
          return;
        }
        global.Snd.noise(0.3, { type: 'bandpass', freq: 900, q: 1.2, gain: 0.05 });
        line.textContent = '（倒过来全是沙。）';
        api.bad(this.t < 12
          ? '还没到那一声咔。'
          : '过了。咔在十二秒，你早了或者晚了。');
      });
      api.msg('一盘带子。二十秒。');
    },
    beat(m, line) {
      const Snd = global.Snd;
      if (m === 0.6) { line.textContent = '（沙。她的呼吸离话筒很近。）'; }
      if (m === 4) {
        line.textContent = '「货已经在路上了。」';
        Snd.tone(300, 0.2, { type: 'square', gain: 0.03 });
      }
      if (m === 8) {
        line.textContent = '「明天上午到。您放心。」';
        Snd.tone(280, 0.2, { type: 'square', gain: 0.03 });
      }
      if (m === 12) {
        line.textContent = '（咔。）';
        Snd.tone(900, 0.05, { type: 'square', gain: 0.09 });
        Snd.noise(0.1, { type: 'highpass', freq: 3200, gain: 0.08 });
      }
      if (m === 14) { line.textContent = '（后面是空的。带子还在转。）'; }
    },
    stop() {
      if (this.timer) { clearInterval(this.timer); this.timer = null; }
    },
    leave() { this.stop(); },
  };

  /* ---------- 四 · 片 ---------- */
  PUZ.cards = {
    DIGS: [['4', '0', '7', '9'], ['2', '5', '3', '8'], ['9', '1', '6', '4']],
    ANS: [1, 2, 2],
    rot: [0, 0, 0],
    build(root, api) {
      this.rot = [ (this.ANS[0] + 2) % 4, (this.ANS[1] + 1) % 4, (this.ANS[2] + 3) % 4 ];
      root.innerHTML =
        '<div class="hx-cd">' +
          '<div class="hx-cd-row" id="cd-row"></div>' +
          '<div class="hx-cd-rule">三个数字连成一个号。<br>那个号你见过。</div>' +
          '<button class="hx-b" id="cd-check">看 一 眼</button>' +
        '</div>';
      const row = $('#cd-row');
      row.innerHTML = [0, 1, 2].map((i) =>
        '<button class="hx-card" data-i="' + i + '">' +
          '<span class="cd-no">' + (i + 1) + '</span>' +
          '<span class="cd-notch"></span>' +
          '<span class="cd-dig" id="cd-dig-' + i + '">?</span>' +
        '</button>'
      ).join('');

      const paint = () => {
        $$('.hx-card', row).forEach((c) => {
          const i = +c.dataset.i;
          c.style.setProperty('--rot', this.rot[i] * 90 + 'deg');
          $('#cd-dig-' + i).textContent = this.DIGS[i][this.rot[i]];
        });
      };

      $$('.hx-card', row).forEach((c) => {
        c.addEventListener('click', (e) => {
          e.stopPropagation();
          global.Snd.init();
          const i = +c.dataset.i;
          this.rot[i] = (this.rot[i] + 1) % 4;
          global.Snd.noise(0.08, { type: 'highpass', freq: 2800, gain: 0.04 });
          global.Snd.tone(560 + i * 60, 0.05, { type: 'triangle', gain: 0.035 });
          paint();
          api.msg('第 ' + (i + 1) + ' 张转到 ' + (this.rot[i] * 90) + ' 度。');
        });
      });

      $('#cd-check').addEventListener('click', (e) => {
        e.stopPropagation();
        global.Snd.init();
        const now = this.rot.map((r, i) => this.DIGS[i][r]).join('');
        if (this.rot[0] === this.ANS[0] && this.rot[1] === this.ANS[1] && this.rot[2] === this.ANS[2]) {
          global.Snd.ok();
          global.Snd.tone(660, 0.7, { type: 'triangle', gain: 0.06 });
          api.msg('0 · 3 · 6。卡叠齐了。', 'good');
          root.querySelector('.hx-cd-row').classList.add('aligned');
          setTimeout(() => api.solve(), 1400);
        } else {
          api.bad('现在是 ' + now.split('').join(' · ') + '。不是那个号。');
        }
      });

      paint();
      api.msg('三张卡。边上是撕口，对不齐。');
    },
  };

  /* ---------- 五 · 孔 ---------- */
  PUZ.punch = {
    HOLES: [
      [1, 1, 1, 1, 1, 1],
      [1, 1, 0, 0, 1, 1],
      [1, 0, 1, 0, 1, 0],   /* 第三列：三个孔，错的那一列 */
      [0, 1, 1, 0, 1, 1],
      [1, 1, 1, 1, 1, 0],   /* 第五列：校验位，天生单数 */
    ],
    build(root, api) {
      root.innerHTML =
        '<div class="hx-pu">' +
          '<div class="hx-pu-tape" id="pu-tape"></div>' +
          '<div class="hx-pu-rule">每一列的孔都得成对。<b>第五列是校验位，天生是单数。</b></div>' +
        '</div>';
      const tape = $('#pu-tape');
      tape.innerHTML = this.HOLES.map((col, c) =>
        '<button class="hx-pu-col" data-c="' + c + '">' +
          '<span class="hx-pu-holes">' +
            col.map((h) => '<i class="' + (h ? 'on' : '') + '"></i>').join('') +
          '</span>' +
          '<span class="hx-pu-no">' + (c + 1) + '</span>' +
          (c === 4 ? '<span class="hx-pu-chk">校</span>' : '') +
        '</button>'
      ).join('');

      $$('.hx-pu-col', tape).forEach((b) => {
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          global.Snd.init();
          const c = +b.dataset.c;
          if (c === 2) {
            b.classList.add('cut');
            global.Snd.ok();
            global.Snd.noise(0.25, { type: 'highpass', freq: 2600, gain: 0.07 });
            api.msg('撕下那一列。孔后面是一行字。', 'good');
            tape.classList.add('cut');
            setTimeout(() => api.solve(), 1300);
          } else if (c === 4) {
            api.bad('校验位也是单数，可它是故意的。它没有错。');
          } else {
            global.Snd.tone(140, 0.18, { type: 'square', gain: 0.04 });
            api.bad('读卡器空转了一圈。这一列是齐的。');
          }
        });
      });
      api.msg('纸带很长。你只看得懂孔。');
    },
  };

  /* ---------- 六 · 表 ---------- */
  PUZ.roster = {
    BEDS: [
      { id: 'a', n: '甲', m: '血压 60 / 40 · 叫不醒' },
      { id: 'b', n: '乙', m: '三个家属 · 挤在走廊' },
      { id: 'c', n: '丙', m: '一个人 · 自己签的字' },
      { id: 'd', n: '丁', m: '三十九度 · 一直在说话' },
      { id: 'e', n: '戊', m: '骨折 · 等床等了六个小时' },
      { id: 'f', n: '己', m: '老太太 · 找不到家属' },
      { id: 'g', n: '庚', m: '没有名字 · 身上一张纸' },
    ],
    order: ['b', 'g', 'c', 'd', 'a', 'f', 'e'],
    sel: -1,
    build(root, api) {
      this.sel = -1;
      this.order = ['b', 'g', 'c', 'd', 'a', 'f', 'e'];
      root.innerHTML =
        '<div class="hx-rs">' +
          '<div class="hx-rs-rules">' +
            '<span>一 · 甲（血压六十）在第一床。</span>' +
            '<span>二 · 丁（三十九度）挨着甲。</span>' +
            '<span>三 · 乙（三个家属）不在第七床。</span>' +
            '<span>四 · 庚（没有名字）在最后一床。</span>' +
          '</div>' +
          '<div class="hx-rs-beds" id="rs-beds"></div>' +
          '<div class="hx-rs-foot">点两张床，换位置。</div>' +
          '<button class="hx-b" id="rs-check">交 班</button>' +
        '</div>';
      const beds = $('#rs-beds');
      beds.innerHTML = this.order.map((id, i) => {
        const b = this.BEDS.find((x) => x.id === id);
        return '<button class="hx-bed" data-i="' + i + '">' +
          '<span class="hx-bed-no">' + (i + 1) + '</span>' +
          '<span class="hx-bed-n">' + b.n + '</span>' +
          '<span class="hx-bed-m">' + b.m + '</span>' +
        '</button>';
      }).join('');

      const paint = () => {
        $$('.hx-bed', beds).forEach((el, i) => {
          const b = this.BEDS.find((x) => x.id === this.order[i]);
          el.classList.toggle('sel', this.sel === i);
          el.querySelector('.hx-bed-n').textContent = b.n;
          el.querySelector('.hx-bed-m').textContent = b.m;
        });
      };

      $$('.hx-bed', beds).forEach((el) => {
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          global.Snd.init();
          const i = +el.dataset.i;
          if (this.sel < 0) {
            this.sel = i;
            global.Snd.tone(420, 0.05, { type: 'triangle', gain: 0.04 });
            paint();
            return;
          }
          if (this.sel === i) {
            this.sel = -1; paint(); return;
          }
          const t = this.order[this.sel];
          this.order[this.sel] = this.order[i];
          this.order[i] = t;
          this.sel = -1;
          global.Snd.noise(0.1, { type: 'bandpass', freq: 1400, q: 1.3, gain: 0.045 });
          paint();
          api.msg('换过来了。');
        });
      });

      $('#rs-check').addEventListener('click', (e) => {
        e.stopPropagation();
        global.Snd.init();
        const at = (id) => this.order.indexOf(id);
        const bad = [];
        if (at('a') !== 0) bad.push('甲该在第一床');
        if (Math.abs(at('d') - at('a')) !== 1) bad.push('丁该挨着甲');
        if (at('b') === 6) bad.push('乙不该在第七床');
        if (at('g') !== 6) bad.push('庚该在最后一床');
        if (!bad.length) {
          global.Snd.ok();
          global.Snd.tone(520, 0.6, { type: 'triangle', gain: 0.06 });
          api.msg('表填完了。第七床后面，空着一栏。', 'good');
          setTimeout(() => api.solve(), 1400);
        } else {
          api.bad(bad[0] + '。');
        }
      });
      paint();
      api.msg('七张床。他的字很小，写得很挤。');
    },
  };

  /* ============================================================
     屏幕
     ============================================================ */
  const Hands = {
    inited: false,
    cur: null,
    from: 'counter',
    tries: 0,
    timers: [],

    init() {
      if (this.inited) return;
      this.inited = true;
      $('#hx-back').addEventListener('click', (e) => {
        e.stopPropagation();
        this.back();
      });
      $('#hx-grid').addEventListener('click', (e) => {
        const c = e.target.closest('.hx-card');
        if (!c) return;
        this.open(c.dataset.id);
      });
    },

    /* 从哪儿进来，就回哪儿去 */
    enter() {
      const app = global.App;
      if (!app || app.current === 'hands') return;
      const cur = app.current;
      const S0 = S();
      const any = KIT.some((k) => need(k.id, S0));
      if (!any) {
        Toast.show('箱子里还是空的。柜台底下有一道缝，但没东西。', 2400);
        return;
      }
      this.from = (['counter', 'layer', 'root'].indexOf(cur) >= 0) ? cur : 'counter';
      if (global.Snd) { global.Snd.init(); global.Snd.click(); }
      const go = () => { global.App.show('hands'); this.start(); };
      if (global.Fade) global.Fade.through(go); else go();
    },

    back() {
      const to = this.from || 'counter';
      this.clearTimers();
      const go = () => {
        global.App.show(to);
        if (to === 'counter' && global.Counter) global.Counter.init();
        else if (to === 'layer' && global.Layer) global.Layer.start();
        else if (to === 'root' && global.Root) global.Root.start();
      };
      if (global.Fade) global.Fade.through(go); else go();
    },

    later(fn, ms) {
      const id = setTimeout(fn, ms);
      this.timers.push(id);
      return id;
    },

    clearTimers() {
      this.timers.forEach((t) => clearTimeout(t));
      this.timers = [];
      if (this.cur && PUZ[this.cur] && PUZ[this.cur].leave) PUZ[this.cur].leave();
    },

    start() {
      this.init();
      this.cur = null;
      this.clearTimers();
      this.renderGrid();
      this.renderFoot();
      $('#hx-sub').innerHTML = '押的东西在里间，丢的东西在这儿。<br>' +
        '六样东西，六个人没做完的事。';
    },

    toCounter() {
      this.from = 'counter';
      this.back();
    },

    doneCount() {
      return KIT.filter((k) => isDone(k.id)).length;
    },

    /* 还开着几件没做——柜台那句提示要用 */
    undone() {
      const S0 = S();
      return KIT.filter((k) => need(k.id, S0) && !isDone(k.id)).length;
    },

    renderFoot() {
      const n = this.doneCount();
      $('#hx-count').textContent = n + ' / 6';
      const tail = $('#hx-tail');
      if (!tail) return;
      if (n >= 6) {
        tail.classList.add('on');
        tail.textContent = '箱底刻着一行字：东西都修好了，人还没回来。';
      } else {
        tail.classList.remove('on');
        tail.textContent = '';
      }
    },

    renderGrid() {
      const g = $('#hx-grid');
      g.classList.remove('gone');
      $('#hx-stage').classList.remove('on');
      g.innerHTML = KIT.map((k) => {
        const open = need(k.id, S());
        const done = isDone(k.id);
        const r = recOf(k.id);
        const act = r && r.act;
        const stat = done
          ? (act === 'burn' ? '烧了' : act === 'keep' ? '收着' : '交了')
          : (open ? '可以动了' : '还没到你手上');
        return '<button class="hx-card' + (open ? '' : ' lock') + (done ? ' done' : '') +
          '" data-id="' + k.id + '">' +
          '<span class="hx-cap">' + k.cap + '</span>' +
          '<span class="hx-no">第 ' + k.ch + ' 章 · ' + k.no + ' 号</span>' +
          '<span class="hx-tip">' + (k.tip || '') + '</span>' +
          '<span class="hx-nm">' + k.name + '</span>' +
          '<span class="hx-st">' + (done ? '<i class="ok">✓</i> ' : '') + stat + '</span>' +
        '</button>';
      }).join('');
      this.renderFoot();
    },

    open(id) {
      const k = KIT.find((x) => x.id === id);
      if (!k) return;
      global.Snd.init(); global.Snd.click();
      if (!need(id, S())) {
        Toast.show('箱子里这一格还空着。到时候了它自己会出来。', 2600);
        return;
      }
      this.cur = id;
      this.tries = 0;
      const g = $('#hx-grid');
      g.classList.add('gone');
      const st = $('#hx-stage');
      st.classList.add('on');
      st.innerHTML =
        '<div class="hx-hd">' +
          '<span class="hx-hd-no">' + k.no + ' 号</span>' +
          '<span class="hx-hd-nm">' + k.name + '</span>' +
          '<span class="hx-hd-who">' + k.who + '</span>' +
        '</div>' +
        '<div class="hx-brief">' + k.brief + '</div>' +
        '<div class="hx-goal">要做的事：' + k.goal + '</div>' +
        '<div class="hx-board" id="hx-board"></div>' +
        '<div class="hx-msg" id="hx-msg"></div>' +
        '<div class="hx-tools">' +
          '<button class="hx-b" id="hx-hint">提 示</button>' +
          '<button class="hx-b ghost" id="hx-back2">放 回 去</button>' +
          '<span class="hx-tries" id="hx-tries"></span>' +
        '</div>';

      $('#hx-back2').addEventListener('click', (e) => {
        e.stopPropagation();
        this.closeItem();
      });
      $('#hx-hint').addEventListener('click', (e) => {
        e.stopPropagation();
        this.hint(k);
      });

      if (isDone(id)) {
        this.showEnd(k, true);
        return;
      }
      const api = this.api();
      PUZ[id].build($('#hx-board'), api);
    },

    api() {
      return {
        msg: (t, cls) => this.msg(t, cls),
        bad: (t) => this.bad(t),
        solve: () => this.solve(),
      };
    },

    msg(t, cls) {
      const m = $('#hx-msg');
      if (!m) return;
      m.className = 'hx-msg' + (cls ? ' ' + cls : '');
      m.textContent = t;
    },

    bad(t) {
      this.tries++;
      global.Snd.deny();
      this.msg(t, 'bad');
      const k = KIT.find((x) => x.id === this.cur);
      const tl = $('#hx-tries');
      if (tl) tl.textContent = this.tries > 1 ? '第 ' + this.tries + ' 次' : '';
      if (k && this.tries === 3 && k.narr[0]) {
        this.later(() => this.msg(k.narr[0], 'narr'), 1400);
      } else if (k && this.tries === 6 && k.narr[1]) {
        this.later(() => this.msg(k.narr[1], 'narr'), 1400);
      }
    },

    hint(k) {
      const used = (this._hint = (this._hint || 0) + 1);
      const h = k.hints[Math.min(k.hints.length - 1, used - 1)];
      this.msg('提示：' + h, 'narr');
    },

    solve() {
      const k = KIT.find((x) => x.id === this.cur);
      if (!k) return;
      global.Snd.ok();
      const r = boxOf()[k.id] = boxOf()[k.id] || {};
      r.done = true;
      r.at = Date.now();
      this.showEnd(k, false);
      this.renderFoot();
    },

    showEnd(k, replay) {
      const st = $('#hx-board');
      st.innerHTML =
        '<div class="hx-end">' +
          '<div class="hx-end-t">补 记</div>' +
          '<p class="hx-note">' + k.solve + '</p>' +
          '<div class="hx-acts" id="hx-acts"></div>' +
        '</div>';
      const acts = $('#hx-acts');
      const r = recOf(k.id);
      if (r && r.act) {
        acts.innerHTML = '<div class="hx-done">' + (k.acts[r.act] ? k.acts[r.act].text : '') + '</div>';
        this.msg(replay ? '这件已经做完了。' : '');
        return;
      }
      ['give', 'keep', 'burn'].forEach((key) => {
        const a = k.acts[key];
        const b = document.createElement('button');
        b.className = 'hx-b' + (key === 'burn' ? ' ghost' : '');
        b.textContent = a.label;
        b.addEventListener('click', (e) => {
          e.stopPropagation();
          this.act(k, key);
        });
        acts.appendChild(b);
      });
      this.msg('东西修好了。你总得决定把它放哪儿。');
    },

    act(k, key) {
      const a = k.acts[key];
      if (!a) return;
      const r = boxOf()[k.id];
      r.act = key;
      if (key === 'burn') {
        global.Snd.noise(1.2, { type: 'lowpass', freq: 2400, to: 300, gain: 0.08 });
      } else {
        global.Snd.tone(300, 0.3, { type: 'triangle', gain: 0.05 });
      }
      $('#hx-acts').innerHTML = '<div class="hx-done">' + a.text + '</div>';
      this.msg('');
      const n = this.doneCount();
      if (n >= 6 && global.Ach) {
        this.later(() => global.Ach.show('手上有活', '六件东西都修好了。六个人，一件也没替你留下。'), 900);
      }
      this.later(() => this.closeItem(), 2400);
    },

    closeItem() {
      this.clearTimers();
      this.cur = null;
      this._hint = 0;
      $('#hx-stage').classList.remove('on');
      $('#hx-stage').innerHTML = '';
      this.renderGrid();
      $('#hx-sub').innerHTML = '押的东西在里间，丢的东西在这儿。<br>' +
        '六样东西，六个人没做完的事。';
    },
  };

  Hands.KIT = KIT;
  Hands.need = need;
  global.Hands = Hands;
})(window);
