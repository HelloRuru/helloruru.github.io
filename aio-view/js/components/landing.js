/* ================================================
   AEO Consultant — Landing Page Component
   首頁：URL 輸入 + 功能卡片
   ================================================ */

const Landing = {
  /** 目前分析的網域 */
  domain: '',

  /** 各功能狀態 */
  featureStatus: {},

  /** 功能定義 */
  FEATURES: [
    {
      id: 'aio-view',
      route: '/aio-view',
      icon: 'search-check',
      title: 'AIO 監測',
      desc: '單篇文章是否出現在 Google AI Overview',
      phase: 1,
      category: 'scan'
    },
    {
      id: 'schema',
      route: '/schema',
      icon: 'code',
      title: '結構化資料',
      desc: '掃描全站 Schema Markup，找出缺漏和錯誤',
      phase: 1,
      category: 'audit'
    },
    {
      id: 'citability',
      route: '/citability',
      icon: 'quote',
      title: 'AI 可引用度',
      desc: '頁面內容結構是否容易被 AI 引擎擷取引用',
      phase: 1,
      category: 'audit'
    },
    {
      id: 'technical',
      route: '/technical',
      icon: 'settings',
      title: '技術面檢查',
      desc: 'robots.txt、Sitemap 完整度、AI 爬蟲封鎖偵測',
      phase: 1,
      category: 'audit'
    },
    {
      id: 'visibility',
      route: '/visibility',
      icon: 'eye',
      title: 'AI 能見度',
      desc: 'Google、Perplexity、Bing Copilot 跨平台引用偵測',
      phase: 2,
      category: 'scan'
    },
    {
      id: 'competitors',
      route: '/competitors',
      icon: 'users',
      title: '競品比較',
      desc: '同關鍵字下，你的站 vs 競品在 AI 搜尋的能見度',
      phase: 2,
      category: 'scan'
    }
  ],

  /**
   * 初始化
   */
  init() {
    this.bindEvents();
    this.renderFeatureCards();
    this.loadSavedStatus();
  },

  /**
   * 綁定事件
   */
  bindEvents() {
    const input = document.getElementById('landing-url');
    const btn = document.getElementById('landing-analyze-btn');

    if (btn) {
      btn.addEventListener('click', () => this.startAnalysis());
    }

    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') this.startAnalysis();
      });
    }
  },

  /**
   * 開始分析
   */
  async startAnalysis() {
    const input = document.getElementById('landing-url');
    const raw = (input?.value || '').trim();
    if (!raw) {
      Toast.error('請輸入網站網址');
      return;
    }

    // 正規化 URL
    let url = raw;
    if (!url.startsWith('http')) url = 'https://' + url;

    // 提取域名
    try {
      const parsed = new URL(url);
      this.domain = parsed.hostname;
    } catch {
      Toast.error('網址格式不正確');
      return;
    }

    // 儲存到 localStorage
    localStorage.setItem('aeo_consultant_active_domain', this.domain);

    // 顯示進度
    this.showProgress();

    // 自動找 sitemap
    const sitemapUrl = await this.discoverSitemap(url);

    if (sitemapUrl) {
      Toast.success(`找到 Sitemap：${sitemapUrl}`);
      this.updateProgress('sitemap', 'done', `找到 Sitemap`);

      // 自動餵給 AIO View 的 Sitemap 輸入框
      this._feedSitemapToAioView(sitemapUrl);

      // 觸發 sitemap 解析（由各功能模組監聽）
      const event = new CustomEvent('aeo:sitemap-found', {
        detail: { domain: this.domain, sitemapUrl, sourceUrl: url }
      });
      document.dispatchEvent(event);
    } else {
      // 沒有 sitemap → 自動爬連結產生
      this.updateProgress('sitemap', 'warn', '找不到 Sitemap，正在自動爬取頁面連結...');
      const generated = await this.generateSitemapFromCrawl(url);

      if (generated && generated.urls.length > 0) {
        Toast.success(`從網站爬到 ${generated.urls.length} 個頁面，已自動產生 Sitemap`);
        this.updateProgress('sitemap', 'done', `自動產生 Sitemap（${generated.urls.length} 頁）`);

        // 顯示複製/下載 sitemap 按鈕
        this._showSitemapActions(generated.sitemapXml);

        // 餵給 AIO View
        this._feedArticlesToAioView(generated.articles);

        // 觸發事件讓其他功能模組用
        const event = new CustomEvent('aeo:sitemap-generated', {
          detail: { domain: this.domain, articles: generated.articles, sourceUrl: url }
        });
        document.dispatchEvent(event);
      } else {
        this.updateProgress('sitemap', 'error', '無法爬取頁面連結');
      }

      // 技術面檢查不需要 sitemap
      const techEvent = new CustomEvent('aeo:url-entered', {
        detail: { domain: this.domain, sourceUrl: url }
      });
      document.dispatchEvent(techEvent);
    }
  },

  /**
   * 自動餵 sitemap URL 給 AIO View
   */
  _feedSitemapToAioView(sitemapUrl) {
    const input = document.getElementById('sitemap-url');
    if (input) {
      input.value = sitemapUrl;
    }
  },

  /**
   * 自動餵文章清單給 AIO View
   */
  _feedArticlesToAioView(articles) {
    if (typeof AioViewApp !== 'undefined' && AioViewApp.handleSitemapParsed) {
      AioViewApp.handleSitemapParsed({
        domain: this.domain,
        articles: articles
      });
    }
  },

  /**
   * 爬首頁連結產生 sitemap
   * @param {string} baseUrl - 首頁 URL
   * @returns {Object|null} { urls, articles }
   */
  async generateSitemapFromCrawl(baseUrl) {
    const origin = new URL(baseUrl).origin;
    const visited = new Set();
    const found = [];
    const queue = [baseUrl];
    const MAX_PAGES = 50; // 限制爬取數量
    const MAX_DEPTH = 2;  // 最多爬 2 層

    // BFS 爬取
    let depth = 0;
    while (queue.length > 0 && found.length < MAX_PAGES && depth <= MAX_DEPTH) {
      const batch = queue.splice(0, queue.length);
      const nextQueue = [];

      for (const pageUrl of batch) {
        if (visited.has(pageUrl) || found.length >= MAX_PAGES) continue;
        visited.add(pageUrl);

        try {
          const html = await Sitemap.fetchProxyContent(pageUrl);
          if (!html) continue;

          found.push(pageUrl);

          // 提取內部連結
          const parser = new DOMParser();
          const doc = parser.parseFromString(html, 'text/html');
          doc.querySelectorAll('a[href]').forEach(a => {
            try {
              const href = new URL(a.href, pageUrl).href;
              // 只要同 origin、不是錨點、不是檔案
              if (href.startsWith(origin) &&
                  !href.includes('#') &&
                  !visited.has(href) &&
                  !/\.(jpg|png|gif|svg|pdf|zip|css|js)(\?|$)/i.test(href)) {
                nextQueue.push(href);
              }
            } catch { /* 忽略無效 URL */ }
          });

          this.updateProgress('sitemap', 'running',
            `爬取中... 已找到 ${found.length} 個頁面`);

        } catch { /* 繼續下一個 */ }
      }

      queue.push(...nextQueue);
      depth++;
    }

    if (found.length === 0) return null;

    // 過濾成文章格式（跟 Sitemap.filterArticles 類似的邏輯）
    const articles = found
      .filter(url => {
        const path = new URL(url).pathname;
        // 排除首頁、分類頁、分頁等
        return path !== '/' &&
          !/\/(page|category|tag|author|privacy|terms|contact|about)\b/i.test(path) &&
          !/\.(xml|json|txt)$/i.test(path);
      })
      .map(url => ({
        url,
        title: '',
        query: '',
        selected: true
      }));

    // 產生 sitemap.xml 內容
    const sitemapXml = this._buildSitemapXml(found);

    return { urls: found, articles, sitemapXml };
  },

  /**
   * 產生 sitemap.xml 字串
   * @param {Array<string>} urls
   * @returns {string}
   */
  _buildSitemapXml(urls) {
    const today = new Date().toISOString().split('T')[0];
    const entries = urls.map(url =>
      `  <url>\n    <loc>${url}</loc>\n    <lastmod>${today}</lastmod>\n  </url>`
    ).join('\n');

    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries}\n</urlset>`;
  },

  /**
   * 顯示 sitemap 複製/下載按鈕
   * @param {string} xml - sitemap.xml 內容
   */
  _showSitemapActions(xml) {
    const el = document.getElementById('landing-progress');
    if (!el) return;

    // 儲存供後續使用
    this._generatedSitemapXml = xml;

    const div = document.createElement('div');
    div.className = 'landing-sitemap-actions';
    div.innerHTML = `
      <p style="font-size:13px;color:var(--color-cyan);margin:0 0 8px;">你的網站沒有 sitemap.xml，我們幫你產生了一份：</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;">
        <button class="btn btn-primary btn-sm" id="copy-sitemap-btn">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/>
          </svg>
          複製 sitemap.xml
        </button>
        <button class="btn btn-secondary btn-sm" id="download-sitemap-btn">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          下載 sitemap.xml
        </button>
      </div>
    `;
    el.appendChild(div);

    document.getElementById('copy-sitemap-btn')?.addEventListener('click', () => {
      Utils.copyToClipboard(xml).then(ok => {
        if (ok) Toast.success('sitemap.xml 已複製，貼到你的網站根目錄');
      });
    });

    document.getElementById('download-sitemap-btn')?.addEventListener('click', () => {
      const blob = new Blob([xml], { type: 'application/xml' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sitemap.xml';
      a.click();
      URL.revokeObjectURL(a.href);
      Toast.success('sitemap.xml 已下載');
    });
  },

  /**
   * 自動找 sitemap
   * @param {string} baseUrl - 網站 URL
   * @returns {string|null} sitemap URL
   */
  async discoverSitemap(baseUrl) {
    const parsed = new URL(baseUrl);
    const origin = parsed.origin;

    // 如果使用者直接貼 sitemap URL
    if (baseUrl.includes('sitemap') && baseUrl.endsWith('.xml')) {
      return baseUrl;
    }

    // 嘗試常見 sitemap 路徑
    const candidates = [
      origin + '/sitemap.xml',
      origin + '/sitemap_index.xml',
      origin + '/wp-sitemap.xml',
      origin + '/post-sitemap.xml'
    ];

    for (const url of candidates) {
      try {
        const response = await Sitemap.fetchProxyContent(url);
        if (response && response.includes('<urlset') || response.includes('<sitemapindex')) {
          return url;
        }
      } catch {
        // 繼續嘗試下一個
      }
    }

    // 最後嘗試從 robots.txt 找
    try {
      const robotsUrl = origin + '/robots.txt';
      const robotsText = await Sitemap.fetchProxyContent(robotsUrl);
      if (robotsText) {
        const match = robotsText.match(/Sitemap:\s*(https?:\/\/\S+)/i);
        if (match) return match[1];
      }
    } catch {
      // 忽略
    }

    return null;
  },

  /**
   * 顯示進度區塊
   */
  showProgress() {
    const el = document.getElementById('landing-progress');
    if (el) {
      el.classList.remove('hidden');
      el.innerHTML = `
        <div class="progress-item" data-step="sitemap">
          <span class="progress-icon spinning">&#9696;</span>
          <span>正在尋找 Sitemap...</span>
        </div>
      `;
    }
  },

  /**
   * 更新進度項目
   * @param {string} step - 步驟 ID
   * @param {string} status - 'done' | 'warn' | 'error' | 'running'
   * @param {string} text - 顯示文字
   */
  updateProgress(step, status, text) {
    const el = document.getElementById('landing-progress');
    if (!el) return;

    const item = el.querySelector(`[data-step="${step}"]`);
    if (item) {
      const iconMap = { done: '&#10003;', warn: '&#9888;', error: '&#10007;', running: '&#9696;' };
      const classMap = { done: 'done', warn: 'warn', error: 'error', running: 'spinning' };
      item.innerHTML = `
        <span class="progress-icon ${classMap[status] || ''}">${iconMap[status] || ''}</span>
        <span>${text}</span>
      `;
    }
  },

  /**
   * 加入進度項目
   * @param {string} step - 步驟 ID
   * @param {string} text - 顯示文字
   */
  addProgress(step, text) {
    const el = document.getElementById('landing-progress');
    if (!el) return;

    const div = document.createElement('div');
    div.className = 'progress-item';
    div.dataset.step = step;
    div.innerHTML = `
      <span class="progress-icon spinning">&#9696;</span>
      <span>${text}</span>
    `;
    el.appendChild(div);
  },

  /**
   * 渲染功能卡片
   */
  renderFeatureCards() {
    const grid = document.getElementById('landing-features');
    if (!grid) return;

    grid.innerHTML = this.FEATURES.map(f => {
      const phaseTag = f.phase === 2
        ? '<span class="feature-phase">Phase 2</span>'
        : '';
      const disabledClass = f.phase === 2 ? 'feature-card--phase2' : '';

      return `
        <a href="#${f.route}" class="feature-card ${disabledClass}" data-feature="${f.id}">
          <div class="feature-card-icon">
            ${this.getIcon(f.icon)}
          </div>
          <div class="feature-card-body">
            <h3>${f.title} ${phaseTag}</h3>
            <p>${f.desc}</p>
          </div>
          <div class="feature-card-score hidden" data-score-for="${f.id}"></div>
        </a>
      `;
    }).join('');
  },

  /**
   * 更新功能卡片分數
   * @param {string} featureId - 功能 ID
   * @param {string} scoreText - 顯示文字（如 'B+' 或 '72/100'）
   * @param {string} scoreClass - 樣式（'good' | 'warn' | 'bad'）
   */
  updateFeatureScore(featureId, scoreText, scoreClass) {
    const el = document.querySelector(`[data-score-for="${featureId}"]`);
    if (el) {
      el.textContent = scoreText;
      el.className = `feature-card-score ${scoreClass}`;
      el.classList.remove('hidden');
    }
    this.featureStatus[featureId] = { score: scoreText, class: scoreClass };
    localStorage.setItem('aeo_consultant_feature_status', JSON.stringify(this.featureStatus));
  },

  /**
   * 載入已儲存的狀態
   */
  loadSavedStatus() {
    const saved = localStorage.getItem('aeo_consultant_active_domain');
    if (saved) {
      this.domain = saved;
      const input = document.getElementById('landing-url');
      if (input) input.value = saved;
    }

    try {
      const status = JSON.parse(localStorage.getItem('aeo_consultant_feature_status') || '{}');
      this.featureStatus = status;
      Object.entries(status).forEach(([id, s]) => {
        this.updateFeatureScore(id, s.score, s.class);
      });
    } catch {
      // 忽略
    }
  },

  /**
   * 取得 SVG icon
   * @param {string} name - icon 名稱
   * @returns {string} SVG HTML
   */
  getIcon(name) {
    const icons = {
      'search-check': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M8 11l2 2 4-4"/></svg>',
      'code': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
      'quote': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21z"/><path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3z"/></svg>',
      'settings': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"/></svg>',
      'eye': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
      'users': '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>'
    };
    return icons[name] || '';
  },

  /**
   * 顯示
   */
  show() {
    // 首頁顯示時可以做的事
  },

  /**
   * 隱藏
   */
  hide() {
    // 首頁隱藏時可以做的事
  }
};
