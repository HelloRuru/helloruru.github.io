/**
 * SEO Quest — Tutorial 階段渲染
 */

import { State } from '../core/state.js';
import { Router } from '../core/router.js';

function esc(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

export const PhaseTutorial = {
  render(container) {
    const data = State.currentLevel?.phases?.tutorial;
    if (!data) {
      container.innerHTML = `
        <div class="phase-content text-center" style="padding:var(--spacing-3xl);">
          <p class="h3" style="margin-bottom:var(--spacing-md);">載入失敗</p>
          <p class="lead">教學資料尚未準備好，請回到關卡地圖重試。</p>
          <button class="back-button" data-back="level-map" style="margin-top:var(--spacing-lg);">← 返回關卡地圖</button>
        </div>`;
      return;
    }

    let contentHtml = '';
    (data.content || []).forEach(item => {
      switch (item.type) {
        case 'text':
          contentHtml += `<p>${esc(item.content)}</p>`;
          break;
        case 'heading': {
          const lvl = [2,3,4].includes(item.level) ? item.level : 3;
          contentHtml += `<h${lvl} class="h${lvl}">${esc(item.content)}</h${lvl}>`;
          break;
        }
        case 'list': {
          const tag = item.style === 'numbered' ? 'ol' : 'ul';
          const cls = item.style === 'numbered' ? 'list-numbered' : 'list-styled';
          contentHtml += `<${tag} class="${cls}">${(item.items || []).map(i => `<li>${esc(i)}</li>`).join('')}</${tag}>`;
          break;
        }
        case 'highlight':
          contentHtml += `<div class="quote-highlight"><p style="margin:0;">${esc(item.content)}</p></div>`;
          break;
        case 'code':
          contentHtml += `<pre><code>${esc(item.content)}</code></pre>`;
          break;
      }
    });

    container.innerHTML = `
      <div class="phase-header">
        <div class="badge badge-primary" style="margin-bottom:var(--spacing-md);">教學</div>
        <h2 class="phase-title">${data.title}</h2>
      </div>
      <div class="phase-content">
        ${contentHtml}
      </div>
      <div class="phase-footer" style="justify-content:flex-end;">
        <button class="mode-button" id="btn-next-phase"
                style="min-width:auto;max-width:none;padding:var(--spacing-md) var(--spacing-xl);text-align:center;">
          <div class="mode-button-title" style="font-size:var(--font-size-lg);">繼續 →</div>
        </button>
      </div>
    `;

    container.querySelector('#btn-next-phase').addEventListener('click', () => Router.nextPhase());
  },
};
