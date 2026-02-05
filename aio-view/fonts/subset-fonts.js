#!/usr/bin/env node
/**
 * 獅尾字體自動子集化腳本
 *
 * 使用方式：
 *   cd aio-view/fonts
 *   npm install subset-font
 *   node subset-fonts.js
 *
 * 功能：
 *   1. 掃描 index.html 中所有中文字元
 *   2. 下載完整字體（如果不存在）
 *   3. 子集化並產生 woff2 檔案
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

// 設定
const CONFIG = {
  // 要掃描的 HTML 檔案
  htmlFiles: ['../index.html'],

  // 字體來源（jsDelivr CDN）
  fonts: [
    {
      name: 'SweiSpring-Regular',
      url: 'https://cdn.jsdelivr.net/gh/max32002/swei-spring/WebFont/CJK%20TC/SweiSpringCJKtc-Regular.woff2',
      fullFile: 'SweiSpring-Regular-full.woff2',
      outputFile: 'SweiSpring-Regular.woff2'
    },
    {
      name: 'SweiSugar-Bold',
      url: 'https://cdn.jsdelivr.net/gh/max32002/swei-sugar/WebFont/CJK%20TC/SweiSugarCJKtc-Bold.woff2',
      fullFile: 'SweiSugar-Bold-full.woff2',
      outputFile: 'SweiSugar-Bold.woff2'
    }
  ],

  // 基本字元（拉丁字母、數字、標點）
  baseChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,;:!?@#$%^&*()-_=+[]{}|\\/"\'<>~`©–—·「」『』【】《》、。！？；：'
};

/**
 * 從 HTML 檔案提取中文字元
 */
function extractChineseChars(htmlFiles) {
  const chars = new Set();

  for (const file of htmlFiles) {
    const filePath = path.resolve(__dirname, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`⚠ 檔案不存在: ${file}`);
      continue;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const matches = content.match(/[\u4e00-\u9fff]/g) || [];
    matches.forEach(char => chars.add(char));
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
      // 處理重定向
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
async function subsetFont(inputFile, outputFile, chars) {
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
  console.log('🔤 獅尾字體子集化工具\n');

  // 1. 提取中文字元
  console.log('📄 掃描 HTML 檔案...');
  const zhChars = extractChineseChars(CONFIG.htmlFiles);
  const allChars = zhChars + CONFIG.baseChars;
  console.log(`   找到 ${zhChars.length} 個中文字元`);
  console.log(`   總共 ${allChars.length} 個字元\n`);

  // 儲存字元清單（方便檢查）
  fs.writeFileSync('chars.txt', `中文字元 (${zhChars.length}):\n${zhChars}\n\n全部字元 (${allChars.length}):\n${allChars}`);

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
      const result = await subsetFont(font.fullFile, font.outputFile, allChars);
      console.log(`   ✓ 子集化完成: ${result.originalSize} KB → ${result.newSize} KB\n`);
    } catch (err) {
      console.error(`   ✗ 子集化失敗: ${err.message}\n`);
    }
  }

  console.log('✅ 完成！記得 commit 更新的字體檔案。');
}

main().catch(console.error);
