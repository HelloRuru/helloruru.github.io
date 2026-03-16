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
    const rank = Math.round(aioRate * 40 + citeRate * 60);

    this.update({
      total,
      aio: hasAIO,
      cited,
      rate: `${citedRate}%`,
      rank
    });
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
    if (this.elements.rank && data.rank != null) {
      this.elements.rank.textContent = data.rank;
      // 依分數變色
      const card = this.elements.rank.closest('.stat-rank');
      if (card) {
        card.classList.remove('rank-great', 'rank-good', 'rank-fair', 'rank-low');
        if (data.rank >= 60) card.classList.add('rank-great');
        else if (data.rank >= 40) card.classList.add('rank-good');
        else if (data.rank >= 20) card.classList.add('rank-fair');
        else card.classList.add('rank-low');
      }
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
      rank: '--'
    });
  }
};
