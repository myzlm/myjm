/* ============================================================
   quests.js — 未竟之事（七位前任玩家的支线）
   ------------------------------------------------------------
   设计稿：支线不属于主角，属于"上一位"。他们在第三次抵押时
   把没做完的事押在了这里；你接手，是替他们把话说完。

   #3 林墨   帮我找到她            5—10 分钟
   #11 陈一鸣 修复无法编译的代码     15—20 分钟
   #17 张雨桐 找到锁匹配"无法打开的钥匙" 15—20 分钟
   #22 李知远 找到未寄出信的收件人    5—10 分钟
   #28 王未   找回日记被撕掉的页      15—20 分钟
   #31 陈眠   解码"复活节彩蛋"       10—15 分钟
   #35 赵回   "试试另一种方法"       10—15 分钟
   ============================================================ */
(function (global) {
  'use strict';

  const LS = 'code_echo_quests_v1';

  const QUESTS = [
    {
      id: 'linmo', no: 3, who: '林墨', job: '帮我找到她',
      brief: '他没说「她」是谁，只把一张照片押在这里，说背面写着一句话。',
      hint: '墨韵卷轴 · 林墨的照片背面',
      line: '照片背面只有一行：第三排第三格，她一直在那儿。',
      reward: '记忆细节 +1',
      test: (f) => f.moyun.indexOf('photo') >= 0,
    },
    {
      id: 'chenyiming', no: 11, who: '陈一鸣', job: '修复无法编译的代码',
      brief: '他留下的工程打不开。编译器的第一行错误至今没人看懂。',
      hint: 'L∞ 编辑器 · 写一段能编译的 C++',
      line: '编译通过的那一刻，错误列表里最后一行写着「谢谢」。',
      reward: '真名 · 行动码 +1',
      test: (f) => !!f.compiled,
    },
    {
      id: 'zhangyutong', no: 17, who: '张雨桐', job: '找到锁匹配「无法打开的钥匙」',
      brief: '她说钥匙一直在她手上，只是找不到那把锁。',
      hint: '修电脑 · 紫光下的密码锁',
      line: '六位按完，锁开了。钥匙原来一直插在锁孔里。',
      reward: '记忆细节 +1',
      test: (f) => !!f.lock,
    },
    {
      id: 'lizhiyuan', no: 22, who: '李知远', job: '找到未寄出信的收件人',
      brief: '信写完了，邮票贴了，收件人那一栏空着。',
      hint: '终端 · cat /var/records/22',
      line: '22 号记录的收件人栏里，写着他自己的名字。',
      reward: '真名 · 记忆码 +1',
      test: (f) => !!f.rec22,
    },
    {
      id: 'wangwei', no: 28, who: '王未', job: '找回日记被撕掉的页',
      brief: '日记缺了一页。撕口很整齐，像是被人从里面小心取走的。',
      hint: '墨韵卷轴 · 王未的日记残页',
      line: '那一页只写了一句：今天我又算了一遍，还是 37。',
      reward: '记忆细节 +1',
      test: (f) => f.moyun.indexOf('diary') >= 0,
    },
    {
      id: 'chenmian', no: 31, who: '陈眠', job: '解码「复活节彩蛋」',
      brief: '他把这个词写在纸上就睡了，再没醒。没人知道他要解的是什么。',
      hint: '任意途径 · 收满 20 个彩蛋',
      line: '二十个彩蛋凑齐，纸上那句话显影：彩蛋是给还在玩的人的信。',
      reward: '真名 · 彩蛋计数 ×1',
      test: (f) => (f.eggs || 0) >= 20,
    },
    {
      id: 'zhaohui', no: 35, who: '赵回', job: '「试试另一种方法」',
      brief: '他试了三十六次，每次都停在第四步。最后留下一句：换一种。',
      hint: '墨韵卷轴 · 同一条密文用两种算法都解开',
      line: '你不是找到答案的。你是找到了第二种到答案的路。',
      reward: '真名 · 行动码 +1',
      test: (f) => Object.keys(f.algsByKey || {}).some((k) => (f.algsByKey[k] || []).length >= 2),
    },
  ];

  const Quest = {
    quests: QUESTS,
    taken: {},
    finished: {},
    flags: { moyun: [], algsByKey: {}, compiled: false, lock: false, rec22: false },
    booted: false,

    load() {
      try {
        const o = JSON.parse(localStorage.getItem(LS) || '{}');
        this.taken = o.taken || {};
        this.finished = o.finished || {};
        this.flags = Object.assign({ moyun: [], algsByKey: {}, compiled: false, lock: false, rec22: false }, o.flags || {});
        this.flags.moyun = this.flags.moyun || [];
        this.flags.algsByKey = this.flags.algsByKey || {};
      } catch (e) { this.taken = {}; this.finished = {}; }
      return this;
    },

    save() {
      try {
        localStorage.setItem(LS, JSON.stringify({
          taken: this.taken, finished: this.finished, flags: this.flags,
        }));
      } catch (e) {}
    },

    /* ---------------- 接线 ---------------- */
    boot() {
      if (this.booted) return this;
      this.booted = true;
      this.load();
      const self = this;
      const later = () => setTimeout(() => self.check(), 400);

      /* 墨韵：解开了哪条 */
      document.addEventListener('moyunSolved', (e) => {
        const d = e.detail || {};
        if (d.key && self.flags.moyun.indexOf(d.key) < 0) self.flags.moyun.push(d.key);
        if (d.key && d.alg) {
          const m = self.flags.algsByKey[d.key] = self.flags.algsByKey[d.key] || [];
          if (m.indexOf(d.alg) < 0) m.push(d.alg);
        }
        self.save(); later();
      });
      /* 编辑器：编译通过 */
      document.addEventListener('codeRunOk', () => { self.flags.compiled = true; self.save(); later(); });
      /* 保险柜锁开了 */
      document.addEventListener('lockOpen', () => { self.flags.lock = true; self.save(); later(); });
      /* 22 号记录被读到 */
      document.addEventListener('recordRead', (e) => {
        if (+e.detail === 22) { self.flags.rec22 = true; self.save(); later(); }
      });
      /* 彩蛋计数变化也可能完成 #31 */
      document.addEventListener('eggUnlocked', () => later());

      setInterval(() => this.check(), 6000);
      setTimeout(() => this.check(), 1500);
      return this;
    },

    /* ---------------- 完成判定 ---------------- */
    check() {
      const f = this.flags;
      f.eggs = global.Eggs ? global.Eggs.count() : 0;
      this.quests.forEach((q) => {
        if (this.finished[q.id]) return;
        let ok = false;
        try { ok = !!q.test(f); } catch (e) { ok = false; }
        if (ok) this.finish(q.id, true);
      });
    },

    finish(id, quiet) {
      const q = this.quests.find((x) => x.id === id);
      if (!q || this.finished[id]) return false;
      this.finished[id] = Date.now();
      this.taken[id] = this.taken[id] || Date.now();
      this.save();
      if (global.TrueName) global.TrueName.bump('talk', 1);
      document.dispatchEvent(new CustomEvent('questDone', { detail: q }));
      if (!quiet) {
        const g = global.G;
        if (g && g.Ach) g.Ach.show('未竟 · ' + q.who + '「' + q.job + '」', q.line);
      }
      // 全部七件做完
      if (this.doneCount() >= this.quests.length) {
        document.dispatchEvent(new CustomEvent('questsAll'));
        if (global.Eggs) global.Eggs.unlock(60);
        setTimeout(() => {
          const g = global.G;
          if (g && g.Ach) g.Ach.show('七件未竟之事', '柜台后面空了。没有人再排队。');
        }, 1600);
      }
      return true;
    },

    take(id) {
      if (!this.taken[id]) {
        this.taken[id] = Date.now();
        this.save();
        const q = this.quests.find((x) => x.id === id);
        if (global.Toast && q) global.Toast.show('接下了 #' + q.no + ' ' + q.who + ' 的事。', 2400);
        document.dispatchEvent(new CustomEvent('questTaken', { detail: q }));
      }
    },

    isDone(id) { return !!this.finished[id]; },
    count() { return this.quests.length; },
    doneCount() { return Object.keys(this.finished).length; },
    activeCount() {
      return this.quests.filter((q) => this.taken[q.id] && !this.finished[q.id]).length;
    },

    /* ---------------- 档案册 ---------------- */
    listHTML() {
      const head = '<div class="ar-count">未竟 ' + this.doneCount() + ' / ' + this.count() +
        '　·　' + (this.doneCount() >= this.count() ? '七件都做完了' : '他们押在这里，还没走') + '</div>';
      const rows = this.quests.map((q) => {
        const done = !!this.finished[q.id];
        const take = !!this.taken[q.id];
        return '<div class="q-row ' + (done ? 'done' : take ? 'take' : '') + '" data-q="' + q.id + '">' +
          '<div class="q-h"><span class="q-no">#' + q.no + '</span>' +
          '<span class="q-who">' + q.who + '</span>' +
          '<span class="q-job">' + q.job + '</span>' +
          '<span class="q-st">' + (done ? '已完成' : take ? '进行中' : '待接手') + '</span></div>' +
          '<div class="q-brief">' + q.brief + '</div>' +
          (done
            ? '<div class="q-line">' + q.line + '<i>' + q.reward + '</i></div>'
            : '<div class="q-hint">线索：' + q.hint + '</div>' +
              (take ? '' : '<button class="q-take" data-take="' + q.id + '">接手</button>')) +
          '</div>';
      }).join('');
      return head + '<div class="q-list">' + rows + '</div>' +
        '<div class="ar-note">他们不是在等你救。他们只是没做完就走到下一格了。<br>' +
        '七件都做完，柜台后面会空一会儿——那会儿你能听见没有声音的声音。</div>';
    },
  };

  global.Quests = Quest;
})(window);
