/* ================================================
   AIO View — CLI Generator Component
   CLI 指令產生器
   ================================================ */

const CliGenerator = {
  /** DOM 元素 */
  elements: {
    section: null,
    commands: null,
    copyBtn: null
  },

  /**
   * 初始化
   */
  init() {
    this.elements.section = document.getElementById('cli-section');
    this.elements.commands = document.getElementById('cli-commands');
    this.elements.copyBtn = document.getElementById('copy-cli-btn');

    this.bindEvents();
  },

  /**
   * 綁定事件
   */
  bindEvents() {
    this.elements.copyBtn?.addEventListener('click', () => {
      this.copy();
    });
  },

  /** 暫存資料 */
  currentData: {
    articles: [],
    domain: ''
  },

  /**
   * 產生 CLI 指令
   * @param {Array} articles - 文章清單
   * @param {string} domain - 網域
   */
  generate(articles, domain) {
    const selected = articles.filter(a => a.selected && a.query);

    if (selected.length === 0) {
      Toast.error('請先選擇要監測的文章');
      return;
    }

    // 儲存資料供下載使用
    this.currentData = { articles: selected, domain };

    const estimatedMinutes = Math.ceil(selected.length * 2.5);
    const commands = this.buildCommands(domain, estimatedMinutes, selected.length);

    // 顯示
    if (this.elements.commands) {
      this.elements.commands.textContent = commands;
    }

    this.show();

    // 自動下載 queries.json
    this.downloadQueries();
  },

  /**
   * 建立指令內容
   * @param {string} domain - 網域
   * @param {number} minutes - 預估分鐘數
   * @param {number} count - 文章數量
   * @returns {string} 指令
   */
  buildCommands(domain, minutes, count) {
    return `# ===== AIO View CLI 使用說明 =====
# 監測 ${count} 篇文章，預估需要 ${minutes} 分鐘

# 步驟 1：下載 CLI 工具（首次使用）
git clone https://github.com/helloruru/helloruru.github.io.git
cd helloruru.github.io/aio-view/cli
npm install
npx playwright install chromium

# 步驟 2：將剛才下載的 queries.json 放到 cli 資料夾

# 步驟 3：執行掃描
node scan.js --input queries.json --output results.json --domain ${domain}

# 步驟 4：完成後將 results.json 上傳回 Dashboard`;
  },

  /**
   * 下載 queries.json
   */
  downloadQueries() {
    const { articles } = this.currentData;

    if (!articles || articles.length === 0) return;

    const data = articles.map(a => ({
      url: a.url,
      title: a.title,
      query: a.query
    }));

    const json = JSON.stringify(data, null, 2);
    Utils.downloadFile(json, 'queries.json', 'application/json');

    Toast.success('queries.json 已下載，請放到 cli 資料夾');
  },

  /**
   * 複製指令
   */
  async copy() {
    const commands = this.elements.commands?.textContent;

    if (!commands) return;

    const success = await Utils.copyToClipboard(commands);

    if (success) {
      Toast.success('已複製到剪貼簿');
    } else {
      Toast.error('複製失敗，請手動選取複製');
    }
  },

  /**
   * 匯出搜尋語句 JSON
   * @param {Array} articles - 文章清單
   */
  exportQueries(articles) {
    const selected = articles.filter(a => a.selected && a.query);

    if (selected.length === 0) {
      Toast.error('請先選擇要監測的文章');
      return;
    }

    const data = selected.map(a => ({
      url: a.url,
      title: a.title,
      query: a.query
    }));

    const json = JSON.stringify(data, null, 2);
    Utils.downloadFile(json, 'queries.json', 'application/json');

    Toast.success('搜尋語句已匯出');
  },

  /**
   * 顯示區塊
   */
  show() {
    this.elements.section?.classList.remove('hidden');
  },

  /**
   * 隱藏區塊
   */
  hide() {
    this.elements.section?.classList.add('hidden');
  }
};
