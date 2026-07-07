/**
 * SGE 文案助手 - GEO 引用力分析器
 * @module analyzers/sge-structure-analyzer
 *
 * 依 GEO（生成式引擎最佳化）12 維度重新配分，取前端可偵測的部分：
 * - 證據引用層 40 分（統計數據 15 + 來源標註 15 + 權威引語 10）— AI 引用靠證據不靠形容詞
 * - 結構規範層 25 分（H1 唯一 4 + H2 數量 6 + 列點 5 + 表格 5 + 倒金字塔 5）
 * - 表達流暢層 10 分（過渡詞 5 + 段落短句 5）
 * - 問題覆蓋層 15 分（H2 痛點問句 8 + 關鍵字自然分散 7）
 * - 權威信號層 10 分（社會證明 5 + 第一手經驗 5）
 * - 風險控制：關鍵字堆砌 -9（AI 對堆砌有懲罰）
 */

export class SGEStructureAnalyzer {
  /**
   * 證據引用層（40 分）— 統計數據、來源標註、權威引語
   */
  static analyzeEvidence(html, content) {
    // 統計數據：數字 + 單位/量詞（%、成、倍、元、年、分鐘、人、家、次）
    const statPattern = /\d+(?:\.\d+)?\s*(?:%|％|成|倍|元|萬|億|年|個月|週|天|小時|分鐘|人|家|次|坪|度)/g;
    const statMatches = content.match(statPattern) || [];
    const statCount = statMatches.length;

    // 來源標註：根據/依據/資料來源/研究/報告/官方 + 主詞
    const sourcePattern = /(?:根據|依據|依|引用|出自|來自)[^，。！？]{2,20}(?:數據|資料|研究|報告|統計|調查|公告|官網|指南)|資料來源|研究(?:顯示|指出|發現)|報告(?:顯示|指出)|官方(?:數據|統計|公告)/;
    const hasSource = sourcePattern.test(content);
    const hasLink = /<a\s[^>]*href=/i.test(html);

    // 權威引語：引號段落 + 掛銜動詞（表示/指出/分享/說）
    const quotePattern = /(?:[^，。]{2,15}(?:表示|指出|分享|提到|強調|說)[：:，]?\s*[「『])|(?:[「『][^」』]{6,}[」』][^，。]{0,10}(?:表示|指出|說))/;
    const hasQuote = quotePattern.test(content);

    let score = 0;
    if (statCount >= 2) score += 15;
    else if (statCount === 1) score += 8;
    if (hasSource) score += hasLink ? 15 : 10;
    if (hasQuote) score += 10;

    const parts = [
      `數據 ${statCount >= 2 ? '✓' : statCount === 1 ? '1筆' : '✗'}`,
      `來源 ${hasSource ? (hasLink ? '✓+連結' : '✓') : '✗'}`,
      `引語 ${hasQuote ? '✓' : '✗'}`
    ];

    return {
      score,
      max: 40,
      statCount,
      hasSource,
      hasLink,
      hasQuote,
      status: score >= 30 ? 'success' : score >= 15 ? 'warning' : 'error',
      message: parts.join(' | ')
    };
  }

  /**
   * 結構規範層（25 分）— H1 唯一、H2 分層、列點、表格、倒金字塔
   */
  static analyzeStructure(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const h1Count = doc.querySelectorAll('h1').length;
    const h2Count = doc.querySelectorAll('h2').length;

    // 列點：ul/ol 內至少 3 個項目（AI 可摘取結構 +30-40% 可見度）
    const lists = Array.from(doc.querySelectorAll('ul, ol'));
    const hasList = lists.some(list => list.querySelectorAll('li').length >= 3);

    // 表格：至少 3×3 的比較表
    const tables = Array.from(doc.querySelectorAll('table'));
    const hasComparisonTable = tables.some(table => {
      const rows = table.querySelectorAll('tr');
      const cols = rows.length > 0 ? rows[0].querySelectorAll('th, td').length : 0;
      return rows.length >= 3 && cols >= 3;
    });

    // 倒金字塔：每個 H2 後第一段的第一句 ≤50 字（答案先講）
    const directResult = this.analyzeDirectAnswer(html);
    const hasDirectAnswer = h2Count > 0 && directResult.issues.length === 0;

    let score = 0;
    if (h1Count === 1) score += 4;
    if (h2Count >= 2) score += 6;
    if (hasList) score += 5;
    if (hasComparisonTable) score += 5;
    if (hasDirectAnswer) score += 5;

    const parts = [
      `H1 ${h1Count === 1 ? '✓' : h1Count === 0 ? '✗' : `${h1Count}個`}`,
      `H2 ${h2Count >= 2 ? '✓' : `${h2Count}個`}`,
      `列點 ${hasList ? '✓' : '✗'}`,
      `表格 ${hasComparisonTable ? '✓' : '✗'}`,
      `答案先講 ${hasDirectAnswer ? '✓' : '✗'}`
    ];

    return {
      score,
      max: 25,
      h1Count,
      h2Count,
      hasList,
      hasComparisonTable,
      hasDirectAnswer,
      directIssues: directResult.issues,
      status: score >= 20 ? 'success' : score >= 10 ? 'warning' : 'error',
      message: parts.join(' | ')
    };
  }

