/**
 * SGE 文案助手 - 主程式
 * @module app
 */

import { storage } from './storage.js';
import { editor } from './editor.js';
import { analyzer } from './seo-analyzer.js';
import { templates } from './templates.js';
import { imageStorage } from './image-storage.js';

// ========================================
// State Management
// ========================================
const state = {
  currentStep: 1,
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

  // Forms
  questForm: document.getElementById('quest-form'),
  keywordInput: document.getElementById('keyword'),
  wordMinInput: document.getElementById('word-min'),
  wordMaxInput: document.getElementById('word-max'),
  sourceInput: document.getElementById('source'),
  focusInput: document.getElementById('focus'),

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
}

const PARTY_MOODS = {
  guide: {
    1: ['準備好了嗎？告訴我任務目標吧', '新的冒險即將展開！'],
    2: ['讓我想想最適合的策略...', '每個選擇都會影響結果喔'],
    3: ['確認事實是最重要的一步', '仔細核對，不能有錯'],
    4: ['交給哈皮了，我在旁邊看著', '哈皮加油～'],
    5: ['寫得不錯呢！', '任務完成，辛苦了']
  },
  writer: {
    1: ['～♪ 等待靈感中...', '今天要寫什麼呢～'],
    2: ['策略決定好就換我上場囉', '已經開始構思了...'],
    3: ['正在醞釀最美的詩句...', '靈感快來了...'],
    4: ['讓我來施展文字魔法！', '筆尖已經發光了！', '最喜歡寫作的時刻～'],
    5: ['這篇文案好有感覺！', '又完成一首詩篇了']
  },
  player: {
    1: ['第一次冒險好期待！', '我會認真學習的！'],
    2: ['原來有這麼多策略...', '我在認真做筆記中'],
    3: ['確認事實好重要啊', '學到了！'],
    4: ['哈皮好厲害...', '我也想學寫作！'],
    5: ['太棒了，我學到好多！', '下次我也要試試看']
  }
};

function updateActivePartyMember(step) {
  elements.partyMembers.forEach(member => member.classList.remove('active'));

  if (step <= 3) {
    document.querySelector('[data-member="guide"]').classList.add('active');
  } else {
    document.querySelector('[data-member="writer"]').classList.add('active');
  }

  updatePartyMoods(step);
}

