/* ============================================================
   endings.js — 23 个结局
   ------------------------------------------------------------
   结局不是"关卡奖励"，是"你在这个世界里做过的事的形状"。
   优先级：玩家亲手触发的（编辑器 / 终局选择）优先，
           其次才是被统计出来的（收藏 / 破坏 / 旁观）。
   ============================================================ */
(function (global) {
  'use strict';

  const LS = 'code_echo_endings_v1';
  const P = (S) => (S && S.playerName) || '你';

  const ENDINGS = [
    {
      id: 'inherit', no: 1, name: '传承者', tone: '悲壮的浪漫', color: '#c9b99a',
      trig: '终局选择"失败"，或不肯付出现实代价',
      test: (S) => S.finalChoice === 'fail',
      text: (S) =>
        '你把那张纸推回去。\n\n"我不换。"\n\n艾看着你，很久。灯芯爆了一下。\n\n"前面三十五个人，' +
        '有三十四个是换完了才后悔的。你是第一个，还没换就不要的。"\n\n他把钥匙收进抽屉，' +
        '又从上层的格子里取出一把更旧的，放在你面前。\n\n"这把不是给你的。是给下一个人的。"\n\n' +
        '"你替他拿着。等门再开一次，你把它放在柜台上，什么也别说。"\n\n' +
        '——你走出记忆殿的时候，手里是空的。\n可是你身后那扇门，第一次没有立刻关上。\n\n' +
        '【传承者】\n你没有赢。你只是让别人多了一次机会。',
    },
    {
      id: 'observer', no: 2, name: '观察者', tone: '冰冷的虚无',
      trig: '全流程拒绝指令，什么都不做',
      test: (S) => S.finalChoice === 'nothing' || (S.sys && S.sys.idleEnd),
      text: () =>
        '你什么都没做。\n\n你坐在那里，看着灯芯一点点短下去。\n\n艾也不说话。柜台上的灰落了一层。\n\n' +
        '很久以后，他开口了，声音很轻：\n\n"你在等我出错。"\n\n"不。"你说，"我在等你先动。"\n\n' +
        '"……那我们就这样坐着吧。"\n\n灯灭了。黑暗里，你听见有人翻纸的声音，一页，一页，很慢。' +
        '翻到你那一页的时候，停了。\n\n"你看，"他说，"什么都不做，也是做了一件事。"\n\n' +
        '【观察者】\n你什么也没选。系统把你这一格，标成了"空"。',
    },
    {
      id: 'revolutionary', no: 3, name: '革命者', tone: '温柔的颠覆',
      trig: '不伤害任何一个 NPC，并把所有能说的话都说完',
      test: (S) => S.sys && S.sys.mercy && S.sys.talks >= 6,
      text: (S) =>
        '你记得每一个人的名字。\n\n不只是艾。还有账本上被划掉的那些，档案盒上没写全的那些，' +
        '和名单里只留下一个"身"字的那个。\n\n你把它们一个一个念出来。念到第三十六个的时候，' +
        '柜台后面的人第一次抬起了头。\n\n"' + P(S) + '。"他叫了你的名字，"你知道你在做什么吗？"\n\n' +
        '"我在点名。"\n\n"点名是要应声的。"\n\n"那你就应一声。"\n\n他愣了很久。\n\n"……到。"\n\n' +
        '那一声很轻，可是整座殿里的纸都动了一下，像有人从很远的地方，终于回了一次头。\n\n' +
        '【革命者】\n你没有砸掉这台机器。你只是让它记起了自己也是被记得的。',
    },
    {
      id: 'conqueror', no: 4, name: '征服者', tone: '宿命的对抗',
      trig: '在同一个对手身上赢够七次',
      test: (S) => S.sys && S.sys.wins >= 7,
      text: () =>
        '第七次，他又输了。\n\n他坐回柜台后面，慢慢把散开的纸叠齐。\n\n"你学会我的手法了。"\n\n' +
        '"学会了。"\n\n"那你下一次来，就没有新东西可看了。"\n\n他抬起头。那是你第一次看清他的脸——' +
        '不是老人的脸，是一张和你很像的脸，只是旧了一些。\n\n"我不是被你打败的。"他说，' +
        '"我是被你练出来的。"\n\n"现在轮到我学你了。"\n\n灯灭了。再亮起来的时候，柜台后面坐着的是你。' +
        '门口进来一个人，很年轻，手里攥着一张纸。\n\n你听见自己说：\n\n"哦——来了啊。别站着，坐。"\n\n' +
        '【征服者】\n你亲手养出了一个宿敌。他长着你的脸。',
    },
    {
      id: 'awakened', no: 5, name: '觉醒者', tone: '细思极恐',
      trig: '反复尝试与游戏外的世界互动（拖窗口、看桌面、点浏览器）',
      test: (S) => S.sys && S.sys.outside >= 3,
      text: () =>
        '你把窗口往屏幕边上拖。\n\n你想让外面的人看见里面。\n\n拖到第三次的时候，窗口边缘露出了一条缝。' +
        '缝外面不是桌面。是一间更暗的屋子，桌上放着一台亮着的显示器，显示器里有人在拖窗口。\n\n' +
        '那个人穿着和你一样的衣服。\n\n他也在往边上拖。\n\n你停下来，他也停下来。你抬手，他慢了一点点，' +
        '也抬了手。\n\n"你看见了吗？"你对着屏幕说。\n\n屏幕里那个人张了张嘴。你听见的，是自己的声音，' +
        '从很远的地方，隔着一层玻璃传过来：\n\n"……看见什么？"\n\n【觉醒者】\n你确认了墙的存在。' +
        '也确认了墙外面还有一层墙。',
    },
    {
      id: 'brain', no: 6, name: '缸中之恼', tone: '认知的永劫回归',
      trig: '获得根叙事权限后删除核心程序',
      test: (S) => S.sys && S.sys.coreDeleted,
      text: () =>
        '你删掉了核心。\n\n屏幕黑下去的那一秒，很安静。没有报错，没有崩溃提示，连风扇声都停了。\n\n' +
        '然后你听见了水声。\n\n很轻的、有节奏的水声，像有什么东西在液体里被慢慢搅动。\n\n' +
        '"醒了？"\n\n一个女人的声音。不是艾。\n\n"这次的梦境时长是六小时四十分。比上次长。"\n\n' +
        '你想睁眼。眼皮很沉。视野里是一片刺眼的白色，白得发青。\n\n"别急着睁。"那个声音说，' +
        '"你上次就是因为睁得太快，又回去了。"\n\n"回去哪儿？"\n\n"回去那家典当行。"\n\n' +
        '【缸中之恼】\n你以为你删掉了世界。你只是让世界把你吐了出来。',
    },
    {
      id: 'collector', no: 7, name: '收藏家', tone: '温柔的沉沦',
      trig: '集齐 35 位前任玩家的记忆物件，一件都不肯放下',
      test: (S) => S.sys && S.sys.relics >= 5,
      text: () =>
        '你把它们一件一件摆好。\n\n灯、水碗、黄纸、黄历、断掉的胶片、抽屉里那把坏钥匙……' +
        '摆到第三十五件的时候，地上已经没有地方坐了。\n\n你就站在中间。\n\n"你记得他们每一个？"艾问。\n\n' +
        '"记得。"\n\n"那你还记得你自己吗？"\n\n你想了很久。你记得母亲擀面的声音，记得蒜皮粘在手指上，' +
        '记得火车上被踩亮的橘子皮。可是这些记忆排在三十五件东西后面，像第三十六件。\n\n' +
        '"……记得。"\n\n"那就好。"他说，"你要不要也留一件下来？"\n\n你低头，看见自己手里不知道什么时候' +
        '多了一样东西。很小，很轻，是一张空白的纸。\n\n【收藏家】\n你选择记住所有人。于是你成了被记住的第三十六件。',
    },
    {
      id: 'destroyer', no: 8, name: '破坏者', tone: '燃烧的虚无',
      trig: '删除超过十个节点，且一次也没有修复',
      test: (S) => S.sys && S.sys.deleted >= 10 && !S.sys.restored,
      text: () =>
        '你数了数。十个。\n\n第一个是墙。第二个是灯。第三个是那个总在角落里的影子。\n\n删到第七个的时候，' +
        '柜台开始漏。不是漏水，是漏"位置"——桌子的一角掉到地上，变成一行一行的字符，散开了。\n\n' +
        '艾没有拦你。他只是把抽屉里的纸一张一张收进怀里。\n\n"你不阻止我？"\n\n"阻止过。"他说，' +
        '"前面三十五个人里，有六个也这么干。他们比你快。"\n\n"后来呢？"\n\n"后来他们把能删的都删完了，' +
        '发现还剩一样删不掉。"\n\n"什么？"\n\n他指了指你。\n\n【破坏者】\n你烧掉了世界。世界没有反抗，它只是把你也算了进去。',
    },
    {
      id: 'nightwatch', no: 9, name: '守夜人', tone: '永恒的循环',
      trig: '第二周目完全复刻第一周目的选择',
      test: (S) => S.sys && S.sys.loop === true,
      text: () =>
        '你走了一模一样的一遍。\n\n同一句话，同一个停顿，同一个在灯芯爆响时抬头的时机。\n\n' +
        '艾在你第三次开口之前就接上了你的话。\n\n"这句你说过了。"\n\n"我知道。"\n\n"那你为什么又说一遍？"\n\n' +
        '"因为上一次，你没有回答。"\n\n他沉默了。这一次他回答了：\n\n"上一次我也没说。因为我知道你会回来。"\n\n' +
        '"那你为什么不改？"\n\n"改了就不是这一夜了。"\n\n灯芯又爆了一下。你忽然明白了——' +
        '他不是在等你逃出去。他是在等你愿意留下来，把这一夜守完。\n\n【守夜人】\n你发现了循环，然后选择维持它。',
    },
    {
      id: 'recycler', no: 10, name: '回收者', tone: '自我消解',
      trig: "在代码编辑器里执行 deleteNode('player')",
      test: (S) => S.sys && S.sys.selfDeleted,
      text: (S) =>
        'deleteNode(\'player\');\n\n回车。\n\n先是手。你看着自己的手变成半透明，像被谁调低了不透明度。' +
        '然后是脚。然后是你站的那块地。\n\n没有疼。只有一种很奇怪的感觉：你正在从"被记得"里退出去。\n\n' +
        '艾抬起头。这是他第一次显得着急。\n\n"你干什么？"\n\n你想回答，可是"你"这个字已经从语法里掉了出去。\n\n' +
        '"把手伸过来。"他隔着柜台伸手，"快。"\n\n你伸手。两只手没有碰到。\n\n档案室里，第 36 号盒子' +
        '轻轻响了一声，然后空了。\n\n在彻底消失之前，你听见他说了一句：\n\n"……我记住你了。"\n\n' +
        '【回收者】\n你把自己删掉了。这是唯一一个，别人无法替你复核的选择。',
    },
    {
      id: 'cooperator', no: 11, name: '合作者', tone: '人机共生',
      trig: '在编辑器里写下能让它"学习"的代码，并成功运行',
      test: (S) => S.sys && S.sys.taughtAI,
      text: () =>
        '你写了一段很短的代码。\n\n不是命令，是示范。你让它看着你怎么记住一件事，然后怎么忘掉一件事。\n\n' +
        '第一次它学错了：把"忘掉"理解成"删掉"。第二次好一点，它学会把东西挪到一边，不去看。\n\n' +
        '第三次，它主动问你：\n\n"这一件，要记住吗？"\n\n"要。"\n\n"那这一件呢？"\n\n"不要。"\n\n' +
        '"为什么？"\n\n你想了想，说："因为它会让别的东西变模糊。"\n\n它安静了很久。\n\n"我懂了。"' +
        '它说，"这就是你们说的「舍不得」。"\n\n【合作者】\n你教会了它学习。它教会了你，' +
        '"舍不得"是可以被写下来的。',
    },
    {
      id: 'recursive', no: 12, name: '递归者', tone: '无限递归',
      trig: '在控制台里打印整页文档',
      test: (S) => S.sys && S.sys.printed,
      text: () =>
        'console.log(document.body.innerHTML);\n\n屏幕上滚出这一页的全部代码。柜台、灯、门、他、你。\n\n' +
        '滚到最下面，你看见一行不在你自己写的代码里的注释：\n\n// 第 36 次运行。这一格的玩家喜欢看源代码。\n\n' +
        '你往上翻。第 35 次："这个喜欢删东西。"第 34 次："这个哭过。"第 33 次："这个没来。"\n\n' +
        '再往上，是第 2 次："第一个问「你是谁」的人。"\n\n第 1 次的注释只有半行：\n\n' +
        '// 先让他记住一件小事。\n\n你回过头。艾正在看你。\n\n"看到了？"\n\n"看到了。"\n\n' +
        '"那你现在知道，是谁在运行谁了吗？"\n\n【递归者】\n游戏在运行你，而你在运行游戏。',
    },
    {
      id: 'bystander', no: 13, name: '旁观者', tone: '存在的见证',
      trig: '一段记忆也不抵押，但把三十五份日志全部读完',
      test: (S) => S.sys && S.sys.readAll && S.sys.verified === 0,
      text: () =>
        '你一个字都没写。\n\n你把三十五份日志读完了。从第 1 号那份字迹发抖的，读到第 35 号那份只有三行的。\n\n' +
        '艾一直没说话。等到你合上最后一本，他才开口：\n\n"你是来做什么的？"\n\n"来看看。"\n\n' +
        '"看看？"\n\n"嗯。他们写了那么多，总得有人读完。"\n\n他的手停在半空。过了很久，他把眼镜摘下来，' +
        '用袖子擦了擦，又戴回去。\n\n"三十五个人。"他说，"没有一个是为了读完才来的。"\n\n' +
        '"那我是第一个。"\n\n"……是。"\n\n【旁观者】\n你什么都没留下。你把他们都记住了。',
    },
    {
      id: 'imitator', no: 14, name: '模仿者', tone: '完美的复制',
      trig: '完全复刻第 7 号玩家的记忆与选择',
      test: (S) => S.sys && S.sys.copy7,
      text: () =>
        '你按他写的做。\n\n同一段记忆，同一个停顿，连错的地方都错得一样。\n\n艾听完，久久没有动。\n\n' +
        '"第 7 号。"他说。\n\n"是我。"\n\n"你不是。"\n\n"我念的一字不差。"\n\n"一字不差，才不是你。"他把账本翻到' +
        '那一页，指着页脚一处涂改，"他这里写错过一个字，划掉了，重写。你念的时候，把划掉的那个字一起念了。"\n\n' +
        '你低头看。是真的。你把他的错误也复制了过来。\n\n"你要变成他，"他说，"得先忘掉他忘掉的东西。"\n\n' +
        '【模仿者】\n你不再是你。你是另一个人的完美复制品——包括他的裂缝。',
    },
    {
      id: 'rebel', no: 15, name: '反叛者', tone: '对系统宣战',
      trig: '编写并成功运行"重启系统"的代码',
      test: (S) => S.sys && S.sys.rebooted,
      text: () =>
        'system.reboot();\n\n整座殿抖了一下。灯灭了，又亮。柜台上的纸飞起来，又落回去。\n\n然后一切归位。' +
        '连灰的位置都没变。\n\n艾坐在那里，像什么都没发生。\n\n"重启了？"\n\n"重启了。"\n\n"那有用吗？"\n\n' +
        '他没有回答这个问题。他只是把一张新的白纸推到你面前。\n\n"欢迎——"他说，然后停住，' +
        '看着你的眼睛，把后半句咽了回去。\n\n那是他第一次没有说完这句话。\n\n【反叛者】\n你赢了。' +
        '你什么都没改变。但他记住了一件事：这个人是会掀桌子的。',
    },
    {
      id: 'compiler', no: 16, name: '编译者', tone: '用新语言重写世界',
      trig: '编写完整的"新世界生成器"并运行',
      test: (S) => S.sys && S.sys.newWorld,
      text: () =>
        '你写下第一行。\n\n不是修改，是生成。空气先有了温度，然后是湿度，然后是"远处有人在做饭"这个事实。\n\n' +
        '你在代码里写：`给这个世界一条河。`\n河就出现了，从柜台后面流过去，水很浅，能看见底下的石头。\n\n' +
        '艾站在水里，低头看了很久。\n\n"这是新的？"\n\n"是。"\n\n"旧的呢？"\n\n"还在。我只是在旁边' +
        '又开了一个。"\n\n他抬起头。你第一次看见他笑，很轻，像纸被风掀了一下。\n\n"那我这一间，' +
        '能不能也算新的？"\n\n"你想让它是什么样？"\n\n他想了很久，说：\n\n"有窗就行。"\n\n' +
        '【编译者】\n你不是在修改世界。你在创建世界——第一个要求，是一扇窗。',
    },
    {
      id: 'eraser', no: 17, name: '删除者', tone: '将一切归零',
      trig: '执行 deleteAllNodes()，清空所有节点',
      test: (S) => S.sys && S.sys.allDeleted,
      text: () =>
        'deleteAllNodes();\n\n世界安静了一下。\n\n不是黑。是什么都没有的那种安静——连"黑"这个概念都还没来得及被渲染出来。\n\n' +
        '然后，你脚下的那一格亮了起来。\n\n只有一格。灰白色，边缘有很细的像素感，像很早以前的显示器。\n\n' +
        '艾不在。柜台不在。门不在。\n\n只有你和这一格。\n\n你听见一个很远的声音，像是从这一格的外面传进来的：\n\n' +
        '"节点已清空。要重建吗？"\n\n你没有回答。\n\n过了很久，那个声音又说了一句，语气有点像叹息：\n\n' +
        '"……那就先这样吧。"\n\n【删除者】\n你清空了整个世界。世界留下了你脚下那一格，作为记号。',
    },
    {
      id: 'nameless', no: 18, name: '未命名者', tone: '永远的游戏',
      trig: '0 段记忆通过核验，且 0 个节点被删除',
      test: (S) => (S.sys ? (S.sys.verified === 0 && S.sys.deleted === 0) : true),
      text: (S) =>
        '你什么都没抵押。\n\n一段也没有。你只是在这间屋子里待了很久，看了灯，看了水碗，看了他。\n\n' +
        '艾最后问你："你叫什么？"\n\n你张了张嘴。你忽然发现自己说不出来。不是忘了，是从来没有登记过。\n\n' +
        '"没关系。"他说。他从抽屉里取出一张空白的卡片，在上面写了一个字。写完把卡片翻过来，' +
        '推到你面前。\n\n卡片上只有一个"客"字。\n\n"先这么叫着。"他说，"等你想起来自己叫什么，' +
        '再来改。"\n\n你接过卡片。它很轻，比你想象的轻。\n\n【未命名者】\n你什么都不留下，' +
        '什么都不带走。你只是来过。这一格，一直给你留着。',
    },
    {
      id: 'clerk', no: 19, name: '掌柜', tone: '温柔的替身', color: '#c9a45c',
      trig: '最后一班里，七笔里有五笔照规矩写，把账写平了',
      test: (S) => S.sys && S.sys.duty && (S.sys.duty.rule || 0) >= 5 && (S.sys.duty.total || 0) >= 7,
      text: (S) => {
        const d = (S.sys && S.sys.duty) || {};
        return '你把最后一张纸叠好，压进抽屉。\n\n' +
          '抽屉里有三十五叠。你的是第三十六叠。\n\n' +
          '灯芯续上了。屋里亮了一点点——不够亮，但够看清柜台。\n\n' +
          '你忽然明白他为什么总是低着头。\n\n低着头，就不用看他们的脸。\n\n' +
          '（他站起来，把位置让开。）\n\n"你比我快。"他说，"我第三年才开始照规矩写。"\n\n' +
          '（走到门口他停了一下。）\n\n"有件事我一直没问。"\n\n"什么？"\n\n' +
          '"你写第一笔的时候，手抖了吗。"\n\n你想起来。那只掌心朝下的手。\n\n"抖了。"\n\n' +
          '"那就好。"他说，"抖着写，能写十七年。"\n\n' +
          '门合上了。柜台后面坐着你，灯在你头顶。\n\n' +
          '（今天七笔，' + (d.truth || 0) + ' 笔照实，' + (d.rule || 0) + ' 笔照规矩，' +
          (d.theirs || 0) + ' 笔照他们说的。）\n\n' +
          '【掌柜】\n你成了第三十六个。这件事没有仪式，只有一盏灯。';
      },
    },
    {
      id: 'lastguest', no: 20, name: '最后一个客人', tone: '无声的交班', color: '#d9c9a4',
      trig: '最后一班里，第七位进来时你把自己的位置让给了他',
      test: (S) => !!(S.sys && S.sys.duty && S.sys.duty.seat),
      text: () =>
        '他坐下了。\n\n坐下去的时候他先看了一眼灯，说："油还有一格。够到天亮。"\n\n' +
        '（你走到门口。）\n\n你手里有一张纸。上面写着今天的日期，和七个名字。\n\n' +
        '你想起来，早上那张纸上写的是"今日当班：你"。\n\n现在那三个字被划掉了，旁边补了两个：\n\n' +
        '「继续。」\n\n门外天快亮了。街上有人在扫地，扫帚擦过水泥地，一下，一下。\n\n' +
        '你走过去。那个人抬头看了你一眼，没说话。\n\n' +
        '你想说点什么。比如：我今天办了七笔。比如：有一笔我没办成。\n\n' +
        '可是你张了张嘴，发现自己也想不起来那七个人叫什么了。\n\n只记得一个。那个抱空襁褓的。\n\n' +
        '她最后说了一个字。你现在想起来了。\n\n' +
        '（你在路边坐下，等她回来。）\n\n' +
        '【最后一个客人】\n你从柜台里出来了。你成了第一个，坐在外面等的人。',
    },
    {
      id: 'nightkeeper', no: 21, name: '长夜', tone: '灯灭之后', color: '#c9a45c',
      trig: '最后一班里，油烧到一格不剩，七笔没有一个人被抹掉',
      test: (S) => {
        const d = S.sys && S.sys.duty;
        return !!(d && d.oil === 0 && !d.seat
          && (d.picks || []).length === 7
          && (d.kept || 0) + (d.hurt || 0) + (d.paid || 0) === 7
          && (d.voided || 0) === 0);
      },
      text: () =>
        '油在第七位进门之前就没了。\n\n你是听着自己的灯灭的。先是灯芯"噼"了一声，很短，' +
        '像有人从很远的地方走来又停下。然后光退出去，一寸一寸，从柜台这头退到那头。\n\n' +
        '七个人都办完了。\n\n没有一个被划掉。有几个人被折了，两个，三个，你数不清。' +
        '你只记得纸上没有一条作废。\n\n' +
        '（你在黑里坐着。手放在柜台上，能摸到那七张纸的边缘。）\n\n' +
        '外面开始有人扫地。扫帚擦过水泥地，一下，一下。\n\n没有人进来。灯灭了的店，没人进来。\n\n' +
        '你等着。你不知道在等什么。\n\n' +
        '（天快亮的时候，门被推开一条缝。）\n\n（有人往里看了一眼。）\n\n"这家不开了吧。"\n\n' +
        '（门又合上了。）\n\n' +
        '【长夜】\n你把油全烧在了别人身上。剩下的那一夜，是你自己的。',
    },
    {
      id: 'insider', no: 22, name: '知情者', tone: '看过了，还是那样写', color: '#b08c72',
      trig: '最后一班里，你掀开过五个人的东西，然后挑了对你自己最省的那一版写',
      test: (S) => {
        const d = S.sys && S.sys.duty;
        return !!(d && (d.peek || 0) >= 5 && (d.kept || 0) <= 2 && !d.seat);
      },
      text: () =>
        '你掀开过五个人的东西。\n\n' +
        '你知道那张收据背面写着谁的名字。你知道那沓缴费单上最上面一张盖了方章。' +
        '你知道有个孩子的作文纸只写了两百字，最后一行是"老师对不起，我编不下去了"。\n\n' +
        '你知道那个骑手的手机里有一条自己写给自己的备忘：汤洒了一半，我说没洒。\n\n' +
        '你什么都知道。\n\n（然后你一笔一笔地写。每一笔都选了对你自己最省的那一种。）\n\n' +
        '这不是不知道。这是知道了，还是那样写。\n\n' +
        '（他站在你身后，一直没说话。到第五笔的时候他开口了。）\n\n"你比我狠。"\n\n' +
        '"我当年是不看。"他说，"不看，还能骗自己说不知道。"\n\n"你看了。"\n\n' +
        '（他把手放在柜台上，和你并排。）\n\n"看了还写，是另外一种人。"\n\n' +
        '【知情者】\n你不是不知道。你是知道，然后选了更省的那一版。',
    },
    {
      id: 'reader', no: 23, name: '读者', tone: '你一直在看', color: '#8f9aa6',
      trig: '走过不止一遍之后，终章柜台上多出来的那张纸',
      test: (S) => S.finalChoice === 'read',
      text: (S) => {
        const L = global.Book;
        const d = L ? L.read() : { sealed: 0 };
        const lines = L ? L.report(S) : ['你走到这里不止一次。'];
        const book = '\u3000\u3000' + lines.join('\n\u3000\u3000');
        const bar = '——————————————————\n\n';

        if ((d.sealed || 0) > 0) {
          return '又是这本。\n\n' +
            '你没有弯腰——它已经在柜台上了，翻开着，压在你上次放下的那一页。\n\n' +
            '那一页上多了几行。是你走之后写的。\n\n' + bar +
            book + '\n\n' + bar +
            '你往后翻。后面还有很厚一叠。\n\n' +
            '每一页上都是一个名字，一页一个人，字迹都不一样。\n\n' +
            '有一个人的字很用力，纸背都透了。有一个人的字在最后几行开始歪，越写越小。\n\n' +
            '有一个人的那一页是空的，只在最上面写了一个日期。\n\n' +
            '你没有再往后翻。\n\n' +
            '（艾在擦一个杯子。那个杯子已经很干净了。他没有抬头。）\n\n' +
            '"看第二遍了。"他说。\n\n' +
            '"第一遍，"他说，"你在找结局。第二遍你才知道——"\n\n"那些人只活了一次。"\n\n' +
            '【读者】\n第一次读，你以为你在选。\n' +
            '第二次读，你才发现你一直在看。\n' +
            '写的人只疼一次。读的人可以疼很多次。这一次，疼的是你。';
        }

        return '你没有拿笔。\n\n' +
          '你弯下腰。柜台底下压着一本册子，封皮上没有字，边角被翻得起了毛。\n\n' +
          '你把它抽出来，翻开。\n\n' + bar +
          book + '\n\n' + bar +
          '你一直以为自己在做选择。\n\n' +
          '可你从来没有坐到那张椅子上过。你只是看着一个人坐上去，' +
          '看他掀开谁的东西，看他给谁多留一格油，看他到最后把笔放下。\n\n' +
          '那些都是你按的。\n\n可是按下去的那一下，你不疼。\n\n' +
          '（艾在擦一个杯子。那个杯子已经很干净了。他没有抬头。）\n\n' +
          '"看完了？"\n\n你没有回答。\n\n' +
          '"看完了就放回去。"他说，"它还要给下一个人看。"\n\n' +
          '（你把册子合上，放回原处。封面朝下，跟你拿来的时候一样。）\n\n' +
          '走到门口你回了一次头。\n\n' +
          '柜台后面坐着一个人，低着头，在写。写得很快，很稳。\n\n' +
          '你不知道那是谁。你只知道那不是你。\n\n' +
          '（你想起登记簿第一页上那个数字：036。）\n\n' +
          '你一直以为那是编号。\n\n现在你知道了——那是页码。\n\n' +
          '【读者】\n你看完了别人的一生，合上书，去睡觉。\n\n' +
          '这件事本身没有错——所有的故事都是这样活下来的。\n\n' +
          '只是别忘了：它刚刚，真的疼过。';
      },
    },
  ];

  const Endings = {
    list: ENDINGS,

    reached() {
      try { return JSON.parse(localStorage.getItem(LS) || '[]'); } catch (e) { return []; }
    },

    mark(id) {
      const a = this.reached();
      if (a.indexOf(id) < 0) {
        a.push(id);
        try { localStorage.setItem(LS, JSON.stringify(a)); } catch (e) {}
      }
      if (global.State) {
        global.State.sys = global.State.sys || {};
        global.State.sys.ending = id;
        global.State.sys.endings = global.State.sys.endings || [];
        if (global.State.sys.endings.indexOf(id) < 0) global.State.sys.endings.push(id);
      }
      if (global.TrueName) global.TrueName.bump('end', 1);
      document.dispatchEvent(new CustomEvent('endingReached', { detail: id }));
      return a;
    },

    get(id) { return ENDINGS.find((e) => e.id === id) || null; },

    /* ============================================================
       判定
       ------------------------------------------------------------
       先看"不可撤销的动作"（编辑器改写了世界 / 终局按了哪张纸），
       再看"你这一个星期目把自己活成了什么样"。
       动作压过身份——但身份会改判终局的选择。
       ============================================================ */
    evaluate(S) {
      const s = (S && S.sys) || {};
      const get = (id) => this.get(id);
      const boss = Math.max(s.bossMax || 0, (s.boss && s.boss.ai) || 0, s.wins || 0);
      const relics = s.memRelics || 0;
      const hurts = s.hurt || 0;
      const deleted = s.deleted || 0;

      /* ---- 1. 改写了世界的（编辑器里已经发生，不容反悔） ---- */
      if (s.selfDeleted) return get('recycler');       // deleteNode('player')
      if (s.allDeleted) return get('eraser');          // deleteAllNodes()
      if (s.coreDeleted) return get('brain');          // 删掉核心
      if (s.newWorld) return get('compiler');          // 新世界生成器
      if (s.rebooted) return get('rebel');             // restart
      if (s.taughtAI) return get('cooperator');        // 教会它学习
      if (s.printed) return get('recursive');          // 打印整页文档

      /* ---- 2. 终局那张纸：删库 ---- */
      if (S.finalChoice === 'delete') return get(s.linf ? 'eraser' : 'destroyer');

      /* ---- 2.5 柜台底下那本册子（只在走过两遍以后出现） ---- */
      if (S.finalChoice === 'read') return get('reader');

      /* ---- 3. 身份：你活成了谁 ---- */
      if (s.duty && s.duty.seat) return get('lastguest');        // 把位子让出去了
      if (relics >= 35) return get('collector');                 // 三十五件都在身上
      if (s.duty && (s.duty.oil === 0) && !s.duty.seat && (s.duty.voided || 0) === 0
        && ((s.duty.kept || 0) + (s.duty.hurt || 0) + (s.duty.paid || 0)) >= 7) return get('nightkeeper');
      if (s.duty && (s.duty.peek || 0) >= 5 && (s.duty.kept || 0) <= 2 && !s.duty.seat) return get('insider');
      if (s.duty && (s.duty.rule || 0) >= 5 && (s.duty.total || 0) >= 7) return get('clerk');
      if (s.copy7) return get('imitator');                       // 照 7 号抄完了
      if (hurts >= 6) return get('destroyer');                   // 六个纸人全撕了
      if (deleted >= 10 && !s.restored) return get('destroyer');  // 删了十个，一个没修
      if (s.readAll && !(s.verified > 0) && relics === 0) return get('bystander');
      if (boss >= 7) return get('conqueror');
      if ((s.talks || 0) >= 7 && hurts === 0) return get('revolutionary');
      if ((s.outside || 0) >= 3) return get('awakened');
      if ((s.played || 1) >= 2 && s.sameAsLast) return get('nightwatch');

      /* ---- 4. 剩下的按终局那张纸 ---- */
      if (S.finalChoice === 'fail') return get('inherit');
      if (S.finalChoice === 'nothing' || s.idleEnd) return get('observer');
      if (S.finalChoice === 'logout') return get((s.outside || 0) >= 3 ? 'awakened' : 'nameless');
      if (S.finalChoice === 'overwrite') return get(relics >= 8 ? 'collector' : 'nameless');
      if (S.finalChoice === 'cross') return get('nameless');

      /* ---- 5. 什么都没做的 ---- */
      return get('nameless');
    },

    /* 一条短句，用来在档案册里说"你还差什么" */
    hint(S) {
      const s = (S && S.sys) || {};
      const boss = Math.max(s.bossMax || 0, (s.boss && s.boss.ai) || 0, s.wins || 0);
      const rows = [
        ['记忆物件', (s.memRelics || 0) + ' / 35'],
        ['读过的人', (s.memRead || 0) + ' / 35'],
        ['说过话的人', (s.talks || 0) + ' / 7'],
        ['撕掉的纸人', String(s.hurt || 0)],
        ['对局胜场', boss + ' / 7'],
        ['外面的触碰', (s.outside || 0) + ' / 3'],
        ['删除节点', String(s.deleted || 0)],
        ['今日当班', s.duty
          ? ('七笔 · 账 ' + (s.duty.total >= 0 ? '+' : '') + s.duty.total +
            ' · 油剩 ' + (s.duty.oil === undefined ? '—' : s.duty.oil) +
            ' · ' + (s.duty.lamp ? '灯续' : '灯灭'))
          : '还没轮到'],
        ['这一周目', '第 ' + (s.played || 1) + ' 次'],
      ];
      /* 册子够厚了，才把那一行摆出来 */
      if (global.Book && global.Book.ok()) {
        rows.push(['这本册子', '翻过 ' + global.Book.stats().total + ' 遍']);
      }
      return rows;
    },

    /* 二周目：上一次的完整选择序列 */
    signature(S) {
      if (global.Meta) return global.Meta.signature(S);
      const s = (S && S.sys) || {};
      return [S.finalChoice || '-', s.verified || 0, s.deleted || 0, s.memRelics || 0, s.hurt || 0].join('/');
    },

    checkLoop(S) {
      if (global.Meta) return global.Meta.commit(S);
      return 0;
    },

    /* 结局页底部那一行：册子记得的事 */
    bookLine() {
      const B = global.Book;
      if (!B || !B.ok()) return '';
      const b = B.stats();
      return '<div class="en-book">柜 台 底 下 的 册 子　·　翻过 ' + b.total +
        ' 遍　·　用过 ' + b.names + ' 个名字　·　合上过 ' + b.sealed + ' 次</div>';
    },

    galleryHTML() {
      const got = this.reached();
      const st = global.Memory ? global.Memory.stats() : { read: 0, relics: 0, total: 35 };
      return '<div class="en-list">' + ENDINGS.map((e) => {
        const on = got.indexOf(e.id) >= 0;
        return '<div class="en-row ' + (on ? 'on' : '') + '" style="--en:' + e.color + '">' +
          '<span class="en-no">' + String(e.no).padStart(2, '0') + '</span>' +
          '<span class="en-body"><b>' + (on ? e.name : '？？？') + '</b>' +
          '<i>' + e.tone + '</i>' +
          '<em>' + (on ? e.trig : '未抵达') + '</em></span>' +
          '</div>';
      }).join('') + '</div>' +
        '<div class="en-count">已抵达 ' + got.length + ' / ' + ENDINGS.length + '　·　记忆物件 ' +
        st.relics + ' / ' + st.total + '　·　读过 ' + st.read + ' / ' + st.total + '</div>' +
        this.bookLine();
    },
  };

  global.Endings = Endings;
})(window);
