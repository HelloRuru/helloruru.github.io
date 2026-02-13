/**
 * SEO Quest — Levelup 階段渲染（升級獎勵）
 */

import { State } from '../core/state.js';
import { Router } from '../core/router.js';
import { Events } from '../core/events.js';

export const PhaseLevelup = {
  render(container) {
    const data = State.currentLevel?.phases?.levelup;
    if (!data) {
      container.innerHTML = `
        <div class="phase-content text-center" style="padding:var(--spacing-3xl);">
          <p class="h3" style="margin-bottom:var(--spacing-md);">載入失敗</p>
          <p class="lead">升級資料尚未準備好，請回到關卡地圖重試。</p>
          <button class="back-button" data-back="level-map" style="margin-top:var(--spacing-lg);">← 返回關卡地圖</button>
        </div>`;
      return;
    }

    const expGain = data.expGain || State.currentLevel?.expReward || 100;
    const prevLevel = State.user.level;

    // 發放經驗值
    State.addExp(expGain);
    const newLevel = State.user.level;
    const didLevelUp = newLevel > prevLevel;

    // 解鎖項目
    const unlocks = data.unlocks || [];
    const achievements = data.achievements || [];
    const nextLevel = data.nextLevel || {};

    container.innerHTML = `
      <div class="phase-header text-center">
        <div class="badge badge-success" style="margin-bottom:var(--spacing-md);">關卡完成</div>
        <h2 class="phase-title">${State.currentLevel?.title || '關卡'} — 完成！</h2>
      </div>

      <!-- 經驗值獲得 -->
      <div class="phase-content text-center" style="margin-bottom:var(--spacing-xl);">
        <p style="font-size:var(--font-size-xl);margin-bottom:var(--spacing-md);">
          獲得 <strong style="color:var(--color-primary);">+${expGain} EXP</strong>
        </p>

        ${didLevelUp ? `
        <div style="padding:var(--spacing-lg);background:linear-gradient(135deg, rgba(212,165,165,0.15), rgba(184,169,201,0.15));border-radius:var(--radius-lg);margin-bottom:var(--spacing-lg);">
          <p style="font-size:var(--font-size-2xl);font-weight:var(--font-weight-bold);margin-bottom:var(--spacing-sm);">
            Level Up!
          </p>
          <p style="font-size:var(--font-size-lg);">
            Lv.${prevLevel} → <strong style="color:var(--color-primary);">Lv.${newLevel}</strong>
          </p>
          <p style="color:var(--color-text-secondary);margin-top:var(--spacing-xs);">
            ${State.title}
          </p>
        </div>
        ` : `
        <div class="progress-container" style="max-width:400px;margin:0 auto;">
          <div class="progress-header">
            <span class="progress-label">Lv.${newLevel} ${State.title}</span>
            <span class="progress-value">${State.user.exp} / ${State.expToNext} EXP</span>
          </div>
          <div class="progress-bar-wrapper">
            <div class="progress-bar" style="width:${Math.min(100, (State.user.exp / State.expToNext) * 100)}%;"></div>
          </div>
        </div>
        `}
      </div>

      <!-- 解鎖項目 -->
      ${unlocks.length ? `
      <div class="phase-content" style="margin-bottom:var(--spacing-xl);">
        <h3 class="h4" style="margin-bottom:var(--spacing-md);">解鎖內容</h3>
        <div class="grid grid-2" style="gap:var(--spacing-md);">
          ${unlocks.map(u => `
            <div class="card" style="padding:var(--spacing-lg);">
              <div style="font-size:32px;margin-bottom:var(--spacing-sm);">${u.icon || ''}</div>
              <h4 class="card-title" style="margin-bottom:var(--spacing-xs);">${u.name}</h4>
              <p class="small" style="color:var(--color-text-secondary);">${u.description}</p>
              ${u.type === 'note' && u.content ? `
                <ul style="margin-top:var(--spacing-sm);padding-left:var(--spacing-lg);">
                  ${u.content.map(item => `<li class="small">${item}</li>`).join('')}
                </ul>
              ` : ''}
            </div>
          `).join('')}
        </div>
      </div>
      ` : ''}

      <!-- 成就 -->
      ${achievements.length ? `
      <div class="phase-content" style="margin-bottom:var(--spacing-xl);">
        ${achievements.map(a => `
          <div style="padding:var(--spacing-md);background:var(--color-background-alt);border-radius:var(--radius-md);text-align:center;">
            <p style="font-weight:var(--font-weight-bold);">${a.message}</p>
          </div>
        `).join('')}
      </div>
      ` : ''}

      <!-- 下一關預告 -->
      ${nextLevel.id ? `
      <div class="phase-content" style="margin-bottom:var(--spacing-xl);">
        <h3 class="h4" style="margin-bottom:var(--spacing-sm);">下一關</h3>
        <div class="card" style="padding:var(--spacing-lg);">
          <div class="badge badge-primary" style="margin-bottom:var(--spacing-sm);">${nextLevel.id}</div>
          <h4 class="card-title">${nextLevel.title}</h4>
          <p class="small" style="color:var(--color-text-secondary);margin-top:var(--spacing-xs);">${nextLevel.preview || ''}</p>
        </div>
      </div>
      ` : ''}

      <!-- 回到地圖 -->
      <div class="phase-footer" style="justify-content:center;">
        <button class="mode-button" id="btn-back-map"
                style="min-width:auto;max-width:none;padding:var(--spacing-md) var(--spacing-xl);text-align:center;">
          <div class="mode-button-title" style="font-size:var(--font-size-lg);">回到關卡地圖 →</div>
        </button>
      </div>
    `;

    container.querySelector('#btn-back-map').addEventListener('click', () => {
      Router.completeLevel();
    });
  },
};
