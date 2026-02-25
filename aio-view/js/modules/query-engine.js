/* ================================================
   AIO View — Query Engine
   規則引擎：從文章標題自動產生搜尋語句
   零 API、零等待，純規則比對
   ================================================ */

const QueryEngine = {
  /** 標題分隔符（取第一段作為核心標題） */
  SEPARATORS: ['｜', '|', '—', '–', ' - ', '：', ':', '》'],

  /** 停用詞（移除，不影響搜尋意圖） */
  STOP_WORDS: [
    // 行銷用語
    '懶人包', '攻略', '大公開', '全攻略', '全指南', '全解析',
    '一次看', '一次搞定', '一篇搞定', '看這篇', '看這裡',
    '整理', '總整理', '大整理', '大全', '合集',
    '必看', '必讀', '必學', '必備', '必收藏',
    '完整', '詳細', '超詳細', '最完整',
    '精選', '嚴選', '私藏', '不藏私',
    '實測', '親測', '實際體驗',
    // 數字前綴
    '最新', '更新',
    // 句尾裝飾
    '一定要知道', '你一定要知道', '千萬別錯過', '不能錯過',
    '新手必看', '新手入門', '入門指南'
  ],

  /** 年份模式 */
  YEAR_PATTERN: /\b20[2-3]\d\b/g,

  /** 數量前綴（例如「10家」「5間」「3個」） */
  QUANTITY_PATTERN: /\d+[家間個款種招步則篇件組張杯道堂]/g,

  /** 問句關鍵字（保留問句結構，更接近真實搜尋） */
  QUESTION_WORDS: [
    '是什麼', '什麼', '怎麼', '如何', '多少',
    '哪裡', '哪間', '哪家', '哪個', '哪些',
    '幾個', '幾間', '幾家',
    '好嗎', '好不好', '值得嗎', '推薦嗎', '可以嗎',
    '差別', '差異', '比較', '區別',
    '優缺點', '注意事項', '流程', '費用', '價格', '價錢',
    '多久', '哪種', '怎麼選', '怎麼挑', '怎麼做',
    '要多少', '要注意', '要準備'
  ],

  /** 產業保護詞（這些字永遠保留在搜尋語句裡） */
  INDUSTRY_KEYWORDS: [
    // 美業
    '美甲', '美睫', '美容', '護膚', 'SPA', '霧眉', '紋繡', '除毛', '做臉',
    // 按摩
    '按摩', '推拿', '整復', '筋膜', '指壓', '腳底', '經絡', '刮痧', '拔罐',
    // 汽車
    '汽車', '保養', '維修', '輪胎', '鈑金', '烤漆', '洗車', '鍍膜',
    // 冷氣
    '冷氣', '空調', '安裝', '清洗', '移機', '灌冷媒',
    // 運動治療
    '物理治療', '運動治療', '復健', '筋膜放鬆', '徒手治療',
    // 餐飲
    '美食', '餐廳', '小吃', '甜點', '咖啡', '早午餐', '火鍋', '燒肉',
    // 醫療
    '牙醫', '皮膚科', '眼科', '中醫', '診所', '醫美',
    // 生活服務
    '搬家', '清潔', '裝潢', '設計', '攝影', '婚禮'
  ],

  /** 搜尋語句最大字數 */
  MAX_LENGTH: 12,

  /** 搜尋語句最小字數 */
  MIN_LENGTH: 3,

  /**
   * 從文章標題產生搜尋語句
   * @param {string} title - 文章標題
   * @param {string} [domain] - 網域（備用）
   * @returns {string} 搜尋語句
   */
  generate(title, domain) {
    if (!title || typeof title !== 'string') {
      return domain ? domain.replace(/\.(com|tw|org|net)$/i, '') : '';
    }

    // 如果標題是 URL，走備用路徑
    if (title.startsWith('http')) {
      return this.fromUrl(title, domain);
    }

    let query = title.trim();

    // Step 1: 取分隔符前的核心標題
    query = this.splitByFirstSeparator(query);

    // Step 2: 移除年份
    query = query.replace(this.YEAR_PATTERN, '');

    // Step 3: 移除數量前綴（「10家」「5間」）
    query = query.replace(this.QUANTITY_PATTERN, '');

    // Step 4: 移除停用詞
    query = this.removeStopWords(query);

    // Step 5: 清理特殊符號
    query = this.cleanPunctuation(query);

    // Step 6: 長度控制（保護產業關鍵字）
    query = this.trimLength(query);

    // Step 7: 最終清理
    query = query.replace(/\s+/g, ' ').trim();

    // 如果結果太短，用原標題的前幾個字
    if (query.length < this.MIN_LENGTH) {
      query = this.fallback(title, domain);
    }

    // Step 8: 確保產業關鍵字在語句中
    // 只看核心段落（分隔符前），避免從副標題誤帶入
    const coreTitle = this.splitByFirstSeparator(title.trim());
    query = this.ensureIndustryKeywords(query, coreTitle);

    return query;
  },

  /**
   * 取分隔符前的核心段落
   * @param {string} text
   * @returns {string}
   */
  splitByFirstSeparator(text) {
    for (const sep of this.SEPARATORS) {
      const idx = text.indexOf(sep);
      if (idx > 2) {
        // 取分隔符前的部分，但如果太短就不切
        const before = text.substring(0, idx).trim();
        if (before.length >= this.MIN_LENGTH) {
          return before;
        }
      }
    }
    return text;
  },

  /**
   * 移除停用詞
   * @param {string} text
   * @returns {string}
   */
  removeStopWords(text) {
    let result = text;
    // 先處理長的停用詞再處理短的（避免部分匹配問題）
    const sorted = [...this.STOP_WORDS].sort((a, b) => b.length - a.length);
    for (const word of sorted) {
      result = result.replace(new RegExp(this.escapeRegExp(word), 'g'), '');
    }
    return result;
  },

  /**
   * 清理標點符號，但保留問號
   * @param {string} text
   * @returns {string}
   */
  cleanPunctuation(text) {
    return text
      // 保留問號（問句結構很重要）
      .replace(/[，,。.！!、；;（）()\[\]「」『』【】《》<>～~#@&＆]/g, ' ')
      // 移除多餘空白
      .replace(/\s+/g, ' ')
      .trim();
  },

  /**
   * 長度控制
   * 中文字沒有空格分隔，所以用字元數控制
   * @param {string} text
   * @returns {string}
   */
  trimLength(text) {
    const isEnglish = /[a-zA-Z]{3,}/.test(text);
    const maxLen = isEnglish ? 40 : this.MAX_LENGTH;
    const maxWords = 6; // 英文最多 6 個字

    // 先檢查是否含問句關鍵字
    const hasQuestion = this.QUESTION_WORDS.some(q => text.includes(q));

    if (hasQuestion) {
      // 問句：找到問句後的第一個標點或句尾，完整保留問句
      for (const q of this.QUESTION_WORDS) {
        const idx = text.indexOf(q);
        if (idx >= 0) {
          const afterQWord = idx + q.length;
          // 從問句詞結尾開始，找到下一個標點符號（？。！，、）或文字結束
          const rest = text.substring(afterQWord);
          const punctIdx = rest.search(/[？?。！!，,、\s]/);
          const end = punctIdx >= 0 ? afterQWord + punctIdx : afterQWord;
          const candidate = text.substring(0, end).trim();
          if (candidate.length <= maxLen && candidate.length >= this.MIN_LENGTH) {
            return candidate;
          }
        }
      }
    }

    // 英文：用字數限制
    if (isEnglish && text.includes(' ')) {
      const words = text.split(/\s+/);
      if (words.length > maxWords) {
        return words.slice(0, maxWords).join(' ');
      }
      return text;
    }

    // 中文：用字元數限制
    if (text.length > maxLen) {
      return text.substring(0, maxLen).trim();
    }

    return text;
  },

  /**
   * 從 URL 產生備用語句
   * @param {string} url
   * @param {string} domain
   * @returns {string}
   */
  fromUrl(url, domain) {
    try {
      const urlObj = new URL(url);
      const segments = urlObj.pathname.split('/').filter(Boolean);
      const last = segments[segments.length - 1] || '';

      let text = decodeURIComponent(last)
        .replace(/[-_]/g, ' ')
        .replace(/\.\w+$/, '')
        .replace(/^\d+$/, '');

      if (text.length >= this.MIN_LENGTH) {
        return this.generate(text, domain);
      }

      // 最後一段是純數字時，往上一層找有意義的 segment
      if (/^\d+$/.test(last) && segments.length >= 2) {
        const prev = decodeURIComponent(segments[segments.length - 2])
          .replace(/[-_]/g, ' ');
        if (prev.length >= this.MIN_LENGTH) {
          return this.generate(prev, domain);
        }
      }
    } catch { /* ignore */ }

    return domain ? domain.replace(/\.(com|tw|org|net)$/i, '') : '';
  },

  /**
   * 備用方案：從原標題取前幾個有意義的字
   * @param {string} title
   * @param {string} domain
   * @returns {string}
   */
  fallback(title, domain) {
    // 清理所有符號，取前 8 個字
    const clean = title
      .replace(/[^\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9\s]/g, '')
      .trim();

    if (clean.length >= this.MIN_LENGTH) {
      return clean.substring(0, 8).trim();
    }

    return domain ? domain.replace(/\.(com|tw|org|net)$/i, '') : title;
  },

  /**
   * 批次產生搜尋語句
   * @param {Array} articles - 文章陣列 [{title, url}]
   * @param {string} domain - 網域
   * @returns {Array} 帶有 query 欄位的文章陣列
   */
  batchGenerate(articles, domain) {
    return articles.map(article => ({
      ...article,
      query: this.generate(article.title, domain)
    }));
  },

  /**
   * 確保產業關鍵字存在於語句中
   * 如果原標題有產業關鍵字，但清理後不見了，補回來
   * @param {string} query - 目前的語句
   * @param {string} originalTitle - 原始標題
   * @returns {string}
   */
  ensureIndustryKeywords(query, coreTitle) {
    const coreLower = coreTitle.toLowerCase();
    const queryLower = query.toLowerCase();

    // 如果語句裡已經有任何產業關鍵字，就不再補
    const alreadyHas = this.INDUSTRY_KEYWORDS.some(kw =>
      queryLower.includes(kw.toLowerCase())
    );
    if (alreadyHas) return query;

    // 從核心標題找產業詞，補最長的那個（最具體）
    let bestKeyword = '';
    for (const keyword of this.INDUSTRY_KEYWORDS) {
      const kw = keyword.toLowerCase();
      if (coreLower.includes(kw) && keyword.length > bestKeyword.length) {
        bestKeyword = keyword;
      }
    }

    if (bestKeyword) {
      const candidate = bestKeyword + ' ' + query;
      if (candidate.length <= this.MAX_LENGTH + 4) {
        return candidate;
      }
    }

    return query;
  },

  /**
   * 逸出正則特殊字元
   * @param {string} str
   * @returns {string}
   */
  escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
};
