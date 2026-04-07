/* ================================================
   AEO Consultant — Citability Scoring Rules
   AI 可引用度評分規則
   ================================================ */

const CitabilityRules = {
  /**
   * 評分項目（每項 weight 加總 = 100）
   */
  CHECKS: [
    {
      id: 'definition',
      label: '第一段有清楚的定義句',
      weight: 15,
      desc: 'AI 最常引用頁面開頭的定義。第一段應該直接回答「X 是什麼」。',
      hint: '把第一段改成「X 是指…」或「X 是一種…」格式。40-60 字最容易被引用。'
    },
    {
      id: 'headings',
      label: '標題層級清楚（H1 > H2 > H3）',
      weight: 12,
      desc: 'AI 用標題理解頁面結構。標題跳級（H1 直接到 H4）會降低可引用度。',
      hint: '確保只有一個 H1，下面用 H2 分段，細項用 H3。不要跳級。'
    },
    {
      id: 'lists',
      label: '有條列重點（清單）',
      weight: 12,
      desc: 'AI 喜歡引用清單格式的內容。條列比長段落更容易被擷取。',
      hint: '把步驟、優點、注意事項改成 <ul> 或 <ol> 清單。'
    },
    {
      id: 'faq',
      label: '有問答格式（FAQ）',
      weight: 12,
      desc: 'AI 搜尋引擎會特別抓取問答格式的內容。',
      hint: '加一段 FAQ，用 H2/H3 當問題標題，下面直接回答。'
    },
    {
      id: 'tables',
      label: '有比較表格',
      weight: 8,
      desc: 'AI 擅長引用表格資料，尤其是比較和規格。',
      hint: '如果有比較資訊，改用 <table> 呈現。'
    },
    {
      id: 'selfContained',
      label: '有自足答案段（40-60 字）',
      weight: 12,
      desc: '一段話就能完整回答一個問題，是 AI 最愛引用的格式。',
      hint: '確保每個小節的第一段是獨立可引用的——不依賴上下文也能看懂。'
    },
    {
      id: 'author',
      label: '有作者署名',
      weight: 8,
      desc: 'E-E-A-T 信號。有具名作者的內容更容易被 AI 引用。',
      hint: '加上 <meta name="author"> 或在文章底部顯示作者名字。'
    },
    {
      id: 'date',
      label: '有發布日期',
      weight: 8,
      desc: 'AI 偏好有時間標記的內容。沒有日期的文章會被視為過時。',
      hint: '加上 <time datetime="YYYY-MM-DD"> 或 <meta property="article:published_time">。'
    },
    {
      id: 'metaDesc',
      label: '有 Meta Description',
      weight: 5,
      desc: 'AI 搜尋引擎會讀 meta description 作為頁面摘要。',
      hint: '加上 <meta name="description" content="...">，75 字以內。'
    },
    {
      id: 'wordCount',
      label: '內容長度足夠（> 300 字）',
      weight: 8,
      desc: '太短的頁面沒有足夠的資訊讓 AI 引用。',
      hint: '確保主要內容至少 300 字（中文字數）。'
    }
  ],

  /**
   * 評分一個頁面
   * @param {Object} structure - PageCrawler.extractContentStructure 的結果
   * @returns {Object} { score, grade, checks[], topFixes[] }
   */
  score(structure) {
    const checks = this.CHECKS.map(check => {
      const passed = this._evaluate(check.id, structure);
      return {
        ...check,
        passed,
        earned: passed ? check.weight : 0
      };
    });

    const score = checks.reduce((sum, c) => sum + c.earned, 0);
    const grade = this._scoreToGrade(score);
    const topFixes = checks
      .filter(c => !c.passed)
      .sort((a, b) => b.weight - a.weight)
      .slice(0, 5);

    return { score, grade, checks, topFixes };
  },

  /**
   * 評估單項檢查
   */
  _evaluate(checkId, s) {
    switch (checkId) {
      case 'definition': {
        const first = s.firstParagraph || '';
        // 有「是」「指」「為」等定義詞，且長度合理
        return first.length >= 30 && first.length <= 200 &&
          (/[是指為]/.test(first) || /^.{0,20}(是|指|為|意思是|定義)/.test(first));
      }

      case 'headings': {
        if (s.headings.length < 2) return false;
        const h1Count = s.headings.filter(h => h.level === 1).length;
        if (h1Count !== 1) return false;
        // 檢查是否跳級
        for (let i = 1; i < s.headings.length; i++) {
          if (s.headings[i].level - s.headings[i - 1].level > 1) return false;
        }
        return true;
      }

      case 'lists':
        return s.lists >= 1 && s.listItems >= 3;

      case 'faq':
        return s.faqPatterns.length >= 2;

      case 'tables':
        return s.tables >= 1;

      case 'selfContained': {
        // 至少有一段 40-60 字的段落（中文字數）
        return s.paragraphs.some(p => {
          const len = p.replace(/\s/g, '').length;
          return len >= 35 && len <= 80;
        });
      }

      case 'author':
        return !!s.author;

      case 'date':
        return !!s.datePublished;

      case 'metaDesc':
        return s.metaDesc.length >= 20;

      case 'wordCount':
        return s.wordCount >= 300;

      default:
        return false;
    }
  },

  _scoreToGrade(score) {
    if (score >= 85) return { text: 'A', class: 'good' };
    if (score >= 70) return { text: 'B', class: 'good' };
    if (score >= 55) return { text: 'C', class: 'warn' };
    if (score >= 35) return { text: 'D', class: 'warn' };
    return { text: 'F', class: 'bad' };
  }
};
