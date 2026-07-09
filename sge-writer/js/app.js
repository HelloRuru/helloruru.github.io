/**
 * GEO 文案冒險學院 - 主程式
 * @module app
 */

import { storage } from './storage.js';
import { editor } from './editor.js';
import { analyzer } from './seo-analyzer.js';
import { templates } from './templates.js';
import { imageStorage } from './image-storage.js';
import { faqUI } from './ui/faq-ui.js';
import { CHARACTERS } from './data/characters.js';
import { levelDialogs } from './features/level-dialogs.js';
import { portraitDirector } from './features/portrait-director.js';
import { opening } from './features/opening.js';

// ========================================
// Utilities
// ========================================
function escapeHTML(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ========================================
// State Management
// ========================================
const state = {
  currentStep: 1,
  partner: localStorage.getItem('sge-partner') || null, // 開場選的主打夥伴
  viewMode: 'quick', // 'quick' or 'detailed'
  questData: {
    keyword: '',
    wordMin: 650,
    wordMax: 700,
    source: '',
    focus: '',
    strategy: null
  },
  partyNames: {
    guide: '伊歐',
    writer: '哈皮',
    player: 'BLUE'
  },
  userProgress: {
    level: 1,
    exp: 0,
    completedQuests: 0
  }
};

// ========================================
// DOM Elements
// ========================================
const elements = {
  // Progress
  progressSteps: document.querySelectorAll('.progress-step'),
  dialogSteps: document.querySelectorAll('.dialog-step'),

  // Party
  guideName: document.getElementById('guide-name'),
  writerName: document.getElementById('writer-name'),
  playerName: document.getElementById('player-name'),
  playerNameDisplays: document.querySelectorAll('.player-name-display'),
  partyMembers: document.querySelectorAll('.member'),

  // Forms (old)
  questForm: document.getElementById('quest-form'),
  keywordInput: document.getElementById('keyword'),
  wordMinInput: document.getElementById('word-min'),
  wordMaxInput: document.getElementById('word-max'),
  sourceInput: document.getElementById('source'),
  focusInput: document.getElementById('focus'),

  // Quick Input (new)
  h1Input: document.getElementById('h1-input'),
  h1CharCount: document.getElementById('h1-char-count'),
  keywordQuick: document.getElementById('keyword-quick'),
  wordMinQuick: document.getElementById('word-min-quick'),
  wordMaxQuick: document.getElementById('word-max-quick'),
  wordTarget: document.getElementById('word-target'),

  // Strategy
  strategyOptions: document.querySelectorAll('.strategy-option'),

  // Fact Check
  factList: document.getElementById('fact-list'),
  goddessCard: document.getElementById('goddess-card'),
  goddessText: document.getElementById('goddess-text'),
  backToStep2: document.getElementById('back-to-step2'),
  confirmFacts: document.getElementById('confirm-facts'),

  // Writing
  writingStatus: document.getElementById('writing-status'),
  commandButtons: document.querySelectorAll('.cmd-btn'),

  // Level
  userLevel: document.getElementById('user-level'),
  levelTitle: document.getElementById('level-title'),
  expFill: document.getElementById('exp-fill'),
  expCurrent: document.getElementById('exp-current'),
  expMax: document.getElementById('exp-max'),

  // Editor
  editor: document.getElementById('editor'),
  toolbarButtons: document.querySelectorAll('.toolbar-btn'),
  templateButtons: document.querySelectorAll('.template-btn'),

  // Analysis
  sgeScore: document.getElementById('sge-score'),
  scoreFill: document.getElementById('score-fill'),
  h1Count: document.getElementById('h1-count'),
  wordCount: document.getElementById('word-count'),
  keywordCount: document.getElementById('keyword-count'),
  violationCount: document.getElementById('violation-count'),
  toneStatus: document.getElementById('tone-status'),
  violationCard: document.getElementById('violation-card'),
  violationList: document.getElementById('violation-list'),
  checkItems: document.querySelectorAll('.check-item'),

  // AI Taste Index
  aiTasteScore: document.getElementById('ai-taste-score'),
  aiTasteFill: document.getElementById('ai-taste-fill'),
  aiTasteEmoji: document.getElementById('ai-taste-emoji'),
  aiTasteMessage: document.getElementById('ai-taste-message'),
  aiNegativeList: document.getElementById('ai-negative-list'),
  aiPositiveList: document.getElementById('ai-positive-list'),

  // GEO 引用力（五大維度）
  sgeStructureScore: document.getElementById('sge-structure-score'),
  sgeStructureFill: document.getElementById('sge-structure-fill'),
  sgeEvidenceValue: document.getElementById('sge-evidence-value'),
  sgeEvidenceIcon: document.getElementById('sge-evidence-icon'),
  sgeStructureValue: document.getElementById('sge-structure-value'),
  sgeStructureIcon: document.getElementById('sge-structure-icon'),
  sgeCoverageValue: document.getElementById('sge-coverage-value'),
  sgeCoverageIcon: document.getElementById('sge-coverage-icon'),
  sgeFluencyValue: document.getElementById('sge-fluency-value'),
  sgeFluencyIcon: document.getElementById('sge-fluency-icon'),
  sgeAuthorityValue: document.getElementById('sge-authority-value'),
  sgeAuthorityIcon: document.getElementById('sge-authority-icon'),

  // Mobile Tabs
  tabButtons: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),

  // Modal
  nameModal: document.getElementById('name-modal'),
  customizeNamesBtn: document.getElementById('customize-names'),
  closeModalBtn: document.getElementById('close-modal'),
  cancelNamesBtn: document.getElementById('cancel-names'),
  nameForm: document.getElementById('name-form'),
  customGuide: document.getElementById('custom-guide'),
  customWriter: document.getElementById('custom-writer'),
  customPlayer: document.getElementById('custom-player'),

  // Image Modal
  imageModal: document.getElementById('image-modal'),
  manageImagesBtn: document.getElementById('manage-images'),
  closeImageModalBtn: document.getElementById('close-image-modal'),

  // Actions
  resetBtn: document.getElementById('reset-btn'),
  themeToggle: document.getElementById('theme-toggle'),
  viewToggleBtns: document.querySelectorAll('.toggle-btn'),

  // Footer
  footerYear: document.getElementById('footer-year'),

  // Toast
  toastContainer: document.getElementById('toast-container')
};

// ========================================
// Level System
// ========================================
const levelSystem = {
  levels: [
    { level: 1, title: '文案見習生', expRequired: 0 },
    { level: 2, title: '初階寫手', expRequired: 100 },
    { level: 3, title: '內容創作者', expRequired: 300 },
    { level: 4, title: 'SEO 劍士', expRequired: 600 },
    { level: 5, title: 'SGE 大師', expRequired: 1000 }
  ],

  getExpForNextLevel(currentLevel) {
    const nextLevel = this.levels.find(l => l.level === currentLevel + 1);
    return nextLevel ? nextLevel.expRequired : this.levels[this.levels.length - 1].expRequired;
  },

  getCurrentLevelInfo(exp) {
    let currentLevel = this.levels[0];
    for (const level of this.levels) {
      if (exp >= level.expRequired) {
        currentLevel = level;
      }
    }
    return currentLevel;
  },

  addExp(amount) {
    state.userProgress.exp += amount;
    const levelInfo = this.getCurrentLevelInfo(state.userProgress.exp);
    const oldLevel = state.userProgress.level;
    state.userProgress.level = levelInfo.level;

    if (levelInfo.level > oldLevel) {
      showToast(`升級了！你現在是 Lv.${levelInfo.level} ${levelInfo.title}`, 'success');
      // GBA 風格升級對話
      levelDialogs.show(levelInfo.level);
    }

    this.updateUI();
    storage.saveProgress(state.userProgress);
  },

  updateUI() {
    const levelInfo = this.getCurrentLevelInfo(state.userProgress.exp);
    const currentLevelExp = levelInfo.expRequired;
    const nextLevelExp = this.getExpForNextLevel(levelInfo.level);
    const expInLevel = state.userProgress.exp - currentLevelExp;
    const expNeeded = nextLevelExp - currentLevelExp;
    const progress = expNeeded > 0 ? (expInLevel / expNeeded) * 100 : 100;

    elements.userLevel.textContent = levelInfo.level;
    elements.levelTitle.textContent = levelInfo.title;
    elements.expCurrent.textContent = state.userProgress.exp;
    elements.expMax.textContent = nextLevelExp;
    elements.expFill.style.width = `${Math.min(progress, 100)}%`;
  }
};

