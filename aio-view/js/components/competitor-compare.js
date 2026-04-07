/* ================================================
   AEO Consultant — Competitor Compare
   競品比較：同關鍵字，你 vs 競品在 AI 搜尋的能見度
   ================================================ */

const CompetitorCompare = {
  ownDomain: '',
  competitors: [],   // [{ domain, articles }]
  results: {},       // { [query]: { [domain]: { cited, platform, src } } }
  scanning: false,

  init() {
    // 監聽擴充功能回傳
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

  _handleResult(data) {
    if (!this.scanning) return;
    // 分析引用來源，標記哪些 domain 被引用
    const query = data.q;
    if (!this.results[query]) this.results[query] = {};

    const allDomains = [this.ownDomain, ...this.competitors.map(c => c.domain)];
    for (const domain of allDomains) {
      const cited = (data.src || []).some(s => s.includes(domain));
      this.results[query][domain] = {
        cited,
        platform: data.platform,
        src: data.src || []
      };
    }

    this.render();
  },

  render() {
    const panel = document.getElementById('panel-competitors');
    if (!panel) return;

    panel.innerHTML = `
      <div class="tech-report">
        <div style="margin-bottom:var(--space-lg);">
          <h2 style="font-family:var(--font-display);font-size:24px;color:var(--color-cyan);letter-spacing:2px;margin:0 0 8px;">競品比較</h2>
          <p style="font-size:13px;color:var(--color-gray);">輸入你的網站和競品網址，比較同關鍵字下誰更常被 AI 引用</p>
        </div>

        <div class="comp-inputs">
          <div class="comp-input-group">
            <label>我的網站</label>
            <input type="text" id="comp-own-domain" class="comp-input"
              value="${Utils.escapeHtml(this.ownDomain || localStorage.getItem('aeo_consultant_active_domain') || '')}"
              placeholder="example.com">
          </div>
          <div class="comp-input-group">
            <label>競品 1</label>
            <input type="text" id="comp-rival-1" class="comp-input" placeholder="competitor.com">
          </div>
          <div class="comp-input-group">
            <label>競品 2（選填）</label>
            <input type="text" id="comp-rival-2" class="comp-input" placeholder="competitor2.com">
          </div>
          <div class="comp-input-group">
            <label>競品 3（選填）</label>
            <input type="text" id="comp-rival-3" class="comp-input" placeholder="competitor3.com">
          </div>
        </div>

        <div style="margin-top:var(--space-md);">
          <p style="font-size:12px;color:var(--color-gray);margin:0 0 8px;">需要安裝 Chrome 擴充功能 v2.0。掃描會開啟搜尋視窗，逐一比對引用狀態。</p>
          <button class="btn btn-primary btn-sm" id="comp-start-btn">開始比較</button>
        </div>

        ${Object.keys(this.results).length > 0 ? this._renderResults() : ''}
      </div>
    `;

    document.getElementById('comp-start-btn')?.addEventListener('click', () => {
      this._startCompare();
    });
  },

  _startCompare() {
    this.ownDomain = (document.getElementById('comp-own-domain')?.value || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
    this.competitors = [];

    for (let i = 1; i <= 3; i++) {
      const val = (document.getElementById(`comp-rival-${i}`)?.value || '').trim().replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (val) this.competitors.push({ domain: val });
    }

    if (!this.ownDomain) {
      Toast.error('請輸入你的網站網址');
      return;
    }
    if (this.competitors.length === 0) {
      Toast.error('請輸入至少一個競品網址');
      return;
    }

    // 用 AIO View 的文章清單做查詢
    const articles = Storage.getArticles();
    if (articles.length === 0) {
      Toast.error('請先在首頁分析你的網站，取得文章清單');
      return;
    }

    this.scanning = true;
    this.results = {};
    Toast.info(`開始比較 ${articles.length} 個關鍵字...需要安裝擴充功能`);

    // 用 VisibilityScanner 的機制逐個掃描
    // 這裡簡化：只掃 Google AIO（最常見的平台）
    this._scanQueue = articles.filter(a => a.query).map(a => a.query);
    this._scanIndex = 0;
    this._doNextScan();
  },

  _doNextScan() {
    if (this._scanIndex >= this._scanQueue.length || !this.scanning) {
      this.scanning = false;
      if (VisibilityScanner.popup) {
        VisibilityScanner.closePopup();
      }
      Toast.success('競品比較完成！');
      this.render();
      return;
    }

    const query = this._scanQueue[this._scanIndex];
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    VisibilityScanner._openSearch(url);

    this._waitTimer = setTimeout(() => {
      this._scanIndex++;
      this._doNextScan();
    }, 8000);
  },

  _renderResults() {
    const domains = [this.ownDomain, ...this.competitors.map(c => c.domain)];
    const queries = Object.keys(this.results);

    // 統計
    const stats = {};
    for (const d of domains) {
      stats[d] = { cited: 0, total: queries.length };
      for (const q of queries) {
        if (this.results[q]?.[d]?.cited) stats[d].cited++;
      }
    }

    return `
      <div class="tech-section" style="margin-top:var(--space-lg);">
        <h3>比較結果（${queries.length} 個關鍵字）</h3>

        <div class="comp-stats">
          ${domains.map(d => {
            const s = stats[d];
            const pct = s.total > 0 ? Math.round((s.cited / s.total) * 100) : 0;
            const isOwn = d === this.ownDomain;
            return `<div class="comp-stat-card ${isOwn ? 'comp-stat-card--own' : ''}">
              <div class="comp-stat-domain">${isOwn ? '我的網站' : ''} ${Utils.escapeHtml(d)}</div>
              <div class="comp-stat-num">${s.cited}/${s.total}</div>
              <div class="comp-stat-bar"><div class="comp-stat-fill" style="width:${pct}%;background:${isOwn ? 'var(--color-cyan)' : 'var(--color-magenta)'}"></div></div>
              <div class="comp-stat-pct">${pct}% 被引用</div>
            </div>`;
          }).join('')}
        </div>
      </div>
    `;
  },

  show() {
    this.render();
  }
};
