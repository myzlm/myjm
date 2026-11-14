/* ============================================================
   scene-clock.js — 墙上的钟
   ------------------------------------------------------------
   柜台上方那只钟停在三点一刻之前的一分钟，谁也不去拨。
   第三格抽屉的锁是它——先把钟对到那个时刻。

   陷阱：钟只走十二个小时。三点十四，可能是这个三点，
   也可能是另一个三点。屋里没有下午。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, $$, Fade, Toast } = global.G;

  const TARGET = { h: 3, m: 14, pm: false };

  const ClockG = {
    inited: false,
    h: 12,
    m: 0,
    pm: true,          // 默认停在午后 —— 多数人会顺手就错
    hintLv: 0,
    tries: 0,
    done: false,

    init() {
      if (this.inited) return;
      this.inited = true;
      // 十二道刻度：一整块会转的层，省得算角度
      const ticks = document.querySelector('.cl-ticks');
      if (ticks && !ticks.children.length) {
        for (let i = 0; i < 12; i++) {
          const t = document.createElement('i');
          t.className = 'cl-tick' + (i % 3 === 0 ? ' big' : '');
          t.style.transform = 'rotate(' + (i * 30) + 'deg)';
          ticks.appendChild(t);
        }
      }
      $$('[data-cl]').forEach((b) => {
        b.addEventListener('click', () => this.nudge(b.dataset.cl, +b.dataset.v));
      });
      $('#cl-ampm').addEventListener('click', () => {
        this.pm = !this.pm;
        Snd.tone(520, 0.05, { type: 'square', gain: 0.04 });
        this.render();
      });
      $('#cl-check').addEventListener('click', () => this.check());
      $('#cl-hint').addEventListener('click', () => this.hint());
      $('#cl-back').addEventListener('click', async () => {
        await Fade.through(() => { global.App.show('counter'); global.Counter.init(); });
      });
    },

    start() {
      this.init();
      this.h = 10; this.m = 10; this.pm = true;
      this.hintLv = 0; this.tries = 0; this.done = false;
      $('#cl-msg').textContent = '';
      $('#cl-msg').className = 'cl-msg';
      this.render();
    },

    nudge(which, v) {
      if (this.done) return;
      Snd.init();
      if (which === 'h') {
        this.h = ((this.h - 1 + v) % 12 + 12) % 12 + 1;   // 1..12
        Snd.tone(240, 0.07, { type: 'square', gain: 0.05 });
      } else {
        this.m = ((this.m + v) % 60 + 60) % 60;
        Snd.tone(680, 0.035, { type: 'square', gain: 0.03 });
      }
      this.render();
    },

    render() {
      const ha = (this.h % 12) * 30 + this.m * 0.5;
      const ma = this.m * 6;
      $('#cl-hour').style.transform = 'rotate(' + ha + 'deg)';
      $('#cl-min').style.transform = 'rotate(' + ma + 'deg)';
      $('#cl-ampm').textContent = this.pm ? '午 后' : '午 前';
      $('#cl-ampm').classList.toggle('pm', this.pm);
      const hh = String(this.h).padStart(2, '0');
      const mm = String(this.m).padStart(2, '0');
      $('#cl-read').textContent = (this.pm ? '下午 ' : '凌晨 ') + hh + ':' + mm;
      $('#cl-read').classList.toggle('dark', false);
    },

    check() {
      if (this.done) return;
      this.tries++;
      const ok = this.h === TARGET.h && this.m === TARGET.m && this.pm === TARGET.pm;
      if (ok) {
        this.done = true;
        Snd.ok();
        Snd.tone(520, 0.6, { type: 'triangle', gain: 0.07 });
        setTimeout(() => Snd.tone(780, 0.9, { type: 'triangle', gain: 0.05 }), 180);
        $('#cl-msg').className = 'cl-msg good';
        $('#cl-msg').textContent = '钟开始走了。第三格抽屉「嗒」一声，自己弹出来一指宽。';
        const S = global.State;
        (S.sys = S.sys || {}).clock = true;
        if (S.keyQ !== 'perfect') S.keyQ = 'perfect';
        document.dispatchEvent(new CustomEvent('clockSet', { detail: { tries: this.tries } }));
        setTimeout(() => {
          Toast.show('抽屉里只有一样东西：一枚刻着「三」的铜片，和半把齿很深的钥匙。', 4600);
        }, 1100);
        return;
      }
      // 差在什么地方，说一句
      let said = '不对。指针走回去了。';
      if (this.h === TARGET.h && this.m === TARGET.m && this.pm !== TARGET.pm) {
        said = '下午三点十四。那时候门是关着的——屋里从来没有下午。';
      } else if (this.h === TARGET.h && !this.pm) {
        said = '时对了。分还差。';
      } else if (this.m === TARGET.m) {
        said = '分对了。时针不对。';
      }
      if (this.tries >= 3) said += '（按「提示」，我不笑你。）';
      Snd.deny();
      $('#cl-msg').className = 'cl-msg';
      $('#cl-msg').textContent = said;
    },

    hint() {
      this.hintLv = Math.min(3, this.hintLv + 1);
      const hs = [
        '钟背刻着两个字：三、未过半。',
        '记录卡上写着「今夜 03:14」。屋里没有下午——那个三点，是凌晨三点。',
        '时针拨到 3，分针拨到 14，再把「午后」点成「午前」。',
      ];
      const t = hs[this.hintLv - 1];
      $('#cl-msg').className = 'cl-msg';
      $('#cl-msg').textContent = t;
      Toast.show('提示 ' + this.hintLv + '/3：' + t, 4200);
    },
  };

  global.ClockG = ClockG;
})(window);
