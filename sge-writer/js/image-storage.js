/**
 * SGE 文案助手 - 角色立繪圖片儲存模組
 * @module image-storage
 *
 * 使用 IndexedDB 儲存角色立繪（圖片太大不適合 localStorage）
 * DB: sge-writer-images, Store: characters
 */

const DB_NAME = 'sge-writer-images';
const DB_VERSION = 1;
const STORE_NAME = 'characters';

function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

export const imageStorage = {
  /**
   * 儲存角色圖片
   * @param {string} key - 圖片 key，如 'guide-joy', 'writer-happy', 'extra-0'
   * @param {Blob} blob - 圖片 Blob
   * @param {string} [description] - 圖片描述（額外場景圖用）
   */
  async saveImage(key, blob, description = '') {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put({
        key,
        blob,
        description,
        updatedAt: Date.now()
      });
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      console.warn('無法儲存角色圖片:', e);
    }
  },

  /**
   * 讀取單張角色圖片
   * @param {string} key
   * @returns {Promise<{key, blob, description, updatedAt}|null>}
   */
  async loadImage(key) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(key);
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || null);
        request.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      console.warn('無法讀取角色圖片:', e);
      return null;
    }
  },

  /**
   * 讀取所有角色圖片
   * @returns {Promise<Array<{key, blob, description, updatedAt}>>}
   */
  async loadAllImages() {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result || []);
        request.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      console.warn('無法讀取所有角色圖片:', e);
      return [];
    }
  },

  /**
   * 刪除單張角色圖片
   * @param {string} key
   */
  async deleteImage(key) {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      console.warn('無法刪除角色圖片:', e);
    }
  },

  /**
   * 清除所有角色圖片
   */
  async clearAll() {
    try {
      const db = await openDB();
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      return new Promise((resolve, reject) => {
        tx.oncomplete = () => resolve();
        tx.onerror = (e) => reject(e.target.error);
      });
    } catch (e) {
      console.warn('無法清除所有角色圖片:', e);
    }
  },

  /**
   * 建立圖片的 Object URL（用於 <img> src）
   * @param {Blob} blob
   * @returns {string} Object URL
   */
  createImageURL(blob) {
    return URL.createObjectURL(blob);
  },

  /**
   * 釋放 Object URL
   * @param {string} url
   */
  revokeImageURL(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
};
