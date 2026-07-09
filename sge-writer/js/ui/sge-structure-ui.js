/**
 * SGE 文案助手 - GEO 引用力 UI 更新器
 * @module ui/sge-structure-ui
 */
export class SGEStructureUI {
  /**
   * 更新 GEO 引用力 UI
   */
  static update(elements, result) {
    if (!elements) return;

    const { score, breakdown } = result;

    // 更新總分和進度條
    elements.sgeStructureScore.textContent = score;
    elements.sgeStructureFill.style.width = `${score}%`;

    // 五大維度
    this.updateItem(elements, 'evidence', breakdown.evidence.status, breakdown.evidence.message);
    this.updateItem(elements, 'structure', breakdown.structure.status, breakdown.structure.message);
    this.updateItem(elements, 'fluency', breakdown.fluency.status, breakdown.fluency.message);
    this.updateItem(elements, 'coverage', breakdown.coverage.status, breakdown.coverage.message);
    this.updateItem(elements, 'authority', breakdown.authority.status, breakdown.authority.message);

    // 更新改善建議（contextual tips）
    const tipsContainer = document.getElementById('geo-tips-container');
    if (tipsContainer) {
      const tips = this.generateTips(breakdown);
      tipsContainer.innerHTML = tips;
    }

    // 堆砌警示（有懲罰時顯示）
    if (breakdown.stuffing && breakdown.stuffing.stuffed) {
      this.updateItem(
        elements,
        'authority',
        'error',
        `關鍵字 ${breakdown.stuffing.count} 次，堆砌懲罰 -9`
      );
    }
  }

  /**
   * 根據各維度分析結果產生改善建議 HTML
   */
  static generateTips(breakdown) {
    // 使用分析器的 getTips 方法產生建議
    const { SGEStructureAnalyzer } = window.__GEO_ANALYZER || {};
    const tipData = SGEStructureAnalyzer
      ? SGEStructureAnalyzer.getTips(breakdown)
      : this.fallbackGetTips(breakdown);

    const keys = Object.keys(tipData);
    if (keys.length === 0) {
      return `<div class="geo-tips-empty">🎉 所有維度表現良好！繼續保持～</div>`;
    }

    const labels = {
      evidence: '📊 證據引用層',
      structure: '🏗️ 結構規範層',
      fluency: '💬 表達流暢層',
      coverage: '🎯 問題覆蓋層',
      authority: '👑 權威信號層'
    };

    let html = `<div class="geo-tips-header" onclick="this.parentElement.classList.toggle('expanded')">
      <span>💡 改善建議（${keys.length} 項）</span>
      <span class="geo-tips-toggle">▼</span>
    </div>
    <div class="geo-tips-body">`;

    for (const key of keys) {
      html += `<div class="geo-tip-group">
        <div class="geo-tip-dimension">${labels[key] || key}</div>`;
      for (const tip of tipData[key]) {
        html += `<div class="geo-tip-item">· ${tip}</div>`;
      }
      html += `</div>`;
    }

    html += `</div>`;
    return html;
  }

  /**
   * 後備建議產生器（當分析器未載入時）
   */
  static fallbackGetTips(breakdown) {
    const tips = {};
    const d = breakdown;
    if (d.evidence && d.evidence.score < 30) {
      tips.evidence = ['試著加入具體數據、來源標註或專家引語來提升證據引用層。'];
    }
    if (d.structure && d.structure.score < 20) {
      tips.structure = ['檢查 H1/H2 結構、加入列點或比較表來改善結構規範。'];
    }
    if (d.fluency && d.fluency.score < 8) {
      tips.fluency = ['加入邏輯過渡詞，保持段落簡短（每段 ≤3 句）。'];
    }
    if (d.coverage && d.coverage.score < 12) {
      tips.coverage = ['用痛點問句當 H2 副標，讓關鍵字自然分散在不同段落。'];
    }
    if (d.authority && d.authority.score < 8) {
      tips.authority = ['加入社會證明（Google 評論、星等）和第一手經驗。'];
    }
    return tips;
  }

  /**
   * 更新單一維度項目
   */
  static updateItem(elements, itemName, status, message) {
    if (!elements) return;

    const key = itemName.charAt(0).toUpperCase() + itemName.slice(1);
    const valueElement = elements[`sge${key}Value`];
    const iconElement = elements[`sge${key}Icon`];

    if (valueElement) {
      valueElement.textContent = message;
    }

    if (iconElement) {
      iconElement.className = `structure-icon ${status}`;
      iconElement.textContent = status === 'success' ? '✓' : status === 'warning' ? '⚠' : status === 'error' ? '✗' : '○';
    }
  }
}
