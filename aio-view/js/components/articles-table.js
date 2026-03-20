/* ================================================
   AIO View — Articles Table Component
   文章清單表格
   ================================================ */

const ArticlesTable = {
  /** 文章資料 */
  articles: [],

  /** 目前可見的文章索引 */
  visibleIndices: [],

  /** 標題頻率表（偵測分類頁） */
  titleCounts: {},

  /** 搜尋語句快速修飾詞 */
  QUERY_CHIPS: ['推薦', '評價', '口碑', '店家', '價格', '哪裡'],

  /** 語句存檔延遲 */
  SAVE_DEBOUNCE_MS: 400,

  /** 延後存檔計時器 */
  saveTimer: null,

  /** DOM 元素 */
  elements: {
    section: null,
    tbody: null,
    countBadge: null,
    selectAll: null,
    clearSelection: null,
    filterYear: null,
    filterMonth: null,
    filterCount: null,
    filters: null
  },

  /**
   * 初始化
   */
  init() {
    this.elements.section = document.getElementById('articles-section');
    this.elements.tbody = document.getElementById('articles-body');
    this.elements.countBadge = document.getElementById('article-count');
    this.elements.selectAll = document.getElementById('select-all');
    this.elements.clearSelection = document.getElementById('clear-selection-btn');
    this.elements.filterYear = document.getElementById('filter-year');
    this.elements.filterMonth = document.getElementById('filter-month');
    this.elements.filterCount = document.getElementById('filter-count');
    this.elements.filters = document.getElementById('article-filters');

    this.bindEvents();
  },

  /**
   * 綁定事件
   */
  bindEvents() {
    // 全選（只影響可見文章）
    this.elements.selectAll?.addEventListener('change', (e) => {
      this.toggleSelectAll(e.target.checked);
    });

    this.elements.clearSelection?.addEventListener('click', () => {
      this.clearSelection();
    });

    // 年份篩選
    this.elements.filterYear?.addEventListener('change', () => {
      this.applyFilter();
    });

    // 月份篩選
    this.elements.filterMonth?.addEventListener('change', () => {
      this.applyFilter();
    });

    this.elements.tbody?.addEventListener('input', (e) => {
      const row = e.target.closest('tr[data-index]');
      if (!row) return;

      const index = Number(row.dataset.index);
      if (!Number.isInteger(index) || !this.articles[index]) return;

      if (e.target.matches('.query-input')) {
        this.articles[index].query = e.target.value;
        this.scheduleSave();
        this.syncQueryChipState(row, e.target.value);
      }
    });

    this.elements.tbody?.addEventListener('change', (e) => {
      const row = e.target.closest('tr[data-index]');
      if (!row) return;

      const index = Number(row.dataset.index);
      if (!Number.isInteger(index) || !this.articles[index]) return;

      if (e.target.matches('.article-select')) {
        this.articles[index].selected = e.target.checked;
        this.saveArticles();
        this.syncSelectionControls();
        return;
      }

      if (e.target.matches('.query-input')) {
        this.articles[index].query = e.target.value;
        this.flushPendingSave();
        this.syncQueryChipState(row, e.target.value);
      }
    });

    this.elements.tbody?.addEventListener('click', (e) => {
      const chip = e.target.closest('.query-chip');
      if (!chip) return;

      const row = chip.closest('tr[data-index]');
      if (!row) return;

      const index = Number(row.dataset.index);
      const article = this.articles[index];
      const input = row.querySelector('.query-input');
      if (!Number.isInteger(index) || !article || !input) return;

      const word = chip.dataset.chip;
      const current = input.value.trim();

      if (current.includes(word)) {
        input.value = current.replace(word, '').replace(/\s+/g, ' ').trim();
      } else {
        input.value = `${current}${word}`;
      }

      article.query = input.value;
      this.flushPendingSave();
      this.syncQueryChipState(row, input.value);
    });

    window.addEventListener('pagehide', () => {
      if (this.saveTimer) {
        this.flushPendingSave();
      }
    });
  },

  /**
   * 渲染文章清單
   * @param {Array} articles - 文章清單
   */
  render(articles) {
    this.articles = articles.map(article => ({
      ...article,
      selected: article.selected === true
    }));

    if (!this.elements.tbody) return;

    // 建立標題頻率表（偵測分類頁）
    this.titleCounts = {};
    articles.forEach(a => {
      if (a.title && !a.title.startsWith('http')) {
        this.titleCounts[a.title] = (this.titleCounts[a.title] || 0) + 1;
      }
    });

    // 更新總數
    if (this.elements.countBadge) {
      this.elements.countBadge.textContent = articles.length;
    }

    // 填充篩選器
    this.populateFilters();

    // 套用篩選（會渲染表格列）
    this.applyFilter();

    // 顯示區塊
    this.show();
  },

  /**
   * 填充年月篩選器
   */
  populateFilters() {
    const years = new Set();
    const months = new Set();
    let hasLastmod = false;

    this.articles.forEach(a => {
      if (a.lastmod) {
        hasLastmod = true;
        const d = new Date(a.lastmod);
        if (!isNaN(d)) {
          years.add(d.getFullYear());
          months.add(d.getMonth() + 1);
        }
      }
    });

    // 沒有 lastmod 就隱藏篩選器
    if (!hasLastmod || years.size === 0) {
      this.elements.filters?.classList.add('hidden');
      return;
    }
    this.elements.filters?.classList.remove('hidden');

    // 年份選單（降序）
    if (this.elements.filterYear) {
      const sortedYears = [...years].sort((a, b) => b - a);
      this.elements.filterYear.innerHTML =
        '<option value="">全部年份</option>' +
        sortedYears.map(y => `<option value="${y}">${y}</option>`).join('');
    }

    // 月份選單
    if (this.elements.filterMonth) {
      const sortedMonths = [...months].sort((a, b) => a - b);
      this.elements.filterMonth.innerHTML =
        '<option value="">全部月份</option>' +
        sortedMonths.map(m => `<option value="${m}">${m} 月</option>`).join('');
    }
  },

  /**
   * 套用篩選條件，重新渲染表格
   */
  applyFilter() {
    const yearVal = this.elements.filterYear?.value;
    const monthVal = this.elements.filterMonth?.value;
    const { tbody } = this.elements;
    if (!tbody) return;

    tbody.innerHTML = '';
    this.visibleIndices = [];
    const fragment = document.createDocumentFragment();

    this.articles.forEach((article, index) => {
      let show = true;

      if (yearVal || monthVal) {
        if (article.lastmod) {
          const d = new Date(article.lastmod);
          if (!isNaN(d)) {
            if (yearVal && d.getFullYear() !== parseInt(yearVal)) show = false;
            if (monthVal && (d.getMonth() + 1) !== parseInt(monthVal)) show = false;
          }
        } else {
          // 有篩選條件但文章沒有日期，隱藏
          show = false;
        }
      }

      if (show) {
        this.visibleIndices.push(index);
        const tr = this.createRow(article, index);
        fragment.appendChild(tr);
      }
    });

    tbody.appendChild(fragment);

    // 更新計數
    if (this.elements.filterCount) {
      const total = this.articles.length;
      const visible = this.visibleIndices.length;
      this.elements.filterCount.textContent = (yearVal || monthVal)
        ? `顯示 ${visible} / 共 ${total} 篇`
        : `共 ${total} 篇`;
    }

    this.syncSelectionControls();
  },

  /**
   * 建立表格列
   * @param {Object} article - 文章資料
   * @param {number} index - 索引
   * @returns {HTMLElement} tr 元素
   */
  createRow(article, index) {
    const tr = document.createElement('tr');
    tr.dataset.index = index;

    // 日期格式化
    let dateHtml = '';
    if (article.lastmod) {
      const d = new Date(article.lastmod);
      if (!isNaN(d)) {
        dateHtml = `<span class="article-date">${d.toLocaleDateString('zh-TW')}</span>`;
      }
    }

    // 標題是否為 URL（需要抓取中）
    const isUrl = article.title === article.url || article.title.startsWith('http');
    const titleClass = isUrl ? ' class="is-url"' : '';

    // 分類頁偵測（同標題出現 2 次以上）
    const isDuplicate = !isUrl && this.titleCounts[article.title] >= 2;
    const dupBadge = isDuplicate
      ? '<span class="badge-category">分類頁</span>'
      : '';

    // 搜尋語句預覽
    const queryPreview = article.query && !article.query.startsWith('http')
      ? `<span class="article-query-preview">搜尋「${Utils.escapeHtml(article.query)}」</span>`
      : '';

    // 副資訊：日期 + 搜尋語句 + 分類頁標記
    const metaParts = [dateHtml, queryPreview, dupBadge].filter(Boolean);
    const meta = metaParts.length
      ? `<div class="article-meta">${metaParts.join('<span class="meta-dot"></span>')}</div>`
      : '';

    // 快速修飾方塊
    const chips = this.QUERY_CHIPS.map(c =>
      `<button class="query-chip${article.query?.includes(c) ? ' active' : ''}" data-chip="${c}" type="button">${c}</button>`
    ).join('');

    tr.innerHTML = `
      <td class="col-check">
        <input class="article-select" type="checkbox" ${article.selected ? 'checked' : ''}>
      </td>
      <td class="col-title">
        <a href="${Utils.escapeHtml(article.url)}" target="_blank" rel="noopener"${titleClass}>
          ${Utils.escapeHtml(article.title)}
        </a>
        ${meta}
      </td>
      <td class="col-query">
        <input class="query-input" type="text" value="${Utils.escapeHtml(article.query)}" placeholder="輸入搜尋語句">
        <div class="query-chips">${chips}</div>
      </td>
    `;

    return tr;
  },

  /**
   * 同步語句晶片狀態
   * @param {HTMLElement} tr - 列元素
   * @param {string} query - 搜尋語句
   */
  syncQueryChipState(tr, query) {
    const normalizedQuery = String(query || '');
    tr.querySelectorAll('.query-chip').forEach(chip => {
      chip.classList.toggle('active', normalizedQuery.includes(chip.dataset.chip));
    });
  },

  /**
   * 全選/取消全選（只影響目前可見的文章）
   * @param {boolean} checked - 是否勾選
   */
  toggleSelectAll(checked) {
    this.visibleIndices.forEach(i => {
      this.articles[i].selected = checked;
    });

    // 更新 UI（只更新表格中可見的 checkbox）
    this.elements.tbody?.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = checked;
    });

    this.saveArticles();
    this.syncSelectionControls();
  },

  /**
   * 清空目前可見文章的勾選
   */
  clearSelection() {
    this.toggleSelectAll(false);
  },

  /**
   * 同步全選與清空按鈕狀態
   */
  syncSelectionControls() {
    const visibleArticles = this.visibleIndices
      .map(index => this.articles[index])
      .filter(Boolean);
    const selectedCount = visibleArticles.filter(article => article.selected === true).length;

    if (this.elements.selectAll) {
      this.elements.selectAll.checked = visibleArticles.length > 0 && selectedCount === visibleArticles.length;
      this.elements.selectAll.indeterminate = selectedCount > 0 && selectedCount < visibleArticles.length;
    }

    if (this.elements.clearSelection) {
      this.elements.clearSelection.disabled = selectedCount === 0;
    }
  },

  /**
   * 批次更新搜尋語句
   * @param {Array} pairs - { title, query } 陣列
   * @returns {number} 成功更新的數量
   */
  batchUpdateQueries(pairs) {
    let updated = 0;
    pairs.forEach(({ title, query }) => {
      const article = this.articles.find(a =>
        a.title.includes(title) || title.includes(a.title)
      );
      if (article && query) {
        article.query = query.trim();
        updated++;
      }
    });
    this.saveArticles();
    this.applyFilter(); // 重新渲染
    return updated;
  },

  /**
   * 動態更新單篇文章的標題和語句（不重繪整張表）
   * @param {Object} article - 已更新的文章物件
   */
  updateArticle(article) {
    const index = this.articles.findIndex(item =>
      (article.id && item.id === article.id) || item.url === article.url
    );
    if (index === -1) return;

    const target = this.articles[index];
    const previousTitle = target.title;

    target.title = article.title;
    target.query = article.query;
    if (article.lastmod) {
      target.lastmod = article.lastmod;
    }

    const tr = this.elements.tbody?.querySelector(`tr[data-index="${index}"]`);
    if (!tr) return;

    // 更新標題
    const titleLink = tr.querySelector('.col-title a');
    if (titleLink) {
      titleLink.textContent = target.title;
      titleLink.classList.toggle('is-url', target.title === target.url || target.title.startsWith('http'));
    }

    // 更新搜尋語句輸入框
    const queryInput = tr.querySelector('.col-query input[type="text"]');
    if (queryInput) queryInput.value = target.query;

    // 更新搜尋語句預覽
    const preview = tr.querySelector('.article-query-preview');
    if (preview && target.query && !target.query.startsWith('http')) {
      preview.textContent = `搜尋「${target.query}」`;
    } else if (!preview && target.query && !target.query.startsWith('http')) {
      // 如果之前沒有預覽（因為 query 是垃圾值），現在新增
      let meta = tr.querySelector('.article-meta');
      if (!meta) {
        meta = document.createElement('div');
        meta.className = 'article-meta';
        tr.querySelector('.col-title')?.appendChild(meta);
      }
      if (meta.children.length > 0) {
        const dot = document.createElement('span');
        dot.className = 'meta-dot';
        meta.appendChild(dot);
      }
      const span = document.createElement('span');
      span.className = 'article-query-preview';
      span.textContent = `搜尋「${target.query}」`;
      meta.appendChild(span);
    }

    // 更新標題頻率表 + 分類頁標記
    if (previousTitle && this.titleCounts[previousTitle]) {
      this.titleCounts[previousTitle] = Math.max(0, this.titleCounts[previousTitle] - 1);
    }
    this.titleCounts[target.title] = (this.titleCounts[target.title] || 0) + 1;
    if (this.titleCounts[target.title] >= 2) {
      // 幫所有同標題的列加上標記
      this.articles.forEach((a, i) => {
        if (a.title !== target.title) return;
        const row = this.elements.tbody?.querySelector(`tr[data-index="${i}"]`);
        if (!row || row.querySelector('.badge-category')) return;
        let meta = row.querySelector('.article-meta');
        if (!meta) {
          meta = document.createElement('div');
          meta.className = 'article-meta';
          row.querySelector('.col-title')?.appendChild(meta);
        }
        if (meta.children.length > 0) {
          const dot = document.createElement('span');
          dot.className = 'meta-dot';
          meta.appendChild(dot);
        }
        const badge = document.createElement('span');
        badge.className = 'badge-category';
        badge.textContent = '分類頁';
        meta.appendChild(badge);
      });
    }
  },

  /**
   * 排程延後存檔
   */
  scheduleSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      this.saveTimer = null;
      this.saveArticles();
    }, this.SAVE_DEBOUNCE_MS);
  },

  /**
   * 立即送出延後中的存檔
   */
  flushPendingSave() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    this.saveArticles();
  },

  /**
   * 儲存文章
   */
  saveArticles() {
    Storage.saveArticles(this.articles);
  },

  /**
   * 取得已選取的文章
   * @returns {Array} 已選取的文章
   */
  getSelectedArticles() {
    return this.articles
      .filter(a => a.selected === true && String(a.query || '').trim())
      .map(a => ({ ...a, selected: true }));
  },

  /**
   * 顯示區塊
   */
  show() {
    this.elements.section?.classList.remove('hidden');
  },

  /**
   * 清空目前畫面資料
   */
  clear() {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = null;
    }

    this.articles = [];
    this.visibleIndices = [];
    this.titleCounts = {};

    if (this.elements.tbody) {
      this.elements.tbody.innerHTML = '';
    }

    if (this.elements.countBadge) {
      this.elements.countBadge.textContent = '0';
    }

    if (this.elements.filterCount) {
      this.elements.filterCount.textContent = '';
    }

    if (this.elements.filterYear) {
      this.elements.filterYear.innerHTML = '<option value="">全部年份</option>';
    }

    if (this.elements.filterMonth) {
      this.elements.filterMonth.innerHTML = '<option value="">全部月份</option>';
    }

    if (this.elements.filters) {
      this.elements.filters.classList.add('hidden');
    }

    if (this.elements.selectAll) {
      this.elements.selectAll.checked = false;
      this.elements.selectAll.indeterminate = false;
    }

    if (this.elements.clearSelection) {
      this.elements.clearSelection.disabled = true;
    }

    this.hide();
  },

  /**
   * 隱藏區塊
   */
  hide() {
    this.elements.section?.classList.add('hidden');
  }
};