// ========================================
// GEO 技能樹
// ========================================
const skillTree = {
  SKILLS: {
    evidence: { name: '證據引用層', icon: '📊', maxScore: 40, desc: 'AI 引用你的內容，靠的是證據不是形容詞。加入數據（15分）、來源標註（15分）、專家引語（10分）' },
    structure: { name: '結構規範層', icon: '🏗️', maxScore: 25, desc: '清楚的結構讓 AI 一眼看懂脈絡。H1 唯一（4分）、H2 分層（6分）、列點（5分）、表格（5分）、倒金字塔（5分）' },
    fluency: { name: '表達流暢層', icon: '💬', maxScore: 10, desc: '流暢的邏輯讓 AI 讀懂段落關係。過渡詞（5分）、短段落（5分）' },
    coverage: { name: '問題覆蓋層', icon: '🎯', maxScore: 15, desc: '圍繞真實問題組織內容。痛點問句（8分）、關鍵字自然分散（7分）' },
    authority: { name: '權威信號層', icon: '👑', maxScore: 10, desc: '權威感讓 AI 更信任你。社會證明（5分）、第一手經驗（5分）' }
  },

  getLevel(score, max) {
    const pct = max > 0 ? score / max : 0;
    if (pct === 0) return { label: '未解鎖', cls: 'locked' };
    if (pct < 0.5) return { label: '學習中', cls: 'learning' };
    return { label: '熟練', cls: 'mastered' };
  },

  getOverall(breakdown) {
    if (!breakdown) return 0;
    const total = breakdown.evidence.score + breakdown.structure.score + breakdown.fluency.score + breakdown.coverage.score + breakdown.authority.score;
    return Math.min(100, Math.round(total));
  },

  render(breakdown) {
    const container = document.getElementById('skill-tree-content');
    if (!container) return;

    if (!breakdown) {
      container.innerHTML = `<div class="skill-tree-loading">開始寫作後就會呈現技能結晶⋯</div>`;
      document.getElementById('skill-tree-badge').textContent = '0%';
      return;
    }

    const overall = this.getOverall(breakdown);
    document.getElementById('skill-tree-badge').textContent = `${overall}%`;

    let html = `<div class="skill-tree-grid">`;
    for (const [key, skill] of Object.entries(this.SKILLS)) {
      const bd = breakdown[key];
      const score = bd ? bd.score : 0;
      const max = skill.maxScore;
      const level = this.getLevel(score, max);
      html += `<div class="skill-crystal ${level.cls}" data-skill="${key}" title="${skill.desc}">
        <div class="skill-crystal-icon">${skill.icon}</div>
        <div class="skill-crystal-name">${skill.name.replace('層', '')}</div>
        <div class="skill-crystal-level">${level.label}</div>
        <div class="skill-crystal-score">${score}/${max}</div>
        <div class="skill-crystal-detail">${skill.desc}</div>
      </div>`;
    }
    html += `</div>`;
    container.innerHTML = html;

    // 點擊展開說明
    container.querySelectorAll('.skill-crystal').forEach(el => {
      el.addEventListener('click', () => {
        el.classList.toggle('active');
        // 收起其他
        container.querySelectorAll('.skill-crystal.active').forEach(other => {
          if (other !== el) other.classList.remove('active');
        });
      });
    });
  }
};

// ========================================
// Quest Engine（遊戲引擎：EXP 與進度掛在真實寫作行為上）
// ========================================
const questEngine = {
  // 每回任務的里程碑（重寫/重置後歸零，避免重複給分）
  milestones: {
    checkStage: false,   // 填好關鍵字 + H1 → 查核 +10
    writeStage: false,   // 寫超過 100 字 → 撰寫（哈皮登場）
    score60: false,      // SGE 分數首達 60 → +20
    score80: false,      // SGE 分數首達 80 → +30
    proofStage: false,   // 字數達標 + 零違規 → 校對 +20
    firstCopy: false     // 首次複製成品 → +30
  },

  // GEO 寫作事件（每回任務各觸發一次夥伴反應）
  geoEvents: {
    list: false, table: false, quote: false, stat: false, source: false, stuffed: false
  },

  // 策略任務目標（女神啟示的 tips 變成可打勾的玩法）
  activeGoals: [],
  goalExpCount: 0,

  reset() {
    for (const key of Object.keys(this.milestones)) {
      this.milestones[key] = false;
    }
    for (const key of Object.keys(this.geoEvents)) {
      this.geoEvents[key] = false;
    }
    this.activeGoals = [];
    this.goalExpCount = 0;
    renderGoddessGoals();
  },

  /** 主打夥伴的招牌里程碑加成 +5（開場選擇的後果） */
  partnerBonus(milestone) {
    const signature = { guide: 'checkStage', writer: 'writeStage', player: 'proofStage' };
    if (state.partner && signature[state.partner] === milestone) {
      levelSystem.addExp(5);
      const names = { guide: state.partyNames.guide, writer: state.partyNames.writer, player: state.partyNames.player };
      showToast(`夥伴加成！${names[state.partner]} 給你 5 EXP`, 'success');
    }
  },

  /** 目前步驟對應的場景 key（暫現場景結束後回到這裡） */
  stepScene() {
    return ({ 1: 'guiding', 2: 'checking', 3: 'writing', 4: 'proofing' })[state.currentStep] || 'guiding';
  },

  /** 輸入檢查：關鍵字 + H1 都填了 → 進入查核 */
  checkInputs() {
    if (this.milestones.checkStage) return;
    const keyword = elements.keywordQuick ? elements.keywordQuick.value.trim() : '';
    const h1 = elements.h1Input ? elements.h1Input.value.trim() : '';
    if (keyword && h1) {
      this.milestones.checkStage = true;
      buildFactCheckList();
      goToStep(2);
      levelSystem.addExp(10);
      showToast('任務資訊確認！獲得 10 EXP', 'success');
      this.partnerBonus('checkStage');
    }
  },

  /** 分析結果檢查：由 analyzer.onResults 呼叫 */
  evaluate(results) {
    if (!results) return;

    // 進度條只前進不後退
    // 撰寫階段：寫超過 100 字
    if (!this.milestones.writeStage && results.textLength >= 100) {
      this.milestones.writeStage = true;
      if (state.currentStep < 3) goToStep(3);
      this.partnerBonus('writeStage');
    }

    // 分數里程碑
    if (!this.milestones.score60 && results.score >= 60) {
      this.milestones.score60 = true;
      levelSystem.addExp(20);
      showToast('SGE 分數突破 60！獲得 20 EXP', 'success');
    }
    if (!this.milestones.score80 && results.score >= 80) {
      this.milestones.score80 = true;
      levelSystem.addExp(30);
      showToast('SGE 分數突破 80！獲得 30 EXP', 'success');
      portraitDirector.flashScene('scoreMagic', this.stepScene());
    }

    // 校對階段：字數達標 + 零違規
    if (!this.milestones.proofStage &&
        results.wordCount.status === 'success' &&
        results.violation.count === 0 &&
        results.textLength > 0) {
      this.milestones.proofStage = true;
      if (state.currentStep < 4) goToStep(4);
      levelSystem.addExp(20);
      showToast('字數達標、違規歸零！獲得 20 EXP', 'success');
      portraitDirector.flashScene('proofCheer', this.stepScene());
      this.partnerBonus('proofStage');
    }

    // GEO 寫作事件 → 夥伴即時反應（把分數卡翻譯成台詞）
    this.reactToGeoEvents(results);

    // 策略任務目標打勾
    this.checkGoals(results);

    // 撰寫中的即時狀態（哈皮陪寫台詞）
    this.updateWritingStatus(results);

    // 查核階段後，輸入變動時同步更新事實檢核單
    if (state.currentStep >= 2) {
      buildFactCheckList();
    }
  },

  /** GEO 事件的夥伴反應（每回任務各一次） */
  reactToGeoEvents(results) {
    const geo = results.geo && results.geo.breakdown;
    if (!geo) return;

    const events = [
      { key: 'list', hit: geo.structure.hasList, role: 'writer', text: '哦！清單出現了，AI 最愛這個♪' },
      { key: 'table', hit: geo.structure.hasComparisonTable, role: 'writer', text: '比較表登場！結構分大進補～' },
      { key: 'quote', hit: geo.evidence.hasQuote, role: 'writer', text: '這句引用有靈魂！' },
      { key: 'stat', hit: geo.evidence.statCount >= 1, role: 'writer', text: '有數字有真相，引用力 UP！' },
      { key: 'source', hit: geo.evidence.hasSource, role: 'guide', text: '來源標註確認。AI 會記得可信的人。' },
      { key: 'stuffed', hit: geo.stuffing && geo.stuffing.stuffed, role: 'player', text: '......關鍵字塞太多了，AI 會扣分的。' }
    ];

    for (const ev of events) {
      if (!this.geoEvents[ev.key] && ev.hit) {
        this.geoEvents[ev.key] = true;
        flashMood(ev.role, ev.text);
      }
    }
  },

  /** 策略目標檢查：達成打勾 +5 EXP（每回任務最多 3 個目標） */
  checkGoals(results) {
    if (!this.activeGoals.length) return;
    let changed = false;
    for (const goal of this.activeGoals) {
      if (!goal.done && this.goalExpCount < 3 && goal.test(results)) {
        goal.done = true;
        this.goalExpCount++;
        changed = true;
        levelSystem.addExp(5);
        showToast(`女神目標達成：${goal.label}！獲得 5 EXP`, 'success');
      }
    }
    if (changed) renderGoddessGoals();
  },

  /** 更新哈皮的陪寫狀態列 */
  updateWritingStatus(results) {
    if (!elements.writingStatus) return;
    const count = results.wordCount.count;
    const min = results.wordCount.min;
    const max = results.wordCount.max;
    if (count === 0) {
      elements.writingStatus.textContent = '開始動筆吧，我在旁邊看著！';
    } else if (count < min) {
      elements.writingStatus.textContent = `目前 ${count} 字，目標 ${min}-${max} 字，繼續加油♪`;
    } else if (count <= max) {
      elements.writingStatus.textContent = `${count} 字，字數達標！旋律完成了～`;
    } else {
      elements.writingStatus.textContent = `${count} 字，超過 ${max} 字了，修剪一下吧`;
    }
  },

  /** 複製成品的獎勵 */
  onCopy() {
    if (!this.milestones.firstCopy) {
      this.milestones.firstCopy = true;
      levelSystem.addExp(30);
      showToast('任務完成！成品已交付，獲得 30 EXP', 'success');
      portraitDirector.flashScene('questDone', this.stepScene(), 5000);
    } else {
      levelSystem.addExp(5);
      showToast('再次複製成品，獲得 5 EXP', 'success');
    }
  }
};

