/* ============================================================
   meta4.js — 两道墙
   ------------------------------------------------------------
   一、外面的墙：切标签、拖窗口、粘贴东西、把鼠标甩出去。
       你摸一次，它记一次。摸够了，它会回摸你。（觉醒者）
   二、循环的墙：每一周目结束时，把你的"选择形状"存下来。
       下一次如果一模一样，它会认出来。（守夜人）
   ============================================================ */
(function (global) {
  'use strict';

  const RUNS = 'code_echo_runs_v1';

  const Meta = {
    lastAt: 0,

    runs() {
      try { return JSON.parse(localStorage.getItem(RUNS) || '[]'); } catch (e) { return []; }
    },

    /* 选择形状：同一串，才算"完全复刻" */
    signature(S) {
      const s = (S && S.sys) || {};
      return [
        S.finalChoice || '-',
        s.verified || 0,
        s.memRelics || 0,
        s.deleted || 0,
        s.hurt || 0,
        (s.boss && s.boss.ai) || 0,
        s.copy7 ? 1 : 0,
        s.readAll ? 1 : 0,
        S.name || S.playerName || '-',
      ].join('|');
    },

    commit(S) {
      const list = this.runs();
      const sig = this.signature(S);
      const prev = list[list.length - 1];
      if (prev && prev.sig === sig) {
        S.sys.sameAsLast = true;
        S.sys.loop = true;
      }
      list.push({ sig, at: Date.now(), ending: S.sys.ending || '' });
      try { localStorage.setItem(RUNS, JSON.stringify(list.slice(-40))); } catch (e) {}
      return list.length;
    },

    boot() {
      const S = global.State;
      if (!S) return;
      S.sys = S.sys || {};
      S.sys.played = this.runs().length + 1;
    },

    /* ---------------- 外面的墙 ---------------- */
    touch(why) {
      const S = global.State;
      if (!S || !S.playerName) return;      // 签完约才算"进到屋里"
      const now = Date.now();
      if (now - this.lastAt < 1600) return; // 别把一次拖动算成十次
      this.lastAt = now;
      S.sys = S.sys || {};
      S.sys.outside = Math.min(12, (S.sys.outside || 0) + 1);
      const n = S.sys.outside;
      const T = global.Toast;
      if (n === 3 && T) T.show('（有东西在外面碰了一下。像是你。）', 3200);
      if (n === 5 && T) T.show('（它开始学你的动作了。你停，它也停，慢了半拍。）', 3600);
      if (n >= 7 && T) T.show('（别再看外面了。外面也在看你。）', 3600);
      if (global.Snd && n >= 5) {
        try { global.Snd.tone(58, 0.5, { type: 'sine', gain: 0.05 }); } catch (e) {}
      }
      document.dispatchEvent(new CustomEvent('metaTouch', { detail: { n, why } }));
    },

    bind() {
      if (this.bound) return;
      this.bound = true;
      // 切标签 / 最小化
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) this.touch('hidden');
      });
      // 焦点跑掉
      window.addEventListener('blur', () => this.touch('blur'));
      // 鼠标甩出窗口
      document.addEventListener('mouseleave', () => this.touch('leave'));
      // 从外面粘东西进来
      document.addEventListener('paste', () => this.touch('paste'));
      // 拖窗口改大小
      window.addEventListener('resize', () => this.touch('resize'));
    },
  };

  global.Meta = Meta;
  window.addEventListener('load', () => setTimeout(() => { Meta.boot(); Meta.bind(); }, 60));
})(window);
