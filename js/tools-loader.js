/**
 * Hello Ruru Lab 首頁工具卡片自動載入器
 * 從 tools-config.json 動態生成所有卡片
 */

// SVG Icon 映射表
const ICONS = {
  'search-check': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="6"/><line x1="16" y1="16" x2="20" y2="20"/><path d="M17 4 L19.5 6.5 L23 2"/></svg>',
  'highlighter': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 11 L4 16 L2 22 L8 20 L13 15"/><path d="m15 5 4 4"/><path d="M19.9 9.9C20.6 9.2 21 8.3 21 7.4 21 5.5 19.5 4 17.6 4 16.7 4 15.8 4.4 15.1 5.1L7 13.1 10.9 17z"/></svg>',
  'wand': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M15 4V2"/><path d="M15 16v-2"/><path d="M8 9h2"/><path d="M20 9h2"/><path d="M17.8 11.8 19 13"/><path d="M15 9h0"/><path d="M17.8 6.2 19 5"/><path d="m3 21 9-9"/><path d="M12.2 6.2 11 5"/></svg>',
  'book': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
  'pen': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>',
  'sun': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  'book-open': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>',
  'sparkles': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275z"/><path d="M5 3v4"/><path d="M19 17v4"/><path d="M3 5h4"/><path d="M17 19h4"/></svg>',
  'layout': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>',
  'palette': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="13.5" cy="6.5" r=".5" fill="currentColor"/><circle cx="17.5" cy="10.5" r=".5" fill="currentColor"/><circle cx="8.5" cy="7.5" r=".5" fill="currentColor"/><circle cx="6.5" cy="12.5" r=".5" fill="currentColor"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"/></svg>',
  'check-circle': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
  'music': '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>'
};

/**
 * 載入並渲染所有工具卡片
 */
async function loadTools() {
  try {
    const response = await fetch('/tools-config.json');
    const config = await response.json();

    const container = document.getElementById('tools-container');
    if (!container) {
      console.error('找不到 #tools-container');
      return;
    }

    // 清空容器
    container.innerHTML = '';

    // 渲染每個 section
    config.sections.forEach(section => {
      const sectionHTML = renderSection(section);
      container.insertAdjacentHTML('beforeend', sectionHTML);
    });

    // 添加淡入動畫（逐個出現）
    const sections = container.querySelectorAll('.section');
    sections.forEach((section, index) => {
      setTimeout(() => {
        section.classList.add('fade-in');
      }, index * 50);
    });

  } catch (error) {
    console.error('載入工具配置失敗:', error);
  }
}

/**
 * 渲染單個 section
 */
function renderSection(section) {
  const toolsHTML = section.tools.map(tool => renderTool(tool)).join('');

  const labelHTML = section.url
    ? `<a href="${section.url}" class="section-label section-label-link" target="_blank" rel="noopener">${section.label}</a>`
    : `<div class="section-label">${section.label}</div>`;

  return `
    <section class="section" data-section-id="${section.id}">
      ${labelHTML}
      <div class="card-grid">
        ${toolsHTML}
      </div>
    </section>
  `;
}

/**
 * 渲染單個工具卡片
 */
function renderTool(tool) {
  const icon = ICONS[tool.icon] || ICONS['wand'];
  const iconColor = tool.iconColor || 'rose';
  const fullWidthClass = tool.fullWidth ? ' card-full' : '';
  const externalAttrs = tool.external ? ' target="_blank" rel="noopener"' : '';

  const badgeHTML = tool.badge
    ? `<span class="card-badge ${tool.badge.type || ''}">${tool.badge.text}</span>`
    : '';

  return `
    <a href="${tool.url}" class="card${fullWidthClass}"${externalAttrs}>
      <div class="card-icon ${iconColor}">
        ${icon}
      </div>
      <div class="card-title">${tool.title}</div>
      <div class="card-desc">${tool.description}</div>
      ${badgeHTML}
    </a>
  `;
}

// DOM 載入完成後執行
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', loadTools);
} else {
  loadTools();
}