/** 夥伴心情泡泡暫現一句話，幾秒後回到步驟預設台詞 */
const moodFlashTimers = {};
function flashMood(role, text, ms = 5000) {
  const el = document.getElementById(`${role}-mood`);
  if (!el) return;
  clearTimeout(moodFlashTimers[role]);
  clearTimeout(moodStepTimers[role]); // 取消步驟台詞的延遲覆寫，反應台詞優先
  el.textContent = text;
  el.classList.add('visible');
  moodFlashTimers[role] = setTimeout(() => {
    updatePartyMoods(state.currentStep);
  }, ms);
}

// ========================================
// 策略任務目標（F5：女神啟示變玩法）
// ========================================
const STRATEGY_GOALS = {
  price: [
    { id: 'price-number', label: '用具體數字呈現價值（元、折、%）', test: (r) => /\d+\s*(?:元|折|%|％)/.test(r.content) },
    { id: 'price-table', label: '放一張 3×3 比較表凸顯 CP 值', test: (r) => r.geo && r.geo.breakdown.structure.hasComparisonTable },
    { id: 'price-freebie', label: '列出優惠或免費附加項目', test: (r) => /免費|贈送|加贈|優惠/.test(r.content) }
  ],
  quality: [
    { id: 'quality-cred', label: '提到資歷、認證或年資', test: (r) => /\d+\s*年|認證|證照|資歷|原廠/.test(r.content) },
    { id: 'quality-quote', label: '加一句專家引語或經驗掛銜', test: (r) => r.geo && (r.geo.breakdown.evidence.hasQuote || r.geo.breakdown.authority.hasExperience) },
    { id: 'quality-process', label: '詳述服務流程（列點更好）', test: (r) => (r.geo && r.geo.breakdown.structure.hasList) || /流程|步驟/.test(r.content) }
  ],
  auto: [
    { id: 'auto-list', label: '用列點整理重點（3 項以上）', test: (r) => r.geo && r.geo.breakdown.structure.hasList },
    { id: 'auto-stat', label: '放至少一筆有單位的數據', test: (r) => r.geo && r.geo.breakdown.evidence.statCount >= 1 },
    { id: 'auto-question', label: 'H2 全部用生活化痛點問句', test: (r) => r.geo && r.geo.breakdown.coverage.h2.h2Count > 0 && r.geo.breakdown.coverage.h2.issues.length === 0 }
  ]
};

/** 渲染女神目標清單（打勾狀態） */
function renderGoddessGoals() {
  const listEl = document.getElementById('goddess-goals');
  if (!listEl) return;
  if (!questEngine.activeGoals.length) {
    listEl.innerHTML = '';
    listEl.style.display = 'none';
    return;
  }
  listEl.style.display = '';
  listEl.innerHTML = questEngine.activeGoals.map(goal => `
    <li class="goddess-goal${goal.done ? ' done' : ''}">
      <span class="goal-check">${goal.done ? '✓' : '○'}</span>
      <span class="goal-label">${goal.label}</span>
      <span class="goal-exp">+5</span>
    </li>
  `).join('');
}

// ========================================
// Goddess Revelations (策略解說)
// ========================================
const goddessRevelations = {
  price: {
    text: '你選擇了價格敏感型客群，這是明智的判斷！這類客群會仔細比價，所以文案要強調 CP 值、優惠活動、免費服務項目。記得用具體數字呈現價值感，例如「省下 XX 元」或「買一送一」。',
    tips: ['強調優惠價格', '列出免費附加服務', '使用比較表凸顯 CP 值']
  },
  quality: {
    text: '品質追求型客群是最有價值的客戶！他們願意為專業付費，所以文案要強調細節、專業認證、獨特技術。避免只談價格，改用「投資」「品質保證」等詞彙傳遞價值感。',
    tips: ['強調專業資歷與認證', '詳述服務流程細節', '使用品質相關詞彙']
  },
  auto: {
    text: '讓我來幫你分析最佳策略！根據你提供的資料，我會綜合考量服務類型、價位區間、目標市場來推薦最適合的文案風格。',
    tips: ['AI 自動分析店家定位', '根據資料推薦策略', '可隨時手動調整']
  }
};

