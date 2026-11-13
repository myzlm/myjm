/* ============================================================
   folklore.js — 物证 / 谎话 / 民间说法
   这一章的规矩：艾说的每句话，都能在店里找到反证。
   ============================================================ */
(function (global) {
  'use strict';
  const State = global.State;
  const G = global.G;

  /* ============================================================
     物证：六件东西，对应他六句话
     ============================================================ */
  const PROOFS = {
    ticket: {
      id: 'ticket', name: '一张汽车票', icon: '票', where: '柜台底下',
      claim: 'doorOne',
      text: [
        '（一张硬纸片，压在柜台腿下面，边角被踩得起了毛。）',
        '1998 年 8 月 12 日　青石桥 → 柳河集　票价三元六角',
        '（票根背面有铅笔字：下午三点，带伞。）',
        '（柳河集是你老家那个乡。1998 年，你还没有柜台高。）',
      ],
    },
    page34: {
      id: 'page34', name: '账本残页', icon: '页', where: '抽屉底下',
      claim: 'noPain',
      text: [
        '（木匣底下压着一张残页，是从账本上撕下来的，只剩半行。）',
        '「……押后第七日，仍夜夜起身，至门口，呼一名。」',
        '（墨迹很淡，是被手指反复摸淡的。）',
      ],
    },
    margin: {
      id: 'margin', name: '页脚的另一行字', icon: '字', where: '抵押账 · 页脚',
      claim: 'detail',
      text: [
        '（账本合上之前，你看见页脚还有一行，被上面那条压着。）',
        '「齿深者，锁不住。太细的东西认主；认了主，就自己开门走了。」',
        '（下面还有一行更小的，几乎是用针尖划的：别跟客人说。）',
      ],
    },
    calendar: {
      id: 'calendar', name: '停住的黄历', icon: '历', where: '墙上',
      claim: 'papers',
      text: [
        '（墙上挂着一本黄历，纸边卷成了筒。）',
        '停在一页：七月十五。宜：祭祀。忌：出行、动土、夜哭。',
        '（整本都被圈过同一个日子。圈到纸破，破了再圈。）',
        '（页脚印着：今日值日——牛头、马面。）',
      ],
    },
    joss: {
      id: 'joss', name: '一张寄给你的纸钱', icon: '钱', where: '柜台上',
      claim: 'name',
      text: [
        '（柜台上压着一叠黄纸，剪成铜钱的样式。是找零。）',
        '（最上面那张翻过来，两行小楷：）',
        '「寄：{NAME} 收」',
        '「魂归故里，路引一张」',
        '（字是你的笔迹。可你不记得自己写过。）',
      ],
    },
    carving: {
      id: 'carving', name: '柜台内侧的刻字', icon: '刻', where: '柜台底下',
      claim: 'keeper',
      text: [
        '（你把灯挪低，照柜台内侧。木头上有一行刀刻的小字，刻得很深，被摸得发亮。）',
        '「艾。民国廿六年。押。」',
        '（后面还有两个字，小得多：第一。）',
        '（"押"字后面本来还有一个字，被磨平了。你认了很久，认出来是个"身"。）',
      ],
    },
  };

  /* ============================================================
     六句话：他怎么说的 / 被拆穿之后
     ============================================================ */
  const CLAIMS = {
    doorOne: {
      id: 'doorOne', proof: 'ticket',
      quote: '这店里只有一扇门。我没出去过。',
      deny: [
        '（他把车票捏在两根指头之间，对着灯看。纸太旧，光透过去，是红的。）',
        '唔。这个啊。捡的。',
        '柜台上什么都会掉下来。您也知道——这地方不干净。',
        '（他把票压回柜台底下，压得很仔细，四个角都按了一遍。）',
        '（可他自己刚才说，他没出去过。票是从外面带回来的。）',
      ],
      leak: '（他按票的那只手，指甲缝里是黑的。是外面的土。）',
    },
    noPain: {
      id: 'noPain', proof: 'page34',
      quote: '抵押了就不疼。只是那块地方会空出来。',
      deny: [
        '（他看着那半行字，看了很久。灯芯爆了一下。）',
        '那是别人。',
        '账上写的，不一定是我记的。',
        '（他说完就闭了嘴，像咬到了舌头。）',
      ],
      leak: '（"夜夜起身，至门口，呼一名"——他每天都在门口叫一个名字。）',
    },
    detail: {
      id: 'detail', proof: 'margin',
      quote: '记忆越细，钥匙越好。您说得越清楚，我记起来越不费劲。',
      deny: [
        '（他把账本合上，手掌压在封面上，压得很平。）',
        '这句不是我写的。',
        '这本账，前面换过七个人。',
        '（他说完自己愣了一下。）……七个。是七个吧。',
      ],
      leak: '（前面换过七个人。那"三十五个"，是三十五个客人，还是七个人来了三十五趟？）',
    },
    papers: {
      id: 'papers', proof: 'calendar',
      quote: '（抽屉里）都在。三十五个。',
      deny: [
        '（黄历被你翻得哗哗响。他伸手来按，慢了一步。）',
        '圈的是我自己的日子。',
        '老了，记不住初一十五。',
        '（可三十五张纸，圈的是同一天。圈了三十五次。）',
      ],
      leak: '（七月十五，鬼门开。他等的不是客人——他等的是门开。）',
    },
    name: {
      id: 'name', proof: 'joss',
      quote: '您没说过名字。我也没问。',
      deny: [
        '（他把那张纸钱翻过来看了看，又翻回去。）',
        '您进门的时候，报过名字。',
        '（你报过姓。全名，你没有说过。）',
        '（他的手指在第一个字上停了一下，像在确认笔画。）',
      ],
      leak: '（这张纸钱是"寄"出去的。寄给谁，就说明谁已经不在这一头了。）',
    },
    keeper: {
      id: 'keeper', proof: 'carving',
      quote: '我是这里的掌柜。',
      deny: [
        '（他低头看那行刻字。灯光照不到他的脸。）',
        '掌柜的，也得有个名分。',
        '（他把手从柜台上收回去，放进袖子里。）',
        '（袖口往下滑了一点。手腕上有一圈很旧的疤，像被绳子捆过。）',
      ],
      leak: '（"押"字后面磨掉的那个字，是"身"。押身。他押的是他自己。）',
    },
  };

  const CLAIM_ORDER = ['doorOne', 'noPain', 'detail', 'papers', 'name', 'keeper'];

  /* ============================================================
     民间说法：气氛物件，也给叫魂那一关的规矩
     ============================================================ */
  const FOLK = {
    lamp: {
      title: '长明灯',
      early: [
        '（柜台上有一盏油灯。火苗只有豆大，一动不动。）',
        '（没有风。可火苗朝你偏了一点。）',
      ],
      late: [
        '（灯油是黄的，凑近了有一股很淡的甜味。）',
        '（灯盏底下压着东西——压得很平，像怕被风吹走。）',
        '（老人说过：这灯不能灭。灭了，就不是店里等人，是等店里的人。）',
      ],
    },
    bowl: {
      title: '水碗',
      early: [
        '（柜台上放着一只粗瓷碗，碗里半碗水。）',
        '（水面上立着一根筷子。立得很直。）',
        '（乡下有这说法：水碗立筷，是旁边站着人。筷子倒了，人就走了。）',
      ],
      late: [
        '（筷子没倒。）',
        '（你退开两步，又退开一步。它还是没倒。）',
        '（碗里的水一点波纹都没有。）',
      ],
    },
    under: {
      title: '柜台底下',
      once: [
        '（你蹲下去。柜台底下很暗，积着一层灰。）',
        '（灰上有两道拖痕，从门口一直拖到柜台后面。拖痕很宽，不像箱子。）',
        '（腿脚之间压着一张硬纸片。你把它抽出来。）',
      ],
      twice: [
        '（你把灯挪低，照柜台内侧。）',
        '（木头上有一行刀刻的小字，刻得很深，被摸得发亮。）',
      ],
      after: [
        '（柜台底下没什么了。灰上的拖痕还在。）',
        '（你试着用手比了比宽度。刚好是一个人躺着的宽度。）',
      ],
    },
  };

  /* ============================================================
     Lies
     ============================================================ */
  const Lies = {
    init() {
      if (!State.proofs) State.proofs = {};
      if (!State.pressed) State.pressed = {};
      if (typeof State.exposed !== 'number') State.exposed = 0;
      if (typeof State.openedUnder !== 'number') State.openedUnder = 0;
    },

    has(id) { this.init(); return !!State.proofs[id]; },

    /* 拿到物证 */
    gain(id) {
      this.init();
      if (State.proofs[id]) return false;
      const p = PROOFS[id];
      if (!p) return false;
      State.proofs[id] = 1;
      global.Snd.ok();
      if (G.Toast) G.Toast.show('证物 · ' + p.name, 3000);
      if (global.Press) global.Press.refresh();
      if (global.Counter && global.Counter.inited) global.Counter.refreshHud();
      return true;
    },

    /* 已拿到的物证 id 列表 */
    list() {
      this.init();
      return Object.keys(PROOFS).filter((id) => State.proofs[id]);
    },

    /* 可以对质的谎：有物证、还没对过 */
    ready() {
      this.init();
      return CLAIM_ORDER.filter((cid) => {
        const c = CLAIMS[cid];
        return c && State.proofs[c.proof] && !State.pressed[cid];
      });
    },

    /* 还差什么才能拆穿这条 */
    missing(cid) {
      const c = CLAIMS[cid];
      if (!c) return null;
      if (State.pressed[cid]) return null;
      if (State.proofs[c.proof]) return null;
      return PROOFS[c.proof];
    },

    total() { return CLAIM_ORDER.length; },

    /* 对质：返回他的反应行，并记一次拆穿 */
    confront(cid) {
      this.init();
      const c = CLAIMS[cid];
      if (!c || State.pressed[cid] || !State.proofs[c.proof]) return null;
      State.pressed[cid] = 1;
      State.exposed = Object.keys(State.pressed).length;
      global.Snd.tone(120, 0.9, { type: 'sine', gain: 0.06, attack: .2 });
      if (global.Press) global.Press.refresh();
      if (global.Counter && global.Counter.inited) global.Counter.refreshHud();
      return c.deny;
    },

    allExposed() {
      this.init();
      return State.exposed >= CLAIM_ORDER.length;
    },

    /* 物证文本（名字替换） */
    proofText(id) {
      const p = PROOFS[id];
      if (!p) return [];
      const nm = State.playerName || '陈默';
      return p.text.map((t) => t.replace('{NAME}', nm));
    },
  };

  global.PROOFS = PROOFS;
  global.CLAIMS = CLAIMS;
  global.CLAIM_ORDER = CLAIM_ORDER;
  global.FOLK = FOLK;
  global.Lies = Lies;
})(window);
