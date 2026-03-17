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
    ManualCheck.init();
    Charts.init();
    SearchInsights.init();
    Timeline.init();

    // 手動檢查完成回呼
    ManualCheck.onComplete = (results) => {
      this.handleResultsUploaded(results);
    };

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

    // 開始手動檢查
    document.getElementById('start-check-btn')?.addEventListener('click', () => {
      const selected = ArticlesTable.getSelectedArticles();
      if (selected.length === 0) {
        Toast.error('請先勾選要監測的文章');
        return;
      }
      ManualCheck.show(selected, this.domain);
      this.switchCheckTab('manual');
    });

    // Check mode tabs
    document.querySelectorAll('.check-mode-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        this.switchCheckTab(tab.dataset.mode);
      });
    });

    // 匯出搜尋語句
    document.getElementById('export-queries-btn')?.addEventListener('click', () => {
      CliGenerator.exportQueries(ArticlesTable.articles);
    });

    // 產生 CLI 指令 → 切到 CLI tab
    document.getElementById('generate-cli-btn')?.addEventListener('click', () => {
      CliGenerator.generate(ArticlesTable.articles, this.domain);
      // 顯示 check-section 並切到 CLI tab
      document.getElementById('check-section')?.classList.remove('hidden');
      this.switchCheckTab('cli');
      document.getElementById('check-section')?.scrollIntoView({ behavior: 'smooth' });
    });

    // 匯出 CSV
    document.getElementById('export-csv-btn')?.addEventListener('click', () => {
      ResultsTable.exportCsv();
    });

    // 匯出結果圖片
    document.getElementById('export-image-btn')?.addEventListener('click', () => {
      this.exportResultImage();
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
        if (ok) Toast.success('AI 提示詞已複製，請貼到你常用的聊天工具');
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
    ManualCheck.reset();

    // 重置統計與圖表
    Stats.reset();
    Charts.reset();
    SearchInsights.reset();

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
      const normalizedArticles = Sitemap.filterArticles(savedArticles);
      if (normalizedArticles.length !== savedArticles.length) {
        Storage.saveArticles(normalizedArticles);
      }

      ArticlesTable.render(normalizedArticles);

      // 嘗試從第一篇文章取得網域
      if (normalizedArticles[0]?.url) {
        this.domain = Utils.getDomain(normalizedArticles[0].url);
      }

      // 更新 AI 輔助面板
      AiAssist.update(normalizedArticles, this.domain);

      // 重新開頁時，補抓上次還沒抓到的標題
      this.fetchTitlesInBackground(normalizedArticles, this.domain);
    }

    // 載入掃描結果
    const savedResults = Storage.getResults();
    if (savedResults) {
      ResultsTable.render(savedResults);
      Charts.render(savedResults);
      SearchInsights.render(savedResults);
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

    // 背景抓取真實文章標題
    this.fetchTitlesInBackground(result.articles, result.domain);
  },

  /**
   * 切換 check-section 的 tab（手動檢查 / CLI 進階）
   * @param {string} mode - 'manual' or 'cli'
   */
  switchCheckTab(mode) {
    // 更新 tab 按鈕
    document.querySelectorAll('.check-mode-tab').forEach(tab => {
      tab.classList.toggle('active', tab.dataset.mode === mode);
    });

    // 切換內容
    const manualContent = document.getElementById('check-manual-content');
    const cliContent = document.getElementById('check-cli-content');
    if (mode === 'manual') {
      manualContent?.classList.remove('hidden');
      cliContent?.classList.add('hidden');
    } else {
      manualContent?.classList.add('hidden');
      cliContent?.classList.remove('hidden');
    }
  },

  /**
   * 背景抓取文章標題（不阻塞主流程）
   * @param {Array} articles - 文章清單
   * @param {string} domain - 網域
   */
  async fetchTitlesInBackground(articles, domain) {
    const needCount = articles.filter(a => Sitemap.needsTitleFetch(a)).length;
    if (needCount === 0) return;

    Toast.info(`正在抓取 ${needCount} 篇文章標題...`);

    const result = await Sitemap.fetchTitlesForArticles(articles, domain, (article) => {
      ArticlesTable.updateArticle(article);
    });

    const fetched = result.fetched;
    if (fetched > 0) {
      Storage.saveArticles(articles);
      AiAssist.update(articles, domain);
      Toast.success(`已抓取 ${fetched} 篇文章標題`);
    } else if (needCount > 0) {
      Toast.info('標題抓取未成功（可能為 SPA 網站），可手動編輯');
    }

    // 偵測重複標題（分類頁常見）
    if (result.duplicates?.length > 0) {
      const dup = result.duplicates[0];
      Toast.info(`${dup.count} 篇文章共用標題「${dup.title}」，可能是分類頁，建議手動填搜尋語句`);
    }
  },

  /**
   * 處理結果上傳
   * @param {Object} results - 掃描結果
   */
  handleResultsUploaded(results) {
    // 記住結果供匯出用
    this.results = results;

    // 儲存結果
    Storage.saveResults(results);

    // 顯示結果
    ResultsTable.render(results);

    // 渲染圖表
    Charts.render(results);
    SearchInsights.render(results);

    // 更新時間軸（存入 IndexedDB + 重新整理）
    Timeline.onResultsUploaded(results);
  },

  /**
   * 匯出結果圖片 — 截取統計 + 卡片區域，加品牌浮水印
   */
  async exportResultImage() {
    if (typeof html2canvas === 'undefined') {
      Toast.error('截圖工具載入中，請稍後再試');
      return;
    }

    Toast.info('正在產生圖片...');

    // 建立臨時容器（深色背景 + padding）
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed; left: -9999px; top: 0;
      width: 800px; padding: 32px;
      background: #06060c; color: #c0d4d8;
      font-family: 'IBM Plex Sans TC', 'Noto Sans TC', sans-serif;
    `;

    // 標題
    const header = document.createElement('div');
    header.style.cssText = 'margin-bottom: 24px; text-align: center;';
    header.innerHTML = `
      <div style="font-family: Orbitron, monospace; font-size: 24px; font-weight: 700; color: #39c5bb; letter-spacing: 2px; text-shadow: 0 0 12px rgba(57,197,187,0.3);">AIO VIEW</div>
      <div style="font-size: 13px; color: #7a9098; margin-top: 4px;">${this.results?.domain || ''} | ${this.results?.scanDate || new Date().toISOString().split('T')[0]}</div>
    `;
    container.appendChild(header);

    // 複製統計卡片
    const statsEl = document.getElementById('stats-grid');
    if (statsEl) {
      const statsClone = statsEl.cloneNode(true);
      statsClone.style.marginBottom = '24px';
      container.appendChild(statsClone);
    }

    // 複製前 5 張結果卡片
    const cards = document.querySelectorAll('.results-cards .result-card');
    if (cards.length > 0) {
      const cardsWrap = document.createElement('div');
      cardsWrap.style.cssText = 'display: flex; flex-direction: column; gap: 12px;';
      const limit = Math.min(cards.length, 5);
      for (let i = 0; i < limit; i++) {
        const clone = cards[i].cloneNode(true);
        clone.classList.remove('rc-collapsed');
        cardsWrap.appendChild(clone);
      }
      if (cards.length > 5) {
        const more = document.createElement('div');
        more.style.cssText = 'text-align: center; color: #7a9098; font-size: 13px; padding: 8px;';
        more.textContent = `...還有 ${cards.length - 5} 篇`;
        cardsWrap.appendChild(more);
      }
      container.appendChild(cardsWrap);
    }

    // 浮水印
    const watermark = document.createElement('div');
    watermark.style.cssText = 'text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(57,197,187,0.1);';
    watermark.innerHTML = `<span style="font-family: Orbitron, monospace; font-size: 11px; color: #4a5568; letter-spacing: 1px;">Generated by AIO View — lab.helloruru.com/aio-view</span>`;
    container.appendChild(watermark);

    document.body.appendChild(container);

    // 複製樣式表讓 clone 有正確的樣式
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"], style');
    stylesheets.forEach(s => {
      container.appendChild(s.cloneNode(true));
    });

    try {
      const canvas = await html2canvas(container, {
        backgroundColor: '#06060c',
        scale: 2,
        useCORS: true,
        logging: false
      });

      // 下載
      const link = document.createElement('a');
      link.download = `aio-view-${this.results?.scanDate || 'export'}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      Toast.success('圖片已下載！');
    } catch (e) {
      Toast.error('截圖失敗：' + e.message);
    } finally {
      container.remove();
    }
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
