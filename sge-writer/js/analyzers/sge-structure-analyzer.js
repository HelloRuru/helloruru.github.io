/**
 * SGE 文案助手 - SGE 結構分析器
 * @module analyzers/sge-structure-analyzer
 */

export class SGEStructureAnalyzer {
  /**
   * 分析 H2 問句格式（生活化痛點問句）
   */
  static analyzeH2Questions(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const h2List = Array.from(doc.querySelectorAll('h2'));
    const issues = [];

    h2List.forEach((h2, index) => {
      const text = h2.textContent.trim();
      const questionMarks = (text.match(/？/g) || []).length;

      // 檢查：必須是問句
      if (questionMarks === 0) {
        issues.push(`H2 #${index + 1}「${text}」不是問句`);
      }
      // 檢查：只能有一個問號
      else if (questionMarks > 1) {
        issues.push(`H2 #${index + 1}「${text}」有 ${questionMarks} 個問號（只能 1 個）`);
      }

      // 檢查：是否與生活痛點相關
      const painPointKeywords = /怎麼|如何|為什麼|哪裡|可以|會不會|要不要|值得嗎|好嗎|該|怎樣|什麼/;
      if (questionMarks > 0 && !painPointKeywords.test(text)) {
        issues.push(`H2 #${index + 1}「${text}」建議改為生活化痛點問句`);
      }
    });

    return {
      h2Count: h2List.length,
      issues: issues,
      status: issues.length === 0 ? 'success' : 'warning',
      message: issues.length === 0 ? `${h2List.length} 個 H2 皆符合規範 ✓` : `發現 ${issues.length} 個問題`
    };
  }

  /**
   * 分析關鍵字分散（避免僵硬重複）
   */
  static analyzeKeywordDispersion(content, keyword, escapeRegexFn) {
    if (!keyword) {
      return { status: 'pending', message: '未設定關鍵字' };
    }

    const sentences = content.split(/[。！？]/).filter(s => s.trim().length > 0);

    // 檢查是否有連續僵硬重複
    const rigidPattern = new RegExp(`(${escapeRegexFn(keyword)}.*?){2,}`, 'g');
    const rigidMatches = content.match(rigidPattern) || [];

    // 檢查是否有自然分散（關鍵字前後有其他詞彙）
    const naturalDispersion = sentences.filter(sentence => {
      return sentence.includes(keyword);
    }).length;

    return {
      rigidCount: rigidMatches.length,
      naturalCount: naturalDispersion,
      status: rigidMatches.length === 0 && naturalDispersion >= 3 ? 'success' : 'warning',
      message: rigidMatches.length > 0 ? '關鍵字過於僵硬重複' : '關鍵字分散良好 ✓'
    };
  }

  /**
   * 分析直接回答策略（H2 下方是否有簡短回答）
   */
  static analyzeDirectAnswer(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const h2List = Array.from(doc.querySelectorAll('h2'));
    const issues = [];

    h2List.forEach((h2, index) => {
      const nextElement = h2.nextElementSibling;

      if (!nextElement || nextElement.tagName !== 'P') {
        issues.push(`H2 #${index + 1}「${h2.textContent.trim()}」後缺少段落`);
        return;
      }

      const firstSentence = nextElement.textContent.split(/[。！？]/)[0];
      if (firstSentence.length > 50) {
        issues.push(`H2 #${index + 1} 的第一句過長（${firstSentence.length} 字，建議 <50 字）`);
      }
    });

    return {
      h2Count: h2List.length,
      issues: issues,
      status: issues.length === 0 ? 'success' : 'warning',
      message: issues.length === 0 ? '直接回答策略良好 ✓' : `發現 ${issues.length} 個問題`
    };
  }

  /**
   * 分析資訊增益（表格、地標描述）
   */
  static analyzeInformationGain(html, content) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 檢查是否有表格
    const tables = doc.querySelectorAll('table');
    const hasComparisonTable = Array.from(tables).some(table => {
      const rows = table.querySelectorAll('tr');
      const cols = rows.length > 0 ? rows[0].querySelectorAll('th, td').length : 0;
      return rows.length >= 3 && cols >= 3; // 至少 3×3
    });

