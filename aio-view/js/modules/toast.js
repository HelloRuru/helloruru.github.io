/* ================================================
   AIO View — Toast Module
   Toast 通知元件
   ================================================ */

const Toast = {
  /** Toast 容器 */
  container: null,

  /** 預設顯示時間（毫秒） */
  duration: 3000,

  /**
   * 初始化 Toast 容器
   */
  init() {
    if (this.container) return;

    this.container = document.createElement('div');
    this.container.className = 'toast-container';
    document.body.appendChild(this.container);
  },

  /**
   * 顯示 Toast
   * @param {string} message - 訊息內容
   * @param {string} type - 類型：'info' | 'success' | 'error'
   * @param {number} duration - 顯示時間（毫秒）
   */
  show(message, type = 'info', duration = this.duration) {
    this.init();

    // 建立 Toast 元素
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    // 加入容器
    this.container.appendChild(toast);

    // 觸發顯示動畫
    requestAnimationFrame(() => {
      toast.classList.add('show');
    });

    // 自動隱藏
    setTimeout(() => {
      this.hide(toast);
    }, duration);
  },

  /**
   * 隱藏 Toast
   * @param {HTMLElement} toast - Toast 元素
   */
  hide(toast) {
    toast.classList.remove('show');

    // 動畫結束後移除
    setTimeout(() => {
      toast.remove();
    }, 300);
  },

  /**
   * 顯示成功訊息
   * @param {string} message - 訊息內容
   */
  success(message) {
    this.show(message, 'success');
  },

  /**
   * 顯示錯誤訊息
   * @param {string} message - 訊息內容
   */
  error(message) {
    this.show(message, 'error');
  },

  /**
   * 顯示資訊訊息
   * @param {string} message - 訊息內容
   */
  info(message) {
    this.show(message, 'info');
  }
};
