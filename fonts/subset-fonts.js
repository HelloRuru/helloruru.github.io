#!/usr/bin/env node
/**
 * HelloRuru 全域字體子集化腳本
 * Design System v1.6
 *
 * 使用方式：
 *   cd fonts
 *   npm install subset-font
 *   node subset-fonts.js
 *
 * 功能：
 *   1. 掃描所有 HelloRuru 網站的 HTML 檔案
 *   2. 從已下載的 OTF 檔案子集化
 *   3. 產生 woff2 檔案
 */

const fs = require('fs');
const path = require('path');

// 設定
const CONFIG = {
  // 要掃描的目錄（所有 HelloRuru 網站）
  scanDirs: [
    path.resolve(__dirname, '..'),           // helloruru.github.io (lab)
    path.resolve(__dirname, '../../tools'),  // tools
    path.resolve(__dirname, '../../happy-exit'), // happy-exit
  ],

  // 字體來源（本地 OTF 檔案）
  fonts: [
    {
      name: 'GenSenRounded-R',
      sourceFile: '/tmp/GenSenRounded2TW/GenSenRounded2TW-R.otf',
      outputFile: 'GenSenRounded-Regular.woff2'
    },
    {
      name: 'GenSenRounded-M',
      sourceFile: '/tmp/GenSenRounded2TW/GenSenRounded2TW-M.otf',
      outputFile: 'GenSenRounded-Medium.woff2'
    },
    {
      name: 'GenSenRounded-B',
      sourceFile: '/tmp/GenSenRounded2TW/GenSenRounded2TW-B.otf',
      outputFile: 'GenSenRounded-Bold.woff2'
    }
  ],

  // 基本字元（拉丁字母、數字、標點）
  baseChars: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,;:!?@#$%^&*()-_=+[]{}|\\/"\'<>~`©–—·「」『』【】《》、。！？；：（）％＆＋－／＝'
};

/**
 * 遞迴找出所有 HTML 檔案
 */
function findHtmlFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;

  const items = fs.readdirSync(dir);
  for (const item of items) {
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
        const matches = content.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || [];
        matches.forEach(char => {
          chars.add(char);
          stats[dirName].chars.add(char);
        });
      } catch (e) {}
    }
  }

  console.log('   各網站統計:');
  for (const [dir, data] of Object.entries(stats)) {
    if (data.files > 0) {
      console.log(`     ${dir}: ${data.chars.size} 字 (${data.files} 個檔案)`);
    }
  }

  return [...chars].sort().join('');
}

/**
 * 子集化字體
 */
async function subsetFontFile(inputFile, outputFile, chars) {
  const subsetFont = require('subset-font');

  const font = fs.readFileSync(inputFile);
  const subset = await subsetFont(font, chars, { targetFormat: 'woff2' });
  fs.writeFileSync(outputFile, subset);

  const originalSize = (font.length / 1024 / 1024).toFixed(1);
  const newSize = (subset.length / 1024).toFixed(1);

  return { originalSize: originalSize + ' MB', newSize: newSize + ' KB' };
}

/**
 * 主程式
 */
async function main() {
  console.log('HelloRuru 全域字體子集化\n');
  console.log('   Design System v1.6 — GenSenRounded (源泉圓體)\n');

  // 1. 提取中文字元
  console.log('掃描所有網站...');
  const zhChars = extractChineseChars(CONFIG.scanDirs);
  const allChars = zhChars + CONFIG.baseChars;
  console.log(`\n   總共 ${zhChars.length} 個中文字元`);
  console.log(`   加上基本字元: ${allChars.length} 個\n`);

  // 儲存字元清單
  fs.writeFileSync('chars.txt', `HelloRuru Design System v1.6 字體子集\n${'='.repeat(40)}\n\n中文字元 (${zhChars.length}):\n${zhChars}\n\n全部字元 (${allChars.length}):\n${allChars}`);

  // 2. 處理每個字體
  for (const font of CONFIG.fonts) {
    console.log(`處理 ${font.name}...`);

    if (!fs.existsSync(font.sourceFile)) {
      console.error(`   找不到來源檔案: ${font.sourceFile}`);
      continue;
    }

    try {
      const result = await subsetFontFile(font.sourceFile, font.outputFile, allChars);
      console.log(`   子集化完成: ${result.originalSize} → ${result.newSize}\n`);
    } catch (err) {
      console.error(`   子集化失敗: ${err.message}\n`);
    }
  }

  // 3. 清理舊字體檔案
  const oldFiles = ['SweiSpring-Regular.woff2', 'SweiSpring-Medium.woff2', 'SweiSugar-Bold.woff2'];
  for (const f of oldFiles) {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
      console.log(`已移除舊檔案: ${f}`);
    }
  }

  console.log('\n完成！');
  console.log('   字體位置: https://lab.helloruru.com/fonts/');
}

main().catch(console.error);
