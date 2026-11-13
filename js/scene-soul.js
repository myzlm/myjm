/* ============================================================
   scene-soul.js — 叫魂：门外有人叫你名字
   规矩（乡下老人说的）：活人叫人，脚步声先到；
   没有脚的东西，只有声音，永远等不到脚步。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, wait, Fade, Toast } = global.G;

  /* order: 'voice' 先听见声音 / 'step' 先听见脚步 */
  const CALLS = [
    {
      order: 'voice',
      lead: '（门缝里先出来一点声音。很轻，像有人把嘴贴在木头上。）',
      voice: '「……回来了？」',
      trace: '（然后是脚步声——没有。门外一直是静的。）',
      right: 'no',
      ok: '（你没有应。门缝里的光暗了一点，像有人往后退了半步。）',
      bad: '（你应了一声。）\n（门外没有脚步声。应完之后，你觉得有人把手放在了你肩上——回头看，什么都没有。）',
    },
    {
      order: 'voice',
      lead: '（第二声。这次是个小孩，声音很嫩。）',
      voice: '「哥，开门。」',
      trace: '（你等着那阵跑过来的脚步。等了很久。没有。）',
      right: 'no',
      ok: '（你没有应。小孩的声音又响了一遍，然后是自己跟自己说话的那种嘟囔。）',
      bad: '（你应了。）\n（门缝底下探进来一截手指，很细，指甲是青的。你退开，它就缩回去了。）',
    },
    {
      order: 'step',
      lead: '（这次，你先听见了脚步。咔，咔，很慢，鞋底粘着什么。）',
      voice: '「……有人吗？」',
      trace: '（脚步停在门口。你能听见喘气，很近。）',
      right: 'yes',
      ok: '（你应了一声。）\n（门外的人顿了一下，说：不好意思，走错了。脚步又远了。）',
      bad: '（你没有应。脚步声在门口站了很久，最后走远了。\n——那是个活人。他只是想问路。）',
    },
    {
      order: 'voice',
      lead: '（第四声。这次是你自己的声音。）',
      voice: '「我在这儿。」',
      trace: '（你听得很清楚：那是你的嗓子，你的口气。\n可是门外没有脚步，门里也没有第二个人。）',
      right: 'no',
      ok: '（你没有应。你自己的声音又说了一遍，然后开始哭。）',
      bad: '（你应了。）\n（门缝里伸进来的，是一只手。手背上有一颗痣，和你的一模一样。）',
    },
    {
      order: 'voice',
      lead: '（第五声。很多人在叫，叫的不是名字，是数。）',
      voice: '「三十五。」\n「三十五。」\n「三十六——」',
      trace: '（数到三十六就停了。没有脚步，一直都没有。）',
      right: 'no',
      ok: '（你没有应。数到三十六的那张嘴，闭上了。）',
      bad: '（你应了。）\n（外面的数声齐了：三十六。三十六个。\n（他们很高兴。）',
    },
    {
      order: 'step',
      lead: '（第六声，你先听见脚步。不是皮鞋，是布鞋，鞋底磨得很薄，走一步，蹭一下。）',
      voice: '「……出来吧。」\n「妈在这儿。」',
      trace: '（那个脚步从很远的地方走过来，走了很久，一直没有停。\n它停在门口。门缝底下，落进来一点影。）',
      right: 'yes',
      ok: '（你应了。\n（门外很久没有声音。然后，那把伞靠在门框上，慢慢地倒了下来。）',
      bad: '（你没有应。）\n（脚步声在门口站了很久，走了。\n走出去很远，还在蹭，一步，一下。）',
    },
  ];

  const Soul = {
    inited: false,
    idx: 0,
    right: 0,
    wrong: 0,
    pick: null,

    init() {
      if (this.inited) return;
      this.inited = true;
      $('#sl-yes').addEventListener('click', () => this.choose('yes'));
      $('#sl-no').addEventListener('click', () => this.choose('no'));
    },

    /* 等待玩家点一个 */
    ask() {
      return new Promise((res) => { this.pick = res; });
    },
    choose(v) {
      if (!this.pick) return;
      const r = this.pick;
      this.pick = null;
      Snd.click();
      r(v);
    },

    async type(text, append) {
      const el = $('#sl-text');
      if (!append) el.textContent = '';
      el.classList.add('on');
      let i = 0;
      return new Promise((res) => {
        const t = setInterval(() => {
          if (i >= text.length) { clearInterval(t); res(); return; }
          const ch = text[i++];
          el.textContent += ch;
          if (ch !== '\n' && i % 4 === 0) Snd.tone(1400, 0.012, { type: 'sine', gain: 0.006 });
        }, 22);
      });
    },

    async run() {
      this.init();
      State.soulDone = true;
      this.idx = 0; this.right = 0; this.wrong = 0;
      State.soulRight = 0; State.soulWrong = 0; State.soulAnswered = false;

      $('#sl-acts').classList.remove('on');
      $('#sl-tip').textContent = '听清楚——先到的是脚步，还是声音。';
      $('#sl-gap').classList.remove('wide');

      await Fade.through(() => App.show('soul'));
      Snd.tone(60, 3, { type: 'sine', gain: 0.07, attack: 1.2 });
      await wait(600);
      await this.type('（你把手放在门上。\n门是凉的。凉得不像木头。）');
      await wait(900);

      for (let i = 0; i < CALLS.length; i++) {
        this.idx = i;
        const c = CALLS[i];
        $('#sl-sub').textContent = '第 ' + (i + 1) + ' 声 · 共 ' + CALLS.length + ' 声';

        await this.type(c.lead);
        await wait(700);
        await this.type('\n' + c.voice + '\n' + c.trace, true);
        await wait(300);

        $('#sl-acts').classList.add('on');
        const v = await this.ask();
        $('#sl-acts').classList.remove('on');

        const ok = v === c.right;
        if (ok) this.right++; else {
          this.wrong++;
          $('#sl-gap').classList.add('wrong');
          setTimeout(() => $('#sl-gap').classList.remove('wrong'), 900);
          Snd.tone(90, 0.6, { type: 'triangle', gain: 0.07 });
        }
        State.soulRight = this.right;
        State.soulWrong = this.wrong;
        if (i === CALLS.length - 1 && v === 'yes') State.soulAnswered = true;

        await this.type(ok ? c.ok : c.bad);
        await wait(1100);
      }

      // 结算
      $('#sl-acts').classList.remove('on');
      $('#sl-sub').textContent = '门 开 了 一 点';
      const lines = [];
      if (this.wrong === 0) {
        lines.push('（一声都没应错。门缝里的黑，退开了。）');
        lines.push('（门外没有人。只有一把伞，靠在门框上，伞面上落满了灰。）');
      } else if (this.wrong <= 2) {
        lines.push('（你应错 ' + this.wrong + ' 声。门缝底下多了 ' + this.wrong + ' 道影子。）');
        lines.push('（它们没有进来。它们只是站着，等你再开口。）');
      } else {
        lines.push('（你应错 ' + this.wrong + ' 声。门外已经很挤了。）');
        lines.push('（你觉得脑子里空了一块。刚才还能想起来的东西，现在只剩下轮廓。）');
        State.detail = Math.max(3, State.detail - 1);
        // 掉了一档细节，钥匙跟着掉
        if (global.tierOfDetail) {
          const t = global.tierOfDetail(State.detail);
          if (global.TIER_ORDER.indexOf(t) < global.TIER_ORDER.indexOf(State.keyQ || 'perfect')) State.keyQ = t;
        }
      }
      if (State.soulAnswered) {
        lines.push('');
        lines.push('（最后那声，你应了。）');
        lines.push('（应完之后，你才想起：那年停电，母亲把你按在桌子底下，\n她自己没进来。）');
      } else {
        lines.push('');
        lines.push('（最后那声，你没有应。）');
        lines.push('（脚步声走了。走出去很远，还在蹭。）');
      }
      await this.type(lines.join('\n'));
      $('#sl-gap').classList.add('wide');
      Snd.tone(70, 2.4, { type: 'sine', gain: 0.06, attack: .8 });
      await wait(2600);
      Toast.show('门缝松了 —— 回去开门', 3200);
      await Fade.through(() => {
        App.show('counter');
        if (global.Counter) { Counter.init(); Counter.refreshHud(); Counter.updateHint(); }
      });
    },
  };

  global.Soul = Soul;
  global.SOUL_CALLS = CALLS;
})(window);
