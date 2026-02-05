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
    rate: null
  },

  /**
   * 初始化
   */
  init() {
    this.elements.total = document.getElementById('stat-total');
    this.elements.aio = document.getElementById('stat-aio');
    this.elements.cited = document.getElementById('stat-cited');
    this.elements.rate = document.getElementById('stat-rate');
  },

  /**
   * 渲染統計數字
   * @param {Object} results - 掃描結果
   */
  render(results) {
    const items = results.results || [];

    const total = items.length;
    const hasAIO = items.filter(r => r.hasAIO).length;
    const cited = items.filter(r => r.isCited).length;
    const rate = Utils.percentage(cited, total);

    this.update({
      total,
      aio: hasAIO,
      cited,
      rate: `${rate}%`
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
  },

  /**
   * 重置數字
   */
  reset() {
    this.update({
      total: 0,
      aio: 0,
      cited: 0,
      rate: '0%'
    });
  }
};
