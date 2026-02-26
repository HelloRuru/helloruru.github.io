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

  /** DOM 元素 */
  elements: {
    section: null,
    tbody: null,
    countBadge: null,
    selectAll: null,
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

    // 年份篩選
    this.elements.filterYear?.addEventListener('change', () => {
      this.applyFilter();
    });

    // 月份篩選
    this.elements.filterMonth?.addEventListener('change', () => {
      this.applyFilter();
    });
  },

  /**
   * 渲染文章清單
   * @param {Array} articles - 文章清單
   */
  render(articles) {
    this.articles = articles;

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
        tbody.appendChild(tr);
      }
    });

    // 更新計數
    if (this.elements.filterCount) {
      const total = this.articles.length;
      const visible = this.visibleIndices.length;
      this.elements.filterCount.textContent = (yearVal || monthVal)
        ? `顯示 ${visible} / 共 ${total} 篇`
        : `共 ${total} 篇`;
    }
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
      `<button class="query-chip" data-chip="${c}">${c}</button>`
    ).join('');

    tr.innerHTML = `
      <td class="col-check">
        <input type="checkbox" ${article.selected ? 'checked' : ''}>
      </td>
      <td class="col-title">
        <a href="${Utils.escapeHtml(article.url)}" target="_blank" rel="noopener"${titleClass}>
          ${Utils.escapeHtml(article.title)}
        </a>
        ${meta}
      </td>
      <td class="col-query">
        <input type="text" value="${Utils.escapeHtml(article.query)}" placeholder="輸入搜尋語句">
        <div class="query-chips">${chips}</div>
      </td>
    `;

    // 綁定事件
    this.bindRowEvents(tr, index);

    return tr;
  },

  /**
   * 綁定列事件
   * @param {HTMLElement} tr - 列元素
   * @param {number} index - 索引
   */
  bindRowEvents(tr, index) {
    // 勾選
    const checkbox = tr.querySelector('input[type="checkbox"]');
    checkbox?.addEventListener('change', (e) => {
      this.articles[index].selected = e.target.checked;
      this.saveArticles();
    });

    // 編輯搜尋語句
    const input = tr.querySelector('input[type="text"]');
    input?.addEventListener('change', (e) => {
      this.articles[index].query = e.target.value;
      this.saveArticles();
    });

    // 快速修飾方塊
    tr.querySelectorAll('.query-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        const word = chip.dataset.chip;
        const current = input.value.trim();
        // 如果語句裡已有這個詞，就移除；否則附加
        if (current.includes(word)) {
          input.value = current.replace(word, '').replace(/\s+/g, ' ').trim();
          chip.classList.remove('active');
        } else {
          input.value = current + word;
          chip.classList.add('active');
        }
        this.articles[index].query = input.value;
        this.saveArticles();
      });
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
    const index = this.articles.indexOf(article);
    if (index === -1) return;

    const tr = this.elements.tbody?.querySelector(`tr[data-index="${index}"]`);
    if (!tr) return;

    // 更新標題
    const titleLink = tr.querySelector('.col-title a');
    if (titleLink) {
      titleLink.textContent = article.title;
      titleLink.classList.remove('is-url');
    }

    // 更新搜尋語句輸入框
    const queryInput = tr.querySelector('.col-query input[type="text"]');
    if (queryInput) queryInput.value = article.query;

    // 更新搜尋語句預覽
    const preview = tr.querySelector('.article-query-preview');
    if (preview && article.query && !article.query.startsWith('http')) {
      preview.textContent = `搜尋「${article.query}」`;
    } else if (!preview && article.query && !article.query.startsWith('http')) {
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
      span.textContent = `搜尋「${article.query}」`;
      meta.appendChild(span);
    }

    // 更新標題頻率表 + 分類頁標記
    this.titleCounts[article.title] = (this.titleCounts[article.title] || 0) + 1;
    if (this.titleCounts[article.title] >= 2) {
      // 幫所有同標題的列加上標記
      this.articles.forEach((a, i) => {
        if (a.title !== article.title) return;
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
    return this.articles.filter(a => a.selected && a.query);
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
