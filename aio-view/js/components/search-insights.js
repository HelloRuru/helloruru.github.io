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
    if (verdict === 'validated') return '已驗證';
    if (verdict === 'partial') return '部分驗證';
    return '待補驗證';
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
    const source = missingFacets.length > 0 ? missingFacets : attemptedFacets;
    return source
      .map(facet => facet.query)
      .filter(Boolean)
      .slice(0, 4);
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
          <span class="topic-node-meta">${Utils.escapeHtml(article.verdictLabel)} · 已驗 ${article.verifiedFacets.length}/${article.totalFacets} 面向</span>
        </summary>
        <div class="topic-node-body">
          <div class="topic-branch">
            <span class="topic-branch-label">判讀</span>
            <span class="topic-branch-value">${Utils.escapeHtml(article.summary)}</span>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">地區 / 核心字</span>
            <span class="topic-branch-value">${Utils.escapeHtml(
              article.locations.length > 0
                ? `${article.locations.join('、')} / ${article.baseQuery || article.title}`
                : (article.baseQuery || article.title)
            )}</span>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">已驗證面向</span>
            <div class="topic-query-list">
              ${this.renderFacetChips(article.verifiedFacets, 'facet-chip-success', '目前還沒有')}
            </div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">已搜但沒命中</span>
            <div class="topic-query-list">
              ${this.renderFacetChips(article.attemptedFacets, 'facet-chip-warning', '目前沒有')}
            </div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">還沒補驗證</span>
            <div class="topic-query-list">
              ${this.renderFacetChips(article.missingFacets, 'facet-chip-muted', '已補完')}</div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">已命中查詢</span>
            <div class="topic-query-list">
              ${article.representativeQueries.length > 0
                ? article.representativeQueries.map(query => `
                    <code class="topic-query-item">${Utils.escapeHtml(query)}</code>
                  `).join('')
                : '<span class="topic-branch-value">目前還沒有命中的代表查詢</span>'}
            </div>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">建議補搜</span>
            <div class="suggestion-chip-row">
              ${article.suggestions.length > 0
                ? article.suggestions.map(query => `
                    <span class="suggestion-chip">${Utils.escapeHtml(query)}</span>
                  `).join('')
                : '<span class="topic-branch-value">目前沒有額外要補的題目</span>'}
            </div>
          </div>
        </div>
      </details>
    `).join('');
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
