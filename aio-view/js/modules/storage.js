/* ================================================
   AIO View — Storage Module
   localStorage 資料管理
   ================================================ */

const Storage = {
  /** localStorage 鍵值前綴 */
  PREFIX: 'aio_view_',

  /** 儲存鍵值 */
  KEYS: {
    ARTICLES: 'articles',
    RESULTS: 'results',
    HISTORY: 'history',
    SETTINGS: 'settings',
    MANUAL_CHECK: 'manual_check'
  },

  /**
   * 取得完整鍵值
   * @param {string} key - 鍵值名稱
   * @returns {string} 完整鍵值
   */
  _getKey(key) {
    return this.PREFIX + key;
  },

  /**
   * 正規化掃描結果格式
   * @param {Object|null} results - 掃描結果
   * @param {string} fallbackDomain - 備用網域
   * @returns {Object|null}
   */
  normalizeResults(results, fallbackDomain = '') {
    if (!results || typeof results !== 'object') return null;

    const domain = String(results.domain || fallbackDomain || '').trim();
    const items = Array.isArray(results.results)
      ? results.results.filter(Boolean).map(item => ({
        ...item,
        domain: String(item.domain || domain || '').trim()
      }))
      : [];

    return {
      ...results,
      domain,
      results: items
    };
  },

  /**
   * 儲存資料
   * @param {string} key - 鍵值
   * @param {any} data - 資料
   * @returns {boolean} 是否成功
   */
  set(key, data) {
    try {
      localStorage.setItem(this._getKey(key), JSON.stringify(data));
      return true;
    } catch (e) {
      console.error(`Storage.set(${key}) failed:`, e);
      return false;
    }
  },

  /**
   * 讀取資料
   * @param {string} key - 鍵值
   * @param {any} defaultValue - 預設值
   * @returns {any} 資料
   */
  get(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(this._getKey(key));
      return data ? JSON.parse(data) : defaultValue;
    } catch (e) {
      console.error(`Storage.get(${key}) failed:`, e);
      return defaultValue;
    }
  },

  /**
   * 移除資料
   * @param {string} key - 鍵值
   */
  remove(key) {
    localStorage.removeItem(this._getKey(key));
  },

  /* ============================================
     文章相關
     ============================================ */

  /**
   * 儲存文章清單
   * @param {Array} articles - 文章清單
   */
  saveArticles(articles) {
    return this.set(this.KEYS.ARTICLES, articles);
  },

  /**
   * 讀取文章清單
   * @returns {Array} 文章清單
   */
  getArticles() {
    return this.get(this.KEYS.ARTICLES, []);
  },

  /* ============================================
     結果相關
     ============================================ */

  /**
   * 儲存掃描結果
   * @param {Object} results - 掃描結果
   */
  saveResults(results) {
    const normalized = this.normalizeResults(results);
    if (!normalized) return false;

    // 合併新舊結果（只限同網域）
    const existing = this.getResults();
    const sameDomain = !existing?.domain || !normalized.domain || existing.domain === normalized.domain;
    let merged = normalized;

    if (sameDomain && existing?.results?.length > 0 && normalized.results?.length > 0) {
      const seen = new Map();
      // 舊的先放
      existing.results.forEach(r => {
        const key = `${r.articleKey || r.url || r.title}::${r.facetKey || ''}::${r.query || ''}`;
        seen.set(key, r);
      });
      // 新的覆蓋同 key，新增不同 key
      normalized.results.forEach(r => {
        const key = `${r.articleKey || r.url || r.title}::${r.facetKey || ''}::${r.query || ''}`;
        seen.set(key, r);
      });
      merged = {
        ...normalized,
        results: Array.from(seen.values())
      };
    }

    const success = this.set(this.KEYS.RESULTS, merged);

    // 同時加入歷史記錄
    if (success) {
      this.addToHistory(merged);
    }

    return success;
  },

  /**
   * 讀取掃描結果
   * @returns {Object|null} 掃描結果
   */
  getResults(domain = '') {
    const stored = this.get(this.KEYS.RESULTS, null);
    const normalized = this.normalizeResults(stored, domain);
    if (!normalized) return null;
    if (domain && normalized.domain && normalized.domain !== domain) {
      return null;
    }
    return normalized;
  },

  /* ============================================
     歷史記錄
     ============================================ */

  /**
   * 新增歷史記錄
   * @param {Object} results - 掃描結果
   */
  addToHistory(results) {
    const history = this.getHistory();

    // 建立摘要
    const summary = {
      date: results.scanDate || Utils.formatDate(new Date()),
      domain: results.domain || '',
      total: results.results?.length || 0,
      hasAIO: results.results?.filter(r => r.hasAIO).length || 0,
      cited: results.results?.filter(r => r.isCited).length || 0
    };

    // 避免同一天重複記錄
    const existingIndex = history.findIndex(
      h => h.date === summary.date && h.domain === summary.domain
    );

    if (existingIndex >= 0) {
      history[existingIndex] = summary;
    } else {
      history.push(summary);
    }

    // 只保留最近 30 筆
    const trimmed = history.slice(-30);
    return this.set(this.KEYS.HISTORY, trimmed);
  },

  /**
   * 讀取歷史記錄
   * @returns {Array} 歷史記錄
   */
  getHistory() {
    return this.get(this.KEYS.HISTORY, []);
  },

  /* ============================================
     設定
     ============================================ */

  /**
   * 儲存設定
   * @param {Object} settings - 設定
   */
  saveSettings(settings) {
    return this.set(this.KEYS.SETTINGS, settings);
  },

  /**
   * 讀取設定
   * @returns {Object} 設定
   */
  getSettings() {
    return this.get(this.KEYS.SETTINGS, {
      defaultDelay: 150,
      headless: false
    });
  },

  /* ============================================
     清除
     ============================================ */

  /**
   * 清除所有資料
   */
  clearAll() {
    Object.values(this.KEYS).forEach(key => {
      this.remove(key);
    });
  },

  /**
   * 清除目前操作中的工作資料
   */
  clearWorkingData() {
    [
      this.KEYS.ARTICLES,
      this.KEYS.RESULTS,
      this.KEYS.MANUAL_CHECK
    ].forEach(key => {
      this.remove(key);
    });
  }
};
