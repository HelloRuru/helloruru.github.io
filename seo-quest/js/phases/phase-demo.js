/**
 * SEO Quest — Demo 階段渲染（劇情對話 + 範例）
 */

import { State } from '../core/state.js';
import { Router } from '../core/router.js';

// 角色主題色
const COLORS = {
  io: 'var(--color-primary)',
  blue: '#2C3E50',
  happi: 'var(--color-secondary)',
};

export const PhaseDemo = {
  _dialogueIndex: 0,

  render(container) {
    const data = State.currentLevel?.phases?.demo;
    if (!data) {
      container.innerHTML = `
        <div class="phase-content text-center" style="padding:var(--spacing-3xl);">
          <p class="h3" style="margin-bottom:var(--spacing-md);">載入失敗</p>
          <p class="lead">劇情示範資料尚未準備好，請回到關卡地圖重試。</p>
          <button class="back-button" data-back="level-map" style="margin-top:var(--spacing-lg);">← 返回關卡地圖</button>
        </div>`;
      return;
    }

    this._dialogueIndex = 0;
    const dialogue = data.dialogue || [];

    container.innerHTML = `
      <div class="phase-header">
        <div class="badge badge-secondary" style="margin-bottom:var(--spacing-md);">劇情示範</div>
        <h2 class="phase-title">${data.title}</h2>
      </div>

      <!-- 對話區 -->
      <div class="dialogue-container" id="dialogue-area"></div>

      <!-- 範例區（對話結束後顯示） -->
      <div id="demo-example" style="display:none;"></div>

      <!-- 按鈕 -->
      <div class="phase-footer" style="justify-content:flex-end;">
        <button class="mode-button" id="btn-demo-next"
                style="min-width:auto;max-width:none;padding:var(--spacing-md) var(--spacing-xl);text-align:center;">
          <div class="mode-button-title" style="font-size:var(--font-size-lg);" id="btn-demo-text">下一句 →</div>
        </button>
      </div>
    `;

    // 顯示第一句
    this._showLine(container, dialogue, 0);

    // 按鈕事件
    container.querySelector('#btn-demo-next').addEventListener('click', () => {
      this._dialogueIndex++;
      if (this._dialogueIndex < dialogue.length) {
        this._showLine(container, dialogue, this._dialogueIndex);
      } else {
        this._showExample(container, data);
      }
    });
  },

  _showLine(container, dialogue, index) {
    const area = container.querySelector('#dialogue-area');
    const line = dialogue[index];
    if (!line) return;

    // 查找角色資料
    const charData = State.characters?.[line.speaker] || {};
    const name = charData.name || line.speaker;
    const color = COLORS[line.speaker] || 'var(--color-text-primary)';

    const bubble = document.createElement('div');
    bubble.className = 'dialogue-message';
    bubble.style.opacity = '0';
    bubble.style.transform = 'translateY(10px)';
    bubble.innerHTML = `
      <div class="dialogue-avatar" style="font-size:36px;">${charData.avatar || '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>'}</div>
      <div class="dialogue-bubble">
        <div class="dialogue-speaker" style="color:${color};">${name}</div>
        <div class="dialogue-text">${line.text}</div>
      </div>
    `;
    area.appendChild(bubble);

    // 淡入動畫
    requestAnimationFrame(() => {
      bubble.style.transition = 'all 0.3s ease';
      bubble.style.opacity = '1';
      bubble.style.transform = 'translateY(0)';
    });

    // 捲動到最新
    area.scrollTop = area.scrollHeight;

    // 更新按鈕文字
    const btnText = container.querySelector('#btn-demo-text');
    if (index >= dialogue.length - 1) {
      btnText.textContent = '查看範例 →';
    }
  },

  _showExample(container, data) {
    const example = data.example;
    if (!example) {
      Router.nextPhase();
      return;
    }

    const exampleArea = container.querySelector('#demo-example');
    exampleArea.style.display = '';

    // 範例內容
    let exampleHtml = `
      <div class="phase-content" style="margin-top:var(--spacing-xl);">
        <h3 class="h3" style="margin-bottom:var(--spacing-lg);">範例：${example.topic}</h3>
    `;

    if (example.content) {
      exampleHtml += `<pre style="white-space:pre-wrap;line-height:1.8;">${example.content}</pre>`;
    }

    if (example.analysis) {
      exampleHtml += `
        <div style="margin-top:var(--spacing-lg);padding:var(--spacing-md);background:var(--color-background-alt);border-radius:var(--radius-md);">
          <p class="small" style="margin-bottom:var(--spacing-xs);">字數：${example.analysis.wordCount}</p>
          <p class="small" style="margin:0;">關鍵字密度：${example.analysis.keywordDensity}%</p>
        </div>
      `;
    }

    // 角色點評
    if (example.comments?.length) {
      exampleHtml += '<div style="margin-top:var(--spacing-lg);">';
      example.comments.forEach(c => {
        const charData = State.characters?.[c.speaker] || {};
        const color = COLORS[c.speaker] || 'var(--color-text-primary)';
        exampleHtml += `
          <div class="dialogue-message" style="margin-bottom:var(--spacing-md);">
            <div class="dialogue-avatar" style="font-size:28px;">${charData.avatar || '<svg xmlns="http://www.w3.org/2000/svg" width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>'}</div>
            <div class="dialogue-bubble">
              <div class="dialogue-speaker" style="color:${color};">${charData.name || c.speaker}</div>
              <div class="dialogue-text">${c.text}</div>
            </div>
          </div>
        `;
      });
      exampleHtml += '</div>';
    }

    exampleHtml += '</div>';
    exampleArea.innerHTML = exampleHtml;

    // 更新按鈕
    const btn = container.querySelector('#btn-demo-next');
    const btnText = container.querySelector('#btn-demo-text');
    btnText.textContent = '開始挑戰 →';
    btn.onclick = () => Router.nextPhase();
  },
};