// ========================================
// Step Navigation
// ========================================
function goToStep(stepNumber) {
  state.currentStep = stepNumber;

  // Update progress bar
  elements.progressSteps.forEach((step, index) => {
    const stepNum = index + 1;
    step.classList.remove('active', 'completed');
    if (stepNum < stepNumber) {
      step.classList.add('completed');
    } else if (stepNum === stepNumber) {
      step.classList.add('active');
    }
  });

  // Update dialog steps
  elements.dialogSteps.forEach((step, index) => {
    step.classList.remove('active');
    if (index + 1 === stepNumber) {
      step.classList.add('active');
    }
  });

  // Update active party member
  updateActivePartyMember(stepNumber);

  // 🎮 立繪隨劇情步驟切換
  portraitDirector.onStepChange(stepNumber);
}

const PARTY_MOODS = {
  guide: {
    1: ['準備好了嗎？告訴我任務目標吧', '新的冒險即將展開！'],
    2: ['讓我想想最適合的策略...', '仔細核對任務資訊，不能有錯'],
    3: ['交給哈皮了，我在旁邊看著', '哈皮加油～'],
    4: ['最終校對，讓我檢查細節', '快完成了，仔細確認每個項目']
  },
  writer: {
    1: ['～♪ 等待靈感中...', '今天要寫什麼呢～'],
    2: ['策略決定好就換我上場囉', '已經開始構思了...'],
    3: ['讓我來施展文字魔法！', '筆尖已經發光了！', '最喜歡寫作的時刻～'],
    4: ['寫完的感覺最棒了～', '校對交給伊歐，我醞釀下一首♪']
  },
  player: {
    1: ['第一次冒險好期待！', '我會認真學習的！'],
    2: ['原來有這麼多策略...', '我在認真做筆記中'],
    3: ['哈皮好厲害...', '我也在旁邊跟著練習！'],
    4: ['零違規好緊張...', '快通過了，加油！']
  }
};

function updateActivePartyMember(step) {
  elements.partyMembers.forEach(member => member.classList.remove('active'));

  // 查核前伊歐帶隊、撰寫換哈皮、校對回到伊歐
  const activeRole = step === 3 ? 'writer' : 'guide';
  document.querySelector(`[data-member="${activeRole}"]`).classList.add('active');

  updatePartyMoods(step);
}

const moodStepTimers = {};
function updatePartyMoods(step) {
  const roles = ['guide', 'writer', 'player'];
  for (const role of roles) {
    const el = document.getElementById(`${role}-mood`);
    if (!el) continue;
    const lines = PARTY_MOODS[role][step] || [];
    clearTimeout(moodStepTimers[role]);
    if (lines.length === 0) {
      el.textContent = '';
      el.classList.remove('visible');
      continue;
    }
    el.classList.remove('visible');
    moodStepTimers[role] = setTimeout(() => {
      el.textContent = lines[Math.floor(Math.random() * lines.length)];
      el.classList.add('visible');
    }, 150);
  }
}

// ========================================
// Quest Form Handler
// ========================================
function handleQuestSubmit(e) {
  e.preventDefault();

  state.questData.keyword = elements.keywordInput.value.trim();
  state.questData.wordMin = parseInt(elements.wordMinInput.value) || 650;
  state.questData.wordMax = parseInt(elements.wordMaxInput.value) || 700;
  state.questData.source = elements.sourceInput.value.trim();
  state.questData.focus = elements.focusInput.value.trim();

  if (!state.questData.keyword) {
    showToast('請輸入核心關鍵字', 'error');
    return;
  }

  // Update analyzer with keyword
  analyzer.setKeyword(state.questData.keyword);
  analyzer.setWordRange(state.questData.wordMin, state.questData.wordMax);

  goToStep(2);
}

// ========================================
// Quick Input Handlers
// ========================================
function handleH1Input() {
  const h1Value = elements.h1Input.value;
  const charCount = [...h1Value].length; // 使用展開運算子正確計算 emoji
  const charCounter = elements.h1CharCount;

  charCounter.textContent = `${charCount}/28`;

  // 顏色警示
  charCounter.classList.remove('warning', 'danger');
  if (charCount > 28) {
    charCounter.classList.add('danger');
  } else if (charCount > 24) {
    charCounter.classList.add('warning');
  }

  // 遊戲引擎：檢查是否進入查核階段
  questEngine.checkInputs();
}

function handleQuickInputChange() {
  // 從快速輸入框讀取資料
  const keyword = elements.keywordQuick.value.trim();
  const wordMin = parseInt(elements.wordMinQuick.value) || 650;
  const wordMax = parseInt(elements.wordMaxQuick.value) || 700;

  // 更新 state
  state.questData.keyword = keyword;
  state.questData.wordMin = wordMin;
  state.questData.wordMax = wordMax;

  // 更新分析器
  if (keyword) {
    analyzer.setKeyword(keyword);
  }
  analyzer.setWordRange(wordMin, wordMax);

  // 觸發即時分析（確保編輯器有內容才分析）
  if (elements.editor && elements.editor.innerText.trim()) {
    analyzer.analyze();
  }

  // 遊戲引擎：檢查是否進入查核階段
  questEngine.checkInputs();
  if (state.currentStep >= 2) buildFactCheckList();
}

// ========================================
// Strategy Selection Handler
// ========================================
function handleStrategySelect(e) {
  const button = e.currentTarget;
  const strategy = button.dataset.strategy;

  // Update UI
  elements.strategyOptions.forEach(opt => opt.classList.remove('selected'));
  button.classList.add('selected');

  state.questData.strategy = strategy;

  // Show goddess revelation
  const revelation = goddessRevelations[strategy];
  elements.goddessCard.style.display = 'block';
  elements.goddessText.textContent = revelation.text;

  // 啟動策略任務目標（達成打勾 +5 EXP）
  questEngine.activeGoals = (STRATEGY_GOALS[strategy] || []).map(g => ({ ...g, done: false }));
  renderGoddessGoals();
  if (analyzer.lastResults) questEngine.checkGoals(analyzer.lastResults);

  // 更新事實檢核單（留在查核階段，不強制推進）
  buildFactCheckList();
}

// ========================================
// Fact Check
// ========================================
function buildFactCheckList() {
  const h1 = elements.h1Input ? elements.h1Input.value.trim() : '';
  const facts = [
    { label: 'H1 標題', value: escapeHTML(h1) || '未填寫', status: h1 ? 'success' : 'warning' },
    { label: '核心關鍵字', value: escapeHTML(state.questData.keyword) || '未填寫', status: state.questData.keyword ? 'success' : 'warning' },
    { label: '目標字數', value: `${state.questData.wordMin}-${state.questData.wordMax} 字`, status: 'success' },
    { label: '策略方向', value: getStrategyLabel(state.questData.strategy), status: state.questData.strategy ? 'success' : 'warning' }
  ];

  elements.factList.innerHTML = facts.map(fact => `
    <li>
      <span class="fact-label">${fact.label}</span>
      <span class="fact-value">${fact.value}</span>
      <span class="fact-status ${fact.status}">
        ${fact.status === 'success' ? '✓' : '⚠'}
      </span>
    </li>
  `).join('');
}

function getStrategyLabel(strategy) {
  const labels = {
    price: '價格敏感型',
    quality: '品質追求型',
    auto: 'AI 自動推薦'
  };
  return labels[strategy] || '未選擇';
}

// ========================================
// Writing Phase（手動推進：查核卡片上的「開始撰寫 GO」）
// ========================================
function startWriting() {
  if (state.currentStep < 3) goToStep(3);
  if (elements.editor) elements.editor.focus();
}

// ========================================
// Quick Commands
// ========================================
function handleCommand(cmd) {
  switch (cmd) {
    case 'rewrite':
      if (confirm('確定要重新開始嗎？')) {
        resetApp();
      }
      break;
    case 'copy':
      copyToClipboard();
      break;
  }
}

async function copyToClipboard() {
  if (!elements.editor || !elements.editor.innerText.trim()) {
    showToast('編輯器還是空的，先寫點內容吧', 'error');
    return;
  }
  const success = await editor.copyFormatted();
  if (success) {
    showToast('已複製到剪貼簿', 'success');
    questEngine.onCopy();
  } else {
    showToast('複製失敗，請手動選取複製', 'error');
  }
}

