/* ================================================
   AIO View — Results Table Component
   掃描結果表格（按文章分組）
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
    Stats.render(results);
    this.filter('all');
    this.show();
  },

  /**
   * 按文章 URL 分組
   * @param {Array} items - 原始掃描結果
   * @returns {Array} 分組後的文章陣列
   */
  groupByArticle(items) {
    const map = new Map();

    items.forEach(item => {
      const key = item.url || item.title;
      if (!map.has(key)) {
        map.set(key, {
          title: item.title,
          url: item.url,
          queries: []
        });
      }
      map.get(key).queries.push({
        query: item.query,
        hasAIO: item.hasAIO,
        isCited: item.isCited,
        scanStatus: item.scanStatus,
        aioSources: item.aioSources || []
      });
    });

    return Array.from(map.values());
  },

  /**
   * 篩選結果
   * @param {string} filterType - 篩選類型
   */
  filter(filterType) {
    this.currentFilter = filterType;

    this.elements.filterBtns?.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filterType);
    });

    if (!this.results?.results) return;

    const grouped = this.groupByArticle(this.results.results);

    let filtered;
    switch (filterType) {
      case 'cited':
        filtered = grouped.filter(g => g.queries.some(q => q.isCited));
        break;
      case 'aio-not-cited':
        filtered = grouped.filter(g =>
          g.queries.some(q => q.hasAIO === true) && !g.queries.some(q => q.isCited)
        );
        break;
      case 'no-aio':
        filtered = grouped.filter(g => g.queries.every(q => q.hasAIO === false));
        break;
      default:
        filtered = grouped;
    }

    this.renderTable(filtered);
  },

  /**
   * 渲染表格內容
   * @param {Array} groups - 分組後的文章
   */
  renderTable(groups) {
    const { tbody } = this.elements;
    if (!tbody) return;

    tbody.innerHTML = '';

    if (groups.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="4" class="empty-state">
            沒有符合條件的結果
          </td>
        </tr>
      `;
      return;
    }

    groups.forEach(group => {
      const tr = this.createGroupRow(group);
      tbody.appendChild(tr);
    });
  },

  /**
   * 建立分組列
   * @param {Object} group - 文章分組
   * @returns {HTMLElement}
   */
  createGroupRow(group) {
    const tr = document.createElement('tr');
    const total = group.queries.length;
    const aioCount = group.queries.filter(q => q.hasAIO === true).length;
    const citedCount = group.queries.filter(q => q.isCited).length;
    const noAio = aioCount === 0;

    // AIO 統計
    const aioText = noAio
      ? '<span class="status-badge no-aio-alert">無 AIO</span>'
      : `<span class="status-badge yes">${aioCount}/${total}</span>`;

    // 引用統計
    const citedText = noAio
      ? '—'
      : citedCount > 0
        ? `<span class="status-badge cited">${citedCount}/${total}</span>`
        : `<span class="status-badge no">0/${total}</span>`;

    // 搜尋語句列表（每個語句標示狀態）
    const queryChips = group.queries.map(q => {
      let cls = 'query-chip';
      if (q.scanStatus === 'timeout') cls += ' query-chip-timeout';
      else if (q.isCited) cls += ' query-chip-cited';
      else if (q.hasAIO) cls += ' query-chip-aio';
      else cls += ' query-chip-none';
      return `<span class="${cls}">${Utils.escapeHtml(q.query)}</span>`;
    }).join('');

    if (noAio) tr.classList.add('row-no-aio');

    tr.innerHTML = `
      <td class="col-title">
        <a href="${Utils.escapeHtml(group.url)}" target="_blank" rel="noopener">
          ${Utils.escapeHtml(group.title || group.url)}
        </a>
      </td>
      <td class="col-status">${aioText}</td>
      <td class="col-cited">${citedText}</td>
      <td class="col-queries"><div class="query-chips">${queryChips}</div></td>
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
      r.scanStatus === 'timeout' ? '未回傳' : (r.hasAIO ? '是' : '否'),
      r.isCited ? '是' : '否',
      (r.aioSources || []).join('; ')
    ]);

    const csv = [headers, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const bom = '\uFEFF';
    const filename = `aio-view-${this.results.scanDate || 'export'}.csv`;

    Utils.downloadFile(bom + csv, filename, 'text/csv;charset=utf-8');
  },

  show() {
    this.elements.section?.classList.remove('hidden');
  },

  hide() {
    this.elements.section?.classList.add('hidden');
  }
};
