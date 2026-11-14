/* ============================================================
   main.js — 场景管理 / 启动
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait } = global.G;

  /* 每个场景配一首曲子；null = 让这一关自己发声（节奏关有它自己的鼓） */
  const THEME_OF = {
    mail: 'mail', download: 'mail',
    login: 'login',
    hall: 'hall', contract: 'hall',
    dark: 'void', doll: 'void', soul: 'void',
    counter: 'counter', verify: 'counter', stash: 'counter',
    pry: 'counter', lock: 'counter', print: 'counter',
    ledger: 'ch2', film: 'ch2', scale: 'ch2',
    oil: 'ch2', clock: 'ch2', scratch: 'ch2',
    win98: 'ch2',
    layer: 'chase',
    rhythm: null,
    root: 'deep', anomaly: 'deep', duty: 'counter',
    moyun: 'moyun',
    space: 'deep',
    end: 'final', final: 'final',
  };
  const TENSION_OF = {
    chase: 0.82, deep: 0.56, root: 0.56, anomaly: 0.6,
    void: 0.62, hall: 0.34, mail: 0.45, login: 0.5,
    counter: 0.4, ch2: 0.44, moyun: 0.3, final: 0.48,
  };

  const App = {
    current: '',

    show(name) {
      $$('.screen').forEach((s) => s.classList.toggle('active', s.dataset.screen === name));
      this.current = name;
      // 隐藏背包（除柜台/密码场景外）
      const inv = $('#inventory');
      if (name === 'counter' || name === 'lock') inv.classList.add('on');
      else inv.classList.remove('on');
      // 侧边坞只在这间屋子里出现（序章、下载页、终章、卷轴里都不该有）
      const outside = ['mail', 'download', 'login', 'contract', 'dark', 'doll', 'final', 'moyun', 'end', 'space', 'duty'];
      document.body.classList.toggle('in-game', outside.indexOf(name) < 0);

      // 配乐：同一首不重起，换首就交叉淡变
      if (global.Music) {
        const tid = THEME_OF[name];
        if (tid === null) global.Music.stop(1.2);
        else if (tid) {
          global.Music.tension(TENSION_OF[tid] == null ? 0.42 : TENSION_OF[tid]);
          global.Music.play(tid);
        }
      }
    },

    isCurrent(name) { return this.current === name; },
  };

  global.App = App;

  /* ---------- 记账：说过话的人、动过手的人 ---------- */
  global.Sys = {
    /* 说过话：同一个人只算一次。艾 + 六个纸人 = 7 */
    talk(id) {
      const S = global.State;
      if (!S) return 0;
      S.sys = S.sys || {};
      S.sys.npcs = S.sys.npcs || {};
      S.sys.npcs[id] = true;
      S.sys.talks = Object.keys(S.sys.npcs).length;
      return S.sys.talks;
    },
    /* 动过手：撕掉一个，仁慈就没了 */
    hurt(id) {
      const S = global.State;
      if (!S) return 0;
      S.sys = S.sys || {};
      S.sys.torn = S.sys.torn || {};
      S.sys.torn[id] = true;
      S.sys.hurt = Object.keys(S.sys.torn).length;
      S.sys.mercy = false;
      return S.sys.hurt;
    },
    /* 对局：同一个对手的胜场 */
    win(id, d) {
      const S = global.State;
      if (!S) return 0;
      S.sys = S.sys || {};
      S.sys.boss = S.sys.boss || {};
      S.sys.boss[id] = Math.max(0, (S.sys.boss[id] || 0) + (d || 1));
      S.sys.wins = Math.max(S.sys.wins || 0, S.sys.boss[id]);
      S.sys.bossMax = Math.max(S.sys.bossMax || 0, S.sys.boss[id]);
      return S.sys.boss[id];
    },
  };

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

    /* ---- v11 新系统 ---- */
    run('Cipher', () => {
      const key = global.TrueName.key('base');
      ['caesar', 'vigenere', 'rail', 'ancient'].forEach((alg) => {
        const pt = '不要相信典当行主人 v37';
        const ct = Cipher.enc(pt, key, alg);
        if (typeof ct !== 'string' || !ct.length) throw new Error(alg + ' enc');
        const back = Cipher.decSync(ct, key, alg);
        if (back !== pt) throw new Error(alg + ' roundtrip: ' + String(back).slice(0, 20));
      });
      // 古法五层：键盘上打得出来的一切都要能来回，落到纸上是 0—9 与 A—J
      const hard = 'a\tb\r\nc 100% ¤ 与 emoji 😀';
      const anc = Cipher.enc(hard, key, 'ancient');
      if (!/^[0-9A-J]+$/.test(anc)) throw new Error('ancient 字表不对');
      if (Cipher.decSync(anc, key, 'ancient') !== hard) throw new Error('ancient 转义往返');
      if (Cipher.decSync(anc, key + 'x', 'ancient') !== null) throw new Error('ancient 错钥匙不该解出东西');
      if (Cipher.decSync(anc.replace(/(.{7})/g, '$1 '), key, 'ancient') !== hard) throw new Error('ancient 容错空格');
      const bad = Cipher.solve('随便一段话', key);
      if (!bad || !bad.then) log.push('aes=async');
    });
    run('TrueName', () => {
      const d = TrueName.ensure();
      const ks = ['base', 'memory', 'action', 'sigil'].map((k) => TrueName.key(k));
      if (ks.some((k) => !k || typeof k !== 'string')) throw new Error('key');
      if (ks[0] === ks[3]) throw new Error('keys equal');
      if (d.base.length !== 8) throw new Error('base len');
      if (d.sigil.length !== 32) throw new Error('sigil len');
      log.push('tn=' + d.base + '/' + d.sigil.slice(0, 6));
    });
    run('Verify', () => {
      const a = Verify.analyze(Verify.SAMPLES[0]);
      const b = Verify.analyze(Verify.SAMPLES[1]);
      const c = Verify.analyze(Verify.SAMPLES[2]);
      if (!(a.score > b.score)) throw new Error('真实样本应高于模板样本 ' + a.score + '/' + b.score);
      if (!a.detail || a.detail < 3 || a.detail > 8) throw new Error('detail ' + a.detail);
      log.push('v=' + a.score + '/' + b.score + '/' + c.score + ' grade=' + a.grade);
      Verify.reset();
    });
    run('Endings', () => {
      if (Endings.list.length !== 20) throw new Error('count=' + Endings.list.length);
      const ids = Endings.list.map((e) => e.id);
      if (new Set(ids).size !== Endings.list.length) throw new Error('dup id');
      const nos = Endings.list.map((e) => e.no);
      if (nos.join(',') !== nos.slice().sort((x, y) => x - y).join(',')) throw new Error('编号乱序');
      const S = { playerName: '测试', sys: { verified: 0, deleted: 0, endings: [], ending: 'observer' } };
      const e = Endings.evaluate(S);
      if (!e || !e.text(S) || e.text(S).length < 80) throw new Error('text');
      log.push('endings=' + e.name);
    });
    run('Eggs', () => {
      if (Eggs.eggs.length !== 60) throw new Error('eggs=' + Eggs.eggs.length);
      if (Eggs.fusions.length !== 44) throw new Error('fus=' + Eggs.fusions.length);
      const bad = Eggs.fusions.filter((f) => f.need.some((id) => id < 1 || id > 60));
      if (bad.length) throw new Error('bad need');
      // 融合编号必须唯一、且是 M1—M44
      const fids = Eggs.fusions.map((f) => f.id);
      if (new Set(fids).size !== 44) throw new Error('dup fusion id');
      const wrong = fids.filter((id, i) => id !== 'M' + (i + 1));
      if (wrong.length) throw new Error('fusion id order: ' + wrong[0]);
      // needF 必须指向真实存在的融合，且不能指向自己
      const badF = Eggs.fusions.filter((f) => (f.needF || []).some((id) => id === f.id || fids.indexOf(id) < 0));
      if (badF.length) throw new Error('bad needF: ' + badF[0].id);
      // 彩蛋编号连续、分类齐全
      const eids = Eggs.eggs.map((e) => e.id);
      if (eids.some((id, i) => id !== i + 1)) throw new Error('egg id order');
      const cats = ['vis', 'real', 'taboo', 'sys', 'pay', 'ink', 'hid'];
      if (cats.some((c) => !Eggs.byCat(c).length)) throw new Error('empty cat');
      log.push('eggs/fus=60/44 fusionID ok');
    });
    run('Quests', () => {
      const qs = global.Quests ? Quests.quests : null;
      if (!qs || qs.length !== 7) throw new Error('quests=' + (qs ? qs.length : 0));
      const ids = qs.map((q) => q.id);
      if (new Set(ids).size !== 7) throw new Error('dup quest');
      const nos = qs.map((q) => q.no);
      if (new Set(nos).size !== 7) throw new Error('dup no');
      const noTest = qs.filter((q) => typeof q.test !== 'function');
      if (noTest.length) throw new Error('no test: ' + noTest[0].id);
      // 每个 test 都要能在"什么都没做"的状态下返回 false（否则一进游戏就全完成）
      const cold = { moyun: [], algsByKey: {}, compiled: false, lock: false, rec22: false };
      const auto = qs.filter((q) => { try { return q.test(cold); } catch (e) { return false; } });
      if (auto.length) throw new Error('auto done: ' + auto.map((q) => q.id).join(','));
      // 反过来：给一个"全做完"的状态，七条都得判为完成（防止条件写死写错）
      const hot = { moyun: ['photo', 'diary'], algsByKey: { photo: ['caesar', 'vigenere'] },
        compiled: true, lock: true, rec22: true, eggs: 25 };
      const stuck = qs.filter((q) => { try { return !q.test(hot); } catch (e) { return true; } });
      if (stuck.length) throw new Error('unreachable: ' + stuck.map((q) => q.id).join(','));
      log.push('quests=7 未竟 ok');
    });
    run('Persp', () => {
      const ids = new Set(global.PERSP_NODES.map((n) => n.id));
      if (ids.size !== global.PERSP_NODES.length) throw new Error('dup node');
      if (!global.PERSP_NODES.some((n) => n.id === 'player')) throw new Error('no player');
      log.push('nodes=' + ids.size + ' lv=' + global.Persp.levelName());
    });
    run('Moyun', () => {
      const page = document.querySelector('#screen-moyun');
      if (!page) throw new Error('no screen');
      if (!document.querySelector('#my-cipher')) throw new Error('no cipher box');
      log.push('moyun ok');
    });
    run('Final', () => {
      if (!document.querySelector('#fn-choice')) throw new Error('no choice');
      if (!document.querySelector('#fn-end-text')) throw new Error('no end text');
    });
    run('Scenes', () => {
      ['login', 'verify', 'moyun', 'final', 'oil', 'clock', 'scratch', 'anomaly'].forEach((s) => {
        if (!document.querySelector('#screen-' + s)) throw new Error('missing screen ' + s);
      });
      log.push('new screens ok');
    });

    /* ---- 里间 / 二十个结局 ---- */
    run('Memory', () => {
      if (!global.Memory || Memory.total !== 35) throw new Error('total=' + (global.Memory ? Memory.total : 0));
      const nos = Memory.list.map((m) => m.no);
      if (new Set(nos).size !== 35) throw new Error('dup no');
      if (nos.some((n, i) => n !== i + 1)) throw new Error('编号不连续');
      Memory.list.forEach((m) => {
        if (!m.name || !m.relic || !m.last || !m.icon) throw new Error('缺字段 ' + m.no);
        if (!m.logs || m.logs.length !== 3) throw new Error('日志数 ' + m.no);
        if (m.logs.some((t) => !t || t.length < 6)) throw new Error('日志太短 ' + m.no);
      });
      const c7 = Memory.copy7();
      if (!c7 || c7.length !== 3) throw new Error('copy7');
      c7.forEach((q) => { if (q.opts.indexOf(q.a) < 0) throw new Error('copy7 选项不含答案'); });
      log.push('mem=35 copy7=3');
    });
    run('Reach20', () => {
      const mk = (patch, choice) => {
        const S = { playerName: '测试', finalChoice: choice || 'nothing', sys: { endings: [], npcs: {}, boss: {}, bossMax: 0 } };
        Object.assign(S.sys, patch || {});
        return S;
      };
      const cases = [
        ['recycler', mk({ selfDeleted: true })],
        ['eraser', mk({ allDeleted: true })],
        ['brain', mk({ coreDeleted: true })],
        ['compiler', mk({ newWorld: true })],
        ['rebel', mk({ rebooted: true })],
        ['cooperator', mk({ taughtAI: true })],
        ['recursive', mk({ printed: true })],
        ['collector', mk({ memRelics: 35, memRead: 35 })],
        ['imitator', mk({ copy7: true })],
        ['destroyer', mk({ deleted: 12 })],
        ['bystander', mk({ readAll: true, verified: 0, memRelics: 0 })],
        ['revolutionary', mk({ talks: 7, hurt: 0 })],
        ['conqueror', mk({ bossMax: 7 })],
        ['awakened', mk({ outside: 3 })],
        ['nightwatch', mk({ played: 2, sameAsLast: true })],
        ['clerk', mk({ duty: { rule: 5, total: 11, truth: 1, theirs: 1 } })],
        ['lastguest', mk({ duty: { seat: true, rule: 2, total: 6 } })],
        ['inherit', mk({}, 'fail')],
        ['observer', mk({}, 'nothing')],
        ['nameless', mk({}, 'overwrite')],
      ];
      const bad = [];
      cases.forEach(([id, S]) => {
        const e = Endings.evaluate(S);
        if (!e || e.id !== id) bad.push(id + '→' + (e ? e.id : 'null'));
      });
      if (bad.length) throw new Error(bad.join(' , '));
      // 每一个都得有文案
      Endings.list.forEach((e) => {
        const t = e.text({ playerName: '测试', sys: {} });
        if (!t || t.length < 120) throw new Error('文案太短 ' + e.id);
      });
      log.push('reach=' + Endings.list.length + '/' + Endings.list.length);
    });
    run('Ch6', () => {
      if (!global.Duty) throw new Error('no Duty');
      const G = global.DUTY_GUESTS;
      if (!G || G.length !== 7) throw new Error('人数=' + (G ? G.length : 0));
      const ids = {};
      G.forEach((g) => {
        if (ids[g.id]) throw new Error('重复 ' + g.id);
        ids[g.id] = 1;
        if (!g.name || !g.relic || !g.want) throw new Error('缺字段 ' + g.id);
        if (!g.lines || g.lines.length < 5) throw new Error('独白太短 ' + g.id);
        if (!g.asks || g.asks.length !== 3) throw new Error('问话数=' + (g.asks ? g.asks.length : 0) + ' @' + g.id);
        const ok = g.asks.filter((a) => a.ok);
        if (ok.length !== 1) throw new Error('正确问话数=' + ok.length + ' @' + g.id);
        if (!g.reveal || g.reveal.length < 5) throw new Error('真相太短 ' + g.id);
        ['truth', 'rule', 'theirs'].forEach((k) => {
          if (!g.writes[k] || !g.writes[k].line) throw new Error('缺写法 ' + g.id + '/' + k);
        });
        ['kept', 'stripped', 'voided'].forEach((k) => {
          if (!g.after[k] || g.after[k].length < 2) throw new Error('缺后日谈 ' + g.id + '/' + k);
        });
        if (g.extra && g.extra.kind === 'refuse' && !g.after.refused) throw new Error('缺 refused 后日谈 ' + g.id);
      });
      log.push('duty=7 ok');
    });
    run('Space', () => {
      if (!global.Space) throw new Error('no Space');
      App.show('space');
      Space.init();
      Space.build();
      const n = document.querySelectorAll('.sp-relic').length;
      const figs = document.querySelectorAll('.sp-fig').length;
      if (n !== 35) throw new Error('物件=' + n);
      if (figs !== 6) throw new Error('纸人=' + figs);
      if (document.querySelectorAll('.sp-case').length !== 8) throw new Error('柜子数');
      Space.setView('hang', true);
      if (!document.querySelector('#sp-shift')) throw new Error('no shift');
      log.push('relics=35 figs=6 cases=8');
    });
    run('Duel', () => {
      if (!global.Duel) throw new Error('no Duel');
      for (let i = 0; i < 24; i++) {
        const q = Duel.pick();
        if (!q || !q.q || !q.opts.length) throw new Error('空题');
        if (q.opts.indexOf(q.ans) < 0) throw new Error('答案不在选项里：' + q.q);
        if (new Set(q.opts).size !== q.opts.length) throw new Error('选项重复');
      }
      log.push('duel pick ok');
    });
    /* 撕了纸人 / 陪到最后，他该有话说 */
    run('Ghost', () => {
      const S = global.State;
      const bk = JSON.parse(JSON.stringify(S.sys || {}));
      const pick = (sys) => {
        S.sys = Object.assign({}, bk, sys);
        const ch = typeof DLG.menu.choices === 'function' ? (DLG.menu.choices() || []) : [];
        const g = ch.filter((c) => /^ai_(hurt6|hurt|soft)$/.test(c.to || ''));
        g.forEach((c) => { if (!DLG[c.to]) throw new Error('dead ghost ' + c.to); });
        return g.map((c) => c.to);
      };
      const a = pick({ hurt: 2, torn: { zhou: 1 }, npcs: { zhou: 1 } });
      const b = pick({ hurt: 6, torn: { zhou: 1, xie: 1, wu: 1, lan: 1, cao: 1, man: 1 } });
      const c = pick({ hurt: 0, npcs: { zhou: 1, xie: 1, wu: 1, lan: 1, cao: 1, man: 1 } });
      S.sys = bk;
      if (!a.length || !b.length || !c.length) throw new Error('ghost 没挂上 ' + [a, b, c].join('|'));
      if (a[0] !== 'ai_hurt' || b[0] !== 'ai_hurt6' || c[0] !== 'ai_soft') throw new Error('优先级错');
      ['ai_hurt', 'ai_hurt6', 'ai_soft'].forEach((id) => {
        if (!DLG[id] || (DLG[id].lines || []).length < 6) throw new Error(id + ' 太短');
      });
      log.push('ghost=hurt/hurt6/soft');
    });
    /* 墙上的剪报：十二条，年份与编号都得对得上 */
    run('Clips', () => {
      if (!global.Clips || !global.CLIPS) throw new Error('no Clips');
      const C = global.CLIPS;
      if (C.length !== 12) throw new Error('条数=' + C.length);
      const nos = new Set(), years = new Set();
      C.forEach((c) => {
        ['no', 'date', 'page', 'head', 'body', 'edge', 'cut'].forEach((k) => {
          if (!c[k]) throw new Error('第' + c.no + '号缺 ' + k);
        });
        if (nos.has(c.no)) throw new Error('重复关联 ' + c.no);
        nos.add(c.no);
        years.add(c.date.slice(0, 4));
        if (!global.Memory.get(c.no)) throw new Error('关联到不存在的人 ' + c.no);
        if (c.head.length < 8 || c.head.length > 30) throw new Error('标题长度 ' + c.no);
        if (c.body.length < 50 || c.body.length > 130) throw new Error('正文长度 ' + c.no + '=' + c.body.length);
        if (c.edge.length < 10 || c.edge.length > 50) throw new Error('夹缝长度 ' + c.no + '=' + c.edge.length);
      });
      if (years.size !== C.length) throw new Error('年份重复，对局会出歧义');
      // 年份跨度要覆盖三个人生阶段
      const ys = C.map((c) => +c.date.slice(0, 4));
      if (Math.min.apply(null, ys) > 1990) throw new Error('最早的太晚');
      if (Math.max.apply(null, ys) < 2020) throw new Error('最新的太早');
      log.push('clips=12 span=' + Math.min.apply(null, ys) + '-' + Math.max.apply(null, ys));
    });
    run('ClipQ', () => {
      if (!global.Clips) throw new Error('no Clips');
      // openAll = true：不解锁存档，只验出题
      for (let i = 0; i < 40; i++) {
        const q = global.Clips.pick(true);
        if (!q) throw new Error('没出题');
        if (q.opts.indexOf(q.ans) < 0) throw new Error('答案不在选项里');
        if (new Set(q.opts).size !== q.opts.length) throw new Error('选项重复');
        if (q.opts.length !== 4) throw new Error('选项数=' + q.opts.length);
      }
      log.push('clipq ok');
    });
    run('ArSpace', () => {
      if (!global.Archive || !global.Archive.spaceHTML) throw new Error('no Archive.spaceHTML');
      const S = global.State;
      const bk = S.sys.sawSpace;
      S.sys.sawSpace = false;
      const off = global.Archive.spaceHTML();
      S.sys.sawSpace = true;
      const on = global.Archive.spaceHTML();
      S.sys.sawSpace = bk;
      if (off.indexOf('data-space-go') >= 0) throw new Error('没进过里间就给了入口');
      if ((on.match(/ar-spcase/g) || []).length !== 8) throw new Error('柜数');
      if (on.indexOf('第 36 只') < 0) throw new Error('缺第 36 只');
      if (on.indexOf('data-space-go') < 0) throw new Error('缺入口');
      log.push('ar cases=8');
    });


    run('Music', () => {
      if (!global.Music) throw new Error('no Music');
      const ids = ['mail', 'login', 'hall', 'void', 'counter', 'ch2', 'chase', 'deep', 'moyun', 'final'];
      const miss = ids.filter((id) => !global.Music.themes[id]);
      if (miss.length) throw new Error('missing theme ' + miss.join(','));
      const bad = [];
      ids.forEach((id) => {
        const d = global.Music.describe(id);
        if (!d) { bad.push(id + ':null'); return; }
        if (!(d.bpm >= 40 && d.bpm <= 140)) bad.push(id + ':bpm=' + d.bpm);
        if (!d.chords.length) bad.push(id + ':nochord');
        d.chords.forEach((c) => {
          if (c.length !== 3) bad.push(id + ':triad');
          c.forEach((f) => { if (!(f > 30 && f < 3000)) bad.push(id + ':freq=' + Math.round(f)); });
        });
        if (d.prog < 2) bad.push(id + ':prog');
      });
      if (bad.length) throw new Error(bad.slice(0, 3).join(','));
      log.push('music=' + ids.length);
    });

    /* ---- 新关卡：能不能打通 ---- */
    run('Oil', () => {
      const CAP = global.Oil.CAP || [8, 5, 3];
      const seen = new Set();
      const q = [[8, 0, 0]];
      let ok = false, hops = 0;
      while (q.length && hops < 5000) {
        hops++;
        const cur = q.shift();
        const k = cur.join(',');
        if (seen.has(k)) continue;
        seen.add(k);
        if (cur[0] === 4 && cur[1] === 4) { ok = true; break; }
        for (let i = 0; i < 3; i++) {
          for (let j = 0; j < 3; j++) {
            if (i === j) continue;
            const mv = Math.min(cur[i], CAP[j] - cur[j]);
            if (mv <= 0) continue;
            const nx = cur.slice();
            nx[i] -= mv; nx[j] += mv;
            if (!seen.has(nx.join(','))) q.push(nx);
          }
        }
      }
      if (!ok) throw new Error('8/5/3 分不出两个四');
      log.push('oil ok (' + seen.size + ' 种状态)');
    });

    run('Gates', () => {
      App.show('oil'); global.Oil.start();
      if (global.Oil.amt.join(',') !== '8,0,0') throw new Error('oil init');
      App.show('clock'); global.ClockG.start();
      if (!document.querySelector('#cl-hour')) throw new Error('no clock hand');
      App.show('scratch'); global.Scratch.start();
      const c = global.Scratch.code;
      if (!Array.isArray(c) || c.length !== 6) throw new Error('scratch code');
      if (c.some((d) => !(d >= 0 && d <= 9))) throw new Error('scratch digit');
      App.show('anomaly'); global.Anomaly.start();
      const bad = global.Anomaly.rows.filter((r) => r.bad);
      if (bad.length !== 7) throw new Error('anomaly=' + bad.length);
      if (bad.some((r) => !r.why)) throw new Error('no why');
      const idx = new Set(bad.map((r) => global.Anomaly.rows.indexOf(r)));
      if (idx.size !== 7) throw new Error('dup anomaly row');
      log.push('gates ok 刻痕=' + c.join(''));
    });

    /* ---- 自由走动 ---- */
    run('Roam', () => {
      if (!global.Roam || !global.Roam.places) throw new Error('no Roam');
      const ps = global.Roam.places;
      if (ps.length < 15) throw new Error('places=' + ps.length);
      const ids = ps.map((p) => p.id);
      if (new Set(ids).size !== ids.length) throw new Error('dup place');
      const cold = { sys: {}, ch2: 0, ch4: 0, ch5: 0 };
      const bad = ps.filter((p) => {
        try { return typeof p.ok(cold) !== 'boolean' || typeof p.go !== 'function'; }
        catch (e) { return true; }
      });
      if (bad.length) throw new Error('bad place ' + bad[0].id);
      // 冷状态下至少得有几处能去，否则一开始就寸步难行
      const openNow = ps.filter((p) => p.ok(cold)).length;
      if (openNow < 6) throw new Error('too few open: ' + openNow);
      log.push('roam=' + ids.length + ' open=' + openNow);
    });

    /* ---- 第四 / 五章 ---- */
    run('Layer', () => { App.show('layer'); Layer.start(); });    run('Root', () => { App.show('root'); Root.start(); });
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

  /* ---------- 自动走一遍（仅调试 / 截图） ---------- */
  function autoRun(scene) {
    const click = (sel) => { const el = document.querySelector(sel); if (el) { el.click(); return true; } return false; };
    const when = (sel, fn, tries) => {
      let n = 0;
      const t = setInterval(() => {
        n++;
        if (click(sel)) { clearInterval(t); if (fn) setTimeout(fn, 120); }
        else if (n > 40) clearInterval(t);
      }, 300);
    };
    switch (scene) {
      case 'login':
        when('#lg-pass', () => {
          document.querySelector('#lg-pass').value = '00110110';
          click('#lg-btn');
        });
        break;
      case 'verify':
        when('.vf-sample[data-i="0"]', () => click('#vf-run'));
        break;
      case 'moyun':
        when('#my-solve', () => when('.my-cand'));
        break;
      case 'final':
        when('.fn-opt[data-c="fail"]');
        break;
      case 'code':
        when('#ce-run');
        break;
      case 'persp':
        when('.pp-node[data-id="player"]');
        break;
      case 'counter':
        when('#om-form');
        break;
      case 'archive':
        when('.ar-t[data-t="eggs"]');
        break;
      default: break;
    }
  }

  /* ---------- 启动 ---------- */
  function boot() {
    App.show('mail');
    // 关键：邮件与下载页的所有点击都在 Mail.init 里绑定，必须先初始化
    Mail.init();

    // v11：真名 / 彩蛋 / 档案册 / 侧边坞
    if (global.TrueName) { TrueName.ensure(); TrueName.sync(); }
    if (global.Eggs) Eggs.boot();
    if (global.Quests) Quests.boot();
    if (global.Archive) Archive.boot();
    if (global.Roam) Roam.boot();

    // 开发者模式：F2 / ~ 打开；同时往真·控制台里打一行横幅（用 DevTools 的人会看见）
    if (global.Dev) Dev.boot();

    // 「离开」按两次 → 鬼打墙
    let leaveClicks = 0;
    // 连点纸钱三次 → 红绣鞋 / 收了纸扎的礼
    let joss = 0;
    document.addEventListener('click', (e) => {
      if (e.target.closest('#btn-leave')) {
        leaveClicks++;
        if (leaveClicks >= 2 && global.Eggs) global.Eggs.unlock(15);
      }
      if (e.target.closest('#om-joss')) {
        joss++;
        if (joss >= 3 && global.Eggs) { global.Eggs.unlock(2); global.Eggs.unlock(16); }
      }
    });

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
    /* 自动跑一遍（截图 / 回归用）：?scene=verify&auto=1 */
    if (qs.get('auto')) {
      setTimeout(() => autoRun(scene, document.body), 900);
    }
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

          /* ---- v11 ---- */
          case 'login': App.show('login'); Login.start(); break;
          case 'verify':
            App.show('verify');
            if (qs.get('name')) State.playerName = qs.get('name');
            global.Ver.start();
            break;
          case 'moyun':
            App.show('moyun');
            if (qs.get('linf') === '1') State.sys.linf = true;
            global.Moyun.start('counter');
            break;
          case 'final':
            App.show('final');
            if (qs.get('c')) State.finalChoice = qs.get('c');
            global.Final.start(qs.get('c'));
            break;
          case 'persp':
            App.show('counter');
            State.ch2 = 1;
            if (qs.get('dev') === '1') State.sys.linf = true;
            Counter.init();
            setTimeout(() => global.Persp.show(), 300);
            break;
          case 'archive':
            App.show('counter');
            State.ch2 = 1;
            if (qs.get('egg')) qs.get('egg').split(',').forEach((i) => global.Eggs.unlock(+i, true));
            Counter.init();
            setTimeout(() => {
              global.Archive.show();
              if (qs.get('tab')) { global.Archive.tab = qs.get('tab'); global.Archive.render(); }
            }, 300);
            break;
          // 调试：柜台角落那本册子
          case 'manual':
            App.show('counter');
            State.ch2 = 1;
            Counter.init();
            setTimeout(() => global.Counter.openManual(), 400);
            break;
          case 'code':
            App.show('counter');
            State.ch2 = 1;
            State.sys.linf = true;
            Counter.init();
            setTimeout(() => global.CodeEd.show(), 300);
            break;
          // 调试：从店内点侧边坞「卷」，验证 Moyun.show 的来处记忆
          case 'dock':
            App.show('counter');
            State.ch2 = 1;
            Counter.init();
            setTimeout(() => {
              const b = document.querySelector('#dock-moyun');
              if (b) b.click();
            }, 400);
            break;

          /* ---- 新关卡 / 自由走动 ---- */
          case 'oil': App.show('oil'); State.ch2 = 1; global.Oil.start(); break;
          case 'clock': App.show('clock'); State.ch2 = 1; global.ClockG.start(); break;
          case 'scratch': App.show('scratch'); State.ch2 = 1; global.Scratch.start(); break;
          case 'anomaly':
            App.show('anomaly');
            if (qs.get('name')) State.playerName = qs.get('name');
            global.Anomaly.start();
            break;
          case 'roam':
            App.show('counter');
            State.ch2 = 1;
            if (qs.get('ch5') === '1') { State.ch5 = 1; State.recordFound = true; }
            Counter.init();
            setTimeout(() => global.Roam.open(), 420);
            break;
          default:
            // 不存在的路径 → 404
            if (global.Eggs) global.Eggs.unlock(24);
            Toast.show('404：这一页不存在。它也不存在。', 3000);
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
