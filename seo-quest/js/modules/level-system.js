/**
 * SEO Quest — 等級系統與關卡地圖
 */

import { State } from '../core/state.js';
import { Router } from '../core/router.js';
import { Events } from '../core/events.js';
import { Config } from '../config.js';

export const LevelSystem = {
  init() {
    Events.on('mode:tutorial', () => this.renderMap());
    Events.on('level:complete', () => this.renderMap());
    this.renderHeaderLevel();
    Events.on('state:user', () => this.renderHeaderLevel());
  },

  renderHeaderLevel() {
    const container = document.getElementById('header-right');
    if (!container) return;
    container.innerHTML = `
      <div class="level-display">
        <span class="level-badge">Lv.${State.user.level}</span>
        <span class="level-title">${State.title}</span>
      </div>
    `;
  },

  renderMap() {
    const container = document.getElementById('view-level-map');
    if (!container) return;

    let html = '<button class="back-button" data-back="mode-select" aria-label="返回模式選擇">← 返回</button>';
    html += '<h2 class="section-title text-center" style="margin-bottom:var(--spacing-2xl);">關卡地圖</h2>';

    Config.worlds.forEach(world => {
      html += `
        <div class="world-section">
          <div class="world-header">
            <h3 class="h3">${world.title}</h3>
          </div>
          <div class="level-grid">
      `;

      world.levels.forEach(levelId => {
        const completed = State.completedLevels[levelId];
        const worldNum = parseInt(levelId.split('-')[0]);
        const requiredLevel = worldNum === 1 ? 1 : worldNum === 2 ? 4 : 7;
        const locked = State.user.level < requiredLevel;
        const levelNum = levelId.split('-')[1];

        const titles = {
          '1-1': '關鍵字優化基礎',
          '1-2': '標題優化技巧',
          '1-3': '段落結構設計',
          '1-4': '內部連結策略',
          '1-5': 'SEO 文案實戰',
        };
        const title = titles[levelId] || `關卡 ${levelId}`;

        html += `
          <div class="card ${locked ? 'is-disabled' : ''} ${completed ? '' : ''}"
               ${!locked ? `data-level="${levelId}" role="button" tabindex="0"` : ''}
               style="cursor:${locked ? 'not-allowed' : 'pointer'};">
            <div class="card-header flex-between">
              <span class="badge ${completed ? 'badge-success' : locked ? '' : 'badge-primary'}">
                ${completed ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><polyline points="20 6 9 17 4 12"/></svg> 完成' : locked ? '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg> 鎖定' : `${levelId}`}
              </span>
              ${completed ? `<span class="small" style="color:var(--color-text-tertiary);">${completed.score}分</span>` : ''}
            </div>
            <div class="card-body">
              <h4 class="card-title">${title}</h4>
            </div>
          </div>
        `;
      });

      html += '</div></div>';
    });

    container.innerHTML = html;

    // 綁定點擊事件
    container.querySelectorAll('[data-level]').forEach(card => {
      const handler = () => Router.startLevel(card.dataset.level);
      card.addEventListener('click', handler);
      card.addEventListener('keydown', e => { if (e.key === 'Enter') handler(); });
    });
  },
};
