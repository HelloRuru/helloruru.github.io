/* ================================================
   AIO View — Query Engine
   從文章標題產生搜尋語句
   核心邏輯：標題切段 → 選有地名的段落 → 輕度清理
   ================================================ */

const QueryEngine = {
  /** 標題分隔符 */
  SEPARATORS: ['｜', '|', '—', '–', ' - ', '：', ':', '》', '！', '!', '？', '?', '，', ','],

  /** 常見地區名（用來判斷哪段是搜尋意圖） */
  LOCATIONS: [
    '台北', '新北', '桃園', '新竹', '苗栗', '台中', '彰化', '南投',
    '雲林', '嘉義', '台南', '高雄', '屏東', '花蓮', '台東', '宜蘭',
    '基隆', '澎湖', '金門', '連江',
    '三民', '前鎮', '鼓山', '左營', '苓雅', '鳳山', '前金', '新興',
    '小港', '大社', '鳥松', '仁武', '楠梓', '東港', '恆春',
    '信義', '大安', '中山', '松山', '中正', '板橋', '永和', '中和',
    '西屯', '北屯', '南屯', '東區', '西區', '北區', '南區',
    '駁二', '美麗島', '巨蛋', '瑞豐'
  ],

  MAX_LENGTH: 20,
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

    if (title.startsWith('http')) {
      return this.fromUrl(title, domain);
    }

    let query = title.trim();

    // 1. 如果【】括號裡有地名，直接用（通常是 SEO 關鍵字）
    const bracket = this.extractBracket(query);
    if (bracket) return bracket;

    // 2. 切段，選有地名的那段
    query = this.pickBestSegment(query);

    // 3. 移除年份、數量詞
    query = query
      .replace(/【[^】]*】/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/20[2-3]\d/g, '')
      .replace(/\d+[家間個款種招步則篇件組張杯道堂]/g, '');

    // 4. 清理標點符號
    query = query
      .replace(/[，,。.！!？?、；;（）()\[\]「」『』【】《》<>～~#@&＆]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 5. 長度控制
    if (query.length > this.MAX_LENGTH) {
      query = query.substring(0, this.MAX_LENGTH).trim();
    }

    // 6. 太短就用 fallback
    if (query.length < this.MIN_LENGTH) {
      query = this.fallback(title, domain);
    }

    return query;
  },

  /**
   * 從【】或 [] 括號中提取搜尋語句（如果裡面有地名）
   * 很多 SGE 文章會把關鍵字放在【高雄筆電維修】這種括號裡
   */
  extractBracket(text) {
    const patterns = [/【([^】]+)】/, /\[([^\]]+)\]/];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        const content = match[1].trim();
        if (this.LOCATIONS.some(loc => content.includes(loc))) {
          return content;
        }
      }
    }
    return null;
  },

  /**
   * 切段後選最佳段落：優先有地名的
   */
  pickBestSegment(text) {
    for (const sep of this.SEPARATORS) {
      if (!text.includes(sep)) continue;
      const parts = text.split(sep).map(s => s.trim()).filter(s => s.length >= this.MIN_LENGTH);
      if (parts.length <= 1) continue;

      // 優先選有地名的段落
      const withLocation = parts.find(p =>
        this.LOCATIONS.some(loc => p.includes(loc))
      );
      if (withLocation) return withLocation;

      // 沒地名就取最長的段落（通常資訊最多）
      return parts.reduce((a, b) => a.length >= b.length ? a : b);
    }
    return text;
  },

  /**
   * 從 URL 產生備用語句
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
   * 備用方案：取標題前幾個有意義的字
   */
  fallback(title, domain) {
    const clean = title
      .replace(/[^\u4e00-\u9fff\u3400-\u4dbfa-zA-Z0-9\s]/g, '')
      .trim();

    if (clean.length >= this.MIN_LENGTH) {
      return clean.substring(0, 10).trim();
    }

    return domain ? domain.replace(/\.(com|tw|org|net)$/i, '') : title;
  },

  /**
   * 批次產生搜尋語句
   */
  batchGenerate(articles, domain) {
    return articles.map(article => ({
      ...article,
      query: this.generate(article.title, domain)
    }));
  }
};
