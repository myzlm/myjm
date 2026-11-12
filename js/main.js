/* ============================================================
   main.js — 场景管理 / 启动
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait } = global.G;

  const App = {
    current: '',

    show(name) {
      $$('.screen').forEach((s) => s.classList.toggle('active', s.dataset.screen === name));
      this.current = name;
      // 隐藏背包（除柜台/密码场景外）
      const inv = $('#inventory');
      if (name === 'counter' || name === 'lock') inv.classList.add('on');
      else inv.classList.remove('on');
    },

    isCurrent(name) { return this.current === name; },
  };

  global.App = App;

  /* ---------- 自检（?selftest=1）---------- */
  function selftest() {
    const log = [];
    const errs = [];
    window.addEventListener('error', (e) => errs.push('ERR ' + e.message));
    const run = (name, fn) => {
      try { fn(); log.push(name + ' ok'); }
      catch (e) { log.push(name + ' FAIL:' + e.message); }
    };

    // 谜题逻辑（每局随机，所以用本局答案自检）
    const ans = PUZZLE.answer;
    log.push('N=' + PUZZLE.length + ' ans=' + ans);
    log.push('prints=' + JSON.stringify(PUZZLE.prints));
    log.push('ans=' + checkSequence(ans));
    log.push('bad=' + checkSequence('z'.repeat(PUZZLE.length)));
    log.push('short=' + checkSequence(ans.slice(1)));

    run('Mail', () => Mail.init());
    run('Download', () => { App.show('download'); Download.init(); });
    run('Hall', () => { App.show('hall'); Hall.init(); });
    run('Contract', () => { App.show('contract'); Contract.init(); Contract.resetForm(); $('#form-wrap').classList.add('on'); });
    run('Counter', () => { App.show('counter'); Counter.init(); });
    run('Rhythm', () => { App.show('rhythm'); Rhythm.init(); });
    run('Pry', () => { App.show('pry'); Pry.start(); });
    run('Lock', () => { App.show('lock'); Lock.start(); });
    run('Win98', () => { App.show('win98'); Win98.start(); });
    run('Print', () => { App.show('print'); Print.init(); });
    run('hwFp', () => { log.push('hw=' + G.hwFingerprint()); });

    setTimeout(() => {
      document.title = 'SELFTEST ' + log.concat(errs).join(' | ');
    }, 600);
  }

  /* ---------- 启动 ---------- */
  function boot() {
    App.show('mail');
    // 关键：邮件与下载页的所有点击都在 Mail.init 里绑定，必须先初始化
    Mail.init();

    // 调试入口：?scene=hall|counter|lock|win98|doll|pry|rhythm|form|end&name=xxx&job=xxx
    const qs = new URLSearchParams(location.search);
    const scene = qs.get('scene');
    // 截图/联调时跳过 CSS 过渡
    if (qs.get('fast') === '1') {
      const st = document.createElement('style');
      st.textContent = '*,*::before,*::after{transition-duration:0s!important;transition-delay:0s!important;animation-duration:.001s!important;animation-delay:0s!important}';
      document.head.appendChild(st);
    }
    if (qs.get('name')) State.playerName = qs.get('name');
    if (qs.get('job')) State.job = qs.get('job');
    if (qs.get('selftest') === '1') { selftest(); return; }
    if (scene) {
      setTimeout(() => {
        switch (scene) {
          case 'hall': App.show('hall'); Hall.init(); break;
          case 'contract': App.show('contract'); Contract.start(); break;
          case 'form':
            App.show('contract');
            $('#ct-room').classList.add('on');
            Contract.init(); Contract.resetForm();
            $('#form-wrap').classList.add('on');
            break;
          case 'dark': App.show('dark'); break;
          case 'doll': App.show('doll'); break;
          case 'counter':
            App.show('counter');
            State.hasUV = State.hasUV || qs.get('uv') === '1';
            Counter.init();
            break;
          case 'rhythm':
            App.show('rhythm');
            if (qs.get('play') === '1') Rhythm.start();
            break;
          case 'pry': App.show('pry'); Pry.start(); break;
          case 'lock':
            App.show('lock');
            State.hasUV = qs.get('uv') !== '0';
            Lock.start();
            if (qs.get('uv') === '1') setTimeout(() => Lock.toggleUV(), 300);
            break;
          case 'win98':
            App.show('win98');
            Win98.start();
            if (qs.get('pdf') === '1') setTimeout(() => Win98.openPDF(), 200);
            break;
          case 'print': App.show('print'); Print.start(); break;
          case 'end': App.show('end'); End.show(); break;
        }
      }, 60);
    }

    // 首次交互时启动音频上下文
    const startAudio = () => {
      Snd.init();
      document.removeEventListener('pointerdown', startAudio);
      document.removeEventListener('keydown', startAudio);
    };
    document.addEventListener('pointerdown', startAudio);
    document.addEventListener('keydown', startAudio);

    // 全局静音键
    document.addEventListener('keydown', (e) => {
      if (e.key === 'm' || e.key === 'M') {
        if (e.target.tagName === 'INPUT') return;
        global.Snd.muted = !global.Snd.muted;
        global.Snd.setMute(global.Snd.muted);
        global.G.Toast.show(global.Snd.muted ? '静音' : '恢复声音');
      }
    });

    // 阻止空格滚动
    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' && e.target.tagName !== 'INPUT') e.preventDefault();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})(window);
