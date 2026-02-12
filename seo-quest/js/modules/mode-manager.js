/**
 * SEO Quest — 模式管理（教學模式 / 工具模式）
 */

import { State } from '../core/state.js';
import { Router } from '../core/router.js';
import { Events } from '../core/events.js';

export const ModeManager = {
  init() {
    // 綁定模式按鈕
    document.querySelectorAll('.mode-button').forEach(btn => {
      btn.addEventListener('click', () => {
        const mode = btn.dataset.mode;
        this.selectMode(mode);
      });
    });

    // 如果之前已選過模式，自動跳轉
    if (State.settings.mode) {
      this.selectMode(State.settings.mode);
    }
  },

  selectMode(mode) {
    State.settings.mode = mode;
    State.persist();

    // 更新按鈕 active 狀態
    document.querySelectorAll('.mode-button').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.mode === mode);
    });

    if (mode === 'tutorial') {
      Router.showView('view-level-map');
      Events.emit('mode:tutorial');
    } else {
      Router.showView('view-tool');
      Events.emit('mode:tool');
    }

    Events.emit('mode:change', mode);
  },
};
