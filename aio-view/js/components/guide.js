/* ================================================
   AIO View — Guide Component
   操作流程區塊（收合安裝說明）
   ================================================ */

const Guide = {
  /** DOM 元素 */
  elements: {
    section: null,
    toggleBtn: null,
    content: null
  },

  /** 安裝說明是否展開 */
  isExpanded: false,

  /**
   * 初始化
   */
  init() {
    this.elements.section = document.getElementById('guide-section');
    this.elements.toggleBtn = document.getElementById('guide-toggle');
    this.elements.content = document.getElementById('guide-content');

    this.bindEvents();
    this.loadState();
  },

  /**
   * 綁定事件
   */
  bindEvents() {
    this.elements.toggleBtn?.addEventListener('click', () => {
      this.toggle();
    });
  },

  /**
   * 切換展開/收合
   */
  toggle() {
    this.isExpanded = !this.isExpanded;
    this.updateUI();
    this.saveState();
  },

  /**
   * 更新 UI
   */
  updateUI() {
    const { toggleBtn, content } = this.elements;

    if (toggleBtn) {
      toggleBtn.setAttribute('aria-expanded', this.isExpanded);
      toggleBtn.querySelector('.toggle-icon')?.classList.toggle('expanded', this.isExpanded);
    }

    if (content) {
      content.classList.toggle('expanded', this.isExpanded);
    }
  },

  /**
   * 儲存展開狀態
   */
  saveState() {
    try {
      localStorage.setItem('aio_view_guide_expanded', this.isExpanded);
    } catch {}
  },

  /**
   * 載入展開狀態（預設收合）
   */
  loadState() {
    try {
      const saved = localStorage.getItem('aio_view_guide_expanded');
      this.isExpanded = saved === 'true';
      this.updateUI();
    } catch {
      this.isExpanded = false;
      this.updateUI();
    }
  }
};
