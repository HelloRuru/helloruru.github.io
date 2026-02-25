/* ================================================
   AIO View — Timeline Component
   時間軸報告：趨勢折線圖 + 歷史記錄 + 對比
   ================================================ */

const Timeline = {
  /** Chart.js 實例 */
  trendChart: null,

  /** 歷史摘要暫存 */
  summaries: [],

  /**
   * 初始化
   */
  init() {
    this.bindEvents();
    this.loadHistory();
  },

  /**
   * 綁定事件
   */
  bindEvents() {
    // 對比按鈕
    document.getElementById('timeline-compare-btn')?.addEventListener('click', () => {
      this.runComparison();
    });
  },

  /**
   * 載入歷史記錄
   */
  async loadHistory() {
    try {
      this.summaries = await DB.getHistorySummaries();

      if (this.summaries.length > 0) {
        this.show();
        this.renderTrendChart();
        this.renderHistoryList();
        this.renderCompareSelects();
      }
    } catch (err) {
      console.warn('[Timeline] \u8F09\u5165\u6B77\u53F2\u8A18\u9304\u5931\u6557:', err);
    }
  },

  /**
   * 新增記錄後重新整理
   * @param {Object} results - 掃描結果
   */
  async onResultsUploaded(results) {
    try {
      await DB.saveFullResults(results);
      await this.loadHistory();
    } catch (err) {
      console.warn('[Timeline] \u5132\u5B58\u5B8C\u6574\u7D50\u679C\u5931\u6557:', err);
    }
  },

  /**
   * 渲染趨勢折線圖
   */
  renderTrendChart() {
    if (typeof Chart === 'undefined' || this.summaries.length < 1) return;

    const canvas = document.getElementById('chart-trend');
    if (!canvas) return;

    const labels = this.summaries.map(s => s.date);
    const citedData = this.summaries.map(s => s.cited);
    const rateData = this.summaries.map(s => parseFloat(s.rate));

    // 銷毀舊圖表
    if (this.trendChart) {
      this.trendChart.destroy();
    }

    this.trendChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [
          {
            label: '\u88AB\u5F15\u7528\u7BC7\u6578',
            data: citedData,
            borderColor: '#D4A5A5',
            backgroundColor: 'rgba(212, 165, 165, 0.1)',
            fill: true,
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2,
            yAxisID: 'y'
          },
          {
            label: '\u5F15\u7528\u7387 (%)',
            data: rateData,
            borderColor: '#B8A9C9',
            backgroundColor: 'transparent',
            borderDash: [5, 5],
            tension: 0.3,
            pointRadius: 4,
            pointHoverRadius: 6,
            borderWidth: 2,
            yAxisID: 'y1'
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: {
          mode: 'index',
          intersect: false
        },
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              font: { size: 13, weight: 500 }
            }
          },
          tooltip: {
            backgroundColor: '#333',
            cornerRadius: 8,
            padding: 10
          }
        },
        scales: {
          x: {
            ticks: { font: { size: 12 } },
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          y: {
            type: 'linear',
            display: true,
            position: 'left',
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              font: { size: 12 },
              callback: (v) => `${v} \u7BC7`
            },
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          y1: {
            type: 'linear',
            display: true,
            position: 'right',
            beginAtZero: true,
            max: 100,
            ticks: {
              font: { size: 12 },
              callback: (v) => `${v}%`
            },
            grid: { drawOnChartArea: false }
          }
        }
      }
    });
  },

  /**
   * 渲染歷史記錄清單
   */
  renderHistoryList() {
    const listEl = document.getElementById('history-list');
    if (!listEl) return;

    if (this.summaries.length === 0) {
      listEl.innerHTML = '<div class="timeline-empty">\u9084\u6C92\u6709\u6B77\u53F2\u8A18\u9304\uFF0C\u4E0A\u50B3\u7B2C\u4E00\u6B21\u6383\u63CF\u7D50\u679C\u5C31\u6703\u958B\u59CB\u8A18\u9304</div>';
      return;
    }

    // 倒序顯示（最新在上）
    const reversed = [...this.summaries].reverse();

    listEl.innerHTML = reversed.map(s =>
      `<div class="history-card" data-id="${s.id}">
        <div class="history-card-left">
          <span class="history-date">${s.date}</span>
          <span class="history-domain">${Utils.escapeHtml(s.domain)}</span>
        </div>
        <div class="history-card-right">
          <div class="history-stat">
            <div class="history-stat-value">${s.total}</div>
            <div class="history-stat-label">\u7E3D\u6578</div>
          </div>
          <div class="history-stat">
            <div class="history-stat-value">${s.cited}</div>
            <div class="history-stat-label">\u5F15\u7528</div>
          </div>
          <div class="history-rate">${s.rate}%</div>
        </div>
      </div>`
    ).join('');
  },

  /**
   * 渲染對比下拉選單
   */
  renderCompareSelects() {
    const sel1 = document.getElementById('compare-date-1');
    const sel2 = document.getElementById('compare-date-2');
    if (!sel1 || !sel2) return;

    if (this.summaries.length < 2) {
      const compareBar = document.getElementById('timeline-compare-bar');
      if (compareBar) compareBar.classList.add('hidden');
      return;
    }

    const options = this.summaries.map(s =>
      `<option value="${s.id}">${s.date}  (${s.cited}/${s.total})</option>`
    ).join('');

    sel1.innerHTML = options;
    sel2.innerHTML = options;

    // 預設選最近兩筆
    if (this.summaries.length >= 2) {
      sel1.value = this.summaries[this.summaries.length - 2].id;
      sel2.value = this.summaries[this.summaries.length - 1].id;
    }

    const compareBar = document.getElementById('timeline-compare-bar');
    if (compareBar) compareBar.classList.remove('hidden');
  },

  /**
   * 執行對比
   */
  async runComparison() {
    const sel1 = document.getElementById('compare-date-1');
    const sel2 = document.getElementById('compare-date-2');
    const resultsEl = document.getElementById('compare-results');
    if (!sel1 || !sel2 || !resultsEl) return;

    const id1 = parseInt(sel1.value, 10);
    const id2 = parseInt(sel2.value, 10);

    if (id1 === id2) {
      Toast.info('\u8ACB\u9078\u64C7\u4E0D\u540C\u7684\u5169\u6B21\u6383\u63CF');
      return;
    }

    try {
      const [rec1, rec2] = await Promise.all([
        DB.getFullRecord(id1),
        DB.getFullRecord(id2)
      ]);

      if (!rec1 || !rec2) {
        Toast.error('\u7121\u6CD5\u8B80\u53D6\u6B77\u53F2\u8A18\u9304');
        return;
      }

      // 比較引用狀態
      const citedUrls1 = new Set((rec1.results || []).filter(r => r.isCited).map(r => r.url));
      const citedUrls2 = new Set((rec2.results || []).filter(r => r.isCited).map(r => r.url));

      // 新增被引用：在 rec2 有引用但 rec1 沒有
      const gained = [...citedUrls2].filter(url => !citedUrls1.has(url));
      // 失去引用：在 rec1 有引用但 rec2 沒有
      const lost = [...citedUrls1].filter(url => !citedUrls2.has(url));
      // 持續引用：兩次都有
      const kept = [...citedUrls2].filter(url => citedUrls1.has(url));

      resultsEl.innerHTML = `
        <div class="compare-card gained">
          <div class="compare-value">+${gained.length}</div>
          <div class="compare-label-text">\u65B0\u589E\u5F15\u7528</div>
        </div>
        <div class="compare-card lost">
          <div class="compare-value">-${lost.length}</div>
          <div class="compare-label-text">\u5931\u53BB\u5F15\u7528</div>
        </div>
        <div class="compare-card kept">
          <div class="compare-value">${kept.length}</div>
          <div class="compare-label-text">\u6301\u7E8C\u5F15\u7528</div>
        </div>
      `;

      resultsEl.classList.remove('hidden');
    } catch (err) {
      Toast.error('\u5C0D\u6BD4\u5931\u6557\uFF1A' + err.message);
    }
  },

  /**
   * 顯示
   */
  show() {
    const section = document.getElementById('timeline-section');
    if (section) section.classList.remove('hidden');
  },

  /**
   * 隱藏
   */
  hide() {
    const section = document.getElementById('timeline-section');
    if (section) section.classList.add('hidden');
  },

  /**
   * 重置
   */
  reset() {
    if (this.trendChart) {
      this.trendChart.destroy();
      this.trendChart = null;
    }
    this.summaries = [];
    this.hide();
  }
};
