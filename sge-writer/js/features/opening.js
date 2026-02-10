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

/** 三位角色的開場劇情 */
const OPENING_STORIES = {
  guide: {
    name: '伊歐',
    role: '領航員',
    color: '#D4A5A5',
    slogan: '讓我引導你前進，這條路我很熟悉。',
    cg: 'scene-guide-welcome-white.png',
    dialogs: [
      { img: 'guide-default-1.png', text: '偵測到新訪客——歡迎來到 SGE 文案大陸。我是伊歐，你的領航員。' },
      { img: 'guide-happy-1.png', text: '這裡的規則很簡單：寫出好內容，讓搜尋引擎看見你的價值。' },
      { img: 'guide-joy-1.png', text: '別擔心，我會一步步帶你前進。準備好了嗎？那就開始吧。' },
    ]
  },
  writer: {
    name: '哈皮',
    role: '吟遊詩人',
    color: '#B8A9C9',
    slogan: '文案就像音樂，讓我們一起創作旋律吧♪',
    cg: 'writer-joy-1.png',
    dialogs: [
      { img: 'writer-joy-1.png', text: '哇！新朋友～～歡迎來到這個充滿文字魔法的地方！我是哈皮♪' },
      { img: 'writer-joy-2.png', text: '寫文案就像彈豎琴一樣，每個字都是音符，組合起來就是動人的旋律～' },
      { img: 'writer-default-1.png', text: 'SGE 文案大陸需要你的創意！讓我們一起用文字改變世界吧！' },
    ]
  },
  player: {
    name: 'BLUE',
    role: '文案見習生',
    color: '#2C3E50',
    slogan: '......演算法不簡單，但我可以陪你研究。',
    cg: 'player-default-1.png',
    dialogs: [
      { img: 'player-default-1.png', text: '......新人？我是 BLUE，文案見習生。' },
      { img: 'player-default-2.png', text: '這裡不是玩遊戲的地方。SGE 演算法很複雜，你得認真學習才能掌握。' },
      { img: 'player-happy-1.png', text: '不過......如果你願意一起研究，我可以分享我的筆記。歡迎加入。' },
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
          <h2>歡迎來到 SGE 文案大陸</h2>
          <p>選擇一位角色作為你的引路人</p>
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

    // 標記已觀看
    localStorage.setItem(STORAGE_KEY, 'true');

    // 回呼
    if (this._onComplete) {
      this._onComplete(this._currentStory);
    }
  }
};
