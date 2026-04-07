/* ================================================
   AEO Consultant — Recommendations Engine
   整合所有分析結果，產出優先順序排好的行動清單
   ================================================ */

const Recommendations = {
  items: [],
  domain: '',

  PRIORITY_LABELS: {
    1: '阻斷級',
    2: '高影響',
    3: '中影響',
    4: '打磨級'
  },

  init() {
    // 監聽各功能完成事件（延遲觸發，等所有分析跑完）
    this._pendingChecks = new Set(['technical', 'schema', 'citability']);
    this._completedChecks = new Set();

    // 當 Landing 更新 featureScore 時觸發
    const origUpdate = Landing.updateFeatureScore.bind(Landing);
    Landing.updateFeatureScore = (featureId, scoreText, scoreClass) => {
      origUpdate(featureId, scoreText, scoreClass);
      if (this._pendingChecks.has(featureId)) {
        this._completedChecks.add(featureId);
        // 全部完成才跑建議
        if (this._completedChecks.size >= this._pendingChecks.size) {
          this.generate();
        }
      }
    };
  },

  /**
   * 從各功能結果產生建議
   */
  generate() {
    this.items = [];
    this.domain = Landing.domain;

    // 1. 技術面建議
    if (TechnicalChecker.results) {
      const t = TechnicalChecker.results;
      if (t.fixes) {
        for (const fix of t.fixes) {
          this.items.push({
            id: `tech-${this.items.length}`,
            source: 'technical',
            priority: fix.priority,
            title: fix.title,
            desc: fix.desc,
            action: fix.action,
            code: fix.code,
            done: false
          });
        }
      }
    }

    // 2. Schema 建議
    if (SchemaChecker.results) {
      const s = SchemaChecker.results;
      const noSchema = s.pages.filter(p => p.status === 'none');
      const hasErrors = s.pages.filter(p => p.status === 'error');

      if (noSchema.length > 0) {
        this.items.push({
          id: `schema-missing`,
          source: 'schema',
          priority: 2,
          title: `${noSchema.length} 個頁面完全沒有 Schema Markup`,
          desc: `沒有結構化資料的頁面在 AI 搜尋結果中幾乎不會被引用。至少加上 Article 或 WebPage Schema。`,
          action: '到「結構化資料」分頁查看每頁的具體建議和現成模板。',
          affectedUrls: noSchema.slice(0, 5).map(p => p.url),
          done: false
        });
      }

      if (hasErrors.length > 0) {
        this.items.push({
          id: `schema-errors`,
          source: 'schema',
          priority: 2,
          title: `${hasErrors.length} 個頁面的 Schema 有錯誤`,
          desc: `有語法錯誤或缺少必填屬性的 Schema 不會被搜尋引擎讀取，等於白做。`,
          action: '到「結構化資料」分頁展開各頁查看錯誤和修正方式。',
          affectedUrls: hasErrors.slice(0, 5).map(p => p.url),
          done: false
        });
      }
    }

    // 3. 可引用度建議
    if (CitabilityAnalyzer.results) {
      const c = CitabilityAnalyzer.results;
      const lowPages = c.pages.filter(p => !p.failed && p.score < 50);

      if (lowPages.length > 0) {
        // 找最常失敗的項目
        const failCounts = {};
        for (const page of c.pages.filter(p => !p.failed)) {
          for (const check of page.checks) {
            if (!check.passed) {
              failCounts[check.id] = (failCounts[check.id] || 0) + 1;
            }
          }
        }

        const topFail = Object.entries(failCounts)
          .sort((a, b) => b[1] - a[1])[0];

        if (topFail) {
          const rule = CitabilityRules.CHECKS.find(c => c.id === topFail[0]);
          if (rule) {
            this.items.push({
              id: `cita-top-fail`,
              source: 'citability',
              priority: 3,
              title: `全站最大弱點：「${rule.label}」（${topFail[1]} 頁扣分）`,
              desc: rule.desc,
              action: rule.hint,
              done: false
            });
          }
        }

        if (lowPages.length >= 3) {
          this.items.push({
            id: `cita-low-pages`,
            source: 'citability',
            priority: 3,
            title: `${lowPages.length} 個頁面的 AI 可引用度低於 50 分`,
            desc: '這些頁面的內容結構不利於 AI 擷取引用。',
            action: '到「AI 可引用度」分頁查看每頁的扣分項目和具體修正方式。',
            affectedUrls: lowPages.slice(0, 5).map(p => p.url),
            done: false
          });
        }
      }
    }

    // 排序：priority 小的在前
    this.items.sort((a, b) => a.priority - b.priority);

    // 載入已完成狀態
    this._loadProgress();

    // 儲存 + 渲染
    this._saveToDb();
    this.render();

    // 更新首頁
    Landing.updateProgress('report', 'done', `產生了 ${this.items.length} 項優化建議`);
    const reportLink = document.getElementById('landing-report-link');
    if (reportLink && this.items.length > 0) {
      reportLink.classList.remove('hidden');
      reportLink.textContent = `查看 ${this.items.length} 項優化建議 →`;
    }
  },

  render() {
    const panel = document.getElementById('panel-report');
    if (!panel) return;

    if (this.items.length === 0) {
      panel.innerHTML = `<div class="panel-placeholder">
        <h2>優化建議</h2>
        <p>請先在首頁輸入網址開始分析</p>
      </div>`;
      return;
    }

    const doneCount = this.items.filter(i => i.done).length;
    const pct = Math.round((doneCount / this.items.length) * 100);

    // 分組
    const grouped = {};
    for (const item of this.items) {
      const key = item.priority;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(item);
    }

    let listHtml = '';
    for (const [priority, items] of Object.entries(grouped)) {
      const label = this.PRIORITY_LABELS[priority] || `P${priority}`;
      listHtml += `<div class="rec-category-header">// ${label}</div>`;
      listHtml += items.map(item => this._renderItem(item)).join('');
    }

    panel.innerHTML = `
      <div class="tech-report">
        <div class="tech-score-card">
          <div class="tech-score ${pct >= 80 ? 'good' : pct >= 40 ? 'warn' : 'bad'}">${this.items.length}</div>
          <div>
            <div class="tech-score-label">優化建議</div>
            <div style="font-size:12px;color:var(--color-gray);margin-top:4px;">
              已完成 ${doneCount}/${this.items.length}
            </div>
          </div>
        </div>

        <div class="rec-progress">
          <div class="rec-progress-bar"><div class="rec-progress-fill" style="width:${pct}%"></div></div>
          <span class="rec-progress-text">${pct}%</span>
        </div>

        ${listHtml}
      </div>
    `;

    // 綁定 checkbox
    panel.querySelectorAll('.rec-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = e.target.dataset.id;
        const item = this.items.find(i => i.id === id);
        if (item) {
          item.done = e.target.checked;
          this._saveProgress();
          this.render();
        }
      });
    });
  },

  _renderItem(item) {
    const priorityClass = `tech-fix--${item.priority === 1 ? 'critical' : item.priority === 2 ? 'high' : 'medium'}`;
    const doneClass = item.done ? 'done' : '';

    let urlsHtml = '';
    if (item.affectedUrls?.length > 0) {
      urlsHtml = `<div style="margin-top:6px;font-size:11px;color:var(--color-gray);">
        影響頁面：${item.affectedUrls.map(u => {
          try { return new URL(u).pathname; } catch { return u; }
        }).join('、')}
      </div>`;
    }

    return `
      <div class="tech-fix ${priorityClass} rec-item ${doneClass}">
        <input type="checkbox" class="rec-checkbox" data-id="${item.id}" ${item.done ? 'checked' : ''}>
        <div style="flex:1;">
          <div class="tech-fix-header">
            <span class="tech-fix-priority">${this.PRIORITY_LABELS[item.priority] || ''}</span>
            <span class="tech-fix-title">${Utils.escapeHtml(item.title)}</span>
          </div>
          <p class="tech-fix-desc">${Utils.escapeHtml(item.desc)}</p>
          ${item.action ? `<p class="tech-fix-action">${Utils.escapeHtml(item.action)}</p>` : ''}
          ${item.code ? `
            <div class="tech-fix-code">
              <pre>${Utils.escapeHtml(item.code)}</pre>
              <button class="btn btn-ghost btn-sm tech-copy-btn" onclick="Utils.copyToClipboard(this.previousElementSibling.textContent).then(ok => { if(ok) Toast.success('已複製'); })">複製</button>
            </div>
          ` : ''}
          ${urlsHtml}
        </div>
      </div>
    `;
  },

  _saveProgress() {
    const progress = {};
    for (const item of this.items) {
      if (item.done) progress[item.id] = true;
    }
    localStorage.setItem('aeo_consultant_rec_progress', JSON.stringify(progress));
  },

  _loadProgress() {
    try {
      const saved = JSON.parse(localStorage.getItem('aeo_consultant_rec_progress') || '{}');
      for (const item of this.items) {
        if (saved[item.id]) item.done = true;
      }
    } catch { /* */ }
  },

  async _saveToDb() {
    try {
      await SiteDB.saveResult(SiteDB.STORES.RECOMMENDATIONS, {
        domain: this.domain,
        items: this.items
      });
    } catch { /* */ }
  },

  show() {
    if (this.items.length > 0) this.render();
  }
};
