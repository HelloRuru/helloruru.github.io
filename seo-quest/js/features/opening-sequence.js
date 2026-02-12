// SEO Quest - 開場序列系統（傳統 RPG 風格）
// 功能：神諭 → 傳送陣 → 伊歐登場 → 詢問名字
// 操作：手動點擊「下一頁」推進 + 對話 LOG

// 場景配置（用 fetch 取代 import assert，Safari 不支援 import assertions）
let scenesConfig = null;

async function loadScenesConfig() {
  try {
    const res = await fetch('assets/scenes/encounters/scenes-config.json');
    if (res.ok) {
      scenesConfig = await res.json();
    }
  } catch {
    // 場景圖載入失敗不影響主流程
    console.warn('Scene config load failed, backgrounds will be skipped.');
  }
}

class OpeningSequence {
  constructor() {
    this.currentStep = 0;
    this.playerName = '';
    this.scenesBasePath = 'assets/scenes/encounters-edited/';
    this.dialogueHistory = []; // 對話 LOG
    this._keydownHandler = null; // 保存 handler 引用以便移除

    // 開場流程（傳統 RPG 風格）
    this.steps = [
      {
        type: 'narration',
        scene: null,  // 黑屏
        text: '迷路的旅人啊，現在是你重新學會 SEO 的時機。',
        speaker: '神秘聲音'
      },
      {
        type: 'narration',
        scene: 'portal',  // 傳送陣
        text: '你睜開眼睛，發現自己站在一座發光的傳送陣上...',
        speaker: null
      },
      {
        type: 'dialogue',
        scene: 'tutorial',  // 伊歐書房
        text: '（銀色長杖輕點地面）歡迎來到 SEO Quest。我是伊歐，這趟航行的引導者。',
        speaker: '伊歐'
      },
      {
        type: 'input',
        scene: 'tutorial',
        text: '在開始之前，我需要知道——該如何稱呼你？',
        speaker: '伊歐',
        inputPlaceholder: '請輸入你的名字'
      }
    ];
  }

  /**
   * 檢查是否首次訪問
   */
  isFirstVisit() {
    return !localStorage.getItem('seo-quest-player-name');
  }

  /**
   * 開始開場序列
   */
  async start() {
    if (!this.isFirstVisit()) {
      return false;
    }

    // 載入場景配置
    await loadScenesConfig();

    this.showOpeningOverlay();
    this.showStep(0);
    this.setupControls();
    return true;
  }

  /**
   * 顯示開場覆蓋層
   */
  showOpeningOverlay() {
    const overlay = document.getElementById('opening-overlay');
    if (!overlay) {
      console.error('Opening overlay not found');
      return;
    }
    overlay.classList.add('active');
    // 鎖定背景滾動
    document.body.style.overflow = 'hidden';
  }

  /**
   * 隱藏開場覆蓋層
   */
  hideOpeningOverlay() {
    const overlay = document.getElementById('opening-overlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
    // 恢復背景滾動
    document.body.style.overflow = '';
    // 移除鍵盤監聽
    if (this._keydownHandler) {
      document.removeEventListener('keydown', this._keydownHandler);
    }
  }

  /**
   * 設置控制按鈕
   */
  setupControls() {
    const prevBtn = document.querySelector('.opening-prev-button');
    const nextBtn = document.querySelector('.opening-next-button');
    const logBtn = document.querySelector('.opening-log-button');
    const logCloseBtn = document.querySelector('.opening-log-close');
    const logOverlay = document.querySelector('.opening-log-overlay');

    // 上一頁
    prevBtn?.addEventListener('click', () => this.prevStep());

    // 下一頁
    nextBtn?.addEventListener('click', () => this.nextStep());

    // 對話 LOG
    logBtn?.addEventListener('click', () => this.showLog());

    // 關閉 LOG
    logCloseBtn?.addEventListener('click', () => this.hideLog());

    // 點擊 LOG 覆蓋層背景關閉
    logOverlay?.addEventListener('click', (e) => {
      if (e.target === logOverlay) {
        this.hideLog();
      }
    });

    // 鍵盤快捷鍵（保存 handler 引用）
    this._keydownHandler = (e) => {
      // LOG 開啟時，ESC 鍵關閉
      if (document.querySelector('.opening-log-overlay.visible')) {
        if (e.key === 'Escape') {
          this.hideLog();
        }
        return;
      }

      // 主對話鍵盤控制
      if (!document.querySelector('.opening-overlay.active')) return;

      // 如果焦點在名字輸入框，只處理 Enter（其他鍵讓輸入框正常使用）
      const activeEl = document.activeElement;
      const isInNameInput = activeEl?.closest('.opening-name-input');
      if (isInNameInput) {
        if (e.key === 'Enter') {
          e.preventDefault();
          this.nextStep();
        }
        return; // 不攔截其他按鍵
      }

      if (e.key === 'ArrowLeft') {
        this.prevStep();
      } else if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        this.nextStep();
      } else if (e.key === 'l' || e.key === 'L') {
        this.showLog();
      }
    };
    document.addEventListener('keydown', this._keydownHandler);
  }

