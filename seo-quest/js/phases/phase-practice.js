/**
 * SEO Quest — Practice 階段渲染（實作編輯器）
 */

import { State } from '../core/state.js';
import { Router } from '../core/router.js';
import { Events } from '../core/events.js';

export const PhasePractice = {
  render(container) {
    const data = State.currentLevel?.phases?.practice;
    if (!data) {
      container.innerHTML = `
        <div class="phase-content text-center" style="padding:var(--spacing-3xl);">
          <p class="h3" style="margin-bottom:var(--spacing-md);">載入失敗</p>
          <p class="lead">實作挑戰資料尚未準備好，請回到關卡地圖重試。</p>
          <button class="back-button" data-back="level-map" style="margin-top:var(--spacing-lg);">← 返回關卡地圖</button>
        </div>`;
      return;
    }

    const mission = data.mission || {};
    const req = data.requirements || {};
    const primaryReq = req.primaryKeywords || {};
    const secondaryReq = req.secondaryKeywords || {};
    const contentReq = req.content || {};

    container.innerHTML = `
      <div class="phase-header">
        <div class="badge badge-warning" style="margin-bottom:var(--spacing-md);color:var(--color-text-primary);">實作挑戰</div>
        <h2 class="phase-title">${data.title}</h2>
      </div>

      <!-- 任務簡報 -->
      <div class="phase-content" style="margin-bottom:var(--spacing-lg);">
        <h3 class="h4">任務簡報</h3>
        <p>${mission.scenario || ''}</p>
        <div class="grid grid-2" style="gap:var(--spacing-md);margin-top:var(--spacing-md);">
          ${mission.client ? `<div><span class="small" style="color:var(--color-text-tertiary);">客戶</span><br><strong>${mission.client}</strong></div>` : ''}
          ${mission.topic ? `<div><span class="small" style="color:var(--color-text-tertiary);">主題</span><br><strong>${mission.topic}</strong></div>` : ''}
          ${mission.target ? `<div><span class="small" style="color:var(--color-text-tertiary);">目標受眾</span><br><strong>${mission.target}</strong></div>` : ''}
          ${mission.tone ? `<div><span class="small" style="color:var(--color-text-tertiary);">語氣</span><br><strong>${mission.tone}</strong></div>` : ''}
        </div>
      </div>

      <!-- 編輯器 -->
      <div class="editor-container">
        <!-- 關鍵字輸入 -->
        <div class="phase-content">
          <h3 class="h4">主要關鍵字（${primaryReq.count || 2} 個）</h3>
          <p class="small" style="color:var(--color-text-tertiary);">${primaryReq.hint || ''}</p>
          <input type="text" id="input-primary" placeholder="以逗號分隔，例如：天然手工皂, 手工皂製作"
                 style="width:100%;margin-top:var(--spacing-sm);">
        </div>

        <div class="phase-content">
          <h3 class="h4">次要關鍵字（${secondaryReq.count || 3} 個）</h3>
          <p class="small" style="color:var(--color-text-tertiary);">${secondaryReq.hint || ''}</p>
          <input type="text" id="input-secondary" placeholder="以逗號分隔"
                 style="width:100%;margin-top:var(--spacing-sm);">
        </div>

        <!-- 文案區 -->
        <div class="phase-content">
          <h3 class="h4">撰寫文案</h3>
          <p class="small" style="color:var(--color-text-tertiary);">${contentReq.hint || ''}</p>
          <div class="editor-toolbar" style="margin-top:var(--spacing-sm);">
            <div class="editor-stats">
              <span>字數：<strong id="stat-words">0</strong> / ${contentReq.minLength || 100}-${contentReq.maxLength || 200}</span>
              <span>關鍵字密度：<strong id="stat-density">0</strong>%</span>
            </div>
          </div>
          <textarea class="editor-textarea" id="input-content"
                    placeholder="在這裡撰寫你的 SEO 文案..."
                    style="width:100%;margin-top:var(--spacing-sm);"></textarea>
        </div>
      </div>

      <!-- 提交 -->
      <div class="phase-footer" style="justify-content:flex-end;">
        <button class="mode-button" id="btn-submit"
                style="min-width:auto;max-width:none;padding:var(--spacing-md) var(--spacing-xl);text-align:center;">
          <div class="mode-button-title" style="font-size:var(--font-size-lg);">提交評分 →</div>
        </button>
      </div>
    `;

    // 即時統計
    const textarea = container.querySelector('#input-content');
    const statWords = container.querySelector('#stat-words');
    const statDensity = container.querySelector('#stat-density');
    const primaryInput = container.querySelector('#input-primary');

    // Regex 跳脫（防止特殊字元造成 RegExp 錯誤）
    const escRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    let _debounceTimer;
    const updateStats = () => {
      clearTimeout(_debounceTimer);
      _debounceTimer = setTimeout(() => {
        const text = textarea.value.trim();
        const wordCount = [...text].length;
        statWords.textContent = wordCount;

        const keywords = primaryInput.value.split(/[,，]/).map(k => k.trim()).filter(Boolean);
        if (keywords.length && wordCount > 0) {
          let kwCount = 0;
          keywords.forEach(kw => {
            try {
              const matches = text.match(new RegExp(escRe(kw), 'gi'));
              if (matches) kwCount += matches.length;
            } catch { /* skip invalid regex */ }
          });
          const density = ((kwCount * (keywords[0]?.length || 1)) / wordCount * 100).toFixed(1);
          statDensity.textContent = isFinite(density) ? density : '0';
        } else {
          statDensity.textContent = '0';
        }
      }, 200);
    };

    textarea.addEventListener('input', updateStats);
    primaryInput.addEventListener('input', updateStats);

    // 提交
    container.querySelector('#btn-submit').addEventListener('click', () => {
      // 收集答案
      State._practiceAnswer = {
        primaryKeywords: primaryInput.value.split(/[,，]/).map(k => k.trim()).filter(Boolean),
        secondaryKeywords: container.querySelector('#input-secondary').value.split(/[,，]/).map(k => k.trim()).filter(Boolean),
        content: textarea.value.trim(),
        wordCount: [...textarea.value.trim()].length,
      };
      Router.nextPhase();
    });
  },
};
