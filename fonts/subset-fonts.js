#!/usr/bin/env node
/**
 * HelloRuru 全域字體子集化腳本
 * Design System v1.4
 *
 * 使用方式：
 *   cd fonts
 *   npm install subset-font
 *   node subset-fonts.js
 *
 * 功能：
 *   1. 掃描所有 HelloRuru 網站的 HTML 檔案
 *   2. 下載完整字體（如果不存在）
 *   3. 子集化並產生 woff2 檔案
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const { execSync } = require('child_process');

// 設定
const CONFIG = {
  // 要掃描的目錄（所有 HelloRuru 網站）
  scanDirs: [
    path.resolve(__dirname, '..'),           // helloruru.github.io (lab)
    path.resolve(__dirname, '../../tools'),  // tools
    path.resolve(__dirname, '../../happy-exit'), // happy-exit
  ],

  // 字體來源（jsDelivr CDN）
  fonts: [
    {
      name: 'SweiSpring-Regular',
      url: 'https://cdn.jsdelivr.net/gh/max32002/swei-spring/WebFont/CJK%20TC/SweiSpringCJKtc-Regular.woff2',
      fullFile: 'SweiSpring-Regular-full.woff2',
      outputFile: 'SweiSpring-Regular.woff2'
    },
    {
      name: 'SweiSpring-Medium',
      url: 'https://cdn.jsdelivr.net/gh/max32002/swei-spring/WebFont/CJK%20TC/SweiSpringCJKtc-Medium.woff2',
      fullFile: 'SweiSpring-Medium-full.woff2',
      outputFile: 'SweiSpring-Medium.woff2'
    },
    {
      name: 'SweiSugar-Bold',
      url: 'https://cdn.jsdelivr.net/gh/max32002/swei-sugar/WebFont/CJK%20TC/SweiSugarCJKtc-Bold.woff2',
      fullFile: 'SweiSugar-Bold-full.woff2',
      outputFile: 'SweiSugar-Bold.woff2'
    }
  ],

  // 基本字元（拉丁字母、數字、標點）
  baseChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,;:!?@#$%^&*()-_=+[]{}|\\/"\'<>~`©–—·「」『』【】《》、。！？；：（）'
};

/**
 * 遞迴找出所有 HTML 檔案
 */
function findHtmlFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  for (const item of items) {
    // 跳過 node_modules 和隱藏目錄
    if (item === 'node_modules' || item === 'cli' || item.startsWith('.')) continue;

    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      findHtmlFiles(fullPath, files);
    } else if (item.endsWith('.html')) {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * 從 HTML 檔案提取中文字元
 */
function extractChineseChars(dirs) {
  const chars = new Set();
  const stats = {};

  for (const dir of dirs) {
    const dirName = path.basename(dir);
    const files = findHtmlFiles(dir);
    stats[dirName] = { files: files.length, chars: new Set() };

    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const matches = content.match(/[\u4e00-\u9fff]/g) || [];
        matches.forEach(char => {
          chars.add(char);
          stats[dirName].chars.add(char);
        });
      } catch (e) {}
    }
  }

  // 輸出統計
  console.log('   各網站統計:');
  for (const [dir, data] of Object.entries(stats)) {
    if (data.files > 0) {
      console.log(`     ${dir}: ${data.chars.size} 字 (${data.files} 個檔案)`);
    }
  }

  return [...chars].sort().join('');
}

/**
 * 下載檔案
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    console.log(`  下載中: ${url}`);

    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        file.close();
        fs.unlinkSync(dest);
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(dest);
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      file.close();
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

/**
 * 子集化字體
 */
async function subsetFontFile(inputFile, outputFile, chars) {
  const subsetFont = require('subset-font');

  const font = fs.readFileSync(inputFile);
  const subset = await subsetFont(font, chars, { targetFormat: 'woff2' });
  fs.writeFileSync(outputFile, subset);

  const originalSize = (font.length / 1024).toFixed(1);
  const newSize = (subset.length / 1024).toFixed(1);

  return { originalSize, newSize };
}

/**
 * 主程式
 */
async function main() {
  console.log('🔤 HelloRuru 全域字體子集化\n');
  console.log('   Design System v1.4\n');

  // 1. 提取中文字元
  console.log('📄 掃描所有網站...');
  const zhChars = extractChineseChars(CONFIG.scanDirs);
  const allChars = zhChars + CONFIG.baseChars;
  console.log(`\n   總共 ${zhChars.length} 個中文字元`);
  console.log(`   加上基本字元: ${allChars.length} 個\n`);

  // 儲存字元清單
  fs.writeFileSync('chars.txt', `HelloRuru Design System v1.4 字體子集\n${'='.repeat(40)}\n\n中文字元 (${zhChars.length}):\n${zhChars}\n\n全部字元 (${allChars.length}):\n${allChars}`);

  // 2. 處理每個字體
  for (const font of CONFIG.fonts) {
    console.log(`📦 處理 ${font.name}...`);

    // 下載完整字體（如果不存在）
    if (!fs.existsSync(font.fullFile)) {
      try {
        await downloadFile(font.url, font.fullFile);
        console.log('   ✓ 下載完成');
      } catch (err) {
        console.error(`   ✗ 下載失敗: ${err.message}`);
        continue;
      }
    } else {
      console.log('   ✓ 使用已快取的字體');
    }

    // 子集化
    try {
      const result = await subsetFontFile(font.fullFile, font.outputFile, allChars);
      console.log(`   ✓ 子集化完成: ${result.originalSize} KB → ${result.newSize} KB\n`);
    } catch (err) {
      console.error(`   ✗ 子集化失敗: ${err.message}\n`);
    }
  }

  console.log('✅ 完成！');
  console.log('   字體位置: https://lab.helloruru.com/fonts/');
}

main().catch(console.error);
