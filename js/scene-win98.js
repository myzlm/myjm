/* ============================================================
   scene-win98.js — Win98 桌面 / PDF / 打印 → 交给老人
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Fade, Toast, pick } = global.G;

  const Win98 = {
    inited: false,
    mode: 'folder',   // folder | pdf
    selected: null,

    init() {
      if (this.inited) return;
      this.inited = true;

      // 桌面文件夹图标
      $('#icon-folder').addEventListener('click', () => this.openFolder());
      $('#icon-folder').addEventListener('dblclick', () => this.openFolder());
      $('#w98-close').addEventListener('click', () => $('#w98-win').classList.remove('open'));
      $('#w98-menu').addEventListener('click', () => {});

      // 右键菜单
      document.addEventListener('contextmenu', (e) => {
        if (!App.isCurrent('win98')) return;
        const inWin = e.target.closest('#w98-win');
        if (!inWin) return;
        e.preventDefault();
        const file = e.target.closest('.w98-file');
        if (file) {
          this.selected = file.dataset.f;
          $$('.w98-file').forEach((f) => f.classList.toggle('sel', f === file));
        }
        const menu = $('#ctx-menu');
        const box = $('#w98').getBoundingClientRect();
        menu.style.left = Math.min(e.clientX - box.left, box.width - 150) + 'px';
        menu.style.top = Math.min(e.clientY - box.top, box.height - 130) + 'px';
        menu.classList.add('on');
        Snd.click();
      });
      document.addEventListener('click', (e) => {
        if (!e.target.closest('#ctx-menu')) this.hideCtx();
        if (!App.isCurrent('win98')) return;
        const file = e.target.closest('.w98-file');
        $$('.w98-file').forEach((f) => f.classList.toggle('sel', f === file));
        if (file) { this.selected = file.dataset.f; Snd.click(); }
      });

      $('#ctx-menu').addEventListener('click', (e) => {
        const item = e.target.closest('.ctx-item');
        if (!item || item.classList.contains('ctx-dis')) return;
        const act = item.dataset.act;
        this.hideCtx();
        if (act === 'print') this.print();
        if (act === 'open') this.openPDF();
      });
    },

    start() {
      this.init();
      const name = State.playerName || '新建文件夹';

      $('#ico-label').textContent = name;
      $('#w98-ttitle').textContent = name;
      $('#w98-addr').textContent = '地址：C:\\记忆殿\\' + name;
      $('#w98-win').classList.add('open');
      $('#w98-tasks').innerHTML = '<div class="w98-taskchip">' + name + '</div>';
      this.renderFolder();
      this.mode = 'folder';

      // 任务栏时钟 —— 它不动
      $('#w98-clock').textContent = '9';
      Snd.window();
    },

    hideCtx() {
      $('#ctx-menu').classList.remove('on');
    },

    renderFolder() {
      const c = $('#w98-content');
      c.innerHTML = '';
      const name = State.playerName || '新建文件夹';
      const f = document.createElement('div');
      f.className = 'w98-file';
      f.dataset.f = 'pdf';
      f.innerHTML =
        '<div class="ico-pdf">PDF</div>' +
        '<div class="ico-label2">' + escapeHtml(name) + '.pdf</div>';
      f.addEventListener('dblclick', () => this.openPDF());
      c.appendChild(f);
      $('#w98-status').textContent = '1 个对象　|　' + (Math.floor(Math.random() * 3) + 1) + ' KB';
      this.selected = null;
    },

    openFolder() {
      $('#w98-win').classList.add('open');
      if (this.mode === 'pdf') this.renderFolder();
      this.mode = 'folder';
      Snd.window();
    },

    openPDF() {
      if (this.mode === 'pdf') return;
      this.mode = 'pdf';
      const c = $('#w98-content');
      const fp = State.hwFp || '----';
      const lines = archivePDF(State.playerName, State.job, fp).split('\n');
      c.innerHTML =
        '<div class="pdfview">' +
        '<div class="pdfpage">' +
        '<div class="pdfhead">记 忆 档 案 · 第 三 十 六 号</div>' +
        '<div class="pdfbody">' + lines.map((l) => '<p>' + escapeHtml(l) + '</p>').join('') + '</div>' +
        '<div class="pdfstamp">已 归 档</div>' +
        '</div></div>';
      $('#w98-ttitle').textContent = (State.playerName || '文件') + '.pdf - 记事本';
      $('#w98-addr').textContent = '地址：C:\\记忆殿\\' + (State.playerName || '') + '\\' + (State.playerName || '') + '.pdf';
      $('#w98-status').textContent = '第 1 页，共 1 页　·　在此窗口内点右键，可以打印';
      Snd.window();
      Snd.tone(300, 0.3, { type: 'triangle', gain: 0.03 });
    },

    async print() {
      if (this.mode !== 'pdf') {
        // 没打开文件直接打印 → 仍可，但提示
      }
      Toast.show('正在发送到打印机……', 2000);
      Snd.tone(660, 0.16, { type: 'triangle', gain: 0.06 });
      await wait(1400);
      await Fade.through(() => {
        App.show('print');
        Print.start();
      });
    },
  };

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  /* ============================================================
     打印机
     ============================================================ */
  const Print = {
    inited: false,

    init() {
      if (this.inited) return;
      this.inited = true;
      $('#pr-paper').addEventListener('click', () => this.take());
    },

    async start() {
      this.init();
      const paper = $('#pr-paper');
      paper.classList.remove('out', 'takeable');
      $('#pr-led').classList.remove('on', 'err');
      $('#pr-status').textContent = '打印队列：1 个文档';
      $('#pr-hint').textContent = '';

      await wait(700);
      $('#pr-led').classList.add('on');
      $('#pr-status').textContent = '正在打印：' + (State.playerName || '文档') + '.pdf';
      Snd.printer(2.2);

      // 纸张内容
      const fp = State.hwFp || '----';
      $('#pp-body').textContent = archivePDF(State.playerName, State.job, fp);

      await wait(400);
      paper.classList.add('out');
      await wait(2000);

      $('#pr-led').classList.remove('on');
      $('#pr-status').textContent = '打印完成';
      $('#pr-hint').textContent = '点击纸张，把它拿起来';
      paper.classList.add('takeable');
      Snd.ok();
    },

    async take() {
      if (!$('#pr-paper').classList.contains('takeable')) return;
      $('#pr-paper').classList.remove('takeable');
      Snd.noise(0.2, { type: 'highpass', freq: 2400, gain: 0.08 });
      $('#pr-hint').textContent = '（纸还是温的。）';
      State.printed = true;
      await wait(900);

      $('#pr-hint').textContent = '把它交给柜台后面的人。';
      await wait(1400);

      await Fade.through(() => {
        App.show('counter');
        Counter.init();
        $('#pc-screen').classList.add('on');
        $('#case-led').classList.add('on');
      });

      await wait(500);
      Counter.say('（你把那张纸放在柜台上。）\n（他没有马上接。）', 0);
      Snd.tone(90, 1.4, { type: 'sine', gain: 0.07, attack: .3 });
      await wait(3200);

      Counter.say('（他终于伸手，把纸拿了过去。）', 0);
      Snd.noise(0.4, { type: 'bandpass', freq: 900, q: 1.2, gain: 0.07 });
      await wait(2600);

      // —— 第二章开始：登记之后，才是抵押 ——
      State.gavePaper = true;
      State.ch2 = Math.max(State.ch2, 1);
      const dr = $('#cs-drawer');
      if (dr) dr.classList.add('on');
      Counter.refreshHud();
      $('#cs-dialogue').classList.remove('on');
      await Dlg.open('afterPaper');
      if (global.Chapter) await global.Chapter.show('ch2');
      Counter.updateHint();
    },
  };

  /* ============================================================
     结局
     ============================================================ */
  const End = {
    async show() {
      await wait(1200);
      await Fade.through(() => {
        App.show('end');
        $('#end-text').textContent = '';
        $('#end-restart').classList.remove('on');
      }, true);

      const text = (typeof global.endText === 'function')
        ? global.endText(State.keyQ, State.wish, { exposed: State.exposed, soul: State.soulAnswered })
        : TEXT.end;
      const el = $('#end-text');
      let i = 0;
      await new Promise((res) => {
        let done = false;
        const finish = () => {
          if (done) return;
          done = true;
          clearInterval(t);
          el.textContent = text;
          $('#screen-end').removeEventListener('click', skip);
          document.removeEventListener('keydown', skipKey);
          res();
        };
        const skip = () => finish();
        const skipKey = (e) => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); finish(); } };
        const t = setInterval(() => {
          if (i >= text.length) { finish(); return; }
          const ch = text[i++];
          el.textContent += ch;
          if (ch !== '\n' && i % 3 === 0) Snd.tone(1600, 0.015, { type: 'sine', gain: 0.008 });
        }, 30);
        // 结局长文，点一下就看全
        $('#screen-end').addEventListener('click', skip);
        document.addEventListener('keydown', skipKey);
      });

      Snd.tone(70, 6, { type: 'sine', gain: 0.06, attack: 2 });
      await wait(600);
      $('#end-restart').classList.add('on');
      $('#end-restart').onclick = () => location.reload();

      // 第五章之后还有终章：回响
      let echo = document.getElementById('end-echo');
      if (!echo) {
        echo = document.createElement('button');
        echo.id = 'end-echo';
        echo.className = 'end-restart end-echo';
        echo.textContent = '回 响';
        $('#end-restart').parentNode.insertBefore(echo, $('#end-restart'));
      }
      echo.classList.add('on');
      echo.onclick = () => {
        if (global.Final) {
          App.show('final');
          global.Final.start();
        }
      };
    },
  };

  global.Win98 = Win98;
  global.Print = Print;
  global.End = End;
})(window);