// ========================================
// Name Customization Modal
// ========================================
function openNameModal() {
  elements.customGuide.value = state.partyNames.guide;
  elements.customWriter.value = state.partyNames.writer;
  elements.customPlayer.value = state.partyNames.player;
  elements.nameModal.classList.add('active');
}

function closeNameModal() {
  elements.nameModal.classList.remove('active');
}

function saveNames(e) {
  e.preventDefault();

  // 限制名稱長度（防止過長輸入），最多 20 字
  state.partyNames.guide = (elements.customGuide.value.trim() || '伊歐').slice(0, 20);
  state.partyNames.writer = (elements.customWriter.value.trim() || '哈皮').slice(0, 20);
  state.partyNames.player = (elements.customPlayer.value.trim() || 'BLUE').slice(0, 20);

  updatePartyNamesUI();
  storage.saveNames(state.partyNames);
  closeNameModal();
  showToast('夥伴名稱已更新', 'success');
}

function updatePartyNamesUI() {
  elements.guideName.textContent = state.partyNames.guide;
  elements.writerName.textContent = state.partyNames.writer;
  elements.playerName.textContent = state.partyNames.player;

  // Update all player name displays in dialogs
  elements.playerNameDisplays.forEach(el => {
    el.textContent = state.partyNames.player;
  });

  // Update bubble names
  document.querySelectorAll('.guide-bubble .bubble-name').forEach(el => {
    el.textContent = state.partyNames.guide;
  });
  document.querySelectorAll('.writer-bubble .bubble-name').forEach(el => {
    el.textContent = state.partyNames.writer;
  });
}

// ========================================
// Image Management Modal
// ========================================
const activeObjectURLs = [];

function revokeAllObjectURLs() {
  while (activeObjectURLs.length > 0) {
    imageStorage.revokeImageURL(activeObjectURLs.pop());
  }
}

const IMAGE_ROLES = [
  { id: 'guide', name: '伊歐', subtitle: '領航員', labelClass: 'guide-label' },
  { id: 'writer', name: '哈皮', subtitle: '吟遊詩人', labelClass: 'writer-label' },
  { id: 'player', name: 'BLUE', subtitle: '見習生', labelClass: 'player-label' }
];

const IMAGE_EMOTIONS = [
  { id: 'default', name: '預設' },
  { id: 'joy', name: '樂' },
  { id: 'happy', name: '喜' },
  { id: 'angry', name: '怒' },
  { id: 'sad', name: '哀' }
];

const VARIANTS_PER_EMOTION = 4;

// 預設立繪路徑（內建圖片，使用者未自訂時顯示）
// 預設表情立繪（顯示在頭像 + Modal 表情格）
const DEFAULT_IMAGES = {
  // 伊歐（領航員）
  'guide-default-1': 'icons/characters/guide-default-1.png',
  'guide-default-2': 'icons/characters/guide-default-2.png',
  'guide-default-3': 'icons/characters/guide-default-3.png',
  'guide-default-4': 'icons/characters/guide-default-4.png',
  'guide-joy-1': 'icons/characters/guide-joy-1.png',
  'guide-joy-2': 'icons/characters/guide-joy-2.png',
  'guide-joy-3': 'icons/characters/guide-joy-3.png',
  'guide-joy-4': 'icons/characters/guide-joy-4.png',
  'guide-happy-1': 'icons/characters/guide-happy-1.png',
  'guide-happy-2': 'icons/characters/guide-happy-2.png',
  'guide-happy-3': 'icons/characters/guide-happy-3.png',
  'guide-happy-4': 'icons/characters/guide-happy-4.png',
  'guide-angry-1': 'icons/characters/guide-angry-1.png',
  'guide-angry-2': 'icons/characters/guide-angry-2.png',
  'guide-angry-3': 'icons/characters/guide-angry-3.png',
  'guide-angry-4': 'icons/characters/guide-angry-4.png',
  'guide-sad-1': 'icons/characters/guide-sad-1.png',
  'guide-sad-2': 'icons/characters/guide-sad-2.png',
  'guide-sad-3': 'icons/characters/guide-sad-3.png',
  'guide-sad-4': 'icons/characters/guide-sad-4.png',
  // 哈皮（吟遊詩人）
  'writer-default-1': 'icons/characters/writer-default-1.png',
  'writer-default-2': 'icons/characters/writer-default-2.png',
  'writer-default-3': 'icons/characters/writer-default-3.png',
  'writer-default-4': 'icons/characters/writer-default-4.png',
  'writer-joy-1': 'icons/characters/writer-joy-1.png',
  'writer-joy-2': 'icons/characters/writer-joy-2.png',
  'writer-angry-1': 'icons/characters/writer-angry-1.png',
  'writer-angry-2': 'icons/characters/writer-angry-2.png',
  'writer-angry-3': 'icons/characters/writer-angry-3.png',
  'writer-angry-4': 'icons/characters/writer-angry-4.png',
  'writer-sad-1': 'icons/characters/writer-sad-1.png',
  // BLUE（見習生）
  'player-default-1': 'icons/characters/player-default-1.png',
  'player-default-2': 'icons/characters/player-default-2.png',
  'player-default-3': 'icons/characters/player-default-3.png',
  'player-default-4': 'icons/characters/player-default-4.png',
  'player-joy-1': 'icons/characters/player-joy-1.png',
  'player-joy-2': 'icons/characters/player-joy-2.png',
  'player-joy-3': 'icons/characters/player-joy-3.png',
  'player-joy-4': 'icons/characters/player-joy-4.png',
  'player-happy-1': 'icons/characters/player-happy-1.png',
  'player-happy-2': 'icons/characters/player-happy-2.png',
  'player-happy-3': 'icons/characters/player-happy-3.png',
  'player-happy-4': 'icons/characters/player-happy-4.png',
  'player-angry-1': 'icons/characters/player-angry-1.png',
  'player-angry-2': 'icons/characters/player-angry-2.png',
  'player-angry-3': 'icons/characters/player-angry-3.png',
  'player-angry-4': 'icons/characters/player-angry-4.png',
  'player-sad-1': 'icons/characters/player-sad-1.png',
  'player-sad-2': 'icons/characters/player-sad-2.png',
  'player-sad-3': 'icons/characters/player-sad-3.png',
  'player-sad-4': 'icons/characters/player-sad-4.png'
};

