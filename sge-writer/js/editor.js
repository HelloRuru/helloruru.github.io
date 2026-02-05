/**
 * SGE 文案助手 - 編輯器模組
 * @module editor
 */

export const editor = {
  element: null,
  toolbarButtons: null,

  /**
   * 初始化編輯器
   */
  init(editorElement, toolbarButtons) {
    this.element = editorElement;
    this.toolbarButtons = toolbarButtons;

    // Toolbar event listeners
    toolbarButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const format = btn.dataset.format;
        this.applyFormat(format);
      });
    });

    // Keyboard shortcuts
    this.element.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 'b':
            e.preventDefault();
            this.applyFormat('bold');
            break;
          case '1':
            e.preventDefault();
            this.applyFormat('h1');
            break;
          case '2':
            e.preventDefault();
            this.applyFormat('h2');
            break;
          case '3':
            e.preventDefault();
            this.applyFormat('h3');
            break;
        }
      }
    });
  },

  /**
   * 套用格式
   */
  applyFormat(format) {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    switch (format) {
      case 'h1':
        document.execCommand('formatBlock', false, 'h1');
        break;
      case 'h2':
        document.execCommand('formatBlock', false, 'h2');
        break;
      case 'h3':
        document.execCommand('formatBlock', false, 'h3');
        break;
      case 'bold':
        document.execCommand('bold', false, null);
        break;
      case 'highlight':
        this.wrapSelection('span', 'keyword-highlight');
        break;
      case 'table':
        this.insertTable();
        break;
    }

    this.element.focus();
  },

  /**
   * 用指定標籤包裹選取文字
   */
  wrapSelection(tagName, className) {
    const selection = window.getSelection();
    if (!selection.rangeCount || selection.isCollapsed) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();

    if (!selectedText) return;

    const wrapper = document.createElement(tagName);
    if (className) {
      wrapper.className = className;
    }

    range.surroundContents(wrapper);
    selection.removeAllRanges();
  },

  /**
   * 插入表格
   */
  insertTable() {
    const tableHTML = `
<table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
  <thead>
    <tr style="background: #f5f5f5;">
      <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">項目</th>
      <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">方案 A</th>
      <th style="padding: 12px; border: 1px solid #ddd; text-align: left;">方案 B</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td style="padding: 12px; border: 1px solid #ddd;">規格</td>
      <td style="padding: 12px; border: 1px solid #ddd;">-</td>
      <td style="padding: 12px; border: 1px solid #ddd;">-</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #ddd;">價格</td>
      <td style="padding: 12px; border: 1px solid #ddd;">-</td>
      <td style="padding: 12px; border: 1px solid #ddd;">-</td>
    </tr>
    <tr>
      <td style="padding: 12px; border: 1px solid #ddd;">特色</td>
      <td style="padding: 12px; border: 1px solid #ddd;">-</td>
      <td style="padding: 12px; border: 1px solid #ddd;">-</td>
    </tr>
  </tbody>
</table>
`;

    document.execCommand('insertHTML', false, tableHTML);
  },

  /**
   * 設定編輯器內容
   */
  setContent(html) {
    this.element.innerHTML = html;
  },

  /**
   * 取得編輯器內容（HTML）
   */
  getContent() {
    return this.element.innerHTML;
  },

  /**
   * 取得純文字內容
   */
  getPlainText() {
    return this.element.innerText || this.element.textContent;
  },

  /**
   * 清空編輯器
   */
  clear() {
    this.element.innerHTML = '';
  },

  /**
   * 取得 H1 標題
   */
  getH1() {
    const h1 = this.element.querySelector('h1');
    return h1 ? h1.textContent : '';
  },

  /**
   * 取得所有 H2 標題
   */
  getH2s() {
    const h2s = this.element.querySelectorAll('h2');
    return Array.from(h2s).map(h2 => h2.textContent);
  },

  /**
   * 取得字數統計
   */
  getWordCount() {
    const text = this.getPlainText();
    // 中文字數計算
    const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 英文單字計算
    const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
    // 數字計算
    const numbers = (text.match(/\d+/g) || []).length;

    return chineseChars + englishWords + numbers;
  },

  /**
   * 標記關鍵字
   */
  highlightKeyword(keyword) {
    if (!keyword) return;

    const content = this.element.innerHTML;
    const regex = new RegExp(`(${this.escapeRegex(keyword)})`, 'gi');

    // 先移除現有標記
    const cleaned = content.replace(/<span class="keyword-highlight">([^<]+)<\/span>/g, '$1');

    // 重新標記（避免標記 HTML 標籤內的文字）
    const highlighted = cleaned.replace(regex, '<span class="keyword-highlight">$1</span>');

    this.element.innerHTML = highlighted;
  },

  /**
   * 標記違規詞
   */
  highlightViolations(violations) {
    if (!violations || violations.length === 0) return;

    let content = this.element.innerHTML;

    // 先移除現有違規標記
    content = content.replace(/<span class="violation-highlight">([^<]+)<\/span>/g, '$1');

    // 標記違規詞
    violations.forEach(word => {
      const regex = new RegExp(`(${this.escapeRegex(word)})`, 'gi');
      content = content.replace(regex, '<span class="violation-highlight">$1</span>');
    });

    this.element.innerHTML = content;
  },

  /**
   * 轉義正則表達式特殊字元
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * 複製到剪貼簿（保留格式）
   */
  async copyFormatted() {
    try {
      const html = this.getContent();
      const text = this.getPlainText();

      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' })
        })
      ]);

      return true;
    } catch (err) {
      // Fallback to plain text
      try {
        await navigator.clipboard.writeText(this.getPlainText());
        return true;
      } catch (e) {
        console.error('複製失敗:', e);
        return false;
      }
    }
  }
};
