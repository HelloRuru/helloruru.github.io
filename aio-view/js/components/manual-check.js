/* ================================================
   AIO View — Manual Check Mode
   手動檢查 + 自動檢查（油猴腳本 + BroadcastChannel）
   按一個按鈕，背景自動跑完全部文章
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

  /** 自動檢查狀態 */
  autoCheck: {
    active: false,
    currentIndex: 0,
    popup: null,
    timer: null,
    timeoutTimer: null
  },

  /** 自動檢查時間設定（毫秒） */
  AUTO_DELAY_MIN: 8000,
  AUTO_DELAY_MAX: 15000,
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
      // 油猴腳本
      copyScriptBtn: document.getElementById('copy-userscript-btn'),
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

    // 複製油猴腳本
    this.els.copyScriptBtn?.addEventListener('click', () => {
      const script = this.generateUserscript();
      Utils.copyToClipboard(script).then(ok => {
        if (ok) Toast.success('腳本已複製！貼到 Tampermonkey 新增腳本，儲存即可');
        else Toast.error('複製失敗');
      });
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
    this.articles = articles;
    this.domain = domain;

    // 確保每篇文章有唯一 ID（用 URL 當 ID）
    this.articles.forEach(a => {
      if (!a.id) a.id = a.url;
    });

    // 從 Storage 載入進度
    this.checkResults = Storage.get('manual_check', {});

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
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
  },

  /**
   * 處理回傳訊息（支援油猴腳本 + 舊版 bookmarklet 兩種格式）
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
      // 油猴腳本格式：{ aio: boolean, src: [...] }
      if (!data.aio) {
        status = 'none';
      } else {
        const domain = this.domain.replace(/^www\./, '').toLowerCase();
        const cited = (data.src || []).some(s => s.includes(domain));
        status = cited ? 'cited' : 'aio';
      }
    }

    // 用搜尋語句比對文章
    const article = this.findArticleByQuery(query);
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

    // 自動檢查模式：推進下一篇
    if (this.autoCheck.active) {
      clearTimeout(this.autoCheck.timeoutTimer);
      Toast.success(`${shortTitle} → ${label}`);
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
     油猴腳本（Userscript）
     ============================================ */

  /**
   * 產生 Tampermonkey / Violentmonkey 腳本
   * @returns {string} 完整腳本文字
   */
  generateUserscript() {
    return `// ==UserScript==
// @name         AIO View 自動偵測
// @namespace    https://lab.helloruru.com
// @version      1.0
// @description  自動偵測 Google AI Overview，回傳結果給 AIO View
// @match        *://www.google.com/search*
// @match        *://www.google.com.tw/search*
// @match        *://www.google.co.jp/search*
// @match        *://www.google.co.uk/search*
// @match        *://www.google.com.hk/search*
// @match        *://www.google.com.sg/search*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
  'use strict';

  // 等 Google 動態內容載入
  setTimeout(function() {
    // 策略 1：data-rl（2025+ 格式）
    var a = document.querySelector('div[data-rl]');

    // 策略 2：heading 文字比對
    if (!a) {
      var hs = document.querySelectorAll('[role="heading"]');
      for (var i = 0; i < hs.length; i++) {
        var t = hs[i].textContent;
        if (t.indexOf('AI Overview') >= 0 || t.indexOf('AI \\u7E3D\\u89BD') >= 0) {
          a = hs[i].closest('div[jsname]') || hs[i].parentElement;
          break;
        }
      }
    }

    // 策略 3：舊版 selector
    if (!a) {
      var S = ['[data-attrid="wa:/description"]', '.ILfuVd', '.wDYxhc[data-md]', '.kp-wholepage-osrp'];
      for (var i = 0; i < S.length; i++) {
        a = document.querySelector(S[i]);
        if (a) break;
      }
    }

    // 取搜尋語句
    var q = (document.querySelector('textarea[name="q"],input[name="q"]') || {}).value || '';

    // 收集引用來源
    var src = [];
    if (a) {
      var ls = a.querySelectorAll('a[href]');
      for (var i = 0; i < ls.length; i++) {
        try { src.push(new URL(ls[i].href).hostname.replace(/^www\\\\./, '')); } catch(e) {}
      }
    }
    var u = {};
    src = src.filter(function(x) { return u[x] ? 0 : u[x] = 1; });

    // 回傳結果給 AIO View
    try {
      var ch = new BroadcastChannel('${this.CHANNEL_NAME}');
      ch.postMessage({ t: 'r', q: q, aio: !!a, src: src });
      ch.close();
    } catch(e) {}

    // 小型浮動提示（3 秒後消失）
    var color = a ? '#00f0ff' : '#666';
    var text = a ? 'AIO \\u2714' : 'No AIO';
    var d = document.createElement('div');
    d.style.cssText = 'position:fixed;bottom:16px;right:16px;z-index:99999;padding:6px 12px;border-radius:8px;font:500 12px/1 sans-serif;color:#fff;background:' + color + ';opacity:0.8;pointer-events:none;';
    d.textContent = text;
    document.body.appendChild(d);
    setTimeout(function() { if (d.parentNode) d.remove(); }, 3000);
  }, 3000);
})();`;
  },

  /* ============================================
     自動檢查
     ============================================ */

  /**
   * 開始自動檢查
   * 背景開 Google 搜尋彈窗，油猴腳本自動偵測回傳
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

    // 跳過已檢查的
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
        this.els.autoStatus.textContent = `正在檢查 ${current}/${total}...（已完成 ${checked}）`;
        this.els.autoStatus.classList.remove('hidden');
      } else if (checked > 0 && checked < total) {
        this.els.autoStatus.textContent = `已停止（${checked}/${total} 完成）`;
        this.els.autoStatus.classList.remove('hidden');
      } else if (checked === total && total > 0) {
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
    } else {
      this.checkResults[articleId] = status;
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