// 預設情境圖（顯示在「其他」區，含備註）
const DEFAULT_SCENE_IMAGES = [
  // 伊歐場景
  { key: 'scene-guide-magic-1', src: 'icons/characters/scene-guide-magic-1.png', description: '伊歐 施展法術' },
  { key: 'scene-guide-magic-2', src: 'icons/characters/scene-guide-magic-2.png', description: '伊歐 施展法術' },
  { key: 'scene-guide-magic-3', src: 'icons/characters/scene-guide-magic-3.png', description: '伊歐 施展法術' },
  { key: 'scene-guide-navigate-1', src: 'icons/characters/scene-guide-navigate-1.png', description: '伊歐 伸手引導方向' },
  { key: 'scene-guide-problem-1', src: 'icons/characters/scene-guide-problem-1.png', description: '伊歐 發現問題' },
  { key: 'scene-guide-problem-2', src: 'icons/characters/scene-guide-problem-2.png', description: '伊歐 發現問題' },
  { key: 'scene-guide-teleport-1', src: 'icons/characters/scene-guide-teleport-1.png', description: '傳送陣遇到伊歐' },
  { key: 'scene-guide-teleport-2', src: 'icons/characters/scene-guide-teleport-2.png', description: '傳送陣遇到伊歐' },
  { key: 'scene-guide-welcome-white', src: 'icons/characters/scene-guide-welcome-white.png', description: '伊歐 歡迎（白上衣）' },
  { key: 'scene-guide-welcomeback-1', src: 'icons/characters/scene-guide-welcomeback-1.png', description: '伊歐 歡迎回來' },
  { key: 'scene-guide-welcomeback-2', src: 'icons/characters/scene-guide-welcomeback-2.png', description: '伊歐 歡迎回來' },
  { key: 'scene-guide-welcomeback-3', src: 'icons/characters/scene-guide-welcomeback-3.png', description: '伊歐 歡迎回來' },
  { key: 'scene-guide-welcomeback-4', src: 'icons/characters/scene-guide-welcomeback-4.png', description: '伊歐 歡迎回來' },
  { key: 'scene-guide-study-1', src: 'icons/characters/scene-guide-study-1.png', description: '伊歐 在書房' },
  { key: 'scene-guide-study-2', src: 'icons/characters/scene-guide-study-2.png', description: '伊歐 在書房' },
  { key: 'scene-guide-study-3', src: 'icons/characters/scene-guide-study-3.png', description: '伊歐 在書房' },
  // 哈皮場景
  { key: 'scene-writer-thinking', src: 'icons/characters/writer-scene-thinking.png', description: '哈皮 低頭沉思' },
  { key: 'scene-welcome-1', src: 'icons/characters/scene-welcome-1.png', description: '哈皮 歡迎加入世界' },
  { key: 'scene-welcome-2', src: 'icons/characters/scene-welcome-2.png', description: '哈皮 歡迎加入世界' },
  { key: 'scene-welcome-3', src: 'icons/characters/scene-welcome-3.png', description: '哈皮 歡迎加入世界' },
  // BLUE 場景
  { key: 'scene-player-writing', src: 'icons/characters/player-other-writing.png', description: 'BLUE 寫筆記中' },
  { key: 'scene-player-explore-1', src: 'icons/characters/scene-player-explore-1.png', description: 'BLUE 探索新文字世界' },
  { key: 'scene-player-explore-2', src: 'icons/characters/scene-player-explore-2.png', description: 'BLUE 探索新文字世界' },
  { key: 'scene-player-explore-3', src: 'icons/characters/scene-player-explore-3.png', description: 'BLUE 探索新文字世界' },
  { key: 'scene-player-explore-4', src: 'icons/characters/scene-player-explore-4.png', description: 'BLUE 探索新文字世界' },
  { key: 'scene-player-explore-5', src: 'icons/characters/scene-player-explore-5.png', description: 'BLUE 探索新文字世界' },
  { key: 'scene-player-explore-6', src: 'icons/characters/scene-player-explore-6.png', description: 'BLUE 探索新文字世界' },
  { key: 'scene-player-explore-7', src: 'icons/characters/scene-player-explore-7.png', description: 'BLUE 探索新文字世界' },
  { key: 'scene-player-explore-8', src: 'icons/characters/scene-player-explore-8.png', description: 'BLUE 探索新文字世界' },
  { key: 'scene-player-encourage-1', src: 'icons/characters/scene-player-encourage-1.png', description: 'BLUE 伸手鼓勵' },
  { key: 'scene-player-encourage-2', src: 'icons/characters/scene-player-encourage-2.png', description: 'BLUE 伸手鼓勵' },
  { key: 'scene-player-encourage-3', src: 'icons/characters/scene-player-encourage-3.png', description: 'BLUE 伸手鼓勵' },
  { key: 'scene-player-encourage-4', src: 'icons/characters/scene-player-encourage-4.png', description: 'BLUE 伸手鼓勵' },
  { key: 'scene-player-notes-1', src: 'icons/characters/scene-player-notes-1.png', description: 'BLUE 作筆記' },
  { key: 'scene-player-notes-2', src: 'icons/characters/scene-player-notes-2.png', description: 'BLUE 作筆記' },
  { key: 'scene-player-notes-3', src: 'icons/characters/scene-player-notes-3.png', description: 'BLUE 作筆記' },
  { key: 'scene-player-notes-4', src: 'icons/characters/scene-player-notes-4.png', description: 'BLUE 作筆記' },
  { key: 'scene-player-notes-5', src: 'icons/characters/scene-player-notes-5.png', description: 'BLUE 作筆記' },
  { key: 'scene-player-notes-6', src: 'icons/characters/scene-player-notes-6.png', description: 'BLUE 作筆記' }
];

function getImageSrc(key, blob) {
  if (blob) {
    const url = imageStorage.createImageURL(blob);
    activeObjectURLs.push(url);
    return url;
  }
  if (DEFAULT_IMAGES[key]) {
    return DEFAULT_IMAGES[key];
  }
  return null;
}

function buildImageModalDOM() {
  const body = document.getElementById('image-modal-body');
  body.innerHTML = '';

  // Core section: 3 roles × 5 emotions × 4 variants
  for (const role of IMAGE_ROLES) {
    const group = document.createElement('div');
    group.className = 'image-role-group';
    group.innerHTML = `<span class="image-role-label ${role.labelClass}">${role.name}（${role.subtitle}）</span>`;

    for (const emotion of IMAGE_EMOTIONS) {
      const emotionRow = document.createElement('div');
      emotionRow.className = 'image-emotion-row';
      emotionRow.innerHTML = `<span class="image-emotion-label">${emotion.name}</span>`;

      const grid = document.createElement('div');
      grid.className = 'image-grid';

      for (let v = 1; v <= VARIANTS_PER_EMOTION; v++) {
        const key = `${role.id}-${emotion.id}-${v}`;
        const slot = createImageSlot(key, `${role.name} ${emotion.name} #${v}`);
        grid.appendChild(slot);
      }

      emotionRow.appendChild(grid);
      group.appendChild(emotionRow);
    }

    body.appendChild(group);
  }

  // Other section: free upload with notes
  const otherSection = document.createElement('div');
  otherSection.className = 'image-other-section';
  otherSection.innerHTML = `
    <h4 class="image-section-title">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21 15 16 10 5 21"/>
      </svg>
      其他圖片
    </h4>
    <p class="image-section-desc">自由上傳其他場景圖片，並備註用途</p>
    <div class="extra-images-list" id="extra-images-list"></div>
    <button type="button" class="btn-secondary add-extra-image" id="add-extra-image">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
      新增圖片
    </button>
  `;
  body.appendChild(otherSection);
}

function createImageSlot(key, alt) {
  const slot = document.createElement('div');
  slot.className = 'image-slot';
  slot.dataset.key = key;
  slot.innerHTML = `
    <input type="file" accept="image/png,image/jpeg,image/webp" class="image-input" tabindex="-1">
    <div class="image-placeholder">
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <line x1="12" y1="8" x2="12" y2="16"/>
        <line x1="8" y1="12" x2="16" y2="12"/>
      </svg>
    </div>
    <img class="image-preview" alt="${alt}">
    <button class="image-delete" title="刪除">
      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
      </svg>
    </button>
  `;

  const input = slot.querySelector('.image-input');
  const deleteBtn = slot.querySelector('.image-delete');

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = slot.querySelector('.image-preview');
    const url = imageStorage.createImageURL(file);
    activeObjectURLs.push(url);
    preview.src = url;
    slot.classList.add('filled');
    imageStorage.saveImage(key, file).then(() => {
      updateAvatars();
      showToast('立繪已儲存', 'success');
    });
  });

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const preview = slot.querySelector('.image-preview');
    preview.src = '';
    slot.classList.remove('filled');
    input.value = '';
    imageStorage.deleteImage(key).then(() => {
      updateAvatars();
      showToast('立繪已刪除', 'info');
    });
  });

  return slot;
}

function openImageModal() {
  loadImageModalState();
  elements.imageModal.classList.add('active');
}

function closeImageModal() {
  elements.imageModal.classList.remove('active');
}

