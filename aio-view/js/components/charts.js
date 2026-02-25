/* ================================================
   AIO View — Charts Component
   圖表分析（使用 Chart.js）
   ================================================ */

const Charts = {
  /** Chart.js 實例 */
  instances: {
    status: null,
    sources: null
  },

  /** DS v1.9 配色 */
  colors: {
    rose: '#D4A5A5',
    lavender: '#B8A9C9',
    sage: '#A8B5A0',
    blush: '#F5D0C5',
    warmGray: '#B5ADA7',
    charcoal: '#5C5856',
    grayRose: '#C9929A',
    wisteria: '#C4B7D7',
    fog: '#E8E4E1'
  },

  /**
   * 初始化
   */
  init() {
    // Chart.js 全域設定
    if (typeof Chart !== 'undefined') {
      Chart.defaults.font.family = "'GenSenRounded', 'Noto Sans TC', sans-serif";
      Chart.defaults.font.size = 13;
      Chart.defaults.color = '#4A4A4A';
    }
  },

  /**
   * 渲染所有圖表
   * @param {Object} results - 掃描結果
   */
  render(results) {
    if (typeof Chart === 'undefined') {
      console.warn('[Charts] Chart.js \u672A\u8F09\u5165');
      return;
    }

    const items = results.results || [];
    if (items.length === 0) return;

    // 顯示圖表區塊
    const section = document.getElementById('charts-section');
    if (section) section.classList.remove('hidden');

    this.renderStatusChart(items);
    this.renderSourcesChart(items);
  },

  /**
   * AIO 狀態圓餅圖
   * @param {Array} items - 結果項目
   */
  renderStatusChart(items) {
    const canvas = document.getElementById('chart-status');
    if (!canvas) return;

    // 計算三種狀態
    const cited = items.filter(r => r.isCited).length;
    const aioNotCited = items.filter(r => r.hasAIO && !r.isCited).length;
    const noAio = items.filter(r => !r.hasAIO).length;

    // 銷毀舊圖表
    if (this.instances.status) {
      this.instances.status.destroy();
    }

    this.instances.status = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels: ['\u88AB\u5F15\u7528', '\u6709 AIO \u672A\u5F15\u7528', '\u7121 AIO'],
        datasets: [{
          data: [cited, aioNotCited, noAio],
          backgroundColor: [
            this.colors.rose,
            this.colors.lavender,
            this.colors.fog
          ],
          borderWidth: 0,
          hoverOffset: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        cutout: '55%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              padding: 16,
              usePointStyle: true,
              pointStyleWidth: 10,
              font: { size: 13, weight: 500 }
            }
          },
          tooltip: {
            backgroundColor: '#333',
            cornerRadius: 8,
            padding: 10,
            titleFont: { weight: 500 },
            callbacks: {
              label: function(ctx) {
                const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                const pct = total ? ((ctx.raw / total) * 100).toFixed(1) : 0;
                return ` ${ctx.label}: ${ctx.raw} \u7BC7 (${pct}%)`;
              }
            }
          }
        }
      }
    });
  },

  /**
   * 引用源分佈柱狀圖
   * @param {Array} items - 結果項目
   */
  renderSourcesChart(items) {
    const canvas = document.getElementById('chart-sources');
    const listEl = document.getElementById('sources-list');
    if (!canvas) return;

    // 提取所有引用來源網域
    const sourceCounts = {};

    items.forEach(item => {
      if (item.aioSources && Array.isArray(item.aioSources)) {
        item.aioSources.forEach(src => {
          let domain = src;
          try {
            // 嘗試解析完整 URL
            if (src.startsWith('http')) {
              domain = new URL(src).hostname;
            }
          } catch (e) {
            // 不是 URL，當作 domain 直接用
          }
          domain = domain.replace(/^www\./, '').split('/')[0];
          sourceCounts[domain] = (sourceCounts[domain] || 0) + 1;
        });
      }
    });

    // 排序取 Top 10
    const sorted = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (sorted.length === 0) {
      // 顯示空狀態
      canvas.parentElement.innerHTML = '<div class="chart-empty">\u7121\u5F15\u7528\u4F86\u6E90\u8CC7\u6599</div>';
      if (listEl) listEl.innerHTML = '';
      return;
    }

    const labels = sorted.map(s => s[0]);
    const data = sorted.map(s => s[1]);

    // 漸層色
    const barColors = sorted.map((_, i) => {
      const ratio = i / Math.max(sorted.length - 1, 1);
      return this.lerpColor(this.colors.rose, this.colors.lavender, ratio);
    });

    // 銷毀舊圖表
    if (this.instances.sources) {
      this.instances.sources.destroy();
    }

    this.instances.sources = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: barColors,
          borderRadius: 6,
          borderSkipped: false,
          barThickness: 20
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#333',
            cornerRadius: 8,
            padding: 10,
            callbacks: {
              label: function(ctx) {
                return ` ${ctx.raw} \u6B21\u5F15\u7528`;
              }
            }
          }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { stepSize: 1, font: { size: 12 } },
            grid: { color: 'rgba(0,0,0,0.04)' }
          },
          y: {
            ticks: {
              font: { size: 12 },
              callback: function(value) {
                const label = this.getLabelForValue(value);
                return label.length > 20 ? label.substring(0, 20) + '\u2026' : label;
              }
            },
            grid: { display: false }
          }
        }
      }
    });

    // 渲染來源列表
    if (listEl) {
      listEl.innerHTML = sorted.map(([domain, count]) =>
        `<div class="source-item">
          <span class="source-domain">${Utils.escapeHtml(domain)}</span>
          <span class="source-count">${count}</span>
        </div>`
      ).join('');
    }
  },

  /**
   * 線性內插顏色
   * @param {string} c1 - 起始色 hex
   * @param {string} c2 - 結束色 hex
   * @param {number} t - 0~1
   * @returns {string} hex
   */
  lerpColor(c1, c2, t) {
    const r1 = parseInt(c1.slice(1, 3), 16);
    const g1 = parseInt(c1.slice(3, 5), 16);
    const b1 = parseInt(c1.slice(5, 7), 16);
    const r2 = parseInt(c2.slice(1, 3), 16);
    const g2 = parseInt(c2.slice(3, 5), 16);
    const b2 = parseInt(c2.slice(5, 7), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },

  /**
   * 重置
   */
  reset() {
    if (this.instances.status) {
      this.instances.status.destroy();
      this.instances.status = null;
    }
    if (this.instances.sources) {
      this.instances.sources.destroy();
      this.instances.sources = null;
    }

    const section = document.getElementById('charts-section');
    if (section) section.classList.add('hidden');
  }
};
