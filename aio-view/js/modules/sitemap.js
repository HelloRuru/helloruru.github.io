/* ================================================
   AIO View — Sitemap Module
   Sitemap 解析與搜尋語句產生
   ================================================ */

const Sitemap = {
  /** CORS Proxy 清單 */
  PROXIES: [
    { url: 'https://api.allorigins.win/get?url=', type: 'json', key: 'contents' },
    { url: 'https://api.allorigins.win/raw?url=', type: 'raw' }
  ],

  /** 排除的 URL 模式 */
  EXCLUDE_PATTERNS: [
    /\/$/,              // 首頁
    /\/page\/\d+/,      // 分頁
    /\/category\//,
    /\/tag\//,
    /\/author\//,
    /\/privacy/,
    /\/terms/,
    /\/contact/,
    /\/about/,
    /\/partner/,
    /\/search/,
    /\.(xml|json|txt|pdf)$/
  ],

  /**
   * 從 sitemap URL 取得文章清單
   * @param {string} sitemapUrl - Sitemap URL
   * @returns {Promise<Object>} 解析結果
   */
  async fetch(sitemapUrl) {
    let xml = null;
    let lastError = null;

    // 嘗試多個 CORS proxy
    for (const proxy of this.PROXIES) {
      try {
        const proxyUrl = proxy.url + encodeURIComponent(sitemapUrl);
        const response = await fetch(proxyUrl);

        if (response.ok) {
          if (proxy.type === 'json') {
            const data = await response.json();
            xml = data[proxy.key];
          } else {
            xml = await response.text();
          }

          // 驗證是否為有效 XML
          if (xml && (xml.includes('<?xml') || xml.includes('<urlset') || xml.includes('<sitemapindex'))) {
            break;
          }
          xml = null;
        }
      } catch (e) {
        lastError = e;
        console.warn(`Proxy ${proxy.url} failed:`, e.message);
        continue;
      }
    }

    if (!xml) {
      throw new Error('無法取得 sitemap，請檢查網址是否正確，或稍後再試');
    }

    return this.parse(xml, sitemapUrl);
  },

  /**
   * 解析 sitemap XML
   * @param {string} xml - XML 內容
   * @param {string} sitemapUrl - 原始 URL
   * @returns {Object} 解析結果
   */
  parse(xml, sitemapUrl) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');

    // 檢查是否為 sitemap index
    const sitemapIndex = doc.querySelectorAll('sitemap loc');
    if (sitemapIndex.length > 0) {
      return {
        type: 'index',
        sitemaps: Array.from(sitemapIndex).map(loc => {
          const parent = loc.closest('sitemap');
          const lastmod = parent?.querySelector('lastmod')?.textContent || '';
          return { url: loc.textContent, lastmod };
        })
      };
    }

    // 解析 URL
    const urls = doc.querySelectorAll('url');
    const domain = Utils.getDomain(sitemapUrl);
    const articles = [];

    urls.forEach((urlEl, index) => {
      const loc = urlEl.querySelector('loc')?.textContent;
      if (!loc) return;

      // 過濾非文章頁面
      if (this.isArticleUrl(loc)) {
        const title = this.extractTitle(loc);
        const lastmod = urlEl.querySelector('lastmod')?.textContent || '';
        articles.push({
          id: `article-${index}`,
          url: loc,
          title: title,
          query: this.generateQuery(title, domain),
          lastmod: lastmod,
          selected: true
        });
      }
    });

    return {
      type: 'urlset',
      domain: domain,
      articles: articles
    };
  },

  /**
   * 判斷是否為文章 URL
   * @param {string} url - URL
   * @returns {boolean} 是否為文章
   */
  isArticleUrl(url) {
    return !this.EXCLUDE_PATTERNS.some(pattern => pattern.test(url));
  },

  /**
   * 從 URL 擷取標題
   * @param {string} url - URL
   * @returns {string} 標題
   */
  extractTitle(url) {
    try {
      const urlObj = new URL(url);
      const path = urlObj.pathname;
      const segments = path.split('/').filter(Boolean);
      const lastSegment = segments[segments.length - 1] || '';

      // 移除 ID 和副檔名
      let title = lastSegment
        .replace(/^\d+$/, '')
        .replace(/[-_]/g, ' ')
        .replace(/\.\w+$/, '');

      return title || url;
    } catch {
      return url;
    }
  },

  /**
   * 產生搜尋語句
   * @param {string} title - 標題
   * @param {string} domain - 網域
   * @returns {string} 搜尋語句
   */
  generateQuery(title, domain) {
    // 如果標題是 URL 或太短，使用網域名
    if (title.startsWith('http') || title.length < 3) {
      return domain.replace(/\.(com|tw|org|net)$/i, '');
    }

    // 清理標題
    let query = title
      .replace(/[|｜\-–—]/g, ' ')
      .replace(/[<>《》「」『』【】]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // 限制長度
    const words = query.split(' ').filter(Boolean);
    if (words.length > 5) {
      query = words.slice(0, 5).join(' ');
    }

    return query;
  },

  /**
   * 從頁面抓取實際標題（可選用）
   * @param {string} url - 頁面 URL
   * @returns {Promise<string|null>} 標題
   */
  async fetchPageTitle(url) {
    try {
      const proxy = this.PROXIES[0];
      const response = await fetch(proxy + encodeURIComponent(url));
      const html = await response.text();

      const ogTitleMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i);
      const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

      return ogTitleMatch?.[1] || titleMatch?.[1] || null;
    } catch {
      return null;
    }
  }
};
