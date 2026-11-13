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
    run('Ledger', () => { App.show('ledger'); Ledger.start(); });
    run('Film', () => { App.show('film'); Film.start(); });
    run('Scale', () => { App.show('scale'); Scale.start(); });
    run('Soul', () => {
      if (!global.SOUL_CALLS || global.SOUL_CALLS.length !== 6) throw new Error('calls');
      const bad = global.SOUL_CALLS.filter((c) => c.right !== 'yes' && c.right !== 'no');
      if (bad.length) throw new Error('bad answer');
      log.push('soul calls=' + global.SOUL_CALLS.length);
    });
    run('Press', () => { App.show('stash'); Press.refresh(); });
    run('ProofMap', () => {
      const miss = [];
      global.CLAIM_ORDER.forEach((cid) => {
        const c = global.CLAIMS[cid];
        if (!c) { miss.push('claim:' + cid); return; }
        if (!global.PROOFS[c.proof]) miss.push(cid + '->' + c.proof);
      });
      Object.keys(global.PROOFS).forEach((pid) => {
        const p = global.PROOFS[pid];
        if (!global.CLAIMS[p.claim]) miss.push(pid + '->' + p.claim);
      });
      if (miss.length) throw new Error(miss.join(','));
      log.push('proofs=' + Object.keys(global.PROOFS).length);
    });
    run('DlgTree', () => {
      const ids = Object.keys(DLG);
      const missing = [];
      ids.forEach((id) => {
        const n = DLG[id];
        const nxt = typeof n.next === 'function' ? n.next() : n.next;
        if (nxt && !DLG[nxt]) missing.push(id + '->' + nxt);
        const ch = typeof n.choices === 'function' ? (n.choices() || []) : (n.choices || []);
        ch.forEach((c) => { if (c.to && !DLG[c.to]) missing.push(id + '=>' + c.to); });
      });
      if (missing.length) throw new Error('dead link: ' + missing.join(','));
      log.push('dlg nodes=' + ids.length);
    });
    run('Wishes', () => {
      const bad = WISHES.filter((w) => {
        // 1/2/4/8/16 五块砝码能不能凑出这个重量
        for (let m = 0; m < 32; m++) {
          let s = 0;
          for (let i = 0; i < 5; i++) if (m & (1 << i)) s += [1, 2, 4, 8, 16][i];
          if (s === w.weight) return false;
        }
        return true;
      });
      if (bad.length) throw new Error('unweighable: ' + bad.map((w) => w.id).join(','));
      log.push('wishes=' + WISHES.length);
    });
    run('hwFp', () => { log.push('hw=' + G.hwFingerprint()); });

    /* ---- 第四 / 五章 ---- */
    run('Layer', () => { App.show('layer'); Layer.start(); });
    run('Root', () => { App.show('root'); Root.start(); });
    run('DevFS', () => {
      const need = ['/app/hall.js', '/app/render.css', '/app/memory.js', '/etc/mount.conf',
        '/log/build.log', '/log/access.log', '/var/records/1', '/var/records/14',
        '/var/records/35', '/var/records/36'];
      const miss = need.filter((p) => !global.Dev || !Dev.cmds || !p);
      if (!global.CLUES) throw new Error('no clues');
      const ids = Object.keys(global.CLUES);
      if (ids.length !== 4) throw new Error('clues=' + ids.length);
      if (miss.length) throw new Error(miss.join(','));
      log.push('clues=' + ids.length);
    });
    run('Endings', () => {
      const bad = ['overwrite', 'delete', 'logout', 'unbind', 'nameless'].filter((c) => {
        const t = global.rootEndText(c, { exposed: 6, soul: true });
        return !t || t.length < 200;
      });
      if (bad.length) throw new Error('short: ' + bad.join(','));
      log.push('endings ok');
    });

    setTimeout(() => {
      document.title = 'SELFTEST ' + log.concat(errs).join(' | ');
    }, 600);
  }

  /* ---------- 启动 ---------- */
  function boot() {
    App.show('mail');
    // 关键：邮件与下载页的所有点击都在 Mail.init 里绑定，必须先初始化
    Mail.init();

    // 开发者模式：F2 / ~ 打开；同时往真·控制台里打一行横幅（用 DevTools 的人会看见）
    if (global.Dev) Dev.boot();

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
            if (qs.get('ch2')) State.ch2 = +qs.get('ch2');
            if (qs.get('key')) State.keyQ = qs.get('key');
            if (qs.get('soul') === '1') { State.soulDone = true; State.soulAnswered = true; }
            if (qs.get('proofs')) qs.get('proofs').split(',').forEach((p) => Lies.gain(p));
            if (qs.get('lie')) State.exposed = +qs.get('lie');
            if (State.ch2 >= 1) State.gavePaper = true;
            Counter.init();
            break;
          case 'stash': App.show('stash'); Press.refresh(); break;
          case 'soul': App.show('soul'); Soul.run(); break;
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
          case 'ledger': App.show('ledger'); Ledger.start(); break;
          case 'film': App.show('film'); Film.start(); break;
          case 'scale': App.show('scale'); Scale.start(); break;
          case 'layer':
            App.show('layer');
            if (qs.get('ch4')) State.ch4 = +qs.get('ch4');
            if (qs.get('dev') === '1') State.devMode = true;
            Layer.start();
            break;
          case 'root':
            App.show('root');
            if (qs.get('name')) State.playerName = qs.get('name');
            if (qs.get('rec') === '1') State.recordFound = true;
            if (qs.get('clues')) qs.get('clues').split(',').forEach((c) => global.gainClue(c));
            Root.start();
            if (qs.get('rec') === '1') setTimeout(() => Root.openRecord(), 2600);
            break;
          case 'dev':
            App.show('counter');
            State.ch2 = 1;
            State.devMode = qs.get('ro') !== '1';
            Counter.init();
            setTimeout(() => global.Dev.show(), 200);
            break;
          case 'dlg':
            App.show('counter');
            State.ch2 = 1;
            Counter.init();
            Dlg.open(qs.get('id') || 'intro');
            break;
          case 'end':
            App.show('end');
            if (qs.get('key')) State.keyQ = qs.get('key');
            if (qs.get('wish')) State.wish = qs.get('wish');
            if (qs.get('lie')) State.exposed = +qs.get('lie');
            if (qs.get('soul') === '1') State.soulAnswered = true;
            End.show();
            break;
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
