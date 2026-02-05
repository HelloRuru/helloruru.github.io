/* ================================================
   AIO View — Results Table Component
   掃描結果表格
   ================================================ */

const ResultsTable = {
  /** 結果資料 */
  results: null,

  /** 目前篩選條件 */
  currentFilter: 'all',

  /** DOM 元素 */
  elements: {
    section: null,
    tbody: null,
    filterBtns: null
  },

  /**
   * 初始化
   */
  init() {
    this.elements.section = document.getElementById('results-section');
    this.elements.tbody = document.getElementById('results-body');
    this.elements.filterBtns = document.querySelectorAll('.filter-btn');

    this.bindEvents();
  },

  /**
   * 綁定事件
   */
  bindEvents() {
    this.elements.filterBtns?.forEach(btn => {
      btn.addEventListener('click', () => {
        this.filter(btn.dataset.filter);
      });
    });
  },

  /**
   * 渲染結果
   * @param {Object} results - 掃描結果
   */
  render(results) {
    this.results = results;

    // 更新統計
    Stats.render(results);

    // 顯示表格
    this.filter('all');

    // 顯示區塊
    this.show();
  },

  /**
   * 篩選結果
   * @param {string} filterType - 篩選類型
   */
  filter(filterType) {
    this.currentFilter = filterType;

    // 更新按鈕狀態
    this.elements.filterBtns?.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filterType);
    });

    if (!this.results?.results) return;

    // 篩選資料
    let filtered = this.results.results;

    switch (filterType) {
      case 'cited':
        filtered = filtered.filter(r => r.isCited);
        break;
      case 'aio-not-cited':
        filtered = filtered.filter(r => r.hasAIO && !r.isCited);
        break;
      case 'no-aio':
        filtered = filtered.filter(r => !r.hasAIO);
        break;
    }

    this.renderTable(filtered);
  },

  /**
   * 渲染表格內容
   * @param {Array} items - 資料項目
   */
  renderTable(items) {
    const { tbody } = this.elements;
    if (!tbody) return;

    tbody.innerHTML = '';

    if (items.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            沒有符合條件的結果
          </td>
        </tr>
      `;
      return;
    }

    items.forEach(item => {
      const tr = this.createRow(item);
      tbody.appendChild(tr);
    });
  },

  /**
   * 建立表格列
   * @param {Object} item - 資料項目
   * @returns {HTMLElement} tr 元素
   */
  createRow(item) {
    const tr = document.createElement('tr');

    const statusBadge = item.hasAIO
      ? '<span class="status-badge yes">有 AIO</span>'
      : '<span class="status-badge no">無</span>';

    const citedBadge = item.hasAIO
      ? (item.isCited
          ? '<span class="status-badge cited">是</span>'
          : '<span class="status-badge no">否</span>')
      : '—';

    tr.innerHTML = `
      <td class="col-title">
        <a href="${Utils.escapeHtml(item.url)}" target="_blank" rel="noopener">
          ${Utils.escapeHtml(item.title || item.url)}
        </a>
      </td>
      <td class="col-query">${Utils.escapeHtml(item.query)}</td>
      <td class="col-status">${statusBadge}</td>
      <td class="col-cited">${citedBadge}</td>
    `;

    return tr;
  },

  /**
   * 匯出 CSV
   */
  exportCsv() {
    if (!this.results?.results) return;

    const headers = ['文章標題', '網址', '搜尋語句', '有 AIO', '被引用', 'AIO 來源'];

    const rows = this.results.results.map(r => [
      r.title || '',
      r.url,
      r.query,
      r.hasAIO ? '是' : '否',
      r.isCited ? '是' : '否',
      (r.aioSources || []).join('; ')
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // UTF-8 BOM for Excel
    const bom = '\uFEFF';
    const filename = `aio-view-${this.results.scanDate || 'export'}.csv`;

    Utils.downloadFile(bom + csv, filename, 'text/csv;charset=utf-8');
  },

  /**
   * 顯示區塊
   */
  show() {
    this.elements.section?.classList.remove('hidden');
  },

  /**
   * 隱藏區塊
   */
  hide() {
    this.elements.section?.classList.add('hidden');
  }
};
