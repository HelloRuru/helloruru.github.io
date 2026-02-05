#!/usr/bin/env node

/**
 * AIO View CLI — Google AI Overview 監測工具
 *
 * 使用方式：
 *   node scan.js --input queries.json --output results.json --domain example.com
 *
 * 參數：
 *   --input, -i    搜尋語句 JSON 檔案路徑（必填）
 *   --output, -o   輸出結果檔案路徑（預設：results.json）
 *   --domain, -d   要監測的網域（用於判斷是否被引用）
 *   --delay        每次搜尋間隔秒數（預設：150，即 2.5 分鐘）
 *   --headless     是否使用無頭模式（預設：false，顯示瀏覽器）
 */

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// 解析命令列參數
function parseArgs() {
  const args = process.argv.slice(2);
  const options = {
    input: null,
    output: 'results.json',
    domain: '',
    delay: 150, // 2.5 分鐘
    headless: false
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    const next = args[i + 1];

    switch (arg) {
      case '--input':
      case '-i':
        options.input = next;
        i++;
        break;
      case '--output':
      case '-o':
        options.output = next;
        i++;
        break;
      case '--domain':
      case '-d':
        options.domain = next;
        i++;
        break;
      case '--delay':
        options.delay = parseInt(next, 10);
        i++;
        break;
      case '--headless':
        options.headless = true;
        break;
      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
AIO View CLI — Google AI Overview 監測工具

使用方式：
  node scan.js --input queries.json --output results.json --domain example.com

參數：
  --input, -i    搜尋語句 JSON 檔案路徑（必填）
  --output, -o   輸出結果檔案路徑（預設：results.json）
  --domain, -d   要監測的網域（用於判斷是否被引用）
  --delay        每次搜尋間隔秒數（預設：150）
  --headless     使用無頭模式（不顯示瀏覽器視窗）
  --help, -h     顯示此說明
`);
}

// 等待指定秒數
function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

// 格式化時間
function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return mins > 0 ? `${mins} 分 ${secs} 秒` : `${secs} 秒`;
}

// 偵測 AI Overview
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
    console.error('  偵測 AIO 時發生錯誤:', error.message);
    return {
      hasAIO: false,
      isCited: false,
      aioSources: [],
      error: error.message
    };
  }
}

// 主程式
async function main() {
  const options = parseArgs();

  // 驗證參數
  if (!options.input) {
    console.error('錯誤：請指定輸入檔案（--input）');
    printHelp();
    process.exit(1);
  }

  // 讀取搜尋語句
  let queries;
  try {
    const inputPath = path.resolve(options.input);
    const content = fs.readFileSync(inputPath, 'utf8');
    queries = JSON.parse(content);

    if (!Array.isArray(queries)) {
      throw new Error('輸入檔案必須是陣列格式');
    }
  } catch (error) {
    console.error(`錯誤：無法讀取輸入檔案 - ${error.message}`);
    process.exit(1);
  }

  console.log(`
╔════════════════════════════════════════════════════╗
║           AIO View — AI Overview 監測工具          ║
╚════════════════════════════════════════════════════╝

監測網域：${options.domain || '未指定'}
搜尋語句：${queries.length} 個
預估時間：${formatTime(queries.length * options.delay)}
搜尋間隔：${options.delay} 秒
`);

  // 啟動瀏覽器
  console.log('正在啟動瀏覽器...');

  // 嘗試找到可用的瀏覽器
  const browserPaths = [
    '/mnt/c/Program Files/Google/Chrome/Application/chrome.exe',  // WSL + Windows Chrome
    '/mnt/c/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome',
    '/usr/bin/google-chrome-stable',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
    null  // 使用 Playwright 內建
  ];

  let executablePath = null;
  for (const p of browserPaths) {
    if (p === null) break;
    try {
      if (require('fs').existsSync(p)) {
        executablePath = p;
        console.log(`使用瀏覽器：${p}`);
        break;
      }
    } catch {}
  }

  const launchOptions = {
    headless: options.headless,
    args: [
      '--disable-blink-features=AutomationControlled',
      '--no-sandbox',
      '--disable-dev-shm-usage'
    ]
  };

  // 只有找到自訂瀏覽器路徑時才設定
  if (executablePath) {
    launchOptions.executablePath = executablePath;
  }

  const browser = await chromium.launch(launchOptions);

  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    locale: 'zh-TW',
    geolocation: { latitude: 25.033, longitude: 121.565 }, // 台北
    permissions: ['geolocation']
  });

  const page = await context.newPage();

  // 結果陣列
  const results = [];
  let completed = 0;

  console.log('\n開始掃描...\n');

  for (const item of queries) {
    const query = item.query || item;
    const url = item.url || '';
    const title = item.title || query;

    completed++;
    const progress = `[${completed}/${queries.length}]`;

    console.log(`${progress} 搜尋：${query}`);

    try {
      // 前往 Google 搜尋
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&hl=zh-TW&gl=TW`;
      await page.goto(searchUrl, { waitUntil: 'networkidle', timeout: 30000 });

      // 等待頁面穩定
      await sleep(2);

      // 偵測 AIO
      const aioResult = await detectAIO(page, options.domain);

      results.push({
        url,
        title,
        query,
        ...aioResult
      });

      // 顯示結果
      if (aioResult.hasAIO) {
        if (aioResult.isCited) {
          console.log(`  ✓ 有 AIO，已被引用`);
        } else {
          console.log(`  △ 有 AIO，未被引用`);
        }
      } else {
        console.log(`  - 無 AIO`);
      }

      // 即時儲存（防止中斷遺失）
      saveResults(options.output, options.domain, results);

    } catch (error) {
      console.error(`  ✕ 搜尋失敗：${error.message}`);
      results.push({
        url,
        title,
        query,
        hasAIO: false,
        isCited: false,
        aioSources: [],
        error: error.message
      });
    }

    // 等待間隔（除了最後一個）
    if (completed < queries.length) {
      console.log(`  等待 ${options.delay} 秒...\n`);
      await sleep(options.delay);
    }
  }

  // 關閉瀏覽器
  await browser.close();

  // 最終儲存
  saveResults(options.output, options.domain, results);

  // 統計
  const hasAIO = results.filter(r => r.hasAIO).length;
  const cited = results.filter(r => r.isCited).length;

  console.log(`
╔════════════════════════════════════════════════════╗
║                    掃描完成                        ║
╚════════════════════════════════════════════════════╝

總文章數：${results.length}
有 AIO：${hasAIO}（${Math.round(hasAIO / results.length * 100)}%）
被引用：${cited}（${Math.round(cited / results.length * 100)}%）

結果已儲存至：${options.output}
請上傳此檔案到 AIO View Dashboard 查看詳細結果。
`);
}

// 儲存結果
function saveResults(outputPath, domain, results) {
  const output = {
    scanDate: new Date().toISOString().split('T')[0],
    domain: domain,
    results: results
  };

  fs.writeFileSync(
    path.resolve(outputPath),
    JSON.stringify(output, null, 2),
    'utf8'
  );
}

// 執行
main().catch(error => {
  console.error('執行錯誤：', error);
  process.exit(1);
});
