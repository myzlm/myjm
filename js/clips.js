/* ============================================================
   clips.js — 墙上的剪报
   ------------------------------------------------------------
   走廊尽头贴着一张旧报纸。
   同一件事，报纸上说一句，夹缝里有人用铅笔写了另一句。
   两句都是真的。这才是最难受的地方。
   ============================================================ */
(function (global) {
  'use strict';
  const { $, Toast } = global.G;

  // no = 关联的那一位；读了他的东西，这一页才不再是空的
  const CLIPS = [
    {
      no: 1, date: '1987.11.4', page: '第一版',
      head: '关于国营商业服务网点调整的通知',
      body: '全市国营理发、浴池、照相行业将按"留优并劣"原则进行调整，富余职工由本系统统筹安置，不得推向社会。调整期间，各网点应保证正常营业，服务质量不得下降。',
      edge: '阄是我写的。最短那根，我自己抓了。',
      cut: '剪自左下角。背面透出一个"优"字，印得很重。',
    },
    {
      no: 2, date: '1990.9.17', page: '第三版',
      head: '我县夏粮收购进度居全区首位',
      body: '截至九月十五日，全县累计入库粮食逾八千万公斤，超额完成地区下达任务。粮站职工连续奋战四十天，无一人请假，涌现出一批吃苦耐劳的先进典型。',
      edge: '一百斤报九十二。十一年，年年如此。八斤。',
      cut: '剪自右上。边上一道指甲划痕，划了很深。',
    },
    {
      no: 3, date: '1992.6.30', page: '厂报',
      head: '县纺织厂提前完成出口创汇任务',
      body: '细纱车间女职工发扬"比学赶帮超"精神，人均月工时提高百分之十八，产品质量稳中有升。厂党委号召全厂职工向细纱车间学习。',
      edge: '蝉是从哪一年住进来的？现在它们不走了。',
      cut: '不是报纸，是厂报。剪得比正文大出一圈，留着白边。',
    },
    {
      no: 4, date: '1994.8.12', page: '中缝',
      head: '一九九四年度民办教师转正名单公示',
      body: '经县教育局研究，同意下列四十七名同志转为公办教师。公示期七天。如有异议，可于公示期内向人事科书面反映。',
      edge: '最后一个名字上有一道蓝黑墨水，划得很稳，像练过很多遍。',
      cut: '剪自中缝。纸太薄，能看见背面的股票行情。',
    },
    {
      no: 6, date: '1998.4.23', page: '第二版',
      head: '我市再就业工作取得阶段性成果',
      body: '全市建立再就业服务中心一百一十六个，累计安置下岗职工两万三千余人，涌现出一批自强不息、自主创业的先进典型。',
      edge: '那年驾驶证不顶用了。我在车上睡了十一天，没敢下来。',
      cut: '剪自第二版。缺了左下角一块，像被人攥过。',
    },
    {
      no: 7, date: '2000.11.9', page: '第五版',
      head: '我市集中整治互联网上网服务营业场所',
      body: '此次行动重点查处违规接纳未成年人、超时经营等问题，共取缔无证经营场所十一家，行业秩序明显好转，群众反映良好。',
      edge: '四十三。检查的人从后门进来，我从后门把孩子放出去。',
      cut: '剪得很急，边缘是撕的，毛边还挂着纤维。',
    },
    {
      no: 10, date: '2005.7.21', page: '第七版',
      head: '全省乡镇煤矿整顿关闭工作取得阶段性成果',
      body: '全省共关闭不具备安全生产条件的小煤矿一千二百余处，事故起数、死亡人数实现"双下降"，安全生产形势持续稳定好转。',
      edge: '名单上九个。那天下面有十四个。敲了十一下，停了。',
      cut: '剪自第七版。油墨蹭到指头上，洗了二十年没洗掉。',
    },
    {
      no: 13, date: '2010.3.5', page: '经济版',
      head: '我省外向型经济逆势上扬',
      body: '全省加工贸易进出口同比增长百分之三十四点二，用工人数稳中有增，产业转移承接地效应初步显现，为全年目标打下坚实基础。',
      edge: '三千二百次。下班回宿舍，手还在动，按不住。',
      cut: '剪自经济版，四四方方，边上留着裁纸刀的白痕。',
    },
    {
      no: 18, date: '2015.9.28', page: '第五版',
      head: '校园金融服务创新试点在我市启动',
      body: '首批六家平台获准进入，将为学生提供小额、便捷、低门槛的消费信贷服务，助力青年消费升级，激发校园市场活力。',
      edge: '七家。第三家借来还第一家。爆的是我的通讯录。',
      cut: '剪自第五版。纸背面粘着一小片卡片，掰断过，用胶带粘的。',
    },
    {
      no: 25, date: '2021.8.14', page: '头版',
      head: '"双减"政策落地见效 家长满意度明显提升',
      body: '全市压减学科类校外培训机构一千四百余家，课后服务实现义务教育学校全覆盖，学生过重作业负担和校外培训负担有效减轻。',
      edge: '作文本还在麻绳里捆着。有一本的封面上画了一朵歪的花。',
      cut: '剪自头版。标题被剪掉了一半，只剩"见效"两个字。',
    },
    {
      no: 28, date: '2022.10.19', page: '财经版',
      head: '我市数字经济核心产业增加值同比增长百分之十四',
      body: '规模以上互联网和相关服务企业营业收入保持较快增长，从业人员结构持续优化，人才集聚效应显著增强，为全市经济高质量发展提供了有力支撑。',
      edge: '优化。我大概是那个"劣"字。六十七份简历，三个面试。',
      cut: '剪自财经版。边上一道直痕，是裁纸刀走的。',
    },
    {
      no: 31, date: '2024.5.6', page: '第二版',
      head: '"清朗"专项行动持续深入 网络生态明显改善',
      body: '累计清理有害信息逾千万条，处置违规账号数十万个，广大网民特别是未成年人的上网环境得到有效保护，社会反响热烈。',
      edge: '两万个人来骂我。我把七百多条看完了。没有一个认识我。',
      cut: '剪自第二版。日期那一角没了，只剩下半行字。',
    },
  ];

  const Clips = {
    inited: false,
    el: null,

    /* 读了谁，哪一页就不再是空白 */
    openCount() {
      const M = global.Memory;
      if (!M) return 0;
      return CLIPS.filter((c) => M.hasRead(c.no)).length;
    },
    total() { return CLIPS.length; },
    unlocked(c) { return !!(global.Memory && global.Memory.hasRead(c.no)); },

    init() {
      if (this.inited) return;
      this.inited = true;
      const w = document.createElement('div');
      w.className = 'nw-wrap';
      w.id = 'nw-wrap';
      w.innerHTML = '<div class="nw-paper" id="nw-paper"></div>';
      document.body.appendChild(w);
      this.el = w;
      w.addEventListener('click', (e) => { if (e.target === w) this.close(); });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.el && this.el.classList.contains('on')) this.close();
      });
    },

    open() {
      this.init();
      this.render();
      this.el.classList.add('on');
      if (global.Snd) { try { global.Snd.noise(0.28, { type: 'highpass', freq: 2400, gain: 0.05 }); } catch (e) {} }
    },
    close() { if (this.el) this.el.classList.remove('on'); },

    render() {
      const n = this.openCount();
      const S = global.State;
      const s = (S && S.sys) || {};
      const all = n >= CLIPS.length;

      let h = '<div class="nw-mast">本　市　日　报</div>' +
        '<div class="nw-rule"></div>' +
        '<div class="nw-meta"><span>剪报 · 贴在走廊尽头</span>' +
        '<span>可读 ' + n + ' / ' + CLIPS.length + '</span></div>' +
        '<button class="nw-close" id="nw-close">合上</button>' +
        '<div class="nw-list">';

      CLIPS.forEach((c) => {
        const on = this.unlocked(c);
        if (!on) {
          h += '<div class="nw-item off"><div class="nw-date">' + c.date + '　' + c.page + '</div>' +
            '<div class="nw-void">（这一页被剪走了。剩下的是一块方形的白，比纸还白。）</div></div>';
          return;
        }
        h += '<div class="nw-item"><div class="nw-date">' + c.date + '　' + c.page + '</div>' +
          '<div class="nw-head">' + c.head + '</div>' +
          '<div class="nw-body">' + c.body + '</div>' +
          '<div class="nw-edge">' + c.edge + '</div>' +
          '<div class="nw-cut">' + c.cut + '</div></div>';
      });
      h += '</div>';

      h += '<div class="nw-foot">' + (all
        ? '十二页都齐了。\n你把它们按年份摞好，发现一件事：报纸从来没有说谎。\n它只是从来没有说完。'
        : '你读过几个人，就有几页能看清。\n剩下的不是被撕掉的——是你还没走到那一年。') + '</div>';

      const p = $('#nw-paper');
      if (!p) return;
      p.innerHTML = h;
      const x = $('#nw-close');
      if (x) x.onclick = () => this.close();

      // 第一次全部读完
      if (all && s && !s.clipped) {
        s.clipped = true;
        s.pendingTalk = 'ai_clip';
        Toast.show('十二页都齐了。', 2400);
      }
    },

    /* 给对局用的题：报纸登的年份 / 夹缝里那一行 */
    pick(openAll) {
      const pool = openAll ? CLIPS.slice() : CLIPS.filter((c) => this.unlocked(c));
      if (pool.length < 3) return null;
      const c = pool[Math.floor(Math.random() * pool.length)];
      const shuffle = (a) => a.sort(() => Math.random() - 0.5);
      if (Math.random() < 0.45) {
        const ans = c.date.slice(0, 4);
        const others = CLIPS.filter((x) => x !== c).map((x) => x.date.slice(0, 4))
          .filter((v, i, a) => a.indexOf(v) === i && v !== ans);
        return {
          q: '这条登在报纸上：\n「' + c.head + '」\n是哪一年？',
          ans: ans,
          opts: shuffle([ans].concat(shuffle(others).slice(0, 3))),
          tag: '剪报',
        };
      }
      const ans2 = c.edge;
      const others2 = shuffle(CLIPS.filter((x) => x !== c).map((x) => x.edge)).slice(0, 3);
      return {
        q: '这一页的夹缝里，铅笔写的是哪一句？',
        ans: ans2,
        opts: shuffle([ans2].concat(others2)),
        tag: '剪报 · ' + c.date,
      };
    },
  };

  global.CLIPS = CLIPS;
  global.Clips = Clips;
})(window);
