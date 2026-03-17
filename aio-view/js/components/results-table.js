/* ================================================
   AIO View — Results Table Component
   掃描結果卡片（按文章分組）
   ================================================ */

const ResultsTable = {
  results: null,
  currentFilter: 'all',

  elements: {
    section: null,
    container: null,
    filterBtns: null
  },

  init() {
    this.elements.section = document.getElementById('results-section');
    this.elements.container = document.getElementById('results-body');
    this.elements.filterBtns = document.querySelectorAll('.filter-btn');
    this.bindEvents();
  },

  bindEvents() {
    this.elements.filterBtns?.forEach(btn => {
      btn.addEventListener('click', () => this.filter(btn.dataset.filter));
    });
  },

  render(results) {
    this.results = results;
    Stats.render(results);
    this.filter('all');
    this.show();
  },

  /** 按文章 URL 分組 */
  groupByArticle(items) {
    const map = new Map();
    items.forEach(item => {
      const key = item.url || item.title;
      if (!map.has(key)) {
        map.set(key, { title: item.title, url: item.url, queries: [] });
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

  /** 排序：沒 AIO 排最前，有 AIO 未引用次之，被引用最後 */
  sortGroups(groups) {
    return groups.sort((a, b) => {
      const scoreA = this.groupScore(a);
      const scoreB = this.groupScore(b);
      return scoreA - scoreB;
    });
  },

  groupScore(group) {
    const hasCited = group.queries.some(q => q.isCited);
    const hasAIO = group.queries.some(q => q.hasAIO === true);
    if (!hasAIO) return 0;       // 沒 AIO → 最前面
    if (!hasCited) return 1;     // 有 AIO 沒引用 → 中間
    return 2;                     // 被引用 → 最後
  },

  filter(filterType) {
    this.currentFilter = filterType;

    this.elements.filterBtns?.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filterType);
    });

    if (!this.results?.results) return;

    let grouped = this.groupByArticle(this.results.results);

    switch (filterType) {
      case 'cited':
        grouped = grouped.filter(g => g.queries.some(q => q.isCited));
        break;
      case 'aio-not-cited':
        grouped = grouped.filter(g =>
          g.queries.some(q => q.hasAIO === true) && !g.queries.some(q => q.isCited)
        );
        break;
      case 'no-aio':
        grouped = grouped.filter(g => g.queries.every(q => q.hasAIO === false));
        break;
    }

    this.renderCards(this.sortGroups(grouped));
  },

  renderCards(groups) {
    const { container } = this.elements;
    if (!container) return;

    // 把 tbody 當成一般容器用（改用 div 渲染）
    const wrapper = container.closest('.table-wrapper') || container.parentElement;

    // 清除舊的卡片容器
    let cardContainer = wrapper.querySelector('.results-cards');
    if (!cardContainer) {
      cardContainer = document.createElement('div');
      cardContainer.className = 'results-cards';
      // 隱藏原本的 table
      const table = wrapper.querySelector('table');
      if (table) table.style.display = 'none';
      wrapper.appendChild(cardContainer);
    }

    if (groups.length === 0) {
      cardContainer.innerHTML = '<div class="empty-state">沒有符合條件的結果</div>';
      return;
    }

    cardContainer.innerHTML = groups.map((group, i) => this.createCard(group, i)).join('');

    // 點擊標題列展開/收合
    cardContainer.querySelectorAll('.rc-header').forEach(header => {
      header.style.cursor = 'pointer';
      header.addEventListener('click', (e) => {
        if (e.target.closest('a')) return; // 不攔截連結點擊
        const card = header.closest('.result-card');
        card.classList.toggle('rc-collapsed');
      });
    });
  },

  createCard(group, index) {
    const total = group.queries.length;
    const cited = group.queries.filter(q => q.isCited);
    const aio = group.queries.filter(q => q.hasAIO === true && !q.isCited);
    const none = group.queries.filter(q => q.hasAIO === false && q.scanStatus !== 'timeout');
    const timeout = group.queries.filter(q => q.scanStatus === 'timeout');

    const aioCount = cited.length + aio.length;
    const noAio = aioCount === 0;

    // 狀態摘要
    const badges = [];
    if (noAio) {
      badges.push('<span class="rc-badge rc-badge-danger">無 AIO</span>');
    } else {
      badges.push(`<span class="rc-badge rc-badge-aio">${aioCount}/${total} AIO</span>`);
      if (cited.length > 0) {
        badges.push(`<span class="rc-badge rc-badge-cited">${cited.length} 引用</span>`);
      }
    }

    // 按狀態分組的語句
    const sections = [];

    if (cited.length > 0) {
      sections.push(this.renderQuerySection('cited', cited));
    }
    if (aio.length > 0) {
      sections.push(this.renderQuerySection('aio', aio));
    }
    if (none.length > 0) {
      sections.push(this.renderQuerySection('none', none));
    }
    if (timeout.length > 0) {
      sections.push(this.renderQuerySection('timeout', timeout));
    }

    // 前三張展開，其餘收合
    const collapsed = index >= 3 ? ' rc-collapsed' : '';
    const cardClass = noAio
      ? `result-card result-card-danger${collapsed}`
      : `result-card${collapsed}`;

    return `
      <div class="${cardClass}">
        <div class="rc-header">
          <a class="rc-title" href="${Utils.escapeHtml(group.url)}" target="_blank" rel="noopener">
            ${Utils.escapeHtml(group.title || group.url)}
          </a>
          <div class="rc-badges">${badges.join('')}</div>
        </div>
        <div class="rc-body">${sections.join('')}</div>
      </div>
    `;
  },

  renderQuerySection(type, queries) {
    const config = {
      cited:   { icon: '&#10003;', label: '被引用', cls: 'rc-section-cited' },
      aio:     { icon: '&#9675;',  label: '有 AIO',  cls: 'rc-section-aio' },
      none:    { icon: '&#10007;', label: '沒 AIO',  cls: 'rc-section-none' },
      timeout: { icon: '?',        label: '未回傳',  cls: 'rc-section-timeout' }
    };
    const c = config[type];

    const chips = queries.map(q =>
      `<span class="rc-query">${Utils.escapeHtml(q.query)}</span>`
    ).join('');

    return `
      <div class="rc-section ${c.cls}">
        <span class="rc-section-icon">${c.icon}</span>
        <div class="rc-queries">${chips}</div>
      </div>
    `;
  },

  exportCsv() {
    if (!this.results?.results) return;

    const headers = ['文章標題', '網址', '搜尋語句', '有 AIO', '被引用', 'AIO 來源'];
    const rows = this.results.results.map(r => [
      r.title || '', r.url, r.query,
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
