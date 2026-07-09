/**
 * GEO 技能樹 — skill-tree.js
 *
 * 「GEO 文案冒險學院」的技能樹互動邏輯。
 * 管理 5 個 GEO 維度（證據、結構、流暢、覆蓋、權威）的學習狀態。
 */

// ============================================================
// 1. 技能定義
// ============================================================

const SKILLS = {
  evidence: {
    name: '證據引用層',
    icon: '📊',
    maxScore: 40,
    levels: ['未解鎖', '學習中', '熟練'],
  },
  structure: {
    name: '結構規範層',
    icon: '🏗️',
    maxScore: 25,
    levels: ['未解鎖', '學習中', '熟練'],
  },
  fluency: {
    name: '表達流暢層',
    icon: '💬',
    maxScore: 10,
    levels: ['未解鎖', '學習中', '熟練'],
  },
  coverage: {
    name: '問題覆蓋層',
    icon: '🎯',
    maxScore: 15,
    levels: ['未解鎖', '學習中', '熟練'],
  },
  authority: {
    name: '權威信號層',
    icon: '👑',
    maxScore: 10,
    levels: ['未解鎖', '學習中', '熟練'],
  },
};

// ============================================================
// 2. 技能說明文字（點擊展開時顯示）
// ============================================================

const SKILL_DESCRIPTIONS = {
  evidence:
    'AI 引用你的內容，靠的是證據不是形容詞。加入數據（15分）、來源標註（15分）、專家引語（10分）',
  structure:
    '清楚的結構讓 AI 一眼看懂你的脈絡。H1 唯一（4分）、H2 分層（6分）、列點（5分）、表格（5分）、倒金字塔（5分）',
  fluency:
    '流暢的邏輯讓 AI 讀懂段落關係。過渡詞（5分）、短段落（5分）',
  coverage:
    '圍繞真實問題組織內容。痛點問句（8分）、關鍵字自然分散（7分）',
  authority:
    '權威感讓 AI 更信任你的內容。社會證明（5分）、第一手經驗（5分）',
};

// ============================================================
// 3. 等級計算
// ============================================================

/**
 * 根據分數傳回等級字串。
 * @param {string} skillKey  — SKILLS 的 key（evidence, structure …）
 * @param {number} score     — 該維度已獲得的分數
 * @returns {string}         — '未解鎖'｜'學習中'｜'熟練'
 */
function getSkillLevel(skillKey, score) {
  const skill = SKILLS[skillKey];
  if (!skill) return '未解鎖';

  const ratio = score / skill.maxScore;

  if (ratio <= 0) return skill.levels[0]; // 未解鎖
  if (ratio <= 0.5) return skill.levels[1]; // 學習中
  return skill.levels[2]; // 熟練
}

/**
 * 傳回整體進度百分比（0–100）。
 * @param {Object} breakdown — { evidence: N, structure: N, fluency: N, coverage: N, authority: N }
 * @returns {number}         — 無條件捨去到整數
 */
function getOverallProgress(breakdown) {
  const totalMax = Object.values(SKILLS).reduce((sum, s) => sum + s.maxScore, 0);
  const earned = Object.keys(SKILLS).reduce(
    (sum, key) => sum + (breakdown[key] || 0),
    0,
  );
  return Math.min(100, Math.floor((earned / totalMax) * 100));
}

// ============================================================
// 4. 渲染
// ============================================================

/**
 * 渲染技能樹 HTML 到指定的容器元素。
 * @param {HTMLElement} cardElement — 要填入內容的 DOM 節點
 * @param {Object}      breakdown   — 各維度分數 { evidence, structure, fluency, coverage, authority }
 */
function render(cardElement, breakdown) {
  const overall = getOverallProgress(breakdown);
  const order = ['evidence', 'structure', 'fluency', 'coverage', 'authority'];

  let crystalsHtml = '';
  for (const key of order) {
    const skill = SKILLS[key];
    const score = breakdown[key] || 0;
    const level = getSkillLevel(key, score);
    const mastered = level === '熟練' ? 'mastered' : '';
    const pct = Math.floor((score / skill.maxScore) * 100);

    crystalsHtml += `
      <div class="skill-crystal" data-skill="${key}" data-level="${level}">
        <div class="skill-crystal-icon ${mastered}">${skill.icon}</div>
        <div class="skill-crystal-name">${skill.name.replace('層', '')}</div>
        <div class="skill-crystal-level">${level}</div>
        <div class="skill-crystal-score">${score}/${skill.maxScore}（${pct}%）</div>
        <div class="skill-crystal-detail">${SKILL_DESCRIPTIONS[key]}</div>
      </div>
    `;
  }

  cardElement.innerHTML = `
    <div class="skill-tree-content">
      <div class="skill-tree-overall">
        <span class="skill-tree-progress-label">GEO 整體掌握度</span>
        <div class="skill-tree-progress-bar">
          <div class="skill-tree-progress-fill" style="width: ${overall}%"></div>
        </div>
        <span class="skill-tree-progress-text">${overall}%</span>
      </div>
      <div class="skill-tree-grid">
        ${crystalsHtml}
      </div>
    </div>
  `;

  // 點擊展開詳細說明（事件委派）
  cardElement.addEventListener('click', function onClick(e) {
    const crystal = e.target.closest('.skill-crystal');
    if (!crystal) return;

    const detail = crystal.querySelector('.skill-crystal-detail');
    if (!detail) return;

    // 切換展開狀態（同一時間只展開一個）
    const isOpen = crystal.classList.contains('expanded');
    document
      .querySelectorAll('.skill-crystal.expanded')
      .forEach((el) => el.classList.remove('expanded'));
    if (!isOpen) {
      crystal.classList.add('expanded');
    }
  });
}

// ============================================================
// 5. 初始化
// ============================================================

/**
 * 初始化技能樹相關的全域事件監聽（如果未來需要掛載畫面外邏輯，放在這裡）。
 */
function init() {
  // 未來可在此加入 resize 監聽、動畫觸發等
}

// ============================================================
// 6. 匯出
// ============================================================

export const skillTree = {
  init,
  render,
  getSkillLevel,
  getOverallProgress,
};
