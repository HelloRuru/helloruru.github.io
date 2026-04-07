/* ================================================
   AEO Consultant — Visibility Scanner
   AI 搜尋引擎能見度：Google AIO / Perplexity / Bing Copilot
   ================================================ */

const VisibilityScanner = {
  domain: '',
  articles: [],
  results: {},     // { [articleUrl]: { google: {}, perplexity: {}, bing: {} } }
  platforms: ['google-aio', 'perplexity', 'bing-copilot'],
  activePlatforms: ['google-aio', 'perplexity', 'bing-copilot'],
  popup: null,
  scanning: false,
  currentIndex: 0,
  currentPlatform: 0,

  PLATFORM_LABELS: {
    'google-aio': 'Google AIO',
    'perplexity': 'Perplexity',
    'bing-copilot': 'Bing Copilot'
  },

  PLATFORM_URLS: {
    'google-aio': (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`,
    'perplexity': (q) => `https://www.perplexity.ai/search/new?q=${encodeURIComponent(q)}`,
    'bing-copilot': (q) => `https://www.bing.com/search?q=${encodeURIComponent(q)}`
  },

  POPUP_NAME: 'aeo-visibility-scan',

  init() {
    // 監聯擴充功能回傳的結果
    window.addEventListener('message', (e) => {
      if (e.data?.t === 'r' && e.data?.platform) {
        this._handleResult(e.data);
      }
    });

    const channel = new BroadcastChannel('aio-check');
    channel.addEventListener('message', (e) => {
      if (e.data?.t === 'r' && e.data?.platform) {
        this._handleResult(e.data);
      }
    });
  },

  /**
   * 載入文章清單（從 Landing 或 AIO View 取得）
   */
  loadArticles(domain, articles) {
    this.domain = domain;
    this.articles = articles;
  },

  /**
   * 開始掃描
   */
  startScan() {
    if (this.articles.length === 0) {
      Toast.error('請先在首頁輸入網址分析');
      return;
    }

    this.scanning = true;
    this.currentIndex = 0;
    this.currentPlatform = 0;
    this.results = {};

    this.render();
    this._scanNext();
  },

  stopScan() {
    this.scanning = false;
    this.closePopup();
    this.render();
  },

  _scanNext() {
    if (!this.scanning) return;

    // 掃描順序：每篇文章掃完所有平台，再換下一篇
    if (this.currentPlatform >= this.activePlatforms.length) {
      this.currentPlatform = 0;
      this.currentIndex++;
    }

    if (this.currentIndex >= this.articles.length) {
      this.scanning = false;
      this.closePopup();
      Toast.success('AI 能見度掃描完成！');
      this.render();
      return;
    }

    const article = this.articles[this.currentIndex];
    const platform = this.activePlatforms[this.currentPlatform];
    const query = article.query || article.title || '';

    if (!query) {
      this.currentPlatform++;
      this._scanNext();
      return;
    }

    const url = this.PLATFORM_URLS[platform](query);
    this._openSearch(url);

    // Perplexity 和 Bing 需要更長的等待時間
    const timeout = platform === 'google-aio' ? 8000 : 14000;

    this._waitTimer = setTimeout(() => {
      const key = article.url;
      if (!this.results[key]) this.results[key] = {};
      if (!this.results[key][platform]) {
        this.results[key][platform] = { query, aio: false, src: [], timeout: true };
      }
      this.currentPlatform++;
      this.render();
      this._scanNext();
    }, timeout);
  },

  _handleResult(data) {
    if (!this.scanning) return;

    const article = this.articles[this.currentIndex];
    const platform = this.activePlatforms[this.currentPlatform];

    if (!article) return;

    // 確認平台匹配
    if (data.platform !== platform) return;

    clearTimeout(this._waitTimer);

    const key = article.url;
    if (!this.results[key]) this.results[key] = {};
    this.results[key][platform] = {
      query: data.q,
      aio: data.aio,
      src: data.src || [],
      cited: (data.src || []).some(s => this.domain && s.includes(this.domain)),
      organic: data.organic || []
    };

    this.currentPlatform++;
    this.render();

    // 間隔 1.5 秒再掃下一個平台/文章
    setTimeout(() => this._scanNext(), 1500);
  },

  _openSearch(url) {
    try {
      if (this.popup && !this.popup.closed) {
        try { this.popup.location = url; } catch {
          this.popup = window.open(url, this.POPUP_NAME, 'width=500,height=400,left=0,top=0');
        }
      } else {
        this.popup = window.open(url, this.POPUP_NAME, 'width=500,height=400,left=0,top=0');
      }
      try { window.focus(); } catch {}
    } catch {
      Toast.error('無法開啟搜尋視窗');
      this.stopScan();
    }
  },

  closePopup() {
    try { window.postMessage({ t: 'close-popup' }, location.origin); } catch {}
    if (this.popup && !this.popup.closed) {
      try { this.popup.location = 'about:blank'; } catch {}
      setTimeout(() => {
        try { this.popup?.close(); } catch {}
        this.popup = null;
      }, 300);
    } else {
      this.popup = null;
    }
  },

  render() {
    const panel = document.getElementById('panel-visibility');
    if (!panel) return;

    if (this.articles.length === 0) {
      panel.innerHTML = `<div class="panel-placeholder">
        <h2>AI 搜尋引擎能見度</h2>
        <p style="max-width:600px;margin:0 auto 16px;line-height:1.7;color:var(--color-text);font-size:14px;">
          當消費者用 AI 搜尋你的關鍵字時，哪些 AI 引擎會推薦你的網站？<br>
          這個功能會實際搜尋 Google AI Overview、Perplexity、Bing Copilot 三大 AI 搜尋引擎，<br>
          檢查你的每篇文章有沒有被引用。
        </p>
        <div style="max-width:500px;margin:0 auto;text-align:left;padding:16px 20px;background:var(--bg-card);border:1px solid var(--cyan-12);border-radius:var(--radius-lg);">
          <p style="font-size:13px;color:var(--color-cyan);font-weight:700;margin:0 0 8px;">使用前需要：</p>
          <ol style="font-size:13px;color:var(--color-text);line-height:1.8;margin:0;padding-left:20px;">
            <li>先在首頁輸入網址完成基本分析</li>
            <li>安裝 Chrome 擴充功能 v2.0（免費）</li>
            <li>回到這個頁面，點「開始掃描」</li>
          </ol>
          <p style="font-size:12px;color:var(--color-gray);margin:12px 0 0;">
            掃描原理：用你的瀏覽器實際搜尋，擴充功能偵測 AI 回答裡有沒有引用你的網站。<br>
            完全免費，不需要任何 API key。
          </p>
          <a href="https://github.com/HelloRuru/helloruru.github.io/tree/main/aio-view/chrome-extension" target="_blank"
            class="btn btn-primary btn-sm" style="margin-top:12px;display:inline-block;">下載擴充功能</a>
        </div>
      </div>`;
      return;
    }

    const total = this.articles.length * this.activePlatforms.length;
    const done = Object.values(this.results).reduce((sum, r) => sum + Object.keys(r).length, 0);
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;

    const citedCount = Object.values(this.results).filter(r =>
      Object.values(r).some(p => p.cited)
    ).length;

    panel.innerHTML = `
      <div class="tech-report">
        <!-- 說明區 -->
        <div style="padding:14px 18px;background:var(--cyan-04);border:1px solid var(--cyan-12);border-radius:var(--radius-md);margin-bottom:var(--space-md);font-size:13px;color:var(--color-text);line-height:1.7;">
          <strong style="color:var(--color-cyan);">這是什麼？</strong>
          用你的瀏覽器實際搜尋三大 AI 搜尋引擎，看你的文章有沒有被引用。<br>
          <span style="color:var(--color-green);">引用</span> = AI 回答裡推薦了你的網站，
          <span style="color:var(--color-magenta);">有 AI 回答</span> = AI 有回答但引用的是別人，
          <span style="color:var(--color-gray);">無</span> = 該搜尋沒有 AI 回答。
        </div>

        <div class="tech-score-card">
          <div class="tech-score ${citedCount > 0 ? 'good' : 'warn'}">${citedCount}</div>
          <div>
            <div class="tech-score-label">被 AI 引用的文章數</div>
            <div style="font-size:12px;color:var(--color-gray);margin-top:4px;">${this.articles.length} 篇 x ${this.activePlatforms.length} 平台</div>
          </div>
        </div>

        <div style="display:flex;gap:8px;margin-bottom:var(--space-lg);">
          ${this.scanning
            ? `<button class="btn btn-danger btn-sm" id="vis-stop-btn">停止掃描</button>
               <span style="font-size:13px;color:var(--color-text);align-self:center;">掃描中 ${pct}%</span>`
            : `<button class="btn btn-primary btn-sm" id="vis-start-btn">
                 ${done > 0 ? '重新掃描' : '開始掃描'}
               </button>`
          }
          <button class="btn btn-secondary btn-sm" id="vis-close-btn">關閉搜尋視窗</button>
        </div>

        ${this.articles.length > 0 ? `
          <div class="vis-grid">
            <div class="vis-header">
              <div class="vis-col-url">文章</div>
              ${this.activePlatforms.map(p => `<div class="vis-col-platform">${this.PLATFORM_LABELS[p]}</div>`).join('')}
            </div>
            ${this.articles.map(a => this._renderRow(a)).join('')}
          </div>
        ` : ''}
      </div>
    `;

    // 綁定按鈕
    document.getElementById('vis-start-btn')?.addEventListener('click', () => this.startScan());
    document.getElementById('vis-stop-btn')?.addEventListener('click', () => this.stopScan());
    document.getElementById('vis-close-btn')?.addEventListener('click', () => {
      this.closePopup();
      Toast.info('已關閉搜尋視窗');
    });
  },

  _renderRow(article) {
    const r = this.results[article.url] || {};
    const title = article.title || article.url.replace(/^https?:\/\/[^/]+/, '');

    const cells = this.activePlatforms.map(p => {
      const result = r[p];
      if (!result) return '<div class="vis-cell vis-cell--pending">-</div>';
      if (result.timeout) return '<div class="vis-cell vis-cell--timeout">逾時</div>';
      if (result.cited) return '<div class="vis-cell vis-cell--cited">引用</div>';
      if (result.aio) return '<div class="vis-cell vis-cell--aio">有 AI 回答</div>';
      return '<div class="vis-cell vis-cell--none">無</div>';
    }).join('');

    return `<div class="vis-row">
      <div class="vis-col-url" title="${Utils.escapeHtml(article.url)}">${Utils.escapeHtml(title)}</div>
      ${cells}
    </div>`;
  },

  show() {
    // 嘗試從現有資料載入文章
    if (this.articles.length === 0) {
      const saved = Storage.getArticles();
      if (saved.length > 0) {
        this.domain = localStorage.getItem('aeo_consultant_active_domain') || '';
        this.articles = saved;
      }
    }
    this.render();
  }
};
