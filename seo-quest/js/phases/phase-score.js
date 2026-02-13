/**
 * SEO Quest — Score 階段渲染（評分回饋）
 */

import { State } from '../core/state.js';
import { Router } from '../core/router.js';

// 角色主題色
const COLORS = {
  io: 'var(--color-primary)',
  blue: '#2C3E50',
  happi: 'var(--color-secondary)',
};

export const PhaseScore = {
  render(container) {
    const data = State.currentLevel?.phases?.scoring;
    if (!data) {
      container.innerHTML = `
        <div class="phase-content text-center" style="padding:var(--spacing-3xl);">
          <p class="h3" style="margin-bottom:var(--spacing-md);">載入失敗</p>
          <p class="lead">評分資料尚未準備好，請回到關卡地圖重試。</p>
          <button class="back-button" data-back="level-map" style="margin-top:var(--spacing-lg);">← 返回關卡地圖</button>
        </div>`;
      return;
    }

    // 簡易評分邏輯（根據 practice 答案）
    const answer = State._practiceAnswer || {};
    const score = this._calculateScore(answer, data.criteria);
    const feedback = this._getFeedback(score, data.feedback?.ranges || []);
    const bossMsg = data.bossComment?.messages?.[feedback.grade] || '';
    const bossChar = data.bossComment?.character || 'io';
    const charData = State.characters?.[bossChar] || {};

    // 存分數供 completeLevel 使用
    State._lastScore = score;

    // 星星
    const stars = feedback.stars || 0;
    const starHtml = Array.from({ length: 5 }, (_, i) =>
      `<span class="star ${i < stars ? 'filled' : ''}">${i < stars ? '\u2605' : '\u2606'}</span>`
    ).join('');

    // 評分等級色
    const gradeClass = feedback.grade === 'excellent' ? 'excellent'
      : feedback.grade === 'good' ? 'good'
      : feedback.grade === 'pass' ? 'pass'
      : 'fail';

    container.innerHTML = `
      <div class="phase-header">
        <div class="badge badge-primary" style="margin-bottom:var(--spacing-md);">評分結果</div>
        <h2 class="phase-title">關卡評分</h2>
      </div>

      <!-- 分數顯示 -->
      <div class="phase-content text-center" style="margin-bottom:var(--spacing-xl);">
        <div style="font-size:var(--font-size-4xl);font-weight:var(--font-weight-bold);margin-bottom:var(--spacing-md);">
          ${score}<span style="font-size:var(--font-size-lg);color:var(--color-text-tertiary);">/100</span>
        </div>
        <div class="star-rating" style="justify-content:center;margin-bottom:var(--spacing-md);">
          ${starHtml}
        </div>
        <div class="score-bar-container">
          <div class="progress-bar-wrapper">
            <div class="progress-bar score-bar ${gradeClass}" style="width:${score}%;">
              ${score}%
            </div>
          </div>
        </div>
      </div>

      <!-- 回饋訊息 -->
      <div class="phase-content" style="margin-bottom:var(--spacing-lg);">
        <p style="line-height:var(--line-height-relaxed);">${feedback.message || ''}</p>
      </div>

      <!-- 角色點評 -->
      ${bossMsg ? `
      <div class="phase-content" style="margin-bottom:var(--spacing-xl);">
        <div class="dialogue-message">
          <div class="dialogue-avatar" style="font-size:36px;">${charData.avatar || ''}</div>
          <div class="dialogue-bubble">
            <div class="dialogue-speaker" style="color:${COLORS[bossChar] || 'var(--color-text-primary)'};">${charData.name || bossChar}</div>
            <div class="dialogue-text">${bossMsg}</div>
          </div>
        </div>
      </div>
      ` : ''}

      <!-- 評分細項 -->
      <div class="phase-content" style="margin-bottom:var(--spacing-xl);">
        <h3 class="h4" style="margin-bottom:var(--spacing-md);">評分明細</h3>
        ${this._renderCriteria(data.criteria, answer)}
      </div>

      <!-- 下一步 -->
      <div class="phase-footer" style="justify-content:flex-end;">
        <button class="mode-button" id="btn-next-phase"
                style="min-width:auto;max-width:none;padding:var(--spacing-md) var(--spacing-xl);text-align:center;">
          <div class="mode-button-title" style="font-size:var(--font-size-lg);">查看獎勵 →</div>
        </button>
      </div>
    `;

    container.querySelector('#btn-next-phase').addEventListener('click', () => {
      Router.nextPhase();
    });
  },

  _calculateScore(answer, criteria) {
    if (!criteria || !answer.content) return 0;

    let total = 0;
    const content = answer.content || '';
    const wordCount = [...content].length;
    const primaryKw = answer.primaryKeywords || [];
    const secondaryKw = answer.secondaryKeywords || [];

    // 黃金三角結構（35 分預設）
    if (criteria.goldenTriangle) {
      const w = criteria.goldenTriangle.weight || 35;
      let dimScore = 0;
      // 問句式標題（內容包含問號）
      if (/[？?]/.test(content)) dimScore += 30;
      // 知識科普段落存在（有一定內容量且非直接列店家）
      if (wordCount >= 50) dimScore += 25;
      // 有換行分段（結構性）
      if (content.includes('\n')) dimScore += 20;
      // 暖場語氣（使用引導式詞彙）
      if (/怎麼|如何|為什麼|什麼|你知道|其實/.test(content)) dimScore += 25;
      total += (Math.min(dimScore, 100) / 100) * w;
    }

    // 關鍵字選擇（舊格式相容）
    if (criteria.keywordSelection) {
      const w = criteria.keywordSelection.weight || 30;
      let dimScore = 0;
      if (primaryKw.length >= 1) dimScore += 40;
      if (primaryKw.length >= 2) dimScore += 20;
      if (secondaryKw.length >= 2) dimScore += 20;
      if (secondaryKw.length >= 4) dimScore += 20;
      total += (dimScore / 100) * w;
    }

    // 關鍵字使用（30 分預設）
    if (criteria.keywordUsage) {
      const w = criteria.keywordUsage.weight || 30;
      let dimScore = 0;
      // 密度計算
      if (wordCount > 0) {
        let kwCount = 0;
        primaryKw.forEach(kw => {
          const matches = content.match(new RegExp(kw, 'gi'));
          if (matches) kwCount += matches.length;
        });
        const density = (kwCount * (primaryKw[0]?.length || 1)) / wordCount * 100;
        if (density >= 1.0 && density <= 3.5) dimScore += 40;
        else if (density > 0) dimScore += 20;
        // 關鍵字出現頻率
        if (kwCount >= 2 && kwCount <= 5) dimScore += 30;
        else if (kwCount >= 1) dimScore += 15;
      }
      // 次要關鍵字是否使用
      let secUsed = 0;
      secondaryKw.forEach(kw => {
        if (content.includes(kw)) secUsed++;
      });
      if (secUsed >= 2) dimScore += 30;
      else if (secUsed >= 1) dimScore += 15;
      total += (dimScore / 100) * w;
    }

    // 內容品質（35-40 分預設）— 與 goldenTriangle 互補不重疊
    if (criteria.contentQuality) {
      const w = criteria.contentQuality.weight || 35;
      let dimScore = 0;
      // 字數在範圍內
      const level = State.currentLevel?.phases?.practice;
      const minLen = level?.requirements?.content?.minLength || 80;
      const maxLen = level?.requirements?.content?.maxLength || 200;
      if (wordCount >= minLen && wordCount <= maxLen) dimScore += 40;
      else if (wordCount >= minLen * 0.7) dimScore += 20;
      // 有使用標點（多樣性）
      if (/[，。！？]/.test(content)) dimScore += 25;
      // 段落結構完整（3+ 段落）
      const paragraphs = content.split('\n').filter(p => p.trim().length > 0);
      if (paragraphs.length >= 3) dimScore += 35;
      else if (paragraphs.length >= 2) dimScore += 15;
      total += (Math.min(dimScore, 100) / 100) * w;
    }

    return Math.min(100, Math.round(total));
  },

  _getFeedback(score, ranges) {
    for (const r of ranges) {
      if (score >= r.min && score <= r.max) return r;
    }
    return { grade: 'fail', stars: 1, message: '' };
  },

  _renderCriteria(criteria, answer) {
    if (!criteria) return '';
    let html = '';
    const labels = {
      goldenTriangle: '黃金三角結構',
      keywordSelection: '關鍵字選擇',
      keywordUsage: '關鍵字使用',
      contentQuality: '內容品質',
    };
    Object.keys(criteria).forEach(key => {
      const dim = criteria[key];
      html += `
        <div style="margin-bottom:var(--spacing-md);padding:var(--spacing-md);background:var(--color-background-alt);border-radius:var(--radius-md);">
          <div class="flex-between" style="margin-bottom:var(--spacing-xs);">
            <strong>${labels[key] || key}</strong>
            <span class="small" style="color:var(--color-text-tertiary);">權重 ${dim.weight}%</span>
          </div>
          ${dim.checks?.map(c => `
            <p class="small" style="margin:var(--spacing-xs) 0;color:var(--color-text-secondary);">
              ${c.name}（${c.points} 分）：${c.description}
            </p>
          `).join('') || ''}
        </div>
      `;
    });
    return html;
  },
};
