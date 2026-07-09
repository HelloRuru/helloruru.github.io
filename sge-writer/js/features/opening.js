/**
 * SGE 文案助手 - 開場劇情系統
 * 首次進入網站時的角色迎接演出
 *
 * 流程：
 * 1. 檢測是否第一次訪問（localStorage）
 * 2. 全螢幕開場畫面 + Logo 淡入
 * 3. 角色選擇（伊歐/哈皮/BLUE）
 * 4. 播放選定角色的歡迎 CG + 對話
 * 5. 進入主畫面
 */

const PORTRAIT_BASE = 'icons/characters/';
const STORAGE_KEY = 'sge-first-visit-done';

/** 三位角色的開場劇情 — GEO 教學導覽版 */
const OPENING_STORIES = {
  guide: {
    name: '伊歐',
    role: '領航員',
    color: '#D4A5A5',
    slogan: '讓我引導你前進，這條路我很熟悉。',
    cg: 'scene-guide-welcome-white.png',
    dialogs: [
      { img: 'guide-default-1.png', text: '偵測到新訪客——歡迎來到 GEO 文案冒險學院。我是伊歐，你的領航員。' },
      { img: 'guide-happy-1.png', text: 'GEO 就是「生成式引擎優化」— 讓你的文章更容易被 ChatGPT、Perplexity、Google AI Overview 引用。跟傳統 SEO 不一樣，AI 看的是證據不是關鍵字密度。' },
      { img: 'guide-joy-1.png', text: '右邊的編輯器會即時分析你的 GEO 引用力。左邊的 GEO 技能樹會記錄你的學習進度。先填 H1 標題和關鍵字，開始你第一趟冒險吧！' },
    ]
  },
  writer: {
    name: '哈皮',
    role: '吟遊詩人',
    color: '#B8A9C9',
    slogan: '文案就像音樂，讓我們一起創作旋律吧♪',
    cg: 'writer-joy-1.png',
    dialogs: [
      { img: 'writer-joy-1.png', text: '哇！新朋友～～歡迎來到 GEO 文案冒險學院！我是吟遊詩人哈皮♪' },
      { img: 'writer-joy-2.png', text: '你知道嗎？AI 搜尋引擎最喜歡引用有數據、有來源、有故事的文章。寫得越生動、越有畫面，AI 越愛你！跟我一起創作讓 AI 也想引用的旋律吧～' },
      { img: 'writer-default-1.png', text: '我會在你寫作的時候即時給建議喔！右邊的分析面板會告訴你「證據引用」「表達流暢」這些維度哪些可以更好～快開始創作吧！' },
    ]
  },
  player: {
    name: 'BLUE',
    role: '文案見習生',
    color: '#6D5954',
    slogan: '......演算法不簡單，但我可以陪你研究。',
    cg: 'player-default-1.png',
    dialogs: [
      { img: 'player-default-1.png', text: '......新人？我是 BLUE，文案見習生。這裡是 GEO 文案冒險學院。' },
      { img: 'player-default-2.png', text: 'GEO 不是魔法，是方法論。你的文章會被 5 個維度打分數：證據引用（40分）、結構規範（25分）、表達流暢（10分）、問題覆蓋（15分）、權威信號（10分）。總分 100。' },
      { img: 'player-happy-1.png', text: '......先從填寫 H1 和關鍵字開始吧。右邊的分析面板會即時更新分數，左邊的技能樹會記錄你的學習進度。一步步來，我也在學。' },
    ]
  }
};

