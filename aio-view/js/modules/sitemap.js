/* ================================================
   AIO View — Sitemap Module
   Sitemap 解析與搜尋語句產生
   ================================================ */

const Sitemap = {
  /** CORS Proxy 清單（自家 Worker 優先，公共服務備用） */
  PROXIES: [
    { url: 'https://helloruru-cors-proxy.vmpvmp1017.workers.dev/?url=', type: 'raw' },
    { url: 'https://api.allorigins.win/get?url=', type: 'json', key: 'contents' },
    { url: 'https://api.allorigins.win/raw?url=', type: 'raw' },
  ],

  /** 抓 sitemap 逾時 */
  FETCH_TIMEOUT_MS: 10000,

  /** 抓頁面標題逾時 */
  TITLE_FETCH_TIMEOUT_MS: 8000,

  /** 排除的 URL 模式 */
  EXCLUDE_PATTERNS: [
    /^https?:\/\/[^/]+\/$/,  // 首頁（只排除根路徑 /）
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

  /** 成對出現時通常代表列表頁的複數路由字尾 */
  PLURAL_ROUTE_SUFFIX: 's',

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
        xml = await this.fetchProxyContent(sitemapUrl, proxy, this.FETCH_TIMEOUT_MS);

        // 驗證是否為有效 XML
        if (xml && (xml.includes('<?xml') || xml.includes('<urlset') || xml.includes('<sitemapindex'))) {
          break;
        }
        xml = null;
      } catch (e) {
        lastError = e;
        console.warn(`Proxy ${proxy.url} failed:`, e.message);
        continue;
      }
    }

    if (!xml) {
      if (lastError?.message?.includes('逾時')) {
        throw new Error('取得 sitemap 逾時，請稍後再試或換另一個 sitemap');
      }
      throw new Error('無法取得 sitemap，請檢查網址是否正確，或稍後再試');
    }

    return this.parse(xml, sitemapUrl);
  },

  /**
   * 取得文章清單（自動處理 sitemap index → 子 sitemap）
   * @param {string} sitemapUrl - Sitemap URL
   * @returns {Promise<Array>} 文章清單
   */
  async fetchArticles(sitemapUrl) {
    const result = await this.fetch(sitemapUrl);

    if (result.type === 'index' && result.sitemaps?.length > 0) {
      // 逐個子 sitemap 收集文章
      const allArticles = [];
      for (const sub of result.sitemaps) {
        try {
          const subResult = await this.fetch(sub.url);
          if (subResult.articles?.length > 0) {
            allArticles.push(...subResult.articles);
          }
        } catch {
          // 某個子 sitemap 失敗就跳過
        }
      }
      return allArticles;
    }

    return result.articles || [];
  },

  /**
   * 用所有 proxy 嘗試抓取內容（簡化版，給外部模組用）
   * @param {string} targetUrl - 目標網址
   * @returns {Promise<string|null>}
   */
  async fetchAny(targetUrl) {
    for (const proxy of this.PROXIES) {
      try {
        const content = await this.fetchProxyContent(targetUrl, proxy, this.FETCH_TIMEOUT_MS);
        if (content) return content;
      } catch {
        continue;
      }
    }
    return null;
  },

  /**
   * 透過 proxy 抓取內容，逾時自動中止
   * @param {string} targetUrl - 目標網址
   * @param {{ url: string, type: string, key?: string }} proxy - proxy 設定
   * @param {number} timeoutMs - 逾時毫秒
   * @returns {Promise<string>}
   */
  async fetchProxyContent(targetUrl, proxy, timeoutMs) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const proxyUrl = proxy.url + encodeURIComponent(targetUrl);
      const response = await fetch(proxyUrl, { signal: controller.signal });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      if (proxy.type === 'json') {
        const data = await response.json();
        return data?.[proxy.key] || '';
      }

      return await response.text();
    } catch (error) {
      if (error?.name === 'AbortError') {
        throw new Error(`連線逾時（${Math.round(timeoutMs / 1000)} 秒）`);
      }
      throw error;
    } finally {
      clearTimeout(timer);
    }
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
    const urls = Array.from(doc.querySelectorAll('url'));
    const domain = Utils.getDomain(sitemapUrl);
    const articles = [];
    const routeHints = this.buildRouteHints(
      urls
        .map(urlEl => urlEl.querySelector('loc')?.textContent)
        .filter(Boolean)
    );

    urls.forEach((urlEl, index) => {
      const loc = urlEl.querySelector('loc')?.textContent;
      if (!loc) return;

      // 過濾非文章頁面
      if (this.isArticleUrl(loc, routeHints)) {
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
          selected: false
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
   * @param {{ pairedPluralSegments?: Set<string> }} [routeHints] - sitemap 推測出的路由線索
   * @returns {boolean} 是否為文章
   */
  isArticleUrl(url, routeHints = {}) {
    if (this.EXCLUDE_PATTERNS.some(pattern => pattern.test(url))) {
      return false;
    }

    if (this.isPairedPluralRoute(url, routeHints)) {
      return false;
    }

    return true;
  },

  /**
   * 根據 sitemap 內的網址組合，推測哪些複數路由其實是列表頁
   * 例如同時存在 /article/67 與 /articles/142 時，後者通常不是單篇文章。
   * @param {string[]} urls - sitemap 內的網址清單
   * @returns {{ pairedPluralSegments: Set<string> }}
   */
  buildRouteHints(urls) {
    const numericSegments = new Set();

    urls.forEach((rawUrl) => {
      try {
        const path = new URL(rawUrl).pathname.replace(/\/+$/, '');
        const match = path.match(/^\/([^/]+)\/\d+$/);
        if (match?.[1]) {
          numericSegments.add(match[1].toLowerCase());
        }
      } catch {
        // ignore invalid URL
      }
    });

    const pairedPluralSegments = new Set(
      Array.from(numericSegments).filter(segment =>
        segment.endsWith(this.PLURAL_ROUTE_SUFFIX)
        && numericSegments.has(segment.slice(0, -1))
      )
    );

    return { pairedPluralSegments };
  },

  /**
   * 套用 sitemap 路由線索，排除明顯不是單篇文章的頁面
   * @param {Object[]} articles - 文章清單
   * @returns {Object[]} 過濾後清單
   */
  filterArticles(articles) {
    const routeHints = this.buildRouteHints(
      articles
        .map(article => article?.url)
        .filter(Boolean)
    );

    return articles.filter(article => this.isArticleUrl(article.url, routeHints));
  },

  /**
   * 判斷是否為成對單複數路由中的列表頁
   * @param {string} url - 網址
   * @param {{ pairedPluralSegments?: Set<string> }} [routeHints] - sitemap 推測出的路由線索
   * @returns {boolean}
   */
  isPairedPluralRoute(url, routeHints = {}) {
    const pairedPluralSegments = routeHints.pairedPluralSegments;
    if (!pairedPluralSegments || pairedPluralSegments.size === 0) {
      return false;
    }

    try {
      const path = new URL(url).pathname.replace(/\/+$/, '');
      const match = path.match(/^\/([^/]+)\/\d+$/);
      return Boolean(match?.[1] && pairedPluralSegments.has(match[1].toLowerCase()));
    } catch {
      return false;
    }
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
   * 統一產生搜尋語句
   * @param {string} title - 標題
   * @param {string} domain - 網域
   * @returns {string}
   */
  buildQuery(title, domain) {
    return typeof QueryEngine !== 'undefined'
      ? QueryEngine.generate(title, domain)
      : this.generateQuery(title, domain);
  },

  /**
   * 背景抓標題後，是否要覆蓋現有語句
   * @param {Object} article - 文章
   * @param {string} previousTitle - 舊標題
   * @param {string} domain - 網域
   * @returns {boolean}
   */
  shouldRefreshQuery(article, previousTitle, domain) {
    const currentQuery = String(article.query || '').trim();
    if (!currentQuery) return true;

    const previousAutoQuery = String(this.buildQuery(previousTitle, domain) || '').trim();
    return currentQuery === previousAutoQuery;
  },

  /**
   * 從頁面抓取實際標題
   * @param {string} url - 頁面 URL
   * @returns {Promise<string|null>} 標題
   */
  async fetchPageTitle(url) {
    for (const proxy of this.PROXIES) {
      try {
        const html = await this.fetchProxyContent(url, proxy, this.TITLE_FETCH_TIMEOUT_MS);

        if (!html || html.length < 50) continue;

        // 依序嘗試：og:title → <title> → <h1>
        const ogMatch = html.match(/<meta[^>]*property="og:title"[^>]*content="([^"]+)"/i)
          || html.match(/<meta[^>]*content="([^"]+)"[^>]*property="og:title"/i);
        const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
        const h1Match = html.match(/<h1[^>]*>([^<]+)<\/h1>/i);

        const raw = ogMatch?.[1] || titleMatch?.[1] || h1Match?.[1] || null;
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
        const previousTitle = article.title;
        const title = await this.fetchPageTitle(article.url);
        if (title && title !== previousTitle) {
          const shouldRefreshQuery = this.shouldRefreshQuery(article, previousTitle, domain);
          article.title = title;
          if (shouldRefreshQuery) {
            article.query = this.buildQuery(title, domain);
          }
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
