/* ============================================================
   easter.js — 彩蛋 × 融合
   ------------------------------------------------------------
   60 个彩蛋，44 种融合（编号与设计稿 v11 一致：M1、M2、M15—M26）。
   彩蛋不是"收集品"，是"状态"：两个状态撞在一起，世界会变。

   分类沿用设计稿：
     视觉 1—7   叙事/真实事件 8—12   禁忌 13—17
     系统/交互 18—29   致敬 30—50   墨韵 51—55   隐藏 56—60
   ============================================================ */
(function (global) {
  'use strict';

  const LS = 'code_echo_eggs_v1';

  const CAT = { vis: '视觉', real: '旧闻', taboo: '禁忌', sys: '系统', pay: '致敬', ink: '墨韵', hid: '未公开' };

  /* ---------------- 60 个彩蛋 ---------------- */
  const EGGS = [
    /* 视觉类 #1—#7 */
    { id: 1, cat: 'vis', n: '纸人光标', how: '每 30 秒一次 10% 判定', fx: '鼠标变成白纸人 3 秒' },
    { id: 2, cat: 'vis', n: '红绣鞋', how: '点击代码里的注释', fx: '脚边闪过一双红绣鞋' },
    { id: 3, cat: 'vis', n: '倒悬符咒', how: '打开代码透视', fx: '符咒倒读：魂归来兮' },
    { id: 4, cat: 'vis', n: '纸扎 NPC', how: '从特定角度看艾', fx: '他有一瞬是纸扎的' },
    { id: 5, cat: 'vis', n: '三炷香', how: 'Loading 界面', fx: '加载条上浮起三炷燃着的香' },
    { id: 6, cat: 'vis', n: '腐坏物品', how: '打开道具栏', fx: '有件东西开始发黑腐烂' },
    { id: 7, cat: 'vis', n: '倒映异变', how: '面对镜子', fx: '倒影慢半拍，然后笑了一下' },
    /* 叙事 / 真实事件 #8—#12 */
    { id: 8, cat: 'real', n: '林家宅', how: '抵押含 1956 的记忆', fx: '代码库 lin_37_1956 亮起' },
    { id: 9, cat: 'real', n: '黄延秋', how: '抵押含 1977 的记忆', fx: '名单里多出「高登民」' },
    { id: 10, cat: 'real', n: '375 路', how: '抵押含 375 的记忆', fx: '数据包：下一站不存在' },
    { id: 11, cat: 'real', n: '迪亚特洛夫', how: '抵押含 1959 的记忆', fx: '谜题《死山》解冻' },
    { id: 12, cat: 'real', n: '猫脸老太太', how: '抵押含 1996 的记忆', fx: '他半边脸换成了猫脸' },
    /* 禁忌 #13—#17 */
    { id: 13, cat: 'taboo', n: '不可直视', how: '盯着一个模糊节点五秒', fx: '暗红从屏幕边缘渗出来' },
    { id: 14, cat: 'taboo', n: '不可应答', how: '深夜点下那个确认弹窗', fx: '有人替你应了声' },
    { id: 15, cat: 'taboo', n: '不可回头', how: '在长廊里原路返回', fx: '鬼打墙：又回到同一处' },
    { id: 16, cat: 'taboo', n: '不可收礼', how: '收下纸扎 NPC 的礼物', fx: '道具变成纸扎样式' },
    { id: 17, cat: 'taboo', n: '不可照镜', how: '子时（23—01 时）面对镜子', fx: '倒影比你慢半拍' },
    /* 系统 / 交互 #18—#29 */
    { id: 18, cat: 'sys', n: 'GM 消息', how: '按下 F2', fx: '浮动系统警告：检测到开发者' },
    { id: 19, cat: 'sys', n: '角色面板', how: '在控制室查看自己', fx: '「地球 online」属性表' },
    { id: 20, cat: 'sys', n: '玩家手册', how: '典当行角落里那本册子', fx: '完整的《玩家手册》' },
    { id: 21, cat: 'sys', n: '空档案盒', how: '档案盒区域', fx: '盒底写上了你的名字' },
    { id: 22, cat: 'sys', n: '39', how: '输入任意数字', fx: '不是 37，也不是 42' },
    { id: 23, cat: 'sys', n: '42', how: '输入 42', fx: '生命、宇宙及一切的答案' },
    { id: 24, cat: 'sys', n: '404', how: '访问不存在的路径', fx: '自定义 404' },
    { id: 25, cat: 'sys', n: '2048', how: '在代码编辑器里运行', fx: '开一局 2048' },
    { id: 26, cat: 'sys', n: '轮回', how: '连续抵押同一段记忆三次', fx: '系统：你在重复自己' },
    { id: 27, cat: 'sys', n: '静默', how: '深夜输入空白记忆', fx: '它沉默了十秒' },
    { id: 28, cat: 'sys', n: '镜像', how: '在透视里转满 360 度', fx: '多出一个「镜子」节点' },
    { id: 29, cat: 'sys', n: '断网', how: '断开网络后抵押记忆', fx: '无法连接服务器' },
    /* 致敬 #30—#50 */
    { id: 30, cat: 'pay', n: '信奥生', how: '代码里含 STL', fx: '「信奥生？继续。」' },
    { id: 31, cat: 'pay', n: '锈湖', how: '点那个黑色方块十次', fx: '黑方块闪了一下' },
    { id: 32, cat: 'pay', n: '尼尔', how: '选择「失败」且不重启', fx: '你成为了别人的存档' },
    { id: 33, cat: 'pay', n: '史丹利', how: '什么都不做五分钟', fx: '「史丹利都没你耐心」' },
    { id: 34, cat: 'pay', n: '黑客帝国', how: '输入 follow_the_white_rabbit', fx: '代码雨十秒' },
    { id: 35, cat: 'pay', n: '千禧梦', how: '在里空间站满一分钟', fx: '梦核式的模糊影像' },
    { id: 36, cat: 'pay', n: '底特律', how: '十秒内切换十次选项', fx: '「你在测试我吗？」' },
    { id: 37, cat: 'pay', n: '纪念碑谷', how: '在里空间旋转视角三次', fx: '不可能物体的楼梯' },
    { id: 38, cat: 'pay', n: '闪灵', how: '输入 redrum', fx: '闪红，字倒着写' },
    { id: 39, cat: 'pay', n: '1984', how: '点击 BigBrother 节点', fx: '老大哥在看着你' },
    { id: 40, cat: 'pay', n: '银翼杀手', how: '持续游玩两小时', fx: '「你像复制人」' },
    { id: 41, cat: 'pay', n: '三体', how: '运行 dark_forest()', fx: '黑暗森林法则已启用' },
    { id: 42, cat: 'pay', n: 'EVA', how: '输入 人类补完计划', fx: '橙色的 LCL 漫上来' },
    { id: 43, cat: 'pay', n: '弹幕', how: '按 B 键', fx: '前方高能' },
    { id: 44, cat: 'pay', n: '打卡', how: '连续七天登录', fx: '连续 7 天登录' },
    { id: 45, cat: 'pay', n: '结局党', how: '通关后立刻重开', fx: '「还有 11 个在等你」' },
    { id: 46, cat: 'pay', n: '云玩家', how: '三十分钟不输入记忆', fx: '「云玩家也是玩家」' },
    { id: 47, cat: 'pay', n: '37 的诅咒', how: '收满 35 个后输入 37', fx: '「最后 2 个在你心里」' },
    { id: 48, cat: 'pay', n: '代码中的代码', how: '运行含 debugger 的代码', fx: '断点，与一行隐藏注释' },
    { id: 49, cat: 'pay', n: '镜像中的镜像', how: '里空间的镜子 + 代码透视', fx: '无限递归' },
    { id: 50, cat: 'pay', n: 'GM 的面孔', how: '集齐全部 37 个彩蛋', fx: '隐藏结局的一道门' },
    /* 墨韵 #51—#55 */
    { id: 51, cat: 'ink', n: '卷轴回响', how: '在墨韵终端输入「墨韵」', fx: '一首没写完的古诗' },
    { id: 52, cat: 'ink', n: '密钥同频', how: '真名印记与他人对上', fx: '「同频」提示' },
    { id: 53, cat: 'ink', n: '古法显影', how: '用古法五层解开一条密文', fx: '开发者手记' },
    { id: 54, cat: 'ink', n: '卷轴之魂', how: '八种写法各用一次', fx: '「墨韵大师」' },
    { id: 55, cat: 'ink', n: '墨韵之核', how: '用真名印记解终极密文', fx: '隐藏对话' },
    /* 隐藏 #56—#60 */
    { id: 56, cat: 'hid', n: '（未公开）', how: '隐藏', fx: '——', hidden: true },
    { id: 57, cat: 'hid', n: '（未公开）', how: '隐藏', fx: '——', hidden: true },
    { id: 58, cat: 'hid', n: '（未公开）', how: '隐藏', fx: '——', hidden: true },
    { id: 59, cat: 'hid', n: '（未公开）', how: '隐藏', fx: '——', hidden: true },
    { id: 60, cat: 'hid', n: '（未公开）', how: '隐藏', fx: '供社区发现' , hidden: true },
  ];

  /* ---------------- 44 种融合 ----------------
     M1、M2、M15—M26 的名称与组合照设计稿；M3—M14、M27—M44 为补齐。
     needF 指"先成形另一个融合"，用于 M20 / M22 / M44。          */
  const FUSIONS = [
    { id: 'M1', n: '纸人穿红鞋', need: [1, 2], eff: '纸人光标变成红的' },
    { id: 'M2', n: '镜中纸人', need: [1, 7], eff: '镜子里的纸人是你' },
    { id: 'M3', n: '符咒落地', need: [3, 16], eff: '纸扎的符开始往下掉' },
    { id: 'M4', n: '香火照影', need: [5, 7], eff: '香的火光里多出一个影子' },
    { id: 'M5', n: '旧闻三则', need: [8, 9, 10], eff: '墙上多出三张旧报纸' },
    { id: 'M6', n: '死山回声', need: [11, 12], eff: '山里有回声，喊的是你的名字' },
    { id: 'M7', n: '空盒有字', need: [21, 22], eff: '空盒内壁写满了 39' },
    { id: 'M8', n: '答案之书', need: [22, 23], eff: '39 与 42 之间空了一格' },
    { id: 'M9', n: '断线的神', need: [24, 29], eff: '404 页面上有了神像' },
    { id: 'M10', n: '纸的重量', need: [2, 6], eff: '背包里最轻的东西最沉' },
    { id: 'M11', n: '十秒的沉默', need: [27, 33], eff: '沉默被拉长成十分钟' },
    { id: 'M12', n: '客人的名字', need: [20, 21], eff: '手册最后一页写着你' },
    { id: 'M13', n: '香与镜', need: [5, 17], eff: '香灰落进镜面里' },
    { id: 'M14', n: '指认', need: [13, 39], eff: '节点开始回看你' },
    { id: 'M15', n: '纸人嫁衣', need: [1, 2, 4], eff: '纸人系全部激活' },
    { id: 'M16', n: '三重禁忌', need: [13, 14, 15], eff: '暗红滤镜；对话倒放' },
    { id: 'M17', n: '五重禁忌', need: [13, 14, 15, 16, 17], eff: '里空间永久开启' },
    { id: 'M18', n: '中国都市传说', need: [8, 9, 10, 11, 12], eff: '五张旧报纸的展厅' },
    { id: 'M19', n: '游戏历史展厅', need: [31, 32, 33, 34, 35, 36, 37], eff: '一分钟的旧游戏片段' },
    { id: 'M20', n: '禁忌之书', need: [13, 14, 15, 16, 17], needF: ['M16', 'M17'], eff: '一本没有封面的书出现' },
    { id: 'M21', n: '回响之舞', need: [1, 2, 4, 7], eff: '四个残影同时出现' },
    { id: 'M22', n: '禁忌之夜', need: [13, 14, 15, 16, 17], needF: ['M20'], eff: '永久禁忌模式' },
    { id: 'M23', n: '地球 online 崩溃', need: [18, 19, 20, 26, 27, 29], eff: '无法连接服务器' },
    { id: 'M24', n: 'GM 的办公室', need: [30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43], eff: '门后是一间办公室' },
    { id: 'M25', n: '墨韵之魂', need: [51, 52, 53, 54, 55], eff: '墨韵终端全面升级' },
    { id: 'M26', n: '回响之核', need: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59, 60], eff: '所有记忆汇聚' },
    { id: 'M27', n: '复制人的雨', need: [40, 19], eff: '窗外开始下雨' },
    { id: 'M28', n: '第四面墙的砖', need: [14, 43], eff: '弹幕开始评论你' },
    { id: 'M29', n: '被看见的人', need: [19, 39], eff: '属性表多出一行「被观察」' },
    { id: 'M30', n: '结局之外', need: [32, 45], eff: '结局列表末尾多出一格' },
    { id: 'M31', n: '七日的第七日', need: [44, 17], eff: '黄历翻到空白的一页' },
    { id: 'M32', n: '重复的证明', need: [26, 47], eff: '37 与 36 叠在一起' },
    { id: 'M33', n: '耐心的人', need: [33, 40], eff: '「你比史丹利耐心」' },
    { id: 'M34', n: '橙色的海', need: [42, 34], eff: '代码雨变成橙色' },
    { id: 'M35', n: '红色的房间', need: [38, 39], eff: '所有文字倒写三秒' },
    { id: 'M36', n: '编码者的名字', need: [30, 48], eff: '注释里留下了署名' },
    { id: 'M37', n: '隐藏的隐藏', need: [56, 57], eff: '两个「未公开」对上了' },
    { id: 'M38', n: '游戏的游戏', need: [25, 31, 37], eff: '2048 的方块变成墙' },
    { id: 'M39', n: '递归之镜', need: [28, 49], eff: '镜子套镜子，没有底' },
    { id: 'M40', n: '墨与血', need: [53, 13], eff: '朱砂渗进宣纸' },
    { id: 'M41', n: '全部的眼睛', need: [1, 4, 7, 13, 19, 39, 43], eff: '所有能看你的东西一起看' },
    { id: 'M42', n: '第五卷之后', need: [3, 51, 54], eff: '卷轴背面浮出第五卷' },
    { id: 'M43', n: '最后一位客人', need: [21, 26, 50, 55], eff: '「你是第 36 位，也是第 37 位。」' },
    { id: 'M44', n: '回响之后', need: [50, 55], needF: ['M26'], eff: '关掉游戏，它还在跑' },
  ];

  /* 等级按"需要的彩蛋数"定，设计稿：2-3 / 4-6 / 7-10 / 11-15 / 16+ */
  const lvOf = (n) => (n >= 16 ? 5 : n >= 11 ? 4 : n >= 7 ? 3 : n >= 4 ? 2 : 1);
  const LEVEL_NAME = { 1: '微融合 F1', 2: '中融合 F2', 3: '大融合 F3', 4: '超级融合 F4', 5: '终极融合 F5' };

  /* ---------------- 引擎 ---------------- */
  const Eggs = {
    eggs: EGGS,
    fusions: FUSIONS,
    unlocked: {},
    fused: {},
    started: 0,
    lastVerify: Date.now(),

    load() {
      try {
        const o = JSON.parse(localStorage.getItem(LS) || '{}');
        this.unlocked = o.unlocked || {};
        this.fused = o.fused || {};
        this.lastVerify = o.lastVerify || Date.now();
      } catch (e) { this.unlocked = {}; this.fused = {}; }
      this.started = Date.now();
      return this.unlocked;
    },

    save() {
      try {
        localStorage.setItem(LS, JSON.stringify({
          unlocked: this.unlocked, fused: this.fused, lastVerify: this.lastVerify,
        }));
      } catch (e) {}
    },

    count() { return Object.keys(this.unlocked).length; },
    total() { return EGGS.length; },
    fusionCount() { return Object.keys(this.fused).length; },
    totalFusion() { return FUSIONS.length; },
    has(id) { return !!this.unlocked[id]; },
    egg(id) { return EGGS.find((x) => x.id === +id); },
    byCat(cat) { return EGGS.filter((e) => e.cat === cat); },

    /* 解锁一个彩蛋 */
    unlock(id, quiet) {
      id = +id;
      const e = this.egg(id);
      if (!e || this.unlocked[id]) return false;
      this.unlocked[id] = Date.now();
      this.save();
      if (global.TrueName) global.TrueName.bump('egg', 1);
      this.fx(id);
      if (!quiet) {
        const g = global.G;
        if (g) {
          if (g.Ach) g.Ach.show('彩蛋 ' + id + '：' + e.n, e.fx);
          else g.Toast.show('彩蛋 ' + id + '：' + e.n, 2400);
        }
      }
      this.checkFusions();
      this.checkMilestones();
      document.dispatchEvent(new CustomEvent('eggUnlocked', { detail: e }));
      return true;
    },

    /* 批量扫描文本里的真实事件年份 */
    scanText(text) {
      const t = String(text || '');
      const map = [[8, /1956|林家|灭门/], [9, /1977|黄延秋|高登民/], [10, /375|末班/],
        [11, /1959|迪亚特洛夫|死山/], [12, /1996|猫脸/]];
      map.forEach(([id, re]) => { if (re.test(t)) this.unlock(id, true); });
    },

    /* 里程碑：37 个 → 50 号 */
    checkMilestones() {
      if (this.count() >= 37 && !this.unlocked[50]) this.unlock(50);
    },

    /* 融合判定：need 全是彩蛋；needF 指先成形的前置融合 */
    checkFusions() {
      FUSIONS.forEach((f) => {
        if (this.fused[f.id]) return;
        const okEgg = f.need.every((id) => this.unlocked[id]);
        const okFus = (f.needF || []).every((id) => this.fused[id]);
        if (okEgg && okFus) {
          this.fused[f.id] = Date.now();
          this.save();
          const lv = lvOf(f.need.length);
          const g = global.G;
          if (g) {
            if (g.Ach) g.Ach.show(LEVEL_NAME[lv] + ' · ' + f.n, f.eff);
            else g.Toast.show('融合：' + f.n, 2600);
          }
          this.fxFusion(f, lv);
          document.dispatchEvent(new CustomEvent('fusionUnlocked', { detail: f }));
        }
      });
    },

    /* ---------------- 具体效果 ---------------- */
    fx(id) {
      const b = document.body;
      if (!b) return;
      const cls = 'egg-fx-' + id;
      const once = (ms) => {
        b.classList.add(cls);
        setTimeout(() => b.classList.remove(cls), ms || 2600);
      };
      switch (id) {
        case 1: once(3000); break;
        case 2: once(2600); break;
        case 3: once(4200); break;
        case 4: once(2000); break;
        case 5: once(4000); break;
        case 6: once(3000); break;
        case 7: case 17: once(4000); break;
        case 8: case 9: case 10: case 11: case 12: once(2600); break;
        case 13: once(5000); break;
        case 14: once(3000); break;
        case 15: once(3000); break;
        case 16: once(3000); break;
        case 19: once(4200); break;
        case 20: once(2000); break;
        case 22: case 23: once(1800); break;
        case 24: once(3000); break;
        case 27: once(10000); break;
        case 28: once(2600); break;
        case 31: once(1400); break;
        case 34: if (global.G && global.G.CodeRain) { try { global.G.CodeRain.start && global.G.CodeRain.start(10); } catch (e) {} } once(10000); break;
        case 35: once(4000); break;
        case 38: once(3000); break;
        case 39: once(4000); break;
        case 42: once(6000); break;
        case 43: this.danmaku(); break;
        case 47: once(2600); break;
        case 49: once(4000); break;
        case 51: once(3600); break;
        case 55: once(4000); break;
        default: break;
      }
    },

    fxFusion(f, lv) {
      const b = document.body;
      if (!b) return;
      b.classList.add('fus-' + f.id);
      if (lv >= 3) {
        b.classList.add('fus-heavy');
        setTimeout(() => b.classList.remove('fus-heavy'), 6000);
      }
      // 大融合起，连融合等级也写进 body，样式按级挂
      b.setAttribute('data-fus-lv', String(lv));
    },

    danmaku() {
      const box = document.getElementById('danmaku');
      if (!box) return;
      const words = ['前方高能', '这里有人吗', '第 36 个', '别回头', '我也卡在这里了', '别删那个节点',
        '他看你了', '37 在哪', '这是第几周目', '存档呢', '别信他'];
      for (let i = 0; i < 12; i++) {
        setTimeout(() => {
          const d = document.createElement('div');
          d.className = 'dm-item';
          d.textContent = words[Math.floor(Math.random() * words.length)];
          d.style.top = (6 + Math.random() * 80) + '%';
          d.style.animationDuration = (6 + Math.random() * 5) + 's';
          box.appendChild(d);
          setTimeout(() => d.remove(), 12000);
        }, i * 320);
      }
      box.classList.add('on');
      setTimeout(() => box.classList.remove('on'), 12000);
    },

    /* ---------------- 自动判定 ---------------- */
    boot() {
      this.load();
      const self = this;
      const b = document.body;

      /* 键盘词 */
      let buf = '';
      document.addEventListener('keydown', (e) => {
        if (e.target && /INPUT|TEXTAREA/.test(e.target.tagName)) return;
        if (e.key.length === 1) {
          buf = (buf + e.key.toLowerCase()).slice(-28);
          if (/follow_the_white_rabbit$/.test(buf)) self.unlock(34);
          if (/redrum$/.test(buf)) self.unlock(38);
          if (/(^|\D)42$/.test(buf)) self.unlock(23);
          if (/(^|\D)39$/.test(buf)) self.unlock(22);
          if (/(^|\D)37$/.test(buf)) { if (self.count() >= 35) self.unlock(47); }
          if (/(^|\D)2048$/.test(buf)) self.unlock(25);
          if (/dark_forest$/.test(buf)) self.unlock(41);
          if (/moyun$|墨韵/.test(buf)) self.unlock(51);
        }
        if (e.key === 'b' || e.key === 'B') self.unlock(43);
      });

      /* 时间类 */
      setInterval(() => {
        if (Math.random() < 0.1) self.unlock(1, true);          // #1 纸人光标
        const h = new Date().getHours();
        // #17 不可照镜：子时，且确实"面对过镜子"
        const S0 = global.State;
        if ((h === 23 || h === 0 || h === 1) && S0 && S0.sys && (S0.sys.perspOpened || 0) > 0) self.unlock(17, true);
        if (navigator.onLine === false) self.unlock(29, true);     // #29 断网
        if (Date.now() - self.started > 2 * 3600 * 1000) self.unlock(40, true); // #40 两小时
        if (Date.now() - self.lastVerify > 30 * 60 * 1000) self.unlock(46, true); // #46 云玩家
        if (Date.now() - (self._lastAct || self.started) > 5 * 60 * 1000) self.unlock(33, true); // #33 史丹利
        const S = global.State;
        if (S && S.sys && (S.sys.relics || 0) >= 4) self.unlock(6, true); // #6 腐坏物品
      }, 20000);

      ['pointerdown', 'keydown', 'wheel'].forEach((ev) => {
        document.addEventListener(ev, () => { self._lastAct = Date.now(); }, true);
      });

      /* 连续七天 */
      try {
        const days = JSON.parse(localStorage.getItem('code_echo_days') || '[]');
        const today = new Date().toDateString();
        if (days.indexOf(today) < 0) days.push(today);
        localStorage.setItem('code_echo_days', JSON.stringify(days.slice(-40)));
        if (days.length >= 7) setTimeout(() => self.unlock(44, true), 1200);
      } catch (e) {}

      /* #31 锈湖：点黑色方块十次（大厅那块黑，或标题） */
      let boxClicks = 0;
      document.addEventListener('click', (e) => {
        if (e.target.closest('#hall-black, .hall-title')) {
          boxClicks++;
          if (boxClicks >= 10) self.unlock(31);
        }
      });

      /* #2 红绣鞋：点代码里的注释 */
      document.addEventListener('click', (e) => {
        if (e.target.closest('.cmt, .code-cmt, [data-egg="cmt"], .dev-line .c')) self.unlock(2);
      });

      /* #36 底特律：十秒内十次选项 */
      let choiceClicks = 0, choiceT0 = 0;
      document.addEventListener('click', (e) => {
        if (!e.target.closest('.dlg-choice')) return;
        const now = Date.now();
        if (now - choiceT0 > 10000) { choiceClicks = 0; choiceT0 = now; }
        choiceClicks++;
        if (choiceClicks >= 10) self.unlock(36);
      });

      /* 三炷香：序章加载 */
      document.addEventListener('ch0loading', () => self.unlock(5, true));
      /* 纸扎 NPC：与艾谈满三轮 */
      document.addEventListener('eteTalked', (e) => { if ((e.detail || 0) >= 3) self.unlock(4, true); });
      /* 终端 */
      document.addEventListener('devOpened', () => self.unlock(18, true));
      document.addEventListener('devCmd', (e) => { if ((e.detail || 0) >= 3) self.unlock(20, true); });
      /* 36 号 / 档案盒 */
      document.addEventListener('recordFound', (e) => {
        const d = e.detail;
        self.unlock(21, true);
        if (d && +d === 22) self.unlock(22, true);
      });
      /* 玩家手册 */
      document.addEventListener('manualOpen', () => self.unlock(20));
      /* 记忆重复 / 空白 */
      document.addEventListener('memoryRepeat', () => self.unlock(26, true));
      document.addEventListener('memoryEmpty', () => {
        const h = new Date().getHours();
        if (h >= 23 || h <= 5) self.unlock(27, true);
      });
      /* 墨韵 */
      document.addEventListener('moyunAlgs', (e) => {
        const used = e.detail || [];
        if (used.indexOf('ancient') >= 0) self.unlock(53, true);
        if (used.length >= 8) self.unlock(54, true);
      });
      document.addEventListener('cipherFinal', () => self.unlock(55, true));
      document.addEventListener('moyunSolved', () => {
        // #52 密钥同频：真名印记里出现 37
        try {
          const k = global.TrueName && global.TrueName.key('sigil');
          if (k && /37/.test(k)) self.unlock(52, true);
        } catch (e) {}
      });
      /* 透视 */
      document.addEventListener('perspOpen', (e) => {
        const n = e.detail || {};
        self.unlock(3, true);
        if (n.layer) self.unlock(49, true);
      });
      document.addEventListener('perspNode', (e) => {
        const id = e.detail;
        if (id === 'player' || id === 'gm') self.unlock(19, true);
        if (id === 'bigbrother') self.unlock(39, true);
        if (id === 'mirror') self.unlock(7, true);
      });
      document.addEventListener('perspStare', () => self.unlock(13, true));
      document.addEventListener('perspRotate', (e) => {
        const n = e.detail || 0;
        if (n >= 2) self.unlock(37, true);
        if (n >= 4) self.unlock(28, true);   // 转满 360 度
      });
      /* 编辑器 */
      document.addEventListener('codeRun', (e) => {
        const d = e.detail || {};
        const c = String(d.code || d);
        if (/#include|std::|vector</.test(c)) self.unlock(30, true);
        if (/2048/.test(c)) self.unlock(25, true);
        if (/debugger/.test(c)) self.unlock(48, true);
        if (/dark_forest/.test(c)) self.unlock(41, true);
        if (/人类补完计划/.test(c)) self.unlock(42, true);
      });
      /* 结局 / 重开 */
      document.addEventListener('endingReached', () => self.unlock(32, true));
      document.addEventListener('restart', () => self.unlock(45, true));
      /* 里空间停留 */
      self._layerT0 = 0;
      setInterval(() => {
        const onLayer = b.classList.contains('in-layer');
        if (onLayer && !self._layerT0) self._layerT0 = Date.now();
        if (!onLayer) self._layerT0 = 0;
        if (self._layerT0 && Date.now() - self._layerT0 > 60000) self.unlock(35, true);
      }, 5000);

      /* 已有的融合，进场时补应用一次 */
      setTimeout(() => {
        Object.keys(this.fused).forEach((k) => {
          b.classList.add('fus-' + k);
          const f = FUSIONS.find((x) => x.id === k);
          if (f) b.setAttribute('data-fus-lv', String(lvOf(f.need.length)));
        });
      }, 400);

      this.save();
    },

    /* ---------------- 给档案册用的列表 ---------------- */
    listHTML() {
      return Object.keys(CAT).map((cat) => {
        const rows = this.byCat(cat).map((e) => {
          const on = !!this.unlocked[e.id];
          const hide = e.hidden && !on;
          return '<div class="eg-row ' + (on ? 'on' : '') + '">' +
            '<span class="eg-no">' + String(e.id).padStart(2, '0') + '</span>' +
            '<span class="eg-n">' + (hide ? '？？？' : e.n) + '</span>' +
            '<span class="eg-how">' + (hide ? '隐藏' : e.how) + '</span>' +
            '<span class="eg-fx">' + (on ? e.fx : '') + '</span>' +
            '</div>';
        }).join('');
        return '<div class="eg-cat"><div class="eg-cat-h">' + CAT[cat] +
          ' <i>' + this.byCat(cat).filter((e) => this.unlocked[e.id]).length + '/' + this.byCat(cat).length + '</i></div>' +
          rows + '</div>';
      }).join('');
    },

    fusionHTML() {
      const rows = FUSIONS.map((f) => {
        const on = !!this.fused[f.id];
        const lv = lvOf(f.need.length);
        const needTxt = f.need.map((id) => (this.unlocked[id] ? id : '·')).join(' ') +
          ((f.needF || []).length ? ' ← ' + f.needF.join(' + ') : '');
        return '<div class="fu-row ' + (on ? 'on' : '') + ' fu-lv' + lv + '">' +
          '<span class="fu-id">' + f.id + '</span>' +
          '<span class="fu-n">' + (on ? f.n : '未成形') + '</span>' +
          '<span class="fu-need">' + needTxt + '</span>' +
          '<span class="fu-eff">' + (on ? f.eff : '需要 ' + f.need.length + ' 个彩蛋') + '</span>' +
          '</div>';
      }).join('');
      return '<div class="fu-list">' + rows + '</div>';
    },
  };

  global.Eggs = Eggs;
})(window);
