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

  GENERIC_SEGMENTS: [
    'article', 'articles',
    'post', 'posts',
    'blog', 'blogs',
    'news',
    'category', 'categories',
    'tag', 'tags',
    'search',
    'archive', 'archives'
  ],

  MAX_LENGTH: 20,
  MIN_LENGTH: 3,

  FACET_VARIANTS: [
    { key: 'recommend', label: '推薦 / 評價' },
    { key: 'price', label: '價格 / CP 值' },
    { key: 'decision', label: '決策 / 選擇' },
    { key: 'compare', label: '比較 / 排名' },
    { key: 'guide', label: '教學 / 入門' }
  ],

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

      if (text.length >= this.MIN_LENGTH && !this.isGenericSegment(text)) {
        return this.generate(text, domain);
      }

      if (/^\d+$/.test(last) && segments.length >= 2) {
        const prev = decodeURIComponent(segments[segments.length - 2])
          .replace(/[-_]/g, ' ');
        if (prev.length >= this.MIN_LENGTH && !this.isGenericSegment(prev)) {
          return this.generate(prev, domain);
        }
      }
    } catch { /* ignore */ }

    return domain ? domain.replace(/\.(com|tw|org|net)$/i, '') : '';
  },

  /**
   * 避免把 /articles/、/posts/ 這種容器路徑拿來當搜尋語句
   */
  isGenericSegment(text) {
    const normalized = String(text || '').trim().toLowerCase();
    return this.GENERIC_SEGMENTS.includes(normalized);
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
  },

  /**
   * 依單篇文章展開多個搜尋變體，方便驗證不同面向
   * @param {Object} article - 文章資料
   * @param {string} domain - 網域
   * @returns {Array} 搜尋變體
   */
  generateVariants(article, domain) {
    const title = article?.title || '';
    const url = article?.url || '';
    const baseQuery = String(article?.query || this.generate(title, domain)).trim();
    const articleKey = url || title || baseQuery;
    const anchor = this.buildVariantAnchor(baseQuery || title);
    const hasLocation = this.LOCATIONS.some(loc => anchor.includes(loc));
    const variants = [];
    const seen = new Set();

    const addVariant = (key, label, query, source = 'generated') => {
      const normalized = String(query || '').replace(/\s+/g, ' ').trim();
      if (!normalized || normalized.length < this.MIN_LENGTH) return;
      if (seen.has(normalized)) return;
      seen.add(normalized);
      variants.push({
        articleKey,
        url,
        title,
        baseQuery,
        facetKey: key,
        facetLabel: label,
        query: normalized,
        querySource: source
      });
    };

    addVariant('base', '核心主題', baseQuery, 'base');
    addVariant('recommend', '推薦 / 評價', this.ensureSuffix(anchor, '推薦'));
    addVariant('price', '價格 / CP 值', this.ensureSuffix(anchor, '價格'));
    addVariant('decision', '決策 / 選擇', this.ensureSuffix(anchor, hasLocation ? '哪家好' : '怎麼選'));
    addVariant('compare', '比較 / 排名', this.ensureSuffix(anchor, '比較'));

    if (this.shouldIncludeGuide(anchor, title)) {
      addVariant('guide', '教學 / 入門', this.ensureSuffix(anchor, hasLocation ? '新手' : '入門'));
    }

    return variants;
  },

  /**
   * 整理同篇文章的主題骨架，方便延伸不同問法
   */
  buildVariantAnchor(query) {
    let text = String(query || '');

    text = text
      .replace(/(高評價|推薦|評價|口碑|價格|費用|價錢|便宜|平價|cp值|CP值|划算|比較|排行|排名|哪家好|哪家|怎麼選|如何選|找哪家|新手|入門|教學)/gu, ' ')
      .replace(/[，,。.！!？?、；;（）()\[\]「」『』【】《》<>～~#@&＆]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (text.length >= this.MIN_LENGTH) {
      return text;
    }

    return String(query || '').trim();
  },

  /**
   * 補上指定尾詞，避免重複疊字
   */
  ensureSuffix(anchor, suffix) {
    const text = String(anchor || '').trim();
    if (!text) return suffix;
    if (text.endsWith(suffix)) return text;
    return `${text}${suffix}`;
  },

  /**
   * 判斷這篇主題是否適合補教學 / 入門面向
   */
  shouldIncludeGuide(anchor, title = '') {
    const text = `${anchor} ${title}`;
    return /(學|教學|入門|新手|課程|方法|流程|怎麼|維修|洗冷氣|皮拉提斯|助聽器|補習班|租借|住宿|買|選|保養)/.test(text);
  }
};
