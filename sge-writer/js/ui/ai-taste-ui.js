/**
 * SGE 文案助手 - AI 味指數 UI 更新器
 * @module ui/ai-taste-ui
 */

import { AITasteAnalyzer } from '../analyzers/ai-taste-analyzer.js';

export class AITasteUI {
  /**
   * 更新 AI 味指數 UI
   */
  static update(elements, result) {
    if (!elements) return;

    const { score, details } = result;
    const levelInfo = AITasteAnalyzer.getScoreLevel(score);

    // 更新分數和進度條
    elements.aiTasteScore.textContent = score;
    elements.aiTasteFill.style.width = `${score}%`;
    elements.aiTasteEmoji.textContent = levelInfo.emoji;
    elements.aiTasteMessage.textContent = levelInfo.message;

    // 更新負面指標列表
    if (elements.aiNegativeList) {
      const negativeItems = [];
      if (details.negative.mainland > 0) {
        negativeItems.push(`中國用語 ${details.negative.mainland} 個`);
      }
      if (details.negative.robotic > 0) {
        negativeItems.push(`機器人後綴 ${details.negative.robotic} 個`);
      }
      if (details.negative.aiJargon > 0) {
        negativeItems.push(`AI 高頻詞 ${details.negative.aiJargon} 個`);
      }
      if (details.negative.stiff > 0) {
        negativeItems.push(`生硬用詞 ${details.negative.stiff} 個`);
      }
      if (details.negative.longSentences > 0) {
        negativeItems.push(`長難句 ${details.negative.longSentences} 句`);
      }
      if (details.negative.clicheOpenings > 0) {
        negativeItems.push(`套話開頭 ${details.negative.clicheOpenings} 個`);
      }

      elements.aiNegativeList.innerHTML = negativeItems.length > 0
        ? negativeItems.map(item => `<li>${item}</li>`).join('')
        : '<li style="color: var(--color-success);">無負面指標 ✓</li>';
    }

    // 更新正面指標列表
    if (elements.aiPositiveList) {
      const positiveItems = [];
      if (details.positive.taiwan > 0) {
        positiveItems.push(`台灣語氣詞 ${details.positive.taiwan} 個`);
      }
      if (details.positive.emotional > 0) {
        positiveItems.push(`情感標記 ${details.positive.emotional} 個`);
      }
      if (details.positive.local > 0) {
        positiveItems.push(`在地脈絡 ${details.positive.local} 個`);
      }
      if (details.positive.humor > 0) {
        positiveItems.push(`幽默標記 ${details.positive.humor} 個`);
      }
      if (details.positive.firstPerson > 0) {
        positiveItems.push(`第一人稱 ${details.positive.firstPerson} 次`);
      }
      if (details.positive.questions > 0) {
        positiveItems.push(`問句 ${details.positive.questions} 個`);
      }
      if (details.positive.exclamations > 0) {
        positiveItems.push(`感嘆句 ${details.positive.exclamations} 個`);
      }

      elements.aiPositiveList.innerHTML = positiveItems.length > 0
        ? positiveItems.map(item => `<li>${item}</li>`).join('')
        : '<li style="color: var(--color-text-muted);">暫無正面指標</li>';
    }
  }
}
