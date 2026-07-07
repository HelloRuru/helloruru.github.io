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
    choice: {
      prompt: '哈皮還抱著豎琴，眼睛亮晶晶地等你回應......',
      options: [
        { label: '好啊，來一首♪', flag: 'song', speaker: 'writer', img: 'writer-joy-2.png', text: '耶！那我要用最歡樂的旋律，把今天記進詩篇裡！' },
        { label: '先把下一篇寫好再說', flag: 'focus', speaker: 'guide', img: 'guide-happy-1.png', text: '......很好，這種務實，我欣賞。歌讓哈皮先醞釀著。' },
        { label: 'BLUE，你覺得呢？', flag: 'ask-blue', speaker: 'player', img: 'player-happy-1.png', text: '咦、問我嗎？我......我覺得都好！（小聲）其實有點想聽......' },
      ],
    },
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
    choice: {
      prompt: 'BLUE 抱著筆記本，小聲說想試著寫寫看......',
      options: [
        { label: '一起寫吧，我教你', flag: 'teach', speaker: 'player', img: 'player-joy-1.png', text: '真的嗎！我、我會很認真學的！筆記本已經翻到新的一頁了！' },
        { label: '先看我寫，偷學也行', flag: 'watch', speaker: 'writer', img: 'writer-joy-2.png', text: '哈哈，偷學才是吟遊詩人的浪漫♪ BLUE，站我旁邊，這個角度最好抄。' },
        { label: '等你準備好再說', flag: 'wait', speaker: 'guide', img: 'guide-default-2.png', text: '不勉強，也是溫柔的一種。BLUE，時機到了就開口。' },
      ],
    },
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
    choice: {
      prompt: '「劍與搜尋引擎之歌」的主角，想用什麼形象登場？',
      options: [
        { label: '冷靜的策士', flag: 'tactician', speaker: 'guide', img: 'guide-happy-2.png', text: '懂得用腦的劍士，活得最久。這個設定，通過。' },
        { label: '熱血的冒險者', flag: 'adventurer', speaker: 'writer', img: 'writer-joy-1.png', text: '好！副歌我已經想好了！「揮劍斬開演算法的迷霧——」怎麼樣！' },
        { label: '低調的無名劍客', flag: 'ronin', speaker: 'player', img: 'player-default-3.png', text: '......帥。不留名字，只留作品。我喜歡這種設定。' },
      ],
    },
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
    choice: {
      prompt: '走到旅程的最高點，你想對夥伴們說什麼？',
      options: [
        { label: '謝謝你們一路相伴', flag: 'thanks', speaker: 'writer', img: 'writer-sad-1.png', text: '嗚哇......不行，眼淚真的要掉下來了......我要把這句寫進最終章！' },
        { label: '這只是新的起點', flag: 'restart', speaker: 'guide', img: 'guide-happy-4.png', text: '......不愧是你。地圖之外，還有地圖。我重新校準座標了。' },
        { label: '下一篇，繼續。', flag: 'next', speaker: 'player', img: 'player-happy-1.png', text: '！！好，我馬上準備新的筆記本！大師的下一篇，我要全程觀摩！' },
      ],
    },
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
    this._currentChoice = dialog.choice || null;
    this._currentLevel = newLevel;
    this._choiceDone = false;
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

    // 最後一行顯示獎勵；有選項時最後一行改「繼續」進入選擇
    const isLast = index === this._currentLines.length - 1;
    if (rewardEl) {
      rewardEl.style.display = isLast ? 'block' : 'none';
      rewardEl.textContent = this._currentReward;
    }
    if (continueBtn) {
      continueBtn.textContent = isLast && !this._currentChoice ? '▶ 關閉' : '▶ 繼續';
    }
  },

  /** 顯示角度選項（每個選項都合理，沒有標準答案）@private */
  _showChoices() {
    const textEl = document.getElementById('level-dialog-text');
    const speakerEl = document.getElementById('level-dialog-speaker');
    const continueBtn = document.getElementById('level-dialog-continue');
    const choicesEl = document.getElementById('level-dialog-choices');
    if (!choicesEl) {
      this._hide();
      return;
    }

    if (speakerEl) { speakerEl.textContent = ''; }
    if (textEl) {
      textEl.textContent = '';
      this._typeText(textEl, this._currentChoice.prompt, 0);
    }
    if (continueBtn) continueBtn.style.display = 'none';

    choicesEl.innerHTML = '';
    this._currentChoice.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'level-choice-btn';
      btn.textContent = `▶ ${opt.label}`;
      btn.addEventListener('click', () => this._selectChoice(opt));
      choicesEl.appendChild(btn);
    });
    choicesEl.style.display = 'flex';
  },

  /** 選擇後：記旗標 + 播放角色回應 @private */
  _selectChoice(option) {
    clearTimeout(this._typeTimer); // 停掉提示語的打字機，避免兩段文字交錯
    // 選擇存檔（數值結算層：選擇要留下痕跡）
    try {
      const saved = JSON.parse(localStorage.getItem('sge-choices') || '{}');
      saved[`lv${this._currentLevel}`] = option.flag;
      localStorage.setItem('sge-choices', JSON.stringify(saved));
    } catch (e) { /* localStorage 不可用時忽略 */ }

    const choicesEl = document.getElementById('level-dialog-choices');
    const continueBtn = document.getElementById('level-dialog-continue');
    if (choicesEl) {
      choicesEl.style.display = 'none';
      choicesEl.innerHTML = '';
    }

    this._choiceDone = true;

    // 用一般對話機制播放回應
    this._currentLines = [{ speaker: option.speaker, img: option.img, text: option.text }];
    this._currentLineIndex = 0;
    this._showLine(0);
    if (continueBtn) {
      continueBtn.style.display = '';
      continueBtn.textContent = '▶ 關閉';
    }
  },

  /** 打字機效果 @private */
  _typeText(el, text, index) {
    if (index < text.length) {
      el.textContent += text[index];
      this._typeTimer = setTimeout(() => this._typeText(el, text, index + 1), 30);
    }
  },

  /** 下一行、進入選項、或關閉 @private */
  _nextLine() {
    clearTimeout(this._typeTimer);

    this._currentLineIndex++;

    if (this._currentLineIndex >= this._currentLines.length) {
      // 台詞播完：有選項且還沒選 → 進入角度選擇
      if (this._currentChoice && !this._choiceDone) {
        this._showChoices();
        return;
      }
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

    // 還原選項區與繼續按鈕狀態
    const choicesEl = document.getElementById('level-dialog-choices');
    if (choicesEl) {
      choicesEl.style.display = 'none';
      choicesEl.innerHTML = '';
    }
    const continueBtn = document.getElementById('level-dialog-continue');
    if (continueBtn) continueBtn.style.display = '';

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
