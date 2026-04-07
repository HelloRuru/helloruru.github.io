/* ================================================
   AEO Consultant — Site-level IndexedDB
   站級分析資料的持久化儲存
   ================================================ */

const SiteDB = {
  DB_NAME: 'aeo_consultant_db',
  DB_VERSION: 1,

  STORES: {
    PAGE_CACHE: 'page_cache',
    SCHEMA_RESULTS: 'schema_results',
    CITABILITY_RESULTS: 'citability_results',
    TECHNICAL_RESULTS: 'technical_results',
    RECOMMENDATIONS: 'recommendations',
    SITE_REPORTS: 'site_reports'
  },

  _db: null,

  /**
   * 開啟資料庫
   * @returns {Promise<IDBDatabase>}
   */
  open() {
    if (this._db) return Promise.resolve(this._db);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onupgradeneeded = (e) => {
        const db = e.target.result;

        // 頁面快取（URL 為 key，24h TTL）
        if (!db.objectStoreNames.contains(this.STORES.PAGE_CACHE)) {
          const store = db.createObjectStore(this.STORES.PAGE_CACHE, { keyPath: 'url' });
          store.createIndex('domain', 'domain', { unique: false });
          store.createIndex('fetchedAt', 'fetchedAt', { unique: false });
        }

        // 結構化資料檢查結果
        if (!db.objectStoreNames.contains(this.STORES.SCHEMA_RESULTS)) {
          const store = db.createObjectStore(this.STORES.SCHEMA_RESULTS, { keyPath: 'id', autoIncrement: true });
          store.createIndex('domain', 'domain', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }

        // AI 可引用度結果
        if (!db.objectStoreNames.contains(this.STORES.CITABILITY_RESULTS)) {
          const store = db.createObjectStore(this.STORES.CITABILITY_RESULTS, { keyPath: 'id', autoIncrement: true });
          store.createIndex('domain', 'domain', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }

        // 技術面檢查結果
        if (!db.objectStoreNames.contains(this.STORES.TECHNICAL_RESULTS)) {
          const store = db.createObjectStore(this.STORES.TECHNICAL_RESULTS, { keyPath: 'id', autoIncrement: true });
          store.createIndex('domain', 'domain', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }

        // 優化建議
        if (!db.objectStoreNames.contains(this.STORES.RECOMMENDATIONS)) {
          const store = db.createObjectStore(this.STORES.RECOMMENDATIONS, { keyPath: 'id', autoIncrement: true });
          store.createIndex('domain', 'domain', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }

        // 站級報告快照
        if (!db.objectStoreNames.contains(this.STORES.SITE_REPORTS)) {
          const store = db.createObjectStore(this.STORES.SITE_REPORTS, { keyPath: 'id', autoIncrement: true });
          store.createIndex('domain', 'domain', { unique: false });
          store.createIndex('date', 'date', { unique: false });
        }
      };

      request.onsuccess = (e) => {
        this._db = e.target.result;
        resolve(this._db);
      };

      request.onerror = (e) => {
        console.error('[SiteDB] IndexedDB 開啟失敗:', e.target.error);
        reject(e.target.error);
      };
    });
  },

  /**
   * 儲存頁面快取
   * @param {string} url - 頁面 URL
   * @param {string} domain - 網域
   * @param {string} html - 頁面 HTML
   */
  async cachePage(url, domain, html) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORES.PAGE_CACHE, 'readwrite');
      const store = tx.objectStore(this.STORES.PAGE_CACHE);
      store.put({
        url,
        domain,
        html,
        fetchedAt: Date.now()
      });
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * 取得快取頁面（24h 內有效）
   * @param {string} url - 頁面 URL
   * @returns {Promise<string|null>} HTML 或 null
   */
  async getCachedPage(url) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORES.PAGE_CACHE, 'readonly');
      const store = tx.objectStore(this.STORES.PAGE_CACHE);
      const request = store.get(url);
      request.onsuccess = (e) => {
        const record = e.target.result;
        if (!record) return resolve(null);

        // 24h TTL
        const age = Date.now() - record.fetchedAt;
        if (age > 24 * 60 * 60 * 1000) return resolve(null);

        resolve(record.html);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * 儲存分析結果（通用）
   * @param {string} storeName - store 名稱
   * @param {Object} data - 資料（需含 domain）
   * @returns {Promise<number>} 記錄 ID
   */
  async saveResult(storeName, data) {
    const db = await this.open();
    const record = {
      ...data,
      date: data.date || new Date().toISOString().split('T')[0],
      savedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      const request = store.add(record);
      request.onsuccess = (e) => resolve(e.target.result);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * 取得某網域的最新結果
   * @param {string} storeName - store 名稱
   * @param {string} domain - 網域
   * @returns {Promise<Object|null>}
   */
  async getLatestResult(storeName, domain) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const index = store.index('domain');
      const request = index.getAll(domain);
      request.onsuccess = (e) => {
        const records = e.target.result || [];
        if (records.length === 0) return resolve(null);
        // 回傳最新的
        records.sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''));
        resolve(records[0]);
      };
      request.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * 清除某網域的快取頁面
   * @param {string} domain
   */
  async clearPageCache(domain) {
    const db = await this.open();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORES.PAGE_CACHE, 'readwrite');
      const store = tx.objectStore(this.STORES.PAGE_CACHE);
      const index = store.index('domain');
      const request = index.openCursor(IDBKeyRange.only(domain));
      request.onsuccess = (e) => {
        const cursor = e.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        }
      };
      tx.oncomplete = () => resolve();
      tx.onerror = (e) => reject(e.target.error);
    });
  }
};
