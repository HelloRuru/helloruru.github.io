/* ================================================
   AIO View — Manual Check Mode
   手動檢查 + 自動檢查（Chrome 擴充功能 + BroadcastChannel）
   按一個按鈕，背景自動跑完全部文章
   ================================================ */

const ManualCheck = {
  /** 要檢查的文章清單 */
  articles: [],

  /** 網域 */
  domain: '',

  /** 檢查結果 { articleId: 'cited' | 'aio' | 'none' } */
  checkResults: {},

  /** 處理狀態 { articleId: 'cited' | 'aio' | 'none' | 'timeout' } */
  processStates: {},

  /** 目前篩選狀態 */
  currentFilter: 'all',

  /** BroadcastChannel 頻道名稱 */
  CHANNEL_NAME: 'aio-check',

  /** BroadcastChannel 實例 */
  channel: null,

  /** DOM 快取 */
  els: {},

  /** 自動檢查狀態 */
  autoCheck: {
    active: false,
    currentIndex: 0,
    popup: null,
    timer: null,
    timeoutTimer: null
  },

  /** 自動檢查時間設定（毫秒） */
  AUTO_DELAY_MIN: 1200,
  AUTO_DELAY_MAX: 2200,
  AUTO_TIMEOUT: 6000,

  /** Google 彈窗名稱（同名復用同一個視窗） */
  POPUP_NAME: 'aio-auto-check',

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
      // 自動檢查
      autoStartBtn: document.getElementById('auto-check-start'),
      autoStopBtn: document.getElementById('auto-check-stop'),
      autoStatus: document.getElementById('auto-check-status')
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

    // 開始自動檢查
    this.els.autoStartBtn?.addEventListener('click', () => {
      this.startAutoCheck();
    });

    // 停止自動檢查
    this.els.autoStopBtn?.addEventListener('click', () => {
      this.stopAutoCheck();
      Toast.info('自動檢查已停止');
    });
  },

  /**
   * 顯示手動檢查模式
   * @param {Array} articles - 已選取的文章（有 query 的）
   * @param {string} domain - 網域
   */
  show(articles, domain) {
    this.articles = articles
      .filter(a => a.selected === true && String(a.query || '').trim())
      .map(a => ({ ...a, selected: true }));
    this.domain = domain;

    // 確保每篇文章有唯一 ID（用 URL 當 ID）
    this.articles.forEach(a => {
      if (!a.id) a.id = a.url;
    });

    // 從 Storage 載入進度
    this.checkResults = Storage.get('manual_check', {});
    this.processStates = {};
    this.articles.forEach(a => {
      if (this.checkResults[a.id]) {
        this.processStates[a.id] = this.checkResults[a.id];
      }
    });

    // 啟動 BroadcastChannel 監聽
    this.initChannel();

    // 渲染卡片
    this.renderCards();
    this.updateProgress();
    this.updateAutoCheckUI();

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
    this.processStates = {};
    this.currentFilter = 'all';
    this.stopAutoCheck();
    this.destroyChannel();
    if (this.els.cards) this.els.cards.innerHTML = '';
    this.hide();
  },

  /* ============================================
     BroadcastChannel
     ============================================ */

  /**
   * 啟動 BroadcastChannel 監聽
   */
  initChannel() {
    this.destroyChannel();

    // postMessage 跨域監聽（Chrome 擴充功能從 Google 頁面回傳）
    this._onMessage = (event) => {
      const allowedOrigin =
        /^https:\/\/www\.google\./.test(event.origin) ||
        /^chrome-extension:\/\//.test(event.origin);
      if (!allowedOrigin) return;
      if (event.data?.t === 'r') {
        this.handleChannelMessage(event.data);
      }
    };
    window.addEventListener('message', this._onMessage);

    // 保留 BroadcastChannel 做備援（同域場景）
    try {
      this.channel = new BroadcastChannel(this.CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data?.t === 'r') {
          this.handleChannelMessage(event.data);
        }
      };
    } catch {
      console.warn('BroadcastChannel not supported');
    }
  },

  /**
   * 關閉 BroadcastChannel
   */
  destroyChannel() {
    if (this._onMessage) {
      window.removeEventListener('message', this._onMessage);
      this._onMessage = null;
    }
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  },

  /**
   * 處理回傳訊息（支援 Chrome 擴充功能 + 舊版 bookmarklet 兩種格式）
   * @param {Object} data - { t:'r', q, aio?, s?, src }
   */
  handleChannelMessage(data) {
    const query = (data.q || '').trim().toLowerCase();
    if (!query) return;

    // 判斷狀態（支援兩種格式）
    let status;
    if (data.s) {
      // 舊版 bookmarklet 格式：{ s: 'cited'|'aio'|'none' }
      status = data.s;
    } else {
      // Chrome 擴充功能格式：{ aio: boolean, src: [...] }
      if (!data.aio) {
        status = 'none';
      } else {
        const domain = this.domain.replace(/^www\./, '').toLowerCase();
        const cited = (data.src || []).some(s => s.includes(domain));
        status = cited ? 'cited' : 'aio';
      }
    }

    // 找對應文章
    let article;
    if (this.autoCheck.active && this.autoCheck.currentIndex < this.articles.length) {
      // 自動檢查模式：直接用 index（不靠 query 配對，避免重複 query 撞車）
      article = this.articles[this.autoCheck.currentIndex];
    } else {
      // 手動模式：用 query 比對
      article = this.findArticleByQuery(query);
    }

    if (!article) {
      Toast.info(`收到結果，但找不到對應文章: "${data.q}"`);
      return;
    }

    // 設定狀態
    this.setStatus(article.id, status);

    // 通知
    const label = status === 'cited' ? '有引用' : status === 'aio' ? '有 AIO' : '沒有';
    const shortTitle = article.title.length > 15
      ? article.title.substring(0, 15) + '...'
      : article.title;

    // 自動檢查模式：把相同 query 的文章也一併套用（搜一次用 N 次）
    if (this.autoCheck.active) {
      clearTimeout(this.autoCheck.timeoutTimer);
      const currentQuery = (article.query || '').trim().toLowerCase();
      let duplicateCount = 0;

      if (currentQuery) {
        this.articles.forEach(a => {
          if (a.id === article.id) return;
          if (this.checkResults[a.id]) return;
          if ((a.query || '').trim().toLowerCase() === currentQuery) {
            this.setStatus(a.id, status);
            duplicateCount++;
          }
        });
      }

      if (duplicateCount > 0) {
        Toast.success(`${shortTitle} → ${label}（同 query 共 ${duplicateCount + 1} 篇已套用）`);
      } else {
        Toast.success(`${shortTitle} → ${label}`);
      }

      this.autoCheck.currentIndex++;
      this.scheduleNextAutoCheck();
    } else {
      // 手動模式：捲動到該卡片
      Toast.success(`${shortTitle} → ${label}`);
      const card = this.els.cards?.querySelector(`[data-id="${article.id}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.boxShadow = '0 0 16px rgba(0, 240, 255, 0.4)';
        setTimeout(() => { card.style.boxShadow = ''; }, 2000);
      }
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

    // 2. 包含匹配
    match = this.articles.find(a => {
      const q = (a.query || '').trim().toLowerCase();
      return q && (query.includes(q) || q.includes(query));
    });

    return match || null;
  },

  /* ============================================
     自動檢查
     ============================================ */

  /**
   * 開始自動檢查
   * 背景開 Google 搜尋彈窗，Chrome 擴充功能自動偵測回傳
   */
  startAutoCheck() {
    if (this.articles.length === 0) return;

    // 找第一個未檢查的
    const startIndex = this.articles.findIndex(a => !this.checkResults[a.id]);
    if (startIndex === -1) {
      Toast.info('所有文章都已檢查完畢');
      return;
    }

    this.autoCheck.active = true;
    this.autoCheck.currentIndex = startIndex;

    this.updateAutoCheckUI();
    Toast.success('自動檢查開始！Google 搜尋會在背景視窗跑');

    // 第一次由使用者點擊觸發 window.open，避免被彈窗阻擋
    this.autoCheckNext();
  },

  /**
   * 停止自動檢查
   */
  stopAutoCheck() {
    this.autoCheck.active = false;
    clearTimeout(this.autoCheck.timer);
    clearTimeout(this.autoCheck.timeoutTimer);

    // 嘗試關閉彈窗
    try {
      if (this.autoCheck.popup && !this.autoCheck.popup.closed) {
        this.autoCheck.popup.close();
      }
    } catch (e) { /* 跨域視窗可能無法關閉 */ }
    this.autoCheck.popup = null;

    this.updateAutoCheckUI();
  },

  /**
   * 執行下一篇自動檢查
   */
  autoCheckNext() {
    if (!this.autoCheck.active) return;

    // 跳過已檢查的（含被 duplicate query 套用的）
    while (this.autoCheck.currentIndex < this.articles.length) {
      if (!this.checkResults[this.articles[this.autoCheck.currentIndex].id]) break;
      this.autoCheck.currentIndex++;
    }

    // 全部完成
    if (this.autoCheck.currentIndex >= this.articles.length) {
      this.autoCheck.active = false;
      Toast.success('自動檢查完成！可以查看報告了');
      this.updateAutoCheckUI();

      try {
        if (this.autoCheck.popup && !this.autoCheck.popup.closed) {
          this.autoCheck.popup.close();
        }
      } catch (e) {}
      return;
    }

    const article = this.articles[this.autoCheck.currentIndex];
    const query = article.query || article.title;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=zh-TW`;

    // 同名彈窗復用（不會開一堆分頁）
    try {
      this.autoCheck.popup = window.open(url, this.POPUP_NAME, 'width=1024,height=700');
      if (!this.autoCheck.popup) {
        Toast.error('彈出視窗被阻擋！請允許此網站的彈出視窗，然後重新點「開始自動檢查」');
        this.stopAutoCheck();
        return;
      }
      // 嘗試讓 AIO View 保持前景
      try { window.focus(); } catch (e) {}
    } catch (e) {
      Toast.error('無法開啟 Google 搜尋視窗');
      this.stopAutoCheck();
      return;
    }

    this.updateAutoCheckUI();

    // 高亮目前卡片
    this.highlightCurrentCard();

    // 逾時：沒結果就跳過
    clearTimeout(this.autoCheck.timeoutTimer);
    this.autoCheck.timeoutTimer = setTimeout(() => {
      if (!this.autoCheck.active) return;
      const currentArticle = this.articles[this.autoCheck.currentIndex];
      if (currentArticle) {
        this.processStates[currentArticle.id] = 'timeout';
        this.updateCardVisual(currentArticle.id);
        this.updateProgress();
        this.updateAutoCheckUI();

        const shortTitle = currentArticle.title.length > 15
          ? currentArticle.title.substring(0, 15) + '...'
          : currentArticle.title;
        Toast.info(`${shortTitle} 未收到回傳，先跳過`);
      }
      this.autoCheck.currentIndex++;
      this.scheduleNextAutoCheck();
    }, this.AUTO_TIMEOUT);
  },

  /**
   * 排程下一篇（隨機延遲 8-15 秒，避免觸發 Google 驗證碼）
   */
  scheduleNextAutoCheck() {
    if (!this.autoCheck.active) return;

    const delay = this.AUTO_DELAY_MIN +
      Math.random() * (this.AUTO_DELAY_MAX - this.AUTO_DELAY_MIN);

    this.updateAutoCheckUI();

    this.autoCheck.timer = setTimeout(() => {
      this.autoCheckNext();
    }, delay);
  },

  /**
   * 高亮目前正在檢查的卡片
   */
  highlightCurrentCard() {
    // 清除所有高亮
    this.els.cards?.querySelectorAll('.check-card-active').forEach(c => {
      c.classList.remove('check-card-active');
    });

    // 高亮目前的
    if (this.autoCheck.currentIndex < this.articles.length) {
      const article = this.articles[this.autoCheck.currentIndex];
      const card = this.els.cards?.querySelector(`[data-id="${article.id}"]`);
      if (card) {
        card.classList.add('check-card-active');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  },

  /**
   * 更新自動檢查 UI（按鈕 + 狀態文字）
   */
  updateAutoCheckUI() {
    const { active } = this.autoCheck;
    const total = this.articles.length;
    const checked = this.articles.filter(a => this.checkResults[a.id]).length;
    const processed = this.getProcessedCount();

    // 按鈕狀態
    if (this.els.autoStartBtn) {
      this.els.autoStartBtn.classList.toggle('hidden', active);
    }
    if (this.els.autoStopBtn) {
      this.els.autoStopBtn.classList.toggle('hidden', !active);
    }

    // 狀態文字
    if (this.els.autoStatus) {
      if (active) {
        const current = Math.min(this.autoCheck.currentIndex + 1, total);
        this.els.autoStatus.textContent = `正在檢查 ${current}/${total}...（已回傳 ${checked}，已處理 ${processed}）`;
        this.els.autoStatus.classList.remove('hidden');
      } else if (processed > 0 && processed < total) {
        this.els.autoStatus.textContent = `已停止（已回傳 ${checked}/${total}，已處理 ${processed}/${total}）`;
        this.els.autoStatus.classList.remove('hidden');
      } else if (processed === total && total > 0) {
        this.els.autoStatus.textContent = '全部完成！';
        this.els.autoStatus.classList.remove('hidden');
      } else {
        this.els.autoStatus.classList.add('hidden');
      }
    }
  },

  /* ============================================
     卡片渲染 + 操作
     ============================================ */

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
      delete this.processStates[articleId];
    } else {
      this.checkResults[articleId] = status;
      this.processStates[articleId] = status;
    }

    // 存到 localStorage
    Storage.set('manual_check', this.checkResults);

    // 更新卡片視覺
    this.updateCardVisual(articleId);
    this.updateProgress();
    this.updateAutoCheckUI();
  },

  /**
   * 更新單張卡片的視覺狀態
   * @param {string} articleId - 文章 ID
   */
  updateCardVisual(articleId) {
    const card = this.els.cards?.querySelector(`[data-id="${articleId}"]`);
    if (!card) return;

    const status = this.checkResults[articleId];
    const processState = this.processStates[articleId];

    // 更新 checked class
    card.classList.toggle('checked', !!status);
    card.classList.toggle('check-card-timeout', processState === 'timeout');

    // 更新按鈕 active 狀態
    card.querySelectorAll('.check-status-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.status === status);
    });

    card.title = processState === 'timeout' ? '這篇檢查時未收到擴充功能回傳' : '';
  },

  /**
   * 更新進度條
   */
  updateProgress() {
    const total = this.articles.length;
    const checked = this.articles.filter(a => this.checkResults[a.id]).length;
    const processed = this.getProcessedCount();
    const inFlight = this.autoCheck.active ? 1 : 0;
    const displayCount = Math.min(total, Math.max(processed, this.autoCheck.currentIndex + inFlight));
    const percent = total > 0 ? Math.round((displayCount / total) * 100) : 0;

    // 進度條
    if (this.els.progressFill) {
      this.els.progressFill.style.width = percent + '%';
    }

    // 文字
    if (this.els.progressText) {
      this.els.progressText.innerHTML = `
        <span class="progress-nums">${displayCount} / ${total}</span>
        <span>${this.autoCheck.active ? '處理中' : '已處理'} ${percent}%${processed !== checked ? `（已回傳 ${checked}）` : ''}</span>
      `;
    }

    // 標題上的 badge
    if (this.els.count) {
      this.els.count.textContent = `${displayCount}/${total}`;
    }

    // 報告按鈕：至少處理 1 篇才能用
    if (this.els.viewReportBtn) {
      this.els.viewReportBtn.disabled = processed === 0;
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

    if ((results.results?.length || 0) === 0) {
      Toast.error('還沒有可顯示的檢查結果');
      return;
    }

    // 停止自動檢查（如果還在跑）
    this.stopAutoCheck();

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
    const processedArticles = this.articles.filter(a => this.processStates[a.id]);

    return {
      scanDate: Utils.formatDate(new Date()),
      domain: this.domain,
      source: 'manual',
      totalArticles: this.articles.length,
      results: processedArticles.map(article => {
        const status = this.processStates[article.id];
        return {
          url: article.url,
          title: article.title,
          query: article.query,
          scanStatus: status,
          hasAIO: status === 'timeout' ? null : status === 'cited' || status === 'aio',
          isCited: status === 'cited',
          aioSources: []
        };
      })
    };
  },

  /**
   * 已處理數量（含逾時）
   * @returns {number}
   */
  getProcessedCount() {
    return this.articles.filter(a => !!this.processStates[a.id]).length;
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
