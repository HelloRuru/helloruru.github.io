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
    Stats.init();
    ArticlesTable.init();
    ResultsTable.init();
    CliGenerator.init();

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
    }

    // 載入掃描結果
    const savedResults = Storage.getResults();
    if (savedResults) {
      ResultsTable.render(savedResults);
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
