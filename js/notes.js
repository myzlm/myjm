/* ============================================================
   notes.js — 柜台给你的那张便条
   ------------------------------------------------------------
   玩家的原话：玩到一个半小时，还是不知道在讲什么、要做什么。
   问题不在故事，在信息——所有指引都藏在档案册和终端里，
   不主动去翻，就永远看不见。

   这一层只做一件事：随时按 H，把话说明白。
     一、这一章要做的（能打勾就打勾）
     二、你已经知道的（从存档里读，不是写死的台词）
     三、现在能按的键
   L 直接翻到"刚才说过的话"。
   ============================================================ */
(function (global) {
  'use strict';

  const $ = (s) => document.querySelector(s);
  const LS = 'code_echo_notes_v1';

  /* 每一章该干什么。动词开头，短句，不解释意义。 */
  const CH = {
    0: {
      no: '序章', name: '登录地球online',
      goal: [
        ['读完收件箱里那封信', (S) => !!S.readMail],
        ['点开附件，等它「下载」完', (S) => !!S.downloaded],
        ['用信里那串八位口令登录', (S) => !!S.loggedIn],
      ],
      keys: '回车继续 · 字母键打口令 · 退格删',
      warn: '口令输错三次，屏幕上会多一行不属于你的字。那不算死，只是难听。',
    },
    1: {
      no: '第一章', name: '邮件',
      goal: [
        ['跟殿里站着的那个人说话', (S) => (S.sys.talks || 0) > 0],
        ['选「前往」，不是「离开」', (S) => !!S.leftClicked || !!S.gavePaper],
        ['柜下木箱：那截蜡（按 Y，可做可不做）', (S) => !!(S.hands && S.hands.candle && S.hands.candle.done)],
      ],
      keys: '点一下继续 · 空格 / 回车同效',
      warn: '「离开」按下去不会退出游戏。它会从选项里消失，然后你只能选另一个。',
    },
    2: {
      no: '第二章', name: '抵押',
      goal: [
        ['填那张抵押单，押掉一样东西', (S) => !!S.wish],
        ['修电脑：先撬机箱', (S) => !!S.pryOpened],
        ['装上系统，进那台老机器', (S) => !!S.pcFixed],
        ['拿到钥匙，开柜台后面那扇门', (S) => !!S.doorOpened],
        ['柜下木箱：那支铅笔（按 Y）', (S) => !!(S.hands && S.hands.paper && S.hands.paper.done)],
      ],
      keys: '点击 · 撬机箱要连点 · 抽屉里是账本和胶片',
      warn: '抽屉锁的是账，不是数字：三行旧账各缺一个品级，页脚有三条线索，只有一个解。',
    },
    3: {
      no: '第三章', name: '他说的话',
      goal: [
        ['在店里找出物证（长明灯、水碗、黄纸、黄历、柜台底下）', (S) => Object.keys(S.proofs || {}).length >= 1],
        ['拿物证顶回艾的话，一处一处拆', (S) => (S.exposed || 0) >= 1],
        ['六处拆完，或者一处不拆直接开门', (S) => !!S.doorOpened],
        ['柜下木箱：那盘磁带（按 Y）', (S) => !!(S.hands && S.hands.tape && S.hands.tape.done)],
      ],
      keys: '点击物件 · 点击对话里的物件名对质',
      warn: '一处也不拆也能走到门口。只是门后是什么，会不一样。',
    },
    4: {
      no: '第四章', name: '渲染层',
      goal: [
        ['按 Tab 打开检查器，把那面墙降到人后面', (S) => (S.wallZ || 9) < 4],
        ['按 P 打断点，看清两帧之间跟着你的东西', (S) => !!S.runDone],
        ['找到那扇没有 onclick 的门', (S) => !!S.figureSeen],
        ['柜下木箱：三张透卡（按 Y）', (S) => !!(S.hands && S.hands.cards && S.hands.cards.done)],
      ],
      keys: 'Tab 检查器 · P 断点 · 方向键走 · 点门',
      warn: '这里所有东西都只有一面。侧面零像素，所以它会跟着你转。',
    },
    5: {
      no: '第五章', name: '根目录',
      goal: [
        ['在三十七行里找出编号 036 那一行', (S) => !!S.recordFound],
        ['读懂七个假行是怎么假的', (S) => Object.keys(S.clues || {}).length >= 7],
        ['给自己那一行填上名字', (S) => (S.ch5 || 0) >= 3],
        ['柜下木箱：那条纸带（按 Y）', (S) => !!(S.hands && S.hands.punch && S.hands.punch.done)],
      ],
      keys: '点击行 · 名单会自己加速 · 点错三次会有东西闪出来',
      warn: '名单在跑。二十五秒后它会更快。慢下来只有一种办法：看准了再点。',
    },
    6: {
      no: '第六章', name: '收摊',
      goal: [
        ['七位客人，一人写一笔', (S) => ((S.sys.duty || {}).picks || []).length >= 7],
        ['每写一笔都要烧你自己那九格油', (S) => ((S.sys.duty || {}).picks || []).length >= 7],
        ['灯灭之前把这一班收完', (S) => !!S.ch6],
        ['柜下木箱：那张值夜表（按 Y）', (S) => !!(S.hands && S.hands.roster && S.hands.roster.done)],
      ],
      keys: '点击选项 · 掀开手 / 划掉一行 / 拿自己的东西抵，都会花油',
      warn: '七个人全保住要十四格油，你只有九格。这不是算错了，是做不到。',
    },
    7: {
      no: '终章', name: '回响',
      goal: [
        ['先不选。把笔推回去一次', (S) => (S.sys.transcend || 0) >= 1],
        ['处置 036 那一行', (S) => !!S.finalChoice],
      ],
      keys: '点击纸 · 第九张要最高写权限',
      warn: '结局不看最后点了哪张纸，看前面做过的事的形状。',
    },
  };

  const KEYQ = { broken: '残破', plain: '普通', fine: '精细', perfect: '完美' };

  /* 全部按键。多一行说明，比让玩家自己试便宜。 */
  const KEYS = [
    ['点击', '对话继续 / 选东西 / 按按钮'],
    ['空格 · 回车', '对话继续（和点击一样）'],
    ['Esc', '关掉当前这层浮窗'],
    ['H', '这张纸：该做什么、说过什么、键在哪'],
    ['Y', '柜台底下的木箱：六件手上的活'],
    ['L', '回看刚才的对话'],
    ['M', '静音 / 恢复'],
    ['Tab', '第四章：检查器（改元素层级）'],
    ['P', '第四章：打断点，停在两帧之间'],
    ['方向键', '第四章：走 · 终端：翻历史'],
    ['Ctrl+回车', '写代码的地方：运行'],
    ['F2 · ~', '终端。第五章之前用不上，按错了再按一次就关'],
  ];

  /* 特定屏幕上比章节更细的按键提示 */
  const KEYMAP = {
    lock: '字母键输入 · 退格删一位 · 点紫光灯照键盘（紫光下数字 = 从右数位次之和）',
    layer: 'Tab 检查器 · P 断点 · 方向键走 · 点门',
    root: '点击行 · 名单会加速',
    duty: '点击选项',
    final: '点击纸',
    moyun: '点击卷轴 · 拖动 · 双击',
    clock: '按提示的钟点拨 · 点击钟面',
    scratch: '输入 · 回车确认',
    anomaly: '点击 · 方向键',
    code: '直接打字 · Ctrl+Enter 运行',
  };

  const Notes = {
    tab: 'now',
    on: false,

    /* ---------------- 存档里读得出的"你知道什么" ---------------- */
    facts() {
      const S = global.State || {};
      const out = [];
      const q = KEYQ[S.keyQ];
      if (q) out.push(['钥匙', q]);
      if (S.detail) out.push(['记忆细节', S.detail + ' / 8']);
      const pf = Object.keys(S.proofs || {}).length;
      if (pf) out.push(['物证', pf + ' / 6']);
      if (S.exposed) out.push(['拆穿的谎', S.exposed + ' / 6']);
      if (S.recordFound) out.push(['记录', '#036 已读到']);
      const d = (S.sys || {}).duty;
      if (d && (d.picks || []).length) {
        out.push(['这一班', (d.picks || []).length + ' / 7 笔']);
        out.push(['油', (d.oil === undefined ? '—' : d.oil) + ' 格' + (d.lamp ? ' · 灯还亮' : ' · 灯灭了')]);
      }
      if (S.sys && S.sys.linf) out.push(['写权限', 'L∞ 已拿到']);
      if (S.hands) {
        const hn = Object.keys(S.hands).filter((k) => S.hands[k] && S.hands[k].done).length;
        if (hn) out.push(['手上的活', hn + ' / 6']);
      }
      /* 支线一直在，只是没人告诉过玩家。这里常驻一行，别让他觉得店里就这点事。 */
      const qq = global.Quests;
      if (qq && qq.doneCount) out.push(['替前任办完的事', qq.doneCount() + ' / ' + qq.count()]);
      return out;
    },

    /* ---------------- 章节推断 ---------------- */
    chapter() {
      const S = global.State || {};
      /* 屏比存档准：终章/收摊/根目录/渲染层都是独占的屏 */
      const cur = (global.App && global.App.current) || '';
      const byScreen = { final: 7, duty: 6, root: 5, anomaly: 5, layer: 4, hall: 1 };
      if (byScreen[cur]) return byScreen[cur];
      if (global.Save && global.Save.chapterOf) {
        const c = global.Save.chapterOf(S);
        if (typeof c === 'number') return c;
      }
      if (S.finalChoice) return 7;
      if (S.ch6) return 6;
      if (S.ch5) return 5;
      if (S.ch4) return 4;
      if (S.ch2) return 2;
      return 0;
    },

    html() {
      const S = global.State || {};
      const ch = this.chapter();
      const c = CH[ch] || CH[0];
      const cur = (global.App && global.App.current) || '';

      /* 抬头 */
      let h = '<div class="nt-paper">' +
        '<div class="nt-tab">' +
        '<button data-nt="now" class="' + (this.tab === 'now' ? 'on' : '') + '">该做什么</button>' +
        '<button data-nt="said" class="' + (this.tab === 'said' ? 'on' : '') + '">说过的话</button>' +
        '<button data-nt="keys" class="' + (this.tab === 'keys' ? 'on' : '') + '">键位</button>' +
        '</div>';

      if (this.tab === 'said') {
        h += this.saidHTML();
        h += '<div class="nt-foot">H 关掉　·　L 直接翻到这页</div></div>';
        return h;
      }

      if (this.tab === 'keys') {
        h += '<div class="nt-no">键</div><div class="nt-name">一共就这么几个</div><div class="nt-rule"></div>' +
          '<div class="nt-keys2">' +
          KEYS.map((r) => '<div><kbd>' + r[0] + '</kbd><span>' + r[1] + '</span></div>').join('') +
          '</div>' +
          '<div class="nt-warn">记不住没关系。按 H，这一页一直在。</div>' +
          '<div class="nt-foot">H 关掉</div></div>';
        return h;
      }

      h += '<div class="nt-no">' + c.no + '</div>' +
        '<div class="nt-name">' + c.name + '</div>' +
        '<div class="nt-sub">这店收记忆。你押一样，换一样。你是第 36 个，前面 35 个都被划掉了。</div>' +
        '<div class="nt-rule"></div>';

      /* 一、要做的 */
      h += '<div class="nt-sec">这一章要做的</div><ul class="nt-goal">';
      c.goal.forEach(([txt, test]) => {
        let done = false;
        try { done = !!(test && test(S)); } catch (e) { done = false; }
        h += '<li class="' + (done ? 'done' : '') + '"><i>' + (done ? '✓' : '') + '</i><span>' + txt + '</span></li>';
      });
      h += '</ul>';

      /* 二、知道的 */
      const f = this.facts();
      if (f.length) {
        h += '<div class="nt-sec">你已经知道的</div><div class="nt-facts">';
        f.forEach(([k, v]) => { h += '<span><i>' + k + '</i><b>' + v + '</b></span>'; });
        h += '</div>';
      }

      /* 三、键 */
      const keys = KEYMAP[cur] || c.keys;
      h += '<div class="nt-sec">现在能按的</div><div class="nt-keys">' + keys + '</div>';

      if (c.warn) h += '<div class="nt-warn">' + c.warn + '</div>';

      h += '<div class="nt-foot">H 关掉　·　L 回看对话　·　M 静音</div></div>';
      return h;
    },

    saidHTML() {
      const D = global.Dlg || global.Dialogue;
      const log = (D && D.log) || [];
      if (!log.length) {
        return '<div class="nt-empty">还没人说过话。<br>对话面板右下角写着「L 回看」，跳过的话可以从那儿补回来。</div>';
      }
      let h = '<div class="nt-log">';
      log.slice(-40).forEach((l) => {
        h += '<div class="nt-line ' + (l.who === '你' ? 'me' : '') + '">' +
          '<i>' + (l.who || '艾') + '</i><p>' + String(l.text).replace(/</g, '&lt;') + '</p></div>';
      });
      h += '</div>';
      return h;
    },

    build() {
      let el = $('#notes');
      if (el) return el;
      el = document.createElement('div');
      el.id = 'notes';
      el.className = 'nt';
      el.innerHTML = '<div class="nt-wrap"></div>';
      el.addEventListener('click', (e) => {
        if (e.target === el) { this.close(); return; }
        const t = e.target.closest('[data-nt]');
        if (t) {
          this.tab = t.dataset.nt;
          this.paint();
          if (global.Snd) { try { global.Snd.click(); } catch (err) {} }
        }
      });
      document.body.appendChild(el);
      return el;
    },

    paint() {
      const el = this.build();
      el.querySelector('.nt-wrap').innerHTML = this.html();
    },

    open(tab) {
      if (tab) this.tab = tab;
      this.build();
      this.on = true;
      this.paint();
      requestAnimationFrame(() => $('#notes').classList.add('on'));
      this.syncHint();
      if (global.Snd) { try { global.Snd.init(); global.Snd.tone(660, 0.12, { type: 'sine', gain: 0.03 }); } catch (err) {} }
    },

    close() {
      this.on = false;
      const el = $('#notes');
      if (el) el.classList.remove('on');
      this.syncHint();
    },

    toggle(tab) {
      if (this.on && (!tab || tab === this.tab)) this.close();
      else this.open(tab);
    },

    /* 一次点下去就重来的按钮，都要走这里：先变成"再按一次" */
    again(btn, cb) {
      if (!btn) return;
      if (btn.dataset.armed === '1') {
        btn.dataset.armed = '';
        cb();
        return;
      }
      btn.dataset.armed = '1';
      if (!btn.dataset.old) btn.dataset.old = btn.textContent;
      btn.textContent = '再按一次';
      btn.classList.add('armed');
      clearTimeout(btn._armT);
      btn._armT = setTimeout(() => {
        if (btn.dataset.armed !== '1') return;
        btn.dataset.armed = '';
        btn.textContent = btn.dataset.old;
        btn.classList.remove('armed');
      }, 2600);
    },

    /* 右下角那个小角标：不喊人，但一直在 */
    hint() {
      let el = $('#nt-hint');
      if (!el) {
        el = document.createElement('div');
        el.id = 'nt-hint';
        el.className = 'nt-hint';
        el.innerHTML = '<b>H</b> 该做什么';
        el.addEventListener('click', () => this.open('now'));
        document.body.appendChild(el);
      }
      return el;
    },

    syncHint() {
      const el = this.hint();
      const cur = (global.App && global.App.current) || '';
      /* 开篇几屏不放，别一进门就贴广告 */
      const hide = ['mail', 'download', 'login', 'end', ''].indexOf(cur) >= 0;
      el.classList.toggle('on', !hide && !this.on);
    },

    boot() {
      document.addEventListener('screenchange', () => this.syncHint());
      setTimeout(() => this.syncHint(), 1200);
      document.addEventListener('keydown', (e) => {
        const t = e.target;
        if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        const k = e.key.toLowerCase();
        /* 键盘锁那一屏，a-z 全是密码输入，别抢键 */
        const typing = global.App && global.App.current === 'lock';
        if (typing) {
          if (e.key === 'Escape' && this.on) { e.preventDefault(); this.close(); }
          return;
        }
        if (k === 'h') { e.preventDefault(); this.toggle('now'); }
        else if (k === 'l') {
          /* L 原来是主线键（柜台里按 L 进里间）。只有正在说话的时候，
             它才是"回看刚才那句"，其余情况一概让回去。 */
          const talking = global.Dlg && global.Dlg.active;
          if (!talking) return;
          e.preventDefault();
          e.stopPropagation();      /* 别让柜台那个 L 顺手把里间的门也开了 */
          this.toggle('said');
        } else if (e.key === 'Escape' && this.on) {
          e.preventDefault();
          this.close();
        }
      }, true);

      /* 第一次进柜台时提一句，之后不再唠叨 */
      try {
        if (!localStorage.getItem(LS)) {
          setTimeout(() => {
            if (global.Toast && global.App && global.App.current === 'counter') {
              global.Toast.show('按 H 可以随时看：这一章要做什么。', 4200);
              localStorage.setItem(LS, '1');
            }
          }, 9000);
        }
      } catch (err) {}
    },
  };

  global.Notes = Notes;
})(window);
