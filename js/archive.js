/* ============================================================
   archive.js — 侧边坞 + 档案册
   ------------------------------------------------------------
   三样东西一直跟着你：视角、卷轴、档案。
   「视」代码透视（P）　「卷」墨韵终端（K）　「档」真名/彩蛋/结局（V）
   ============================================================ */
(function (global) {
  'use strict';

  const { $, $$, Toast } = global.G;

  const Archive = {
    tab: 'name',
    open: false,
    el: null,

    boot() {
      this.buildDock();
      this.buildModal();

      // 与"游戏外面"互动：切出去再回来
      window.addEventListener('blur', () => {
        const S = global.State;
        if (S && S.sys) {
          S.sys.outside = (S.sys.outside || 0) + 1;
          if (S.sys.outside === 3 && global.G) global.G.Toast.show('外面没有别的东西。', 2400);
        }
      });
      // 读完 36 号记录 = 把记录库看完了
      document.addEventListener('recordFound', () => {
        const S = global.State;
        if (S && S.sys) S.sys.reads = Math.max(S.sys.reads || 0, 36);
      });
      document.addEventListener('keydown', (e) => {
        const t = e.target;
        if (t && /INPUT|TEXTAREA/.test(t.tagName)) return;
        if (e.key === 'p' || e.key === 'P') { e.preventDefault(); if (global.Persp) global.Persp.toggle(); }
        if (e.key === 'k' || e.key === 'K') { e.preventDefault(); if (global.Moyun) global.Moyun.show(); }
        if (e.key === 'v' || e.key === 'V') { e.preventDefault(); this.toggle(); }
        if (e.key === 'Escape' && this.open) this.close();
      });
    },

    buildDock() {
      if ($('#dock')) return;
      const d = document.createElement('div');
      d.className = 'dock';
      d.id = 'dock';
      d.innerHTML =
        '<button class="dock-b" id="dock-persp" title="代码透视（P）"><span>视</span><i>P</i></button>' +
        '<button class="dock-b" id="dock-moyun" title="墨韵·科技卷轴（K）"><span>卷</span><i>K</i></button>' +
        '<button class="dock-b" id="dock-arch" title="档案册（V）"><span>档</span><i>V</i><b id="dock-badge">0</b></button>';
      document.body.appendChild(d);
      d.querySelector('#dock-persp').onclick = () => {
        if (global.Persp) global.Persp.toggle();
      };
      d.querySelector('#dock-moyun').onclick = () => {
        if (!global.Moyun) return Toast.show('卷轴还没有被找到。', 2200);
        global.Moyun.show();
      };
      d.querySelector('#dock-arch').onclick = () => this.toggle();
      this.refreshDock();
      setInterval(() => this.refreshDock(), 4000);
    },

    refreshDock() {
      const b = $('#dock-badge');
      if (!b) return;
      const n = global.Eggs ? global.Eggs.count() : 0;
      b.textContent = n;
      b.classList.toggle('on', n > 0);
      const p = $('#dock-persp');
      if (p) p.classList.toggle('locked', !global.Persp || global.Persp.level() < 1);
    },

    buildModal() {
      if ($('#archive')) return;
      const d = document.createElement('div');
      d.className = 'archive';
      d.id = 'archive';
      d.innerHTML =
        '<div class="ar-win">' +
        '<div class="ar-bar"><b>档案册</b><span class="ar-sub">第 36 号 · 随身</span>' +
        '<button class="ar-x" id="ar-x">×</button></div>' +
        '<div class="ar-tabs">' +
        '<button class="ar-t on" data-t="name">真名</button>' +
        '<button class="ar-t" data-t="quests">未竟</button>' +
        '<button class="ar-t" data-t="eggs">彩蛋</button>' +
        '<button class="ar-t" data-t="fus">融合</button>' +
        '<button class="ar-t" data-t="ends">结局</button>' +
        '<button class="ar-t" data-t="perm">权限</button>' +
        '</div>' +
        '<div class="ar-body" id="ar-body"></div>' +
        '</div>';
      document.body.appendChild(d);
      this.el = d;
      d.querySelector('#ar-x').onclick = () => this.close();
      d.querySelectorAll('.ar-t').forEach((b) => {
        b.onclick = () => { this.tab = b.dataset.t; d.querySelectorAll('.ar-t').forEach((x) => x.classList.toggle('on', x === b)); this.render(); };
      });
      d.addEventListener('click', (e) => { if (e.target === d) this.close(); });
      this.el.addEventListener('click', (e) => {
        const tk = e.target.closest('[data-take]');
        if (tk) {
          if (global.Quests) global.Quests.take(tk.dataset.take);
          this.render();
          return;
        }
        const c = e.target.closest('[data-copy]');
        if (c) {
          const v = c.dataset.copy;
          try { navigator.clipboard.writeText(v); Toast.show('已抄下：' + v, 1800); }
          catch (err) { Toast.show(v, 2600); }
        }
      });
    },

    toggle() { this.open ? this.close() : this.show(); },
    show() { this.buildModal(); this.open = true; this.el.classList.add('on'); this.render(); },
    close() { this.open = false; if (this.el) this.el.classList.remove('on'); },

    render() {
      const body = $('#ar-body');
      if (!body) return;
      const S = global.State || {};
      if (this.tab === 'name') {
        const mems = (global.TrueName && global.TrueName.data.memories) || [];
        body.innerHTML = (global.TrueName ? global.TrueName.cardHTML() : '') +
          '<div class="ar-sec">抵押过的记忆 · ' + mems.length + ' 段</div>' +
          (mems.length ? mems.map((m, i) =>
            '<div class="ar-mem"><b>#' + (i + 1) + '</b><span>' + m.replace(/</g, '&lt;').slice(0, 120) + '</span></div>').join('')
            : '<div class="ar-empty">还没有。柜台上有张空白抵押单。</div>') +
          '<div class="ar-note">真名不是名字。名字可以改，真名改不了——它由你来的时间、你押下的记忆、和你做过的选择算出来。</div>';
      } else if (this.tab === 'quests') {
        body.innerHTML = global.Quests ? global.Quests.listHTML()
          : '<div class="ar-empty">还没有接手过谁的事。</div>';
      } else if (this.tab === 'eggs') {
        body.innerHTML = '<div class="ar-count">彩蛋 ' + global.Eggs.count() + ' / 60　·　融合 ' +
          global.Eggs.fusionCount() + ' / 44</div>' + global.Eggs.listHTML();
      } else if (this.tab === 'fus') {
        body.innerHTML = '<div class="ar-count">已成形 ' + global.Eggs.fusionCount() + ' / 44</div>' +
          global.Eggs.fusionHTML();
      } else if (this.tab === 'ends') {
        body.innerHTML = global.Endings.galleryHTML();
      } else {
        const lv = global.Persp ? global.Persp.level() : 0;
        const rows = [
          ['L0', '观察者', '只能看', '默认'],
          ['L1', '修改者', '改黄色节点', '三 段记忆通过核验'],
          ['L2', '窥视者', '看见红色节点', '进过里空间 / 第四章'],
          ['L3', '掌控者', '改红色节点', '抵达过一个结局'],
          ['L∞', '编写者', '写新代码', '在卷轴里解开密文'],
        ];
        body.innerHTML = '<div class="ar-count">当前：' +
          (global.Persp ? global.Persp.levelName() : 'L0 观察者') + '</div>' +
          '<div class="perm-list">' + rows.map((r, i) =>
            '<div class="perm-row ' + (i <= lv ? 'on' : '') + '"><b>' + r[0] + '</b><span>' + r[1] + '</span>' +
            '<i>' + r[2] + '</i><em>' + r[3] + '</em></div>').join('') + '</div>' +
          '<div class="ar-note">权限不是奖励。是"你能看见多少"。<br>看见得越多，越难假装什么都没看见。</div>';
      }
    },
  };

  global.Archive = Archive;
})(window);
