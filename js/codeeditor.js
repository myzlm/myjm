/* ============================================================
   codeeditor.js — L∞ 编写者
   ------------------------------------------------------------
   真正会执行的代码。不是脚本演出——你写什么，就跑什么。
   能碰的东西只有这一间屋子：节点、记忆、门、你自己。
   写坏了，世界就坏一块。删干净了，就什么都不剩。
   ============================================================ */
(function (global) {
  'use strict';

  const { Toast, wait } = global.G;

  const SAMPLE = [
    '// 你可以在这一格里写任何东西。',
    '// 能用的东西：node / deleteNode / deleteAllNodes / restart',
    '//             learn / generateWorld / dark_forest / readFile',
    '',
    'const p = node("player");',
    'print("登记名：" + p.name);',
    'print("已删除节点：" + node("root").sys.deleted);',
    '',
    '// deleteNode("wall");        // 让墙消失',
    '// deleteNode("player");      // 删掉自己',
    '// deleteAllNodes();          // 归零',
  ].join('\n');

  const FILES = {
    '/var/records/36': '记录 #036\n状态：待覆盖\n姓名：（空白）\n备注：阅读者即为被记录者。',
    '/var/records/1': '记录 #001\n姓名：林秀英\n抵押物：她女儿第一次叫她"妈"的那一声。\n备注：钥匙品相 完美。她没有回来取。',
    '/etc/mount.conf': 'mount --bind /mnt/old /var/records\n# 旧的从来没卸载过。',
    '/app/hall.js': 'render("wall", 9);\nrender("npc", 2);   // 人在墙后面\n// TODO: 把人挪到前面来。第 12 次了。',
  };

  const CodeEd = {
    el: null,
    open: false,
    out: [],

    show() {
      this.build();
      if (this.open) return;
      this.open = true;
      this.el.classList.add('on');
      if (global.Snd && global.Snd.tone) global.Snd.tone(520, 0.1, { type: 'sine', gain: 0.04 });
      setTimeout(() => { const t = this.el.querySelector('textarea'); if (t) t.focus(); }, 60);
    },

    hide() {
      this.open = false;
      if (this.el) this.el.classList.remove('on');
    },

    build() {
      if (this.el) return;
      const d = document.createElement('div');
      d.className = 'codeed';
      d.id = 'codeed';
      d.innerHTML =
        '<div class="ce-win">' +
        '<div class="ce-bar"><span class="ce-dot r"></span><span class="ce-dot y"></span><span class="ce-dot g"></span>' +
        '<b>editor · L∞ 编写者</b><span class="ce-path">/app/world.js</span>' +
        '<button class="ce-x" id="ce-x">×</button></div>' +
        '<div class="ce-body">' +
        '<div class="ce-left">' +
        '<div class="ce-nums" id="ce-nums">1</div>' +
        '<textarea id="ce-code" spellcheck="false"></textarea>' +
        '</div>' +
        '<div class="ce-out" id="ce-out"></div>' +
        '</div>' +
        '<div class="ce-foot">' +
        '<button class="ce-run" id="ce-run">运 行</button>' +
        '<button class="ce-clear" id="ce-clear">清空</button>' +
        '<span class="ce-tip">Ctrl+Enter 运行　·　这是真的代码</span>' +
        '</div>' +
        '</div>';
      document.body.appendChild(d);
      this.el = d;
      const ta = d.querySelector('#ce-code');
      ta.value = SAMPLE;
      ta.addEventListener('input', () => this.numbers());
      ta.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') { e.preventDefault(); const s = ta.selectionStart; ta.value = ta.value.slice(0, s) + '  ' + ta.value.slice(ta.selectionEnd); ta.selectionStart = ta.selectionEnd = s + 2; this.numbers(); }
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); this.run(); }
      });
      d.querySelector('#ce-x').onclick = () => this.hide();
      d.querySelector('#ce-run').onclick = () => this.run();
      d.querySelector('#ce-clear').onclick = () => {
        d.querySelector('#ce-out').innerHTML = '';
        this.out = [];
      };
      this.numbers();
    },

    numbers() {
      const ta = this.el.querySelector('#ce-code');
      const n = ta.value.split('\n').length;
      this.el.querySelector('#ce-nums').textContent = Array.from({ length: n }, (_, i) => i + 1).join('\n');
    },

    print(t, cls) {
      const out = this.el.querySelector('#ce-out');
      const d = document.createElement('div');
      if (cls) d.className = cls;
      d.textContent = t;
      out.appendChild(d);
      out.scrollTop = out.scrollHeight;
    },

    /* ---------------- 执行 ---------------- */
    async run() {
      this.build();
      const code = this.el.querySelector('#ce-code').value;
      const S = global.State;
      if (S && S.sys) S.sys.editorRuns++;
      document.dispatchEvent(new CustomEvent('codeRun', { detail: code }));

      // C++ 彩蛋：手搓一个只认 cout 的解释器
      if (/#include|std::cout/.test(code)) {
        this.print('$ g++ world.cpp -o world && ./world', 'ce-dim');
        const outs = (code.match(/cout\s*<<\s*"([^"]*)"/g) || []).map((m) => m.replace(/.*"([^"]*)".*/, '$1'));
        if (!outs.length) this.print('（编译通过。没有任何输出。）', 'ce-ok');
        outs.forEach((o) => this.print(o, 'ce-ok'));
        this.print('信奥生？继续。', 'ce-dim');
        document.dispatchEvent(new CustomEvent('codeRunOk', { detail: code }));
        return;
      }

      const logs = [];
      const api = this.api(logs);
      this.print('$ run world.js', 'ce-dim');
      let result;
      try {
        const fn = new Function(
          'console', 'print', 'node', 'deleteNode', 'deleteAllNodes', 'restart',
          'learn', 'generateWorld', 'dark_forest', 'readFile',
          '"use strict"; return (async function(){' + code + '\n})();'
        );
        result = await fn(
          { log: (...a) => logs.push(a.join(' ')), error: (...a) => logs.push('E ' + a.join(' ')), warn: (...a) => logs.push('W ' + a.join(' ')) },
          (...a) => logs.push(a.map(String).join(' ')),
          api.node, api.deleteNode, api.deleteAllNodes, api.restart,
          api.learn, api.generateWorld, api.dark_forest, api.readFile
        );
      } catch (e) {
        this.print('✗ ' + (e && e.message ? e.message : e), 'ce-err');
        this.checkPatterns(code, false);
        return;
      }
      logs.forEach((l) => this.print(l, 'ce-ok'));
      if (result !== undefined && result !== null) this.print('← ' + String(result).slice(0, 300), 'ce-dim');
      if (!logs.length && result === undefined) this.print('（没有输出。）', 'ce-dim');
      this.print('— 执行完毕 —', 'ce-dim');
      document.dispatchEvent(new CustomEvent('codeRunOk', { detail: code }));
      this.checkPatterns(code, true);
    },

    api(logs) {
      const S = global.State;
      const sys = (S.sys = S.sys || {});
      const nd = (id) => {
        const n = (global.PERSP_NODES || []).find((x) => x.id === id) || { id: id, n: id, p: {}, t: 'unknown' };
        return { id: n.id, name: n.n, type: n.t, params: n.p, sys: sys };
      };
      return {
        node: nd,
        deleteNode(id) {
          if (id === 'player') {
            sys.selfDeleted = true;
            logs.push('player 已删除。你还在读这一行，说明删除还没生效。');
            document.dispatchEvent(new CustomEvent('selfDeleted'));
            return;
          }
          if (global.Persp) global.Persp.deleted[id] = true;
          sys.deleted++;
          logs.push('节点 ' + id + ' 已删除。');
        },
        deleteAllNodes() {
          sys.allDeleted = true;
          sys.deleted = (global.PERSP_NODES || []).length;
          if (global.Persp) {
            (global.PERSP_NODES || []).forEach((n) => { global.Persp.deleted[n.id] = true; });
          }
          logs.push('全部节点已清空。');
        },
        restart() {
          sys.rebooted = true;
          logs.push('system.reboot() → 完成。');
          document.body.classList.add('glitch-once');
          setTimeout(() => document.body.classList.remove('glitch-once'), 500);
        },
        learn() {
          sys.taughtAI = true;
          logs.push('它学会了。它问：这一件，要记住吗？');
        },
        generateWorld() {
          sys.newWorld = true;
          logs.push('世界已生成。第一个请求：一扇窗。');
        },
        dark_forest() { logs.push('黑暗森林法则已启用。不要回答。'); },
        readFile(p) { return FILES[p] || 'E: 文件不存在：' + p; },
      };
    },

    /* 运行后按代码内容触发结局 / 彩蛋（注释里的不算） */
    checkPatterns(raw, ran) {
      const S = global.State;
      const sys = S.sys;
      const code = String(raw)
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/[^\n]*/g, '');
      const hit = (id) => {
        if (global.Endings) global.Endings.mark(id);
        this.print('◆ 结局已抵达：' + (global.Endings ? global.Endings.get(id).name : id), 'ce-end');
        Toast.show('结局已写入档案：' + (global.Endings ? global.Endings.get(id).name : id), 3200);
      };
      if (/deleteNode\s*\(\s*['"]player['"]\s*\)/.test(code)) hit('recycler');
      else if (/deleteAllNodes\s*\(/.test(code)) hit('eraser');
      else if (/document\.(body|documentElement)\.innerHTML/.test(code)) { sys.printed = true; hit('recursive'); }
      else if (/reboot|restart\s*\(/.test(code) && ran) hit('rebel');
      else if (/(generateWorld|newWorld)\s*\(/.test(code) && ran) hit('compiler');
      else if (/\blearn\s*\(|训练|学习/.test(code) && ran) hit('cooperator');
    },
  };

  global.CodeEd = CodeEd;
})(window);
