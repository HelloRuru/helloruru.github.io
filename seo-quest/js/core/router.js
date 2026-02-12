/**
 * SEO Quest — 階段路由管理
 */

import { State } from './state.js';
import { Events } from './events.js';
import { Config } from '../config.js';

export const Router = {
  // 切換主畫面
  navigate(view) {
    const views = ['mode-select', 'level-map', 'phase', 'tool'];
    views.forEach(v => {
      const el = document.getElementById(`view-${v === 'mode-select' ? 'mode-select' : v === 'level-map' ? 'level-map' : v}`);
      if (el) el.style.display = v === view ? '' : 'none';
    });
    State.update('currentView', view);
    Events.emit('view:change', view);
  },

  showView(viewId) {
    // 隱藏所有 section
    document.querySelectorAll('#app main section').forEach(s => s.style.display = 'none');
    const el = document.getElementById(viewId);
    if (el) el.style.display = '';
  },

  // 開始某一關
  async startLevel(levelId) {
    Events.emit('level:loading', levelId);
    try {
      const worldNum = levelId.split('-')[0];
      const res = await fetch(`${Config.paths.levels}/world-${worldNum}/${levelId}.json`);
      if (!res.ok) throw new Error(`Failed to load level ${levelId}`);
      const levelData = JSON.parse(await res.text());
      State.update('currentLevel', levelData);
      State.update('currentLevelId', levelId);
      this.goToPhase('tutorial');
      this.showView('view-phase');
      Events.emit('level:started', levelData);
    } catch (e) {
      console.error('Level load error:', e);
      Events.emit('level:error', e);
    }
  },

  // 切換到指定階段
  goToPhase(phase) {
    State.update('currentPhase', phase);
    Events.emit('phase:change', phase);
  },

  // 下一階段
  nextPhase() {
    const phases = Config.phases;
    const idx = phases.indexOf(State.currentPhase);
    if (idx < phases.length - 1) {
      this.goToPhase(phases[idx + 1]);
    } else {
      this.completeLevel();
    }
  },

  // 完成關卡，回到地圖
  completeLevel() {
    const id = State.currentLevelId;
    if (id) {
      State.completedLevels[id] = {
        completedAt: new Date().toISOString(),
        score: State._lastScore || 0,
      };
      State.persist();
    }
    Events.emit('level:complete', id);
    this.showView('view-level-map');
    Events.emit('view:change', 'level-map');
  },
};
