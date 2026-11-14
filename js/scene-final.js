/* ============================================================
   scene-final.js — 终章 · 回响
   ------------------------------------------------------------
   灯快没了。柜台上摆着几张纸。
   你可以写，可以划，可以撕，也可以什么都不做。
   无论你选什么，桌面上都会留下一个文件。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, wait, Fade, Toast } = global.G;

  const CHOICES = [
    { id: 'overwrite', t: '在 #036 那一行写下自己的名字', s: '盖掉它。你就是第三十六个。', to: 'nightwatch' },
    { id: 'cross', t: '把自己从名单上划掉', s: '不是离开，是"从来没有来过"。', to: 'revolutionary' },
    { id: 'delete', t: '把整个记录库删掉', s: '三十六行，一起。', to: 'eraser' },
    { id: 'logout', t: '登出地球online', s: '退出登录。回到"外面"。', to: 'awakened' },
    { id: 'fail', t: '不换', s: '把纸推回去。什么都不拿。', to: 'inherit' },
    { id: 'nothing', t: '什么都不做', s: '坐着。等灯灭。', to: 'observer' },
    { id: 'core', t: '删掉核心程序', s: '这一层之下的那一层。', to: 'brain', need: 'linf' },
    { id: 'write', t: '拿一张空白的，自己写', s: '不选它们给的路。', to: 'compiler', need: 'linf' },
  ];

  const Final = {
    inited: false,
    idleT: 0,
    idleN: 0,
    stage: 'choice',

    init() {
      if (this.inited) return;
      this.inited = true;
      $('#fn-restart').addEventListener('click', () => {
        document.dispatchEvent(new CustomEvent('restart'));
        location.href = location.pathname;
      });
      $('#fn-archive').addEventListener('click', () => {
        if (global.Archive) global.Archive.show();
      });
      $('#fn-file').addEventListener('click', () => this.file());
    },

    async start(force) {
      this.init();
      this.stage = 'choice';
      $('#fn-wrap').dataset.stage = 'text';
      $('#fn-text').textContent = '';
      $('#fn-card').classList.remove('on');
      $('#fn-choice').classList.remove('on');
      $('#fn-end').classList.remove('on');
      $('#fn-text').classList.add('on');

      const S = global.State;
      S.sys = S.sys || {};

      // 在编辑器里删掉自己的，不再给选择
      if (S.sys.selfDeleted) { await this.play('recycler'); return; }
      if (S.sys.allDeleted) { await this.play('eraser'); return; }

      await this.say('灯芯只剩一小截了。\n\n柜台上的纸，还是那几张。');
      await wait(2200);
      await this.say('艾把笔推过来。\n\n"这一次，"他说，"你自己写。"');

      this.showChoices();
      this.resetIdle();
    },

    async say(t, keep) {
      const el = $('#fn-text');
      el.classList.add('on');
      el.textContent = t;
      if (!keep) await wait(2200);
    },

    showChoices() {
      this.stage = 'choice';
      const linf = global.State.sys && global.State.sys.linf;
      const prev = global.State.finalChoice;
      const box = $('#fn-choice');
      box.innerHTML = '<div class="fn-q">你要怎么处置这一行？' +
        (prev ? '（刚才在记录里，你按的是另一张。要改，也可以。）' : '') + '</div>' +
        CHOICES.filter((c) => !c.need || (c.need === 'linf' && linf))
          .map((c) => '<button class="fn-opt' + (c.id === prev ? ' pre' : '') + '" data-c="' + c.id + '">' +
            '<b>' + c.t + '</b><span>' + c.s + '</span></button>').join('') +
        '<div class="fn-idle">（你还有 <b id="fn-idle-n">120</b> 秒。之后它会替你选。）</div>';
      box.classList.add('on');
      $$('.fn-opt').forEach((b) => {
        b.addEventListener('click', () => this.choose(b.dataset.c));
      });
    },

    resetIdle() {
      clearInterval(this.idleT);
      this.idleN = 120;
      this.idleT = setInterval(() => {
        if (this.stage !== 'choice') { clearInterval(this.idleT); return; }
        this.idleN--;
        const el = $('#fn-idle-n');
        if (el) el.textContent = this.idleN;
        if (this.idleN <= 0) {
          clearInterval(this.idleT);
          global.State.sys.idleEnd = true;
          this.choose('nothing', true);
        }
      }, 1000);
    },

    async choose(c, silent) {
      if (this.stage !== 'choice') return;
      this.stage = 'play';
      clearInterval(this.idleT);
      const S = global.State;
      S.finalChoice = c;
      S.sys = S.sys || {};

      // 覆盖 / 划掉 / 删除：先把统计味道算进去
      let id = (CHOICES.find((x) => x.id === c) || {}).to || 'observer';
      if (c === 'overwrite') {
        if (S.sys.relics >= 8) id = 'collector';
        else if (S.sys.copy7) id = 'imitator';
        else if ((S.sys.endings || []).length >= 3) id = 'nightwatch';
      }
      if (c === 'cross') {
        if (S.sys.readAll && S.sys.verified === 0) id = 'bystander';
        else if (S.sys.deleted >= 10) id = 'destroyer';
        else if (S.sys.mercy && S.sys.talks >= 6) id = 'revolutionary';
        else if (S.sys.wins >= 7) id = 'conqueror';
        else id = 'nameless';
      }
      if (c === 'delete') {
        id = S.sys.linf ? 'eraser' : 'destroyer';
      }
      if (c === 'logout') {
        id = S.sys.outside >= 3 ? 'awakened' : 'awakened';
        S.sys.outside++;
      }
      if (c === 'write') {
        id = S.sys.rebooted ? 'rebel' : 'compiler';
        if (!S.sys.newWorld) S.sys.newWorld = true;
      }
      if (c === 'core') S.sys.coreDeleted = true;

      S.sys.ending = id;
      await this.play(id, silent);
    },

    async play(id, silent) {
      this.stage = 'play';
      const S = global.State;
      const e = global.Endings.get(id);
      if (!e) return;

      $('#fn-choice').classList.remove('on');
      await wait(360);
      await Fade.on(true);
      $('#fn-text').textContent = '';
      $('#fn-wrap').dataset.stage = 'end';
      $('#fn-end').classList.add('on');
      $('#fn-end-no').textContent = '结局 ' + String(e.no).padStart(2, '0') + ' / 18';
      $('#fn-end-name').textContent = e.name;
      $('#fn-end-tone').textContent = e.tone;
      $('#fn-end-name').style.color = e.color;
      $('#fn-end-text').textContent = '';
      await wait(200);
      await Fade.off(900);

      const text = e.text(S);
      const el = $('#fn-end-text');
      // 逐段浮出，不逐字（逐字太慢）
      const parts = text.split('\n');
      for (let i = 0; i < parts.length; i++) {
        const d = document.createElement('div');
        d.className = 'fn-line' + (/^【/.test(parts[i]) ? ' fn-tag' : '');
        d.textContent = parts[i];
        el.appendChild(d);
        requestAnimationFrame(() => d.classList.add('on'));
        await wait(parts[i].trim() ? 240 : 120);
      }

      global.Endings.checkLoop(S);
      global.Endings.mark(id);
      this.record(e);
      if (global.Snd) { try { global.Snd.tone(196, 1.6, { type: 'sine', gain: 0.05 }); } catch (err) {} }
      Toast.show('「感谢你的回响。」', 3600);
    },

    record(e) {
      const S = global.State;
      const tn = global.TrueName ? global.TrueName.ensure() : null;
      const rec = {
        at: Date.now(),
        name: S.playerName || '未登记',
        ending: e.id,
        endingName: e.name,
        sigil: tn ? tn.sigil : '—',
        base: tn ? tn.base : '—',
        memory: tn ? tn.memory : '—',
        action: tn ? tn.action : '—',
        eggs: global.Eggs ? global.Eggs.count() : 0,
        fusions: global.Eggs ? global.Eggs.fusionCount() : 0,
        deleted: (S.sys && S.sys.deleted) || 0,
      };
      try {
        const all = JSON.parse(localStorage.getItem('code_echo_record') || '[]');
        all.push(rec);
        localStorage.setItem('code_echo_record', JSON.stringify(all.slice(-20)));
      } catch (err) {}
      this._rec = rec;
      $('#fn-card').innerHTML =
        '<div class="fnc-row"><span>名字</span><b>' + rec.name + '</b></div>' +
        '<div class="fnc-row"><span>结局</span><b style="color:' + e.color + '">' + e.name + '</b></div>' +
        '<div class="fnc-row"><span>真名印记</span><b class="fnc-sig">' + rec.sigil + '</b></div>' +
        '<div class="fnc-row"><span>彩蛋 / 融合</span><b>' + rec.eggs + ' / ' + rec.fusions + '</b></div>' +
        '<div class="fnc-row"><span>删除节点</span><b>' + rec.deleted + '</b></div>' +
        '<div class="fnc-foot">已记录。这一格不再是空的。</div>';
      $('#fn-card').classList.add('on');
    },

    /* 桌面上的那个文件 */
    file() {
      const r = this._rec || {};
      const e = global.Endings.get(r.ending) || { name: '未命名', text: () => '' };
      const body = [
        '《代码之下》 · 回响记录',
        '———————————————',
        '名字：' + (r.name || '未登记'),
        '结局：' + e.name,
        '真名印记：' + (r.sigil || '—'),
        '　基础码：' + (r.base || '—'),
        '　记忆码：' + (r.memory || '—'),
        '　行为码：' + (r.action || '—'),
        '时间：' + new Date(r.at || Date.now()).toLocaleString('zh-CN', { hour12: false }),
        '',
        '彩蛋：' + (r.eggs || 0) + ' / 60',
        '融合：' + (r.fusions || 0) + ' / 44',
        '',
        '———————————————',
        '你说这是你第一次登录地球online。',
        '系统记录的日志里，这一格已经被写过 ' + (36 + (r.deleted || 0)) + ' 次。',
        '',
        '别把这张纸给别人看。',
        '—— 或者，给别人看。',
        '',
        '「感谢你的回响。」',
      ].join('\r\n');
      const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = '回响_' + (r.name || '036') + '.txt';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1200);
      Toast.show('桌面上多了一个文件。', 2600);
    },
  };

  global.Final = Final;
})(window);
