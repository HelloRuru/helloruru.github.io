/* ================================================
   AEO Consultant — Schema Validation Rules
   結構化資料驗證規則（Google 支援類型 + 棄用類型 + 必填屬性）
   ================================================ */

const SchemaRules = {
  /**
   * Google 支援的 Schema 類型及其必填/建議屬性
   * 來源：Google Search Central + claude-seo skill validate-schema.py
   */
  SUPPORTED_TYPES: {
    Article: {
      required: ['headline', 'author', 'datePublished'],
      recommended: ['image', 'dateModified', 'publisher'],
      desc: '文章（部落格、新聞）'
    },
    NewsArticle: {
      required: ['headline', 'author', 'datePublished'],
      recommended: ['image', 'dateModified', 'publisher'],
      desc: '新聞文章'
    },
    BlogPosting: {
      required: ['headline', 'author', 'datePublished'],
      recommended: ['image', 'dateModified', 'publisher'],
      desc: '部落格文章'
    },
    FAQPage: {
      required: ['mainEntity'],
      recommended: [],
      desc: 'FAQ 頁面（2024 起僅限政府及醫療網站顯示複合搜尋結果）',
      restricted: '2024 年 8 月起僅限政府及醫療網站才會顯示 FAQ 複合搜尋結果。其他網站的 FAQPage Schema 不會顯示，但仍可保留供 AI 搜尋引擎參考。'
    },
    LocalBusiness: {
      required: ['name', 'address'],
      recommended: ['telephone', 'openingHours', 'image', 'priceRange', 'geo'],
      desc: '在地商家'
    },
    Product: {
      required: ['name'],
      recommended: ['image', 'description', 'offers', 'review', 'aggregateRating'],
      desc: '產品'
    },
    Organization: {
      required: ['name', 'url'],
      recommended: ['logo', 'sameAs', 'contactPoint'],
      desc: '組織'
    },
    Person: {
      required: ['name'],
      recommended: ['image', 'url', 'sameAs', 'jobTitle'],
      desc: '人物'
    },
    WebSite: {
      required: ['name', 'url'],
      recommended: ['potentialAction'],
      desc: '網站（可觸發搜尋框）'
    },
    WebPage: {
      required: ['name'],
      recommended: ['description', 'datePublished', 'dateModified'],
      desc: '網頁'
    },
    BreadcrumbList: {
      required: ['itemListElement'],
      recommended: [],
      desc: '麵包屑導航'
    },
    VideoObject: {
      required: ['name', 'description', 'thumbnailUrl', 'uploadDate'],
      recommended: ['duration', 'contentUrl', 'embedUrl'],
      desc: '影片'
    },
    Recipe: {
      required: ['name', 'image'],
      recommended: ['recipeIngredient', 'recipeInstructions', 'nutrition', 'prepTime', 'cookTime'],
      desc: '食譜'
    },
    Event: {
      required: ['name', 'startDate', 'location'],
      recommended: ['description', 'endDate', 'image', 'offers', 'performer'],
      desc: '活動'
    },
    Review: {
      required: ['itemReviewed', 'author'],
      recommended: ['reviewRating', 'datePublished'],
      desc: '評論'
    },
    SoftwareApplication: {
      required: ['name'],
      recommended: ['applicationCategory', 'operatingSystem', 'offers'],
      desc: '軟體應用程式'
    },
    Course: {
      required: ['name', 'description', 'provider'],
      recommended: ['courseCode', 'hasCourseInstance'],
      desc: '課程'
    },
    ItemList: {
      required: ['itemListElement'],
      recommended: [],
      desc: '項目清單（排名、Top N）'
    }
  },

  /**
   * 已棄用的 Schema 類型
   */
  DEPRECATED_TYPES: {
    HowTo: {
      since: '2023 年 9 月',
      desc: 'Google 已停止顯示 HowTo 複合搜尋結果。可以移除，或保留供 AI 搜尋引擎參考。'
    },
    SpecialAnnouncement: {
      since: '2023 年',
      desc: 'COVID-19 相關特殊公告，已過時。'
    }
  },

  /**
   * 驗證單一 JSON-LD 物件
   * @param {Object} schema - JSON-LD 物件
   * @returns {Object} { type, valid, errors, warnings, properties }
   */
  validate(schema) {
    const result = {
      type: '',
      valid: true,
      errors: [],
      warnings: [],
      properties: [],
      deprecated: false,
      restricted: false
    };

    if (!schema || typeof schema !== 'object') {
      result.valid = false;
      result.errors.push('不是有效的 JSON 物件');
      return result;
    }

    // 解析錯誤
    if (schema._parseError) {
      result.valid = false;
      result.errors.push('JSON 語法錯誤，無法解析');
      return result;
    }

    // 取得類型
    const type = this._resolveType(schema);
    result.type = type;

    if (!type) {
      result.valid = false;
      result.errors.push('缺少 @type 屬性');
      return result;
    }

    // @graph 處理
    if (schema['@graph']) {
      // @graph 裡面是多個 schema，分別驗證
      result.type = '@graph';
      result.subResults = schema['@graph'].map(item => this.validate(item));
      result.valid = result.subResults.every(r => r.valid);
      return result;
    }

    // 檢查是否已棄用
    if (this.DEPRECATED_TYPES[type]) {
      result.deprecated = true;
      result.warnings.push(`${type} 已於 ${this.DEPRECATED_TYPES[type].since} 被 Google 棄用。${this.DEPRECATED_TYPES[type].desc}`);
    }

    // 檢查是否受限
    const supported = this.SUPPORTED_TYPES[type];
    if (supported?.restricted) {
      result.restricted = true;
      result.warnings.push(supported.restricted);
    }

    // 檢查必填屬性
    if (supported) {
      for (const prop of supported.required) {
        const value = this._getNestedValue(schema, prop);
        if (value === undefined || value === null || value === '') {
          result.errors.push(`缺少必填屬性：${prop}`);
          result.valid = false;
        } else {
          result.properties.push({ name: prop, status: 'ok', required: true });
        }
      }

      // 檢查建議屬性
      for (const prop of supported.recommended) {
        const value = this._getNestedValue(schema, prop);
        if (value === undefined || value === null || value === '') {
          result.warnings.push(`缺少建議屬性：${prop}（加了會更好）`);
          result.properties.push({ name: prop, status: 'missing', required: false });
        } else {
          result.properties.push({ name: prop, status: 'ok', required: false });
        }
      }
    } else if (!this.DEPRECATED_TYPES[type]) {
      result.warnings.push(`${type} 不在 Google 支援的複合搜尋結果類型中（但 AI 搜尋引擎仍可能使用）`);
    }

    // Placeholder 偵測
    this._checkPlaceholder(schema, result);

    return result;
  },

  /**
   * 解析 @type（支援陣列、巢狀）
   */
  _resolveType(schema) {
    const t = schema['@type'];
    if (Array.isArray(t)) return t[0];
    return t || null;
  },

  /**
   * 取得巢狀屬性值
   */
  _getNestedValue(obj, key) {
    if (obj[key] !== undefined) return obj[key];
    // 簡單一層巢狀
    for (const v of Object.values(obj)) {
      if (v && typeof v === 'object' && !Array.isArray(v) && v[key] !== undefined) {
        return v[key];
      }
    }
    return undefined;
  },

  /**
   * 偵測 placeholder 文字
   */
  _checkPlaceholder(schema, result) {
    const placeholders = ['lorem ipsum', 'example', 'placeholder', 'test', 'TODO', 'xxx', 'your-'];
    const str = JSON.stringify(schema).toLowerCase();
    for (const p of placeholders) {
      if (str.includes(p)) {
        result.warnings.push(`偵測到可能的 placeholder 文字：「${p}」`);
        break;
      }
    }
  },

  /**
   * 根據頁面內容建議該用哪些 Schema
   * @param {Object} contentStructure - PageCrawler.extractContentStructure 的結果
   * @returns {Array} 建議的 Schema 類型
   */
  suggestSchemas(contentStructure) {
    const suggestions = [];

    // 所有頁面都應該有 WebPage 或 Article
    if (contentStructure.datePublished || contentStructure.author) {
      suggestions.push({
        type: 'Article',
        reason: '這個頁面有作者和發布日期，適合用 Article Schema。',
        priority: 'high'
      });
    }

    // 有 FAQ 內容
    if (contentStructure.faqPatterns.length >= 2) {
      suggestions.push({
        type: 'FAQPage',
        reason: `偵測到 ${contentStructure.faqPatterns.length} 個問答格式。雖然 Google 不再顯示 FAQ 複合搜尋結果，但 AI 搜尋引擎（Perplexity、ChatGPT）會特別抓取 FAQ Schema。`,
        priority: 'medium'
      });
    }

    // 有清單內容（可能是 Top N）
    if (contentStructure.lists > 3 && contentStructure.listItems > 10) {
      suggestions.push({
        type: 'ItemList',
        reason: '頁面有大量清單內容，如果是排名或推薦清單，加上 ItemList Schema 可以讓 AI 更容易結構化引用。',
        priority: 'low'
      });
    }

    return suggestions;
  },

  /**
   * 產生 JSON-LD 模板
   * @param {string} type - Schema 類型
   * @param {Object} data - 頁面資料（標題、URL 等）
   * @returns {string} JSON-LD 字串
   */
  generateTemplate(type, data = {}) {
    const templates = {
      Article: {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: data.title || '文章標題',
        author: { '@type': 'Person', name: data.author || '作者名字' },
        datePublished: data.datePublished || new Date().toISOString().split('T')[0],
        dateModified: data.datePublished || new Date().toISOString().split('T')[0],
        image: data.image || 'https://example.com/image.jpg',
        publisher: {
          '@type': 'Organization',
          name: data.siteName || '網站名稱',
          logo: { '@type': 'ImageObject', url: data.logo || 'https://example.com/logo.png' }
        }
      },
      FAQPage: {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          {
            '@type': 'Question',
            name: '問題一？',
            acceptedAnswer: { '@type': 'Answer', text: '回答內容。' }
          },
          {
            '@type': 'Question',
            name: '問題二？',
            acceptedAnswer: { '@type': 'Answer', text: '回答內容。' }
          }
        ]
      },
      LocalBusiness: {
        '@context': 'https://schema.org',
        '@type': 'LocalBusiness',
        name: data.title || '商家名稱',
        address: {
          '@type': 'PostalAddress',
          streetAddress: '地址',
          addressLocality: '城市',
          addressRegion: '縣市',
          addressCountry: 'TW'
        },
        telephone: '電話號碼',
        openingHours: 'Mo-Fr 09:00-18:00',
        image: data.image || 'https://example.com/image.jpg'
      },
      BreadcrumbList: {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: '首頁', item: data.siteUrl || 'https://example.com' },
          { '@type': 'ListItem', position: 2, name: data.title || '目前頁面', item: data.url || 'https://example.com/page' }
        ]
      }
    };

    const template = templates[type];
    if (!template) return null;

    return JSON.stringify(template, null, 2);
  }
};
