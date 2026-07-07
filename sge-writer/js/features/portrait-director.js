/**
 * SGE 文案助手 - 立繪導演系統
 * 像 GBA 遊戲一樣，根據劇情狀態切換左側角色立繪
 *
 * 觸發時機：
 * 1. 進入網站 → 伊歐歡迎（scene-guide-welcome）
 * 2. 填寫任務資訊 → 伊歐引導（guide-default）
 * 3. 開始撰寫 → 哈皮登場（writer-joy）
 * 4. 分析/查核 → BLUE 登場（player-default）
 * 5. 升級時 → 對應角色的 joy 表情
 * 6. 支語小警察觸發 → BLUE 表情隨結果變
 */

import { CHARACTERS } from '../data/characters.js';

const PORTRAIT_BASE = 'icons/characters/';

/** 角色 → 劇情立繪對應表 */
const SCENE_MAP = {
  // 進入網站
  welcome: { img: 'scene-welcome-1.png', character: 'guide', name: '伊歐', role: '領航員' },
  // 回訪（非首次）
  welcomeBack: { img: 'scene-guide-welcomeback-1.png', character: 'guide', name: '伊歐', role: '領航員' },
  // 主打夥伴的迎接立繪（開場選擇的後果）
  partnerGuide: { img: 'scene-guide-welcomeback-2.png', character: 'guide', name: '伊歐', role: '領航員' },
  partnerWriter: { img: 'scene-welcome-2.png', character: 'writer', name: '哈皮', role: '吟遊詩人' },
  partnerPlayer: { img: 'scene-player-notes-1.png', character: 'player', name: 'BLUE', role: '文案見習生' },
  // 里程碑演出（暫現後回到步驟場景）
  scoreMagic: { img: 'scene-guide-magic-1.png', character: 'guide', name: '伊歐', role: '領航員' },
  proofCheer: { img: 'scene-player-encourage-1.png', character: 'player', name: 'BLUE', role: '文案見習生' },
  questDone: { img: 'scene-guide-welcomeback-4.png', character: 'guide', name: '伊歐', role: '領航員' },
  // 引導階段（Step 1）
  guiding: { img: 'guide-default-1.png', character: 'guide', name: '伊歐', role: '領航員' },
  // 開始撰寫（Step 3）
  writing: { img: 'writer-joy-1.png', character: 'writer', name: '哈皮', role: '吟遊詩人' },
  // 查核分析（Step 2）
  checking: { img: 'player-default-1.png', character: 'player', name: 'BLUE', role: '文案見習生' },
  // 校對（Step 4）
  proofing: { img: 'guide-happy-1.png', character: 'guide', name: '伊歐', role: '領航員' },
  // 升級
  levelUp: { img: 'guide-joy-1.png', character: 'guide', name: '伊歐', role: '領航員' },
  // 支語小警察 - 安全
  zhiyuSafe: { img: 'player-happy-1.png', character: 'player', name: 'BLUE', role: '支語小警察' },
  // 支語小警察 - 警告
  zhiyuWarning: { img: 'player-default-2.png', character: 'player', name: 'BLUE', role: '支語小警察' },
  // 支語小警察 - 危險
  zhiyuDanger: { img: 'player-angry-1.png', character: 'player', name: 'BLUE', role: '支語小警察' },
};

export const portraitDirector = {
  _currentScene: null,
  _el: null,
  _imgEl: null,
  _nameEl: null,
  _roleEl: null,

  /** 初始化，綁定 DOM */
  init() {
    this._el = document.getElementById('portrait-showcase');
    this._imgEl = document.getElementById('main-portrait');
    this._nameEl = document.getElementById('portrait-name');
    this._roleEl = document.getElementById('portrait-role');

    if (!this._el) return;

    // 開場：伊歐歡迎
    this.setScene('welcome');
  },

  /**
   * 切換場景立繪
   * @param {string} sceneKey - SCENE_MAP 的 key
   * @param {string} [customImg] - 自訂圖片檔名（覆蓋預設）
   */
  setScene(sceneKey, customImg) {
    const scene = SCENE_MAP[sceneKey];
    if (!scene || !this._el) return;
    if (this._currentScene === sceneKey && !customImg) return;

    this._currentScene = sceneKey;

    // 立繪切換動畫
    if (this._imgEl) {
      this._imgEl.classList.add('switching');
      setTimeout(() => {
        this._imgEl.src = PORTRAIT_BASE + (customImg || scene.img);
        this._imgEl.alt = scene.name;
        this._imgEl.classList.remove('switching');
      }, 150);
    }

    // 更新名牌
    if (this._nameEl) this._nameEl.textContent = scene.name;
    if (this._roleEl) this._roleEl.textContent = scene.role;

    // 更新角色主題色
    this._el.dataset.character = scene.character;
  },

  /**
   * 用自訂圖片直接更新立繪（不改名牌）
   * @param {string} imgFile - 圖片檔名
   */
  setPortrait(imgFile) {
    if (!this._imgEl) return;
    this._imgEl.classList.add('switching');
    setTimeout(() => {
      this._imgEl.src = PORTRAIT_BASE + imgFile;
      this._imgEl.classList.remove('switching');
    }, 150);
  },

  /**
   * 根據 Step 自動切換
   * @param {number} step - 1=引導, 2=查核, 3=撰寫, 4=校對
   */
  onStepChange(step) {
    const stepMap = { 1: 'guiding', 2: 'checking', 3: 'writing', 4: 'proofing' };
    const sceneKey = stepMap[step];
    if (sceneKey) {
      clearTimeout(this._flashTimer); // 步驟推進優先於暫現場景
      this.setScene(sceneKey);
    }
  },

  /**
   * 暫現場景：演出幾秒後回到指定場景（里程碑儀式感）
   * @param {string} sceneKey - 要演出的場景
   * @param {string} revertKey - 結束後回到的場景
   * @param {number} [ms=4000] - 演出時間
   */
  flashScene(sceneKey, revertKey, ms = 4000) {
    if (!SCENE_MAP[sceneKey]) return;
    clearTimeout(this._flashTimer);
    this.setScene(sceneKey);
    this._flashTimer = setTimeout(() => {
      // 只有暫現場景還在台上才換回去（避免蓋掉後來的切換）
      if (this._currentScene === sceneKey && SCENE_MAP[revertKey]) {
        this.setScene(revertKey);
      }
    }, ms);
  },

  /**
   * 支語小警察結果
   * @param {'safe'|'warning'|'danger'} status
   */
  onZhiyuResult(status) {
    const statusMap = { safe: 'zhiyuSafe', warning: 'zhiyuWarning', danger: 'zhiyuDanger' };
    const sceneKey = statusMap[status];
    if (sceneKey) this.setScene(sceneKey);
  }
};
