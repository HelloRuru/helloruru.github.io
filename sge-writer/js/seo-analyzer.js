/**
 * SGE 文案助手 - SEO 分析模組（主入口）
 * @module seo-analyzer
 */

import { VIOLATION_WORDS, ALL_VIOLATIONS } from './data/violation-words.js';
import { AITasteAnalyzer } from './analyzers/ai-taste-analyzer.js';
import { SGEStructureAnalyzer } from './analyzers/sge-structure-analyzer.js';
import { AITasteUI } from './ui/ai-taste-ui.js';
import { SGEStructureUI } from './ui/sge-structure-ui.js';

export const analyzer = {
  elements: null,
  keyword: '',
  wordMin: 650,
  wordMax: 700,
  editorElement: null,

  /**
   * 初始化分析器
   */
  init(elements) {
    this.elements = elements;
    this.editorElement = document.getElementById('editor');
  },

  /**
   * 設定目標關鍵字
   */
  setKeyword(keyword) {
    this.keyword = keyword;
  },

  /**
   * 設定字數範圍
   */
  setWordRange(min, max) {
    this.wordMin = min;
    this.wordMax = max;
  },

  /**
   * 執行完整分析
   */
  analyze() {
    if (!this.editorElement) return;

    const content = this.editorElement.innerText || '';
    const html = this.editorElement.innerHTML || '';

    // 分析各項指標
    const h1Result = this.analyzeH1(html);
    const wordCountResult = this.analyzeWordCount(content);
    const keywordResult = this.analyzeKeyword(content);
    const violationResult = this.analyzeViolations(content);
    const toneResult = this.analyzeTone(content);

    // 計算總分
    const score = this.calculateScore({
      h1: h1Result,
      wordCount: wordCountResult,
      keyword: keywordResult,
      violation: violationResult,
      tone: toneResult
    });

    // AI 味指數
    const aiTasteResult = AITasteAnalyzer.calculateScore(content, this.escapeRegex.bind(this));

    // SGE 結構分數
    const sgeStructureResult = SGEStructureAnalyzer.calculateScore(
      html,
      content,
      this.keyword,
      this.analyzeH1.bind(this),
      this.escapeRegex.bind(this)
    );

    // 更新 UI
    this.updateUI({
      score,
      h1: h1Result,
      wordCount: wordCountResult,
      keyword: keywordResult,
      violation: violationResult,
      tone: toneResult
    });

    // 更新 AI 味指數 UI
    AITasteUI.update(this.elements, aiTasteResult);

    // 更新 SGE 結構 UI
    SGEStructureUI.update(this.elements, sgeStructureResult);
  },

  /**
   * 分析 H1 標題
   */
  analyzeH1(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const h1 = doc.querySelector('h1');

    if (!h1) {
      return { count: 0, target: 28, status: 'pending', message: '尚無標題' };
    }

    const text = h1.textContent.trim();
    const count = text.length;
    const target = 28;

    let status = 'pending';
    let message = `${count}/${target}`;

    if (count === target) {
      status = 'success';
      message = `${count}/${target} ✓`;
    } else if (count > target) {
      status = 'error';
      message = `${count}/${target} (超出 ${count - target} 字)`;
    } else {
      status = 'warning';
      message = `${count}/${target} (還需 ${target - count} 字)`;
    }

    return { count, target, status, message };
  },

  /**
   * 分析字數
   */
  analyzeWordCount(content) {
    // 中文字數
    const chineseChars = (content.match(/[\u4e00-\u9fa5]/g) || []).length;
    // 英文單字
    const englishWords = (content.match(/[a-zA-Z]+/g) || []).length;
    // 數字
    const numbers = (content.match(/\d+/g) || []).length;

    const count = chineseChars + englishWords + numbers;
    const { wordMin, wordMax } = this;

    let status = 'pending';
    let message = `${count}/${wordMin}-${wordMax}`;

    if (count >= wordMin && count <= wordMax) {
      status = 'success';
      message = `${count}/${wordMin}-${wordMax} ✓`;
    } else if (count > wordMax) {
      status = 'warning';
      message = `${count}/${wordMin}-${wordMax} (超出)`;
    } else if (count < wordMin && count > 0) {
      status = 'warning';
      message = `${count}/${wordMin}-${wordMax} (不足)`;
    }

    return { count, min: wordMin, max: wordMax, status, message };
  },

  /**
   * 分析關鍵字
   */
  analyzeKeyword(content) {
    if (!this.keyword) {
      return { count: 0, status: 'pending', message: '未設定關鍵字' };
    }

    const regex = new RegExp(this.escapeRegex(this.keyword), 'gi');
    const matches = content.match(regex) || [];
    const count = matches.length;

    // 檢查首段是否包含關鍵字
    const firstParagraph = content.split('\n').filter(p => p.trim())[0] || '';
    const inFirstPara = regex.test(firstParagraph);

    let status = 'pending';
    let message = `出現 ${count} 次`;

    if (count >= 3 && count <= 8 && inFirstPara) {
      status = 'success';
      message = `出現 ${count} 次 ✓`;
    } else if (count > 8) {
      status = 'warning';
      message = `出現 ${count} 次 (過多)`;
    } else if (count > 0 && !inFirstPara) {
      status = 'warning';
      message = `出現 ${count} 次 (首段未出現)`;
    } else if (count === 0) {
      status = 'error';
      message = '未出現';
    }

    return { count, inFirstPara, status, message };
  },

  /**
   * 分析違規詞
   */
  analyzeViolations(content) {
    const foundViolations = [];

    ALL_VIOLATIONS.forEach(word => {
      if (content.includes(word)) {
        foundViolations.push(word);
      }
    });

    const count = foundViolations.length;
    let status = count === 0 ? 'success' : 'error';
    let message = count === 0 ? '無 ✓' : `發現 ${count} 個`;

    return { count, words: foundViolations, status, message };
  },

  /**
   * 分析口語化程度
   */
  analyzeTone(content) {
    // 檢查生硬詞彙
    const stiffWords = VIOLATION_WORDS.stiff;
    const foundStiff = stiffWords.filter(word => content.includes(word));

    // 檢查問句（口語化特徵）
    const questionMarks = (content.match(/？/g) || []).length;

    // 檢查第二人稱（口語化特徵）
    const secondPerson = (content.match(/你|您|妳/g) || []).length;

    let status = 'pending';
    let message = '檢測中';

    if (foundStiff.length === 0 && questionMarks >= 2 && secondPerson >= 2) {
      status = 'success';
      message = '口語化良好 ✓';
    } else if (foundStiff.length > 0) {
      status = 'warning';
      message = '有生硬詞彙';
    } else if (questionMarks < 2) {
      status = 'warning';
      message = '建議加入問句';
    } else {
      status = 'success';
      message = '語氣適中';
    }

    return { stiffWords: foundStiff, questionMarks, secondPerson, status, message };
  },

  /**
   * 計算 SGE 分數
   */
  calculateScore(results) {
    let score = 0;

    // H1 = 28 字 (25 分)
    if (results.h1.status === 'success') {
      score += 25;
    } else if (results.h1.count > 0) {
      // 部分分數
      const diff = Math.abs(results.h1.count - 28);
      score += Math.max(0, 25 - diff * 2);
    }

    // 字數達標 (20 分)
    if (results.wordCount.status === 'success') {
      score += 20;
    } else if (results.wordCount.count > 0) {
      const { count, min, max } = results.wordCount;
      if (count < min) {
        score += Math.floor((count / min) * 15);
      } else if (count > max) {
        score += 15;
      }
    }

    // 關鍵字 (25 分)
    if (results.keyword.status === 'success') {
      score += 25;
    } else if (results.keyword.count > 0) {
      score += Math.min(results.keyword.count * 5, 20);
      if (results.keyword.inFirstPara) {
        score += 5;
      }
    }

    // 無違規詞 (15 分)
    if (results.violation.status === 'success') {
      score += 15;
    } else {
      score += Math.max(0, 15 - results.violation.count * 3);
    }

    // 口語化 (15 分)
    if (results.tone.status === 'success') {
      score += 15;
    } else if (results.tone.status === 'warning') {
      score += 8;
    }

    return Math.min(100, Math.max(0, Math.round(score)));
  },

  /**
   * 更新 UI
   */
  updateUI(data) {
    const { elements } = this;
    if (!elements) return;

    // 更新分數
    elements.sgeScore.textContent = data.score;
    elements.scoreFill.style.width = `${data.score}%`;

    // 更新各項檢查
    elements.h1Count.textContent = data.h1.message;
    elements.wordCount.textContent = data.wordCount.message;
    elements.keywordCount.textContent = data.keyword.message;
    elements.violationCount.textContent = data.violation.message;
    elements.toneStatus.textContent = data.tone.message;

    // 更新檢查圖示
    this.updateCheckIcon('h1', data.h1.status);
    this.updateCheckIcon('wordcount', data.wordCount.status);
    this.updateCheckIcon('keyword', data.keyword.status);
    this.updateCheckIcon('violation', data.violation.status);
    this.updateCheckIcon('tone', data.tone.status);

    // 更新違規詞卡片
    if (data.violation.count > 0) {
      elements.violationCard.style.display = 'block';
      elements.violationList.innerHTML = data.violation.words
        .map(word => `<li>${word}</li>`)
        .join('');
    } else {
      elements.violationCard.style.display = 'none';
    }
  },

  /**
   * 更新檢查圖示
   */
  updateCheckIcon(checkName, status) {
    const item = document.querySelector(`[data-check="${checkName}"]`);
    if (!item) return;

    const icon = item.querySelector('.check-icon');
    icon.className = `check-icon ${status}`;

    // 更新 SVG
    if (status === 'success') {
      icon.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      `;
    } else if (status === 'error') {
      icon.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      `;
    } else if (status === 'warning') {
      icon.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      `;
    } else {
      icon.innerHTML = `
        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      `;
    }
  },

  /**
   * 重置分析器
   */
  reset() {
    this.keyword = '';
    this.wordMin = 650;
    this.wordMax = 700;

    if (this.elements) {
      this.elements.sgeScore.textContent = '0';
      this.elements.scoreFill.style.width = '0%';
      this.elements.h1Count.textContent = '0/28';
      this.elements.wordCount.textContent = '0/650-700';
      this.elements.keywordCount.textContent = '出現 0 次';
      this.elements.violationCount.textContent = '掃描中';
      this.elements.toneStatus.textContent = '檢測中';
      this.elements.violationCard.style.display = 'none';

      // Reset all check icons
      ['h1', 'wordcount', 'keyword', 'violation', 'tone'].forEach(check => {
        this.updateCheckIcon(check, 'pending');
      });
    }
  },

  /**
   * 轉義正則特殊字元
   */
  escapeRegex(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  },

  /**
   * 取得違規詞分類
   */
  getViolationCategories() {
    return VIOLATION_WORDS;
  }
};
