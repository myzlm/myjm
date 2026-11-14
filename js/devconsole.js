/* ============================================================
   devconsole.js — 开发者模式
   ------------------------------------------------------------
   记忆殿不是"世界"，是一个页面。
   页面上的人看得见的东西，都是渲染出来的；看不见的东西，在这里。
   ------------------------------------------------------------
   F2 或 ` 打开。表层只读，第四章那扇门之后才拿到写权限。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, wait } = global.G;
  const S = () => global.State;

  /* ---------------- 四条线索 ---------------- */
  const CLUES = {
    build: {
      name: '构建号 0.9.36',
      where: '/log/build.log',
      text: '0.9.36 —— 第三十六次构建。这个页面被搭了三十六遍。',
    },
    ai: {
      name: '记录 #1 · 艾',
      where: '/var/records/1',
      text: '艾是 1 号记录：押掉名字，换了一间店。店得有人看着，所以它不能走。',
    },
    fp: {
      name: '同一台机器，35 次',
      where: '/log/access.log',
      text: '同一个硬件指纹，进门 35 次，35 次都写着"第一次来"。',
    },
    line: {
      name: 'delete this.line',
      where: '/app/hall.js',
      text: '源码注释里写着：这一行删掉，殿就塌了。删掉的是哪一行，没人知道。',
    },
  };

  /* ---------------- 伪文件系统 ---------------- */
  const HALL_JS = [
    '/* 记忆殿 · 主循环        build 0.9.36 */',
    '/* 这一层只是外壳。库挂在 /var/records。 */',
    '',
    'while (true) {',
    '  const guest = await waitForGuest();',
    '  const m = take(guest.memory);     // 越细，齿越深',
    '  const k = cut(m, 3);              // 一个人、一个动作、那天的天气',
    '  await give(k);',
    '',
    '  if (m.tooFine) release(m);        // 太细的东西认主',
    '  if (guest.asksLeave) {',
    '    // TODO(艾): 把「离开」加回去。已经第 12 次了。加不回去。',
    '    // delete this.line',
    '  }',
    '}',
  ].join('\n');

  const CSS_TXT = [
    '/* 这一层只有正面。侧面是 0px。 */',
    '/* 不要给客人看 inspector。 */',
    '',
    '.person { z-index: 2; }',
    '.wall   { z-index: 9; opacity: .97; }   /* 墙要盖在人前面 */',
    '.door   { /* 没有 onclick。门不需要被打开，门只需要被看见 */ }',
  ].join('\n');

  const MEM_JS = [
    'function take(m) {',
    '  // 记忆不是被"拿走"的，是被"读走"的。',
    '  // 读的时候你还在，读完你就不在了。',
    '  return m.slice(0, 3);',
    '}',
    '',
    'function cut(m, n) {',
    '  // 齿深 = 细节数。3 处以下是残破，8 处是完美。',
    '  return { teeth: m.length, quality: m.length > 7 ? "perfect" : "plain" };',
    '}',
  ].join('\n');

  const MOUNT_TXT = [
    '# 记忆殿不是库。库挂在这里。',
    '/var/records    /app/hall.js    ro,nosuid',
    '',
    '# 不要 umount。',
    '# 上一次 umount 之后，殿里的人全站起来了。',
  ].join('\n');

  function accessLog() {
    const hw = global.G.hwFingerprint();
    const lines = ['# 访问日志 · 只追加，不轮转'];
    for (let i = 1; i <= 35; i++) {
      const hh = String(2 + (i % 21)).padStart(2, '0');
      const mm = String((i * 7) % 60).padStart(2, '0');
      lines.push('2026-11-' + String(10 + (i % 4)).padStart(2, '0') + ' ' + hh + ':' + mm
        + '  hw=' + hw + '  #36  enter  记忆殿  第一次来');
    }
    lines.push('—— 以上 35 次，指纹相同，来源相同，姓名栏相同。');
    return lines.join('\n');
  }

  const BUILD_LOG = [
    '0.9.36  关闭 inspector 面板（客人会点）',
    '0.9.36  build 完成。记录库 37 行。',
    '0.9.35  把「离开」从菜单里去掉',
    '0.9.34  修：门没有 onclick 也能被打开（不应该）',
    '0.9.32  洋娃娃的手部贴图换成 003.png',
    '0.9.30  记录库挂载成功：/var/records',
    '0.9.28  给 36 号加了第二层壳（他记得太多）',
    '0.9.27  座椅贴图有缝，先不管',
  ].join('\n');

  const RECORDS = {
    1: [
      '{',
      '  "id": 1,',
      '  "name": "艾",',
      '  "collateral": "名字",',
      '  "state": "运行中",',
      '  "uptime": "9 年 4 个月",',
      '  "note": "第一个。押了名字，换了一间店。店得有人看着，所以不能走。"',
      '}',
    ].join('\n'),
    14: [
      '{',
      '  "id": 14,',
      '  "name": "周小满",',
      '  "age": 7,',
      '  "collateral": "一只洋娃娃",',
      '  "state": "已释放",',
      '  "note": "押品未取。它在店里找她，找了很久。"',
      '}',
    ].join('\n'),
    36: [
      '{',
      '  "id": 36,',
      '  "name": "████",',
      '  "collateral": "身",',
      '  "state": "待覆盖",',
      '  "visits": 35,',
      '  "expire": "今夜 03:14",',
      '  "note": "前 34 次都选了「退出」。第 35 次，他自己走到了 /var/records。"',
      '}',
    ].join('\n'),
    35: [
      '{',
      '  "id": 35,',
      '  "name": "（空）",',
      '  "collateral": "（空）",',
      '  "state": "已删除",',
      '  "note": "名字被取走了。记录还在，因为记录不需要名字也能跑。"',
      '}',
    ].join('\n'),
    /* 李知远的支线：未寄出的信，收件人一栏空着 */
    22: [
      '{',
      '  "id": 22,',
      '  "name": "李知远",',
      '  "collateral": "一封没寄出的信",',
      '  "state": "未取",',
      '  "to": "________",',
      '  "postmark": "无",',
      '  "note": "信写完了，邮票贴了，收件人那一栏空着。_meta.to 指向本条记录自己。",',
      '  "note2": "他在备注里写：寄不出去的信，收件人只能是自己。"',
      '}',
    ].join('\n'),
  };

  const FILES = {
    '/app/hall.js': { text: HALL_JS },
    '/app/render.css': { text: CSS_TXT },
    '/app/memory.js': { text: MEM_JS },
    '/etc/mount.conf': { text: MOUNT_TXT },
    '/log/build.log': { text: BUILD_LOG },
    '/log/access.log': { get: accessLog },
    '/var/records/1': { text: RECORDS[1] },
    '/var/records/14': { text: RECORDS[14] },
    '/var/records/22': { text: RECORDS[22] },
    '/var/records/35': { text: RECORDS[35] },
    '/var/records/36': {
      text: RECORDS[36],
      gate() {
        return S().recordFound
          ? null
          : '读取中…… 权限不足：这条记录正在被写入。\n（它正在被写。写它的是你。）';
      },
    },
  };

  const DIRS = {
    '/': ['app/', 'etc/', 'log/', 'var/'],
    '/app': ['hall.js', 'memory.js', 'render.css'],
    '/etc': ['mount.conf'],
    '/log': ['access.log', 'build.log'],
    '/var': ['records/'],
    '/var/records': [],
  };

  function fileText(path) {
    const f = FILES[path];
    if (!f) return null;
    if (f.gate) { const g = f.gate(); if (g) return g; }
    return f.get ? f.get() : f.text;
  }

  /* ---------------- 线索 ---------------- */
  function gain(id) {
    if (!CLUES[id] || S().clues[id]) return false;
    S().clues[id] = 1;
    if (global.Snd) global.Snd.ok();
    if (global.Toast) global.Toast.show('代码线索 · ' + CLUES[id].name, 3400);
    return true;
  }

  function clueCount() { return Object.keys(S().clues || {}).length; }

  /* ---------------- 终端 ---------------- */
  const Dev = {
    open: false,
    hist: [],
    hi: -1,
    booted: false,
    opens: {},           // 场景注册的"真实打开"钩子：open #selector
    CLUES,

    buildDom() {
      if (this.el) return;
      const el = document.createElement('div');
      el.className = 'dev';
      el.id = 'dev';
      el.innerHTML =
        '<div class="dev-box">'
        + '  <div class="dev-bar"><span>MEMORY-VAULT // console</span>'
        + '  <span class="dev-badge-mini">build 0.9.36</span>'
        + '  <button class="dev-x" id="dev-x" title="关闭">×</button></div>'
        + '  <div class="dev-out" id="dev-out"></div>'
        + '  <div class="dev-in-row"><span class="dev-p">&gt;</span>'
        + '  <input id="dev-input" autocomplete="off" spellcheck="false" /></div>'
        + '  <div class="dev-foot">F2 / ~ 关闭　·　输入 help 看命令　·　↑↓ 翻历史</div>'
        + '</div>';
      document.body.appendChild(el);
      this.el = el;
      this.out = $('#dev-out');
      this.input = $('#dev-input');

      $('#dev-x').addEventListener('click', () => this.close());
      this.el.addEventListener('click', (e) => {
        if (e.target === this.el) this.close();
      });
      this.input.addEventListener('keydown', (e) => {
        e.stopPropagation();
        if (e.key === 'Escape') { this.close(); return; }
        if (e.key === 'Enter') {
          const v = this.input.value.trim();
          this.input.value = '';
          if (!v) return;
          this.hist.push(v);
          this.hi = this.hist.length;
          this.exec(v);
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          if (this.hi > 0) { this.hi--; this.input.value = this.hist[this.hi] || ''; }
        }
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          if (this.hi < this.hist.length - 1) { this.hi++; this.input.value = this.hist[this.hi] || ''; }
          else { this.hi = this.hist.length; this.input.value = ''; }
        }
      });

      // 全局开关键
      document.addEventListener('keydown', (e) => {
        const t = e.target;
        if (t && (t.id === 'dev-input' || t.tagName === 'INPUT' || t.tagName === 'TEXTAREA')) return;
        if (e.key === 'F2' || e.key === '`' || e.key === '~') {
          e.preventDefault();
          this.toggle();
        }
      }, true);
    },

    toggle() { this.open ? this.close() : this.show(); },

    show() {
      this.buildDom();
      if (this.open) return;
      this.open = true;
      this.el.classList.add('on');
      S().devOpened = (S().devOpened || 0) + 1;
      if (global.Snd) { global.Snd.tone(320, .12, { type: 'square', gain: .03 }); }
      document.dispatchEvent(new CustomEvent('dev:open'));
      document.dispatchEvent(new CustomEvent('devOpened'));
      if (!this.welcomed) {
        this.welcomed = true;
        this.print('MEMORY-VAULT console   build 0.9.36   (c) 记忆殿');
        this.print('记录 #36 · 会话已恢复 · 无退出记录');
        this.print('');
        this.print('你不是第一个打开这里的人。');
        this.print('输入 help 看命令。');
        this.print('');
      }
      setTimeout(() => this.input && this.input.focus(), 30);
    },

    close() {
      if (!this.open) return;
      this.open = false;
      if (this.el) this.el.classList.remove('on');
      document.dispatchEvent(new CustomEvent('dev:close'));
    },

    print(text, cls) {
      const d = document.createElement('div');
      if (cls) d.className = cls;
      d.textContent = text;
      this.out.appendChild(d);
      this.out.scrollTop = this.out.scrollHeight;
    },

    printLines(text, cls) {
      String(text).split('\n').forEach((l) => this.print(l, cls));
    },

    /* ---------- 命令 ---------- */
    exec(raw) {
      const line = String(raw).trim();
      this.print('> ' + line, 'dev-cmd');
      const m = line.match(/^(\S+)\s*(.*)$/);
      const cmd = (m[1] || '').toLowerCase();
      const arg = (m[2] || '').trim();
      const fn = this.cmds[cmd];
      if (!fn) {
        this.print('command not found: ' + cmd + '（试 help）', 'dev-err');
        return;
      }
      try { fn.call(this, arg); }
      catch (e) { this.print('E: ' + e.message, 'dev-err'); }
      this.cmdCount = (this.cmdCount || 0) + 1;
      document.dispatchEvent(new CustomEvent('devCmd', { detail: this.cmdCount }));
    },

    needWrite() {
      if (S().devMode) return true;
      this.print('EACCES: 当前图层只读。', 'dev-err');
      this.print('（这上面有东西没有绑定过事件。找到它，就能进来。）', 'dev-dim');
      return false;
    },

    cmds: {
      help() {
        const rows = [
          ['help', '这张表'],
          ['ls [路径]', '看目录'],
          ['cat <文件>', '读文件'],
          ['grep <词>', '在所有文本里搜'],
          ['ps', '看进程'],
          ['whoami', '你是谁'],
          ['clue', '已找到的线索'],
          ['open <选择器>', '点一个元素（需要写权限）'],
          ['patch <键>=<值>', '改内存（需要写权限）'],
          ['find <编号>', '定位记录（需要写权限）'],
          ['del <路径>', '删除（需要写权限）'],
          ['clear', '清屏'],
          ['exit', '关掉'],
        ];
        this.print('可用命令：');
        rows.forEach((r) => this.print('  ' + r[0].padEnd(20, ' ') + r[1]));
        this.print('');
        this.print('提示：这一层只有正面。侧面是 0px。');
      },

      clear() { this.out.innerHTML = ''; },

      exit() { this.close(); },

      ls(a) {
        let p = a || '/';
        if (p.length > 1) p = p.replace(/\/+$/, '');
        if (p === '/var/records') {
          const rows = [];
          for (let i = 1; i <= 37; i++) {
            const nm = i === 36 ? '████' : (i === 35 ? '（空）' : (i === 1 ? '艾' : (i === 22 ? '李知远' : '…')));
            const st = i === 36 ? '待覆盖' : (i === 22 ? '未取' : '已释放');
            rows.push(String(i).padStart(4, '0') + '  ' + nm + '  ' + st);
          }
          this.print('共 37 行（其中 1 行没有名字）');
          rows.forEach((r) => this.print('  ' + r));
          return;
        }
        const d = DIRS[p];
        if (!d) { this.print('ls: 没有这个目录: ' + p, 'dev-err'); return; }
        this.print(p);
        d.forEach((n) => this.print('  ' + n));
      },

      cat(a) {
        if (!a) { this.print('用法: cat <文件>', 'dev-err'); return; }
        const t = fileText(a);
        if (t == null) { this.print('cat: 没有这个文件: ' + a, 'dev-err'); return; }
        this.printLines(t);
        const rec = /^\/var\/records\/(\d+)$/.exec(a);
        if (rec) document.dispatchEvent(new CustomEvent('recordRead', { detail: +rec[1] }));
        if (a === '/var/records/1') gain('ai');
        if (a === '/log/build.log') gain('build');
        if (a === '/app/hall.js') gain('line');
        if (a === '/log/access.log') gain('fp');
        if (a === '/var/records/36' && S().recordFound) {
          this.print('');
          this.print('（这条记录正在被你读。读它的是它自己。）', 'dev-dim');
        }
      },

      grep(a) {
        if (!a) { this.print('用法: grep <词>', 'dev-err'); return; }
        const paths = Object.keys(FILES);
        let n = 0;
        paths.forEach((p) => {
          const t = fileText(p) || '';
          t.split('\n').forEach((l, i) => {
            if (l.indexOf(a) >= 0 && n < 24) {
              this.print(p + ':' + (i + 1) + '  ' + l.trim());
              n++;
            }
          });
        });
        this.print('');
        this.print(n ? ('共 ' + n + ' 处') : '没有匹配');
        if (a === '第一次来' || a === 'hw=') gain('fp');
        if (/delete|删/.test(a)) gain('line');
      },

      ps() {
        const rows = [
          ['1', 'root', 'init', '0.0', '0.1%', ''],
          ['7', 'ai', 'hall.service', '12.4', '38.0%', '运行 9 年 4 个月'],
          ['36', 'you', 'you.exe', '3.1', '99.9%', '该进程正在被覆盖'],
          ['88', '?', 'doll.render', '0.0', '0.2%', '无父进程'],
        ];
        this.print('  PID  USER  COMMAND         CPU    MEM    NOTE');
        rows.forEach((r) => {
          this.print('  ' + r[0].padEnd(5) + r[1].padEnd(6) + r[2].padEnd(16) + r[3].padEnd(7) + r[4].padEnd(7) + r[5],
            r[0] === '36' ? 'dev-hot' : (r[0] === '88' ? 'dev-dim' : ''));
        });
        this.print('');
        this.print('（88 号没有父进程。它不该在跑。）', 'dev-dim');
      },

      whoami() {
        this.print('记录 #36');
        this.print('  名字   ████（你在第一章报过一次，只有一次）');
        this.print('  押品   身');
        this.print('  状态   待覆盖');
        this.print('  到访   ' + (S().ch5 >= 2 ? '35 次' : '——'));
      },

      clue() {
        const ids = Object.keys(CLUES);
        if (!clueCount()) { this.print('一条也没有。线索不在明面上，在文件里。'); return; }
        this.print('已找到 ' + clueCount() + ' / ' + ids.length + ' 条：');
        ids.forEach((id) => {
          const c = CLUES[id];
          this.print(S().clues[id]
            ? '  [x] ' + c.name + '　—　' + c.text
            : '  [ ] ' + c.name + '　—　（' + c.where + '）');
        });
      },

      open(a) {
        // 注意：open 是唯一在"只读层"就能用的写操作。
        // 第四章那扇门就是靠它开的——先能点，才谈得上能改。
        if (!S().devMode) this.print('（当前图层只读：只能点，不能改。）', 'dev-dim');
        if (!a) { this.print('用法: open <选择器>', 'dev-err'); return; }
        const el = document.querySelector(a);
        const hook = this.opens[a];
        if (!el && !hook) { this.print('open: 没有匹配的元素: ' + a, 'dev-err'); return; }
        if (hook) { this.print('→ ' + a + ' 已触发'); hook(); return; }
        el.click();
        this.print('→ ' + a + ' 已点击（它绑了什么，就发生什么）');
      },

      patch(a) {
        if (!this.needWrite()) return;
        const m = String(a).match(/^([a-zA-Z0-9_]+)\s*=\s*(.*)$/);
        if (!m) { this.print('用法: patch 键=值', 'dev-err'); return; }
        const k = m[1];
        let v = m[2];
        if (/^-?\d+$/.test(v)) v = parseInt(v, 10);
        S()[k] = v;
        this.print('已写入 State.' + k + ' = ' + JSON.stringify(v));
        if (k === 'playerName') this.print('（你把自己的名字写进去了。它本来就在里面。）', 'dev-dim');
      },

      find(a) {
        if (!this.needWrite()) return;
        const n = parseInt(a, 10);
        if (!n) { this.print('用法: find <编号>', 'dev-err'); return; }
        if (global.Root && global.Root.jumpTo) {
          this.print('→ 定位记录 #' + n);
          global.Root.jumpTo(n);
        } else {
          this.print('find: 当前图层没有列表', 'dev-err');
        }
      },

      del(a) {
        if (!this.needWrite()) return;
        if (a !== '/var/records/36') {
          this.print('del: 只允许删除正在写入的记录', 'dev-err');
          return;
        }
        if (!S().recordFound) { this.print('del: 记录仍在写入，拒绝', 'dev-err'); return; }
        if (global.Root && global.Root.forceChoice) {
          this.print('→ 删除 #36');
          this.print('（你按了删除。删除键在这个世界上，是最像"离开"的东西。）', 'dev-dim');
          global.Root.forceChoice('delete');
        } else {
          this.print('del: 没有可删除的目标', 'dev-err');
        }
      },
    },

    /* 开机横幅 + 真·控制台里的彩蛋（用 DevTools 的人会看见） */
    boot() {
      if (this.booted) return;
      this.booted = true;
      this.buildDom();
      const st = 'background:#0b0906;color:#c9a45c;padding:2px 8px;font-family:monospace';
      const st2 = 'background:#0b0906;color:#7fc8a0;padding:2px 8px;font-family:monospace';
      try {
        console.log('%c MEMORY-VAULT %c build 0.9.36 %c 记录 #36 · 未释放 ',
          st, 'color:#8d7a5e;background:#0b0906;font-family:monospace', st2);
        console.log('%c这一层只是外壳。库在 /var/records。',
          'color:#6d5c44;font-family:monospace');
        console.log('%c试试 __mv.records(36)，或者按 F2。',
          'color:#4e7a63;font-family:monospace');
      } catch (e) {}

      global.__mv = {
        build: '0.9.36',
        records(n) {
          if (n == null) return Object.keys(RECORDS).map(Number);
          if (!RECORDS[n]) return 'no such record: ' + n;
          if (n === 36 && !S().recordFound) return 'EACCES: 记录正在被写入';
          return RECORDS[n];
        },
        log(which) { return which === 'build' ? BUILD_LOG : accessLog(); },
        fs: () => Object.keys(FILES),
        clues: () => CLUES,
        state: () => S(),
        dev: () => Dev.show(),
      };
    },
  };

  global.Dev = Dev;
  global.CLUES = CLUES;
  global.clueCount = clueCount;
  global.gainClue = gain;
})(window);
