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
      this.updateProgress('sitemap', 'done', `找到 Sitemap，正在解析...`);

      // 觸發 sitemap 解析（由各功能模組監聽）
      const event = new CustomEvent('aeo:sitemap-found', {
        detail: { domain: this.domain, sitemapUrl, sourceUrl: url }
      });
      document.dispatchEvent(event);
    } else {
      this.updateProgress('sitemap', 'warn', '找不到 Sitemap，部分功能仍可使用');
      // 即使沒 sitemap，技術面檢查仍然可以跑
      const event = new CustomEvent('aeo:url-entered', {
        detail: { domain: this.domain, sourceUrl: url }
      });
      document.dispatchEvent(event);
    }
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
