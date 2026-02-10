/**
 * SGE 文案助手 - 支語小警察 UI 更新
 * @module ui/zhiyu-ui
 *
 * 更新支語小警察卡片的所有 UI 元素
 */

/** BLUE 的立繪對應表 */
const BLUE_PORTRAITS = {
  safe: 'icons/characters/player-happy-1.png',
  warning: 'icons/characters/player-default-2.png',
  danger: 'icons/characters/player-angry-1.png',
  idle: 'icons/characters/player-default-1.png',
};

export const ZhiyuUI = {
  /** 快取 DOM 元素 */
  _elements: null,

  /** 取得 DOM 元素（懶初始化） */
  getElements() {
    if (!this._elements) {
      this._elements = {
        card: document.getElementById('zhiyu-police-card'),
        status: document.getElementById('zhiyu-status'),
        dialogText: document.getElementById('zhiyu-dialog-text'),
        avatarImg: document.getElementById('zhiyu-avatar-img'),
        resultIcon: document.querySelector('.zhiyu-police-result-icon'),
        resultText: document.getElementById('zhiyu-result-text'),
        violationsList: document.getElementById('zhiyu-violations'),
        totalStat: document.getElementById('zhiyu-total'),
        violationsCount: document.getElementById('zhiyu-violations-count'),
      };
    }
    return this._elements;
  },

  /**
   * 更新支語小警察 UI
   * @param {object} result - ZhiyuAnalyzer.analyze() 的結果
   */
  update(result) {
    const el = this.getElements();
    if (!el.card) return;

    // 更新狀態徽章
    el.status.className = `zhiyu-police-status ${result.status}`;
    const statusLabels = { safe: '安全', warning: '注意', danger: '警告' };
    el.status.textContent = statusLabels[result.status] || '安全';

    // 更新 BLUE 立繪（根據檢測結果切換表情）
    if (el.avatarImg) {
      const portrait = result.totalChecked === 0
        ? BLUE_PORTRAITS.idle
        : BLUE_PORTRAITS[result.status] || BLUE_PORTRAITS.idle;
      el.avatarImg.src = portrait;
    }

    // 更新 GBA 對話文字
    el.dialogText.textContent = this._getDialogText(result);

    // 更新結果區
    const resultIcons = { safe: '✅', warning: '⚠️', danger: '🚨' };
    el.resultIcon.textContent = resultIcons[result.status] || '✅';
    el.resultText.textContent = result.message;

    // 更新違規列表
    this._renderViolations(el.violationsList, result.violations);

    // 更新統計
    el.totalStat.textContent = result.totalChecked;
    el.violationsCount.textContent = result.violations.length;
  },

  /**
   * 根據結果產生對話文字
   * @private
   */
  _getDialogText(result) {
    if (result.totalChecked === 0) {
      return '哈囉！我會幫你檢查文案中有沒有大陸用語，讓內容更符合台灣讀者的語感～';
    }

    if (result.status === 'safe') {
      const safeLines = [
        '報告！全文掃描完畢，沒有偵測到任何大陸用語。語感非常道地，台灣讀者讀起來會很親切！',
        '嗶嗶——安全通過！這篇文案的用詞完全是台灣本土風格，寫得很自然呢。',
        '巡邏完畢～零違規！你的語感很在地，繼續保持這種寫作風格吧。',
        '全區域清查完成，語感指數：滿分。這就是道地的台灣味！',
      ];
      return safeLines[Math.floor(Math.random() * safeLines.length)];
    }

    if (result.status === 'warning') {
      const warningLines = [
        '嗯......偵測到幾個可疑用詞。不一定是錯的，但台灣讀者可能會覺得「哪裡怪怪的」，幫你標出來了。',
        '注意！有幾個詞的語感偏向對岸用法，建議微調一下，讓文章讀起來更親切。',
        '小心～這幾個詞在台灣比較少人這樣講，換個說法會更自然喔。',
      ];
      return warningLines[Math.floor(Math.random() * warningLines.length)];
    }

    // danger
    const dangerLines = [
      '警報！這篇文案的大陸用語有點多......台灣讀者可能會直接跳出去。建議逐一修正，我把建議都列在下面了。',
      '緊急通報！偵測到大量對岸用語，語感已經偏離台灣讀者的習慣了。快看看下方的修正建議吧！',
      '紅色警戒！這些用詞在台灣會讓人覺得「這不是台灣人寫的」，趕快調整一下吧。',
    ];
    return dangerLines[Math.floor(Math.random() * dangerLines.length)];
  },

  /**
   * 渲染違規項目列表
   * @private
   */
  _renderViolations(container, violations) {
    if (violations.length === 0) {
      container.style.display = 'none';
      container.innerHTML = '';
      return;
    }

    container.style.display = 'block';
    container.innerHTML = violations.map(v => `
      <li class="zhiyu-violation-item">
        <span class="zhiyu-violation-marker ${v.severity === 'high' ? 'critical' : 'normal'}">!</span>
        <div class="zhiyu-violation-content">
          <div class="zhiyu-violation-word">${this._escapeHTML(v.word)}${v.count > 1 ? ` (×${v.count})` : ''}</div>
          <div class="zhiyu-violation-suggestion">建議改為：${v.suggestions.map(s => `<strong>${this._escapeHTML(s)}</strong>`).join(' 或 ')}</div>
        </div>
      </li>
    `).join('');
  },

  /** HTML 轉義 @private */
  _escapeHTML(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
};