async function loadImageModalState() {
  revokeAllObjectURLs();
  const images = await imageStorage.loadAllImages();

  // Load core slots
  const allSlots = elements.imageModal.querySelectorAll('.image-slot[data-key]');
  allSlots.forEach(slot => {
    const key = slot.dataset.key;
    if (key.startsWith('extra-')) return;
    const record = images.find(img => img.key === key);
    const preview = slot.querySelector('.image-preview');

    const src = getImageSrc(key, record ? record.blob : null);
    if (src) {
      preview.src = src;
      slot.classList.add('filled');
      // Mark default vs custom
      slot.dataset.isDefault = record ? '' : 'true';
    } else {
      preview.src = '';
      slot.classList.remove('filled');
      delete slot.dataset.isDefault;
    }
  });

  // Load extra/other images
  const extraList = document.getElementById('extra-images-list');
  extraList.innerHTML = '';

  // Built-in scene images (show defaults that user hasn't overridden)
  for (const scene of DEFAULT_SCENE_IMAGES) {
    const userOverride = images.find(img => img.key === scene.key);
    addExtraImageRow(scene.key, userOverride ? userOverride.blob : null, scene.description, scene.src);
  }

  // User-added extra images
  const extras = images.filter(img =>
    img.key.startsWith('extra-') && !DEFAULT_SCENE_IMAGES.some(s => s.key === img.key)
  );
  extras.sort((a, b) => a.updatedAt - b.updatedAt);
  for (const extra of extras) {
    addExtraImageRow(extra.key, extra.blob, extra.description);
  }
}

function addExtraImageRow(key, blob, description, defaultSrc) {
  if (!key) key = `extra-${Date.now()}`;

  let previewSrc = '';
  if (blob) {
    previewSrc = imageStorage.createImageURL(blob);
    activeObjectURLs.push(previewSrc);
  } else if (defaultSrc) {
    previewSrc = defaultSrc;
  }

  const row = document.createElement('div');
  row.className = 'extra-image-row';
  row.dataset.key = key;

  row.innerHTML = `
    <div class="image-slot${previewSrc ? ' filled' : ''}" data-key="${escapeHTML(key)}">
      <input type="file" accept="image/png,image/jpeg,image/webp" class="image-input" tabindex="-1">
      <div class="image-placeholder">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      </div>
      <img class="image-preview" alt="其他圖片" ${previewSrc ? `src="${previewSrc}"` : ''}>
      <button class="image-delete" title="刪除圖片">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="extra-desc">
      <input type="text" placeholder="備註用途（如「升級慶祝」、「寫筆記中」）" value="${escapeHTML(description)}" maxlength="80">
    </div>
    <button class="extra-remove" title="移除此列">
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
      </svg>
    </button>
  `;

  const slot = row.querySelector('.image-slot');
  const input = row.querySelector('.image-input');
  const deleteBtn = row.querySelector('.image-delete');
  const descInput = row.querySelector('.extra-desc input');
  const removeBtn = row.querySelector('.extra-remove');

  input.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const preview = slot.querySelector('.image-preview');
    const url = imageStorage.createImageURL(file);
    activeObjectURLs.push(url);
    preview.src = url;
    slot.classList.add('filled');
    imageStorage.saveImage(key, file, descInput.value);
  });

  deleteBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    slot.querySelector('.image-preview').src = '';
    slot.classList.remove('filled');
    input.value = '';
    imageStorage.deleteImage(key);
  });

  descInput.addEventListener('change', () => {
    imageStorage.loadImage(key).then(record => {
      if (record) imageStorage.saveImage(key, record.blob, descInput.value);
    });
  });

  removeBtn.addEventListener('click', () => {
    imageStorage.deleteImage(key);
    row.remove();
  });

  document.getElementById('extra-images-list').appendChild(row);
}

async function updateAvatars() {
  // 釋放舊的 Object URLs 避免記憶體洩漏
  revokeAllObjectURLs();

  const images = await imageStorage.loadAllImages();
  const roles = ['guide', 'writer', 'player'];

  for (const role of roles) {
    // 1. Try user-uploaded images from IndexedDB (random from default emotion variants)
    const emotionOrder = ['default', 'joy', 'happy', 'angry', 'sad'];
    let avatarSrc = null;

    for (const emotion of emotionOrder) {
      const candidates = images.filter(img =>
        img.key.startsWith(`${role}-${emotion}-`)
      );
      if (candidates.length > 0) {
        const pick = candidates[Math.floor(Math.random() * candidates.length)];
        avatarSrc = imageStorage.createImageURL(pick.blob);
        activeObjectURLs.push(avatarSrc);
        break;
      }
    }

    // 2. Fallback to built-in default images
    if (!avatarSrc) {
      const defaultKeys = Object.keys(DEFAULT_IMAGES).filter(k =>
        k.startsWith(`${role}-default-`)
      );
      if (defaultKeys.length > 0) {
        const pick = defaultKeys[Math.floor(Math.random() * defaultKeys.length)];
        avatarSrc = DEFAULT_IMAGES[pick];
      }
    }

    // Apply to member-avatar and bubble-avatar
    const targets = [
      document.querySelector(`.${role}-avatar`),
      ...document.querySelectorAll(`.${role}-bubble .bubble-avatar`)
    ].filter(Boolean);

    for (const el of targets) {
      const existingImg = el.querySelector('img.avatar-img');
      const existingSvg = el.querySelector('svg');
      const isBubble = el.classList.contains('bubble-avatar');

      if (avatarSrc) {
        el.style.background = 'none';
        el.style.overflow = 'hidden';
        el.style.borderRadius = '12px';
        if (existingImg) {
          existingImg.src = avatarSrc;
        } else {
          const img = document.createElement('img');
          img.className = 'avatar-img';
          img.src = avatarSrc;
          img.alt = role;
          img.style.cssText = 'width:100%;height:100%;object-fit:cover;object-position:top;';
          if (existingSvg) existingSvg.style.display = 'none';
          el.appendChild(img);
        }
      } else {
        el.style.borderRadius = '';
        el.style.overflow = '';
        el.style.background = '';
        if (existingImg) existingImg.remove();
        if (existingSvg) existingSvg.style.display = '';
      }
    }
  }
}

function initImageModal() {
  buildImageModalDOM();

  // Modal open/close
  elements.manageImagesBtn.addEventListener('click', openImageModal);
  elements.closeImageModalBtn.addEventListener('click', closeImageModal);
  elements.imageModal.querySelector('.modal-backdrop').addEventListener('click', closeImageModal);

  // Add extra image button (delegated since it's dynamic)
  document.getElementById('add-extra-image').addEventListener('click', () => {
    addExtraImageRow();
  });
}

// ========================================
// Mobile Tabs
// ========================================
function handleTabSwitch(e) {
  const tab = e.currentTarget.dataset.tab;

  elements.tabButtons.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tab);
  });

  elements.tabContents.forEach(content => {
    content.classList.toggle('active', content.dataset.tab === tab);
  });
}

// ========================================
// Toast Notifications
// ========================================
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-message">${message}</span>`;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

// ========================================
// Reset App
// ========================================
function resetApp() {
  state.currentStep = 1;
  state.questData = {
    keyword: '',
    wordMin: 650,
    wordMax: 700,
    source: '',
    focus: '',
    strategy: null
  };

  // Reset form
  elements.questForm.reset();
  elements.wordMinInput.value = 650;
  elements.wordMaxInput.value = 700;

  // Reset strategy selection
  elements.strategyOptions.forEach(opt => opt.classList.remove('selected'));
  elements.goddessCard.style.display = 'none';

  // Reset editor
  editor.clear();

  // Reset analyzer
  analyzer.reset();

  // Reset 遊戲引擎里程碑（EXP 等級保留，重新開始賺）
  questEngine.reset();
  if (elements.writingStatus) {
    elements.writingStatus.textContent = '開始動筆吧，我在旁邊看著！';
  }

  // Go to step 1
  goToStep(1);

  showToast('已重置，開始新的冒險！', 'success');
}

// ========================================
// Footer Year
// ========================================
function updateFooterYear() {
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  elements.footerYear.textContent = currentYear > startYear
    ? `${startYear}–${currentYear}`
    : `${startYear}`;
}

