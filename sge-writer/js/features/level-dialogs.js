/**
 * SGE 文案助手 - GBA 風格升級對話系統
 * @module features/level-dialogs
 *
 * 等級提升時顯示 GBA 風格全螢幕對話，搭配角色立繪
 */

import { CHARACTERS } from '../data/characters.js';

/** 角色立繪基礎路徑 */
const PORTRAIT_BASE = 'icons/characters/';

// ─── 升級對話資料 ──────────────────────────
const LEVEL_DIALOGS = {
  2: {
    character: 'guide',
    emotion: 'joy',
    lines: [
      { speaker: 'guide', img: 'guide-joy-1.png', text: '偵測到信號——你的第一篇文案，已經成功被演算法收錄了。' },
      { speaker: 'guide', img: 'guide-joy-2.png', text: '別小看這一步。很多人連起點都找不到，而你已經在路上了。' },
      { speaker: 'writer', img: 'writer-joy-1.png', text: '耶耶耶～初階寫手誕生！我用豎琴幫你譜一首出道曲好不好♪' },
      { speaker: 'guide', img: 'guide-default-2.png', text: '......哈皮，先讓人家好好感受一下這個瞬間。' },
    ],
    reward: '解鎖稱號：初階寫手',
  },
  3: {
    character: 'writer',
    emotion: 'happy',
    lines: [
      { speaker: 'writer', img: 'writer-joy-1.png', text: '等等——讓我看看......這段文案，有溫度耶！不是機器人寫的那種冷冰冰！' },
      { speaker: 'writer', img: 'writer-joy-2.png', text: '你知道嗎？文案最重要的不是技巧，是靈魂的溫度。而你已經開始發光了～' },
      { speaker: 'guide', img: 'guide-happy-1.png', text: '數據也支持這個結論。你的內容品質指標，穩定成長中。' },
      { speaker: 'player', img: 'player-default-2.png', text: '......原來寫文案也可以像說故事一樣。我好像也想試試看。' },
    ],
    reward: '解鎖稱號：內容創作者',
  },
  4: {
    character: 'player',
    emotion: 'joy',
    lines: [
      { speaker: 'player', img: 'player-default-3.png', text: '......我一直以為演算法是敵人，要想辦法打倒它。' },
      { speaker: 'player', img: 'player-joy-1.png', text: '但跟著你寫了這些文案之後，我懂了。它只是另一種語言——使用者需求的語言。' },
      { speaker: 'guide', img: 'guide-happy-2.png', text: '說得好，BLUE。瞭解使用者的需求，自然懂得演算法。這就是 SEO 的本質。' },
      { speaker: 'writer', img: 'writer-joy-2.png', text: 'SEO 劍士！好帥的稱號～我要寫一首「劍與搜尋引擎之歌」獻給你♪' },
    ],
    reward: '解鎖稱號：SEO 劍士',
  },
  5: {
    character: 'guide',
    emotion: 'happy',
    lines: [
      { speaker: 'guide', img: 'guide-happy-3.png', text: '全域路徑掃描完畢——你已經抵達了這趟旅程的最高點。' },
      { speaker: 'guide', img: 'guide-happy-4.png', text: '從今天起，你不只是寫文案的人。你是能讓好內容被世界看見的人。' },
      { speaker: 'writer', img: 'writer-sad-1.png', text: '嗚嗚......我的眼淚快掉下來了......從 Lv.1 走到這裡，你真的好厲害！' },
      { speaker: 'player', img: 'player-happy-1.png', text: '謝謝你帶著我們走完這段路。這些日子學到的東西......我會一直記住的。' },
      { speaker: 'guide', img: 'guide-happy-1.png', text: 'SGE 大師——這個稱號，你當之無愧。去吧，用你的文字改變搜尋結果的風景。' },
    ],
    reward: '最高稱號：SGE 大師',
  },
};

// ─── 對話系統 ──────────────────────────────

