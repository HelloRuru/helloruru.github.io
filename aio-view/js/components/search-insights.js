/* ================================================
   AIO View — Search Insights
   單篇使用者搜尋偏好 + 面向覆蓋驗證
   ================================================ */

const SearchInsights = {
  elements: {
    card: null,
    summary: null,
    chips: null,
    tree: null,
    suggestions: null
  },

  FACET_RULES: [
    { key: 'recommend', label: '推薦 / 評價', regex: /(推薦|評價|口碑|高評價|人氣|名單|精選|必吃|必買)/ },
    { key: 'price', label: '價格 / CP 值', regex: /(價格|費用|價錢|便宜|平價|cp值|CP值|划算|預算|省錢)/ },
    { key: 'decision', label: '決策 / 選擇', regex: /(哪家好|哪家|找哪家|怎麼選|如何選|值得|適合|推嗎|好嗎)/ },
    { key: 'compare', label: '比較 / 排名', regex: /(比較|排行|排名|差異|對比|vs|VS|top|TOP)/ },
    { key: 'guide', label: '教學 / 入門', regex: /(入門|新手|教學|課程|方法|流程|指南|怎麼)/ }
  ],

  init() {
    this.elements.card = document.getElementById('search-insights-card');
    this.elements.summary = document.getElementById('search-insights-summary');
    this.elements.chips = document.getElementById('search-insights-chips');
    this.elements.tree = document.getElementById('search-insights-tree');
    this.elements.suggestions = document.getElementById('search-insights-suggestions');
  },

  render(results) {
    const items = results?.results || [];
    if (items.length === 0) {
      this.reset();
      return;
    }

    const analysis = this.analyze(items);
    if (analysis.articles.length === 0) {
      this.reset();
      return;
    }

    this.renderSummary(analysis);
    this.renderChips(analysis);
    this.renderTree(analysis);
    this.renderSuggestions(analysis);
    this.show();
  },

  analyze(items) {
    const groups = new Map();

    items.forEach((item) => {
      const key = item.articleKey || item.url || item.title || item.query;
      if (!key) return;

      if (!groups.has(key)) {
        groups.set(key, {
          articleKey: key,
          title: item.title || item.url || item.query,
          url: item.url || '',
          baseQuery: item.baseQuery || item.query || '',
          items: []
        });
      }

      const entry = groups.get(key);
      entry.items.push(item);
      if (!entry.baseQuery && item.query) entry.baseQuery = item.query;
    });

    const articles = Array.from(groups.values())
      .map(group => this.analyzeArticle(group))
      .sort((a, b) => (
        this.scoreVerdict(b.verdict) - this.scoreVerdict(a.verdict)
        || b.citedCount - a.citedCount
        || b.aioCount - a.aioCount
        || b.verifiedFacets.length - a.verifiedFacets.length
        || a.title.length - b.title.length
      ));

    const validated = articles.filter(article => article.verdict === 'validated').length;
    const partial = articles.filter(article => article.verdict === 'partial').length;
    const pending = articles.filter(article => article.verdict === 'pending').length;
    const suggestions = Array.from(new Set(
      articles.flatMap(article => article.suggestions)
    )).slice(0, 8);

    return {
      articles,
      validated,
      partial,
      pending,
      suggestions
    };
  },

  analyzeArticle(group) {
    const baseQuery = String(group.baseQuery || group.title || '').trim();
    const variantPlan = QueryEngine.generateVariants({
      title: group.title,
      url: group.url,
      query: baseQuery
    }, '');
    const expectedFacets = variantPlan
      .filter(item => item.facetKey !== 'base')
      .map(item => ({
        key: item.facetKey,
        label: item.facetLabel,
        query: item.query
      }));

    const facetMap = new Map();
    expectedFacets.forEach((facet) => {
      facetMap.set(facet.key, {
        ...facet,
        scanned: false,
        aio: 0,
        cited: 0,
        queries: []
      });
    });

    group.items.forEach((item) => {
      const query = String(item.query || '').trim();
      const facetKeys = this.resolveFacetKeys(item, baseQuery);

      facetKeys.forEach((facetKey) => {
        if (!facetMap.has(facetKey)) {
          const label = this.getFacetLabel(facetKey);
          facetMap.set(facetKey, {
            key: facetKey,
            label,
            query,
            scanned: false,
            aio: 0,
            cited: 0,
            queries: []
          });
        }

        const facet = facetMap.get(facetKey);
        facet.scanned = true;
        if (query) facet.queries.push(query);
        if (item.hasAIO === true) facet.aio += 1;
        if (item.isCited) facet.cited += 1;
      });
    });

    const facets = Array.from(facetMap.values()).map((facet) => ({
      ...facet,
      queries: Array.from(new Set(facet.queries)).slice(0, 3)
    }));

    const verifiedFacets = this.sortFacets(facets.filter(facet => facet.aio > 0));
    const citedFacets = this.sortFacets(facets.filter(facet => facet.cited > 0));
    const attemptedFacets = this.sortFacets(facets.filter(facet => facet.scanned && facet.aio === 0));
    const missingFacets = this.sortFacets(facets.filter(facet => !facet.scanned));

    const aioCount = group.items.filter(item => item.hasAIO === true).length;
    const citedCount = group.items.filter(item => item.isCited).length;
    const verdict = this.resolveVerdict(verifiedFacets.length, group.items.length, missingFacets.length);
    const locations = this.extractLocations(baseQuery || group.title);
    const totalFacets = new Set([
      ...verifiedFacets.map(f => f.key),
      ...attemptedFacets.map(f => f.key),
      ...missingFacets.map(f => f.key)
    ]).size;

    return {
      articleKey: group.articleKey,
      title: group.title,
      url: group.url,
      baseQuery,
      verdict,
      verdictLabel: this.getVerdictLabel(verdict),
      aioCount,
      citedCount,
      totalQueries: group.items.length,
      totalFacets,
      verifiedFacets,
      citedFacets,
      attemptedFacets,
      missingFacets,
      representativeQueries: Array.from(new Set(
        group.items
          .filter(item => item.hasAIO === true || item.isCited)
          .map(item => item.query)
          .filter(Boolean)
      )).slice(0, 3),
      locations,
      summary: this.buildArticleSummary({
        title: group.title,
        verifiedFacets,
        attemptedFacets,
        missingFacets,
        citedFacets,
        totalQueries: group.items.length
      }),
      suggestions: this.buildArticleSuggestions(missingFacets, attemptedFacets)
    };
  },

  resolveFacetKeys(item, baseQuery) {
    const keys = [];

    if (item.facetKey && item.facetKey !== 'base') {
      keys.push(item.facetKey);
    }

    this.FACET_RULES.forEach((rule) => {
      if (rule.regex.test(item.query || '')) {
        keys.push(rule.key);
      }
    });

    if (keys.length === 0 && baseQuery && String(item.query || '').trim() === String(baseQuery).trim()) {
      keys.push('recommend');
    }

    return Array.from(new Set(keys));
  },

  resolveVerdict(verifiedCount, queryCount, missingCount) {
    if (queryCount === 0) return 'pending';
    if (verifiedCount >= 2) return 'validated';
    if (verifiedCount >= 1 || queryCount >= 2 || missingCount === 0) return 'partial';
    return 'pending';
  },

  scoreVerdict(verdict) {
    if (verdict === 'validated') return 3;
    if (verdict === 'partial') return 2;
    return 1;
  },

  getVerdictLabel(verdict) {
    if (verdict === 'validated') return 'VERIFIED';
    if (verdict === 'partial') return 'PARTIAL';
    return 'PENDING';
  },

  getFacetLabel(key) {
    return this.FACET_RULES.find(rule => rule.key === key)?.label || key;
  },

  sortFacets(items) {
    return [...items].sort((a, b) => {
      const aIndex = this.FACET_RULES.findIndex(rule => rule.key === a.key);
      const bIndex = this.FACET_RULES.findIndex(rule => rule.key === b.key);
      return aIndex - bIndex;
    });
  },

  buildArticleSummary({ verifiedFacets, attemptedFacets, missingFacets, citedFacets, totalQueries }) {
    if (totalQueries <= 1) {
      return '目前只驗證到 1 條查詢，資料還太薄，不能直接把它當成使用者偏好。';
    }

    if (verifiedFacets.length === 0) {
      return `這篇目前已經試過 ${totalQueries} 條查詢，但還沒有驗到穩定會出 AIO 的面向，建議先補搜缺的問法。`;
    }

    const verifiedText = verifiedFacets.slice(0, 2).map(facet => facet.label).join('、');
    const citedText = citedFacets.length > 0
      ? `而且實際被引用的面向偏「${citedFacets.slice(0, 2).map(facet => facet.label).join('、')}」。`
      : '';
    const missingText = missingFacets.length > 0
      ? `還沒補完「${missingFacets.slice(0, 2).map(facet => facet.label).join('、')}」這些問法。`
      : (attemptedFacets.length > 0
          ? `已搜但沒命中的面向是「${attemptedFacets.slice(0, 2).map(facet => facet.label).join('、')}」。`
          : '這篇的主要問法已經有基本輪廓。');

    return `這篇目前驗到的偏好偏「${verifiedText}」，代表使用者會帶著這類需求詞來找。${citedText}${missingText}`.trim();
  },

  buildArticleSuggestions(missingFacets, attemptedFacets) {
    if (missingFacets.length > 0) {
      return missingFacets.map(f => f.query).filter(Boolean).slice(0, 4);
    }
    if (attemptedFacets.length > 0) {
      return attemptedFacets.map(f => f.query).filter(Boolean).slice(0, 4);
    }
    // 空陣列 → renderTree 會用 Google Suggest 補
    return [];
  },

  /**
   * 從 Google Autocomplete 取得延伸建議（JSONP）
   * @param {string} query - 搜尋詞
   * @param {string[]} exclude - 已搜過的 query，要過濾掉
   * @returns {Promise<string[]>}
   */
  fetchGoogleSuggestions(query, exclude = []) {
    return new Promise((resolve) => {
      const q = String(query || '').trim();
      if (!q) { resolve([]); return; }

      const callbackName = '_gsc_' + Math.random().toString(36).slice(2, 8);
      const timeout = setTimeout(() => {
        cleanup();
        resolve([]);
      }, 4000);

      const cleanup = () => {
        clearTimeout(timeout);
        delete window[callbackName];
        script.remove();
      };

      window[callbackName] = (data) => {
        cleanup();
        try {
          const raw = Array.isArray(data[1]) ? data[1] : [];
          const excludeSet = new Set(exclude.map(s => s.toLowerCase()));
          excludeSet.add(q.toLowerCase());
          const filtered = raw
            .map(s => (Array.isArray(s) ? s[0] : String(s)).trim())
            .filter(s => s && !excludeSet.has(s.toLowerCase()))
            .slice(0, 6);
          resolve(filtered);
        } catch { resolve([]); }
      };

      const script = document.createElement('script');
      script.src = `https://clients1.google.com/complete/search?client=hp&hl=zh-TW&q=${encodeURIComponent(q)}&callback=${callbackName}`;
      document.head.appendChild(script);
    });
  },

  extractLocations(query) {
    const text = String(query || '');
    const candidates = (QueryEngine?.LOCATIONS || [])
      .filter(location => text.includes(location))
      .sort((a, b) => b.length - a.length);

    const unique = [];
    candidates.forEach((location) => {
      if (unique.some(saved => saved.includes(location) || location.includes(saved))) return;
      unique.push(location);
    });

    return unique.slice(0, 2);
  },

  renderSummary(analysis) {
    if (!this.elements.summary) return;

    const total = analysis.articles.length;
    const parts = [];

    if (analysis.validated > 0) {
      parts.push(`${analysis.validated} 篇已驗證（至少 2 個面向有 AIO）`);
    }
    if (analysis.partial > 0) {
      parts.push(`${analysis.partial} 篇部分驗證`);
    }
    if (analysis.pending > 0) {
      parts.push(`${analysis.pending} 篇資料還不夠，建議補搜`);
    }

    const statusLine = parts.length > 0
      ? `共 ${total} 篇文章：${parts.join('、')}。`
      : `共 ${total} 篇文章，目前還沒有驗證結果。`;

    const tipLine = analysis.pending > 0
      ? '展開下方各篇可以看「還沒補驗證」的面向，補搜後再回來看結果會更完整。'
      : (analysis.validated === total
        ? '所有文章都已驗證到足夠面向，可以參考各篇的偏好判讀。'
        : '部分文章的面向還沒補齊，補搜後判讀會更準。');

    this.elements.summary.innerHTML = `
      <p>${Utils.escapeHtml(statusLine)}</p>
      <p>${Utils.escapeHtml(tipLine)}</p>
    `;
  },

  renderChips(analysis) {
    if (!this.elements.chips) return;

    this.elements.chips.innerHTML = `
      <span class="insight-chip">
        <span class="insight-chip-label">已驗證文章</span>
        <span class="insight-chip-count">${analysis.validated}</span>
      </span>
      <span class="insight-chip">
        <span class="insight-chip-label">部分驗證</span>
        <span class="insight-chip-count">${analysis.partial}</span>
      </span>
      <span class="insight-chip">
        <span class="insight-chip-label">待補驗證</span>
        <span class="insight-chip-count">${analysis.pending}</span>
      </span>
    `;
  },

  renderTree(analysis) {
    if (!this.elements.tree) return;

    if (analysis.articles.length === 0) {
      this.elements.tree.innerHTML = '<div class="chart-empty">目前還沒有足夠的單篇資料</div>';
      return;
    }

    this.elements.tree.innerHTML = analysis.articles.map((article, index) => `
      <details class="topic-node"${index < 2 ? ' open' : ''}>
        <summary class="topic-node-summary">
          <span class="topic-node-title">${Utils.escapeHtml(article.title)}</span>
          <span class="topic-node-meta">${Utils.escapeHtml(article.verdictLabel)} // ${article.verifiedFacets.length}/${article.totalFacets} SCANNED</span>
        </summary>
        <div class="topic-node-body">
          <div class="topic-branch">
            <span class="topic-branch-label">// DIAGNOSIS</span>
            <span class="topic-branch-value">${Utils.escapeHtml(article.summary)}</span>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// TARGET ZONE</span>
            <span class="topic-branch-value">${Utils.escapeHtml(
              article.locations.length > 0
                ? `${article.locations.join('、')} / ${article.baseQuery || article.title}`
                : (article.baseQuery || article.title)
            )}</span>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// USER INTENT — Google 搜尋建議</span>
            <div class="topic-query-list" data-google-suggest="${Utils.escapeHtml(article.baseQuery || article.title)}">
              <span class="topic-branch-value suggest-loading">LOADING SIGNAL...</span>
            </div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// VERIFIED — 已確認出現 AIO 的面向</span>
            <div class="topic-query-list">
              ${this.renderFacetChips(article.verifiedFacets, 'facet-chip-success', 'NO DATA YET')}
            </div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// MISS — 已搜尋但未觸發 AIO</span>
            <div class="topic-query-list">
              ${this.renderFacetChips(article.attemptedFacets, 'facet-chip-warning', 'NONE')}
            </div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// PENDING — 尚未掃描的面向</span>
            <div class="topic-query-list">
              ${this.renderFacetChips(article.missingFacets, 'facet-chip-muted', 'ALL CLEAR')}</div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// HIT QUERIES — 命中 AIO 的搜尋語句</span>
            <div class="topic-query-list">
              ${article.representativeQueries.length > 0
                ? article.representativeQueries.map(query => `
                    <code class="topic-query-item">${Utils.escapeHtml(query)}</code>
                  `).join('')
                : '<span class="topic-branch-value">AWAITING SIGNAL</span>'}
            </div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// RESCAN — 建議補充掃描的面向</span>
            <div class="suggestion-chip-row">
              ${article.suggestions.length > 0
                ? article.suggestions.map(query => `
                    <span class="suggestion-chip">${Utils.escapeHtml(query)}</span>
                  `).join('')
                : '<span class="topic-branch-value">SCAN COMPLETE</span>'}
            </div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">// EXPAND — 延伸寫作方向</span>
            <div class="suggestion-chip-row" data-extend-target="${Utils.escapeHtml(article.baseQuery || article.title)}">
              <span class="topic-branch-value suggest-loading">LOADING SIGNAL...</span>
            </div>
          </div>
        </div>
      </details>
    `).join('');

    // 異步載入 Google Suggest
    this.loadGoogleSuggestions(analysis);
  },

  /**
   * 異步載入每篇文章的 Google 搜尋建議
   */
  async loadGoogleSuggestions(analysis) {
    // 收集所有文章標題（用來比對延伸方向是否已寫過）
    const allTitles = analysis.articles.map(a =>
      (a.title || '').toLowerCase()
    );

    for (const article of analysis.articles) {
      const baseQuery = article.baseQuery || article.title;
      const escapedQuery = Utils.escapeHtml(baseQuery);

      try {
        const suggestions = await this.fetchGoogleSuggestions(baseQuery, []);

        // 「使用者在意的」— 顯示所有 Google 建議
        const suggestEl = this.elements.tree?.querySelector(
          `[data-google-suggest="${escapedQuery}"]`
        );
        if (suggestEl && suggestions.length > 0) {
          // 每個建議用 FACET_RULES 比對標籤
          suggestEl.innerHTML = suggestions.map(s => {
            const facet = this.matchFacet(s);
            const tagHtml = facet
              ? `<span class="suggest-tag" data-facet="${facet.key}">${Utils.escapeHtml(facet.label)}</span>`
              : '';
            return `<span class="suggestion-chip suggestion-chip-google">${tagHtml}${Utils.escapeHtml(s)}</span>`;
          }).join('');
        } else if (suggestEl) {
          suggestEl.innerHTML = '<span class="topic-branch-value">NO SIGNAL — Google Autocomplete 未回傳資料</span>';
        }

        // 「延伸寫作方向」— 過濾掉跟已有文章標題重疊的，只留新方向
        const extendEl = this.elements.tree?.querySelector(
          `[data-extend-target="${escapedQuery}"]`
        );
        if (extendEl && suggestions.length > 0) {
          const newTopics = suggestions.filter(s => {
            const lower = s.toLowerCase();
            // 排除跟已有文章標題高度重疊的
            return !allTitles.some(t =>
              t.includes(lower) || lower.includes(t)
            );
          }).slice(0, 5);

          if (newTopics.length > 0) {
            extendEl.innerHTML = newTopics.map(s =>
              `<span class="suggestion-chip suggestion-chip-new">${Utils.escapeHtml(s)}</span>`
            ).join('');
          } else {
            extendEl.innerHTML = '<span class="topic-branch-value">COVERED — 目前 Google 熱搜方向皆已有對應內容</span>';
          }
        } else if (extendEl) {
          extendEl.innerHTML = '<span class="topic-branch-value">NO SIGNAL — Google Autocomplete 未回傳資料</span>';
        }
      } catch {
        // 失敗就靜默跳過
      }
    }
  },

  /**
   * 用 FACET_RULES 比對 Google 建議的標籤
   */
  matchFacet(text) {
    for (const rule of this.FACET_RULES) {
      if (rule.regex.test(text)) return { key: rule.key, label: rule.label };
    }
    return null;
  },

  renderFacetChips(items, modifierClass, emptyText) {
    if (!items || items.length === 0) {
      return `<span class="topic-branch-value">${Utils.escapeHtml(emptyText)}</span>`;
    }

    return items.map((item) => `
      <span class="insight-chip ${modifierClass}">
        <span class="insight-chip-label">${Utils.escapeHtml(item.label)}</span>
        <span class="insight-chip-count">${item.cited > 0 ? item.cited : item.aio}</span>
      </span>
    `).join('');
  },

  renderSuggestions(analysis) {
    if (!this.elements.suggestions) return;

    if (analysis.suggestions.length === 0) {
      this.elements.suggestions.innerHTML = '<span class="topic-branch-value">目前沒有需要優先補搜的題目</span>';
      return;
    }

    this.elements.suggestions.innerHTML = analysis.suggestions.map((suggestion) => `
      <span class="suggestion-chip">${Utils.escapeHtml(suggestion)}</span>
    `).join('');
  },

  show() {
    this.elements.card?.classList.remove('hidden');
  },

  reset() {
    if (this.elements.summary) this.elements.summary.innerHTML = '';
    if (this.elements.chips) this.elements.chips.innerHTML = '';
    if (this.elements.tree) this.elements.tree.innerHTML = '';
    if (this.elements.suggestions) this.elements.suggestions.innerHTML = '';
    this.elements.card?.classList.add('hidden');
  }
};