  /**
   * 顯示指定步驟
   */
  showStep(index) {
    if (index < 0 || index >= this.steps.length) return;

    this.currentStep = index;
    const step = this.steps[index];

    // 更新場景圖
    if (step.scene) {
      this.updateScene(step.scene);
    } else {
      this.clearScene();
    }

    // 更新對話內容（立即顯示，無打字機效果）
    this.updateDialogue(step);

    // 記錄到對話 LOG
    this.addToHistory(step);

    // 更新按鈕狀態
    this.updateButtons();

    // 根據類型處理：顯示或隱藏名字輸入
    const inputContainer = document.querySelector('.opening-name-input');
    if (step.type === 'input') {
      this.showNameInput(step);
    } else if (inputContainer) {
      // 非輸入步驟：隱藏名字輸入區（修復回退 Bug）
      inputContainer.classList.remove('visible');
    }
  }

  /**
   * 上一步
   */
  prevStep() {
    if (this.currentStep > 0) {
      this.showStep(this.currentStep - 1);
    }
  }

  /**
   * 下一步
   */
  nextStep() {
    const step = this.steps[this.currentStep];

    // 如果是輸入名字步驟，檢查是否已輸入
    if (step.type === 'input') {
      const input = document.querySelector('.opening-name-input input');
      const name = input?.value.trim();

      if (!name) {
        input?.focus();
        // 加入視覺提示
        input?.classList.add('shake');
        setTimeout(() => input?.classList.remove('shake'), 400);
        return;
      }

      this.playerName = name;
      localStorage.setItem('seo-quest-player-name', name);
      this.finish();
      return;
    }

    // 繼續下一步
    if (this.currentStep < this.steps.length - 1) {
      this.showStep(this.currentStep + 1);
    }
  }

  /**
   * 更新按鈕狀態
   */
  updateButtons() {
    const prevBtn = document.querySelector('.opening-prev-button');
    const nextBtn = document.querySelector('.opening-next-button');
    const step = this.steps[this.currentStep];

    // 上一頁按鈕
    if (prevBtn) {
      prevBtn.disabled = this.currentStep === 0;
    }

    // 下一頁按鈕文字
    if (nextBtn) {
      if (step.type === 'input') {
        nextBtn.textContent = '開始冒險 →';
      } else {
        nextBtn.textContent = '下一頁 →';
      }
    }
  }

  /**
   * 更新場景圖
   */
  updateScene(sceneKey) {
    if (!scenesConfig) return; // 場景配置未載入

    const config = scenesConfig[sceneKey];
    if (!config) return;

    // 從圖片池隨機選擇
    const pool = config.pool;
    const randomIndex = Math.floor(Math.random() * pool.length);
    const filename = pool[randomIndex];
    const imagePath = this.scenesBasePath + filename;

    // 更新背景圖
    const sceneEl = document.querySelector('.opening-scene');
    if (sceneEl) {
      sceneEl.style.backgroundImage = `url('${imagePath}')`;
      sceneEl.classList.add('visible');
    }
  }

  /**
   * 清除場景圖（黑屏）
   */
  clearScene() {
    const sceneEl = document.querySelector('.opening-scene');
    if (sceneEl) {
      sceneEl.style.backgroundImage = 'none';
      sceneEl.classList.remove('visible');
    }
  }

