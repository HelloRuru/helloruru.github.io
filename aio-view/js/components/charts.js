/* ================================================
   AIO View — Charts Component
   Cyberpunk Theme
   ================================================ */

const Charts = {
  /** Chart.js instances */
  instances: {
    status: null,
    sources: null
  },

  /** Cyberpunk color palette */
  colors: {
    cyan: '#00f0ff',
    magenta: '#ff00aa',
    green: '#00ff88',
    purple: '#cc88dd',
    darkCyan: '#00c8d4',
    amber: '#ffaa00',
    pink: '#ff66cc',
    teal: '#00d4aa',
    surface: '#12121f'
  },

  /**
   * Init
   */
  init() {
    if (typeof Chart !== 'undefined') {
      Chart.defaults.font.family = "'JetBrains Mono', 'Noto Sans TC', sans-serif";
      Chart.defaults.font.size = 13;
      Chart.defaults.color = '#c8d6e5';
    }
  },

  /**
   * Render all charts
   * @param {Object} results
   */
  render(results) {
    if (typeof Chart === 'undefined') {
      console.warn('[Charts] Chart.js not loaded');
      return;
    }

    const items = results.results || [];
    if (items.length === 0) return;

    const section = document.getElementById('charts-section');
    if (section) section.classList.remove('hidden');

    this.renderStatusChart(items);
    this.renderSourcesChart(items);
  },

  /**
   * Status doughnut chart
   * @param {Array} items
   */
  renderStatusChart(items) {
    const canvas = document.getElementById('chart-status');
    if (!canvas) return;

    const cited = items.filter(r => r.isCited).length;
    const aioNotCited = items.filter(r => r.hasAIO && !r.isCited).length;
    const noAio = items.filter(r => !r.hasAIO).length;

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
            this.colors.cyan,
            this.colors.magenta,
            '#3a3a4a'
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
              font: { size: 13, weight: 500 },
              color: '#c8d6e5'
            }
          },
          tooltip: {
            backgroundColor: this.colors.surface,
            borderColor: 'rgba(0, 240, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            titleFont: { weight: 500 },
            titleColor: '#e0e8f0',
            bodyColor: '#c8d6e5',
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
   * Sources bar chart
   * @param {Array} items
   */
  renderSourcesChart(items) {
    const canvas = document.getElementById('chart-sources');
    const listEl = document.getElementById('sources-list');
    if (!canvas) return;

    const sourceCounts = {};

    items.forEach(item => {
      if (item.aioSources && Array.isArray(item.aioSources)) {
        item.aioSources.forEach(src => {
          let domain = src;
          try {
            if (src.startsWith('http')) {
              domain = new URL(src).hostname;
            }
          } catch (e) {
            // not a URL, use as domain
          }
          domain = domain.replace(/^www\./, '').split('/')[0];
          sourceCounts[domain] = (sourceCounts[domain] || 0) + 1;
        });
      }
    });

    const sorted = Object.entries(sourceCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    if (sorted.length === 0) {
      canvas.parentElement.innerHTML = '<div class="chart-empty">\u7121\u5F15\u7528\u4F86\u6E90\u8CC7\u6599</div>';
      if (listEl) listEl.innerHTML = '';
      return;
    }

    const labels = sorted.map(s => s[0]);
    const data = sorted.map(s => s[1]);

    // Gradient from cyan to magenta
    const barColors = sorted.map((_, i) => {
      const ratio = i / Math.max(sorted.length - 1, 1);
      return this.lerpColor(this.colors.cyan, this.colors.magenta, ratio);
    });

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
            backgroundColor: this.colors.surface,
            borderColor: 'rgba(0, 240, 255, 0.2)',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 10,
            titleColor: '#e0e8f0',
            bodyColor: '#c8d6e5',
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
            ticks: { stepSize: 1, font: { size: 12 }, color: '#5a6a7a' },
            grid: { color: 'rgba(0, 240, 255, 0.06)' }
          },
          y: {
            ticks: {
              font: { size: 12 },
              color: '#7a8a9a',
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
   * Linear color interpolation
   * @param {string} c1 - start hex
   * @param {string} c2 - end hex
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
   * Reset
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
