/* ================================================
   AEO Consultant — Citability Analyzer Component
   AI 可引用度分析 UI
   ================================================ */

const CitabilityAnalyzer = {
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

  async runCheckWithArticles(domain, articles) {
    this.domain = domain;
    Landing.addProgress('citability', '正在分析 AI 可引用度...');

    const limited = (articles || []).slice(0, PageCrawler.MAX_PAGES);
    if (limited.length === 0) {
      Landing.updateProgress('citability', 'warn', '沒有頁面可分析');
      return;
    }

    await this._runAnalysis(domain, limited.map(a => a.url));
  },

  async runCheck(domain, sitemapUrl) {
    this.domain = domain;
    Landing.addProgress('citability', '正在分析 AI 可引用度...');

    let articles = [];
    try {
      const result = await Sitemap.fetch(sitemapUrl);
      articles = (result?.articles || []).slice(0, PageCrawler.MAX_PAGES);
    } catch {
      Landing.updateProgress('citability', 'error', '無法解析 Sitemap');
      return;
    }

    if (articles.length === 0) {
      Landing.updateProgress('citability', 'warn', 'Sitemap 裡沒有文章頁面');
      return;
    }

    await this._runAnalysis(domain, articles.map(a => a.url));
  },

  async _runAnalysis(domain, urls) {
    this.domain = domain;
    const crawlResult = await PageCrawler.crawlPages(urls, domain, {
      onProgress: (p) => {
        Landing.updateProgress('citability', 'running',
          `AI 可引用度分析中... ${p.done}/${p.total} 頁`);
      }
    });

    const pageResults = [];
    let totalScore = 0;
    let validCount = 0;

    for (const page of crawlResult.pages) {
      if (!page.ok || !page.html) {
        pageResults.push({ url: page.url, score: 0, grade: { text: '-', class: 'muted' }, checks: [], failed: true });
        continue;
      }

      const structure = PageCrawler.extractContentStructure(page.html);
      const result = CitabilityRules.score(structure);

      pageResults.push({
        url: page.url,
        title: structure.title || structure.h1 || page.url,
        ...result,
        failed: false
      });

      totalScore += result.score;
      validCount++;
    }

    const siteScore = validCount > 0 ? Math.round(totalScore / validCount) : 0;
    const siteGrade = this._scoreToGrade(siteScore);

    this.results = {
      domain,
      date: new Date().toISOString().split('T')[0],
      pages: pageResults,
      siteScore,
      siteGrade
    };

    try {
      await SiteDB.saveResult(SiteDB.STORES.CITABILITY_RESULTS, this.results);
    } catch { /* */ }

    this.render();
    Landing.updateFeatureScore('citability', `${siteScore}`, siteGrade.class);
    Landing.updateProgress('citability', 'done', `AI 可引用度分析完成：${siteScore}/100`);
  },

  _scoreToGrade(score) {
    if (score >= 85) return { text: 'A', class: 'good' };
    if (score >= 70) return { text: 'B', class: 'good' };
    if (score >= 55) return { text: 'C', class: 'warn' };
    if (score >= 35) return { text: 'D', class: 'warn' };
    return { text: 'F', class: 'bad' };
  },

  render() {
    const panel = document.getElementById('panel-citability');
    if (!panel || !this.results) return;

    const r = this.results;
    const sorted = [...r.pages].filter(p => !p.failed).sort((a, b) => a.score - b.score);

    panel.innerHTML = `
      <div class="tech-report">
        <div class="tech-score-card">
          <div class="tech-score ${r.siteGrade.class}">${r.siteScore}</div>
          <div>
            <div class="tech-score-label">全站 AI 可引用度</div>
            <div style="font-size:12px;color:var(--color-gray);margin-top:4px;">${sorted.length} 頁平均分數</div>
          </div>
          <div class="tech-score-grade">${r.siteGrade.text}</div>
        </div>

        ${this._renderQuickWins(sorted)}

        <div class="tech-section">
          <h3>逐頁評分（由低到高）</h3>
          <div class="cita-page-list">
            ${sorted.map(p => this._renderPageCard(p)).join('')}
          </div>
        </div>
      </div>
    `;
  },

  _renderQuickWins(pages) {
    // 找出最常失敗的檢查項目
    const failCounts = {};
    for (const page of pages) {
      for (const check of page.checks) {
        if (!check.passed) {
          failCounts[check.id] = (failCounts[check.id] || 0) + 1;
        }
      }
    }

    const topFails = Object.entries(failCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, count]) => {
        const rule = CitabilityRules.CHECKS.find(c => c.id === id);
        return { ...rule, failCount: count, totalPages: pages.length };
      });

    if (topFails.length === 0) return '';

    return `
      <div class="tech-section">
        <h3>
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          最大改善機會（全站最常扣分的項目）
        </h3>
        ${topFails.map(f => `
          <div class="tech-fix tech-fix--${f.weight >= 12 ? 'critical' : 'high'}">
            <div class="tech-fix-header">
              <span class="tech-fix-priority">${f.failCount}/${f.totalPages} 頁扣分</span>
              <span class="tech-fix-title">${Utils.escapeHtml(f.label)}</span>
            </div>
            <p class="tech-fix-desc">${Utils.escapeHtml(f.desc)}</p>
            <p class="tech-fix-action">${Utils.escapeHtml(f.hint)}</p>
          </div>
        `).join('')}
      </div>
    `;
  },

  _renderPageCard(page) {
    const barClass = page.score >= 70 ? 'good' : page.score >= 45 ? 'warn' : 'bad';
    const scoreClass = page.grade?.class || 'muted';

    const checksHtml = page.checks.map(c => {
      const cls = c.passed ? 'cita-check--pass' : 'cita-check--fail';
      const icon = c.passed ? '&#10003;' : '&#10007;';
      const pts = c.passed ? `+${c.weight}` : `-${c.weight}`;

      let hintHtml = '';
      if (!c.passed) {
        hintHtml = `<div class="cita-hint">${Utils.escapeHtml(c.hint)}</div>`;
      }

      return `
        <div class="cita-check ${cls}">
          <span class="cita-check-icon">${icon}</span>
          <span class="cita-check-label">${Utils.escapeHtml(c.label)}</span>
          <span class="cita-check-pts">${pts}</span>
        </div>
        ${hintHtml}
      `;
    }).join('');

    return `
      <div class="cita-page-card">
        <div class="cita-page-header">
          <span class="cita-page-url">${Utils.escapeHtml(page.title || this._shortUrl(page.url))}</span>
          <span class="cita-page-score ${scoreClass}">${page.score}</span>
        </div>
        <div class="cita-bar"><div class="cita-bar-fill ${barClass}" style="width:${page.score}%"></div></div>
        <div class="cita-checks">${checksHtml}</div>
      </div>
    `;
  },

  _shortUrl(url) {
    try { return new URL(url).pathname || url; } catch { return url; }
  },

  show() {
    if (this.results) this.render();
  }
};
