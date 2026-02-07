/**
 * Hello Ruru — Brand Header Web Component
 * Design System v1.6
 *
 * 使用方式：
 *   <script src="https://lab.helloruru.com/shared/brand-header.js"></script>
 *   <hello-ruru-header title="網站標題"></hello-ruru-header>
 */
class HelloRuruHeader extends HTMLElement {
  static get observedAttributes() {
    return ['title', 'href'];
  }

  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback() {
    this.render();
  }

  render() {
    const siteTitle = this.getAttribute('title') || '';
    const brandHref = this.getAttribute('href') || 'https://lab.helloruru.com';

    this.shadowRoot.innerHTML = `
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');

        :host {
          display: block;
          font-family: 'GenSenRounded', 'Noto Sans TC', sans-serif;
        }

        .header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px 6px;
        }

        .brand-link {
          display: flex;
          align-items: center;
          gap: 6px;
          text-decoration: none;
          opacity: 0.6;
          transition: opacity 0.2s;
        }

        .brand-link:hover {
          opacity: 0.9;
        }

        .brand-text {
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 2px;
          background: linear-gradient(135deg, #D4A5A5, #B8A9C9);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .divider {
          color: #D1D5DB;
          font-size: 14px;
          user-select: none;
        }

        .site-title {
          font-size: 12px;
          color: #9CA3AF;
          letter-spacing: 0.5px;
        }

        .flower {
          width: 24px;
          height: 24px;
          flex-shrink: 0;
        }

        /* 沒有 title 時隱藏分隔線 */
        .divider:empty, .site-title:empty {
          display: none;
        }
      </style>

      <header class="header">
        <a class="brand-link" href="${brandHref}" target="_blank" rel="noopener noreferrer">
          <svg class="flower" viewBox="0 0 64 64" fill="none">
            <ellipse cx="32" cy="24" rx="4" ry="7" fill="#D4A5A5" opacity="0.6" transform="rotate(0 32 32)"/>
            <ellipse cx="32" cy="24" rx="4" ry="7" fill="#B8A9C9" opacity="0.5" transform="rotate(60 32 32)"/>
            <ellipse cx="32" cy="24" rx="4" ry="7" fill="#E8B4B8" opacity="0.5" transform="rotate(120 32 32)"/>
            <ellipse cx="32" cy="24" rx="4" ry="7" fill="#C4B7D7" opacity="0.5" transform="rotate(180 32 32)"/>
            <ellipse cx="32" cy="24" rx="4" ry="7" fill="#F5D0C5" opacity="0.5" transform="rotate(240 32 32)"/>
            <ellipse cx="32" cy="24" rx="4" ry="7" fill="#FEDFE1" opacity="0.5" transform="rotate(300 32 32)"/>
            <circle cx="32" cy="32" r="4" fill="#D4A5A5" opacity="0.8"/>
          </svg>
          <span class="brand-text">Hello Ruru</span>
        </a>
        ${siteTitle ? `<span class="divider">|</span><span class="site-title">${siteTitle}</span>` : ''}
      </header>
    `;
  }
}

customElements.define('hello-ruru-header', HelloRuruHeader);
