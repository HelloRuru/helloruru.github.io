/* ================================================
   AEO Consultant — Page Crawler
   批次抓取網頁 HTML 內容
   ================================================ */

const PageCrawler = {
  /** 最大同時請求數 */
  MAX_CONCURRENCY: 3,

  /** 請求間隔（ms） */
  DELAY: 600,

  /** 最大頁數 */
  MAX_PAGES: 100,

  /** 抓取是否在進行中 */
  _running: false,

  /** 取消旗標 */
  _cancelToken: 0,

  /** 共用爬取 Promise（防止同時多次爬取同一批 URL） */
  _crawlPromise: null,
  _crawlDomain: '',

  /**
   * 批次抓取頁面 HTML
   * @param {Array<string>} urls - 要抓取的 URL 清單
   * @param {string} domain - 網域名稱
   * @param {Object} options - { onProgress, onPageDone }
   * @returns {Promise<Object>} { fetched, cached, failed, pages }
   */
  async crawlPages(urls, domain, options = {}) {
    // 同一個 domain 的爬取只跑一次，後續呼叫共用結果
    if (this._crawlPromise && this._crawlDomain === domain) {
      return this._crawlPromise;
    }

    this._crawlDomain = domain;
    this._crawlPromise = this._doCrawl(urls, domain, options);

    try {
      const result = await this._crawlPromise;
      return result;
    } finally {
      // 完成後清除，下次可以重新爬
      this._crawlPromise = null;
      this._crawlDomain = '';
    }
  },

  async _doCrawl(urls, domain, options = {}) {
    const { onProgress, onPageDone } = options;
    const token = ++this._cancelToken;
    this._running = true;

    // 限制頁數
    const limited = urls.slice(0, this.MAX_PAGES);
    const total = limited.length;
    let fetched = 0;
    let cached = 0;
    let failed = 0;
    const pages = [];

    // 分批處理
    for (let i = 0; i < total; i += this.MAX_CONCURRENCY) {
      if (token !== this._cancelToken) break; // 被取消

      const batch = limited.slice(i, i + this.MAX_CONCURRENCY);
      const promises = batch.map(url => this._fetchOnePage(url, domain));
      const results = await Promise.allSettled(promises);

      for (let j = 0; j < results.length; j++) {
        if (token !== this._cancelToken) break;

        const result = results[j];
        const url = batch[j];

        if (result.status === 'fulfilled' && result.value) {
          const { html, fromCache } = result.value;
          pages.push({ url, html, ok: true });
          if (fromCache) cached++;
          else fetched++;

          if (onPageDone) onPageDone({ url, ok: true, fromCache });
        } else {
          pages.push({ url, html: null, ok: false });
          failed++;
          if (onPageDone) onPageDone({ url, ok: false });
        }
      }

      if (onProgress) {
        onProgress({
          done: fetched + cached + failed,
          total,
          fetched,
          cached,
          failed
        });
      }

      // 批次間延遲（避免被限速）
      if (i + this.MAX_CONCURRENCY < total && token === this._cancelToken) {
        await this._delay(this.DELAY);
      }
    }

    this._running = false;
    return { fetched, cached, failed, pages };
  },

  /**
   * 抓取單一頁面
   * @param {string} url - 頁面 URL
   * @param {string} domain - 網域
   * @returns {Promise<{html: string, fromCache: boolean}|null>}
   */
  async _fetchOnePage(url, domain) {
    // 先查快取
    try {
      const cachedHtml = await SiteDB.getCachedPage(url);
      if (cachedHtml) {
        return { html: cachedHtml, fromCache: true };
      }
    } catch {
      // 快取查詢失敗，繼續抓取
    }

    // 透過 CORS proxy 抓取
    try {
      const html = await Sitemap.fetchAny(url);
      if (html) {
        // 存入快取
        try {
          await SiteDB.cachePage(url, domain, html);
        } catch {
          // 存快取失敗不影響主流程
        }
        return { html, fromCache: false };
      }
    } catch {
      // 抓取失敗
    }

    return null;
  },

  /**
   * 從 HTML 提取 JSON-LD
   * @param {string} html - 頁面 HTML
   * @returns {Array<Object>} JSON-LD 物件清單
   */
  extractJsonLd(html) {
    const results = [];
    const regex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
      try {
        const parsed = JSON.parse(match[1].trim());
        if (Array.isArray(parsed)) {
          results.push(...parsed);
        } else {
          results.push(parsed);
        }
      } catch {
        results.push({ _parseError: true, _raw: match[1].trim().substring(0, 200) });
      }
    }

    return results;
  },

  /**
   * 從 HTML 提取內容結構資訊
   * @param {string} html - 頁面 HTML
   * @returns {Object} 結構資訊
   */
  extractContentStructure(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // 標題
    const title = doc.querySelector('title')?.textContent?.trim() || '';
    const h1 = doc.querySelector('h1')?.textContent?.trim() || '';

    // 標題層級
    const headings = [];
    doc.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(el => {
      headings.push({
        level: parseInt(el.tagName[1]),
        text: el.textContent.trim().substring(0, 100)
      });
    });

    // 段落
    const paragraphs = [];
    doc.querySelectorAll('p').forEach(el => {
      const text = el.textContent.trim();
      if (text.length > 20) paragraphs.push(text);
    });

    // 清單
    const lists = doc.querySelectorAll('ul, ol').length;
    const listItems = doc.querySelectorAll('li').length;

    // 表格
    const tables = doc.querySelectorAll('table').length;

    // FAQ 偵測
    const faqPatterns = [];
    doc.querySelectorAll('h2, h3, h4, dt, summary, [class*="faq"], [class*="question"], [id*="faq"]').forEach(el => {
      const text = el.textContent.trim();
      if (text.endsWith('?') || text.endsWith('？') || text.includes('什麼') || text.includes('如何') || text.includes('怎麼')) {
        faqPatterns.push(text.substring(0, 100));
      }
    });

    // Meta
    const metaDesc = doc.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const ogTitle = doc.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';

    // 從 JSON-LD 補抓（很多網站只在 JSON-LD 裡放 author / date）
    const jsonLdData = this._extractJsonLdFields(html);

    // 作者（meta > JSON-LD > class）
    const author = doc.querySelector('meta[name="author"]')?.getAttribute('content') ||
                   jsonLdData.author ||
                   doc.querySelector('[class*="author"]')?.textContent?.trim() || '';

    // 日期（meta > JSON-LD > time tag）
    const datePublished = doc.querySelector('meta[property="article:published_time"]')?.getAttribute('content') ||
                          jsonLdData.datePublished ||
                          doc.querySelector('time')?.getAttribute('datetime') || '';

    // 字數估計
    const bodyText = doc.body?.textContent || '';
    const wordCount = bodyText.replace(/\s+/g, '').length;

    return {
      title,
      h1,
      headings,
      paragraphs: paragraphs.slice(0, 20), // 只保留前 20 段
      firstParagraph: paragraphs[0] || '',
      lists,
      listItems,
      tables,
      faqPatterns,
      metaDesc,
      ogTitle,
      author,
      datePublished,
      wordCount
    };
  },

  /**
   * 取消目前的爬取
   */
  cancel() {
    this._cancelToken++;
    this._running = false;
  },

  /**
   * 是否正在爬取
   */
  isRunning() {
    return this._running;
  },

  /**
   * 從 HTML 的 JSON-LD 提取 author / datePublished 等欄位
   * @param {string} html
   * @returns {Object} { author, datePublished }
   */
  _extractJsonLdFields(html) {
    const result = { author: '', datePublished: '' };
    const regex = /<script[^>]*type\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;

    while ((match = regex.exec(html)) !== null) {
      try {
        const obj = JSON.parse(match[1].trim());
        // author
        if (!result.author) {
          const a = obj.author;
          if (typeof a === 'string') result.author = a;
          else if (a?.name) result.author = a.name;
          else if (Array.isArray(a) && a[0]?.name) result.author = a[0].name;
        }
        // datePublished
        if (!result.datePublished && obj.datePublished) {
          result.datePublished = obj.datePublished;
        }
      } catch { /* ignore parse errors */ }
    }

    return result;
  },

  /**
   * 延遲
   * @param {number} ms
   */
  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
};
