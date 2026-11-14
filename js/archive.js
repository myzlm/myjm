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
        if (e.key === 'q' || e.key === 'Q') {
          const cur = global.App && global.App.current;
          const S = global.State || {};
          const nightDone = (S.ch6 >= 1) || !!S.ch7;
          if (!nightDone) return;
          if (cur === 'lock' || cur === 'login' || cur === 'win98' || cur === 'duty' ||
              cur === 'final' || cur === 'end' || cur === 'moyun' || cur === 'street' ||
              this.open) return;
          e.preventDefault();
          if (global.Street) global.Street.reenter();
        }
        if (e.key === 'y' || e.key === 'Y') {
          const cur = global.App && global.App.current;
          if (cur === 'lock' || cur === 'login' || cur === 'win98' ||
              cur === 'final' || cur === 'end' || cur === 'moyun' ||
              cur === 'street' || this.open) return;
          e.preventDefault();
          if (global.Hands) global.Hands.enter();
        }
        if (e.key === 'Escape' && this.open) this.close();
      });
    },

    buildDock() {
      if ($('#dock')) return;
      const d = document.createElement('div');
      d.className = 'dock';
      d.id = 'dock';
      d.innerHTML =
        '<button class="dock-b" id="dock-hands" title="柜台底下的木箱（Y）"><span>箱</span><i>Y</i></button>' +
        '<button class="dock-b" id="dock-persp" title="代码透视（P）"><span>视</span><i>P</i></button>' +
        '<button class="dock-b" id="dock-moyun" title="墨韵·科技卷轴（K）"><span>卷</span><i>K</i></button>' +
        '<button class="dock-b" id="dock-arch" title="档案册（V）"><span>档</span><i>V</i><b id="dock-badge">0</b></button>';
      document.body.appendChild(d);
      d.querySelector('#dock-persp').onclick = () => {
        if (global.Persp) global.Persp.toggle();
      };
      d.querySelector('#dock-hands').onclick = () => {
        if (global.Hands) global.Hands.enter();
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
        '<button class="ar-t" data-t="space">里间</button>' +
        '<button class="ar-t" data-t="fus">融合</button>' +
        '<button class="ar-t" data-t="ends">结局</button>' +
        '<button class="ar-t" data-t="cards">票根</button>' +
        '<button class="ar-t" data-t="duty">当班</button>' +
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
          return;
        }
        const cd = e.target.closest('.ar-card');
        if (cd && !cd.classList.contains('lock')) { cd.classList.toggle('flip'); return; }
        const dt = e.target.closest('.ar-dt-row');
        if (dt) { dt.classList.toggle('on'); return; }
        const go = e.target.closest('[data-space-go]');
        if (go) {
          this.close();
          if (global.Space) setTimeout(() => global.Space.open(), 260);
        }
      });
    },

    toggle() { this.open ? this.close() : this.show(); },
    show() { this.buildModal(); this.open = true; this.el.classList.add('on'); this.render(); },
    close() { this.open = false; if (this.el) this.el.classList.remove('on'); },

    /* 里间：三十五个人、八只柜子 */
    spaceHTML() {
      const M = global.MEMORY || [];
      const S = global.State || {};
      const s = S.sys || {};
      const st = global.Memory ? global.Memory.stats() : { read: 0, relics: 0, total: 35 };

      if (!s.sawSpace) {
        return '<div class="ar-empty">柜台后面有一道缝。它一直比看起来深。</div>' +
          '<div class="ar-note">你还没走进去过。<br>（柜台里，按 L，或者点门后那道缝。）</div>';
      }

      let h = '<div class="ar-count">读过 ' + st.read + ' / ' + st.total +
        '　·　拿走 ' + st.relics + ' / ' + st.total +
        '　·　说过话 ' + Object.keys(s.npcs || {}).length + ' / 6' +
        '　·　撕掉 ' + Object.keys(s.torn || {}).length + ' / 6</div>';

      h += '<div class="ar-sp">';
      for (let c = 0; c < 8; c++) {
        if (c === 7) {
          const full = st.relics >= 35;
          h += '<div class="ar-spcase empty"><b>第 36 只</b><i>' +
            (s.shifted ? (full ? '空着。你已经把三十五件都穿在身上了。' : '空着。柜门朝里开。')
                       : '接不上。得换个角度才看得见。') +
            '</i></div>';
          continue;
        }
        const rows = M.filter((m) => Math.floor((m.no - 1) / 5) === c);
        if (!rows.length) continue;
        h += '<div class="ar-spcase"><b>' + rows[0].year + '′ — ' + rows[rows.length - 1].year + '′</b>' +
          '<i>第 ' + (c + 1) + ' 只</i>' +
          rows.map((m) => {
            const rd = global.Memory.hasRead(m.no);
            const gt = global.Memory.hasRelic(m.no);
            return '<div class="ar-spm' + (rd ? ' on' : '') + (gt ? ' got' : '') + '">' +
              '<span>' + String(m.no).padStart(2, '0') + '</span>' +
              '<em>' + (rd ? m.job : '—— 还没打开') + '</em>' +
              (gt ? '<u>拿走</u>' : '') + '</div>';
          }).join('') + '</div>';
      }
      h += '</div>';

      h += '<div class="ar-note">读是见证，拿是占有。<br>读完了还拿，就是替他把东西留着——也替他把话堵住了。</div>' +
        '<div class="ar-spgo"><button data-space-go="1">走进去（L）</button></div>';
      return h;
    },

    /* 票根：九张，翻过来看它借的是谁的胆子 */
    cardsHTML() {
      if (!global.Chapter) return '<div class="ar-empty">柜台还没有给你票。</div>';
      const list = global.Chapter.list();
      const got = list.filter((c) => c.seen).length;
      let h = '<div class="ar-count">票根 ' + got + ' / ' + list.length +
        '　·　点一下翻面</div><div class="ar-cards">';
      list.forEach((c) => {
        if (!c.seen) {
          h += '<div class="ar-card lock"><div class="ar-card-f">' +
            '<b>' + c.no + '</b><i>还没入场</i><span>——</span></div></div>';
          return;
        }
        h += '<div class="ar-card" data-card="' + c.id + '"><div class="ar-card-in">' +
          '<div class="ar-card-f"><b>' + c.no + '</b><i>' + c.name + '</i>' +
          '<span>' + c.epi[0] + '</span><u>' + c.seall + '</u></div>' +
          '<div class="ar-card-b"><em>票 根 背 面</em><p>' +
          c.back.replace(/</g, '&lt;') + '</p></div></div></div>';
      });
      h += '</div><div class="ar-note">每一章进门之前，柜台都给你一张票。<br>' +
        '票上盖的章，是你替他记下的那一个字。</div>';
      return h;
    },

    /* 当班：七笔，你写的那一行，和它后来变成的样子 */
    dutyHTML() {
      const S = global.State || {};
      const d = (S.sys && S.sys.duty) || null;
      const picks = (d && d.picks) || [];
      if (!picks.length) {
        return '<div class="ar-empty">柜台上那张纸还没到你手里。</div>' +
          '<div class="ar-note">打烊那一班在第六章。<br>（到那时候，这一页会自己长出字来。）</div>';
      }
      const guests = (global.Duty && global.Duty.data) ? global.Duty.data() : [];
      const FC = (global.Duty && global.Duty.FATE_CN) || {};
      const WC = (global.Duty && global.Duty.WRITE_CN) || {};
      const st = (S.sys && S.sys.street) || null;
      const seen = (st && st.seen) || [];
      const acts = (st && st.acts) || {};
      const ACT_CN = { near: '只走近了', say: '说了话', away: '走开了' };

      const c = (k) => picks.filter((p) => p.fate === k).length;
      const kept = c('kept'), hurt = c('stripped'), voided = c('voided');
      const ref = c('refused'), paid = c('paid');
      const oil = (d && typeof d.oil === 'number') ? d.oil : null;

      let h = '<div class="ar-count">七笔 · 保住 ' + kept + ' · 被折 ' + hurt +
        ' · 作废 ' + voided + (ref ? ' · 没办 ' + ref : '') + (paid ? ' · 抵了 ' + paid : '') +
        (oil !== null ? '　·　油剩 ' + oil + ' 格' : '') + '　·　点一行看它后来' + '</div>';

      h += '<div class="ar-dt">';
      picks.forEach((p, i) => {
        const g = guests.find((x) => x.id === p.id) || {};
        const w = (g.writes && g.writes[p.kind]) ? g.writes[p.kind].line : '';
        const aft = (g.after && g.after[p.fate]) ? g.after[p.fate] : [];
        const went = seen.indexOf(p.id) >= 0;
        const how = acts[p.id] ? (ACT_CN[acts[p.id]] || '') : '';
        h += '<div class="ar-dt-row' + (p.rewritten ? ' rw' : '') + '" data-dt="' + p.id + '">' +
          '<div class="ar-dt-h">' +
          '<span class="ar-dt-no">' + String(p.no || (i + 1)).padStart(2, '0') + '</span>' +
          '<b class="ar-dt-name">' + p.name + '</b>' +
          '<i class="ar-dt-relic">' + p.relic + '</i>' +
          '<span class="ar-dt-r">' +
          (went ? '<u class="ar-dt-door">门外 · ' + (how || '走过') + '</u>' : '') +
          '<em class="ar-dt-k">' + (p.rewritten ? '↺ ' : '') + (WC[p.kind] || '') + '</em>' +
          '<em class="ar-dt-f f-' + p.fate + '">' + (FC[p.fate] || '') + '</em>' +
          '</span></div>' +
          '<div class="ar-dt-w">' + (w ? w.replace(/</g, '&lt;')
            : (p.kind === 'refuse' ? '（这一笔没有写。）' : '（你拿自己的东西抵了这一笔。）')) + '</div>' +
          '<div class="ar-dt-a"><em class="ar-dt-lab">后 来</em>' +
          (aft.length ? aft.map((t) => '<p>' + t.replace(/</g, '&lt;') + '</p>').join('')
            : '<p>（纸上没有这一笔的后来。）</p>') +
          '</div></div>';
      });
      h += '</div>';

      const tail = (d && d.seat)
        ? '这一班最后不是你收的摊。你走到门口，把灯留给了下一个人。'
        : ((d && d.lamp === false) || oil === 0
          ? '灯灭在你收摊之前。纸上的字还认得出来。'
          : '灯亮着。你把纸对折，塞进柜台的抽屉里。');
      h += '<div class="ar-note">这是那张纸。上面的字是你写的，不是别人替你写的。<br>' +
        tail.replace(/</g, '&lt;') + '</div>';
      return h;
    },

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
      } else if (this.tab === 'space') {
        body.innerHTML = this.spaceHTML();
      } else if (this.tab === 'fus') {
        body.innerHTML = '<div class="ar-count">已成形 ' + global.Eggs.fusionCount() + ' / 44</div>' +
          global.Eggs.fusionHTML();
      } else if (this.tab === 'ends') {
        body.innerHTML = global.Endings.galleryHTML();
      } else if (this.tab === 'cards') {
        body.innerHTML = this.cardsHTML();
      } else if (this.tab === 'duty') {
        body.innerHTML = this.dutyHTML();
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
