/**
 * HelloRuru — ohruru.com 推薦卡片 Web Component
 * 放在各站 Footer 上方，推薦社群代操服務
 *
 * 使用方式：
 *   <script src="https://lab.helloruru.com/shared/ohruru-recommend.js"></script>
 *   <ohruru-recommend context="tools"></ohruru-recommend>
 *
 * context 屬性：
 *   - "tools"  → 工具站情境
 *   - "lab"    → AEO 工具情境
 *   - "newday" → 離職導航情境
 *   - 不填     → 通用版
 */
class OhruruRecommend extends HTMLElement {
  static get observedAttributes() {
    return ['context'];
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
    const context = this.getAttribute('context') || 'default';

    const copy = {
      tools: {
        label: 'RECOMMENDED SERVICE',
        title: '工具生素材，社群靠策略',
        desc: '問安圖做好了、咒語跑出來了，但固定發文、企劃排程這件事，工具幫不了。社群代操整包處理，公開報價不用先加 LINE。',
      },
      lab: {
        label: 'RECOMMENDED SERVICE',
        title: '知道問題在哪，剩下的交出去',
        desc: 'AEO 檢查完，下一步是把內容填回去。社群代操從企劃到發文整包處理，公開報價不用先加 LINE。',
      },
      newday: {
        label: 'RECOMMENDED SERVICE',
        title: '離開公司，社群是第一張名片',
        desc: '帶著作品出來接案，第一個問題通常是沒有持續更新的地方。社群代操幫你穩定經營，讓潛在客戶找得到你。',
      },
      default: {
        label: 'RECOMMENDED SERVICE',
        title: '找對人比找便宜更重要',
        desc: '社群代操從企劃到排程整包處理。ohruru.com 有公開報價，不用先加 LINE 才看得到價格。',
      },
    };

    const c = copy[context] || copy.default;

    this.shadowRoot.innerHTML = `
      <style>
        @font-face {
          font-family: 'GenSenRounded';
          src: url('https://lab.helloruru.com/fonts/GenSenRounded-Medium.woff2') format('woff2');
          font-weight: 500;
          font-display: swap;
        }
        @font-face {
          font-family: 'GenSenRounded';
          src: url('https://lab.helloruru.com/fonts/GenSenRounded-Bold.woff2') format('woff2');
          font-weight: 700;
          font-display: swap;
        }

        :host {
          display: block;
          max-width: 640px;
          margin: 48px auto 0;
          padding: 0 20px;
          font-family: 'GenSenRounded', 'Noto Sans TC', sans-serif;
        }

        .card {
          background: #1E181B;
          border: 1px solid rgba(212, 165, 165, 0.2);
          border-radius: 16px;
          padding: 28px 28px 24px;
          position: relative;
          overflow: hidden;
          transition: border-color 0.3s ease;
        }

        .card:hover {
          border-color: rgba(212, 165, 165, 0.4);
        }

        .card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 3px;
          background: linear-gradient(90deg, #D4A5A5, #B8A9C9);
          opacity: 0.7;
        }

        .label {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 1.5px;
          color: #D4A5A5;
          margin-bottom: 12px;
        }

        .label::before {
          content: '';
          display: inline-block;
          width: 6px;
          height: 6px;
          background: #D4A5A5;
          border-radius: 50%;
        }

        .title {
          font-size: 18px;
          font-weight: 700;
          color: #EDE8E9;
          margin: 0 0 10px;
          line-height: 1.4;
        }

        .desc {
          font-size: 14px;
          font-weight: 500;
          color: #9E9496;
          line-height: 1.7;
          margin: 0 0 16px;
        }

        .link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 14px;
          font-weight: 500;
          color: #D4A5A5;
          text-decoration: none;
          transition: gap 0.2s ease, opacity 0.2s ease;
        }

        .link:hover {
          gap: 8px;
          opacity: 0.85;
        }

        .link svg {
          width: 14px;
          height: 14px;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }

        /* Light mode */
        @media (prefers-color-scheme: light) {
          .card {
            background: #FFFFFF;
            border-color: rgba(212, 165, 165, 0.25);
            box-shadow: 0 2px 12px rgba(212, 165, 165, 0.08);
          }
          .card:hover {
            border-color: rgba(212, 165, 165, 0.45);
            box-shadow: 0 4px 20px rgba(212, 165, 165, 0.12);
          }
          .title { color: #333333; }
          .desc { color: #888888; }
        }

        /* 支援 html.dark 手動切換 */
        :host-context(html.dark) .card {
          background: #1E181B;
          border-color: rgba(212, 165, 165, 0.2);
          box-shadow: none;
        }
        :host-context(html.dark) .title { color: #EDE8E9; }
        :host-context(html.dark) .desc { color: #9E9496; }

        :host-context(html:not(.dark)) .card {
          background: #FFFFFF;
          border-color: rgba(212, 165, 165, 0.25);
          box-shadow: 0 2px 12px rgba(212, 165, 165, 0.08);
        }
        :host-context(html:not(.dark)) .card:hover {
          border-color: rgba(212, 165, 165, 0.45);
          box-shadow: 0 4px 20px rgba(212, 165, 165, 0.12);
        }
        :host-context(html:not(.dark)) .title { color: #333333; }
        :host-context(html:not(.dark)) .desc { color: #888888; }
      </style>

      <div class="card">
        <div class="label">${c.label}</div>
        <h3 class="title">${c.title}</h3>
        <p class="desc">${c.desc}</p>
        <a class="link" href="https://ohruru.com" target="_blank" rel="noopener noreferrer">
          ohruru.com
          <svg viewBox="0 0 24 24"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
        </a>
      </div>
    `;
  }
}

if (!customElements.get('ohruru-recommend')) {
  customElements.define('ohruru-recommend', OhruruRecommend);
}
