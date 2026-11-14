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
    { id: 'overwrite', t: '在 #036 那一行写下自己的名字', s: '盖掉它。你就是第三十六个。' },
    { id: 'cross', t: '把自己从名单上划掉', s: '不是离开，是"从来没有来过"。' },
    { id: 'delete', t: '把整个记录库删掉', s: '三十六行，一起。' },
    { id: 'logout', t: '登出地球online', s: '退出登录。回到"外面"。' },
    { id: 'fail', t: '不换', s: '把纸推回去。什么都不拿。' },
    { id: 'nothing', t: '什么都不做', s: '坐着。等灯灭。' },
    { id: 'core', t: '删掉核心程序', s: '这一层之下的那一层。', need: 'linf' },
    { id: 'write', t: '拿一张空白的，自己写', s: '不选它们给的路。', need: 'linf' },
    { id: 'read', t: '翻开柜台底下那本册子', s: '它一直在那里。你从来没有弯过腰。', need: 'ledger', fold: true },
    { id: 'later', t: '还不想写', s: '先回去。灯还够烧一会儿。' },
  ];

  const Final = {
    inited: false,
    idleT: 0,
    idleN: 0,
    stage: 'choice',

    init() {
      if (this.inited) return;
      this.inited = true;
      $('#fn-restart').addEventListener('click', (e) => {
        if (this._reader) { this.seal(); return; }
        /* 重开是这一步最贵的动作，别让人手滑就点掉 */
        const b = e.currentTarget;
        if (global.Notes && global.Notes.again) {
          global.Notes.again(b, () => {
            document.dispatchEvent(new CustomEvent('restart'));
            location.href = location.pathname;
          });
          return;
        }
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
      if (global.Chapter) await global.Chapter.show('ch8');
      clearInterval(this._stick);
      this.stage = 'choice';
      this.counted = false;
      this._reader = false;
      this._sealed = false;
      const rt = $('#fn-restart');
      if (rt) { rt.textContent = '重 开'; rt.removeAttribute('data-seal'); }
      $('#fn-wrap').dataset.stage = 'text';
      $('#fn-text').textContent = '';
      $('#fn-card').classList.remove('on');
      $('#fn-choice').classList.remove('on');
      $('#fn-end').classList.remove('on');
      $('#fn-text').classList.add('on');

      const S = global.State;
      S.sys = S.sys || {};
      S.sys.sawFinal = true;

      // 在编辑器里删掉自己的，不再给选择
      if (S.sys.selfDeleted) { await this.play('recycler'); return; }
      if (S.sys.allDeleted) { await this.play('eraser'); return; }

      /* 翻过册子的人，再进来时柜台底下那点亮，是看得见的 */
      const flipped = !!(global.Book && global.Book.read().sealed > 0);
      const stt = (S.sys && S.sys.street) || null;
      const stTx = stt && stt.end === 'file'
        ? '\n\n（你兜里是空的。那张纸现在在街尽头，压在一只右手下面。）'
        : stt && stt.end === 'tear'
          ? '\n\n（兜里有一片纸角，边缘是毛的。）'
          : stt && stt.end === 'keep'
            ? '\n\n（那张纸还在兜里。折了四折，硌着腿。）'
            : '';
      await this.say('灯芯只剩一小截了。\n\n柜台上的纸，还是那几张。' + stTx +
        (flipped ? '\n\n（柜台底下那块地方，比别处暗一点。你上次把手伸进去过。）' : ''));
      await wait(2200);
      await this.say('艾把笔推过来。\n\n"这一次，"他说，"你自己写。"');
      if (!S.sys.sawSpace) {
        await wait(1800);
        await this.say('（柜台后面那道缝还开着。你一次也没有进去过。）\n（里面还站着六个人。他们不催。）');
      }

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
      $('#fn-wrap').dataset.stage = 'choice';
      const S = global.State;
      const linf = S.sys && S.sys.linf;
      const prev = S.finalChoice;
      const box = $('#fn-choice');
      const rows = global.Endings.hint(S);
      const needOK = (c) => {
        if (!c.need) return true;
        if (c.need === 'linf') return !!linf;
        if (c.need === 'ledger') return !!(global.Book && global.Book.ok());
        return false;
      };
      box.innerHTML = '<div class="fn-scroll">' +
          '<div class="fn-q">你要怎么处置这一行？' +
          (prev ? '（刚才在记录里，你按的是另一张。要改，也可以。）' : '') + '</div>' +
          CHOICES.filter(needOK)
            .map((c) => '<button class="fn-opt' + (c.fold ? ' fold' : '') +
              (c.id === prev ? ' pre' : '') + '" data-c="' + c.id + '">' +
              '<b>' + c.t + '</b><span>' + c.s + '</span></button>').join('') +
        '</div>' +
        '<div class="fn-state">' + rows.map((r) =>
          '<span><i>' + r[0] + '</i><b>' + r[1] + '</b></span>').join('') + '</div>' +
        '<div class="fn-idle">（你还有 <b id="fn-idle-n">120</b> 秒。之后它会替你选。）</div>';
      box.classList.add('on');
      $$('.fn-opt').forEach((b) => {
        b.addEventListener('click', () => this.choose(b.dataset.c));
      });

      /* 纸多到排不下时，底部淡出去一点，让人知道下面还有 */
      const sc = box.querySelector('.fn-scroll');
      if (sc && sc.scrollHeight > sc.clientHeight + 4) {
        sc.classList.add('more');
        sc.addEventListener('scroll', () => {
          const end = sc.scrollTop + sc.clientHeight >= sc.scrollHeight - 8;
          sc.classList.toggle('more', !end);
        });
      }
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
      const S = global.State;
      S.sys = S.sys || {};

      /* 还没想好：回柜台。灯还够烧一会儿。 */
      if (c === 'later') {
        clearInterval(this.idleT);
        await Fade.through(() => { App.show('counter'); global.Counter.init(); });
        global.Toast && global.Toast.show('（想好了再回来。从平面图上还能找到这里。）', 3200);
        return;
      }

      this.stage = 'play';
      clearInterval(this.idleT);
      S.finalChoice = c;

      // 选择本身也是一种动作，先落到 sys 上
      if (c === 'core') S.sys.coreDeleted = true;
      if (c === 'write') S.sys.newWorld = true;
      if (c === 'logout') S.sys.outside = Math.max(S.sys.outside || 0, 3);

      // 身份与动作，统一交给 Endings 判
      const e = global.Endings.evaluate(S);
      S.sys.ending = e ? e.id : 'nameless';
      await this.play(S.sys.ending, silent);
    },

    async play(id, silent) {
      this.stage = 'play';
      const S = global.State;
      const e = global.Endings.get(id);
      if (!e) return;

      /* 一局只记一笔，记的是"你走到了哪里"，不是"你点了几下" */
      if (!this.counted) {
        this.counted = true;
        if (global.Book) global.Book.run(global.State, e);
      }

      $('#fn-choice').classList.remove('on');
      await wait(360);
      await Fade.on(true);
      $('#fn-text').textContent = '';
      $('#fn-wrap').dataset.stage = 'end';
      $('#fn-end').classList.add('on');
      $('#fn-end-no').textContent = '结局 ' + String(e.no).padStart(2, '0') + ' / ' +
        global.Endings.list.length;
      $('#fn-end-name').textContent = e.name;
      $('#fn-end-tone').textContent = e.tone;
      $('#fn-end-name').style.color = e.color;
      $('#fn-end-text').textContent = '';

      /* 读者：这一页没有"重开"。合上，是你自己的动作。 */
      if (id === 'reader') {
        this._reader = true;
        const rt = $('#fn-restart');
        if (rt) { rt.textContent = '合 上'; rt.setAttribute('data-seal', '1'); }
      }
      await wait(200);
      await Fade.off(900);

      const text = e.text(S);
      const el = $('#fn-end-text');

      /* 结局正文不再内部滚，整页随字数往下长。
         内容一变高就把整页贴到底，最后那句【】永远看得见；
         玩家自己往上翻不改变 scrollHeight，不会被拽回来。 */
      const pg = document.querySelector('.fn-page');
      clearInterval(this._stick);
      if (this._unstick && pg) pg.removeEventListener('scroll', this._unstick);
      let lastH = -1;
      let follow = true;
      /* 玩家自己往上翻，就别再把他拽回底下 */
      this._unstick = () => {
        if (!pg) return;
        follow = pg.scrollTop + pg.clientHeight >= pg.scrollHeight - 100;
      };
      if (pg) pg.addEventListener('scroll', this._unstick, { passive: true });
      this._stick = setInterval(() => {
        if (!pg || !pg.isConnected) { clearInterval(this._stick); return; }
        const h = pg.scrollHeight;
        if (h !== lastH) {
          lastH = h;
          if (follow) pg.scrollTop = 1e6;
        }
      }, 240);
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

      /* 卡片插进来之后正文区会缩，再贴一次底，保证最后一句看得见 */
      await wait(260);
      el.scrollTop = 1e6;
      await wait(520);
      el.scrollTop = 1e6;

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
        '<div class="fnc-row"><span>记忆物件</span><b>' + (S.sys.memRelics || 0) + ' / 35</b></div>' +
        '<div class="fnc-row"><span>对局胜场</span><b>' + ((S.sys.boss && S.sys.boss.ai) || 0) + ' / 7</b></div>' +
        '<div class="fnc-row"><span>删除节点</span><b>' + rec.deleted + '</b></div>' +
        '<div class="fnc-row"><span>这一周目</span><b>第 ' + (S.sys.played || 1) + ' 次</b></div>' +
        '<div class="fnc-foot">' +
        (e.id === 'reader' ? '这本册子记住了你。' : '已记录。这一格不再是空的。') + '</div>';
      $('#fn-card').classList.add('on');
    },

    /* 合上。灯灭。剩下的一步不给你按钮，只给你一句话。 */
    seal() {
      if (this._sealed) return;
      this._sealed = true;
      if (global.Book) global.Book.seal();

      let d = document.querySelector('.fn-seal');
      if (!d) {
        d = document.createElement('div');
        d.className = 'fn-seal';
        d.innerHTML = '<div class="fs-in">' +
          '<p>灯灭了。</p><p class="fs-b">这里没有人。</p>' +
          '<em>（按 R 重新点亮。别的键都不作数。）</em></div>';
        document.body.appendChild(d);
      }
      requestAnimationFrame(() => d.classList.add('on'));

      /* 原先"按任意键"就重载——黑屏上随便一按就从头开始，
         玩家会以为自己把进度弄丢了。改成只认 R。 */
      const back = (e) => {
        if (e.type === 'mousedown') return;
        if (e.key !== 'r' && e.key !== 'R') return;
        document.removeEventListener('keydown', back, true);
        document.removeEventListener('mousedown', back, true);
        location.reload();
      };
      setTimeout(() => {
        document.addEventListener('keydown', back, true);
        document.addEventListener('mousedown', back, true);
      }, 1500);
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
