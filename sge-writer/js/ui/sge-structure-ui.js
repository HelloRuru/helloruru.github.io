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

    // 堆砌警示（有懲罰時顯示在權威信號列尾端）
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
