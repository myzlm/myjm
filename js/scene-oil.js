/* ============================================================
   scene-oil.js — 长明灯的油
   ------------------------------------------------------------
   八钱油，三只碗：八钱、五钱、三钱。
   要分成两个四：一份添灯，一份留着夜里续。
   只能倒——流到满，或者流干。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, Fade, Toast } = global.G;

  const CAP = [8, 5, 3];
  const NAME = ['八钱', '五钱', '三钱'];

  const Oil = {
    inited: false,
    amt: [8, 0, 0],
    sel: -1,
    moves: 0,
    hintLv: 0,
    done: false,

    init() {
      if (this.inited) return;
      this.inited = true;
      $('#oil-hint').addEventListener('click', () => this.hint());
      $('#oil-reset').addEventListener('click', () => { Snd.deny(); this.reset(); });
      $('#oil-back').addEventListener('click', async () => {
        await Fade.through(() => { global.App.show('counter'); global.Counter.init(); });
      });
    },

    start() {
      this.init();
      this.reset();
    },

    reset() {
      this.amt = [8, 0, 0];
      this.sel = -1;
      this.moves = 0;
      this.hintLv = 0;
      this.done = false;
      $('#oil-msg').textContent = '';
      $('#oil-msg').className = 'oil-msg';
      this.render();
    },

    render() {
      const box = $('#oil-bowls');
      box.innerHTML = this.amt.map((a, i) => {
        const pct = Math.round((a / CAP[i]) * 100);
        return '<button class="oil-bowl' + (this.sel === i ? ' on' : '') + '" data-i="' + i + '">' +
          '<span class="ob-shell"><span class="ob-fill" style="height:' + pct + '%"></span>' +
          '<span class="ob-ticks"></span></span>' +
          '<span class="ob-n">' + NAME[i] + '</span>' +
          '<span class="ob-v">' + a + '<i>/' + CAP[i] + '</i></span>' +
          '</button>';
      }).join('');

      $$('.oil-bowl').forEach((b) => {
        b.addEventListener('click', () => this.tap(+b.dataset.i));
      });

      $('#oil-steps').textContent = '倒 ' + this.moves + ' 次';
    },

    tap(i) {
      Snd.init();
      if (this.done) return;
      if (this.sel < 0) {
        if (!this.amt[i]) { Snd.deny(); $('#oil-msg').textContent = '这只碗是空的。'; return; }
        this.sel = i;
        Snd.tone(420, 0.06, { type: 'sine', gain: 0.05 });
        $('#oil-msg').textContent = '提起了' + NAME[i] + '碗。再点一只，倒过去。';
        this.render();
        return;
      }
      if (this.sel === i) {
        this.sel = -1;
        $('#oil-msg').textContent = '';
        this.render();
        return;
      }
      this.pour(this.sel, i);
    },

    pour(a, b) {
      const room = CAP[b] - this.amt[b];
      const move = Math.min(this.amt[a], room);
      if (move <= 0) {
        Snd.deny();
        $('#oil-msg').textContent = room <= 0 ? '满了。倒不进去。' : '那只碗里没有油。';
        this.sel = -1;
        this.render();
        return;
      }
      this.amt[a] -= move;
      this.amt[b] += move;
      this.moves++;
      this.sel = -1;
      Snd.tone(300 + Math.random() * 40, 0.16, { type: 'sine', gain: 0.05, to: 220 });
      Snd.noise(0.2, { type: 'bandpass', freq: 900, q: 1.6, gain: 0.05 });
      this.render();
      this.check();
    },

    check() {
      // 两个四：一份添灯，一份留着
      if (this.amt[0] === 4 && this.amt[1] === 4) {
        this.done = true;
        Snd.ok();
        $('#oil-msg').className = 'oil-msg good';
        $('#oil-msg').textContent = '油分成了两份四钱。三盏灯的火一齐矮下去，又一齐稳住。';
        const S = global.State;
        (S.sys = S.sys || {}).oil = true;
        const lamp = document.getElementById('om-lamp');
        if (lamp) lamp.classList.add('full');
        if (global.Eggs) global.Eggs.checkMilestones && global.Eggs.checkMilestones();
        if (S.keyQ !== 'perfect') S.keyQ = 'fine';
        document.dispatchEvent(new CustomEvent('oilSplit', { detail: { moves: this.moves } }));
        setTimeout(() => {
          Toast.show('灯芯下面压着半把钥匙：齿很深。', 3600);
        }, 900);
        return;
      }
      if (this.amt[0] === 4 || this.amt[1] === 4) {
        $('#oil-msg').textContent = '有一份是四钱了。另一份还差一点。';
      }
    },

    hint() {
      this.hintLv = Math.min(3, this.hintLv + 1);
      const hs = [
        '八钱要分成两个四。三只碗，只有一只装得下四。',
        '先把五钱碗倒满，再用它把三钱碗倒满——你手上就多出二。',
        '最后一步，是把三钱碗倒回大碗。在那之前，五钱碗里应该正好是四。',
        '照着走：八→五、五→三、三→八、五→三、八→五、五→三、三→八。',
      ];
      const t = hs[this.hintLv - 1];
      $('#oil-msg').className = 'oil-msg';
      $('#oil-msg').textContent = t;
      Toast.show('提示 ' + this.hintLv + '/4：' + t, 4200);
    },
  };

  global.Oil = Oil;
  global.Oil.CAP = CAP;
})(window);
