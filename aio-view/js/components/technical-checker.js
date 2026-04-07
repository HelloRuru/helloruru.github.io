/* ================================================
   AEO Consultant — Technical Checker
   技術面檢查：robots.txt + Sitemap 健康度 + AI 爬蟲封鎖偵測
   ================================================ */

const TechnicalChecker = {
  /** 檢查結果 */
  results: null,

  /** 目前網域 */
  domain: '',

  /**
   * 初始化
   */
  init() {
    this.bindEvents();
  },

  /**
   * 綁定事件
   */
  bindEvents() {
    // 監聽首頁 URL 輸入事件
    document.addEventListener('aeo:url-entered', (e) => {
      this.runCheck(e.detail.domain, e.detail.sourceUrl);
    });
    document.addEventListener('aeo:sitemap-found', (e) => {
      this.runCheck(e.detail.domain, e.detail.sourceUrl, e.detail.sitemapUrl);
    });
  },

  /**
   * 執行技術面檢查
   * @param {string} domain - 網域
   * @param {string} sourceUrl - 原始 URL
   * @param {string} [sitemapUrl] - sitemap URL（可選）
   */
  async runCheck(domain, sourceUrl, sitemapUrl) {
    this.domain = domain;
    const origin = new URL(sourceUrl.startsWith('http') ? sourceUrl : 'https://' + sourceUrl).origin;

    Landing.addProgress('technical', '正在檢查技術面設定...');

    const results = {
      domain,
      date: new Date().toISOString().split('T')[0],
      robotsTxt: null,
      botAccess: [],
      sitemap: null,
      fixes: [],
      score: 0
    };

    // 1. 抓 robots.txt
    try {
      const robotsUrl = origin + '/robots.txt';
      const robotsText = await Sitemap.fetchProxyContent(robotsUrl);

      if (robotsText && !robotsText.includes('<html') && !robotsText.includes('<!DOCTYPE')) {
        results.robotsTxt = {
          found: true,
          content: robotsText,
          url: robotsUrl
        };

        // 檢查 AI bot 存取權限
        results.botAccess = AiCrawlers.checkBotAccess(robotsText);
        results.fixes.push(...AiCrawlers.generateFixes(results.botAccess));
      } else {
        results.robotsTxt = { found: false, url: robotsUrl };
        results.fixes.push({
          priority: 2,
          title: '找不到 robots.txt',
          desc: '沒有 robots.txt 代表所有爬蟲都可以存取，但建議還是建一個，明確允許 AI 爬蟲。',
          action: '建立 robots.txt 並加入以下內容：',
          code: 'User-agent: *\nAllow: /\n\nSitemap: ' + origin + '/sitemap.xml'
        });
      }
    } catch {
      results.robotsTxt = { found: false, error: '無法存取' };
    }

    // 2. Sitemap 檢查
    if (sitemapUrl) {
      results.sitemap = {
        found: true,
        url: sitemapUrl
      };
    } else {
      results.sitemap = { found: false };
      results.fixes.push({
        priority: 2,
        title: '找不到 Sitemap',
        desc: 'Sitemap 幫助搜尋引擎（包括 AI 搜尋引擎）更有效率地找到你的所有頁面。',
        action: '建立 sitemap.xml 並在 robots.txt 中加入指向：',
        code: `Sitemap: ${origin}/sitemap.xml`
      });
    }

    // 3. 計算分數
    results.score = this._calculateScore(results);

    // 4. 儲存結果
    this.results = results;
    try {
      await SiteDB.saveResult(SiteDB.STORES.TECHNICAL_RESULTS, results);
    } catch {
      // 儲存失敗不影響顯示
    }

    // 5. 更新 UI
    this.render(results);

    // 6. 更新首頁卡片
    const grade = this._scoreToGrade(results.score);
    Landing.updateFeatureScore('technical', grade.text, grade.class);
    Landing.updateProgress('technical', 'done', `技術面檢查完成：${grade.text}`);
  },

  /**
   * 計算技術面分數
   * @param {Object} results
   * @returns {number} 0-100
   */
  _calculateScore(results) {
    let score = 100;

    // robots.txt 存在 (+0, 不存在 -10)
    if (!results.robotsTxt?.found) score -= 10;

    // Sitemap 存在 (+0, 不存在 -15)
    if (!results.sitemap?.found) score -= 15;

    // AI bot 存取
    if (results.botAccess.length > 0) {
      const blocked = results.botAccess.filter(b => b.blocked);
      const blockedCritical = blocked.filter(b => b.critical);
      score -= blockedCritical.length * 15; // 每個重要 bot 被封鎖 -15
      score -= (blocked.length - blockedCritical.length) * 5; // 次要 bot -5
    }

    return Math.max(0, Math.min(100, score));
  },

  /**
   * 分數轉等級
   * @param {number} score
   * @returns {Object} { text, class }
   */
  _scoreToGrade(score) {
    if (score >= 90) return { text: 'A', class: 'good' };
    if (score >= 75) return { text: 'B', class: 'good' };
    if (score >= 60) return { text: 'C', class: 'warn' };
    if (score >= 40) return { text: 'D', class: 'warn' };
    return { text: 'F', class: 'bad' };
  },

  /**
   * 渲染技術面檢查結果到面板
   * @param {Object} results
   */
  render(results) {
    const panel = document.getElementById('panel-technical');
    if (!panel) return;

    const grade = this._scoreToGrade(results.score);
    const blockedCount = results.botAccess.filter(b => b.blocked).length;
    const allowedCount = results.botAccess.filter(b => b.allowed && !b.partial).length;
    const partialCount = results.botAccess.filter(b => b.partial).length;

    panel.innerHTML = `
      <div class="tech-report">
        <!-- 總分 -->
        <div class="tech-score-card">
          <div class="tech-score ${grade.class}">${results.score}</div>
          <div class="tech-score-label">技術面分數</div>
          <div class="tech-score-grade">${grade.text}</div>
        </div>

        <!-- robots.txt 狀態 -->
        <div class="tech-section">
          <h3>
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            robots.txt
            ${results.robotsTxt?.found
              ? '<span class="tech-badge tech-badge--ok">找到</span>'
              : '<span class="tech-badge tech-badge--warn">未找到</span>'}
          </h3>
        </div>

        <!-- AI 爬蟲存取權限 -->
        <div class="tech-section">
          <h3>
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></svg>
            AI 搜尋引擎爬蟲存取權限
            <span class="tech-summary">
              ${allowedCount > 0 ? `<span class="tech-badge tech-badge--ok">${allowedCount} 允許</span>` : ''}
              ${partialCount > 0 ? `<span class="tech-badge tech-badge--partial">${partialCount} 部分</span>` : ''}
              ${blockedCount > 0 ? `<span class="tech-badge tech-badge--blocked">${blockedCount} 封鎖</span>` : ''}
            </span>
          </h3>
          <div class="bot-grid">
            ${results.botAccess.map(bot => this._renderBotCard(bot)).join('')}
          </div>
        </div>

        <!-- Sitemap 狀態 -->
        <div class="tech-section">
          <h3>
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5" rx="1"/></svg>
            Sitemap
            ${results.sitemap?.found
              ? '<span class="tech-badge tech-badge--ok">找到</span>'
              : '<span class="tech-badge tech-badge--warn">未找到</span>'}
          </h3>
          ${results.sitemap?.url ? `<p class="tech-detail">${Utils.escapeHtml(results.sitemap.url)}</p>` : ''}
        </div>

        <!-- 修正建議 -->
        ${results.fixes.length > 0 ? `
          <div class="tech-section">
            <h3>
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>
              修正建議（${results.fixes.length} 項）
            </h3>
            ${results.fixes.map(fix => this._renderFix(fix)).join('')}
          </div>
        ` : `
          <div class="tech-section tech-section--good">
            <h3>全部通過！技術面設定正確。</h3>
          </div>
        `}
      </div>
    `;
  },

  /**
   * 渲染單一 bot 卡片
   * @param {Object} bot
   * @returns {string} HTML
   */
  _renderBotCard(bot) {
    const statusClass = bot.blocked ? 'blocked' : bot.partial ? 'partial' : 'ok';
    const statusIcon = bot.blocked ? '&#10007;' : bot.partial ? '&#9888;' : '&#10003;';
    const criticalTag = bot.critical ? '<span class="bot-critical">重要</span>' : '';

    return `
      <div class="bot-card bot-card--${statusClass}">
        <div class="bot-card-header">
          <span class="bot-status-icon">${statusIcon}</span>
          <span class="bot-name">${Utils.escapeHtml(bot.name)}</span>
          ${criticalTag}
        </div>
        <div class="bot-platform">${Utils.escapeHtml(bot.platform)}</div>
        <div class="bot-reason">${Utils.escapeHtml(bot.reason)}</div>
        <div class="bot-desc">${Utils.escapeHtml(bot.desc)}</div>
      </div>
    `;
  },

  /**
   * 渲染修正建議
   * @param {Object} fix
   * @returns {string} HTML
   */
  _renderFix(fix) {
    const priorityClass = fix.priority === 1 ? 'critical' : fix.priority === 2 ? 'high' : 'medium';
    const priorityLabel = fix.priority === 1 ? '阻斷級' : fix.priority === 2 ? '高影響' : '中影響';

    return `
      <div class="tech-fix tech-fix--${priorityClass}">
        <div class="tech-fix-header">
          <span class="tech-fix-priority">${priorityLabel}</span>
          <span class="tech-fix-title">${Utils.escapeHtml(fix.title)}</span>
        </div>
        <p class="tech-fix-desc">${Utils.escapeHtml(fix.desc)}</p>
        ${fix.action ? `<p class="tech-fix-action">${Utils.escapeHtml(fix.action)}</p>` : ''}
        ${fix.code ? `
          <div class="tech-fix-code">
            <pre>${Utils.escapeHtml(fix.code)}</pre>
            <button class="btn btn-ghost btn-sm tech-copy-btn" onclick="Utils.copyToClipboard(this.previousElementSibling.textContent).then(ok => { if(ok) Toast.success('已複製'); })">
              複製
            </button>
          </div>
        ` : ''}
      </div>
    `;
  },

  /**
   * 顯示面板
   */
  show() {
    if (this.results) {
      this.render(this.results);
    }
  }
};