    // 檢查是否有地標描述
    const landmarkKeywords = /捷運|MRT|車站|區|路段|巷弄|附近|旁邊|對面|隔壁/;
    const hasLandmark = landmarkKeywords.test(content);

    return {
      hasTable: tables.length > 0,
      tableCount: tables.length,
      hasComparisonTable: hasComparisonTable,
      hasLandmark: hasLandmark,
      status: hasComparisonTable && hasLandmark ? 'success' : 'warning',
      message: `表格 ${tables.length} 個${hasComparisonTable ? ' (含比較表 ✓)' : ''} | 地標描述 ${hasLandmark ? '✓' : '✗'}`
    };
  }

  /**
   * 分析社會證明（評論、評分）
   */
  static analyzeSocialProof(content) {
    const reviewPattern = /⭐{4,5}|評論|評價|推薦|好評|星/;
    const hasReviews = reviewPattern.test(content);

    // 檢查是否有「Google 評論」區塊
    const hasGoogleReviews = /Google.*?評論|評論.*?Google/.test(content);

    // 檢查是否有具體評分
    const ratingPattern = /[4-5]\.[0-9].*?星|★{4,5}|⭐{4,5}/;
    const hasRating = ratingPattern.test(content);

    return {
      hasReviews: hasReviews,
      hasGoogleReviews: hasGoogleReviews,
      hasRating: hasRating,
      status: hasGoogleReviews || hasRating ? 'success' : 'warning',
      message: hasGoogleReviews ? '已包含社會證明 ✓' : '建議加入 Google 評論'
    };
  }

  /**
   * 分析保守語氣（價格描述）
   */
  static analyzeConservativeTone(content) {
    const priceKeywords = ['價格', '費用', '報價', '成本', '收費', '定價'];
    const conservativePhrases = ['視現場評估', '保守估計', '僅供參考', '實際情況為準', '依實際狀況', '以現場為主'];

    const hasPricing = priceKeywords.some(kw => content.includes(kw));
    const hasConservative = conservativePhrases.some(phrase => content.includes(phrase));

    return {
      hasPricing: hasPricing,
      hasConservative: hasConservative,
      status: !hasPricing || hasConservative ? 'success' : 'error',
      message: hasPricing && !hasConservative ? '價格描述缺乏保守語氣 ⚠️' : '語氣適當 ✓'
    };
  }

  /**
   * 綜合 SGE 結構分數（0-100）
   */
  static calculateScore(html, content, keyword, analyzeH1Fn, escapeRegexFn) {
    let score = 0;

    // H1 精確度 (20 分)
    const h1Result = analyzeH1Fn(html);
    if (h1Result.status === 'success') score += 20;
    else if (h1Result.count > 0) score += Math.max(0, 20 - Math.abs(h1Result.count - 28));

    // H2 問句格式 (15 分)
    const h2Result = this.analyzeH2Questions(html);
    if (h2Result.status === 'success') score += 15;
    else if (h2Result.issues.length < 3) score += 10;

    // 直接回答策略 (15 分)
    const directResult = this.analyzeDirectAnswer(html);
    if (directResult.status === 'success') score += 15;
    else if (directResult.issues.length < 3) score += 10;

    // 關鍵字分散 (15 分)
    const keywordResult = this.analyzeKeywordDispersion(content, keyword, escapeRegexFn);
    if (keywordResult.status === 'success') score += 15;
    else if (keywordResult.naturalCount >= 2) score += 10;

    // 資訊增益 (20 分)
    const infoResult = this.analyzeInformationGain(html, content);
    if (infoResult.status === 'success') score += 20;
    else {
      if (infoResult.hasTable) score += 10;
      if (infoResult.hasLandmark) score += 5;
    }

    // 社會證明 (10 分)
    const socialResult = this.analyzeSocialProof(content);
    if (socialResult.status === 'success') score += 10;
    else if (socialResult.hasReviews) score += 5;

    // 保守語氣 (5 分)
    const toneResult = this.analyzeConservativeTone(content);
    if (toneResult.status === 'success') score += 5;

    return {
      score: Math.round(score),
      breakdown: {
        h1: h1Result,
        h2: h2Result,
        directAnswer: directResult,
        keyword: keywordResult,
        information: infoResult,
        social: socialResult,
        tone: toneResult
      }
    };
  }
}
