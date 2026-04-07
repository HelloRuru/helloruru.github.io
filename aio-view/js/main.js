/* ================================================
   AIO View — AIO View Module
   原始 AIO View 功能（保留完整功能）
   ================================================ */

const AioViewApp = {
  /** 目前網域 */
  domain: '',

  /** 目前結果 */
  results: null,

  /** 外部資源載入 Promise */
  externalLoads: {},

  /** 背景抓標題工作版本 */
  titleFetchToken: 0,

  /**
   * 初始化應用程式
   */
  async init() {
    // 初始化所有模組
    this.initModules();

    // 綁定全域事件
    this.bindEvents();

    // 載入已儲存的資料
    await this.loadSavedData();

    // 需要時才載入重型外部工具
    this.initDeferredAssetObservers();
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
    }, {
      onBeforeFetch: () => {
        this.handleSitemapFetchStarted();
      }
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
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('reset-data-btn')?.addEventListener('click', () => {
      this.confirmReset();
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

    // 儲存這次結果
    document.getElementById('save-result-btn')?.addEventListener('click', () => {
      this.saveCurrentResult();
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
    this.titleFetchToken += 1;

    // 清除儲存的資料
    Storage.clearWorkingData();

    // 重置變數
    this.domain = '';
    this.results = null;
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
   * 是否已有可清除的工作資料
   * @returns {boolean}
   */
  hasWorkingData() {
    return Storage.getArticles().length > 0
      || !!Storage.getResults()
      || !!Storage.get(Storage.KEYS.MANUAL_CHECK, null);
  },

  /**
   * 需要確認後才清空資料
   */
  confirmReset() {
    if (!this.hasWorkingData()) {
      Toast.info('目前沒有可清空的資料');
      return;
    }

    const confirmed = window.confirm('要清空目前網站的文章、檢查進度與本機結果嗎？');
    if (!confirmed) return;

    this.reset();
  },

  /**
   * 載入已儲存的資料
   */
  async loadSavedData() {
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
    const savedResults = Storage.getResults(this.domain);
    if (savedResults) {
      if (!this.domain && savedResults.domain) {
        this.domain = savedResults.domain;
      }
      await this.renderResultViews(savedResults);
    }
  },

  /**
   * 處理 Sitemap 解析完成
   * @param {Object} result - 解析結果
   */
  handleSitemapParsed(result) {
    const domainChanged = Boolean(this.domain && result.domain && this.domain !== result.domain);

    this.domain = result.domain;

    if (domainChanged) {
      this.clearCurrentResults();
      Toast.info(`已切換到 ${result.domain}，前一個網站的掃描結果已收起`);
    }

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
   * 開始抓取新 sitemap 前，先收起舊畫面與取消背景工作
   */
  handleSitemapFetchStarted() {
    this.titleFetchToken += 1;
    this.results = null;

    ArticlesTable.clear();
    ResultsTable.hide();
    CliGenerator.hide();
    ManualCheck.reset();
    Stats.reset();
    Charts.reset();
    SearchInsights.reset();
    AiAssist.update([], this.domain);
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

    const fetchToken = ++this.titleFetchToken;
    Toast.info(`正在抓取 ${needCount} 篇文章標題...`);

    const result = await Sitemap.fetchTitlesForArticles(articles, domain, (article) => {
      if (fetchToken !== this.titleFetchToken) return;
      ArticlesTable.updateArticle(article);
    });

    if (fetchToken !== this.titleFetchToken) return;

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
  async handleResultsUploaded(results) {
    const normalized = Storage.normalizeResults(results, this.domain);
    if (!normalized) return;

    this.domain = normalized.domain || this.domain;

    // 記住結果供匯出用
    this.results = normalized;

    // 儲存結果
    Storage.saveResults(normalized);

    // 顯示結果
    await this.renderResultViews(normalized);

    // 更新時間軸（存入 IndexedDB + 重新整理）
    await Timeline.onResultsUploaded(normalized);
  },

  /**
   * 清掉目前畫面上的結果區塊
   */
  clearCurrentResults() {
    this.results = null;
    Storage.remove(Storage.KEYS.RESULTS);
    Storage.remove(Storage.KEYS.MANUAL_CHECK);
    ResultsTable.hide();
    Charts.reset();
    SearchInsights.reset();
    ManualCheck.reset();
  },

  /**
   * 渲染結果相關視圖
   * @param {Object} results - 掃描結果
   */
  async renderResultViews(results) {
    const normalized = Storage.normalizeResults(results, this.domain);
    if (!normalized?.results?.length) return;

    this.results = normalized;
    this.domain = normalized.domain || this.domain;

    await ResultsTable.render(normalized);
    SearchInsights.render(normalized);
    await this.ensureChartRuntime();
    Charts.render(normalized);
    Timeline.renderTrendChart();
  },

  /**
   * 初始化延後載入觀察器
   */
  initDeferredAssetObservers() {
    if (!('IntersectionObserver' in window)) return;

    const targets = ['timeline-section'];
    const observer = new IntersectionObserver((entries) => {
      if (!entries.some(entry => entry.isIntersecting && !entry.target.classList.contains('hidden'))) return;
      observer.disconnect();
      this.ensureChartRuntime().catch(() => {});
    }, { rootMargin: '240px 0px' });

    targets.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
  },

  /**
   * 載入外部 script，一次只載一次
   * @param {string} key - 快取鍵
   * @param {string} src - script URL
   * @param {string} globalName - 載入後存在的全域變數
   * @returns {Promise<void>}
   */
  loadExternalScript(key, src, globalName) {
    if (globalName && typeof window[globalName] !== 'undefined') {
      return Promise.resolve();
    }

    if (this.externalLoads[key]) {
      return this.externalLoads[key];
    }

    this.externalLoads[key] = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error(`載入失敗：${src}`));
      document.head.appendChild(script);
    });

    return this.externalLoads[key];
  },

  /**
   * 確保圖表引擎已載入
   */
  async ensureChartRuntime() {
    await this.loadExternalScript(
      'chartjs',
      'https://cdn.jsdelivr.net/npm/chart.js@4/dist/chart.umd.min.js',
      'Chart'
    );
    Charts.init();
    Timeline.renderTrendChart();
  },

  /**
   * 確保截圖工具已載入
   */
  async ensureCaptureRuntime() {
    await this.loadExternalScript(
      'html2canvas',
      'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js',
      'html2canvas'
    );
  },

  /**
   * 儲存這次結果到 IndexedDB（帶時間戳，不覆蓋）
   */
  async saveCurrentResult() {
    if (!this.results?.results || this.results.results.length === 0) {
      Toast.error('沒有結果可以儲存');
      return;
    }

    // 加上精確時間戳讓同天的也不會覆蓋
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);
    const saveData = {
      ...this.results,
      scanDate: `${this.results.scanDate || now.toISOString().split('T')[0]} ${now.toTimeString().substring(0, 5)}`
    };

    try {
      await DB.saveFullResults(saveData);
      Toast.success(`結果已儲存（${timestamp}）`);
      // 重新整理時間軸
      Timeline.renderHistory();
    } catch (e) {
      Toast.error('儲存失敗：' + e.message);
    }
  },

  /**
   * 匯出結果圖片 — 截取統計 + 卡片區域，加品牌浮水印
   */
  async exportResultImage() {
    await this.ensureCaptureRuntime();

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
      <div style="font-size: 13px; color: #7a9098; margin-top: 4px;">${Utils.escapeHtml(this.results?.domain || '')} | ${Utils.escapeHtml(this.results?.scanDate || new Date().toISOString().split('T')[0])}</div>
    `;
    container.appendChild(header);

    // 純文字統計（不複製 DOM，避免 canvas 報錯）
    const r = this.results?.results || [];
    const totalCount = new Set(r.map(i => i.url || i.title)).size;
    const aioCount = r.filter(i => i.hasAIO).length;
    const citedCount = r.filter(i => i.isCited).length;
    const rate = r.length > 0 ? Math.round((citedCount / r.length) * 100) : 0;

    const statsRow = document.createElement('div');
    statsRow.style.cssText = 'display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap;';
    const statItems = [
      { label: '總文章', value: totalCount, color: '#c0d4d8' },
      { label: '有 AIO', value: aioCount, color: '#ff6b98' },
      { label: 'AI 推薦我', value: citedCount, color: '#00ff88' },
      { label: '引用率', value: rate + '%', color: '#39c5bb' }
    ];
    statsRow.innerHTML = statItems.map(s =>
      `<div style="flex:1; min-width:120px; padding:12px 16px; background:#0a0e18; border:1px solid rgba(57,197,187,0.15); border-radius:8px; text-align:center;">
        <div style="font-family:Orbitron,monospace; font-size:22px; font-weight:700; color:${s.color};">${s.value}</div>
        <div style="font-size:11px; color:#7a9098; margin-top:4px; letter-spacing:0.5px;">${s.label}</div>
      </div>`
    ).join('');
    container.appendChild(statsRow);

    // 用純 inline style 建結果卡片（避免依賴外部 CSS）
    const grouped = ResultsTable.groupByArticle(r);
    const sorted = ResultsTable.sortGroups(grouped);
    const limit = Math.min(sorted.length, 5);

    if (limit > 0) {
      const cardsWrap = document.createElement('div');
      cardsWrap.style.cssText = 'display: flex; flex-direction: column; gap: 10px;';

      for (let i = 0; i < limit; i++) {
        const g = sorted[i];
        const cited = g.queries.filter(q => q.isCited).length;
        const aio = g.queries.filter(q => q.hasAIO === true).length;
        const noAio = aio === 0 && cited === 0;
        const borderColor = noAio ? 'rgba(255,60,60,0.3)' : cited > 0 ? 'rgba(57,197,187,0.3)' : 'rgba(255,107,152,0.2)';
        const titleColor = noAio ? '#ff4444' : cited > 0 ? '#00ff88' : '#ff6b98';

        const queries = g.queries.map(q => {
          const c = q.isCited ? '#00ff88' : q.hasAIO ? '#ff6b98' : '#555';
          const bg = q.isCited ? 'rgba(0,255,136,0.1)' : q.hasAIO ? 'rgba(255,107,152,0.08)' : 'rgba(85,85,85,0.1)';
          return `<span style="font-size:11px; padding:2px 6px; border-radius:4px; color:${c}; background:${bg}; border:1px solid ${c}33;">${Utils.escapeHtml(q.query)}</span>`;
        }).join(' ');

        const badge = noAio
          ? '<span style="font-size:10px; font-family:monospace; padding:2px 6px; border-radius:4px; background:rgba(255,60,60,0.15); color:#ff4444;">沒有 AI 摘要</span>'
          : `<span style="font-size:10px; font-family:monospace; padding:2px 6px; border-radius:4px; background:rgba(57,197,187,0.12); color:#39c5bb;">${aio + cited}/${g.queries.length} AIO</span>` +
            (cited > 0 ? ` <span style="font-size:10px; font-family:monospace; padding:2px 6px; border-radius:4px; background:rgba(0,255,136,0.12); color:#00ff88;">${cited} 引用</span>` : '');

        cardsWrap.innerHTML += `
          <div style="padding:12px 14px; border:1px solid ${borderColor}; border-radius:8px; background:#0a0e18;">
            <div style="display:flex; justify-content:space-between; align-items:flex-start; gap:8px; margin-bottom:8px;">
              <span style="color:${titleColor}; font-size:13px; font-weight:700; flex:1;">${Utils.escapeHtml(g.title || g.url)}</span>
              <span>${badge}</span>
            </div>
            <div style="display:flex; flex-wrap:wrap; gap:4px;">${queries}</div>
          </div>`;
      }

      if (sorted.length > 5) {
        cardsWrap.innerHTML += `<div style="text-align:center; color:#7a9098; font-size:12px; padding:6px;">...還有 ${sorted.length - 5} 篇</div>`;
      }
      container.appendChild(cardsWrap);
    }

    // 浮水印
    const watermark = document.createElement('div');
    watermark.style.cssText = 'text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid rgba(57,197,187,0.1);';
    watermark.innerHTML = `<span style="font-family: Orbitron, monospace; font-size: 11px; color: #4a5568; letter-spacing: 1px;">Generated by AIO View — lab.helloruru.com/aio-view</span>`;
    container.appendChild(watermark);

    document.body.appendChild(container);

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
   AEO Consultant — App Shell
   平台進入點，管理路由和各功能模組
   ================================================ */

const App = {
  /**
   * 初始化平台
   */
  async init() {
    // 初始化導覽列
    Nav.init();

    // 初始化首頁
    Landing.init();

    // 初始化功能模組
    TechnicalChecker.init();
    SchemaChecker.init();
    CitabilityAnalyzer.init();
    Recommendations.init();
    VisibilityScanner.init();
    CompetitorCompare.init();

    // 註冊路由
    this.registerRoutes();

    // 啟動路由器
    Router.init();
  },

  /**
   * 註冊所有路由
   */
  registerRoutes() {
    // 首頁
    Router.register('/', {
      panelId: 'panel-landing',
      show: () => Landing.show(),
      hide: () => Landing.hide()
    });

    // AIO View（原始功能，延遲初始化）
    Router.register('/aio-view', {
      panelId: 'panel-aio-view',
      init: () => AioViewApp.init(),
      show: () => {},
      hide: () => {}
    });

    // 結構化資料健檢（Phase 1）
    Router.register('/schema', {
      panelId: 'panel-schema',
      show: () => SchemaChecker.show()
    });

    // AI 可引用度分析（Phase 1）
    Router.register('/citability', {
      panelId: 'panel-citability',
      show: () => CitabilityAnalyzer.show()
    });

    // 技術面檢查（Phase 1）
    Router.register('/technical', {
      panelId: 'panel-technical',
      show: () => TechnicalChecker.show()
    });

    // AI 能見度
    Router.register('/visibility', {
      panelId: 'panel-visibility',
      show: () => VisibilityScanner.show()
    });

    // 競品比較
    Router.register('/competitors', {
      panelId: 'panel-competitors',
      show: () => CompetitorCompare.show()
    });

    // 優化建議（Phase 1）
    Router.register('/report', {
      panelId: 'panel-report',
      show: () => Recommendations.show()
    });
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
