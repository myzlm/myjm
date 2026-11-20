/* ============================================================
   night.js — 守夜 · 七则
   ------------------------------------------------------------
   打烊以后，灯还亮着。柜台上那叠纸钱压在灯底下。
   七个说法，七件这条街上真出过的事，七件店里对得上的东西。
   听完了，你才知道这间店原来是什么。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Fade, Toast } = global.G;

  /* ---------------- 开场 ---------------- */
  const INTRO = [
    '打烊了。门板上了，街上没有人。',
    '灯还亮着。这一盏不熄，从你进门那天起就没熄过。',
    '艾坐在柜台后面，手里没有活。他很少这样坐着。',
    '「夜深了，」他说，「您要是不困，我给您讲几个说法。」',
    '「都是老话。街上真出过的事。」',
  ];

  /* ---------------- 七则 ----------------
     k: 'old'   老人说的规矩
        'street' 这条街上出过的一回
        'thing'  店里对得上的一件东西
        'back'   递回给你的那一句（艾说）
     -------------------------------------------- */
  const TALES = [
    {
      id: 'pass', no: '一', name: '路 引',
      lines: [
        { k: 'old', t: '（老人说：死人上路，身上得揣一张路引。）' },
        { k: 'old', t: '（纸上写清楚：姓什么，叫什么，哪年生的，哪年没的，家在哪个村。）' },
        { k: 'old', t: '（没有路引的，走到哪儿都进不去。城门不进，村口不进，连自己家门都不进。）' },
        { k: 'old', t: '（烧的时候要念。念完了，纸灰飘起来，那人才算走了。）' },

        { k: 'street', t: '（这条街上出过一回。）' },
        { k: 'street', t: '（九八年发水，柳河集捞上来七个人。三个认不出是谁。）' },
        { k: 'street', t: '（派出所让村里人来认。认了两天，剩下三个，没人认。）' },
        { k: 'street', t: '（后来就埋在后坡。坟头插一块木牌，写「无名氏」，下面一行小字：戊寅年七月。）' },
        { k: 'street', t: '（有个老头隔一阵就去描那几个字。他说，雨一下，字就淡了。）' },
        { k: 'street', t: '（他描了十一年。第十一年他没去——他自己也进了后坡。）' },
        { k: 'street', t: '（现在那三块牌子上的字，又淡了。）' },

        { k: 'thing', t: '（柜台上那叠纸钱，最上面一张翻过来。）' },
        { k: 'thing', t: '「寄：{NAME} 收」' },
        { k: 'thing', t: '「魂归故里，路引一张」' },
        { k: 'thing', t: '（字是你的笔迹。）' },

        { k: 'back', q: 1, t: '路引不是印的，是写的。' },
        { k: 'back', q: 1, t: '写的人得知道他是谁。' },
        { k: 'back', q: 1, t: '您这张，写的是您自己。' },
        { k: 'back', t: '（他把纸钱翻回去，压在灯底下。灯芯歪了一下。）' },
      ],
    },
    {
      id: 'sev', no: '二', name: '头 七',
      lines: [
        { k: 'old', t: '（老人说：人走第七天，要回来吃一顿。）' },
        { k: 'old', t: '（摆一碗饭，筷子插在中间，别插歪。）' },
        { k: 'old', t: '（家里人早点睡。听见锅盖响，听见椅子动，不许开门。）' },
        { k: 'old', t: '（他吃完就走。门一开，他就不知道该走还是该留。）' },
        { k: 'old', t: '（留久了，就不好走了。）' },

        { k: 'street', t: '（这条街上出过一回。）' },
        { k: 'street', t: '（周家的儿子十九年前没的。那年他二十六，在矿上。）' },
        { k: 'street', t: '（头七那天周家摆了碗。第二年是忌日，又摆。第三年也摆。）' },
        { k: 'street', t: '（摆了十九年。）' },
        { k: 'street', t: '（后来她不摆碗了。改在门口放一双鞋，鞋头朝里。）' },
        { k: 'street', t: '（有人问她，她说：碗是给走的吃的，鞋是给回来的穿的。）' },
        { k: 'street', t: '（去年冬天她走了。房子空了半年。）' },
        { k: 'street', t: '（现在门口那双鞋还在。鞋头朝里。）' },

        { k: 'thing', t: '（柜台上那只粗瓷碗，半碗水，筷子立着。）' },
        { k: 'thing', t: '（立得很直。没有风。）' },
        { k: 'thing', t: '（你退开两步。它还是没倒。）' },

        { k: 'back', q: 1, t: '筷子立着，是旁边站着人。' },
        { k: 'back', q: 1, t: '这是老话。' },
        { k: 'back', t: '（他停了停。）' },
        { k: 'back', q: 1, t: '也可能是端碗的人手抖。' },
        { k: 'back', t: '（他伸手，把筷子扶了一下。筷子倒了。碗里的水，一点波纹都没有。）' },
      ],
    },
    {
      id: 'double', no: '三', name: '替 身',
      lines: [
        { k: 'old', t: '（老人说：病久的，扎个纸人替他。）' },
        { k: 'old', t: '（纸人身上写生辰八字。写完了烧，烧的时候不能说替谁。）' },
        { k: 'old', t: '（扎纸人有一样规矩：不画眼睛。）' },
        { k: 'old', t: '（画了眼睛，它就认得路。认得路，它就想回来。）' },
        { k: 'old', t: '（回来的那个，是替身，还是本人，谁也说不清。）' },

        { k: 'street', t: '（这条街上出过一回。）' },
        { k: 'street', t: '（纸扎铺的老陈，扎了一辈子替身。谁家孩子病了，谁家老人躺着起不来，都找他。）' },
        { k: 'street', t: '（他扎得快。一晚上三个。）' },
        { k: 'street', t: '（他自己走的时候，铺子里没人。）' },
        { k: 'street', t: '（第二天街坊推门进去，他躺在竹床上，身上盖着一张没扎完的纸。）' },
        { k: 'street', t: '（街坊凑钱，给他扎了一个。扎得歪，一边肩膀高一边肩膀低。）' },
        { k: 'street', t: '（有人拿起笔要画眼睛，被按住了。）' },
        { k: 'street', t: '（按他的人说：别画。他这辈子给人画的路够多了。）' },
        { k: 'street', t: '（那个纸人烧的时候，烟是直的。）' },

        { k: 'thing', t: '（艾有时候看着像纸扎的。）' },
        { k: 'thing', t: '（你换个角度，又不像了。他的袖口有毛边，像纸的裁口。）' },

        { k: 'back', q: 1, t: '替身是替人受苦的，不是替人活的。' },
        { k: 'back', q: 1, t: '所以不画眼睛。' },
        { k: 'back', t: '（他把手拢进袖子。）' },
        { k: 'back', q: 1, t: '可有些人，你给他画了眼睛，他也找不回来。' },
      ],
    },
    {
      id: 'call', no: '四', name: '喊 魂',
      lines: [
        { k: 'old', t: '（老人说：小孩吓着了，魂会掉。）' },
        { k: 'old', t: '（掉了魂的孩子夜里发烧，叫不醒，眼睛直。）' },
        { k: 'old', t: '（得在门口喊。半夜，抱着孩子，冲着外头喊他的名字。）' },
        { k: 'old', t: '（喊三夜。头两夜魂不认得路。第三夜听见了，就回来了。）' },
        { k: 'old', t: '（喊的时候不能回头。回头，魂就以为你不想他回来。）' },

        { k: 'street', t: '（这条街上出过一回。）' },
        { k: 'street', t: '（你小时候被喊过一次。）' },
        { k: 'street', t: '（那年你四岁，在河边掉下去。捞上来的时候嘴唇是紫的。）' },
        { k: 'street', t: '（夜里烧到三十九度八，叫不醒。）' },
        { k: 'street', t: '（你妈抱着你，在门口站了三夜。）' },
        { k: 'street', t: '（第三夜你退了烧。醒来的时候她坐在床边，鞋上全是露水。）' },
        { k: 'street', t: '（你不记得她喊的是什么。你只记得，那三夜门外一直有声音。）' },
        { k: 'street', t: '（后来你问过她。她说：没喊什么，就是叫你的名字。）' },
        { k: 'street', t: '（再后来她也没了。这件事就没人能给你作证了。）' },

        { k: 'thing', t: '（门外那一声，你后来在店里又听见过一次。）' },
        { k: 'thing', t: '（那天深夜，有人在门外叫你的名字。叫得很轻，像怕吵醒谁。）' },
        { k: 'thing', t: '（你没开门。叫了三声，就没有了。）' },

        { k: 'back', q: 1, t: '喊魂要喊三夜，是因为头两夜，魂不认得路。' },
        { k: 'back', q: 1, t: '第三夜认得了，才敢应。' },
        { k: 'back', t: '（他看着门。）' },
        { k: 'back', q: 1, t: '也有人说，第三夜应的那个，不是魂。' },
        { k: 'back', t: '（他没再往下说。）' },
      ],
    },
    {
      id: 'wed', no: '五', name: '配 阴 亲',
      lines: [
        { k: 'old', t: '（老人说：没成家的年轻人走了，家里要给配一门亲。）' },
        { k: 'old', t: '（红纸写生辰，两家换庚帖。一方的名字写在纸上，烧过去。）' },
        { k: 'old', t: '（烧过去了，就算成了亲。成了亲，坟能并在一起，牌位能进一个龛。）' },
        { k: 'old', t: '（不配的是孤坟。孤坟不能进祖坟地。）' },
        { k: 'old', t: '（配阴亲不看岁数，看八字。差三十岁也配。）' },

        { k: 'street', t: '（这条街上出过一回。）' },
        { k: 'street', t: '（八七年，理发店第三把椅子上没的那个姑娘，二十岁。）' },
        { k: 'street', t: '（她没出门子。家里给她配了一门亲。）' },
        { k: 'street', t: '（男方姓什么，街上没人说得清。只知道是邻县的，比她小两岁，也没成家。）' },
        { k: 'street', t: '（庚帖换了。红纸烧了。坟并了。）' },
        { k: 'street', t: '（那年冬天她妈来剪过一次头。剪完了坐着不走，看着镜子。）' },
        { k: 'street', t: '（镜子里那把椅子是空的。她说：这样也好，总算有个地方埋。）' },
        { k: 'street', t: '（后来她每年清明上两份坟。一份给女儿，一份给那个没见过面的女婿。）' },

        { k: 'thing', t: '（里间侧面，有一双红绣鞋。）' },
        { k: 'thing', t: '（鞋底是新的。没沾过土。）' },

        { k: 'back', q: 1, t: '配阴亲，配的是活人的心安。' },
        { k: 'back', q: 1, t: '死人不挑。' },
        { k: 'back', t: '（他把灯挪近了一点。）' },
        { k: 'back', q: 1, t: '可庚帖上那个名字，谁写的，谁就得记一辈子。' },
      ],
    },
    {
      id: 'corpse', no: '六', name: '赶 尸',
      lines: [
        { k: 'old', t: '（老人说：赶尸的走夜路，天亮前住店。）' },
        { k: 'old', t: '（进门先喊一声：赶尸的，借宿。店里的人听见了，把门板卸下来靠墙立着。）' },
        { k: 'old', t: '（尸首靠门板站着，脸上盖布。赶尸的睡在门口。）' },
        { k: 'old', t: '（一路上摇铃。铃一响，活人让路。）' },
        { k: 'old', t: '（不是怕。是规矩。让了路，尸首不绕道；绕了道，就回不了家。）' },
        { k: 'old', t: '（赶尸的不送无名尸。没名字的，送不回去。）' },

        { k: 'street', t: '（这条街上出过一回。）' },
        { k: 'street', t: '（这条路以前是官道。往西走，翻两道岭，就是贵州。）' },
        { k: 'street', t: '（老人说夜里听见过铃铛。叮，叮，不快，隔一会儿一下。）' },
        { k: 'street', t: '（听见的人都不探头。有一年探过头的，第二天门口多了个脚印。）' },
        { k: 'street', t: '（后来公路修通了，就没有赶尸的了。）' },
        { k: 'street', t: '（再后来，连铃铛声也没人提了。）' },

        { k: 'thing', t: '（里间侧面那件东西，是一只铜铃。）' },
        { k: 'thing', t: '（铃身上有一道磨痕，是绳子勒的。摇了太多年。）' },
        { k: 'thing', t: '（你摇了一下。声音不大。）' },
        { k: 'thing', t: '（可是街那头，好像有什么东西停了一下。）' },

        { k: 'back', q: 1, t: '赶尸的铃，不是给死人听的。' },
        { k: 'back', q: 1, t: '是给活人听的。听见了，你让开。' },
        { k: 'back', t: '（他把铃接过去，放回原处。）' },
        { k: 'back', q: 1, t: '这条街上，让路的人越来越少了。' },
      ],
    },
    {
      id: 'cave', no: '七', name: '落 花 洞',
      lines: [
        { k: 'old', t: '（老人说：山里有洞神，年年娶亲。）' },
        { k: 'old', t: '（娶的姑娘进了洞就不出来。家里说是嫁了，还办酒。）' },
        { k: 'old', t: '（酒是红的，人不许哭。哭了是不认这门亲，洞神要发火。）' },
        { k: 'old', t: '（嫁过去的姑娘，娘家能得一份彩礼。粮食，布，有时候是一头猪。）' },
        { k: 'old', t: '（过几年日子好过了，就说姑娘在洞里过得好。）' },
        { k: 'old', t: '（没人问，洞里到底有什么。）' },

        { k: 'street', t: '（这条街上出过一回。）' },
        { k: 'street', t: '（民国廿六年，后山娶过一次亲。）' },
        { k: 'street', t: '（姑娘姓林，十八岁。上轿那天穿着一身红，盖头是借的。）' },
        { k: 'street', t: '（轿子抬到山口就停了。剩下的一段路，得她自己走。）' },
        { k: 'street', t: '（她自己走进去的。走的时候没回头。）' },
        { k: 'street', t: '（那年秋天，她家盖了三间新房。）' },
        { k: 'street', t: '（后来有人进山砍柴，说在一个洞口看见过一只鞋。红的。）' },
        { k: 'street', t: '（没人敢进去捡。）' },

        { k: 'thing', t: '（里间第八只柜子，一直是空的。）' },
        { k: 'thing', t: '（三十五个人的行李都在。第三十六格没有行李。）' },
        { k: 'thing', t: '（木匠没给它做门。）' },

        { k: 'back', q: 1, t: '您知道这三十五个格子，为什么都是按人打的吗。' },
        { k: 'back', t: '（他没等你答。）' },
        { k: 'back', q: 1, t: '因为行李是谁的，得有个地方记着。' },
        { k: 'back', t: '（他把灯芯剪了一下。火苗矮了半寸。）' },
        { k: 'back', q: 1, t: '没地方记的，就叫无名氏。' },
      ],
    },
  ];

  /* ---------------- 第八屏：说破 ----------------
     分两页。第一页停在他承认这间店是什么；
     第二页才说他自己。中间那一停，是让他喘口气。
     -------------------------------------------- */
  const REVEAL_A = [
    '（他说得很慢，像在数东西。）',
    { q: 1, t: '这条街，以前叫义庄街。' },
    { q: 1, t: '义庄是停灵的地方。人死在外头，尸首不能进门，先在义庄停着，等家里人来领。' },
    { q: 1, t: '领走的，抬回去埋。没人领的，停满四十九天，就地埋。' },
    '（他抬了抬下巴，指柜台。）',
    { q: 1, t: '这张柜台，以前是停灵的台子。后来才摆上秤，摆上算盘。' },
    { q: 1, t: '秤是称押品的，不是称人的。' },
    '（他停了很久。）',
    { q: 1, t: '三十五件东西，是三十五份没人领的行李。' },
    { q: 1, t: '不是押品。是行李。' },
    '（他伸出三根手指，又收回去一根。）',
  ];

  const REVEAL_B = [
    { q: 1, t: '我在这儿守了八十八年。第一年，我还在等人来领我。' },
    { q: 1, t: '第十年，我就知道不会有人来了。' },
    { q: 1, t: '第三十年，我开始给客人写路引。写一张，烧一张。' },
    { q: 1, t: '写给他们，也写给我自己。都没烧过去。' },
    '（他看着你。）',
    { q: 1, t: '路引得别人写。' },
    { q: 1, t: '自己写的，不算。' },
    '（他把柜台上那张纸钱推到你面前。）',
    { q: 1, t: '这张，写的是您的名字。' },
    { q: 1, t: '可它不是给您的。' },
    '（灯芯爆了一下。）',
    { q: 1, t: '是给他们的。您替他们写完了，他们就能走了。' },
    { q: 1, t: '他们走了，我才能走。' },
  ];

  const Night = {
    inited: false,
    idx: 0,
    rp: 0,
    stage: 'intro',
    _t: 0,

    init() {
      if (this.inited) return;
      this.inited = true;
      const b = $('#nt-next');
      if (b) b.addEventListener('click', () => this.next());
      const p = $('#nt-prev');
      if (p) p.addEventListener('click', () => this.prev());
      const out = $('#nt-out');
      if (out) out.addEventListener('click', () => this.out());
      const tx = $('#ng-text');
      if (tx) tx.addEventListener('scroll', () => this.more());
      window.addEventListener('resize', () => {
        if (global.App && global.App.current === 'night') this.fit();
      });
    },

    /* 供自检与档案册使用 */
    data() { return TALES; },
    introLines() { return INTRO; },
    revealLines() { return REVEAL_A.concat(REVEAL_B); },

    book() {
      const S = global.State;
      S.sys = S.sys || {};
      if (!S.sys.night) S.sys.night = { read: [], done: false };
      return S.sys.night;
    },

    read() { return this.book().read || []; },
    done() { return !!this.book().done; },

    /* 打烊之后才开讲 */
    can() {
      const S = global.State || {};
      const n = S.sys && S.sys.night;
      return (S.ch6 >= 2) || !!S.ch7 || !!(n && n.done);
    },

    async start(fromSave) {
      this.init();
      if (!this.can()) {
        if (global.G && global.G.Toast) global.G.Toast.show('还没打烊。', 1800);
        return;
      }
      const S = global.State;
      S.sys = S.sys || {};
      S.sys.night = S.sys.night || { read: [], done: false };
      this.stage = 'intro';
      this.idx = 0;
      if (global.App) global.App.show('night');
      await this.paint(INTRO, 'intro');
      if (fromSave) {
        const rd = this.read();
        if (rd.length && rd.length < TALES.length) this.idx = rd.length;
      }
      this.render();
    },

    /* 一屏一段，逐句点亮 */
    async paint(lines, stage) {
      const box = $('#ng-text');
      if (!box) return;
      box.innerHTML = '';
      box.scrollTop = 0;
      const wrap = $('#ng-wrap');
      if (wrap) wrap.dataset.stage = stage;
      for (let i = 0; i < lines.length; i++) {
        const item = lines[i];
        const t = typeof item === 'string' ? item : item.t;
        const p = document.createElement('p');
        p.className = 'ng-l' + (item && item.q ? ' ng-q' : '') + (item && item.k === 'street' ? ' ng-st' : '');
        p.textContent = this.mix(t);
        p.style.animationDelay = Math.min(i, 8) * 70 + 'ms';
        box.appendChild(p);
      }
      const last = box.lastElementChild;
      if (last) last.classList.add('ng-end');
      this.fit();
    },

    /* 一则要一口气读完：长了就把字缩小一点，缩到能一屏为止 */
    fit() {
      const box = $('#ng-text');
      if (!box) return;
      box.classList.remove('ng-mid');
      const base = this.stage === 'reveal' ? 14.4 : 15.2;
      let fs = base;
      box.style.setProperty('--nt-fs', fs.toFixed(2) + 'px');
      for (let k = 0; k < 7; k++) {
        const avail = box.clientHeight;
        const need = box.scrollHeight;
        if (!avail || need <= avail + 2) break;
        fs = Math.max(13.2, fs * Math.max(.9, (avail - 4) / need));
        box.style.setProperty('--nt-fs', fs.toFixed(2) + 'px');
        if (fs <= 13.2) break;
      }
      const small = box.scrollHeight <= box.clientHeight + 2;
      if (small) box.classList.add('ng-mid');
      this.more();
    },

    /* 底下还有没有字没说 */
    more() {
      const box = $('#ng-text');
      const m = $('#ng-more');
      if (!box || !m) return;
      const over = box.scrollHeight > box.clientHeight + 4;
      const atEnd = box.scrollTop + box.clientHeight >= box.scrollHeight - 8;
      m.classList.toggle('on', over && !atEnd);
    },

    mix(t) {
      const S = global.State || {};
      return String(t).replace(/\{NAME\}/g, S.playerName || '陈默');
    },

    render() {
      const rd = this.read();
      const dots = $('#ng-dots');
      if (dots) {
        dots.innerHTML = TALES.map((t, i) =>
          '<i class="ng-dot' + (rd.indexOf(t.id) >= 0 ? ' on' : '') +
          (i === this.idx && this.stage === 'tale' ? ' cur' : '') + '" title="' + t.name + '"></i>').join('');
      }
      const no = $('#ng-no');
      const nm = $('#ng-name');
      const prev = $('#nt-prev');
      const next = $('#nt-next');
      const out = $('#nt-out');
      if (this.stage === 'intro') {
        if (no) no.textContent = '守 夜';
        if (nm) nm.textContent = '七 则';
        if (prev) prev.style.visibility = 'hidden';
        if (next) { next.textContent = '听 他 说'; next.dataset.act = 'first'; }
        if (out) out.style.visibility = 'visible';
        return;
      }
      if (this.stage === 'reveal') {
        if (no) no.textContent = '义 庄 街';
        if (nm) nm.textContent = '说 破';
        if (prev) prev.style.visibility = 'hidden';
        if (next) {
          next.textContent = this.rp === 0 ? '接 着 说'
            : (this.done() ? '回 柜 台' : '收 下 这 张 路 引');
          next.dataset.act = this.rp === 0 ? 'more' : 'close';
        }
        if (out) out.style.visibility = 'hidden';
        return;
      }
      const t = TALES[this.idx] || TALES[0];
      if (no) no.textContent = '其 ' + t.no;
      if (nm) nm.textContent = t.name;
      if (prev) prev.style.visibility = this.idx > 0 ? 'visible' : 'hidden';
      if (next) {
        next.textContent = this.idx >= TALES.length - 1 ? '听 他 说' : '下 一 则';
        next.dataset.act = 'next';
      }
      if (out) out.style.visibility = 'visible';
    },

    async openTale(i) {
      const t = TALES[i];
      if (!t) return;
      this.idx = i;
      this.stage = 'tale';
      const n = this.book();
      if (n.read.indexOf(t.id) < 0) n.read.push(t.id);
      if (global.Save && global.Save.touch) global.Save.touch();
      await this.paint(t.lines, 'tale');
      this.render();
      if (global.Snd) { try { global.Snd.tone(96, 0.5, { type: 'sine', gain: 0.03 }); } catch (e) {} }
    },

    async next() {
      const b = $('#nt-next');
      const act = b && b.dataset.act;
      if (this.stage === 'intro' || act === 'first') { await this.openTale(this.idx); return; }
      if (this.stage === 'reveal' || act === 'close') {
        if (this.stage === 'reveal' && this.rp === 0 && act !== 'close') {
          this.rp = 1;
          await this.paint(REVEAL_B, 'reveal');
          this.render();
          if (global.Snd) { try { global.Snd.tone(84, 0.8, { type: 'sine', gain: 0.03 }); } catch (e) {} }
          return;
        }
        if (this.done()) return this.out();
        return this.seal();
      }
      if (this.idx >= TALES.length - 1) return this.reveal();
      await this.openTale(this.idx + 1);
    },

    async prev() {
      if (this.stage !== 'tale' || this.idx <= 0) return;
      await this.openTale(this.idx - 1);
    },

    async reveal() {
      this.stage = 'reveal';
      this.rp = 0;
      if (global.App) global.App.show('night');
      await this.paint(REVEAL_A, 'reveal');
      this.render();
      if (global.Snd) { try { global.Snd.noise(1.2, { type: 'lowpass', freq: 420, gain: 0.05 }); } catch (e) {} }
    },

    async seal() {
      const n = this.book();
      n.done = true;
      n.at = Date.now();
      const S = global.State;
      S.sys = S.sys || {};
      S.sys.roadPass = true;
      if (global.Save && global.Save.write) global.Save.write();
      if (global.Snd) { try { global.Snd.tone(72, 2.4, { type: 'sine', gain: 0.05, attack: 0.6 }); } catch (e) {} }
      if (global.G && global.G.Toast) global.G.Toast.show('得了一张路引', 3200);
      const box = $('#ng-text');
      if (box) {
        box.innerHTML = '';
        const p = document.createElement('p');
        p.className = 'ng-l ng-q';
        p.textContent = '（你把那张纸钱收进兜里。纸很薄，一捏就软。）';
        box.appendChild(p);
        const q = document.createElement('p');
        q.className = 'ng-l';
        q.textContent = '（灯芯往上蹿了一下，又落回去。）';
        q.style.animationDelay = '420ms';
        box.appendChild(q);
      }
      const next = $('#nt-next');
      if (next) { next.textContent = '回 柜 台'; next.dataset.act = 'close'; }
      const dots = $('#ng-dots');
      if (dots) dots.innerHTML = TALES.map(() => '<i class="ng-dot on"></i>').join('');
    },

    async out() {
      const go = () => {
        if (global.App) global.App.show('counter');
        if (global.Counter && global.Counter.updateHint) global.Counter.updateHint();
      };
      if (global.Fade && global.Fade.through) await global.Fade.through(go, false);
      else go();
      this.stage = 'intro';
      this.rp = 0;
      try { if (global.Save && global.Save.write) global.Save.write(); } catch (e) {}
      if (global.G && global.G.Toast) global.G.Toast.show('灯还亮着。', 1600);
    },

    /* Esc：先放着 */
    escBack() {
      if (this.stage === 'reveal' && !this.done()) {
        if (global.G && global.G.Toast) global.G.Toast.show('先听完。', 1400);
        return true;
      }
      this.out();
      return true;
    },
  };

  global.Night = Night;
})(window);
