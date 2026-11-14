/* ============================================================
   data.js — 全局状态、文案、谜题数据
   ============================================================ */
(function (global) {
  'use strict';

  const State = {
    playerName: '',
    job: '',
    sex: '',
    jobIsCode: false,
    jobIsMusic: false,

    leftClicked: false,      // 玩家按过"离开"
    rebooted: false,         // 已完成一次重启
    achievementRush: false,  // 急也没用
    achievementPry: false,   // 手很稳
    achievementUV: false,

    hasUV: false,
    hasCrowbar: false,
    selectedItem: null,

    pcFixed: false,
    pryOpened: false,
    hiddenCount: 0,          // 隐藏区域连续误触次数

    darkClicks: 0,

    seq: '',                 // 玩家最终确认的密码
    printed: false,
    gavePaper: false,

    /* ---------- 第二章：抵押 ---------- */
    ch2: 0,                  // 0 未开始 / 1 抽屉 / 2 胶片 / 3 钥匙已得 / 4 可开门 / 5 结束
    ledgerSolved: false,
    filmSolved: false,
    detail: 0,               // 记忆细节数（3~8）
    keyQ: '',                // 钥匙品级 broken|plain|fine|perfect
    wish: null,              // 押掉的愿望 id
    ateFood: false,
    doorOpened: false,

    /* ---------- 第三章：他说的话 ---------- */
    proofs: {},              // 拿到的物证 id
    pressed: {},             // 已对质过的谎
    exposed: 0,              // 拆穿数
    openedUnder: 0,          // 柜台底下看过几次
    soulDone: false,         // 叫魂过了
    soulRight: 0,            // 叫魂中对了几声
    soulWrong: 0,
    soulAnswered: false,     // 最后一声母亲，应了没有

    /* ---------- 第四章：渲染层 ---------- */
    ch4: 0,                  // 1 走廊 / 2 墙 / 3 断点 / 4 门 / 5 通了
    wallZ: 9,                // 检查器里那面墙的层级
    figureSeen: false,       // 墙后面那个东西看见了
    runDone: false,          // 断点跑过去了
    devMode: false,          // 开发者模式（open 权限）

    /* ---------- 第五章：根目录 ---------- */
    ch5: 0,
    recordFound: false,      // 36 号记录已读到
    nameTries: 0,            // 名字输错过几次
    clues: {},               // 找到的代码线索
    devOpened: 0,            // 开发者模式打开次数
    finalChoice: '',         // overwrite | delete | logout | unbind

    /* ---------- 贯穿全局的"系统侧"计数（v11 设计稿） ---------- */
    sys: {
      ending: '',            // 当前/上一个结局
      endings: [],           // 抵达过的结局
      deleted: 0,            // 删掉的节点
      modified: 0,           // 改过的节点
      restored: false,       // 修复过
      verified: 0,           // 通过核验的记忆数
      relics: 0,             // 收集的记忆物件
      reads: 0,              // 读过的档案
      talks: 0,              // 完整谈过的人
      mercy: true,           // 从未伤害 NPC
      wins: 0,               // 同一对手的胜场
      outside: 0,            // 试图与游戏外互动的次数
      selfDeleted: false,
      allDeleted: false,
      coreDeleted: false,
      printed: false,
      rebooted: false,
      newWorld: false,
      taughtAI: false,
      copy7: false,
      readAll: false,
      idleEnd: false,
      loop: false,
      linf: false,           // L∞ 编写者权限
      perspOpened: 0,
      rotations: 0,
      editorRuns: 0,
      moyunSolved: [],
      cipherFinal: false,
    },
  };

  /* ---------------- 密码谜题 ----------------
     规则（来自设计稿）：
       序列 N~1 逐步生成，每个键上的指纹数字 = 该键在序列中
       所有「从右数位置」之和。
       例：asdda（N=5）
         a 出现在从右第 1 位和第 5 位 → 5+1=6
         s 出现在从右第 4 位         → 4
         d 出现在从右第 3 位和第 2 位 → 3+2=5

     每局随机：长度 7~26 位。参与的字母数按长度自适应（3~9 个），
     这样紫光下不会整块键盘都亮，单键的累计值也不会大到看不清。
  ------------------------------------------- */
  const LETTERS = 'abcdefghijklmnopqrstuvwxyz'.split('');

  function shuffleArr(a) {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function makePuzzle() {
    const N = 7 + Math.floor(Math.random() * 20);              // 7 ~ 26
    const keyCount = Math.max(3, Math.min(9, Math.round(N / 3)));
    const pool = shuffleArr(LETTERS.slice()).slice(0, keyCount);

    // 先让每个参与的字母至少出现一次，剩下的随机补
    const seq = pool.slice();
    while (seq.length < N) seq.push(pool[Math.floor(Math.random() * pool.length)]);
    shuffleArr(seq);

    const answer = seq.join('');
    return { answer: answer, length: N, prints: fingerprintOf(answer) };
  }

  const PUZZLE = makePuzzle();

  function fingerprintOf(seq) {
    const N = seq.length;
    const map = {};
    for (let i = 0; i < N; i++) {
      const k = seq[i];
      const pos = N - i;              // 最右一位 = 1
      map[k] = (map[k] || 0) + pos;
    }
    return map;
  }

  function signatureOf(map) {
    return Object.keys(map).sort().map((k) => k + ':' + map[k]).join('|');
  }

  // 判定：不比对具体字符串，而比对指纹签名 → 允许同签名的多解
  function checkSequence(input) {
    if (!input || input.length !== PUZZLE.length) return false;
    if (!/^[a-z]+$/.test(input)) return false;
    const target = signatureOf(fingerprintOf(PUZZLE.answer));
    return signatureOf(fingerprintOf(input)) === target;
  }

  /* ---------------- 文案 ---------------- */
  const TEXT = {
    hallAfterReboot: '重启完成了。\n\n可是你记得自己并没有按过重启。\n\n"离开"这一项，从界面上消失了——\n像是从来没有存在过。',
    hallAfterLeaveNote: '（你按了"离开"。它没有把你送回原来的地方。）',

    voice: '欢迎——来到——记忆殿',

    contractHint1: '有人站在柜台前。',
    contractHint2: '他把你那张纸拿走了。',
    contractHint3: '——他不见了。',
    contractHint4: '现在，请填写。',

    oldman1: '哦——来了啊。\n别站着，坐。凳子凉，凑合。',
    oldman2: '这台机器，比我岁数还大。\n我修不动了，你年轻，你试试。',
    oldman3: '开不开机就拍它两下。老毛病了，拍一拍就好。\n……要是还不行，柜台底下有根撬棍。',
    oldman4: '密码？我哪记得密码。\n我这脑子，早就不记东西了。',
    oldman5: '（他指了指键盘）\n你仔细看看。有些东西，肉眼看不见。',

    darkHint: '……',

    ch2DrawerLocked: '（抽屉锁着。锁面上没有数字，只有三个小孔。）',
    ch2DrawerTooEarly: '（抽屉锁着。他还没有让你开。）',
    ch2FilmTaken: '（木匣里是一卷被剪断的胶片。）',
    ch2DoorLocked: '（柜台后面有一扇门。门缝里没有光。）',
    ch2DoorNoKey: '（门上有锁孔。你手里还没有能插进去的东西。）',
    ch2DoorDone: '（门在你身后合上了。）',

    end: '你把那张纸放在柜台上。\n\n老人拿起来，凑到灯下看了很久。\n\n然后他抬起头，笑了。\n\n"第 36 个。"\n\n"你比前面那三十五个，都要快。"\n\n他把纸折好，放进抽屉。\n抽屉里已经叠了很多张纸。\n\n每一张上面，都写着一个名字。\n每一张的名字，都被划掉了。\n\n—— 第一章 · 完 ——',
  };

  /* ---------------- 档案 PDF 内容 ---------------- */
  function archivePDF(name, job, fp) {
    const nm = name || '（空白）';
    return [
      '档案编号：MS-0036',
      '归档时间：' + new Date().toLocaleString('zh-CN', { hour12: false }),
      '登记名称：' + nm,
      '原登记名称：' + nm + '　（已划销）',
      '性别：—　（该栏位在归档前被删除）',
      '职业：' + (job || '未填写'),
      '硬件标识：' + fp,
      '',
      '备注一：本档案为第 36 份。',
      '备注二：1—35 号档案的"离开"申请，均未通过。',
      '备注三：申请人从未离开过记忆殿。',
      '备注四：申请人即为本档案的阅读者。',
      '',
      '—— 以上内容由系统自动生成，无需核对。',
    ].join('\n');
  }

  global.State = State;
  global.PUZZLE = PUZZLE;
  global.TEXT = TEXT;
  global.fingerprintOf = fingerprintOf;
  global.signatureOf = signatureOf;
  global.checkSequence = checkSequence;
  global.archivePDF = archivePDF;
})(window);
