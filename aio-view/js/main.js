/* ================================================
   AIO View — Main Entry
   應用程式進入點
   ================================================ */

const App = {
  /** 目前網域 */
  domain: '',

  /**
   * 初始化應用程式
   */
  init() {
    // 初始化所有模組
    this.initModules();

    // 綁定全域事件
    this.bindEvents();

    // 載入已儲存的資料
    this.loadSavedData();
  },

  /**
   * 初始化模組
   */
  initModules() {
    // 初始化元件
    Guide.init();
    Stats.init();
    ArticlesTable.init();
    ResultsTable.init();
    CliGenerator.init();
    AiAssist.init();
    Charts.init();
    Timeline.init();

    // 初始化輸入元件（帶回呼）
    SitemapInput.init((result) => {
      this.handleSitemapParsed(result);
    });

    FileUpload.init((results) => {
      this.handleResultsUploaded(results);
    });
  },

  /**
   * 綁定全域事件
   */
  bindEvents() {
    // Logo 點擊 — 回到初始狀態
    document.getElementById('logo-link')?.addEventListener('click', (e) => {
      e.preventDefault();
      this.reset();
    });

    // 匯出搜尋語句
    document.getElementById('export-queries-btn')?.addEventListener('click', () => {
      CliGenerator.exportQueries(ArticlesTable.articles);
    });

    // 產生 CLI 指令
    document.getElementById('generate-cli-btn')?.addEventListener('click', () => {
      CliGenerator.generate(ArticlesTable.articles, this.domain);
    });

    // 匯出 CSV
    document.getElementById('export-csv-btn')?.addEventListener('click', () => {
      ResultsTable.exportCsv();
    });

    // 複製 AI 提示詞
    document.getElementById('copy-prompt-btn')?.addEventListener('click', () => {
      const selected = ArticlesTable.getSelectedArticles();
      if (selected.length === 0) {
        Toast.error('請先選擇要監測的文章');
        return;
      }
      const prompt = CliGenerator.getPromptTemplate(ArticlesTable.articles, this.domain);
      Utils.copyToClipboard(prompt).then(ok => {
        if (ok) Toast.success('AI 提示詞已複製，請貼到 ChatGPT 或 Claude');
        else Toast.error('複製失敗，請手動選取');
      });
    });

    // 批次編輯語句 — 開啟 Modal
    document.getElementById('batch-edit-btn')?.addEventListener('click', () => {
      document.getElementById('query-editor-modal')?.classList.remove('hidden');
    });

    // Modal 關閉
    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
      document.getElementById('query-editor-modal')?.classList.add('hidden');
    });
    document.getElementById('modal-cancel-btn')?.addEventListener('click', () => {
      document.getElementById('query-editor-modal')?.classList.add('hidden');
    });

    // Modal 套用
    document.getElementById('modal-apply-btn')?.addEventListener('click', () => {
      const text = document.getElementById('batch-query-input')?.value || '';
      const pairs = text.split('\n')
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
          const parts = line.split('|').map(s => s.trim());
          return { title: parts[0] || '', query: parts[1] || '' };
        })
        .filter(p => p.title && p.query);

      if (pairs.length === 0) {
        Toast.error('未偵測到有效語句，請確認格式（標題 | 語句）');
        return;
      }

      const count = ArticlesTable.batchUpdateQueries(pairs);
      Toast.success(`已更新 ${count} 篇文章的搜尋語句`);
      document.getElementById('query-editor-modal')?.classList.add('hidden');
      document.getElementById('batch-query-input').value = '';
    });
  },

  /**
   * 重置頁面到初始狀態
   */
  reset() {
    // 清除儲存的資料
    Storage.clearAll();

    // 重置變數
    this.domain = '';
    ArticlesTable.articles = [];

    // 隱藏所有區塊
    ArticlesTable.hide();
    ResultsTable.hide();
    CliGenerator.hide();

    // 重置統計與圖表
    Stats.reset();
    Charts.reset();

    // 清空輸入框
    const sitemapInput = document.getElementById('sitemap-url');
    if (sitemapInput) {
      sitemapInput.value = '';
    }
    const statusEl = document.getElementById('fetch-status');
    if (statusEl) {
      statusEl.textContent = '';
    }

    // 顯示提示
    Toast.success('已重置');
  },

  /**
   * 載入已儲存的資料
   */
  loadSavedData() {
    // 載入文章清單
    const savedArticles = Storage.getArticles();
    if (savedArticles.length > 0) {
      ArticlesTable.render(savedArticles);

      // 嘗試從第一篇文章取得網域
      if (savedArticles[0]?.url) {
        this.domain = Utils.getDomain(savedArticles[0].url);
      }

      // 更新 AI 輔助面板
      AiAssist.update(savedArticles, this.domain);
    }

    // 載入掃描結果
    const savedResults = Storage.getResults();
    if (savedResults) {
      ResultsTable.render(savedResults);
      Charts.render(savedResults);
    }
  },

  /**
   * 處理 Sitemap 解析完成
   * @param {Object} result - 解析結果
   */
  handleSitemapParsed(result) {
    this.domain = result.domain;

    // 儲存文章
    Storage.saveArticles(result.articles);

    // 顯示文章清單
    ArticlesTable.render(result.articles);

    // 更新 AI 輔助面板
    AiAssist.update(result.articles, result.domain);
  },

  /**
   * 處理結果上傳
   * @param {Object} results - 掃描結果
   */
  handleResultsUploaded(results) {
    // 儲存結果
    Storage.saveResults(results);

    // 顯示結果
    ResultsTable.render(results);

    // 渲染圖表
    Charts.render(results);

    // 更新時間軸（存入 IndexedDB + 重新整理）
    Timeline.onResultsUploaded(results);
  }
};

/* ================================================
   DOM Ready
   ================================================ */

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => App.init());
} else {
  App.init();
}