  /**
   * 表達流暢層（10 分）— 邏輯過渡詞、段落短句
   */
  static analyzeFluency(html, content) {
    // 過渡詞種類（邏輯過渡讓 AI 讀懂脈絡）
    const transitions = ['不過', '因此', '所以', '換句話說', '舉例來說', '例如', '首先', '接著', '再來', '最後', '另外', '此外', '相較之下', '也就是說'];
    const usedTransitions = transitions.filter(t => content.includes(t));

    // 段落短句比例：每段 ≤3 句的段落佔比 ≥70%
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const paragraphs = Array.from(doc.querySelectorAll('p')).filter(p => p.textContent.trim().length > 0);
    const shortParagraphs = paragraphs.filter(p => {
      const sentences = p.textContent.split(/[。！？]/).filter(s => s.trim().length > 0);
      return sentences.length <= 3;
    });
    const shortRatio = paragraphs.length > 0 ? shortParagraphs.length / paragraphs.length : 0;

    let score = 0;
    if (usedTransitions.length >= 3) score += 5;
    else if (usedTransitions.length >= 1) score += 2;
    if (paragraphs.length > 0 && shortRatio >= 0.7) score += 5;

    return {
      score,
      max: 10,
      transitionCount: usedTransitions.length,
      shortRatio: Math.round(shortRatio * 100),
      status: score >= 8 ? 'success' : score >= 4 ? 'warning' : 'error',
      message: `過渡詞 ${usedTransitions.length} 種 | 短段落 ${paragraphs.length > 0 ? Math.round(shortRatio * 100) + '%' : '—'}`
    };
  }

  /**
   * 問題覆蓋層（15 分）— H2 痛點問句、關鍵字自然分散
   */
  static analyzeCoverage(html, content, keyword, escapeRegexFn) {
    const h2Result = this.analyzeH2Questions(html);
    const keywordResult = this.analyzeKeywordDispersion(content, keyword, escapeRegexFn);

    let score = 0;
    if (h2Result.h2Count > 0 && h2Result.issues.length === 0) score += 8;
    else if (h2Result.h2Count > 0 && h2Result.issues.length < h2Result.h2Count) score += 4;
    if (keywordResult.status === 'success') score += 7;
    else if (keywordResult.naturalCount >= 2) score += 4;

    return {
      score,
      max: 15,
      h2: h2Result,
      keyword: keywordResult,
      status: score >= 12 ? 'success' : score >= 6 ? 'warning' : 'error',
      message: `痛點問句 ${h2Result.h2Count > 0 && h2Result.issues.length === 0 ? '✓' : h2Result.h2Count === 0 ? '✗' : `${h2Result.issues.length} 個問題`} | 分散 ${keywordResult.status === 'success' ? '✓' : '待加強'}`
    };
  }

  /**
   * 權威信號層（10 分）— 社會證明、第一手經驗
   */
  static analyzeAuthority(content) {
    const socialResult = this.analyzeSocialProof(content);

    // 第一手經驗 / 專家掛銜（權威信號 +41%）
    const experiencePattern = /實測|親自|實際(?:走訪|使用|體驗|操作)|經驗分享|第一手|多年經驗|(?:師傅|技師|老師|專家|顧問|醫師|設計師)(?:表示|指出|建議|分享)/;
    const hasExperience = experiencePattern.test(content);

    let score = 0;
    if (socialResult.status === 'success') score += 5;
    else if (socialResult.hasReviews) score += 2;
    if (hasExperience) score += 5;

    return {
      score,
      max: 10,
      social: socialResult,
      hasExperience,
      status: score >= 8 ? 'success' : score >= 4 ? 'warning' : 'error',
      message: `社會證明 ${socialResult.status === 'success' ? '✓' : socialResult.hasReviews ? '部分' : '✗'} | 經驗掛銜 ${hasExperience ? '✓' : '✗'}`
    };
  }

  /**
   * 風險控制 — 關鍵字堆砌懲罰（AI 對堆砌 -9%）
   */
  static analyzeStuffing(content, keyword, escapeRegexFn) {
    if (!keyword) return { penalty: 0, count: 0, stuffed: false };
    const regex = new RegExp(escapeRegexFn(keyword), 'gi');
    const count = (content.match(regex) || []).length;
    const stuffed = count > 8;
    return { penalty: stuffed ? 9 : 0, count, stuffed };
  }

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
      return { status: 'pending', naturalCount: 0, message: '未設定關鍵字' };
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
   * 綜合 GEO 引用力分數（0-100）
   * 證據引用 40 + 結構規範 25 + 表達流暢 10 + 問題覆蓋 15 + 權威信號 10 - 堆砌懲罰
   */
  static calculateScore(html, content, keyword, analyzeH1Fn, escapeRegexFn) {
    const evidence = this.analyzeEvidence(html, content);
    const structure = this.analyzeStructure(html);
    const fluency = this.analyzeFluency(html, content);
    const coverage = this.analyzeCoverage(html, content, keyword, escapeRegexFn);
    const authority = this.analyzeAuthority(content);
    const stuffing = this.analyzeStuffing(content, keyword, escapeRegexFn);

    const raw = evidence.score + structure.score + fluency.score + coverage.score + authority.score - stuffing.penalty;
    const score = Math.min(100, Math.max(0, Math.round(raw)));

    return {
      score,
      breakdown: {
        evidence,
        structure,
        fluency,
        coverage,
        authority,
        stuffing
      }
    };
  }
}
