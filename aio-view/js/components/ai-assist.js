/* ================================================
   AIO View — AI Assist Component
   AI 輔助面板：分批提示詞 + 智慧貼回
   ================================================ */

const AiAssist = {
  /** 每批文章數量 */
  BATCH_SIZE: 15,

  /** 目前批次 */
  currentBatch: 0,

  /** 批次總數 */
  totalBatches: 0,

  /** 分批後的文章群組 */
  batches: [],

  /** 所有選中文章的參照 */
  articles: [],

  /** 網域 */
  domain: '',

  /** DOM 元素 */
  elements: {
    panel: null,
    header: null,
    body: null,
    batchNav: null,
    batchLabel: null,
    batchButtons: null,
    promptText: null,
    pasteTextarea: null,
    completenessBar: null,
    modeTabFree: null,
    modeTabCli: null,
    freeContent: null,
    cliContent: null
  },

  /**
   * 初始化
   */
  init() {
    this.elements.panel = document.getElementById('ai-assist-panel');
    this.elements.header = document.getElementById('ai-assist-toggle');
    this.elements.body = document.getElementById('ai-assist-body');
    this.elements.batchNav = document.getElementById('ai-batch-nav');
    this.elements.batchLabel = document.getElementById('ai-batch-label');
    this.elements.batchButtons = document.getElementById('ai-batch-buttons');
    this.elements.promptText = document.getElementById('ai-prompt-text');
    this.elements.pasteTextarea = document.getElementById('ai-paste-textarea');
    this.elements.completenessBar = document.getElementById('ai-completeness');
    this.elements.modeTabFree = document.getElementById('ai-mode-free');
    this.elements.modeTabCli = document.getElementById('ai-mode-cli');
    this.elements.freeContent = document.getElementById('ai-free-content');
    this.elements.cliContent = document.getElementById('ai-cli-content');

    this.bindEvents();
  },

  /**
   * 綁定事件
   */
  bindEvents() {
    // 摺疊切換
    this.elements.header?.addEventListener('click', () => {
      this.togglePanel();
    });

    // 模式切換
    this.elements.modeTabFree?.addEventListener('click', () => {
      this.switchMode('free');
    });
    this.elements.modeTabCli?.addEventListener('click', () => {
      this.switchMode('cli');
    });

    // 複製目前批次提示詞
    document.getElementById('ai-copy-prompt')?.addEventListener('click', () => {
      this.copyCurrentPrompt();
    });

    // 智慧貼回
    document.getElementById('ai-apply-paste')?.addEventListener('click', () => {
      this.applyPasteBack();
    });
  },

  /**
   * 切換面板展開/收合
   */
  togglePanel() {
    const expanded = this.elements.header?.getAttribute('aria-expanded') === 'true';
    this.elements.header?.setAttribute('aria-expanded', !expanded);
    this.elements.body?.classList.toggle('expanded');
  },

  /**
   * 切換模式
   * @param {'free'|'cli'} mode
   */
  switchMode(mode) {
    if (mode === 'free') {
      this.elements.modeTabFree?.classList.add('active');
      this.elements.modeTabCli?.classList.remove('active');
      this.elements.freeContent?.classList.remove('hidden');
      this.elements.cliContent?.classList.add('hidden');
    } else {
      this.elements.modeTabFree?.classList.remove('active');
      this.elements.modeTabCli?.classList.add('active');
      this.elements.freeContent?.classList.add('hidden');
      this.elements.cliContent?.classList.remove('hidden');
    }
  },

  /**
   * 更新 — 文章變動時呼叫
   * @param {Array} articles - 選中的文章
   * @param {string} domain - 網域
   */
  update(articles, domain) {
    this.articles = articles.filter(a => a.selected);
    this.domain = domain;

    if (this.articles.length === 0) {
      this.elements.panel?.classList.add('hidden');
      return;
    }

    this.elements.panel?.classList.remove('hidden');

    // 分批
    this.batches = this.splitBatches(this.articles);
    this.totalBatches = this.batches.length;
    this.currentBatch = 0;

    // 渲染批次導覽
    this.renderBatchNav();

    // 渲染目前批次的提示詞
    this.renderPrompt();

    // 更新完整度
    this.renderCompleteness();
  },

  /**
   * 分批
   * @param {Array} articles
   * @returns {Array<Array>} 分批後的陣列
   */
  splitBatches(articles) {
    const batches = [];
    for (let i = 0; i < articles.length; i += this.BATCH_SIZE) {
      batches.push(articles.slice(i, i + this.BATCH_SIZE));
    }
    return batches;
  },

  /**
   * 渲染批次導覽
   */
  renderBatchNav() {
    if (this.totalBatches <= 1) {
      this.elements.batchNav?.classList.add('hidden');
      return;
    }

    this.elements.batchNav?.classList.remove('hidden');

    // 產生批次按鈕
    const buttons = [];
    for (let i = 0; i < this.totalBatches; i++) {
      const active = i === this.currentBatch ? ' active' : '';
      buttons.push(
        `<button class="batch-nav-btn${active}" data-batch="${i}">第 ${i + 1} 批</button>`
      );
    }

    if (this.elements.batchButtons) {
      this.elements.batchButtons.innerHTML = buttons.join('');

      // 綁定點擊
      this.elements.batchButtons.querySelectorAll('.batch-nav-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          this.currentBatch = parseInt(btn.dataset.batch, 10);
          this.renderBatchNav();
          this.renderPrompt();
        });
      });
    }

    if (this.elements.batchLabel) {
      this.elements.batchLabel.textContent =
        `共 ${this.articles.length} 篇，分 ${this.totalBatches} 批（每批 ${this.BATCH_SIZE} 篇）`;
    }
  },

  /**
   * 渲染目前批次的提示詞
   */
  renderPrompt() {
    const batch = this.batches[this.currentBatch];
    if (!batch) return;

    const prompt = this.buildPrompt(batch, this.domain);

    if (this.elements.promptText) {
      this.elements.promptText.value = prompt;
    }
  },

  /**
   * 建立提示詞
   * @param {Array} articles - 該批文章
   * @param {string} domain - 網域
   * @returns {string}
   */
  buildPrompt(articles, domain) {
    const articleList = articles.map((a, i) =>
      `${i + 1}. ${a.title} (${a.url})`
    ).join('\n');

    return `我有以下 ${articles.length} 篇文章，想監測它們是否出現在 Google AI Overview 搜尋結果中。
請為每篇文章各產生 1 條最可能觸發 AI Overview 的繁體中文搜尋語句。

規則：
- 搜尋語句用繁體中文
- 模擬一般使用者的搜尋習慣（口語化、5-8 個字）
- 不要加引號、site: 等搜尋指令
- 回覆格式：每行一條「文章標題 | 搜尋語句」

文章清單：
${articleList}

網域：${domain}`;
  },

  /**
   * 複製目前批次的提示詞
   */
  async copyCurrentPrompt() {
    const text = this.elements.promptText?.value;
    if (!text) return;

    const ok = await Utils.copyToClipboard(text);
    if (ok) {
      const batchHint = this.totalBatches > 1
        ? `（第 ${this.currentBatch + 1}/${this.totalBatches} 批）`
        : '';
      Toast.success(`AI 提示詞已複製${batchHint}，請貼到 ChatGPT 或 Claude`);
    } else {
      Toast.error('複製失敗，請手動選取');
    }
  },

  /**
   * 智慧貼回 — 解析 AI 回覆並更新語句
   */
  applyPasteBack() {
    const text = this.elements.pasteTextarea?.value || '';

    if (!text.trim()) {
      Toast.error('請先貼入 AI 產生的語句');
      return;
    }

    const pairs = this.parsePasteBack(text);

    if (pairs.length === 0) {
      Toast.error('未偵測到有效語句，請確認格式（標題 | 語句）');
      return;
    }

    // Fuzzy match 並更新
    let matched = 0;

    pairs.forEach(pair => {
      const article = this.fuzzyMatch(pair.title, this.articles);
      if (article) {
        article.query = pair.query;
        matched++;
      }
    });

    if (matched > 0) {
      // 通知 ArticlesTable 更新
      if (typeof ArticlesTable !== 'undefined') {
        ArticlesTable.batchUpdateQueries(pairs);
      }

      Toast.success(`已配對 ${matched}/${pairs.length} 篇文章的搜尋語句`);

      // 清空輸入
      if (this.elements.pasteTextarea) {
        this.elements.pasteTextarea.value = '';
      }

      // 更新完整度
      this.renderCompleteness();
    } else {
      Toast.error('無法配對任何文章，請確認標題是否一致');
    }
  },

  /**
   * 解析貼回的文字
   * @param {string} text - AI 回覆文字
   * @returns {Array<{title: string, query: string}>}
   */
  parsePasteBack(text) {
    return text.split('\n')
      .map(line => line.trim())
      .filter(Boolean)
      // 移除 markdown 列表前綴
      .map(line => line.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*]\s*/, ''))
      .map(line => {
        // 嘗試多種分隔符
        const separators = ['|', '｜', ' → ', ' -> ', '：', ': '];
        for (const sep of separators) {
          const idx = line.indexOf(sep);
          if (idx > 0) {
            const title = line.substring(0, idx).trim();
            const query = line.substring(idx + sep.length).trim();
            if (title && query) {
              return { title, query };
            }
          }
        }
        return null;
      })
      .filter(Boolean);
  },

  /**
   * Fuzzy match 標題
   * @param {string} needle - 要找的標題
   * @param {Array} articles - 文章清單
   * @returns {Object|null} 最佳匹配的文章
   */
  fuzzyMatch(needle, articles) {
    const cleaned = needle.replace(/[""''「」『』【】《》\s]/g, '').toLowerCase();

    // 完全匹配
    let match = articles.find(a =>
      a.title.replace(/[""''「」『』【】《》\s]/g, '').toLowerCase() === cleaned
    );
    if (match) return match;

    // 包含匹配
    match = articles.find(a => {
      const aTitle = a.title.replace(/[""''「」『』【】《》\s]/g, '').toLowerCase();
      return aTitle.includes(cleaned) || cleaned.includes(aTitle);
    });
    if (match) return match;

    // 前 8 字匹配
    const short = cleaned.substring(0, 8);
    match = articles.find(a => {
      const aTitle = a.title.replace(/[""''「」『』【】《》\s]/g, '').toLowerCase();
      return aTitle.startsWith(short) || short.startsWith(aTitle.substring(0, 8));
    });

    return match || null;
  },

  /**
   * 渲染完整度提示
   */
  renderCompleteness() {
    if (!this.elements.completenessBar) return;

    const total = this.articles.length;
    const withQuery = this.articles.filter(a => a.query && a.query.trim()).length;
    const missing = total - withQuery;

    if (missing === 0) {
      this.elements.completenessBar.className = 'completeness-bar complete';
      this.elements.completenessBar.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
        全部 ${total} 篇都有搜尋語句了！
      `;
    } else {
      this.elements.completenessBar.className = 'completeness-bar incomplete';
      this.elements.completenessBar.innerHTML = `
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        還有 ${missing} 篇缺少搜尋語句（共 ${total} 篇）
      `;
    }
  },

  /**
   * 顯示面板
   */
  show() {
    this.elements.panel?.classList.remove('hidden');
  },

  /**
   * 隱藏面板
   */
  hide() {
    this.elements.panel?.classList.add('hidden');
  }
};
