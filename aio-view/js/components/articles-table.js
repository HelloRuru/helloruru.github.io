/* ================================================
   AIO View — Articles Table Component
   文章清單表格
   ================================================ */

const ArticlesTable = {
  /** 文章資料 */
  articles: [],

  /** DOM 元素 */
  elements: {
    section: null,
    tbody: null,
    countBadge: null,
    selectAll: null
  },

  /**
   * 初始化
   */
  init() {
    this.elements.section = document.getElementById('articles-section');
    this.elements.tbody = document.getElementById('articles-body');
    this.elements.countBadge = document.getElementById('article-count');
    this.elements.selectAll = document.getElementById('select-all');

    this.bindEvents();
  },

  /**
   * 綁定事件
   */
  bindEvents() {
    // 全選
    this.elements.selectAll?.addEventListener('change', (e) => {
      this.toggleSelectAll(e.target.checked);
    });
  },

  /**
   * 渲染文章清單
   * @param {Array} articles - 文章清單
   */
  render(articles) {
    this.articles = articles;
    const { tbody, countBadge } = this.elements;

    if (!tbody) return;

    // 更新數量
    if (countBadge) {
      countBadge.textContent = articles.length;
    }

    // 清空表格
    tbody.innerHTML = '';

    // 渲染每一列
    articles.forEach((article, index) => {
      const tr = this.createRow(article, index);
      tbody.appendChild(tr);
    });

    // 顯示區塊
    this.show();
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

    tr.innerHTML = `
      <td class="col-check">
        <input type="checkbox" ${article.selected ? 'checked' : ''}>
      </td>
      <td class="col-title">
        <a href="${Utils.escapeHtml(article.url)}" target="_blank" rel="noopener">
          ${Utils.escapeHtml(article.title)}
        </a>
      </td>
      <td class="col-query">
        <input type="text" value="${Utils.escapeHtml(article.query)}" placeholder="輸入搜尋語句">
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
  },

  /**
   * 全選/取消全選
   * @param {boolean} checked - 是否勾選
   */
  toggleSelectAll(checked) {
    this.articles.forEach((article, index) => {
      article.selected = checked;
    });

    // 更新 UI
    this.elements.tbody?.querySelectorAll('input[type="checkbox"]').forEach(cb => {
      cb.checked = checked;
    });

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
