/* ================================================
   AIO View — Manual Check Mode
   手動檢查模式：逐篇搜尋 Google，回報 AIO 狀態
   零 CLI、零 API，用瀏覽器直接確認
   支援 Bookmarklet 自動偵測 + BroadcastChannel 回傳
   ================================================ */

const ManualCheck = {
  /** 要檢查的文章清單 */
  articles: [],

  /** 網域 */
  domain: '',

  /** 檢查結果 { articleId: 'cited' | 'aio' | 'none' } */
  checkResults: {},

  /** 目前篩選狀態 */
  currentFilter: 'all',

  /** BroadcastChannel 頻道名稱 */
  CHANNEL_NAME: 'aio-check',

  /** BroadcastChannel 實例 */
  channel: null,

  /** DOM 快取 */
  els: {},

  /**
   * 初始化
   */
  init() {
    this.els = {
      section: document.getElementById('check-section'),
      cards: document.getElementById('check-cards'),
      progressFill: document.getElementById('check-progress-fill'),
      progressText: document.getElementById('check-progress-text'),
      count: document.getElementById('check-count'),
      viewReportBtn: document.getElementById('check-view-report'),
      filterBar: document.getElementById('check-filter-bar'),
      bookmarkletLink: document.getElementById('bookmarklet-link'),
      bookmarkletHint: document.getElementById('bookmarklet-hint')
    };

    this.bindEvents();
  },

  /**
   * 綁定事件
   */
  bindEvents() {
    // 查看報告
    this.els.viewReportBtn?.addEventListener('click', () => {
      this.finishCheck();
    });

    // 篩選按鈕
    this.els.filterBar?.addEventListener('click', (e) => {
      const btn = e.target.closest('.check-filter-btn');
      if (!btn) return;
      this.setFilter(btn.dataset.filter);
    });

    // 卡片事件代理
    this.els.cards?.addEventListener('click', (e) => {
      // 搜尋 Google
      const googleBtn = e.target.closest('.check-google-btn');
      if (googleBtn) {
        const card = googleBtn.closest('.check-card');
        this.openGoogleSearch(card.dataset.id);
        return;
      }

      // 狀態按鈕
      const statusBtn = e.target.closest('.check-status-btn');
      if (statusBtn) {
        const card = statusBtn.closest('.check-card');
        this.setStatus(card.dataset.id, statusBtn.dataset.status);
      }
    });
  },

  /**
   * 顯示手動檢查模式
   * @param {Array} articles - 已選取的文章（有 query 的）
   * @param {string} domain - 網域
   */
  show(articles, domain) {
    this.articles = articles;
    this.domain = domain;

    // 從 Storage 載入進度
    this.checkResults = Storage.get('manual_check', {});

    // 啟動 BroadcastChannel 監聽
    this.initChannel();

    // 更新 Bookmarklet 連結
    this.updateBookmarklet();

    // 渲染卡片
    this.renderCards();
    this.updateProgress();

    // 顯示區塊
    this.els.section?.classList.remove('hidden');

    // 捲動到檢查區塊
    this.els.section?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  },

  /**
   * 隱藏
   */
  hide() {
    this.els.section?.classList.add('hidden');
  },

  /**
   * 重置
   */
  reset() {
    this.articles = [];
    this.domain = '';
    this.checkResults = {};
    this.currentFilter = 'all';
    this.destroyChannel();
    if (this.els.cards) this.els.cards.innerHTML = '';
    this.hide();
  },

  /* ============================================
     Bookmarklet + BroadcastChannel
     ============================================ */

  /**
   * 啟動 BroadcastChannel 監聽
   * 接收 Bookmarklet 從 Google 搜尋頁回傳的 AIO 偵測結果
   */
  initChannel() {
    this.destroyChannel();

    try {
      this.channel = new BroadcastChannel(this.CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data?.t === 'r') {
          this.handleChannelMessage(event.data);
        }
      };
    } catch {
      // BroadcastChannel 不支援（Safari < 15.4）
      console.warn('BroadcastChannel not supported');
    }
  },

  /**
   * 關閉 BroadcastChannel
   */
  destroyChannel() {
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  },

  /**
   * 處理從 Bookmarklet 回傳的訊息
   * @param {Object} data - { t:'r', q:搜尋語句, s:狀態, src:引用來源 }
   */
  handleChannelMessage(data) {
    const query = (data.q || '').trim().toLowerCase();
    if (!query) return;

    // 用搜尋語句比對文章
    const article = this.findArticleByQuery(query);
    if (!article) {
      Toast.info(`收到 Bookmarklet 結果，但找不到對應文章: "${data.q}"`);
      return;
    }

    // 設定狀態
    this.setStatus(article.id, data.s);

    // 顯示通知
    const statusLabel = data.s === 'cited' ? '有 AIO + 已引用'
      : data.s === 'aio' ? '有 AIO 沒引用' : '沒有 AIO';
    Toast.success(`Bookmarklet: ${statusLabel}`);

    // 捲動到該卡片
    const card = this.els.cards?.querySelector(`[data-id="${article.id}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // 短暫高亮
      card.style.boxShadow = '0 0 16px rgba(0, 240, 255, 0.4)';
      setTimeout(() => { card.style.boxShadow = ''; }, 2000);
    }
  },

  /**
   * 用搜尋語句比對文章（模糊比對）
   * @param {string} query - Google 搜尋框的文字（小寫）
   * @returns {Object|null}
   */
  findArticleByQuery(query) {
    // 1. 完全匹配
    let match = this.articles.find(a =>
      (a.query || '').trim().toLowerCase() === query
    );
    if (match) return match;

    // 2. 包含匹配（搜尋語句包含在 Google query 裡，或反過來）
    match = this.articles.find(a => {
      const q = (a.query || '').trim().toLowerCase();
      return q && (query.includes(q) || q.includes(query));
    });

    return match || null;
  },

  /**
   * 產生 Bookmarklet JavaScript 程式碼
   * @returns {string} javascript: URL
   */
  generateBookmarklet() {
    const domain = (this.domain || '').replace(/^www\./, '').toLowerCase();

    // Bookmarklet 程式碼（壓縮版）
    // 功能：偵測 Google 搜尋結果上的 AIO，透過 BroadcastChannel 回傳結果
    const code = `(function(){` +
      `if(!location.hostname.includes('google'))return alert('AIO View: 請在 Google 搜尋結果頁使用');` +
      `var S=['[data-attrid="wa:/description"]','.ILfuVd','[data-async-type="editableDirectAnswer"]','.wDYxhc[data-md]','[jsname="N760b"]','.kp-wholepage-osrp'],a,i;` +
      `for(i=0;i<S.length;i++){a=document.querySelector(S[i]);if(a)break}` +
      `var q=(document.querySelector('textarea[name="q"],input[name="q"]')||{}).value||'';` +
      `var src=[];` +
      `if(a){var ls=a.querySelectorAll('a[href]');for(i=0;i<ls.length;i++){try{src.push(new URL(ls[i].href).hostname.replace(/^www\\./,''))}catch(e){}}}` +
      `var u={};src=src.filter(function(x){return u[x]?0:u[x]=1});` +
      `var D='${domain}';` +
      `var c=!!a&&src.some(function(x){return x.indexOf(D)>=0});` +
      `var st=a?(c?'cited':'aio'):'none';` +
      `try{var ch=new BroadcastChannel('${this.CHANNEL_NAME}');ch.postMessage({t:'r',q:q,s:st,src:src});ch.close()}catch(e){}` +
      `var b=st=='cited'?'linear-gradient(135deg,#00cc66,#00aa88)':st=='aio'?'linear-gradient(135deg,#00c8d4,#0088cc)':'linear-gradient(135deg,#555,#444)';` +
      `var m=st=='cited'?'AIO + 已引用':st=='aio'?'有 AIO 沒引用':'沒有 AIO';` +
      `var d=document.createElement('div');` +
      `d.style.cssText='position:fixed;top:16px;right:16px;z-index:99999;padding:14px 24px;border-radius:12px;font:600 15px/1 sans-serif;color:#fff;background:'+b+';box-shadow:0 4px 20px rgba(0,0,0,0.4);cursor:pointer;display:flex;align-items:center;gap:8px;';` +
      `d.innerHTML='<svg width="18" height="18" viewBox="0 0 32 32" fill="none" stroke="#fff" stroke-width="2.5"><circle cx="13" cy="13" r="6"/><line x1="17" y1="17" x2="24" y2="24" stroke-linecap="round"/><path d="M22 8L25 11L29 6" stroke-linecap="round" stroke-linejoin="round"/></svg> '+m;` +
      `d.onclick=function(){d.remove()};` +
      `document.body.appendChild(d);` +
      `setTimeout(function(){if(d.parentNode)d.remove()},4000)` +
      `})()`;

    return 'javascript:' + encodeURIComponent(code);
  },

  /**
   * 更新 Bookmarklet 連結
   */
  updateBookmarklet() {
    if (!this.els.bookmarkletLink) return;

    const href = this.generateBookmarklet();
    this.els.bookmarkletLink.href = href;

    // 顯示提示
    if (this.els.bookmarkletHint) {
      this.els.bookmarkletHint.textContent = `偵測網域: ${this.domain}`;
    }
  },

  /**
   * 渲染所有卡片
   */
  renderCards() {
    if (!this.els.cards) return;

    this.els.cards.innerHTML = '';
    const fragment = document.createDocumentFragment();

    this.articles.forEach((article, index) => {
      const card = this.createCard(article, index);
      fragment.appendChild(card);
    });

    this.els.cards.appendChild(fragment);
  },

  /**
   * 建立單張檢查卡片
   * @param {Object} article - 文章
   * @param {number} index - 索引
   * @returns {HTMLElement}
   */
  createCard(article, index) {
    const card = document.createElement('div');
    card.className = 'check-card';
    card.dataset.id = article.id;

    const savedStatus = this.checkResults[article.id];
    if (savedStatus) {
      card.classList.add('checked');
    }

    const num = String(index + 1).padStart(2, '0');

    card.innerHTML = `
      <div class="check-card-header">
        <span class="check-card-num">${num}</span>
        <a href="${this.escapeHtml(article.url)}" target="_blank" rel="noopener"
           class="check-card-title">${this.escapeHtml(article.title)}</a>
      </div>
      <div class="check-card-query">
        <span class="check-card-query-text">${this.escapeHtml(article.query)}</span>
      </div>
      <div class="check-card-actions">
        <button class="btn btn-primary btn-sm check-google-btn">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          Google
        </button>
        <div class="check-status-btns">
          <button class="check-status-btn${savedStatus === 'cited' ? ' active' : ''}"
                  data-status="cited" title="有 AIO，且引用了你的文章">
            <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            有引用
          </button>
          <button class="check-status-btn${savedStatus === 'aio' ? ' active' : ''}"
                  data-status="aio" title="有 AIO，但沒引用你的文章">
            <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            有 AIO
          </button>
          <button class="check-status-btn${savedStatus === 'none' ? ' active' : ''}"
                  data-status="none" title="搜尋結果沒有 AI Overview">
            <svg class="status-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            沒有
          </button>
        </div>
      </div>
    `;

    return card;
  },

  /**
   * 開啟 Google 搜尋
   * @param {string} articleId - 文章 ID
   */
  openGoogleSearch(articleId) {
    const article = this.articles.find(a => a.id === articleId);
    if (!article) return;

    const query = article.query || article.title;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=zh-TW`;
    window.open(url, '_blank');
  },

  /**
   * 設定文章的 AIO 狀態
   * @param {string} articleId - 文章 ID
   * @param {string} status - 'cited' | 'aio' | 'none'
   */
  setStatus(articleId, status) {
    // 如果點同一個狀態，取消選取
    if (this.checkResults[articleId] === status) {
      delete this.checkResults[articleId];
    } else {
      this.checkResults[articleId] = status;
    }

    // 存到 localStorage
    Storage.set('manual_check', this.checkResults);

    // 更新卡片視覺
    this.updateCardVisual(articleId);
    this.updateProgress();
  },

  /**
   * 更新單張卡片的視覺狀態
   * @param {string} articleId - 文章 ID
   */
  updateCardVisual(articleId) {
    const card = this.els.cards?.querySelector(`[data-id="${articleId}"]`);
    if (!card) return;

    const status = this.checkResults[articleId];

    // 更新 checked class
    card.classList.toggle('checked', !!status);

    // 更新按鈕 active 狀態
    card.querySelectorAll('.check-status-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === status);
    });
  },

  /**
   * 更新進度條
   */
  updateProgress() {
    const total = this.articles.length;
    const checked = this.articles.filter(a => this.checkResults[a.id]).length;
    const percent = total > 0 ? Math.round((checked / total) * 100) : 0;

    // 進度條
    if (this.els.progressFill) {
      this.els.progressFill.style.width = percent + '%';
    }

    // 文字
    if (this.els.progressText) {
      this.els.progressText.innerHTML = `
        <span class="progress-nums">${checked} / ${total}</span>
        <span>已檢查 ${percent}%</span>
      `;
    }

    // 標題上的 badge
    if (this.els.count) {
      this.els.count.textContent = `${checked}/${total}`;
    }

    // 報告按鈕：至少檢查 1 篇才能用
    if (this.els.viewReportBtn) {
      this.els.viewReportBtn.disabled = checked === 0;
    }
  },

  /**
   * 設定篩選
   * @param {string} filter - 'all' | 'unchecked' | 'cited' | 'aio' | 'none'
   */
  setFilter(filter) {
    this.currentFilter = filter;

    // 更新篩選按鈕 active
    this.els.filterBar?.querySelectorAll('.check-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === filter);
    });

    // 顯示/隱藏卡片
    this.els.cards?.querySelectorAll('.check-card').forEach(card => {
      const id = card.dataset.id;
      const status = this.checkResults[id];
      let show = true;

      if (filter === 'unchecked') show = !status;
      else if (filter === 'cited') show = status === 'cited';
      else if (filter === 'aio') show = status === 'aio';
      else if (filter === 'none') show = status === 'none';

      card.style.display = show ? '' : 'none';
    });
  },

  /**
   * 完成檢查，產生報告
   */
  finishCheck() {
    const results = this.getResults();

    if (results.results.length === 0) {
      Toast.error('還沒有檢查任何文章');
      return;
    }

    // 觸發 onComplete 回呼（由 main.js 設定）
    if (typeof this.onComplete === 'function') {
      this.onComplete(results);
    }
  },

  /**
   * 產生與 CLI 相容的結果格式
   * @returns {Object} 掃描結果
   */
  getResults() {
    const checkedArticles = this.articles.filter(a => this.checkResults[a.id]);

    return {
      scanDate: Utils.formatDate(new Date()),
      domain: this.domain,
      source: 'manual',
      totalArticles: this.articles.length,
      results: checkedArticles.map(article => {
        const status = this.checkResults[article.id];
        return {
          url: article.url,
          title: article.title,
          query: article.query,
          hasAIO: status === 'cited' || status === 'aio',
          isCited: status === 'cited',
          aioSources: []
        };
      })
    };
  },

  /**
   * HTML 逸出
   * @param {string} str
   * @returns {string}
   */
  escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};
