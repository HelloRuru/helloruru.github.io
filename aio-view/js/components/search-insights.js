/* ================================================
   AIO View — Search Insights
   使用者搜尋偏好 + 樹狀主題 + 自動結論
   ================================================ */

const SearchInsights = {
  elements: {
    card: null,
    summary: null,
    chips: null,
    tree: null,
    suggestions: null
  },

  INTENT_RULES: [
    {
      key: 'price',
      label: '價格 / CP 值',
      regex: /(價格|費用|價錢|便宜|平價|cp值|CP值|划算|預算|省錢)/
    },
    {
      key: 'recommend',
      label: '推薦 / 評價',
      regex: /(推薦|評價|口碑|名單|精選|人氣|必吃|必買|高評價)/
    },
    {
      key: 'compare',
      label: '比較 / 排名',
      regex: /(比較|排行|排名|差異|對比|vs|VS|top|TOP)/
    },
    {
      key: 'decision',
      label: '決策 / 選擇',
      regex: /(哪家|怎麼選|如何選|值得|適合|推嗎|好嗎|找哪家)/
    },
    {
      key: 'guide',
      label: '教學 / 入門',
      regex: /(怎麼|教學|入門|新手|課程|方法|流程|指南)/
    },
    {
      key: 'brand',
      label: '品牌 / 商品',
      regex: /(品牌|牌子|型號|系列|門市)/
    }
  ],

  TOPIC_FILLERS: [
    '高評價', '精選', '推薦', '評價', '口碑', '價格', '費用', '價錢', '便宜', '平價',
    'cp值', 'CP值', '划算', '比較', '排行', '排名', '哪家', '怎麼選', '如何選', '值得',
    '適合', '推嗎', '好嗎', '找哪家', '指南', '整理', '分享', '攻略', '必讀', '懶人包',
    '一次看', '名單', '店家', '老店', '必吃', '必買', '人氣', '附近', '哪裡', '在地人',
    '探訪', '清楚', '完整', '入門', '新手', '課程', '教學', '能學', '找'
  ],

  EXTRA_LOCATION_SUFFIXES: ['區', '市', '縣'],

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
    if (!analysis.focusItems.length) {
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
    const focusItems = items.filter(item => item.isCited);
    const secondaryItems = items.filter(item => item.hasAIO === true);
    const workingItems = focusItems.length > 0
      ? focusItems
      : (secondaryItems.length > 0 ? secondaryItems : items);

    const intentCounts = {};
    const locationCounts = {};
    const topicMap = new Map();

    workingItems.forEach((item) => {
      const query = String(item.query || '').trim();
      if (!query) return;

      const intents = this.detectIntents(query);
      const locations = this.extractLocations(query);
      const topic = this.extractTopic(query, locations);
      const topicKey = topic || query;

      intents.forEach((intent) => {
        intentCounts[intent.key] = (intentCounts[intent.key] || 0) + 1;
      });

      locations.forEach((location) => {
        locationCounts[location] = (locationCounts[location] || 0) + 1;
      });

      if (!topicMap.has(topicKey)) {
        topicMap.set(topicKey, {
          name: topicKey,
          queries: [],
          intents: {},
          locations: {},
          cited: 0,
          aio: 0
        });
      }

      const entry = topicMap.get(topicKey);
      entry.queries.push(query);
      entry.cited += item.isCited ? 1 : 0;
      entry.aio += item.hasAIO === true ? 1 : 0;

      intents.forEach((intent) => {
        entry.intents[intent.label] = (entry.intents[intent.label] || 0) + 1;
      });

      locations.forEach((location) => {
        entry.locations[location] = (entry.locations[location] || 0) + 1;
      });
    });

    const topIntents = this.sortCounts(intentCounts, [
      ...this.INTENT_RULES.map(rule => ({
        key: rule.key,
        label: rule.label
      })),
      { key: 'local', label: '在地 / 附近' },
      { key: 'generic', label: '一般需求' }
    ]);
    const topLocations = this.sortCounts(locationCounts);
    const topics = Array.from(topicMap.values())
      .map((entry) => ({
        ...entry,
        intentsList: this.sortCounts(entry.intents),
        locationsList: this.sortCounts(entry.locations),
        representativeQueries: Array.from(new Set(entry.queries)).slice(0, 3)
      }))
      .sort((a, b) => (
        b.cited - a.cited
        || b.aio - a.aio
        || b.queries.length - a.queries.length
        || a.name.length - b.name.length
      ))
      .slice(0, 8);

    return {
      items,
      focusItems: workingItems,
      topIntents,
      topLocations,
      topics,
      suggestions: this.buildSuggestions(topics, topLocations, topIntents)
    };
  },

  detectIntents(query) {
    const intents = this.INTENT_RULES.filter(rule => rule.regex.test(query));

    if (this.extractLocations(query).length > 0 || /(附近|哪裡)/.test(query)) {
      intents.push({ key: 'local', label: '在地 / 附近' });
    }

    if (intents.length === 0) {
      intents.push({ key: 'generic', label: '一般需求' });
    }

    const seen = new Set();
    return intents.filter((intent) => {
      if (seen.has(intent.key)) return false;
      seen.add(intent.key);
      return true;
    });
  },

  extractLocations(query) {
    const baseLocations = Array.isArray(QueryEngine?.LOCATIONS) ? QueryEngine.LOCATIONS : [];
    const candidates = [];

    baseLocations.forEach((location) => {
      candidates.push(location);
      this.EXTRA_LOCATION_SUFFIXES.forEach((suffix) => {
        candidates.push(`${location}${suffix}`);
      });
    });

    const matched = candidates
      .filter(location => query.includes(location))
      .sort((a, b) => b.length - a.length);

    const unique = [];
    matched.forEach((location) => {
      if (unique.some(saved => saved.includes(location) || location.includes(saved))) {
        return;
      }
      unique.push(location);
    });

    return unique.slice(0, 2);
  },

  extractTopic(query, locations) {
    let topic = String(query || '');

    locations.forEach((location) => {
      topic = topic.replaceAll(location, ' ');
    });

    this.TOPIC_FILLERS.forEach((word) => {
      topic = topic.replaceAll(word, ' ');
    });

    topic = topic
      .replace(/[0-9０-９]+/g, ' ')
      .replace(/[|｜\-–—,，。！？!?\s]+/g, ' ')
      .trim();

    const collapsed = topic
      .replace(/\s+/g, '')
      .replace(/(推薦|評價|比較|價格|便宜|平價|找|買|學)$/u, '');
    if (collapsed.length >= 2) {
      return collapsed;
    }

    return String(query || '').replace(/\s+/g, '').slice(0, 12);
  },

  sortCounts(counts, labelMap = null) {
    const map = labelMap
      ? Object.fromEntries(labelMap.map(item => [item.key, item.label]))
      : null;

    return Object.entries(counts)
      .map(([key, count]) => ({
        key,
        label: map?.[key] || key,
        count
      }))
      .sort((a, b) => b.count - a.count || a.label.length - b.label.length);
  },

  buildSuggestions(topics, topLocations, topIntents) {
    const suggestions = [];

    topics.slice(0, 4).forEach((topic) => {
      const location = topic.locationsList[0]?.label || topLocations[0]?.label || '';
      const prefix = location && !topic.name.includes(location) ? location : '';

      if (topIntents.some(intent => intent.key === 'price')) {
        suggestions.push(`${prefix}${topic.name}價格比較`);
      }
      if (topIntents.some(intent => intent.key === 'decision')) {
        suggestions.push(`${prefix}${topic.name}哪家好`);
      }
      if (topIntents.some(intent => intent.key === 'guide')) {
        suggestions.push(`${prefix}${topic.name}怎麼選`);
      }

      suggestions.push(`${prefix}${topic.name}推薦`);
    });

    return Array.from(new Set(suggestions))
      .map(text => text.replace(/\s+/g, ''))
      .filter(text => text.length >= 4)
      .slice(0, 4);
  },

  renderSummary(analysis) {
    if (!this.elements.summary) return;

    const topIntentLabels = analysis.topIntents.slice(0, 2).map(item => item.label);
    const topLocation = analysis.topLocations[0]?.label || '';
    const topTopics = analysis.topics.slice(0, 3).map(item => item.name);
    const pattern = this.describePattern(analysis.topIntents);

    const sentence1 = topIntentLabels.length > 0
      ? `這批上榜查詢以「${topIntentLabels.join('、')}」最明顯，代表使用者不只想找主題本身，還會帶著很明確的需求詞來搜。`
      : '這批上榜查詢已經開始出現穩定的搜尋意圖，可以從需求詞回推使用者真正想解的問題。';

    const sentence2 = topLocation
      ? `成功結果多半落在「${topLocation} + 主題」這種在地型查法，再疊上 ${pattern} 之後，更容易進入 AIO。`
      : `成功結果多半集中在 ${pattern} 這類查法，代表明確需求句比單純主題名更容易進入 AIO。`;

    const sentence3 = topTopics.length > 0
      ? `目前最值得延伸的主題是「${topTopics.join('」、「')}」，下一篇可以直接往這幾條再擴。`
      : '下一步建議直接補比較、價格、推薦這類延伸題，讓查詢字更貼近真實需求。';

    this.elements.summary.innerHTML = `
      <p>${Utils.escapeHtml(sentence1)}</p>
      <p>${Utils.escapeHtml(sentence2)}</p>
      <p>${Utils.escapeHtml(sentence3)}</p>
    `;
  },

  describePattern(topIntents) {
    const keys = topIntents.slice(0, 3).map(item => item.key);

    if (keys.includes('local') && keys.includes('recommend')) {
      return '「地區 + 主題 + 推薦 / 評價」';
    }
    if (keys.includes('price') && keys.includes('recommend')) {
      return '「主題 + 推薦 + 價格感」';
    }
    if (keys.includes('decision')) {
      return '「主題 + 哪家 / 怎麼選」';
    }
    if (keys.includes('guide')) {
      return '「主題 + 教學 / 入門」';
    }

    return '「主題 + 明確需求詞」';
  },

  renderChips(analysis) {
    if (!this.elements.chips) return;

    const chips = analysis.topIntents.slice(0, 5).map((intent) => `
      <span class="insight-chip">
        <span class="insight-chip-label">${Utils.escapeHtml(intent.label)}</span>
        <span class="insight-chip-count">${intent.count}</span>
      </span>
    `);

    this.elements.chips.innerHTML = chips.join('');
  },

  renderTree(analysis) {
    if (!this.elements.tree) return;

    if (analysis.topics.length === 0) {
      this.elements.tree.innerHTML = '<div class="chart-empty">目前還沒有足夠的主題資料</div>';
      return;
    }

    this.elements.tree.innerHTML = analysis.topics.map((topic, index) => `
      <details class="topic-node"${index < 2 ? ' open' : ''}>
        <summary class="topic-node-summary">
          <span class="topic-node-title">${Utils.escapeHtml(topic.name)}</span>
          <span class="topic-node-meta">上榜 ${topic.aio} 次${topic.cited > 0 ? ` / 被引用 ${topic.cited} 次` : ''}</span>
        </summary>
        <div class="topic-node-body">
          <div class="topic-branch">
            <span class="topic-branch-label">地區</span>
            <span class="topic-branch-value">${Utils.escapeHtml(
              topic.locationsList.slice(0, 2).map(item => item.label).join('、') || '未明顯帶地區'
            )}</span>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">意圖</span>
            <span class="topic-branch-value">${Utils.escapeHtml(
              topic.intentsList.slice(0, 3).map(item => item.label).join('、') || '一般需求'
            )}</span>
          </div>
          <div class="topic-branch">
            <span class="topic-branch-label">代表查詢</span>
            <div class="topic-query-list">
              ${topic.representativeQueries.map(query => `
                <code class="topic-query-item">${Utils.escapeHtml(query)}</code>
              `).join('')}
            </div>
          </div>
        </div>
      </details>
    `).join('');
  },

  renderSuggestions(analysis) {
    if (!this.elements.suggestions) return;

    if (analysis.suggestions.length === 0) {
      this.elements.suggestions.innerHTML = '';
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
    this.elements.summary && (this.elements.summary.innerHTML = '');
    this.elements.chips && (this.elements.chips.innerHTML = '');
    this.elements.tree && (this.elements.tree.innerHTML = '');
    this.elements.suggestions && (this.elements.suggestions.innerHTML = '');
    this.elements.card?.classList.add('hidden');
  }
};
