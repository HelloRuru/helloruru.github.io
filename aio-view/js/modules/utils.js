/* ================================================
   AIO View — Utils Module
   通用工具函數
   ================================================ */

const Utils = {
  /**
   * HTML 跳脫，防止 XSS
   * @param {string} str - 要跳脫的字串
   * @returns {string} 跳脫後的字串
   */
  escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str || '';
    return div.innerHTML;
  },

  /**
   * 驗證 URL 格式
   * @param {string} url - 要驗證的 URL
   * @returns {boolean} 是否為有效 URL
   */
  isValidUrl(url) {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * 從 URL 取得網域
   * @param {string} url - 完整 URL
   * @returns {string} 網域名稱
   */
  getDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return '';
    }
  },

  /**
   * 格式化日期
   * @param {Date|string} date - 日期
   * @returns {string} YYYY-MM-DD 格式
   */
  formatDate(date) {
    const d = date instanceof Date ? date : new Date(date);
    return d.toISOString().split('T')[0];
  },

  /**
   * 計算百分比
   * @param {number} value - 數值
   * @param {number} total - 總數
   * @returns {number} 百分比（整數）
   */
  percentage(value, total) {
    if (total === 0) return 0;
    return Math.round((value / total) * 100);
  },

  /**
   * 下載檔案
   * @param {string} content - 檔案內容
   * @param {string} filename - 檔案名稱
   * @param {string} mimeType - MIME 類型
   */
  downloadFile(content, filename, mimeType = 'application/json') {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();

    URL.revokeObjectURL(url);
  },

  /**
   * 複製文字到剪貼簿
   * @param {string} text - 要複製的文字
   * @returns {Promise<boolean>} 是否成功
   */
  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }
};
