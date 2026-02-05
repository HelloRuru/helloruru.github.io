/* ================================================
   AIO View — Sitemap Input Component
   Sitemap 輸入與解析
   ================================================ */

const SitemapInput = {
  /** DOM 元素 */
  elements: {
    input: null,
    button: null,
    status: null
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
        this.setStatus(`這是 sitemap index，包含 ${result.sitemaps.length} 個子 sitemap。請選擇其中一個。`);
        // TODO: 顯示子 sitemap 選單
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
  }
};