export const levelDialogs = {
  _modal: null,
  _currentLineIndex: 0,
  _currentLines: [],
  _currentReward: '',
  _onComplete: null,

  /**
   * 顯示升級對話
   * @param {number} newLevel - 新等級
   * @param {Function} [onComplete] - 對話結束後的回呼
   */
  show(newLevel, onComplete) {
    const dialog = LEVEL_DIALOGS[newLevel];
    if (!dialog) {
      if (onComplete) onComplete();
      return;
    }

    this._currentLines = dialog.lines;
    this._currentReward = dialog.reward;
    this._currentLineIndex = 0;
    this._onComplete = onComplete;

    // 取得 Modal 元素
    this._modal = document.getElementById('level-dialog-modal');
    if (!this._modal) {
      if (onComplete) onComplete();
      return;
    }

    // 顯示 Modal
    this._modal.classList.add('active');

    // 🎮 GBA 遊戲風格：鎖定背景滾動
    document.body.style.overflow = 'hidden';

    // 綁定繼續按鈕
    const continueBtn = document.getElementById('level-dialog-continue');
    continueBtn.onclick = () => this._nextLine();

    // 綁定鍵盤
    this._keyHandler = (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this._nextLine();
      }
    };
    document.addEventListener('keydown', this._keyHandler);

    // 更新等級標示
    const levelBadge = document.getElementById('level-dialog-level');
    if (levelBadge) levelBadge.textContent = `Lv.${newLevel}`;

    // 顯示第一行
    this._showLine(0);
  },

  /** 顯示指定行的對話 @private */
  _showLine(index) {
    const line = this._currentLines[index];
    if (!line) return;

    const char = CHARACTERS[line.speaker];
    const speakerEl = document.getElementById('level-dialog-speaker');
    const textEl = document.getElementById('level-dialog-text');
    const avatarEl = document.getElementById('level-dialog-avatar');
    const continueBtn = document.getElementById('level-dialog-continue');
    const rewardEl = document.getElementById('level-dialog-reward');

    // 更新角色資訊
    if (speakerEl) {
      speakerEl.textContent = char ? char.name : line.speaker;
      speakerEl.style.color = char ? char.color : '#333';
    }

    // 更新頭像立繪
    if (avatarEl) {
      avatarEl.style.borderColor = char ? char.color : '#333';
      const imgEl = avatarEl.querySelector('img');
      if (imgEl && line.img) {
        imgEl.src = PORTRAIT_BASE + line.img;
        imgEl.alt = char ? char.name : line.speaker;
      }
    }

    // 打字機效果
    if (textEl) {
      textEl.textContent = '';
      this._typeText(textEl, line.text, 0);
    }

    // 最後一行顯示獎勵，否則顯示繼續
    const isLast = index === this._currentLines.length - 1;
    if (rewardEl) {
      rewardEl.style.display = isLast ? 'block' : 'none';
      rewardEl.textContent = this._currentReward;
    }
    if (continueBtn) {
      continueBtn.textContent = isLast ? '▶ 關閉' : '▶ 繼續';
    }
  },

  /** 打字機效果 @private */
  _typeText(el, text, index) {
    if (index < text.length) {
      el.textContent += text[index];
      this._typeTimer = setTimeout(() => this._typeText(el, text, index + 1), 30);
    }
  },

  /** 下一行或關閉 @private */
  _nextLine() {
    clearTimeout(this._typeTimer);

    this._currentLineIndex++;

    if (this._currentLineIndex >= this._currentLines.length) {
      this._hide();
      return;
    }

    this._showLine(this._currentLineIndex);
  },

  /** 隱藏對話 @private */
  _hide() {
    if (this._modal) {
      this._modal.classList.remove('active');
    }

    // 🎮 GBA 遊戲風格：恢復背景滾動
    document.body.style.overflow = '';

    if (this._keyHandler) {
      document.removeEventListener('keydown', this._keyHandler);
      this._keyHandler = null;
    }
    clearTimeout(this._typeTimer);
    if (this._onComplete) this._onComplete();
  }
};

// 🎮 測試用：在 console 輸入 testLevelUp(2) 即可觸發
window.testLevelUp = (level) => levelDialogs.show(level || 2);
