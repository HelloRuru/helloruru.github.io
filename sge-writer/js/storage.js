/**
 * SGE 文案助手 - 本地儲存模組
 * @module storage
 */

const STORAGE_KEYS = {
  NAMES: 'sge-writer-names',
  PROGRESS: 'sge-writer-progress',
  THEME: 'sge-writer-theme',
  DRAFTS: 'sge-writer-drafts'
};

export const storage = {
  /**
   * 儲存夥伴名稱
   */
  saveNames(names) {
    try {
      localStorage.setItem(STORAGE_KEYS.NAMES, JSON.stringify(names));
    } catch (e) {
      console.warn('無法儲存夥伴名稱:', e);
    }
  },

  /**
   * 讀取夥伴名稱
   */
  loadNames() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NAMES);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('無法讀取夥伴名稱:', e);
      return null;
    }
  },

  /**
   * 儲存使用者進度
   */
  saveProgress(progress) {
    try {
      localStorage.setItem(STORAGE_KEYS.PROGRESS, JSON.stringify(progress));
    } catch (e) {
      console.warn('無法儲存進度:', e);
    }
  },

  /**
   * 讀取使用者進度
   */
  loadProgress() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PROGRESS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('無法讀取進度:', e);
      return null;
    }
  },

  /**
   * 儲存主題設定
   */
  saveTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch (e) {
      console.warn('無法儲存主題:', e);
    }
  },

  /**
   * 讀取主題設定
   */
  loadTheme() {
    try {
      return localStorage.getItem(STORAGE_KEYS.THEME);
    } catch (e) {
      console.warn('無法讀取主題:', e);
      return null;
    }
  },

  /**
   * 儲存草稿
   */
  saveDraft(id, content) {
    try {
      const drafts = this.loadDrafts() || {};
      drafts[id] = {
        content,
        updatedAt: Date.now()
      };
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    } catch (e) {
      console.warn('無法儲存草稿:', e);
    }
  },

  /**
   * 讀取所有草稿
   */
  loadDrafts() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRAFTS);
      return data ? JSON.parse(data) : null;
    } catch (e) {
      console.warn('無法讀取草稿:', e);
      return null;
    }
  },

  /**
   * 讀取單一草稿
   */
  loadDraft(id) {
    const drafts = this.loadDrafts();
    return drafts ? drafts[id] : null;
  },

  /**
   * 刪除草稿
   */
  deleteDraft(id) {
    try {
      const drafts = this.loadDrafts() || {};
      delete drafts[id];
      localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    } catch (e) {
      console.warn('無法刪除草稿:', e);
    }
  },

  /**
   * 清除所有資料
   */
  clearAll() {
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
    } catch (e) {
      console.warn('無法清除資料:', e);
    }
  }
};
