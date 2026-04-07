/* ================================================
   AEO Consultant — Navigation Component
   頂部導覽列
   ================================================ */

const Nav = {
  /** 手機版選單是否展開 */
  menuOpen: false,

  /**
   * 初始化導覽列
   */
  init() {
    // 手機版漢堡選單
    const toggle = document.getElementById('nav-toggle');
    const menu = document.getElementById('nav-menu');

    if (toggle && menu) {
      toggle.addEventListener('click', () => {
        this.menuOpen = !this.menuOpen;
        menu.classList.toggle('open', this.menuOpen);
        toggle.setAttribute('aria-expanded', this.menuOpen);
      });

      // 點選項目後自動收合
      menu.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
          this.menuOpen = false;
          menu.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  }
};
