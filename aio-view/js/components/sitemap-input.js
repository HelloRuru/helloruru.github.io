/* ================================================
   AIO View — Sitemap Input Component
   Sitemap 輸入與解析
   ================================================ */

const SitemapInput = {
  /** DOM 元素 */
  elements: {
    input: null,
    button: null,
    status: null,
    picker: null,
    pickerSelect: null,
    pickerBtn: null
  },

  /** 回呼函數 */
  onParsed: null,

  /**
   * 初始化
   * @param {Function} callback - 解析成功後的回呼
   */
  init(callback) {
    this.onParsed = callback;

    this.elements.input = document.getElementById('sitemap-url');
    this.elements.button = document.getElementById('fetch-btn');
    this.elements.status = document.getElementById('fetch-status');
    this.elements.picker = document.getElementById('sitemap-picker');
    this.elements.pickerSelect = document.getElementById('sitemap-select');
    this.elements.pickerBtn = document.getElementById('fetch-sub-btn');

    this.bindEvents();
  },

  /**
   * 綁定事件
   */
  bindEvents() {
    // 按鈕點擊
    this.elements.button?.addEventListener('click', () => {
      this.fetch();
    });

    // Enter 鍵
    this.elements.input?.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.fetch();
      }
    });

    // 子 sitemap 載入
    this.elements.pickerBtn?.addEventListener('click', () => {
      this.fetchSubSitemap();
    });
  },

  /**
   * 取得並解析 sitemap
   */
  async fetch() {
    const url = this.elements.input?.value.trim();

    // 驗證
    if (!url) {
      this.setStatus('請輸入 sitemap 網址');
      return;
    }

    if (!Utils.isValidUrl(url)) {
      this.setStatus('網址格式不正確');
      return;
    }

    // 開始載入
    this.setLoading(true);
    this.setStatus('正在解析...');

    try {
      const result = await Sitemap.fetch(url);

      // 處理 sitemap index
      if (result.type === 'index') {
        this.setStatus(`Sitemap Index，包含 ${result.sitemaps.length} 個子 Sitemap，請選擇一個載入`);
        this.showSitemapPicker(result.sitemaps);
        return;
      }

      // 檢查文章數量
      if (result.articles.length === 0) {
        this.setStatus('未找到文章，請確認 sitemap 網址正確');
        return;
      }

      this.setStatus(`找到 ${result.articles.length} 篇文章`);

      // 執行回呼
      if (this.onParsed) {
        this.onParsed(result);
      }

    } catch (error) {
      this.setStatus(error.message || '解析失敗，請稍後再試');
      console.error('Sitemap fetch error:', error);
    } finally {
      this.setLoading(false);
    }
  },

  /**
   * 設定狀態文字
   * @param {string} message - 訊息
   */
  setStatus(message) {
    if (this.elements.status) {
      this.elements.status.textContent = message;
    }
  },

  /**
   * 設定載入狀態
   * @param {boolean} loading - 是否載入中
   */
  setLoading(loading) {
    if (this.elements.button) {
      this.elements.button.disabled = loading;
      this.elements.button.classList.toggle('loading', loading);
    }
  },

  /**
   * 顯示子 sitemap 選擇器
   * @param {Array} sitemaps - { url, lastmod } 陣列
   */
  showSitemapPicker(sitemaps) {
    const { picker, pickerSelect } = this.elements;
    if (!picker || !pickerSelect) return;

    pickerSelect.innerHTML = sitemaps.map((s, i) => {
      const label = s.lastmod
        ? `${s.url.split('/').pop() || s.url} (${s.lastmod.slice(0, 10)})`
        : s.url.split('/').pop() || s.url;
      return `<option value="${i}">${label}</option>`;
    }).join('');

    // 儲存 sitemaps 供載入使用
    this._indexSitemaps = sitemaps;
    picker.classList.remove('hidden');
  },

  /**
   * 載入使用者選擇的子 sitemap
   */
  async fetchSubSitemap() {
    const idx = parseInt(this.elements.pickerSelect?.value);
    const sitemap = this._indexSitemaps?.[idx];
    if (!sitemap) return;

    this.setLoading(true);
    this.setStatus(`正在載入 ${sitemap.url.split('/').pop()}...`);

    try {
      const result = await Sitemap.fetch(sitemap.url);

      // 可能巢狀 index
      if (result.type === 'index') {
        this.setStatus(`此 Sitemap 也是 Index，包含 ${result.sitemaps.length} 個子 Sitemap`);
        this.showSitemapPicker(result.sitemaps);
        return;
      }

      if (result.articles.length === 0) {
        this.setStatus('此子 Sitemap 未找到文章，請選擇另一個');
        return;
      }

      // 隱藏選擇器
      this.elements.picker?.classList.add('hidden');
      this.setStatus(`找到 ${result.articles.length} 篇文章`);

      if (this.onParsed) {
        this.onParsed(result);
      }
    } catch (error) {
      this.setStatus(error.message || '載入子 Sitemap 失敗');
      console.error('Sub-sitemap fetch error:', error);
    } finally {
      this.setLoading(false);
    }
  }
};
