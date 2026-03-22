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

  /** 引用來源 { articleId: string[] } */
  checkSources: {},

  /** 目前篩選狀態 */
  currentFilter: 'all',

  /** BroadcastChannel 頻道名稱 */
  CHANNEL_NAME: 'aio-check',

  /** BroadcastChannel 實例 */
  channel: null,

  /** 最近一次處理的訊息，用來擋掉 postMessage + BroadcastChannel 的重複回傳 */
  lastHandledMessage: {
    key: '',
    at: 0
  },

  /** 最近一次處理的除錯訊息 */
  lastDebugMessage: {
    key: '',
    at: 0
  },

  /** 除錯訊息 */
  debugLogs: [],
  DEBUG_LOG_LIMIT: 12,

  /** DOM 快取 */
  els: {},

  /** Google 搜尋彈窗（獨立存，不隨自動檢查結束而清掉） */
  popup: null,

  /** 自動檢查狀態 */
  autoCheck: {
    active: false,
    currentIndex: 0,
    timer: null,
    timeoutTimer: null
  },

  /** 自動檢查時間設定（毫秒） */
  AUTO_DELAY_MIN: 9000,
  AUTO_DELAY_MAX: 14000,
  AUTO_TIMEOUT: 20000,

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
      autoCloseBtn: document.getElementById('auto-check-close-popup'),
      autoStatus: document.getElementById('auto-check-status'),
      autoProgress: document.getElementById('auto-check-progress'),
      autoProgressFill: document.getElementById('auto-check-progress-fill'),
      autoProgressText: document.getElementById('auto-check-progress-text')
    };

    this.ensureDebugPanel();
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
      this.stopAutoCheck({ closePopup: true });
      Toast.info('自動檢查已停止，並關閉 Google 搜尋視窗');
    });

    // 手動關閉 Google 搜尋視窗
    this.els.autoCloseBtn?.addEventListener('click', () => {
      if (this.autoCheck.active) {
        this.stopAutoCheck({ closePopup: true });
        Toast.info('已停止自動檢查，並關閉 Google 搜尋視窗');
        return;
      }

      this.closePopup();
      Toast.info('已關閉 Google 搜尋視窗');
    });
  },

  /**
   * 顯示手動檢查模式
   * @param {Array} articles - 已選取的文章（有 query 的）
   * @param {string} domain - 網域
   */
  show(articles, domain) {
    const selected = articles
      .filter(a => a.selected === true && String(a.query || '').trim())
      .map(a => ({ ...a, selected: true }));
    this.domain = domain;

    // 展開每篇文章的多面向變體
    this.tasks = [];
    this.articleGroups = new Map();

    selected.forEach(a => {
      const articleKey = a.url || a.title;
      const variants = QueryEngine.generateVariants(a, domain);

      if (!this.articleGroups.has(articleKey)) {
        this.articleGroups.set(articleKey, {
          articleKey,
          title: a.title,
          url: a.url,
          taskIds: []
        });
      }
      const group = this.articleGroups.get(articleKey);

      variants.forEach(v => {
        const taskId = `${articleKey}::${v.facetKey}::${v.query}`;
        group.taskIds.push(taskId);
        this.tasks.push({
          id: taskId,
          articleKey,
          url: a.url,
          title: a.title,
          query: v.query,
          baseQuery: v.baseQuery,
          facetKey: v.facetKey,
          facetLabel: v.facetLabel
        });
      });
    });

    // this.articles 指向展開後的任務清單（自動檢查流程用）
    this.articles = this.tasks;

    // 從 Storage 載入進度
    this.checkResults = Storage.get('manual_check', {});
    this.processStates = {};
    this.articles.forEach(a => {
      if (this.checkResults[a.id]) {
        this.processStates[a.id] = this.checkResults[a.id];
      }
    });
    this.debugLogs = [];
    this.renderDebugLogs();

    // 啟動 BroadcastChannel 監聽
    this.initChannel();

    // 渲染卡片（群組模式）
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
    this.tasks = [];
    this.articleGroups = new Map();
    this.domain = '';
    this.checkResults = {};
    this.processStates = {};
    this.checkSources = {};
    this.currentFilter = 'all';
    this.lastHandledMessage = { key: '', at: 0 };
    this.lastDebugMessage = { key: '', at: 0 };
    this.debugLogs = [];
    this.stopAutoCheck({ closePopup: true });
    this.destroyChannel();
    if (this.els.cards) this.els.cards.innerHTML = '';
    this.renderDebugLogs();
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
        /^chrome-extension:\/\//.test(event.origin) ||
        event.origin === window.location.origin;
      if (!allowedOrigin) return;
      if (event.data?.t === 'r') {
        this.handleChannelMessage(event.data);
      } else if (event.data?.t === 'dbg') {
        this.handleDebugMessage(event.data);
      }
    };
    window.addEventListener('message', this._onMessage);

    // 保留 BroadcastChannel 做備援（同域場景）
    try {
      this.channel = new BroadcastChannel(this.CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        if (event.data?.t === 'r') {
          this.handleChannelMessage(event.data);
        } else if (event.data?.t === 'dbg') {
          this.handleDebugMessage(event.data);
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
    const domain = this.domain.replace(/^www\./, '').toLowerCase();

    if (data.s) {
      // 舊版 bookmarklet 格式：{ s: 'cited'|'aio'|'none' }
      status = data.s;
    } else {
      // Chrome 擴充功能格式：{ aio: boolean, src: [...], organic: [...] }
      if (!data.aio) {
        status = 'none';
      } else {
        const cited = (data.src || []).some(s => s.includes(domain));
        status = cited ? 'cited' : 'aio';
      }
    }

    // 偵測一般搜尋排名（前 20 名）
    let organicRank = null;
    if (Array.isArray(data.organic)) {
      const match = data.organic.find(r => r.host && r.host.includes(domain));
      organicRank = match ? match.rank : -1; // -1 = 不在前 20 名
    }

    const messageKey = JSON.stringify({
      query,
      status,
      src: Array.isArray(data.src) ? [...data.src].sort() : []
    });
    const now = Date.now();
    if (
      this.lastHandledMessage.key === messageKey &&
      now - this.lastHandledMessage.at < 2500
    ) {
      return;
    }
    this.lastHandledMessage = { key: messageKey, at: now };
    this.logDebug(`收到結果：${data.q} -> ${status}`);

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

    // 設定狀態 + 存引用來源 + 排名
    this.setStatus(article.id, status, { toggle: false });
    if (Array.isArray(data.src) && data.src.length > 0) {
      this.checkSources[article.id] = data.src;
    }
    if (organicRank !== null) {
      if (!this.organicRanks) this.organicRanks = {};
      this.organicRanks[article.id] = organicRank;
    }
    // 存 Google 相關搜尋
    if (Array.isArray(data.related) && data.related.length > 0) {
      if (!this.relatedSearches) this.relatedSearches = {};
      this.relatedSearches[article.id] = data.related;
    }

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
            this.setStatus(a.id, status, { toggle: false });
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
      this.updateProgress();
      if (this.autoCheck.currentIndex >= this.articles.length) {
        this.autoCheckNext();
      } else {
        this.scheduleNextAutoCheck();
      }
    } else {
      // 手動模式：捲動到該卡片
      Toast.success(`${shortTitle} → ${label}`);
      const card = this.els.cards?.querySelector(`[data-id="${article.id}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.style.boxShadow = '0 0 16px rgba(57, 197, 187, 0.4)';
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
  startAutoCheck(forceRestart = false) {
    if (this.articles.length === 0) return;

    // 強制重新檢查：清除所有結果
    if (forceRestart) {
      this.checkResults = {};
      this.processStates = {};
      this.organicRanks = {};
      this.checkSources = {};
      Storage.set('manual_check', {});
      this.articles.forEach(a => this.updateCardVisual(a.id));
      this.updateProgress();
      Toast.info('已清除結果，重新開始檢查');
      this.logDebug('重新檢查：已清除所有結果');
    }

    // 找第一個未檢查的
    const startIndex = this.articles.findIndex(a => !this.checkResults[a.id]);
    if (startIndex === -1) {
      // 全部都檢查過了，改成重新檢查
      this.startAutoCheck(true);
      return;
    }

    this.autoCheck.active = true;
    this.autoCheck.currentIndex = startIndex;
    this.autoCheck.retried = false;

    this.updateAutoCheckUI();
    this.updateProgress();
    this.logDebug(`開始自動檢查，起點 ${startIndex + 1}/${this.articles.length}`);
    Toast.success('自動檢查開始！Google 搜尋會在背景視窗跑');

    // 第一次由使用者點擊觸發 window.open，避免被彈窗阻擋
    this.autoCheckNext();
  },

  /**
   * 關閉 Google 搜尋彈窗
   */
  closePopup() {
    // 透過擴充功能強制關閉 Google 搜尋分頁
    try {
      window.postMessage({ t: 'close-popup' }, location.origin);
    } catch (e) {}

    if (this.popup && !this.popup.closed) {
      try {
        this.popup.close();
      } catch (e) {}
    }

    this.popup = null;
  },

  /**
   * 停止自動檢查
   */
  stopAutoCheck(options = {}) {
    const { closePopup = false } = options;

    this.autoCheck.active = false;
    clearTimeout(this.autoCheck.timer);
    clearTimeout(this.autoCheck.timeoutTimer);
    this.autoCheck.timer = null;
    this.autoCheck.timeoutTimer = null;

    if (closePopup) {
      this.closePopup();
    }

    this.updateAutoCheckUI();
    this.updateProgress();
    this.logDebug('自動檢查已停止');
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
      // 檢查有沒有未回傳的，第一輪結束後自動重試一次
      const timeoutIds = this.articles
        .filter(a => this.processStates[a.id] === 'timeout' && !this.checkResults[a.id])
        .map(a => a.id);

      if (timeoutIds.length > 0 && !this.autoCheck.retried) {
        this.autoCheck.retried = true;
        this.logDebug(`${timeoutIds.length} 篇未回傳，自動重試中...`);
        Toast.info(`${timeoutIds.length} 篇未回傳，自動重試一次`);

        // 清除 timeout 狀態，重設 index 讓它重跑
        timeoutIds.forEach(id => { delete this.processStates[id]; });
        this.autoCheck.currentIndex = 0;
        this.updateAutoCheckUI();
        this.scheduleNextAutoCheck();
        return;
      }

      this.autoCheck.active = false;
      this.autoCheck.retried = false;
      clearTimeout(this.autoCheck.timer);
      clearTimeout(this.autoCheck.timeoutTimer);

      // 關閉 Google 搜尋彈窗（透過擴充功能）
      this.closePopup();

      const checked = this.articles.filter(a => this.checkResults[a.id]).length;
      const total = this.articles.length;
      Toast.success(`自動檢查完成！${checked}/${total} 個查詢有結果，可以查看報告`);
      this.updateAutoCheckUI();
      this.updateProgress();
      this.logDebug('自動檢查流程完成');

      // 瀏覽器桌面通知（如果有權限）
      if (Notification?.permission === 'granted') {
        new Notification('AIO View 檢查完成', {
          body: `${checked}/${total} 個查詢有結果`,
          icon: '/aio-view/icons/icon-192.svg'
        });
      }

      // 自動產生報告並捲到結果區
      setTimeout(() => {
        this.finishCheck();
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) {
          resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 800);
      return;
    }

    const article = this.articles[this.autoCheck.currentIndex];
    const query = article.query || article.title;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=zh-TW&num=20`;
    this.logDebug(`開啟 Google：${query}`);

    // 只開一個彈窗，之後用 location 換頁（不重開）
    try {
      if (this.popup && !this.popup.closed) {
        // 已有彈窗，直接換網址
        try {
          this.popup.location = url;
        } catch (e) {
          // 跨域 location 寫入失敗才重開
          this.popup = window.open(url, this.POPUP_NAME, 'width=420,height=320,left=0,top=0');
        }
      } else {
        // 第一次才開新彈窗
        this.popup = window.open(url, this.POPUP_NAME, 'width=420,height=320,left=0,top=0');
      }
      if (!this.popup) {
        Toast.error('彈出視窗被阻擋！請允許此網站的彈出視窗，然後重新點「開始自動檢查」');
        this.stopAutoCheck();
        return;
      }
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
        this.logDebug(`逾時未回傳：${currentArticle.query || currentArticle.title}`);
      }
      this.autoCheck.currentIndex++;
      this.updateProgress();
      if (this.autoCheck.currentIndex >= this.articles.length) {
        this.autoCheckNext();
      } else {
        this.scheduleNextAutoCheck();
      }
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
    this.updateProgress();

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

    // 按鈕狀態 + 文字切換
    const allDone = !active && processed === total && total > 0;
    if (this.els.autoStartBtn) {
      this.els.autoStartBtn.classList.toggle('hidden', active);
      // 完成後按鈕改成「重新檢查」
      const label = this.els.autoStartBtn.querySelector('.auto-start-label');
      if (label) {
        label.textContent = allDone ? '重新檢查' : '開始自動檢查';
      }
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

    // 進度條
    if (this.els.autoProgress) {
      if (active || (processed > 0 && total > 0)) {
        const pct = total > 0 ? Math.round((processed / total) * 100) : 0;
        this.els.autoProgress.classList.remove('hidden');
        if (this.els.autoProgressFill) {
          this.els.autoProgressFill.style.width = pct + '%';
        }
        if (this.els.autoProgressText) {
          this.els.autoProgressText.textContent = `${processed}/${total} (${pct}%)`;
        }
      } else {
        this.els.autoProgress.classList.add('hidden');
      }
    }
  },

  handleDebugMessage(data) {
    const messageKey = JSON.stringify({
      stage: data.stage || '',
      q: data.q || '',
      note: data.note || ''
    });
    const now = Date.now();
    if (
      this.lastDebugMessage.key === messageKey &&
      now - this.lastDebugMessage.at < 2500
    ) {
      return;
    }
    this.lastDebugMessage = { key: messageKey, at: now };

    const stage = data.stage || 'debug';
    const detail = [data.q, data.note].filter(Boolean).join(' | ');
    this.logDebug(`[EXT] ${stage}${detail ? `：${detail}` : ''}`);
  },

  ensureDebugPanel() {
    if (document.getElementById('auto-check-debug')) {
      this.els.debugPanel = document.getElementById('auto-check-debug');
      return;
    }

    const panel = document.createElement('div');
    panel.id = 'auto-check-debug';
    panel.style.cssText = [
      'margin-top:12px',
      'padding:12px 14px',
      'border:1px solid rgba(57,197,187,.18)',
      'border-radius:12px',
      'background:rgba(8,14,28,.72)',
      'font:12px/1.5 "JetBrains Mono","Noto Sans TC",monospace',
      'color:#98e7ff',
      'white-space:pre-wrap',
      'word-break:break-word',
      'display:none'
    ].join(';');

    const title = document.createElement('div');
    title.textContent = '除錯訊號';
    title.style.cssText = 'margin-bottom:8px;color:#d7f7ff;font-weight:700;';

    const body = document.createElement('div');
    body.id = 'auto-check-debug-body';
    body.textContent = '尚未收到訊號';

    panel.appendChild(title);
    panel.appendChild(body);
    this.els.section?.appendChild(panel);
    this.els.debugPanel = panel;
  },

  logDebug(message) {
    const time = new Date().toLocaleTimeString('zh-TW', { hour12: false });
    this.debugLogs.unshift(`${time} ${message}`);
    this.debugLogs = this.debugLogs.slice(0, this.DEBUG_LOG_LIMIT);
    this.renderDebugLogs();
  },

  renderDebugLogs() {
    const panel = this.els.debugPanel || document.getElementById('auto-check-debug');
    const body = document.getElementById('auto-check-debug-body');
    if (!panel || !body) return;

    if (this.debugLogs.length === 0) {
      panel.style.display = 'none';
      body.textContent = '尚未收到訊號';
      return;
    }

    panel.style.display = 'block';
    body.textContent = this.debugLogs.join('\n');
  },

  /* ============================================
     卡片渲染 + 操作
     ============================================ */

  /**
   * 渲染所有卡片（群組模式：同一篇文章的變體放在一起）
   */
  renderCards() {
    if (!this.els.cards) return;

    this.els.cards.innerHTML = '';
    const fragment = document.createDocumentFragment();
    let groupIndex = 0;

    this.articleGroups.forEach((group) => {
      groupIndex++;
      const groupEl = this.createGroupCard(group, groupIndex);
      fragment.appendChild(groupEl);
    });

    this.els.cards.appendChild(fragment);
  },

  /**
   * 建立群組卡片（一篇文章 + 底下所有變體任務）
   */
  createGroupCard(group, groupIndex) {
    const wrapper = document.createElement('div');
    wrapper.className = 'check-group';
    wrapper.dataset.articleKey = group.articleKey;

    const tasks = this.tasks.filter(t => t.articleKey === group.articleKey);
    const checkedCount = tasks.filter(t => this.checkResults[t.id]).length;
    const num = String(groupIndex).padStart(2, '0');

    wrapper.innerHTML = `
      <div class="check-group-header">
        <span class="check-card-num">${num}</span>
        <a href="${this.escapeHtml(group.url)}" target="_blank" rel="noopener"
           class="check-card-title">${this.escapeHtml(group.title)}</a>
        <span class="check-group-progress">${checkedCount}/${tasks.length} 面向</span>
      </div>
      <div class="check-group-tasks"></div>
    `;

    const tasksContainer = wrapper.querySelector('.check-group-tasks');
    tasks.forEach(task => {
      const taskEl = this.createTaskCard(task);
      tasksContainer.appendChild(taskEl);
    });

    return wrapper;
  },

  /**
   * 建立單個變體任務卡片
   */
  createTaskCard(task) {
    const card = document.createElement('div');
    card.className = 'check-card check-card-variant';
    card.dataset.id = task.id;

    const savedStatus = this.checkResults[task.id];
    if (savedStatus) {
      card.classList.add('checked');
    }

    card.innerHTML = `
      <div class="check-card-header">
        <span class="check-card-facet">${this.escapeHtml(task.facetLabel || task.facetKey)}</span>
      </div>
      <div class="check-card-query">
        <span class="check-card-query-text">${this.escapeHtml(task.query)}</span>
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
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=zh-TW&num=20`;
    window.open(url, '_blank');
  },

  /**
   * 設定文章的 AIO 狀態
   * @param {string} articleId - 文章 ID
   * @param {string} status - 'cited' | 'aio' | 'none'
   */
  setStatus(articleId, status, options = {}) {
    const { toggle = true } = options;

    // 手動點擊同一個狀態時才取消；自動回傳不做 toggle
    if (toggle && this.checkResults[articleId] === status) {
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

    // 更新群組進度
    const task = this.tasks?.find(t => t.id === articleId);
    if (task && this.articleGroups) {
      const group = this.articleGroups.get(task.articleKey);
      if (group) {
        const groupEl = this.els.cards?.querySelector(`[data-article-key="${task.articleKey}"]`);
        const progressEl = groupEl?.querySelector('.check-group-progress');
        if (progressEl) {
          const groupTasks = this.tasks.filter(t => t.articleKey === task.articleKey);
          const checkedCount = groupTasks.filter(t => this.checkResults[t.id]).length;
          progressEl.textContent = `${checkedCount}/${groupTasks.length} 面向`;
        }
      }
    }
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

    // 報告按鈕：至少要有 1 篇真的回傳結果，timeout 不算
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

    if ((results.results?.length || 0) === 0) {
      Toast.error('還沒有可顯示的檢查結果');
      return;
    }

    // 停止自動檢查（如果還在跑）
    this.stopAutoCheck({ closePopup: true });

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
    const processedTasks = this.articles.filter(a => this.processStates[a.id]);

    return {
      scanDate: Utils.formatDate(new Date()),
      domain: this.domain,
      source: 'manual',
      totalArticles: this.articleGroups ? this.articleGroups.size : processedTasks.length,
      results: processedTasks.map(task => {
        const status = this.processStates[task.id];
        return {
          url: task.url,
          title: task.title,
          query: task.query,
          baseQuery: task.baseQuery || task.query,
          articleKey: task.articleKey || task.url,
          facetKey: task.facetKey || 'base',
          scanStatus: status,
          hasAIO: status === 'timeout' ? null : status === 'cited' || status === 'aio',
          isCited: status === 'cited',
          aioSources: this.checkSources[task.id] || [],
          organicRank: this.organicRanks?.[task.id] ?? null,
          relatedSearches: this.relatedSearches?.[task.id] || []
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