  /**
   * 更新對話內容（立即顯示，無打字機效果）
   */
  updateDialogue(step) {
    const dialogueBox = document.querySelector('.opening-dialogue-box');
    if (!dialogueBox) return;

    const speakerEl = dialogueBox.querySelector('.opening-speaker');
    const textEl = dialogueBox.querySelector('.opening-text');

    if (speakerEl) {
      speakerEl.textContent = step.speaker || '';
      speakerEl.style.display = step.speaker ? 'block' : 'none';
    }

    // 立即顯示完整文字（無打字機效果）
    if (textEl) {
      textEl.textContent = step.text;
    }

    dialogueBox.classList.add('visible');
  }

  /**
   * 顯示名字輸入
   */
  showNameInput(step) {
    const inputContainer = document.querySelector('.opening-name-input');
    if (!inputContainer) return;

    const input = inputContainer.querySelector('input');

    if (input) {
      input.placeholder = step.inputPlaceholder;
      if (!input.value) input.value = '';
    }

    inputContainer.classList.add('visible');

    // 聚焦輸入框
    setTimeout(() => input?.focus(), 100);
  }

  /**
   * 記錄到對話 LOG（去重）
   */
  addToHistory(step) {
    if (step.type === 'input') return; // 輸入步驟不記錄

    // 避免重複記錄（回退再前進時）
    const exists = this.dialogueHistory.some(h => h.index === this.currentStep);
    if (exists) return;

    this.dialogueHistory.push({
      speaker: step.speaker,
      text: step.text,
      index: this.currentStep
    });
  }

  /**
   * 顯示對話 LOG
   */
  showLog() {
    const logOverlay = document.querySelector('.opening-log-overlay');
    const logWrapper = document.querySelector('.opening-log-content');

    if (!logOverlay || !logWrapper) return;

    // 找到或建立 LOG 列表容器（保留 header）
    let logList = logWrapper.querySelector('.opening-log-list');
    if (!logList) {
      logList = document.createElement('div');
      logList.className = 'opening-log-list';
      logWrapper.appendChild(logList);
    }

    // 清空列表並重新填充
    logList.innerHTML = '';

    if (this.dialogueHistory.length === 0) {
      logList.innerHTML = '<p class="opening-log-empty">尚無對話記錄</p>';
    } else {
      this.dialogueHistory.forEach((entry) => {
        const item = document.createElement('div');
        item.className = 'opening-log-item';
        if (entry.index === this.currentStep) {
          item.classList.add('current');
        }

        if (entry.speaker) {
          const speaker = document.createElement('div');
          speaker.className = 'opening-log-speaker';
          speaker.textContent = entry.speaker;
          item.appendChild(speaker);
        }

        const text = document.createElement('div');
        text.className = 'opening-log-text';
        text.textContent = entry.text;
        item.appendChild(text);

        logList.appendChild(item);
      });
    }

    // 顯示 LOG 覆蓋層
    logOverlay.classList.add('visible');

    // 滾動到當前對話
    setTimeout(() => {
      const currentItem = logList.querySelector('.opening-log-item.current');
      currentItem?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 100);
  }

  /**
   * 隱藏對話 LOG
   */
  hideLog() {
    const logOverlay = document.querySelector('.opening-log-overlay');
    if (logOverlay) {
      logOverlay.classList.remove('visible');
    }
  }

  /**
   * 完成開場
   */
  finish() {
    this.hideOpeningOverlay();

    // 觸發自定義事件，通知主程式開場完成
    window.dispatchEvent(new CustomEvent('opening-complete', {
      detail: { playerName: this.playerName }
    }));
  }

  /**
   * 跳過開場（用於測試）
   */
  skip() {
    this.playerName = 'Traveler';
    localStorage.setItem('seo-quest-player-name', this.playerName);
    this.finish();
  }
}

// 自動初始化
let openingSequenceInstance = null;

export function initOpeningSequence() {
  openingSequenceInstance = new OpeningSequence();
  return openingSequenceInstance;
}

export function getPlayerName() {
  return localStorage.getItem('seo-quest-player-name') || 'Traveler';
}

export function resetOpening() {
  localStorage.removeItem('seo-quest-player-name');
  console.log('開場重置完成，重新整理頁面即可重播開場。');
}

// 測試用函數（在 console 執行）
window.testOpening = () => {
  resetOpening();
  location.reload();
};

window.skipOpening = () => {
  if (openingSequenceInstance) {
    openingSequenceInstance.skip();
  }
};
