/* ================================================
   AEO Consultant — Hash-based SPA Router
   頁面路由管理
   ================================================ */

const Router = {
  /** 註冊的路由 { path: { show, hide, init?, initialized? } } */
  routes: {},

  /** 目前路由 */
  currentRoute: null,

  /** 目前面板 ID */
  currentPanel: null,

  /**
   * 註冊路由
   * @param {string} path - 路由路徑（如 '/schema'）
   * @param {Object} handler - { panelId, show?, hide?, init? }
   */
  register(path, handler) {
    this.routes[path] = {
      ...handler,
      initialized: false
    };
  },

  /**
   * 初始化路由器
   */
  init() {
    window.addEventListener('hashchange', () => this.handleRoute());

    // 初始路由
    this.handleRoute();
  },

  /**
   * 處理路由變更
   */
  handleRoute() {
    const hash = window.location.hash || '#/';
    const path = hash.replace('#', '') || '/';

    const handler = this.routes[path];
    if (!handler) {
      // 未知路由 → 回首頁
      this.navigate('/');
      return;
    }

    // 隱藏目前面板
    if (this.currentRoute && this.routes[this.currentRoute]) {
      const prev = this.routes[this.currentRoute];
      const prevPanel = document.getElementById(prev.panelId);
      if (prevPanel) prevPanel.classList.add('hidden');
      if (prev.hide) prev.hide();
    }

    // 顯示目標面板
    const panel = document.getElementById(handler.panelId);
    if (panel) panel.classList.remove('hidden');

    // 首次進入時初始化
    if (!handler.initialized && handler.init) {
      handler.init();
      handler.initialized = true;
    }

    if (handler.show) handler.show();

    this.currentRoute = path;
    this.currentPanel = handler.panelId;

    // 更新導覽列 active 狀態
    this.updateNav(path);

    // 捲到頂部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  /**
   * 程式化導航
   * @param {string} path - 目標路徑
   */
  navigate(path) {
    window.location.hash = '#' + path;
  },

  /**
   * 更新導覽列 active 狀態
   * @param {string} activePath - 目前路徑
   */
  updateNav(activePath) {
    document.querySelectorAll('.main-nav .nav-link').forEach(link => {
      const route = link.dataset.route;
      link.classList.toggle('active', route === activePath);
    });
  },

  /**
   * 取得目前路由
   * @returns {string}
   */
  getCurrentRoute() {
    return this.currentRoute || '/';
  }
};
