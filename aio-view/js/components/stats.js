/* ================================================
   AIO View — Stats Component
   統計數字卡片
   ================================================ */

const Stats = {
  /** DOM 元素 */
  elements: {
    total: null,
    aio: null,
    cited: null,
    rate: null,
    rank: null
  },

  /**
   * 初始化
   */
  init() {
    this.elements.total = document.getElementById('stat-total');
    this.elements.aio = document.getElementById('stat-aio');
    this.elements.cited = document.getElementById('stat-cited');
    this.elements.rate = document.getElementById('stat-rate');
    this.elements.rank = document.getElementById('stat-rank');
  },

  /**
   * 渲染統計數字
   * @param {Object} results - 掃描結果
   */
  render(results) {
    const items = results.results || [];

    // 以文章為單位統計（同一篇多變體只算一次）
    const articleMap = new Map();
    items.forEach(r => {
      const key = r.articleKey || r.url || r.title;
      if (!articleMap.has(key)) {
        articleMap.set(key, { hasAIO: false, isCited: false });
      }
      const entry = articleMap.get(key);
      if (r.hasAIO === true) entry.hasAIO = true;
      if (r.isCited) entry.isCited = true;
    });

    const total = articleMap.size || results.totalArticles || items.length;
    const hasAIO = Array.from(articleMap.values()).filter(a => a.hasAIO).length;
    const cited = Array.from(articleMap.values()).filter(a => a.isCited).length;
    const citedRate = Utils.percentage(cited, total);

    // AIO 能見度指數（0-100）：綜合 AIO 出現率 + 引用率
    const aioRate = total > 0 ? hasAIO / total : 0;
    const citeRate = total > 0 ? cited / total : 0;
    const score = Math.round(aioRate * 40 + citeRate * 60);
    const grade = this.resolveGrade(score);

    this.update({
      total,
      aio: hasAIO,
      cited,
      rate: `${citedRate}%`,
      score,
      grade
    });
  },

  /** RPG 等級判定 */
  resolveGrade(score) {
    if (score >= 90) return { letter: 'SS', label: '傳說級！AI 搜尋的常客', tier: 'ss' };
    if (score >= 70) return { letter: 'S', label: '菁英！大多數搜尋都看得到你', tier: 's' };
    if (score >= 50) return { letter: 'A', label: '優秀，已經站穩 AIO 版圖', tier: 'a' };
    if (score >= 30) return { letter: 'B', label: '有出現，但還有成長空間', tier: 'b' };
    if (score >= 10) return { letter: 'C', label: '剛起步，需要補更多面向', tier: 'c' };
    return { letter: 'D', label: '尚未被 AI 搜尋收錄', tier: 'd' };
  },

  /**
   * 更新數字
   * @param {Object} data - 數據
   */
  update(data) {
    if (this.elements.total) this.elements.total.textContent = data.total;
    if (this.elements.aio) this.elements.aio.textContent = data.aio;
    if (this.elements.cited) this.elements.cited.textContent = data.cited;
    if (this.elements.rate) this.elements.rate.textContent = data.rate;
    if (this.elements.rank && data.grade) {
      const card = this.elements.rank.closest('.stat-rank');
      if (card) {
        card.classList.remove('rank-ss', 'rank-s', 'rank-a', 'rank-b', 'rank-c', 'rank-d');
        card.classList.add(`rank-${data.grade.tier}`);
      }
      this.elements.rank.innerHTML = `
        <span class="rank-letter">${data.grade.letter}</span>
        <span class="rank-score">${data.score}</span>
      `;
      // 更新說明文字
      const labelEl = this.elements.rank.closest('.stat-card')?.querySelector('.stat-label');
      if (labelEl) labelEl.textContent = data.grade.label;
    }
  },

  /**
   * 重置數字
   */
  reset() {
    this.update({
      total: 0,
      aio: 0,
      cited: 0,
      rate: '0%',
      score: 0,
      grade: { letter: '--', label: 'AIO 能見度', tier: 'd' }
    });
  }
};
