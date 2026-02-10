/**
 * AIO Scanner — Google AI Overview 偵測核心
 */

const { chromium } = require('playwright');

/**
 * 偵測頁面中的 AI Overview
 * @param {Page} page - Playwright Page 物件
 * @param {string} domain - 要監測的網域
 * @returns {Promise<Object>} 偵測結果
 */
async function detectAIO(page, domain) {
  try {
    // AI Overview 的可能選擇器（Google 可能會改變）
    const aioSelectors = [
      '[data-attrid="wa:/description"]',
      '.ILfuVd',
      '[data-async-type="editableDirectAnswer"]',
      '.wDYxhc[data-md]',
      '[jsname="N760b"]',
      '.kp-wholepage-osrp'
    ];

    let aioElement = null;

    for (const selector of aioSelectors) {
      try {
        aioElement = await page.$(selector);
        if (aioElement) break;
      } catch {
        continue;
      }
    }

    if (!aioElement) {
      return {
        hasAIO: false,
        isCited: false,
        aioSources: []
      };
    }

    // 取得 AIO 中的所有連結
    const links = await aioElement.$$eval('a[href]', (anchors) => {
      return anchors
        .map(a => {
          try {
            const url = new URL(a.href);
            return url.hostname.replace(/^www\./, '');
          } catch {
            return null;
          }
        })
        .filter(Boolean);
    });

    // 去重
    const aioSources = [...new Set(links)];

    // 檢查是否包含目標網域
    const normalizedDomain = domain.replace(/^www\./, '').toLowerCase();
    const isCited = aioSources.some(source =>
      source.toLowerCase().includes(normalizedDomain)
    );

    return {
      hasAIO: true,
      isCited,
      aioSources
    };

  } catch (error) {
    console.error('偵測 AIO 時發生錯誤:', error.message);
    return {
      hasAIO: false,
      isCited: false,
      aioSources: [],
      error: error.message
    };
  }
}

/**
 * 掃描單一搜尋語句
 * @param {Page} page - Playwright Page 物件
 * @param {Object} item - 搜尋項目
 * @param {string} domain - 要監測的網域
 * @returns {Promise<Object>} 掃描結果
 */
async function scanQuery(page, item, domain) {
  const query = item.query || item;
  const url = item.url || '';
  const title = item.title || query;

  try {
    // 前往 Google 搜尋
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=zh-TW&gl=TW`;
    await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });

    // 等待頁面穩定
    await sleep(2);

    // 偵測 AIO
    const aioResult = await detectAIO(page, domain);

    return {
      url,
      title,
      query,
      ...aioResult
    };

  } catch (error) {
    console.error(`搜尋失敗：${error.message}`);
    return {
      url,
      title,
      query,
      hasAIO: false,
      isCited: false,
      aioSources: [],
      error: error.message
    };
  }
}

/**
 * 執行完整掃描
 * @param {Array} queries - 搜尋語句陣列
 * @param {string} domain - 要監測的網域
 * @param {Function} onProgress - 進度回調函數
 * @param {number} delay - 搜尋間隔（秒）
 * @returns {Promise<Array>} 掃描結果陣列
 */
async function scan(queries, domain, onProgress = null, delay = 150) {
  console.log(`開始掃描 ${queries.length} 個語句，網域：${domain}`);

  // 啟動瀏覽器
  const browser = await chromium.launch({
    headless: true,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage'
    ]
  });

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-TW',
    geolocation: { latitude: 25.033, longitude: 121.565 }, // 台北
    permissions: ['geolocation']
  });

  const page = await context.newPage();

  const results = [];
  let completed = 0;

  for (const item of queries) {
    completed++;

    // 回報進度
    if (onProgress) {
      onProgress({
        completed,
        total: queries.length,
        current: item.query || item,
        percentage: Math.round((completed / queries.length) * 100)
      });
    }

    // 掃描單一語句
    const result = await scanQuery(page, item, domain);
    results.push(result);

    console.log(`[${completed}/${queries.length}] ${item.query} - AIO: ${result.hasAIO}, 引用: ${result.isCited}`);

    // 等待間隔（除了最後一個）
    if (completed < queries.length) {
      await sleep(delay);
    }
  }

  // 關閉瀏覽器
  await browser.close();

  return results;
}

/**
 * 等待指定秒數
 */
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

module.exports = {
  scan,
  detectAIO
};
