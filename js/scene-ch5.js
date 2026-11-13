/* ============================================================
   scene-ch5.js — 第五章 · 根目录
   ------------------------------------------------------------
   门后是往下的。不是楼梯，是往下滚动的行。
   这里没有走廊、没有柜台，只有记录。
   三十七行。第三十六行是你。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Fade, Toast, Shake } = global.G;
  const shake = (ms, amp) => {
    try {
      Shake.start(document.body, amp || 7, 30);
      setTimeout(() => Shake.stop(), ms || 300);
    } catch (e) {}
  };

  /* ---------------- 名单（用来铺满三千行） ---------------- */
  const NAMES = ['林秀英', '周小满', '陈默', '李淑芬', '王建国', '赵一鸣', '何秀兰', '徐文',
    '孙丽', '马长顺', '朱玉梅', '胡志强', '郭小娟', '林德海', '高翠兰', '罗小军',
    '梁美云', '宋建华', '唐玉兰', '许亚男', '邓桂英', '曹德明', '彭小燕', '曾宪平',
    '萧红梅', '田守业', '董秀珍', '袁立', '潘小娥', '蒋文斌', '蔡玉华', '余志远'];
  const THINGS = ['声音', '名字', '一只左手', '童年的夏天', '母亲的脸', '身', '一场雨',
    '会骑车的那年', '第一份工资', '一个人的背影'];

  const Root = {
    stage: 'descend',
    rows: [],
    raf: 0,
    speed: 190,
    wrong: 0,
    paused: false,
    targetEl: null,

    async start() {
      State.ch5 = Math.max(State.ch5, 1);
      this.stage = 'list';
      this.wrong = 0;
      this.speed = 190;
      this.paused = false;
      $('#rt-wrap').dataset.stage = 'list';
      $('#rt-detail').classList.remove('on');
      $('#rt-confirm').classList.remove('on');
      $('#rt-choice').classList.remove('on');
      $('#rt-list').classList.remove('slow');
      $('#rt-nar').textContent = '';
      $('#rt-sub').textContent = '— 记录库 · 37 行 —';
      this.buildRows();
      Snd.startDrone();

      await this.say('往下不是楼梯。\n是往下滚动的行。', 0);
      await wait(2400);
      await this.say('每一行是一个人。\n他们把自己押在这里，换了一把钥匙。', 0);
      await wait(3600);
      await this.say('三十七行。\n找到你自己。', 0);
      await wait(2800);
      this.scroll();
      setTimeout(() => this.say('（它不会停。停的是你。）', 3000), 9000);
    },

    async say(t, dur) {
      const el = $('#rt-nar');
      el.textContent = t;
      el.classList.add('on');
      if (dur !== 0) setTimeout(() => el.classList.remove('on'), dur || 3200);
    },

    /* ---------------- 列表 ---------------- */
    buildRows() {
      const box = $('#rt-list');
      box.innerHTML = '';
      box.scrollTop = 0;
      // 36 号只能有一行：其余位置遇到 36 就改成 35，再在靠前的位置放唯一的一行
      const list = [];
      for (let i = 0; i < 260; i++) {
        let id = (i % 37) + 1;
        if (id === 36) id = 35;
        list.push(id);
      }
      list[24] = 36;

      list.forEach((id, i) => {
        const isMe = id === 36;
        const thing = isMe ? '身' : THINGS[(id * 3 + i) % THINGS.length];
        const state = isMe ? '待覆盖' : '已释放';
        const name = isMe ? '████' : NAMES[(id * 7 + i) % NAMES.length];
        const d = document.createElement('button');
        d.className = 'rt-row' + (isMe ? ' me' : '');
        d.dataset.id = id;
        d.dataset.state = state;
        d.innerHTML = '<span class="rt-no">#' + String(id).padStart(3, '0') + '</span>'
          + '<span class="rt-nm">' + name + '</span>'
          + '<span class="rt-th">' + thing + '</span>'
          + '<span class="rt-st">' + state + '</span>';
        d.addEventListener('click', (e) => { e.stopPropagation(); this.pick(d, id, state); });
        if (isMe) this.targetEl = d;
        box.appendChild(d);
      });

      // 让 36 号一开始就在视野里偏上（offsetTop 不可靠，用视口相对位置算）
      if (this.targetEl) this.scrollTo(this.targetEl, 96);
    },

    /* 把某一行滚到视野里（相对视口算，别信 offsetTop） */
    scrollTo(el, pad) {
      const box = $('#rt-list');
      if (!el || !box) return;
      const br = box.getBoundingClientRect();
      const er = el.getBoundingClientRect();
      box.scrollTop += (er.top - br.top) - (pad || 0);
    },

    scroll() {
      const box = $('#rt-list');
      cancelAnimationFrame(this.raf);
      let last = performance.now();
      const tick = (now) => {
        const dt = Math.min(64, now - last) / 1000;
        last = now;
        if (!this.paused && this.stage === 'list') {
          box.scrollTop += this.speed * dt;
          if (box.scrollTop + box.clientHeight >= box.scrollHeight - 4) {
            box.scrollTop = 0;
          }
        }
        this.raf = requestAnimationFrame(tick);
      };
      this.raf = requestAnimationFrame(tick);
      // 25 秒之后它会快起来
      setTimeout(() => {
        if (this.stage === 'list') {
          this.speed = 330;
          box.classList.add('fast');
          this.say('（列表开始自己往下跑。）', 2600);
        }
      }, 25000);
    },

    jumpTo(n) {
      if (!this.targetEl || n !== 36) {
        Toast.show('（这里没有第 ' + n + ' 行。）');
        return;
      }
      const box = $('#rt-list');
      this.scrollTo(this.targetEl, box.clientHeight / 2);
      this.paused = true;
      this.targetEl.classList.add('found');
      Snd.ok();
      setTimeout(() => { this.paused = false; }, 2200);
      Toast.show('（控制台替你停了一下列表。就一下。）', 3600);
    },

    async pick(el, id, state) {
      if (this.stage !== 'list') return;
      if (id === 36 && state === '待覆盖') {
        this.stage = 'record';
        this.paused = true;
        cancelAnimationFrame(this.raf);
        Snd.ok();
        el.classList.add('found');
        await this.say('你按住了自己那一行。\n它没有反抗。', 0);
        await wait(2200);
        this.openRecord();
        return;
      }
      // 点错：那一行会叫
      this.wrong++;
      Snd.boo();
      shake(320);
      el.classList.add('wrong');
      const nm = el.querySelector('.rt-nm').textContent;
      await this.say('（"' + nm + '"不是你。\n它抬头看了你一眼，然后继续低着头。）', 2200);
      setTimeout(() => el.classList.remove('wrong'), 1600);
      if (this.wrong >= 3) this.caught();
    },

    async caught() {
      if (this.stage !== 'list') return;
      this.paused = true;
      Snd.glitch(0.4);
      shake(800);
      $('#screen-root').classList.add('rt-grab');
      await wait(600);
      const f = document.createElement('div');
      f.className = 'rt-face';
      f.innerHTML = '<img src="assets/doll.png" alt="">';
      $('#screen-root').appendChild(f);
      Snd.boo();
      await wait(1400);
      f.remove();
      $('#screen-root').classList.remove('rt-grab');
      this.wrong = 0;
      this.paused = false;
      this.say('（你点错了三次。它开始数你了。）\n（重新找。）', 3400);
    },

    /* ---------------- 记录卡 ---------------- */
    openRecord() {
      State.recordFound = true;
      State.ch5 = 2;
      Snd.tone(70, 2.6, { type: 'sine', gain: 0.06, attack: .6 });
      const json = [
        '{',
        '  "id": 36,',
        '  "name": "████",',
        '  "collateral": "身",',
        '  "state": "待覆盖",',
        '  "visits": 35,',
        '  "expire": "今夜 03:14",',
        '  "note": "前 34 次都选了「退出」。第 35 次，他自己走到了 /var/records。"',
        '}',
      ].join('\n');
      $('#rt-detail').classList.add('on');
      $('#rt-json').textContent = '';
      let i = 0;
      const t = setInterval(() => {
        if (i >= json.length) {
          clearInterval(t);
          setTimeout(() => this.afterRecord(), 700);
          return;
        }
        const ch = json[i++];
        $('#rt-json').textContent += ch;
        if (ch !== '\n' && i % 5 === 0) Snd.tone(1500, 0.012, { type: 'sine', gain: 0.006 });
      }, 22);
    },

    async afterRecord() {
      this.stage = 'confirm';
      await this.say('到访 35 次。\n前 34 次你都选了「退出」。', 0);
      await wait(3600);
      await this.say('第 35 次你走到了这里，看见了这一行。\n然后你还是选了「退出」。', 0);
      await wait(4000);
      await this.say('现在第 36 次。\n到期时间：今夜 03:14。', 0);
      await wait(3200);
      $('#rt-confirm').classList.add('on');
      $('#rt-tries').textContent = '还有 3 次';
      $('#rt-msg').textContent = '';
      setTimeout(() => $('#rt-name').focus(), 300);
    },

    /* ---------------- 输名字 ---------------- */
    bindConfirm() {
      if (this.bound) return;
      this.bound = true;
      const send = () => this.submitName();
      $('#rt-send').addEventListener('click', send);
      $('#rt-name').addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Enter') send();
      });
      $('#rt-choice').addEventListener('click', (e) => {
        const b = e.target.closest('button[data-c]');
        if (!b) return;
        this.choose(b.dataset.c);
      });
    },

    async submitName() {
      if (this.stage !== 'confirm') return;
      const v = $('#rt-name').value.trim();
      if (!v) return;
      const real = (State.playerName || '').trim();
      if (real && v === real) {
        this.stage = 'choose';
        Snd.ok();
        await this.say('对了。\n你就是这个名字。', 0);
        await wait(2400);
        $('#rt-confirm').classList.remove('on');
        this.showChoice();
        return;
      }
      State.nameTries++;
      Snd.deny();
      shake(260);
      const left = 3 - State.nameTries;
      $('#rt-tries').textContent = left > 0 ? ('还有 ' + left + ' 次') : '没有了';
      const msg = [
        '不对。你不是这个名字。',
        '又不对。柜台上那支笔，写的是另一个。',
        '（你记不起来了。\n（他们就是靠这个收东西的。）',
      ][Math.min(2, State.nameTries - 1)];
      $('#rt-msg').textContent = msg;
      $('#rt-name').value = '';
      $('#rt-name').classList.add('err');
      setTimeout(() => $('#rt-name').classList.remove('err'), 420);
      if (State.nameTries >= 3) {
        await wait(900);
        this.choose('nameless');
      }
    },

    showChoice() {
      $('#rt-choice').classList.add('on');
      const un = $('#rt-unbind');
      if (un) un.classList.toggle('on', global.clueCount() === 4);
      this.say('（你可以改这一行。）\n（改法只有几种。）', 3600);
    },

    choose(c) {
      if (this.stage === 'done') return;
      this.stage = 'done';
      State.finalChoice = c;
      State.ch5 = 3;
      Snd.tone(64, 4, { type: 'sine', gain: 0.07, attack: 1.6 });
      if (global.End && global.End.show) global.End.show();
    },

    forceChoice(c) {
      if (!State.recordFound) return;
      this.choose(c);
    },
  };

  /* ============================================================
     结局文本
     ============================================================ */
  function rootEndText(choice, opt) {
    const o = opt || {};
    const exposed = o.exposed || 0;
    const tier = State.keyQ || 'plain';
    const tierLine = {
      broken: '你带出来的钥匙是残破的。它一路都在掉齿。',
      plain: '你带出来的钥匙是普通的。它还能开一扇门。',
      fine: '你带出来的钥匙是精良的。齿很深，认主。',
      perfect: '你带出来的钥匙是完美的。它一直没有离开过你的手。',
    }[tier] || '';

    const want = State.wish;
    const wishLine = want === 'out'
      ? '押在柜台上的那个愿望是「出去」。所以你现在才站在这里。'
      : (want === 'name'
        ? '你押掉的是「有人叫我的名字」。所以这一路没有人叫过你。'
        : (want ? '你押掉了一个愿望，换了一顿饭。那顿饭的名字你记不起来了。' : ''));

    const soulLine = o.soul
      ? '门外那把伞你带下来了。伞面上补过的一块，针脚很密。'
      : '';

    const tail = [];
    if (exposed >= 5) tail.push('（掌柜说过的话，你一句都没信。这是你唯一带下来的东西。）');
    if (State.devMode) tail.push('（你学会了点开这里的东西。这个技能，比钥匙有用。）');
    if (global.clueCount && global.clueCount() === 4) tail.push('（四条线索，你都找到了。）');

    if (choice === 'overwrite') {
      return [
        '你按下了「覆盖」。',
        '',
        '没有确认框。它不需要你确认——你早就确认过了，',
        '在第一章，你在柜台上写下名字的那一刻。',
        '',
        '屏幕开始一行一行地重写你：',
        '  姓名 ████ → 艾',
        '  押品 身 → 名字',
        '  状态 待覆盖 → 运行中',
        '',
        '你想起自己刚才还想问"门后面是什么"。',
        '现在你知道了：门后面是柜台。柜台后面是下一个客人。',
        '',
        '灯亮起来。你把手里那块布折好，压在柜台上。',
        '有人推门进来，头发上有雨。',
        '你听见自己说：',
        '',
        '"您好。欢迎来到记忆殿堂。我是这里的掌柜。"',
        '',
        '',
        tierLine,
        wishLine,
        soulLine,
        '',
        '—— 第五章 · 根 目 录 ——',
        '',
        '柜台内侧的刻字，多了一行：',
        '  艾。民国廿六年。押。第一。',
        '  你。今夜。押。第三十六。',
        ...tail,
      ].filter(Boolean).join('\n');
    }

    if (choice === 'delete') {
      return [
        '你按下了「删除」。',
        '',
        '这一层开始往下塌。不是墙倒——是行，一行一行地消失。',
        '每消失一行，就有一声很轻的"谢谢"，从很远的地方传过来。',
        '',
        '第三十五行没了。',
        '第十四行没了。那一行里有一只洋娃娃，它终于不用再找了。',
        '',
        '艾站起来。这是他第一次站起来。',
        '他没有脸——他只有正面，而正面朝着你。',
        '',
        '"我等了九年四个月。"',
        '"不是等您。是等有人肯按这个键。"',
        '',
        '你按下最后一个。屏幕上只剩一个浏览器窗口，',
        '和一行字：',
        '',
        '  SIGTERM',
        '',
        '然后你听见键盘。你自己的手在键盘上。',
        '你坐在自己家的电脑前，屏幕是黑的。',
        '键盘上有一层灰。灰上有一道新擦出来的印子，',
        '刚好是你两只手的位置。',
        '',
        '',
        tierLine,
        wishLine,
        soulLine,
        '',
        '—— 第五章 · 根 目 录 ——',
        '',
        '抽屉里有一张纸。上面是你的名字，',
        '后面跟着一个你从来没见过的日期：',
        '  今夜 03:14。',
        ...tail,
      ].filter(Boolean).join('\n');
    }

    if (choice === 'logout') {
      return [
        '你按下了「退出」。',
        '',
        '记忆殿像浏览器上的一个标签，被谁从后面关掉了。',
        '没有过渡，没有白光。',
        '',
        '你睁开眼，坐在椅子上。',
        '邮箱开着，那封信还在：',
        '  收件人：你',
        '  寄件人：',
        '  附件：记忆殿.exe',
        '',
        '右下角的时间是 02:14。',
        '你记得自己已经点开过它了。',
        '',
        '光标停在"点 game 开始"上面。',
        '你没有动。',
        '',
        '门响了。',
        '有人在门外，用指甲刮门。刮的位置很低，',
        '刚好是坐着的人，头的高度。',
        '',
        '',
        tierLine,
        wishLine,
        soulLine,
        '',
        '—— 第五章 · 根 目 录 ——',
        '',
        '第三章你在门外叫过魂。',
        '现在轮到有人在你门外叫了。',
        '你听见自己的名字，被人一个字一个字地念出来。',
        '念得很慢，像是在学。',
        ...tail,
      ].filter(Boolean).join('\n');
    }

    if (choice === 'unbind') {
      return [
        '你没有按那三个键。',
        '',
        '你回到 /app/hall.js，找到那一行。',
        '',
        '  // delete this.line',
        '',
        '注释是给人看的。但这一行不是注释——',
        '它是这个页面唯一一处，允许被人从里面划掉的地方。',
        '',
        '你把它划掉了。',
        '',
        '墙开始掉像素。一块一块往下掉，落在"地上"就不见了，',
        '因为地上也是画的。',
        '',
        '艾也掉。先掉的是他那件袍子的边，然后是手。',
        '他在笑。正面朝着你，笑得很慢。',
        '',
        '"我不是被关在这里的。"',
        '"我是自己写的这间店。押了名字，换一个不会老的地方。"',
        '"可是这里也不会有人来。"',
        '',
        '殿塌完了。下面没有服务器，没有机房。',
        '只有一台很旧的家用电脑，屏幕亮着，',
        '上面跑着一个页面：一个柜台，一个老人，一个循环。',
        '',
        '你把循环停了。',
        '',
        '你从店里走出去。街上的叶子堆到膝盖。',
        '没有人扫。',
        '但叶子还在。',
        '',
        '',
        tierLine,
        wishLine,
        soulLine,
        '',
        '—— 第五章 · 根 目 录 · 真 ——',
        '',
        '你把带出来的东西放在桌上：一把钥匙、一张车票、',
        '一叠写了名字的纸钱、一个愿望的灰。',
        '还有一把伞。',
        ...tail,
      ].filter(Boolean).join('\n');
    }

    /* nameless：三次都没想起自己的名字 */
    return [
      '你没有想起自己的名字。',
      '',
      '第三次输错之后，柜台那边传来很轻的一声"唉"。',
      '不是失望，是习惯。',
      '',
      '"没关系。"',
      '"名字这栏，我替您填。"',
      '',
      '屏幕上，名字栏的 ████ 被替换掉了。',
      '换成的那三个字你没看清——',
      '因为看清的时候，你已经不认识它了。',
      '',
      '记录 #36 · 状态：已释放 · 押品：名字',
      '',
      '你走出记忆殿。天亮了。',
      '街上有个人跟你打招呼，喊了一个名字。',
      '你没有回头。',
      '你不知道他在喊谁。',
      '',
      '',
      tierLine,
      wishLine,
      '',
      '—— 第五章 · 根 目 录 ——',
      '',
      '柜台内侧的刻字又多了一行，',
      '押品那栏是空的。',
      ...tail,
    ].filter(Boolean).join('\n');
  }

  /* 绑定一次即可 */
  const _start = Root.start.bind(Root);
  Root.start = function () {
    Root.bindConfirm();
    return _start();
  };

  global.Root = Root;
  global.rootEndText = rootEndText;
})(window);