export const opening = {
  _currentStory: null,
  _currentLineIndex: 0,
  _onComplete: null,

  /** 檢查是否需要顯示開場 */
  shouldShow() {
    return !localStorage.getItem(STORAGE_KEY);
  },

  /** 顯示開場流程 */
  show(onComplete) {
    this._onComplete = onComplete;

    // Step 1: 顯示角色選擇畫面
    this._showCharacterSelection();
  },

  /** 角色選擇畫面 */
  _showCharacterSelection() {
    const modal = document.createElement('div');
    modal.className = 'opening-modal active';
    modal.innerHTML = `
      <div class="opening-backdrop"></div>
      <div class="opening-box">
        <div class="opening-title">
          <h2>歡迎來到 GEO 文案冒險學院</h2>
          <p>選擇一位夥伴，帶領你開始 GEO 學習之旅</p>
        </div>
        <div class="opening-choices">
          ${Object.entries(OPENING_STORIES).map(([key, story]) => `
            <button class="opening-choice" data-character="${key}" style="border-color: ${story.color}">
              <div class="choice-symbol" style="background: linear-gradient(135deg, ${story.color}, rgba(${story.color === '#D4A5A5' ? '212,165,165' : story.color === '#B8A9C9' ? '184,169,201' : '44,62,80'},0.3))">
                <div class="choice-glow"></div>
              </div>
              <div class="choice-slogan">
                ${story.slogan}
              </div>
            </button>
          `).join('')}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    document.body.style.overflow = 'hidden';

    // 綁定選擇事件
    modal.querySelectorAll('.opening-choice').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const character = e.currentTarget.dataset.character;
        this._startStory(character, modal);
      });
    });
  },

  /** 開始播放選定角色的劇情 */
  _startStory(characterKey, selectionModal) {
    this._currentStory = OPENING_STORIES[characterKey];
    this._currentCharacterKey = characterKey;
    this._currentLineIndex = 0;

    // 移除選擇畫面
    selectionModal.remove();

    // 創建劇情對話框
    const modal = document.createElement('div');
    modal.className = 'opening-dialog-modal active';
    modal.innerHTML = `
      <div class="opening-backdrop"></div>
      <div class="opening-dialog-box">
        <div class="opening-portrait" id="opening-portrait">
          <img src="${PORTRAIT_BASE}${this._currentStory.dialogs[0].img}" alt="${this._currentStory.name}">
        </div>
        <div class="opening-content">
          <div class="opening-speaker" id="opening-speaker" style="color: ${this._currentStory.color}">
            ${this._currentStory.name}
          </div>
          <div class="opening-text" id="opening-text"></div>
          <button class="opening-continue" id="opening-continue">▶ 繼續</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    this._dialogModal = modal;

    // 綁定繼續按鈕
    const continueBtn = modal.querySelector('#opening-continue');
    continueBtn.onclick = () => this._nextLine();

    // 鍵盤支援
    this._keyHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._nextLine();
      }
    };
    document.addEventListener('keydown', this._keyHandler);

    // 顯示第一行
    this._showLine(0);
  },

  /** 顯示指定行對話 */
  _showLine(index) {
    const line = this._currentStory.dialogs[index];
    if (!line) return;

    const portraitEl = document.getElementById('opening-portrait');
    const textEl = document.getElementById('opening-text');
    const continueBtn = document.getElementById('opening-continue');

    // 更新立繪
    if (portraitEl) {
      const img = portraitEl.querySelector('img');
      img.classList.add('switching');
      setTimeout(() => {
        img.src = PORTRAIT_BASE + line.img;
        img.classList.remove('switching');
      }, 150);
    }

    // 打字機效果
    if (textEl) {
      textEl.textContent = '';
      this._typeText(textEl, line.text, 0);
    }

    // 最後一行改為「開始冒險」
    const isLast = index === this._currentStory.dialogs.length - 1;
    if (continueBtn) {
      continueBtn.textContent = isLast ? '▶ 開始冒險' : '▶ 繼續';
    }
  },

  /** 打字機效果 */
  _typeText(el, text, index) {
    if (index < text.length) {
      el.textContent += text[index];
      this._typeTimer = setTimeout(() => this._typeText(el, text, index + 1), 30);
    }
  },

  /** 下一行或結束 */
  _nextLine() {
    clearTimeout(this._typeTimer);

    this._currentLineIndex++;

    if (this._currentLineIndex >= this._currentStory.dialogs.length) {
      this._finish();
      return;
    }

    this._showLine(this._currentLineIndex);
  },

  /** 結束開場 */
  _finish() {
    // 移除對話框
    if (this._dialogModal) {
      this._dialogModal.remove();
    }

    // 恢復滾動
    document.body.style.overflow = '';

    // 移除鍵盤監聽
    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }

    // 標記已觀看 + 記住選定的主打夥伴（選擇要有後果）
    localStorage.setItem(STORAGE_KEY, 'true');
    localStorage.setItem('sge-partner', this._currentCharacterKey);

    // 回呼
    if (this._onComplete) {
      this._onComplete(this._currentCharacterKey, this._currentStory);
    }
  }
};
