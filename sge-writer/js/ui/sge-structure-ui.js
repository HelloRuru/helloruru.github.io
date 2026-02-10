/**
 * SGE 文案助手 - SGE 結構 UI 更新器
 * @module ui/sge-structure-ui
 */

export class SGEStructureUI {
  /**
   * 更新 SGE 結構 UI
   */
  static update(elements, result) {
    if (!elements) return;

    const { score, breakdown } = result;

    // 更新總分和進度條
    elements.sgeStructureScore.textContent = score;
    elements.sgeStructureFill.style.width = `${score}%`;

    // 更新 H2 問句
    this.updateItem(
      elements,
      'h2',
      breakdown.h2.status,
      breakdown.h2.message
    );

    // 更新直接回答
    this.updateItem(
      elements,
      'direct',
      breakdown.directAnswer.status,
      breakdown.directAnswer.message
    );

    // 更新資訊增益
    this.updateItem(
      elements,
      'info',
      breakdown.information.status,
      breakdown.information.message
    );

    // 更新社會證明
    this.updateItem(
      elements,
      'social',
      breakdown.social.status,
      breakdown.social.message
    );
  }

  /**
   * 更新 SGE 結構項目
   */
  static updateItem(elements, itemName, status, message) {
    if (!elements) return;

    const valueElement = elements[`sge${itemName.charAt(0).toUpperCase() + itemName.slice(1)}Value`];
    const iconElement = elements[`sge${itemName.charAt(0).toUpperCase() + itemName.slice(1)}Icon`];

    if (valueElement) {
      valueElement.textContent = message;
    }

    if (iconElement) {
      iconElement.className = `structure-icon ${status}`;
      iconElement.textContent = status === 'success' ? '✓' : status === 'warning' ? '⚠' : status === 'error' ? '✗' : '○';
    }
  }
}