// ========================================
// Theme Toggle
// ========================================
function toggleTheme() {
  document.documentElement.classList.toggle('dark-mode');
  const isDark = document.documentElement.classList.contains('dark-mode');
  storage.saveTheme(isDark ? 'dark' : 'light');
}

// ========================================
// View Mode Management
// ========================================
function handleViewModeChange(mode) {
  if (mode === state.viewMode) return;

  state.viewMode = mode;
  localStorage.setItem('sge-view-mode', mode);
  updateViewModeUI();

  // Re-run analysis to update display
  analyzer.analyze(elements.editor.innerHTML);

  showToast(mode === 'quick' ? '⚡ 已切換為快速模式' : '📊 已切換為詳細模式');
}

function updateViewModeUI() {
  elements.viewToggleBtns.forEach(btn => {
    if (btn.dataset.view === state.viewMode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });

  // Toggle analysis panel visibility
  const analysisPanel = document.querySelector('.panel-right');
  if (analysisPanel) {
    analysisPanel.dataset.viewMode = state.viewMode;
  }
}

// ========================================
// Initialize
// ========================================
function init() {
  // Load saved data
  const savedNames = storage.loadNames();
  if (savedNames) {
    state.partyNames = savedNames;
    updatePartyNamesUI();
  }

  const savedProgress = storage.loadProgress();
  if (savedProgress) {
    state.userProgress = savedProgress;
  }
  levelSystem.updateUI();

  const savedTheme = storage.loadTheme();
  if (savedTheme === 'dark') {
    document.documentElement.classList.add('dark-mode');
  }

  // Load saved view mode
  const savedViewMode = localStorage.getItem('sge-view-mode');
  if (savedViewMode && (savedViewMode === 'quick' || savedViewMode === 'detailed')) {
    state.viewMode = savedViewMode;
    updateViewModeUI();
  }

  // 初始化技能樹（空的，等待分析結果）
  skillTree.render(null);

  // Initialize FAQ UI
  faqUI.init();

  // 🎮 GBA 立繪導演系統
  portraitDirector.init();

  // 🎮 開場劇情（首次訪問）／回訪迎接（選擇要有後果）
  const applyPartnerScene = () => {
    const partnerScenes = { guide: 'partnerGuide', writer: 'partnerWriter', player: 'partnerPlayer' };
    if (state.partner && partnerScenes[state.partner]) {
      portraitDirector.setScene(partnerScenes[state.partner]);
    } else {
      portraitDirector.setScene('welcomeBack');
    }
  };

  if (opening.shouldShow()) {
    opening.show((characterKey) => {
      state.partner = characterKey;
      applyPartnerScene();
      const names = { guide: state.partyNames.guide, writer: state.partyNames.writer, player: state.partyNames.player };
      showToast(`${names[characterKey] || '夥伴'} 成為你的主打夥伴！招牌時刻會多給 5 EXP`, 'success');
    });
  } else {
    applyPartnerScene();
  }

  // Update footer year
  updateFooterYear();

  // Event Listeners
  elements.questForm.addEventListener('submit', handleQuestSubmit);

  // Quick Input 事件監聽器
  if (elements.h1Input) {
    elements.h1Input.addEventListener('input', handleH1Input);
  }
  if (elements.keywordQuick) {
    elements.keywordQuick.addEventListener('input', handleQuickInputChange);
  }
  if (elements.wordMinQuick) {
    elements.wordMinQuick.addEventListener('input', handleQuickInputChange);
  }
  if (elements.wordMaxQuick) {
    elements.wordMaxQuick.addEventListener('input', handleQuickInputChange);
  }

  elements.strategyOptions.forEach(option => {
    option.addEventListener('click', handleStrategySelect);
  });

  if (elements.backToStep2) {
    elements.backToStep2.addEventListener('click', () => goToStep(2));
  }
  elements.confirmFacts.addEventListener('click', startWriting);

  // 遊戲引擎：分析結果驅動進度與 EXP
  analyzer.onResults = (results) => {
    questEngine.evaluate(results);
    // 同步更新技能樹
    if (results && results.geo && results.geo.breakdown) {
      skillTree.render(results.geo.breakdown);
    }
  };

  elements.commandButtons.forEach(btn => {
    btn.addEventListener('click', () => handleCommand(btn.dataset.cmd));
  });

  elements.customizeNamesBtn.addEventListener('click', openNameModal);
  elements.closeModalBtn.addEventListener('click', closeNameModal);
  elements.cancelNamesBtn.addEventListener('click', closeNameModal);
  elements.nameForm.addEventListener('submit', saveNames);
  elements.nameModal.querySelector('.modal-backdrop').addEventListener('click', closeNameModal);

  elements.tabButtons.forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
  });

  elements.resetBtn.addEventListener('click', () => {
    if (confirm('確定要重置所有內容嗎？')) {
      resetApp();
    }
  });

  elements.themeToggle.addEventListener('click', toggleTheme);

  // GEO 權重表 modal
  const weightBtn = document.getElementById('btn-weight-table');
  const weightModal = document.getElementById('weight-modal');
  const closeWeight = document.getElementById('close-weight-modal');
  if (weightBtn && weightModal) {
    weightBtn.addEventListener('click', () => weightModal.classList.add('open'));
    closeWeight.addEventListener('click', () => weightModal.classList.remove('open'));
    weightModal.querySelector('.modal-backdrop').addEventListener('click', () => weightModal.classList.remove('open'));
  }

  // Initialize analyzer with elements
  elements.viewToggleBtns.forEach(btn => {
    btn.addEventListener('click', () => handleViewModeChange(btn.dataset.view));
  });

  // Initialize editor
  editor.init(elements.editor, elements.toolbarButtons);

  // Initialize analyzer
  analyzer.init({
    sgeScore: elements.sgeScore,
    scoreFill: elements.scoreFill,
    h1Count: elements.h1Count,
    wordCount: elements.wordCount,
    keywordCount: elements.keywordCount,
    violationCount: elements.violationCount,
    toneStatus: elements.toneStatus,
    violationCard: elements.violationCard,
    violationList: elements.violationList,
    checkItems: elements.checkItems,
    // AI 味指數（漏傳會讓編輯器打字直接爆炸）
    aiTasteScore: elements.aiTasteScore,
    aiTasteFill: elements.aiTasteFill,
    aiTasteEmoji: elements.aiTasteEmoji,
    aiTasteMessage: elements.aiTasteMessage,
    aiNegativeList: elements.aiNegativeList,
    aiPositiveList: elements.aiPositiveList,
    // GEO 引用力（五大維度）
    sgeStructureScore: elements.sgeStructureScore,
    sgeStructureFill: elements.sgeStructureFill,
    sgeEvidenceValue: elements.sgeEvidenceValue,
    sgeEvidenceIcon: elements.sgeEvidenceIcon,
    sgeStructureValue: elements.sgeStructureValue,
    sgeStructureIcon: elements.sgeStructureIcon,
    sgeCoverageValue: elements.sgeCoverageValue,
    sgeCoverageIcon: elements.sgeCoverageIcon,
    sgeFluencyValue: elements.sgeFluencyValue,
    sgeFluencyIcon: elements.sgeFluencyIcon,
    sgeAuthorityValue: elements.sgeAuthorityValue,
    sgeAuthorityIcon: elements.sgeAuthorityIcon
  });

  // Initialize templates
  templates.init(elements.templateButtons, editor);

  // Initialize image modal and load saved avatars
  initImageModal();
  updateAvatars().catch(err => {
    console.warn('立繪載入失敗:', err);
    showToast('立繪載入失敗，使用預設圖示', 'error');
  });

  // Initialize party moods
  updatePartyMoods(1);

  // Editor change listener
  elements.editor.addEventListener('input', () => {
    analyzer.analyze();
  });

  console.log('GEO 文案冒險學院已載入！歡迎來到冒險學院～');
}

// Start app
document.addEventListener('DOMContentLoaded', init);

// Export for debugging
window.sgeApp = { state, goToStep, showToast, levelSystem };
