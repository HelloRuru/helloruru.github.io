/**
 * SGE 文案助手 - 支語小警察分析器
 * @module analyzers/zhiyu-analyzer
 *
 * 檢測文案中的大陸用語，回傳台灣替代建議
 */

import { ZHIYU_LOOKUP, ZHIYU_TERMS } from '../data/zhiyu-words.js';

export const ZhiyuAnalyzer = {
  /**
   * 分析文案中的大陸用語
   * @param {string} content - 純文字內容
   * @returns {object} 分析結果
   */
  analyze(content) {
    if (!content || content.trim().length === 0) {
      return {
        totalChecked: 0,
        violations: [],
        status: 'safe',
        message: '尚未輸入文案，等待檢測中...'
      };
    }

    const violations = [];

    for (const term of ZHIYU_TERMS) {
      // 搜尋所有出現位置
      let startIndex = 0;
      let count = 0;
      while (true) {
        const idx = content.indexOf(term, startIndex);
        if (idx === -1) break;
        count++;
        startIndex = idx + term.length;
      }

      if (count > 0) {
        const info = ZHIYU_LOOKUP.get(term);
        violations.push({
          word: term,
          count,
          suggestions: info.taiwan,
          severity: info.severity,
          category: info.category
        });
      }
    }

    // 按嚴重度排序：high 在前
    violations.sort((a, b) => {
      const order = { high: 0, medium: 1 };
      return (order[a.severity] ?? 2) - (order[b.severity] ?? 2);
    });

    // 判斷狀態
    const highCount = violations.filter(v => v.severity === 'high').length;
    const totalViolations = violations.length;
    let status = 'safe';
    let message = '太好了！文案語感很在地，沒有發現大陸用語。';

    if (highCount >= 3 || totalViolations >= 5) {
      status = 'danger';
      message = `偵測到 ${totalViolations} 個大陸用語，建議修正以符合台灣讀者語感。`;
    } else if (totalViolations > 0) {
      status = 'warning';
      message = `發現 ${totalViolations} 個可能的大陸用語，建議檢查看看。`;
    }

    return {
      totalChecked: ZHIYU_TERMS.length,
      violations,
      status,
      message
    };
  }
};
