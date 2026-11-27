/* ============================================================
   sides.js — 旁支
   ------------------------------------------------------------
   店里原来只有一条路：柜台、抽屉、胶片、门。
   走完了，这间屋子就没什么可看的了。

   旁支不是任务，也不是奖励。它们是"他在等你问"的那些话，
   一直压在柜台底下，等一个人问对。

   十三条，散在六章里：
     序章  草稿箱里那封没发出去的信
     第一章 契约背面那三条（他自己添上去的）
     第二章 九条 —— 从撕纸到纺车，从完美钥匙到三十七个名字
     第五章 第 000 行
     第七章 街对面那扇空号的门

   每一条都只开一次。开完记在 sys.sideDone 里，
   跟着存档走；结局册会知道你已经问过。
   ============================================================ */
(function (global) {
  'use strict';

  const { $, wait, Toast } = global.G;
  const S = () => global.State;
  const sy = () => { const s = S(); s.sys = s.sys || {}; return s.sys; };
  const done = (id) => !!(sy().sideDone && sy().sideDone[id]);

  function mark(id) {
    const s = sy();
    s.sideDone = s.sideDone || {};
    if (s.sideDone[id]) return false;
    s.sideDone[id] = 1;
    if (global.Save) { try { global.Save.touch(); } catch (e) {} }
    if (global.Ach) { try { global.Ach.scan(); } catch (e) {} }
    return true;
  }

  function give(id, name) {
    const C = global.Counter;
    if (C && C.addItem) C.addItem(id, name);
    else { const s = S(); s.inv = s.inv || {}; s.inv[id] = name; }
    if (global.Save) { try { global.Save.touch(); } catch (e) {} }
    if (Toast) Toast.show('拿到了：' + name, 2400);
  }

  /* ============================================================
     十三条。ch 是它属于哪一章，where 是入口。
     ============================================================ */
  const LIST = [
    {
      id: 'draft', ch: 0, no: '序 · 一', title: '草稿箱', scene: 1,
      where: '序章 · 收件箱左侧「草稿(1)」',
      brief: '一封写给「妈」的信，写了三行，没有发。', 
    },
    {
      id: 'fine', ch: 1, no: '一 · 一', title: '背面那三条', scene: 1,
      where: '第一章 · 登记表背面',
      brief: '他自己添上去的三条细则。第三条是给自己留的。',
    },
    {
      id: 'torn', ch: 2, no: '二 · 一', title: '粘回去',
      where: '第二章 · 撕过纸人以后，问他',
      brief: '他把你撕掉的那几张捡起来了，拼过，拼不上。',
    },
    {
      id: 'sound', ch: 2, no: '二 · 二', title: '纺车',
      where: '第二章 · 押掉「墙里的声音」以后',
      brief: '他也押过一个声音。碗还在，碗底是漏的。',
    },
    {
      id: 'perfect', ch: 2, no: '二 · 三', title: '两把完美的钥匙',
      where: '第二章 · 拿到完美钥匙',
      brief: '第一把给了一个女孩。她开了门，没进去。',
    },
    {
      id: 'fine2', ch: 2, no: '二 · 四', title: '第三十六条，由本人填写',
      where: '第二章 · 读过契约背面以后，问他',
      brief: '他写这一条的时候手在抖。',
    },
    {
      id: 'draft2', ch: 2, no: '二 · 五', title: '三十七封没寄出的信',
      where: '第二章 · 写过草稿以后，问他',
      brief: '收件人都是一个人。三十七年，每封三句。',
    },
    {
      id: 'names', ch: 2, no: '二 · 六', title: '七个名字',
      where: '第二章 · 用纸眼看过四处以后',
      brief: '三十五个名字，其实是七个人。来了三十五趟。',
    },
    {
      id: 'verify2', ch: 2, no: '二 · 七', title: '第二回说得短一点',
      where: '第二章 · 核验过两次以后',
      brief: '短的那一段，才是自己的。',
    },
    {
      id: 'guest', ch: 2, no: '二 · 八', title: '门口那个人',
      where: '第二章 · 当完班回来',
      brief: '昨天七个人里有一个回来了，问今天还写不写。',
    },
    {
      id: 'street2', ch: 2, no: '二 · 九', title: '玻璃柜里的纸',
      where: '第二章 · 从街上回来',
      brief: '你手里那张纸，最后怎么处置的。',
    },
    {
      id: 'zero', ch: 5, no: '五 · 一', title: '第 000 行', scene: 1,
      where: '第五章 · 名单底下那行小字',
      brief: '一行没有编号的记录：押品一栏写着「时间」。',
    },
    {
      id: 'six', ch: 7, no: '七 · 一', title: '街对面', scene: 1,
      where: '第七章 · 玻璃柜之后，街对面那扇门',
      brief: '门牌 06。没人住。门缝里透出灯。',
    },
  ];

  /* ============================================================
     第二章：九条话题
     ============================================================ */
  const MENU = [
    { id: 'torn', when: () => (sy().hurt || 0) >= 1, text: '你撕的那几张，我收着了。' },
    { id: 'sound', when: () => S().wish === 'sound', text: '我押的那个声音，你也听过？' },
    { id: 'perfect', when: () => S().keyQ === 'perfect', text: '完美那把，你交过几把。' },
    { id: 'fine2', when: () => !!sy().fineRead, text: '背面那三条，是你写的。' },
    { id: 'draft2', when: () => !!sy().draft, text: '我写过一封信，没发。' },
    { id: 'names', when: () => !!sy().paperAll, text: '三十五个名字，其实是七个。' },
    { id: 'verify2', when: () => (sy().verified || 0) >= 2, text: '我押了两回，两回说的不一样。' },
    { id: 'guest', when: () => { const d = sy().duty; return !!(d && (d.picks || []).length >= 7); }, text: '门口那个人，今天还站着吗。' },
    { id: 'street2', when: () => { const s = sy().street; return !!(s && s.end); }, text: '街尽头那个玻璃柜。' },
  ];

  /* ============================================================
     节点
     ============================================================ */
  const N = {

    /* ---------- 旁支的门口 ----------
       十七条一次摆出来，菜单会长到屏幕外面去。
       所以只摆一扇门：里面还有几件，进去再说。 */
    sd_hub: {
      who: '艾',
      lines: ['（他把手放下，等你问。）'],
      choices: () => {
        const list = (global.Sides && global.Sides.hubChoices) ? global.Sides.hubChoices() : [];
        list.push({ text: '先不问了。', to: 'menu' });
        return list;
      },
    },

    /* ---------- 二 · 一  粘回去 ---------- */
    sd_torn: {
      who: '艾',
      lines: [
        '（他把抽屉拉开一半，又推回去。抽屉里有一声响，像纸。）',
        '你撕的那几张，我捡起来了。',
        '（他把纸片倒在柜台上。不是一整张——是很多片。他按撕口拼过一次，拼不成。）',
        '拼不上。撕的时候手很稳，撕完就散了。',
        '我留着。不是舍不得——是怕它跟别的东西混在一起。',
        '前年也有一个。撕了一张，走的时候脸是白的。',
        '三个月以后她寄来一封信。信里只有一句：谢谢你，我不敢。',
        '（他把纸片推到你面前。）',
        '你要不要，把它们粘回去。',
      ],
      choices: [
        { text: '粘。', to: 'sd_torn_a' },
        { text: '不粘。撕了就是撕了。', to: 'sd_torn_b' },
        { text: '烧了。', to: 'sd_torn_c' },
      ],
    },
    sd_torn_a: {
      who: '艾',
      lines: [
        '（他从柜台底下摸出一小碟浆糊。浆糊是温的。）',
        '（你一片一片对。对到第四片，指头上就全是浆糊。）',
        '（拼出来的那张脸，眉眼比原来淡，但不歪。）',
        '（他看了看，说：「像。」）',
        '（然后他把纸压回抽屉，压在原来那一沓下面。）',
        '（他一直没说像谁。）',
      ],
      next: 'sd_hub',
      enter: () => {
        sy().glued = 1;
        mark('torn');
        if (global.Ach) global.Ach.give('glue');
      },
    },
    sd_torn_b: {
      who: '艾',
      lines: [
        '（你把纸片推回去。）',
        '（他点点头，也不失望。）',
        '「有的人是这样的。」他说，「撕了就是撕了。」',
        '「粘回去，是给活人看的。」',
        '（他把纸片收进抽屉，动作很轻，像收一副筷子。）',
      ],
      next: 'sd_hub',
      enter: () => { sy().leftTorn = 1; mark('torn'); },
    },
    sd_torn_c: {
      who: '艾',
      lines: [
        '（你把纸片拿到灯上。）',
        '（他伸手拦了一下，又收回去了。）',
        '（纸烧得很快，没有烟。灰落在柜台上，很薄一层。）',
        '（他用手背把灰扫进碗里。）',
        '「这样也行。」他说，「省得我明年还得拿出来看一遍。」',
        '（碗里的水动了一下，又平了。）',
      ],
      next: 'sd_hub',
      enter: () => { sy().burnedTorn = 1; mark('torn'); },
    },

    /* ---------- 二 · 二  纺车 ---------- */
    sd_sound: {
      who: '艾',
      lines: [
        '（他没有立刻答。他把手放在柜台上，五个指头分开，像按在一个看不见的东西上。）',
        '你押的那个声音——墙里的。哒，哒哒。',
        '我这儿也有一个。',
        '不是墙里的。是我妈的纺车。',
        '我七岁，她坐在窗底下纺线。轮子转起来是那种很低的嗡嗡，比说话还低。',
        '她走了以后，我还能听见。夜里一躺下就听见。',
        '后来我把它押了。',
        '押完，我还记得「有过一个声音」。就是不记得是什么声音了。',
        '（他把手收回去。）你知道那是什么感觉吗。',
        '像一只碗。碗还在，碗底是漏的。',
      ],
      choices: [
        { text: '我替你记着。', to: 'sd_sound_a' },
        { text: '还能找回来吗。', to: 'sd_sound_b' },
        { text: '（不说话）', to: 'sd_sound_c' },
      ],
    },
    sd_sound_a: {
      who: '艾',
      lines: [
        '（他抬起眼看你，看了很久。）',
        '记着也没用。你记着，我这儿还是空的。',
        '（停了一下。）',
        '……不过你要是记着，那它就没有全没。',
        '（他把柜台上那只碗往你那边推了半寸。）',
        '（碗里的水晃了一下。筷子没倒。）',
      ],
      next: 'sd_hub',
      enter: () => { sy().keepSound = 1; mark('sound'); },
    },
    sd_sound_b: {
      who: '艾',
      lines: [
        '找不回来了。押出去的东西，不往回走。',
        '不过有一个笨办法。',
        '你把耳朵贴在柜台上，听。',
        '（你贴上去。木头是凉的，里面有很轻的嗡嗡。）',
        '「听见了？」他说，「那是这间屋子。不是她。」',
        '（你没有起来。嗡嗡声一直在，像很远的地方有人在纺线。）',
      ],
      next: 'sd_hub',
      enter: () => { sy().echoTried = 1; mark('sound'); },
    },
    sd_sound_c: {
      who: '艾',
      lines: [
        '（你没有接话。他也没有再往下说。）',
        '（过了很久，他把手从柜台上收回去。）',
        '「不说也好。」他说，「说出来，就变成别人的事了。」',
        '（灯芯爆了一下。）',
      ],
      next: 'sd_hub',
      enter: () => { sy().soundQuiet = 1; mark('sound'); },
    },

    /* ---------- 二 · 三  两把完美的钥匙 ---------- */
    sd_perfect: {
      who: '艾',
      lines: [
        '（他看着你手里那把钥匙，没有伸手。）',
        '完美。十九年，我只交过两把。',
        '第一把给了一个女孩。她押的是六月七号上午。',
        '她要那把钥匙，是想开门回去，把那一场考完。',
        '门开了。她站在门口，一只脚在里面。',
        '（他停了很久。）',
        '她没进去。',
        '她说，进去了还是那个考场。她说她不想再闻那个味道。',
        '后来她把钥匙留在锁里，走了。走的时候是笑着的。',
        '第二把在我这儿。一直没用。',
      ],
      choices: [
        { text: '你为什么不用。', to: 'sd_perfect_a' },
        { text: '她后来怎么样了。', to: 'sd_perfect_b' },
        { text: '这把，我也不用。', to: 'sd_perfect_c' },
      ],
    },
    sd_perfect_a: {
      who: '艾',
      lines: [
        '用一次，就得有一个人在外面等。',
        '（他把灯芯剪短。）',
        '我等了十九年。等一个人来替我。',
        '（他抬眼看你。）你说，这算不算一种生意。',
        '（你没有答。他把钥匙往你那边推了推。）',
      ],
      next: 'sd_hub',
      enter: () => { sy().perfectWhy = 1; mark('perfect'); },
    },
    sd_perfect_b: {
      who: '艾',
      lines: [
        '不知道。这店里不打听出去了的人。',
        '（他想了想。）',
        '不过我猜她还活着。',
        '笑得出来的人，一般都能活。',
        '（他把账本翻过一页，页脚有一道折痕，折了很多年。）',
      ],
      next: 'sd_hub',
      enter: () => { sy().perfectGirl = 1; mark('perfect'); },
    },
    sd_perfect_c: {
      who: '艾',
      lines: [
        '（他看了你一眼，很短。）',
        '「话别说太早。」他说。',
        '（他把钥匙从柜台上拿起来，放回你手心里，凉的。）',
        '「门就在那儿。它不急。」',
        '「急着开门的，都是外面的人。里面的人从来不急。」',
      ],
      next: 'sd_hub',
      enter: () => { sy().perfectHold = 1; mark('perfect'); },
    },

    /* ---------- 二 · 四  第三条 ---------- */
    sd_fine2: {
      who: '艾',
      lines: [
        '（他把手掌翻过来，又翻回去。）',
        '背面那三条，是我写的。不是店里原有的。',
        '第一条，押品离手，不再归还。这一条是老规矩，我抄的。',
        '第二条，记录可被覆盖三十五次。这一条我改了——原来写的是「无数次」。',
        '第三条，第三十六条记录，由本人填写。',
        '（他停了一下。）',
        '第三条是给谁写的，你猜得到。',
        '我写这一条的时候手在抖。不是怕。',
        '是那天我已经很久没写过自己的名字了。',
      ],
      choices: [
        { text: '你从来没填过。', to: 'sd_fine2_a' },
        { text: '你是在给自己留后路。', to: 'sd_fine2_b' },
        { text: '那三条，我也可以写在别的地方。', to: 'sd_fine2_c' },
      ],
    },
    sd_fine2_a: {
      who: '艾',
      lines: [
        '没有。',
        '（他把账本合上。）',
        '填了，我就得站起来。站起来，就得往外走。',
        '（他把手按在封面上。）',
        '我忘了外面是什么样了。',
        '忘了的东西，不敢要。',
      ],
      next: 'sd_hub',
      enter: () => { sy().fineNever = 1; mark('fine2'); },
    },
    sd_fine2_b: {
      who: '艾',
      lines: [
        '（他笑了一下。）',
        '后路这个词，听着像算计。',
        '（他把灯拨亮。）',
        '其实就是一句：万一呢。',
        '人要是连「万一」都不给自己留，坐不住十九年。',
        '（他补了一句，很轻。）坐不住十九年的人，也等不到你来问这句。',
      ],
      next: 'sd_hub',
      enter: () => { sy().fineBack = 1; mark('fine2'); },
    },
    sd_fine2_c: {
      who: '艾',
      lines: [
        '（他抬头。）「写在哪儿？」',
        '（你没有答。）',
        '（他低下头，把纸翻回去。）',
        '「……算了。」他说，「当我没问。」',
        '（可他翻纸的手停在那儿，很久没有动。）',
      ],
      next: 'sd_hub',
      enter: () => { sy().fineElse = 1; mark('fine2'); },
    },

    /* ---------- 二 · 五  三十七封信 ---------- */
    sd_draft2: {
      who: '艾',
      lines: [
        '你在楼上那台机器上，写了一封没发的信。',
        '我看见了。不是偷看——这店里的纸，写过的都会响一下。',
        '（他拉开抽屉。里面有一沓信，用麻绳捆着，绳结打得很旧。）',
        '这些也是。都是没发出去的。',
        '收件人全是一个人。',
        '（他把那沓信放在柜台上，没有解开绳子。）',
        '我写过三十七年。一年一封。',
        '第一封是民国三十六年。最后一封，是去年。',
        '没有一封寄出去。寄出去要地址。',
        '我不知道她在哪儿。',
      ],
      choices: [
        { text: '念一封。', to: 'sd_draft2_a' },
        { text: '为什么不写别的。', to: 'sd_draft2_b' },
        { text: '地址可以写这儿。', to: 'sd_draft2_c' },
      ],
    },
    sd_draft2_a: {
      who: '艾',
      lines: [
        '（他解开绳子，抽出最上面那封。纸脆得像饼干。）',
        '「妈：今年收成不好，但我吃得饱。」',
        '「我这里一切都好。您不用惦记。」',
        '（落款的地方空着。）',
        '（他把信折回去。）',
        '「就这三句。三十七年，每封都是这三句。」',
        '（停了一下。）「写第四句，我怕她当真。」',
      ],
      next: 'sd_hub',
      enter: () => { sy().readDraft = 1; mark('draft2'); if (global.Ach) global.Ach.give('letter'); },
    },
    sd_draft2_b: {
      who: '艾',
      lines: [
        '别的话，写下来就成了真的。',
        '（他把绳子重新系上。）',
        '我这行当，最怕话变成真的。',
        '（他把那沓信推回抽屉，推得很慢。）',
      ],
      next: 'sd_hub',
      enter: () => { sy().draftWhy = 1; mark('draft2'); },
    },
    sd_draft2_c: {
      who: '艾',
      lines: [
        '（他愣住了。）',
        '（很久，他把那沓信推回抽屉。）',
        '「……不了。」他说。',
        '「这儿的地址，寄不出去。」',
        '（他把抽屉合上，用两只手，像合一口箱子。）',
      ],
      next: 'sd_hub',
      enter: () => { sy().draftAddr = 1; mark('draft2'); },
    },

    /* ---------- 二 · 六  七个名字 ---------- */
    sd_names: {
      who: '艾',
      lines: [
        '（他没有问你看见了什么。）',
        '那我问你一句：你看见几个名字。',
        '三十五个，对不对。',
        '（他把手按在柜台上。）',
        '其实是七个。',
        '同一个人的名字，写法不一样。有人写全名，有人只写姓，有一个人每次都换个字。',
        '我按写法分了七堆。七堆，一个人。',
        '来了三十五趟。',
        '（他抬眼看你。）现在你明白，为什么我从来不问您叫什么了吧。',
      ],
      choices: [
        { text: '那我呢。我是第几趟。', to: 'sd_names_a' },
        { text: '你分得清吗。', to: 'sd_names_b' },
        { text: '那三十五个纸人——', to: 'sd_names_c' },
      ],
    },
    sd_names_a: {
      who: '艾',
      lines: [
        '第三十六趟。',
        '（他停了一下。）',
        '也可能，是第一趟。',
        '（他把灯芯挑亮。）',
        '这两种说法，我分不出来。',
        '（他补了一句。）分不出来的时候，我就按前面的记。',
      ],
      next: 'sd_hub',
      enter: () => { sy().names7 = 1; mark('names'); },
    },
    sd_names_b: {
      who: '艾',
      lines: [
        '分不清。',
        '纸分得清。我不行。',
        '（他把账本翻开，又合上。）',
        '我看见的都是同一张脸。',
        '（很轻地。）……看久了，连这张脸是谁的，也说不准了。',
      ],
      next: 'sd_hub',
      enter: () => { sy().names7 = 1; mark('names'); },
    },
    sd_names_c: {
      who: '艾',
      lines: [
        '（他点了点头。）',
        '是他们自己不肯走。',
        '（他把灯挑亮一点。）',
        '一个人来三十五趟，总会留下点什么。',
        '留下的那点东西，站久了，就薄了。',
        '薄到最后，成了纸。',
        '（他看了你一眼。）你现在撕的，是他们第三十五趟剩下的那一点。',
      ],
      next: 'sd_hub',
      enter: () => { sy().names7 = 1; mark('names'); },
    },

    /* ---------- 二 · 七  押了两回 ---------- */
    sd_verify2: {
      who: '艾',
      lines: [
        '核验那台东西，不是我造的。',
        '它只认一件事：你说的那一段，是不是你自己看见的。',
        '你说得再细，只要有一点是听来的，它就不给盖章。',
        '三十五年里，一次就过的，只有六个人。',
        '你押了两回。第一回说的，和第二回不一样。',
        '不是记错了。是你第一回说的时候，替别人说了一段。',
        '（他看着你。）',
        '那一段是谁的。',
      ],
      choices: [
        { text: '我母亲的。', to: 'sd_verify2_a' },
        { text: '我不记得了。', to: 'sd_verify2_b' },
        { text: '你怎么知道。', to: 'sd_verify2_c' },
      ],
    },
    sd_verify2_a: {
      who: '艾',
      lines: [
        '（他嗯了一声。）',
        '（他把笔搁下。）',
        '押别人的记忆，是最省事的。',
        '也最容易过不了。',
        '（他把笔尖对准灯。）',
        '因为那不是你的。它不认你。',
      ],
      next: 'sd_hub',
      enter: () => { sy().verifyTold = 1; mark('verify2'); },
    },
    sd_verify2_b: {
      who: '艾',
      lines: [
        '不记得，就是记得。',
        '（他没有再问。）',
        '（过了一会儿，他把那张纸推回来。）',
        '「下回再说的时候，」他说，「说短一点。」',
        '「短的那一段，一般是真的。」',
      ],
      next: 'sd_hub',
      enter: () => { sy().verifyTold = 1; mark('verify2'); },
    },
    sd_verify2_c: {
      who: '艾',
      lines: [
        '因为核验过了两次的人，第二回都会说得短一点。',
        '（他把账本翻过一页。）',
        '不是学会了省话。',
        '是把别人的那一段，删掉了。',
        '（他抬眼看你。）删掉的时候，心里会疼一下。',
        '疼那一下，就是真的。',
      ],
      next: 'sd_hub',
      enter: () => { sy().verifyTold = 1; mark('verify2'); },
    },

    /* ---------- 二 · 八  门口那个人 ---------- */
    sd_guest: {
      who: '艾',
      lines: [
        '（他把门帘掀开一条缝，又放下。）',
        '昨天那七笔，你都写完了。',
        '今天早上有一个人回来了。站在门口，没进来。',
        '他问我，昨天那个写字的人还在吗。',
        '我说在。',
        '他说，那他今天写不写。',
        '（他把手放在账本上。）',
        '我没答。这话得你答。',
      ],
      choices: [
        { text: '写。', to: 'sd_guest_a' },
        { text: '不写了。', to: 'sd_guest_b' },
        { text: '让他进来。', to: 'sd_guest_c' },
      ],
    },
    sd_guest_a: {
      who: '艾',
      lines: [
        '（他朝门外点了一下头。）',
        '（那人坐了一下午。没说话。）',
        '（走的时候，他把一张纸留在椅子上。）',
        '（纸上是他自己的名字。写得很正，一笔一笔的。）',
        '（他大概练了很久。）',
      ],
      next: 'sd_hub',
      enter: () => { sy().guestBack = 'write'; mark('guest'); },
    },
    sd_guest_b: {
      who: '艾',
      lines: [
        '（他往外说了一句。声音不大，刚好够门外听见。）',
        '（门外没有动静。）',
        '（过了一会儿，有脚步声走远了。）',
        '「他明天还会来问。」他说。',
        '「明天我还得这么答。」',
        '（他把账本翻到新的一页，笔尖悬着。）',
      ],
      next: 'sd_hub',
      enter: () => { sy().guestBack = 'stop'; mark('guest'); },
    },
    sd_guest_c: {
      who: '艾',
      lines: [
        '（他起身，把门帘掀开。）',
        '（外面没有人。）',
        '（门槛上有一双鞋，摆得很正，鞋尖朝里。）',
        '（他看了很久，把门帘放下了。）',
        '「进来过了。」他说。',
      ],
      next: 'sd_hub',
      enter: () => { sy().guestBack = 'in'; mark('guest'); },
    },

    /* ---------- 二 · 九  玻璃柜里的纸 ---------- */
    sd_street2: {
      who: '艾',
      lines: [
        '你出去过。街上五个人，你都看过了。',
        '街尽头有一台玻璃柜。你手里那张纸，最后怎么处置的。',
        '（他问得很平，像问今天的账。）',
        '（你答了。）',
      ],
      choices: () => {
        const e = (sy().street && sy().street.end) || 'keep';
        const a = [];
        if (e === 'file') a.push({ text: '塞进柜子了。', to: 'sd_street2_a' });
        if (e === 'tear') a.push({ text: '撕了。', to: 'sd_street2_b' });
        if (e === 'keep') a.push({ text: '揣回来了。', to: 'sd_street2_c' });
        a.push({ text: '（不说了。）', to: 'sd_street2_d' });
        return a;
      },
    },
    sd_street2_a: {
      who: '艾',
      lines: [
        '柜子里就多一张。',
        '（他把手放在账本边上，像按住一样活的东西。）',
        '第八个名字。它会一直在那儿。',
        '（停了一下。）',
        '灯还是那么小，照亮的东西多了一点。',
        '这句话，我以前也说过。',
      ],
      next: 'sd_hub',
      enter: () => { sy().streetTold = 'file'; mark('street2'); },
    },
    sd_street2_b: {
      who: '艾',
      lines: [
        '撕了也好。',
        '（他停了很久。）',
        '撕掉的东西，风会替你收着。',
        '（他抬眼看你。）风收着的东西，早晚会还回来。',
        '「到那时候，你别认。」',
      ],
      next: 'sd_hub',
      enter: () => { sy().streetTold = 'tear'; mark('street2'); },
    },
    sd_street2_c: {
      who: '艾',
      lines: [
        '（他伸出手。）',
        '（你把那张纸放在他手上。他没看，先掂了掂。）',
        '「还热着。」他说。',
        '（他把纸折好，压进账本里。）',
        '「先放在这儿。你要是哪天想拿回去，跟我说一声。」',
        '（他补了一句。）「我不收利息。」',
      ],
      next: 'sd_hub',
      enter: () => { sy().streetTold = 'keep'; mark('street2'); give('paper8', '一张折过的纸'); },
    },
    sd_street2_d: {
      who: '艾',
      lines: [
        '（他点了点头，没有再问。）',
        '（灯芯响了一下。）',
        '「不问也好。」他说，「问出来的，都是已经定了的事。」',
      ],
      next: 'sd_hub',
      enter: () => { mark('street2'); },
    },
  };

  /* ============================================================
     Sides
     ============================================================ */
  const Sides = {
    LIST: LIST,
    nodes: N,

    done(id) { return done(id); },
    count() { return LIST.length; },
    doneCount() { return LIST.filter((s) => done(s.id)).length; },
    remain() { return LIST.filter((s) => !done(s.id)).length; },

    /* 艾的话题菜单：只摆能问的 */
    menu() {
      return MENU
        .filter((m) => !done(m.id) && m.when())
        .map((m) => ({ text: m.text, to: 'sd_' + m.id, key: true, once: true }));
    },

    /* 旁支那一页里的条目（与 menu() 同一个来源） */
    hubChoices() { return this.menu(); },

    /* 门口那一条：还有几件没问 */
    hubEntry() {
      const n = this.menu().length;
      if (!n) return null;
      return { text: '（有些事，我一直想问。）', to: 'sd_hub', key: true, note: n };
    },

    /* 结局那边要知道你问过几条 */
    stat() {
      const s = sy();
      return {
        asked: this.doneCount(),
        total: LIST.length,
        glued: !!s.glued, leftTorn: !!s.leftTorn, burnedTorn: !!s.burnedTorn,
        keepSound: !!s.keepSound, names7: !!s.names7, guestBack: s.guestBack || '',
      };
    },
  };

  /* ============================================================
     序章 · 草稿箱
     ------------------------------------------------------------
     收件箱左边那一栏里写着「草稿 (1)」。那不是装饰。
     ============================================================ */
  Sides.bindMail = function () {
    const folder = $('#mf-draft');
    if (!folder || folder.dataset.bound) return;
    folder.dataset.bound = '1';
    folder.addEventListener('click', (e) => {
      e.stopPropagation();
      if (global.Snd) { global.Snd.init(); global.Snd.click(); }
      Sides.draft();
    });
  };

  /* 收件箱那封信要能原样放回来 —— 下载链接就绑在它里面，
     换掉 DOM 会把那个链接连人带线一起扔掉。所以整块搬走，再整块搬回。 */
  let MAIL_KEEP = null;
  let MAIL_HEAD = null;

  Sides.draft = function () {
    const read = $('#read-body');
    const sub = document.querySelector('.read-subject');
    const from = $('#mail-from');
    if (!read) return;
    $('#mail-row') && $('#mail-row').classList.remove('unread');

    if (!MAIL_KEEP) {
      MAIL_KEEP = document.createElement('div');
      while (read.firstChild) MAIL_KEEP.appendChild(read.firstChild);
      MAIL_HEAD = {
        sub: sub ? sub.textContent : '',
        from: from ? from.textContent : '',
      };
    }
    if (sub) sub.textContent = '（无主题）';
    if (from) from.textContent = '我';

    const back = '<p class="dl-link-line"><a href="#" class="fake-link" id="dr-back">回 到 收 件 箱</a></p>';

    read.innerHTML =
      '<p>妈：</p>' +
      '<p>这边一切都好。工作不累，饭也吃得饱。</p>' +
      '<p>过一阵子我回去一趟。</p>' +
      '<p class="read-dim">（光标在最后一行闪。你写了三年，这一行一直是这五个字。）</p>' +
      '<p class="read-dim">（发不出去。收件人那一栏你填过很多次，每次都删掉了。）</p>' +
      '<p class="dl-link-line">' +
      '<a href="#" class="fake-link" id="dr-send">发 出 去</a>' +
      '　　<a href="#" class="fake-link" id="dr-keep">留 着</a>' +
      '</p>' + back;

    const restore = () => {
      read.innerHTML = '';
      if (MAIL_KEEP) while (MAIL_KEEP.firstChild) read.appendChild(MAIL_KEEP.firstChild);
      if (sub && MAIL_HEAD) sub.textContent = MAIL_HEAD.sub;
      if (from && MAIL_HEAD) from.textContent = MAIL_HEAD.from;
      MAIL_KEEP = null;
      if (global.Save) { try { global.Save.touch(); } catch (e) {} }
    };

    const send = $('#dr-send');
    const keep = $('#dr-keep');
    if (send) send.addEventListener('click', (e) => {
      e.preventDefault();
      if (global.Snd) { global.Snd.init(); global.Snd.deny(); }
      sy().draft = 1;
      mark('draft');
      read.innerHTML =
        '<p>（你按了。进度条走到一半，停住。）</p>' +
        '<p>（提示：收件人地址无效。请检查后重试。）</p>' +
        '<p class="read-dim">（你把这句话看了三遍。地址没有问题。是你已经不在那一头了。）</p>' +
        '<p class="read-dim">（信留在草稿箱里。这一回，它跑到了「已发送」那一栏的上面。）</p>' +
        '<p class="dl-link-line"><a href="#" class="fake-link" id="dr-back2">回 到 收 件 箱</a></p>';
      if (Toast) Toast.show('（一封信没有发出去。它现在两边都不算了。）', 3600);
      if (global.Ach) global.Ach.give('draftsend');
      const b2 = $('#dr-back2');
      if (b2) b2.addEventListener('click', (ev) => { ev.preventDefault(); restore(); });
      if (global.Save) { try { global.Save.touch(); } catch (e) {} }
    });
    if (keep) keep.addEventListener('click', (e) => {
      e.preventDefault();
      if (global.Snd) { global.Snd.init(); global.Snd.click(); }
      sy().draft = 1;
      mark('draft');
      read.innerHTML =
        '<p>（你把手从鼠标上拿开。）</p>' +
        '<p>（草稿箱里那一封还在。右上角有一个很小的「1」，一直没有变成 0。）</p>' +
        '<p class="read-dim">（你后来常常想起这一封。想起的时候，都是在别的城市，别的一年。）</p>' +
        '<p class="dl-link-line"><a href="#" class="fake-link" id="dr-back3">回 到 收 件 箱</a></p>';
      if (Toast) Toast.show('（信留下了。它比你先到，也比你先老。）', 3400);
      if (global.Ach) global.Ach.give('draftkeep');
      const b3 = $('#dr-back3');
      if (b3) b3.addEventListener('click', (ev) => { ev.preventDefault(); restore(); });
      if (global.Save) { try { global.Save.touch(); } catch (e) {} }
    });
    const bk = $('#dr-back');
    if (bk) bk.addEventListener('click', (e) => { e.preventDefault(); restore(); });
  };

  /* ============================================================
     第一章 · 契约背面
     ------------------------------------------------------------
     登记表底下那行小字「签字即视为同意被记录」的背面，还有三条。
     ============================================================ */
  Sides.bindFine = function () {
    const flip = $('#doc-flip');
    const back = $('#doc-back');
    if (!flip || flip.dataset.bound) return;
    flip.dataset.bound = '1';
    flip.addEventListener('click', (e) => {
      e.stopPropagation();
      if (global.Snd) { global.Snd.init(); global.Snd.click(); }
      if (!back) return;
      const on = back.classList.toggle('on');
      flip.textContent = on ? '（翻回正面）' : '（纸的背面还有一页。翻过来。）';
      if (on) {
        sy().fineRead = 1;
        if (global.Ach) global.Ach.give('fineprint');
        if (global.Save) { try { global.Save.touch(); } catch (e) {} }
      }
    });
  };

  /* ============================================================
     第五章 · 第 000 行
     ============================================================ */
  Sides.rootZero = async function () {
    const R = global.Root;
    if (!R || R.stage !== 'list') return;
    if (global.Snd) { global.Snd.init(); global.Snd.ok(); }
    if (done('zero')) {
      if (R.say) R.say('（那一行已经被你翻过了。它现在合着。）', 2600);
      return;
    }
    mark('zero');
    if (global.Ach) global.Ach.give('zero');
    const say = (t, d) => (R.say ? R.say(t, d === undefined ? 0 : d) : null);
    await say('（列表底下有一行，编号是 000。它在最上面，也在最下面。）');
    await wait(2600);
    await say('（名字那一栏是空的。押品那一栏写着两个字：时间。）');
    await wait(3400);
    await say('（备注那一栏只有一行：民国廿六年，第一次转让。）');
    await wait(3200);
    await say('（你把这一行读了三遍。列表还在往下滚，滚得比刚才慢。）');
    await wait(3000);
    await say('（第 036 行和第 000 行，中间隔着三十五次。）', 4200);
    if (global.State) global.State.sys.zeroRead = 1;
    if (global.Save) { try { global.Save.touch(); } catch (e) {} }
  };

  /* ============================================================
     第七章 · 街对面
     ------------------------------------------------------------
     玻璃柜之后，街对面还有一扇门。门牌 06。空号。
     ============================================================ */
  Sides.streetSix = async function () {
    const St = global.Street;
    if (!St) return;
    const say = (lines, gap) => St.say ? St.say(lines, gap) : Promise.resolve();
    const acts = (html) => {
      const box = $('#st-acts');
      if (box) box.innerHTML = html;
    };

    St.stage = 'six';
    $('#st-wrap').dataset.stage = 'stop';
    $('#st-stop').classList.add('on');
    $('#st-run').classList.remove('on');
    $('#st-scene').dataset.prop = 'case';
    $('#st-prop').className = 'st-prop p-case';
    $('#st-t').textContent = '街 对 面';
    $('#st-s').textContent = '门牌 06';
    acts('');
    if (global.Snd) { try { global.Snd.tone(96, 2.4, { type: 'sine', gain: .04, attack: .8 }); } catch (e) {} }

    await say([
      '街对面还有一扇门。',
      '门牌是 06。别的门牌都是铜的，这块是纸的，用图钉按着。',
      '门缝底下透出一条光。不亮，像有人在里面点了灯，忘了关。',
      '你推了一下。门没锁。',
    ], 760);
    await wait(600);
    acts('<button class="st-a" data-st="six-in"><b>进 去</b><i>灯还亮着</i></button>' +
      '<button class="st-a" data-st="six-knock"><b>敲 门</b><i>里面也许有人</i></button>' +
      '<button class="st-a ghost" data-st="six-back"><b>走 开</b><i>不打扰</i></button>');
  };

  Sides.streetSixAct = async function (kind) {
    const St = global.Street;
    if (!St) return;
    const box = $('#st-text');
    const acts = $('#st-acts');
    if (acts) acts.innerHTML = '';
    const push = (t, cls) => {
      if (!box) return;
      const p = document.createElement('p');
      p.className = 'st-l' + (cls ? ' ' + cls : '');
      p.textContent = t;
      box.appendChild(p);
    };
    if (box) box.innerHTML = '';
    mark('six');
    if (global.Ach) global.Ach.give('sixdoor');

    if (kind === 'six-in') {
      push('你进去了。', 'narr');
      await wait(1100);
      push('屋里是你自己的房间。桌子、台灯、一把椅子。桌上摊着一张纸。', 'narr');
      await wait(1600);
      push('是那张登记表。第 36 号。名称那一栏已经写了字，是你的名字。', 'narr');
      await wait(1800);
      push('纸的背面有一行铅笔字，写得很轻：', 'narr');
      await wait(1000);
      push('「别进来。里面那个不是你。」', 'say');
      await wait(1800);
      push('（你退出来。门在身后自己合上了，合得很轻。）', 'narr');
      sy().sixIn = 1;
    } else if (kind === 'six-knock') {
      push('你敲了三下。', 'narr');
      await wait(1200);
      push('里面有人应了一声。听不清。', 'narr');
      await wait(1400);
      push('你等了很久，门没有开。', 'narr');
      await wait(1200);
      push('（门缝底下那条光，往后退了一点。像有人背过身去。）', 'narr');
      sy().sixKnock = 1;
    } else {
      push('你走开了。', 'narr');
      await wait(1200);
      push('（走了几步，回头看。门牌 06 那块纸被风吹起来一角，又落下去。）', 'narr');
      await wait(1600);
      push('（灯还亮着。）', 'narr');
      sy().sixBack = 1;
    }

    if (global.Snd) { try { global.Snd.tone(140, 1.6, { type: 'sine', gain: .03 }); } catch (e) {} }
    if (global.Save) { try { global.Save.touch(); } catch (e) {} }
    await wait(900);
    acts('<button class="st-a" data-st="back"><b>回 柜 台</b><i>灯还亮着</i></button>');
  };

  /* 节点并进对话树 */
  Object.keys(N).forEach((k) => { global.DLG[k] = N[k]; });

  global.Sides = Sides;

  /* 页面里那两处要绑的，等 DOM 好了再说 */
  document.addEventListener('DOMContentLoaded', () => {
    Sides.bindMail();
    Sides.bindFine();
  });
  setTimeout(() => { Sides.bindMail(); Sides.bindFine(); }, 800);
})(window);
