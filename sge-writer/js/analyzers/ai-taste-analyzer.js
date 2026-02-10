/**
 * SGE 文案助手 - AI 味檢測分析器
 * @module analyzers/ai-taste-analyzer
 */

import { VIOLATION_WORDS } from '../data/violation-words.js';
import { POSITIVE_MARKERS } from '../data/positive-markers.js';

export class AITasteAnalyzer {
  /**
   * 計算 AI 味指數（0-100，越低越人性化）
   */
  static calculateScore(content, escapeRegexFn) {
    let score = 50; // 基礎分

    // === 負面指標（加分，越高越 AI）===

    // 1. 詞彙層級 (+30 上限)
    const mainlandCount = this.countOccurrences(content, VIOLATION_WORDS.mainland, escapeRegexFn);
    const roboticCount = this.countOccurrences(content, VIOLATION_WORDS.roboticSuffix, escapeRegexFn);
    const aiJargonCount = this.countOccurrences(content, VIOLATION_WORDS.aiJargon, escapeRegexFn);
    const stiffCount = this.countOccurrences(content, VIOLATION_WORDS.stiff, escapeRegexFn);

    score += Math.min(30,
      mainlandCount * 5 +
      roboticCount * 3 +
      aiJargonCount * 2 +
      stiffCount * 4
    );

    // 2. 句式結構 (+25 上限)
    const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0);
    const longSentences = sentences.filter(s => s.length > 30).length;
    const clicheOpenings = this.countOccurrences(content, [
      '在當今社會', '隨著科技發展', '隨著時代進步', '近年來'
    ], escapeRegexFn);

    score += Math.min(25,
      longSentences * 3 +
      clicheOpenings * 5
    );

    // 3. 情感溫度 (+15 上限)
    const hasFirstPerson = /我|我們/.test(content);
    const questionCount = (content.match(/？/g) || []).length;
    const exclamationCount = (content.match(/！/g) || []).length;

    if (!hasFirstPerson) score += 5;
    if (questionCount < 2) score += 5;
    if (exclamationCount === 0) score += 3;

    // === 正面指標（減分，越高越人性化）===

    // 1. 台灣在地化 (-30 上限)
    const taiwanCount = this.countOccurrences(content, POSITIVE_MARKERS.taiwanParticles, escapeRegexFn);
    const emotionalCount = this.countOccurrences(content, POSITIVE_MARKERS.emotionalMarkers, escapeRegexFn);
    const localCount = this.countOccurrences(content, POSITIVE_MARKERS.localContext, escapeRegexFn);
    const humorCount = this.countOccurrences(content, POSITIVE_MARKERS.humor, escapeRegexFn);

    score -= Math.min(30,
      taiwanCount * 3 +
      emotionalCount * 2 +
      localCount * 4 +
      humorCount * 5
    );

    // 2. 人性化特徵 (-25 上限)
    const firstPersonCount = (content.match(/我|我們/g) || []).length;

    score -= Math.min(25,
      firstPersonCount * 2 +
      questionCount * 3 +
      exclamationCount * 2
    );

    // 3. 句子節奏 (-15 上限)
    const variance = this.calculateSentenceVariance(sentences);
    if (variance > 8) score -= 10;

    const shortSentences = sentences.filter(s => s.length < 10).length;
    const shortRatio = sentences.length > 0 ? shortSentences / sentences.length : 0;
    if (shortRatio > 0.2) score -= 5;

    // 確保分數在 0-100 之間
    return {
      score: Math.max(0, Math.min(100, Math.round(score))),
      details: {
        negative: {
          mainland: mainlandCount,
          robotic: roboticCount,
          aiJargon: aiJargonCount,
          stiff: stiffCount,
          longSentences: longSentences,
          clicheOpenings: clicheOpenings
        },
        positive: {
          taiwan: taiwanCount,
          emotional: emotionalCount,
          local: localCount,
          humor: humorCount,
          firstPerson: firstPersonCount,
          questions: questionCount,
          exclamations: exclamationCount
        },
        sentenceStats: {
          total: sentences.length,
          variance: variance,
          shortRatio: Math.round(shortRatio * 100)
        }
      }
    };
  }

  /**
   * 計算詞彙出現次數
   */
  static countOccurrences(content, wordList, escapeRegexFn) {
    let count = 0;
    wordList.forEach(word => {
      const regex = new RegExp(escapeRegexFn(word), 'g');
      const matches = content.match(regex);
      if (matches) count += matches.length;
    });
    return count;
  }

  /**
   * 計算句子長度變異度（標準差）
   */
  static calculateSentenceVariance(sentences) {
    if (sentences.length === 0) return 0;

    const lengths = sentences.map(s => s.length);
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const variance = lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) / lengths.length;
    return Math.sqrt(variance);
  }

  /**
   * 取得 AI 味等級描述
   */
  static getScoreLevel(score) {
    if (score <= 20) {
      return { level: '極度人性化', color: 'green', emoji: '🟢', message: '完全看不出 AI 痕跡，像真人寫的' };
    } else if (score <= 40) {
      return { level: '自然流暢', color: 'yellow', emoji: '🟡', message: '有人味，但可能有少量 AI 痕跡' };
    } else if (score <= 60) {
      return { level: '中性', color: 'orange', emoji: '🟠', message: 'AI 與人類特徵參半' };
    } else if (score <= 80) {
      return { level: 'AI 味明顯', color: 'red', emoji: '🔴', message: '明顯的 AI 寫作特徵' };
    } else {
      return { level: '機器生成', color: 'black', emoji: '⚫', message: '幾乎確定是 AI 生成' };
    }
  }
}
