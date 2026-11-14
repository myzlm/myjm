/* ============================================================
   scene-scratch.js — 地板上的刻痕
   ------------------------------------------------------------
   蹲下去，柜台底下那块地板有六组划痕，每组四道。
   深浅不一样。深的算一，浅的算零。
   四道一组，读出来是一个数字。六个数字，是一把锁。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, Fade, Toast } = global.G;

  const Scratch = {
    inited: false,
    code: [],
    hintLv: 0,
    done: false,
    tries: 0,

    init() {
      if (this.inited) return;
      this.inited = true;
      $('#kh-check').addEventListener('click', () => this.check());
      $('#kh-input').addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); this.check(); }
      });
      $('#kh-hint').addEventListener('click', () => this.hint());
      $('#kh-back').addEventListener('click', async () => {
        await Fade.through(() => { global.App.show('counter'); global.Counter.init(); });
      });
    },

    start() {
      this.init();
      this.hintLv = 0;
      this.tries = 0;
      this.done = false;
      $('#kh-msg').textContent = '';
      $('#kh-msg').className = 'kh-msg';
      $('#kh-input').value = '';
      $('#kh-hatch').classList.remove('open');
      this.roll();
      this.render();
    },

    /* 六个 0—9；不许出现"全是零"或"全是九"这种一眼就看穿的组合 */
    roll() {
      let c;
      let guard = 0;
      do {
        c = Array.from({ length: 6 }, () => Math.floor(Math.random() * 10));
        guard++;
      } while (guard < 30 && (c.every((d) => d === 0) || c.every((d) => d === c[0]) || c.filter((d) => d > 0).length < 3));
      this.code = c;
    },

    render() {
      const box = $('#kh-groups');
      const gname = ['一', '二', '三', '四', '五', '六'];
      box.innerHTML = this.code.map((d, gi) => {
        const bits = d.toString(2).padStart(4, '0').split('').map(Number);
        const marks = bits.map((b) => '<i class="kh-n ' + (b ? 'deep' : 'shal') + '"></i>').join('');
        return '<div class="kh-g">' +
          '<div class="kh-g-marks">' + marks + '</div>' +
          '<div class="kh-g-n">第' + gname[gi] + '组</div>' +
          '</div>';
      }).join('');
    },

    check() {
      if (this.done) return;
      const v = ($('#kh-input').value || '').trim();
      if (!/^\d{6}$/.test(v)) {
        $('#kh-msg').className = 'kh-msg';
        $('#kh-msg').textContent = '六个数。不多不少。';
        Snd.deny();
        return;
      }
      if (v === this.code.join('')) {
        this.done = true;
        Snd.ok();
        Snd.tone(180, 0.5, { type: 'sine', gain: 0.1, to: 90 });
        $('#kh-msg').className = 'kh-msg good';
        $('#kh-msg').textContent = '地板翘起来一块。下面是一个很小的格子。';
        const S = global.State;
        (S.sys = S.sys || {}).scratch = true;
        (S.sys = S.sys || {}).relics = (S.sys.relics || 0) + 1;
        document.dispatchEvent(new CustomEvent('scratchOpen', { detail: { code: v } }));
        setTimeout(() => {
          $('#kh-hatch').classList.add('open');
          Toast.show('格子里是一枚铜片，上面刻着三十六道划痕，和一道新的——第三十七。', 5200);
        }, 700);
        return;
      }
      this.tries++;
      // 说清楚差在哪儿，别让人干瞪眼
      const mine = v.split('').map(Number);
      const wrong = mine.map((d, i) => (d === this.code[i] ? -1 : i)).filter((i) => i >= 0);
      $('#kh-msg').className = 'kh-msg';
      $('#kh-msg').textContent = '第' + ['一', '二', '三', '四', '五', '六'][wrong[0]] +
        '组不对。其他都对。' + (wrong.length > 1 ? '（还有 ' + (wrong.length - 1) + ' 组也不对）' : '');
      Snd.deny();
      if (this.tries >= 3) {
        $('#kh-input').value = '';
        $('#kh-msg').textContent += ' 按「提示」看砖角上的炭字。';
      }
    },

    hint() {
      this.hintLv = Math.min(4, this.hintLv + 1);
      const hs = [
        '刻痕有深有浅。深的一道有指甲盖宽，浅的只留下一道白印。',
        '四道一组。一组就是一个数字——深的算一，浅的算零。',
        '砖角有炭字：「浅浅深浅，是一。」浅浅深浅就是二，浅浅深深是三。',
        '六组从左往右读。第一组是百位上的千位……不，是六位数的最左那一位。',
      ];
      const t = hs[this.hintLv - 1];
      $('#kh-msg').className = 'kh-msg';
      $('#kh-msg').textContent = t;
      Toast.show('提示 ' + this.hintLv + '/4：' + t, 4400);
    },
  };

  global.Scratch = Scratch;
})(window);
