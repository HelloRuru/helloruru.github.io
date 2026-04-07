/* ================================================
   AEO Consultant — Schema Checker Component
   結構化資料健檢 UI
   ================================================ */

const SchemaChecker = {
  results: null,
  domain: '',

  init() {
    document.addEventListener('aeo:sitemap-found', (e) => {
      this.runCheck(e.detail.domain, e.detail.sitemapUrl);
    });
    document.addEventListener('aeo:sitemap-generated', (e) => {
      this.runCheckWithArticles(e.detail.domain, e.detail.articles);
    });
  },

  /**
   * 用已有的文章清單跑檢查（不需要 sitemap URL）
   */
  async runCheckWithArticles(domain, articles) {
    this.domain = domain;
    Landing.addProgress('schema', '正在掃描結構化資料...');

    const limited = (articles || []).slice(0, PageCrawler.MAX_PAGES);
    if (limited.length === 0) {
      Landing.updateProgress('schema', 'warn', '沒有頁面可分析');
      return;
    }

    // 直接用文章 URL 跑爬取 + 分析（跟 runCheck 後半段一樣）
    this._runAnalysis(domain, limited.map(a => a.url));
  },

  async runCheck(domain, sitemapUrl) {
    this.domain = domain;
    Landing.addProgress('schema', '正在掃描結構化資料...');

    let articles = [];
    try {
      const result = await Sitemap.fetch(sitemapUrl);
      articles = (result?.articles || []).slice(0, PageCrawler.MAX_PAGES);
    } catch {
      Landing.updateProgress('schema', 'error', '無法解析 Sitemap');
      return;
    }

    if (articles.length === 0) {
      Landing.updateProgress('schema', 'warn', 'Sitemap 裡沒有文章頁面');
      return;
    }

    await this._runAnalysis(domain, articles.map(a => a.url));
  },

  async _runAnalysis(domain, urls) {
    this.domain = domain;
    const crawlResult = await PageCrawler.crawlPages(urls, domain, {
      onProgress: (p) => {
        Landing.updateProgress('schema', 'running',
          `結構化資料掃描中... ${p.done}/${p.total} 頁`);
      }
    });

    // 3. 分析每頁的 Schema
    const pageResults = [];
    let hasSchema = 0;
    let noSchema = 0;
    let hasErrors = 0;
    let hasWarnings = 0;

    for (const page of crawlResult.pages) {
      if (!page.ok || !page.html) {
        pageResults.push({ url: page.url, status: 'failed', schemas: [] });
        continue;
      }

      const jsonLdList = PageCrawler.extractJsonLd(page.html);
      const contentStructure = PageCrawler.extractContentStructure(page.html);
      const validations = jsonLdList.map(s => SchemaRules.validate(s));
      const suggestions = SchemaRules.suggestSchemas(contentStructure);

      const pageErrors = validations.flatMap(v => v.errors || []);
      const pageWarnings = validations.flatMap(v => v.warnings || []);
      const types = validations.map(v => v.type).filter(Boolean);

      let status = 'ok';
      if (jsonLdList.length === 0) {
        status = 'none';
        noSchema++;
      } else if (pageErrors.length > 0) {
        status = 'error';
        hasErrors++;
        hasSchema++;
      } else if (pageWarnings.length > 0) {
        status = 'warn';
        hasWarnings++;
        hasSchema++;
      } else {
        hasSchema++;
      }

      pageResults.push({
        url: page.url,
        title: contentStructure.title || contentStructure.h1 || page.url,
        status,
        schemas: jsonLdList,
        validations,
        types,
        errors: pageErrors,
        warnings: pageWarnings,
        suggestions,
        contentStructure
      });
    }

    // 4. 組合結果
    const score = this._calculateScore(pageResults);
    this.results = {
      domain,
      date: new Date().toISOString().split('T')[0],
      pages: pageResults,
      summary: { total: pageResults.length, hasSchema, noSchema, hasErrors, hasWarnings },
      score
    };

    // 5. 儲存
    try {
      await SiteDB.saveResult(SiteDB.STORES.SCHEMA_RESULTS, this.results);
    } catch { /* 不影響顯示 */ }

    // 6. 更新 UI
    this.render();

    // 7. 更新首頁
    const grade = this._scoreToGrade(score);
    Landing.updateFeatureScore('schema', grade.text, grade.class);
    Landing.updateProgress('schema', 'done', `結構化資料掃描完成：${grade.text}`);
  },

  _calculateScore(pages) {
    if (pages.length === 0) return 0;
    const valid = pages.filter(p => p.status !== 'failed');
    if (valid.length === 0) return 0;

    const withSchema = valid.filter(p => p.status !== 'none').length;
    const ratio = withSchema / valid.length;
    const errorPenalty = valid.filter(p => p.status === 'error').length * 5;
    return Math.max(0, Math.min(100, Math.round(ratio * 100) - errorPenalty));
  },

  _scoreToGrade(score) {
    if (score >= 90) return { text: 'A', class: 'good' };
    if (score >= 75) return { text: 'B', class: 'good' };
    if (score >= 60) return { text: 'C', class: 'warn' };
    if (score >= 40) return { text: 'D', class: 'warn' };
    return { text: 'F', class: 'bad' };
  },

  render() {
    const panel = document.getElementById('panel-schema');
    if (!panel || !this.results) return;

    const r = this.results;
    const s = r.summary;
    const grade = this._scoreToGrade(r.score);

    // 按嚴重度排序：error > warn > none > ok > failed
    const order = { error: 0, warn: 1, none: 2, ok: 3, failed: 4 };
    const sorted = [...r.pages].sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));

    panel.innerHTML = `
      <div class="tech-report">
        <div class="tech-score-card">
          <div class="tech-score ${grade.class}">${r.score}</div>
          <div>
            <div class="tech-score-label">結構化資料分數</div>
            <div style="font-size:12px;color:var(--color-gray);margin-top:4px;">${s.total} 頁掃描完成</div>
          </div>
          <div class="tech-score-grade">${grade.text}</div>
        </div>

        <div class="schema-stats-row">
          <div class="schema-stat">
            <span class="schema-stat-num good">${s.hasSchema}</span>
            <span>有 Schema</span>
          </div>
          <div class="schema-stat">
            <span class="schema-stat-num ${s.noSchema > 0 ? 'bad' : 'muted'}">${s.noSchema}</span>
            <span>缺 Schema</span>
          </div>
          <div class="schema-stat">
            <span class="schema-stat-num ${s.hasErrors > 0 ? 'bad' : 'muted'}">${s.hasErrors}</span>
            <span>有錯誤</span>
          </div>
          <div class="schema-stat">
            <span class="schema-stat-num ${s.hasWarnings > 0 ? 'warn' : 'muted'}">${s.hasWarnings}</span>
            <span>有警告</span>
          </div>
        </div>

        <div class="tech-section">
          <h3>逐頁報告（點擊展開詳細）</h3>
          <div class="schema-page-list">
            ${sorted.map((p, i) => this._renderPageCard(p, i)).join('')}
          </div>
        </div>
      </div>
    `;

    // 綁定展開事件
    panel.querySelectorAll('.schema-page-card').forEach(card => {
      card.addEventListener('click', () => card.classList.toggle('expanded'));
    });
  },

  _renderPageCard(page, index) {
    if (page.status === 'failed') {
      return `<div class="schema-page-card schema-page-card--none">
        <div class="schema-page-header">
          <span class="schema-page-url">${Utils.escapeHtml(this._shortUrl(page.url))}</span>
          <span class="tech-badge tech-badge--warn">無法存取</span>
        </div>
      </div>`;
    }

    const statusClass = 'schema-page-card--' + page.status;
    const typeChips = page.types.map(t => {
      const deprecated = SchemaRules.DEPRECATED_TYPES[t];
      const cls = deprecated ? 'schema-type-chip--deprecated' : '';
      return `<span class="schema-type-chip ${cls}">${Utils.escapeHtml(t)}</span>`;
    }).join('');

    const statusBadge = {
      ok: '<span class="tech-badge tech-badge--ok">通過</span>',
      warn: '<span class="tech-badge tech-badge--warn">有警告</span>',
      error: '<span class="tech-badge tech-badge--blocked">有錯誤</span>',
      none: '<span class="tech-badge" style="background:rgba(122,144,152,0.12);color:var(--color-gray);">缺 Schema</span>'
    }[page.status] || '';

    // 詳細內容
    let detail = '';

    // 錯誤
    if (page.errors?.length > 0) {
      detail += `<div class="schema-errors">${page.errors.map(e => `<div>&#10007; ${Utils.escapeHtml(e)}</div>`).join('')}</div>`;
    }

    // 警告
    if (page.warnings?.length > 0) {
      detail += `<div class="schema-warnings">${page.warnings.map(w => `<div>&#9888; ${Utils.escapeHtml(w)}</div>`).join('')}</div>`;
    }

    // 屬性清單
    if (page.validations) {
      for (const v of page.validations) {
        if (v.properties?.length > 0) {
          detail += `<div class="schema-prop-list">`;
          for (const prop of v.properties) {
            const cls = prop.status === 'ok'
              ? 'schema-prop--ok'
              : prop.required ? 'schema-prop--req' : 'schema-prop--miss';
            const icon = prop.status === 'ok' ? '&#10003;' : prop.required ? '&#10007;' : '&#9888;';
            const tag = prop.required ? '必填' : '建議';
            detail += `<div class="schema-prop ${cls}">
              <span class="schema-prop-icon">${icon}</span>
              <span class="schema-prop-name">${Utils.escapeHtml(prop.name)}</span>
              <span class="schema-prop-tag">${tag}</span>
            </div>`;
          }
          detail += `</div>`;
        }
      }
    }

    // 缺 Schema 時給建議 + 模板
    if (page.status === 'none' && page.suggestions?.length > 0) {
      for (const sug of page.suggestions) {
        const template = SchemaRules.generateTemplate(sug.type, {
          title: page.contentStructure?.title || page.contentStructure?.h1,
          author: page.contentStructure?.author,
          datePublished: page.contentStructure?.datePublished,
          url: page.url,
          siteUrl: 'https://' + this.domain
        });

        detail += `<div class="schema-suggestion">
          <div class="schema-suggestion-title">建議加入 ${Utils.escapeHtml(sug.type)} Schema</div>
          <div class="schema-suggestion-reason">${Utils.escapeHtml(sug.reason)}</div>
          ${template ? `
            <div class="schema-fix-code">
              <pre>&lt;script type="application/ld+json"&gt;\n${Utils.escapeHtml(template)}\n&lt;/script&gt;</pre>
              <button class="btn btn-ghost btn-sm schema-copy-btn" onclick="event.stopPropagation(); Utils.copyToClipboard('<script type=\\x22application/ld+json\\x22>\\n${template.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}\\n<\\/script>').then(ok => { if(ok) Toast.success('JSON-LD 已複製'); })">複製</button>
            </div>
          ` : ''}
        </div>`;
      }
    }

    return `
      <div class="schema-page-card ${statusClass}">
        <div class="schema-page-header">
          <span class="schema-page-url">${Utils.escapeHtml(page.title || this._shortUrl(page.url))}</span>
          <div style="display:flex;gap:4px;align-items:center;">
            <div class="schema-page-types">${typeChips}</div>
            ${statusBadge}
          </div>
        </div>
        <div class="schema-detail">${detail}</div>
      </div>
    `;
  },

  _shortUrl(url) {
    try {
      const u = new URL(url);
      return u.pathname.length > 1 ? u.pathname : url;
    } catch {
      return url;
    }
  },

  show() {
    if (this.results) this.render();
  }
};