function updatePartyMoods(step) {
  const roles = ['guide', 'writer', 'player'];
  for (const role of roles) {
    const el = document.getElementById(`${role}-mood`);
    if (!el) continue;
    const lines = PARTY_MOODS[role][step] || [];
    if (lines.length === 0) {
      el.textContent = '';
      el.classList.remove('visible');
      continue;
    }
    el.classList.remove('visible');
    setTimeout(() => {
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

  // Build fact check list
  buildFactCheckList();

  // Go to step 3 after a short delay
  setTimeout(() => {
    goToStep(3);
  }, 500);
}

// ========================================
// Fact Check
// ========================================
function buildFactCheckList() {
  const facts = [
    { label: '核心關鍵字', value: state.questData.keyword, status: 'success' },
    { label: '目標字數', value: `${state.questData.wordMin}-${state.questData.wordMax} 字`, status: 'success' },
    { label: '策略方向', value: getStrategyLabel(state.questData.strategy), status: 'success' },
    { label: '店家資料', value: state.questData.source ? '已提供' : '未提供', status: state.questData.source ? 'success' : 'warning' },
    { label: '文案重點', value: state.questData.focus || '未指定', status: state.questData.focus ? 'success' : 'warning' }
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
// Writing Phase
// ========================================
function startWriting() {
  goToStep(4);

  // Simulate writing process
  const statuses = [
    '正在分析關鍵字結構...',
    '正在構思標題...',
    '正在撰寫開場白...',
    '正在組織內容架構...',
    '文案撰寫完成！'
  ];

  let statusIndex = 0;
  const statusInterval = setInterval(() => {
    if (statusIndex < statuses.length) {
      elements.writingStatus.textContent = statuses[statusIndex];
      statusIndex++;
    } else {
      clearInterval(statusInterval);
      generateSampleContent();
    }
  }, 800);
}

function generateSampleContent() {
  const keyword = state.questData.keyword;
  const strategy = state.questData.strategy;

  // Generate sample H1 (target 28 characters)
  let h1 = `${keyword}推薦｜專業服務讓你安心`;
  if (h1.length > 28) {
    h1 = h1.substring(0, 28);
  } else if (h1.length < 28) {
    h1 = h1.padEnd(28, '！');
  }

  // Generate sample content based on strategy
  let content = '';

  if (strategy === 'price') {
    content = `
<h1>${h1}</h1>

<p>正在尋找<strong>${keyword}</strong>服務嗎？本篇整理了高 CP 值的選擇，讓你花小錢也能享受專業服務。</p>

<h2>${keyword}怎麼挑才划算？</h2>

<p>選擇${keyword}服務時，建議先比較以下重點：價格透明度、服務內容、額外優惠。很多店家會提供首次優惠或套裝組合，善用這些方案可以省下不少費用。</p>

<h2>平價${keyword}服務比較表</h2>

<p>以下整理了市面上常見的價格區間供參考。</p>

<h2>什麼時候最適合預約？</h2>

<p>平日預約通常比假日便宜，部分店家也會在淡季推出優惠活動。建議提前預約，不但能選到理想時段，有時還能享有早鳥價。</p>
`;
  } else if (strategy === 'quality') {
    content = `
<h1>${h1}</h1>

<p>追求品質的你，一定在尋找真正專業的<strong>${keyword}</strong>服務。本篇將深入介紹如何辨識優質服務，讓你的每一分投資都物超所值。</p>

<h2>專業${keyword}服務有什麼不同？</h2>

<p>真正專業的服務從細節就能看出差異：完整的事前諮詢、透明的服務流程、使用的設備與材料等級。這些細節決定了最終的服務品質與滿意度。</p>

<h2>如何辨識${keyword}的專業度？</h2>

<p>建議觀察以下幾點：服務人員的專業資歷、店家的營業年資、客戶評價的真實性。有經驗的專業人員會主動說明服務內容，而非只談價格。</p>

<h2>選擇品質服務的長期價值</h2>

<p>雖然專業服務的價格可能較高，但考量到效果持久度和整體體驗，長期來看反而更划算。品質投資帶來的是安心與滿意。</p>
`;
  } else {
    content = `
<h1>${h1}</h1>

<p>想找<strong>${keyword}</strong>服務嗎？這篇文章整理了完整的資訊，幫助你做出最適合的選擇。</p>

<h2>${keyword}服務該注意什麼？</h2>

<p>選擇服務前，建議先了解自己的需求和預算。不同的服務方案適合不同的情況，找到最適合自己的才是最重要的。</p>

<h2>常見問題解答</h2>

<p>許多人在選擇${keyword}服務時會有疑問，以下整理了最常被問到的問題。</p>

<h2>如何預約${keyword}服務？</h2>

<p>大部分店家都提供線上預約或電話預約，建議提前 3-5 天預約以確保能選到理想時段。</p>
`;
  }

  editor.setContent(content);
  analyzer.analyze();

  // Add EXP for completing a draft
  levelSystem.addExp(30);
  showToast('初稿完成！獲得 30 EXP', 'success');
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
  const success = await editor.copyFormatted();
  if (success) {
    showToast('已複製到剪貼簿', 'success');
    levelSystem.addExp(10);
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

  state.partyNames.guide = elements.customGuide.value.trim() || '伊歐';
  state.partyNames.writer = elements.customWriter.value.trim() || '哈皮';
  state.partyNames.player = elements.customPlayer.value.trim() || 'BLUE';

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

  const row = document.createElement('div');
  row.className = 'extra-image-row';
  row.dataset.key = key;

  row.innerHTML = `
    <div class="image-slot${(blob || defaultSrc) ? ' filled' : ''}" data-key="${key}">
      <input type="file" accept="image/png,image/jpeg,image/webp" class="image-input" tabindex="-1">
      <div class="image-placeholder">
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
          <line x1="12" y1="8" x2="12" y2="16"/>
          <line x1="8" y1="12" x2="16" y2="12"/>
        </svg>
      </div>
      <img class="image-preview" alt="其他圖片" ${blob ? `src="${imageStorage.createImageURL(blob)}"` : (defaultSrc ? `src="${defaultSrc}"` : '')}>
      <button class="image-delete" title="刪除圖片">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"/>
          <line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
    <div class="extra-desc">
      <input type="text" placeholder="備註用途（如「升級慶祝」、「寫筆記中」）" value="${description || ''}" maxlength="80">
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

  // Update footer year
  updateFooterYear();

  // Event Listeners
  elements.questForm.addEventListener('submit', handleQuestSubmit);

  elements.strategyOptions.forEach(option => {
    option.addEventListener('click', handleStrategySelect);
  });

  elements.backToStep2.addEventListener('click', () => goToStep(2));
  elements.confirmFacts.addEventListener('click', startWriting);

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
    checkItems: elements.checkItems
  });

  // Initialize templates
  templates.init(elements.templateButtons, editor);

  // Initialize image modal and load saved avatars
  initImageModal();
  updateAvatars();

  // Initialize party moods
  updatePartyMoods(1);

  // Editor change listener
  elements.editor.addEventListener('input', () => {
    analyzer.analyze();
  });

  console.log('SGE 文案助手已載入！歡迎來到文案大陸～');
}

// Start app
document.addEventListener('DOMContentLoaded', init);

// Export for debugging
window.sgeApp = { state, goToStep, showToast, levelSystem };
