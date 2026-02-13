/**
 * SEO Quest — 主進入點
 * 啟動應用、載入資源、初始化模組
 */

import { Config } from './config.js';
import { State } from './core/state.js';
import { Events } from './core/events.js';
import { Router } from './core/router.js';
import { ModeManager } from './modules/mode-manager.js';
import { LevelSystem } from './modules/level-system.js';
import { PhaseTutorial } from './phases/phase-tutorial.js';
import { PhaseDemo } from './phases/phase-demo.js';
import { PhasePractice } from './phases/phase-practice.js';
import { PhaseScore } from './phases/phase-score.js';
import { PhaseLevelup } from './phases/phase-levelup.js';
import { initOpeningSequence, getPlayerName } from './features/opening-sequence.js';

// 階段渲染器對照
const phaseRenderers = {
  tutorial: PhaseTutorial,
  demo: PhaseDemo,
  practice: PhasePractice,
  score: PhaseScore,
  levelup: PhaseLevelup,
};

// ── 資源載入 ──────────────────────────────
async function loadResources(onProgress) {
  const tasks = [
    {
      label: '載入角色資料',
      fn: async () => {
        const res = await fetch(Config.paths.characters);
        if (!res.ok) throw new Error('角色資料載入失敗');
        const chars = await res.json();
        State.update('characters', chars);
      },
    },
    {
      label: '準備關卡地圖',
      fn: async () => {
        // 模擬載入延遲（讓載入畫面有進度感）
        await new Promise(r => setTimeout(r, 200));
      },
    },
    {
      label: '初始化系統',
      fn: async () => {
        await new Promise(r => setTimeout(r, 150));
      },
    },
  ];

  for (let i = 0; i < tasks.length; i++) {
    onProgress(tasks[i].label, ((i + 1) / tasks.length) * 100);
    await tasks[i].fn();
  }
}

// ── 載入畫面控制 ──────────────────────────
function updateLoader(status, percent) {
  const statusEl = document.getElementById('loader-status');
  const percentEl = document.getElementById('loader-percent');
  const progressEl = document.getElementById('loader-progress');

  if (statusEl) statusEl.textContent = status;
  if (percentEl) percentEl.textContent = `${Math.round(percent)}%`;
  if (progressEl) progressEl.style.width = `${percent}%`;
}

function hideLoader() {
  const loader = document.getElementById('loader');
  const app = document.getElementById('app');

  if (loader) {
    loader.style.opacity = '0';
    loader.style.transition = 'opacity 0.5s ease';
    setTimeout(() => {
      loader.style.display = 'none';
    }, 500);
  }
  if (app) {
    app.style.display = '';
    app.style.opacity = '0';
    requestAnimationFrame(() => {
      app.style.transition = 'opacity 0.5s ease';
      app.style.opacity = '1';
    });
  }
}

// ── 階段切換監聽 ──────────────────────────
function setupPhaseListener() {
  Events.on('phase:change', (phase) => {
    const container = document.getElementById('view-phase');
    if (!container) return;

    const renderer = phaseRenderers[phase];
    if (renderer) {
      container.innerHTML = '';
      // 在階段內容前插入返回按鈕
      const backBtn = document.createElement('button');
      backBtn.className = 'back-button';
      backBtn.setAttribute('data-back', 'level-map');
      backBtn.setAttribute('aria-label', '返回關卡地圖');
      backBtn.textContent = '← 返回關卡地圖';
      container.appendChild(backBtn);
      renderer.render(container);
    }
  });
}

// ── 全域返回按鈕監聽 ──────────────────────
function setupBackButtons() {
  document.getElementById('app').addEventListener('click', (e) => {
    const btn = e.target.closest('[data-back]');
    if (!btn) return;

    const target = btn.dataset.back;
    if (target === 'mode-select') {
      State.settings.mode = null;
      State.persist();
      // 清除模式按鈕 active 狀態
      document.querySelectorAll('.mode-button').forEach(b => b.classList.remove('active'));
      Router.showView('view-mode-select');
    } else if (target === 'level-map') {
      Router.showView('view-level-map');
    }
  });
}

// ── 啟動 ──────────────────────────────────
async function boot() {
  try {
    // 載入資源
    await loadResources(updateLoader);

    // 初始化模組
    LevelSystem.init();
    setupPhaseListener();
    setupBackButtons();

    // 隱藏載入畫面
    hideLoader();

    // 開場序列（首次訪問）或直接進入
    const opening = initOpeningSequence();
    if (opening && opening.isFirstVisit()) {
      // 首次訪問：顯示開場，完成後再初始化 ModeManager
      window.addEventListener('opening-complete', () => {
        ModeManager.init();
      }, { once: true });
      opening.start();
    } else {
      // 非首次訪問：直接初始化
      ModeManager.init();
    }

    if (Config.debug) {
      console.log('[SEO Quest] v' + Config.version + ' — Ready');
      console.log('[SEO Quest] State:', State);
    }
  } catch (err) {
    console.error('[SEO Quest] Boot failed:', err);
    updateLoader('載入失敗，請重新整理頁面', 0);
  }
}

// DOM Ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
