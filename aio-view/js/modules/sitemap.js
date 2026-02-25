/* ================================================
   AIO View — Sitemap Module
   Sitemap 解析與搜尋語句產生
   ================================================ */

const Sitemap = {
  /** CORS Proxy 清單（多來源避免單點限流） */
  PROXIES: [
    { url: 'https://api.allorigins.win/get?url=', type: 'json', key: 'contents' },
    { url: 'https://api.allorigins.win/raw?url=', type: 'raw' },
    { url: 'https://corsproxy.io/?url=', type: 'raw' }
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
          query: typeof QueryEngine !== 'undefined'
            ? QueryEngine.generate(title, domain)
            : this.generateQuery(title, domain),
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
   * 從頁面抓取實際標題
   * @param {string} url - 頁面 URL
   * @returns {Promise<string|null>} 標題
   */
  async fetchPageTitle(url) {
    for (const proxy of this.PROXIES) {
      try {
        const proxyUrl = proxy.url + encodeURIComponent(url);
        const response = await fetch(proxyUrl);
        if (!response.ok) continue;

        let html;
        if (proxy.type === 'json') {
          const data = await response.json();
          html = data[proxy.key];
        } else {
          html = await response.text();
        }

        if (!html || html.length < 50) continue;

        // og:title（兩種寫法都抓）
        const ogMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
          || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);
        // <title>
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);

        const raw = ogMatch?.[1] || titleMatch?.[1] || null;
        if (!raw) continue;

        // 解碼 HTML entities
        const tmp = document.createElement('textarea');
        tmp.innerHTML = raw;
        return tmp.value.trim();
      } catch { continue; }
    }
    return null;
  },

  /**
   * 判斷文章標題是否需要抓取真實標題
   * @param {Object} article - 文章
   * @returns {boolean}
   */
  needsTitleFetch(article) {
    const t = article.title;
    // 全 URL、以 http 開頭、純數字、純 ASCII slug
    return t === article.url
      || t.startsWith('http')
      || /^\d+$/.test(t.trim())
      || !/[\u4e00-\u9fff\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]/.test(t);
  },

  /**
   * 批次抓取文章標題（背景執行）
   * @param {Array} articles - 文章清單
   * @param {string} domain - 網域
   * @param {Function} onUpdate - 每篇更新後的回呼 (article, done, total)
   * @returns {Promise<Object>} { fetched, duplicates }
   */
  async fetchTitlesForArticles(articles, domain, onUpdate) {
    const needFetch = articles.filter(a => this.needsTitleFetch(a));
    if (needFetch.length === 0) return { fetched: 0, duplicates: [] };

    let fetched = 0;
    const batchSize = 3;

    for (let i = 0; i < needFetch.length; i += batchSize) {
      const batch = needFetch.slice(i, i + batchSize);
      const promises = batch.map(async (article) => {
        const title = await this.fetchPageTitle(article.url);
        if (title && title !== article.title) {
          article.title = title;
          article.query = typeof QueryEngine !== 'undefined'
            ? QueryEngine.generate(title, domain)
            : this.generateQuery(title, domain);
          fetched++;
          if (onUpdate) onUpdate(article, fetched, needFetch.length);
        }
      });
      await Promise.all(promises);
      if (i + batchSize < needFetch.length) {
        await new Promise(r => setTimeout(r, 600));
      }
    }

    // 偵測重複標題（分類頁常見）
    const titleCounts = {};
    for (const a of articles) {
      if (a.title && !a.title.startsWith('http')) {
        titleCounts[a.title] = (titleCounts[a.title] || 0) + 1;
      }
    }
    const duplicates = Object.entries(titleCounts)
      .filter(([, count]) => count >= 3)
      .map(([title, count]) => ({ title: title.substring(0, 30), count }));

    return { fetched, duplicates };
  }
};
