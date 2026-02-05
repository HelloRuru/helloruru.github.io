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

    // 產生 queries.json 內容
    const queries = selected.map(a => ({
      url: a.url,
      title: a.title,
      query: a.query
    }));

    const queriesJson = JSON.stringify(queries, null, 2);
    const estimatedMinutes = Math.ceil(selected.length * 2.5);

    const commands = this.buildCommands(queriesJson, domain, estimatedMinutes);

    // 顯示
    if (this.elements.commands) {
      this.elements.commands.textContent = commands;
    }

    this.show();
  },

  /**
   * 建立指令內容
   * @param {string} queriesJson - queries.json 內容
   * @param {string} domain - 網域
   * @param {number} minutes - 預估分鐘數
   * @returns {string} 指令
   */
  buildCommands(queriesJson, domain, minutes) {
    return `# 1. 下載 CLI 工具（首次使用）
git clone https://github.com/helloruru/helloruru.github.io.git
cd helloruru.github.io/aio-view/cli
npm install
npx playwright install chromium

# 2. 建立 queries.json
cat > queries.json << 'EOF'
${queriesJson}
EOF

# 3. 執行掃描（約需 ${minutes} 分鐘）
node scan.js --input queries.json --output results.json --domain ${domain}

# 4. 完成後上傳 results.json 到 Dashboard`;
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
