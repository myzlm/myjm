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
