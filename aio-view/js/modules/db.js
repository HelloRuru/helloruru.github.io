/* ================================================
   AIO View — IndexedDB Module
   完整掃描結果的持久化儲存
   ================================================ */

const DB = {
  /** 資料庫名稱 */
  DB_NAME: 'aio_view_db',

  /** 資料庫版本 */
  DB_VERSION: 1,

  /** Store 名稱 */
  STORE: 'scan_history',

  /** 資料庫實例 */
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
        if (!db.objectStoreNames.contains(this.STORE)) {
          const store = db.createObjectStore(this.STORE, { keyPath: 'id', autoIncrement: true });
          store.createIndex('date', 'date', { unique: false });
          store.createIndex('domain', 'domain', { unique: false });
        }
      };

      request.onsuccess = (e) => {
        this._db = e.target.result;
        resolve(this._db);
      };

      request.onerror = (e) => {
        console.error('[DB] IndexedDB \u958B\u555F\u5931\u6557:', e.target.error);
        reject(e.target.error);
      };
    });
  },

  /**
   * 儲存完整掃描結果
   * @param {Object} results - 掃描結果（含 scanDate, domain, results[]）
   * @returns {Promise<number>} 記錄 ID
   */
  async saveFullResults(results) {
    const db = await this.open();

    const record = {
      date: results.scanDate || new Date().toISOString().split('T')[0],
      domain: results.domain || '',
      total: results.results?.length || 0,
      hasAIO: results.results?.filter(r => r.hasAIO).length || 0,
      cited: results.results?.filter(r => r.isCited).length || 0,
      results: results.results || [],
      savedAt: new Date().toISOString()
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);

      // 檢查同日同網域是否已存在
      const dateIndex = store.index('date');
      const range = IDBKeyRange.only(record.date);
      const cursor = dateIndex.openCursor(range);

      let existing = null;

      cursor.onsuccess = (e) => {
        const c = e.target.result;
        if (c) {
          if (c.value.domain === record.domain) {
            existing = c.value;
          }
          c.continue();
        } else {
          // 搜尋完畢
          if (existing) {
            // 更新既有記錄
            record.id = existing.id;
            const putReq = store.put(record);
            putReq.onsuccess = () => resolve(record.id);
            putReq.onerror = (err) => reject(err.target.error);
          } else {
            // 新增記錄
            const addReq = store.add(record);
            addReq.onsuccess = (ev) => resolve(ev.target.result);
            addReq.onerror = (err) => reject(err.target.error);
          }
        }
      };

      cursor.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * 取得所有歷史摘要（不含完整 results）
   * @returns {Promise<Array>}
   */
  async getHistorySummaries() {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readonly');
      const store = tx.objectStore(this.STORE);
      const request = store.getAll();

      request.onsuccess = (e) => {
        const records = e.target.result || [];

        // 回傳摘要（不含完整 results 以節省記憶體）
        const summaries = records.map(r => ({
          id: r.id,
          date: r.date,
          domain: r.domain,
          total: r.total,
          hasAIO: r.hasAIO,
          cited: r.cited,
          rate: r.total ? ((r.cited / r.total) * 100).toFixed(1) : '0',
          savedAt: r.savedAt
        }));

        // 依日期排序
        summaries.sort((a, b) => a.date.localeCompare(b.date));
        resolve(summaries);
      };

      request.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * 取得單筆完整記錄
   * @param {number} id - 記錄 ID
   * @returns {Promise<Object|null>}
   */
  async getFullRecord(id) {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readonly');
      const store = tx.objectStore(this.STORE);
      const request = store.get(id);

      request.onsuccess = (e) => resolve(e.target.result || null);
      request.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * 刪除單筆記錄
   * @param {number} id
   * @returns {Promise<void>}
   */
  async deleteRecord(id) {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  },

  /**
   * 清除所有記錄
   * @returns {Promise<void>}
   */
  async clearAll() {
    const db = await this.open();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(this.STORE, 'readwrite');
      const store = tx.objectStore(this.STORE);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = (e) => reject(e.target.error);
    });
  }
};
