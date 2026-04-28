#!/usr/bin/env node
/**
 * jf 粉圓子集化（防老花眼設計專用）
 *
 * 從本地 G:\我的雲端硬碟\字體整理\jf粉圓體\jf-openhuninn-2.1.ttf
 * 子集化成 woff2，掃描所有 HelloRuru 網站的中文字
 */

const fs = require('fs');
const path = require('path');

const SRC = 'G:/我的雲端硬碟/字體整理/jf粉圓體/jf-openhuninn-2.1.ttf';
const OUT = 'jf-openhuninn-Regular.woff2';

const SCAN_DIRS = [
  path.resolve(__dirname, '..'),
  path.resolve(__dirname, '../../tools'),
  path.resolve(__dirname, '../../happy-exit'),
  path.resolve(__dirname, '../../ebook-deals'),
];

const BASE_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,;:!?@#$%^&*()-_=+[]{}|\\/"\'<>~`©–—·「」『』【】《》、。！？；：（）％＆＋－／＝';

function findHtmlFiles(dir, files = []) {
  if (!fs.existsSync(dir)) return files;
  const items = fs.readdirSync(dir);
  for (const item of items) {
    if (item === 'node_modules' || item === 'cli' || item === 'dist' || item.startsWith('.')) continue;
    const fullPath = path.join(dir, item);
    let stat;
    try { stat = fs.statSync(fullPath); } catch { continue; }
    if (stat.isDirectory()) findHtmlFiles(fullPath, files);
    else if (item.endsWith('.html')) files.push(fullPath);
  }
  return files;
}

function extractChars(dirs) {
  const chars = new Set();
  for (const dir of dirs) {
    const files = findHtmlFiles(dir);
    for (const file of files) {
      try {
        const content = fs.readFileSync(file, 'utf8');
        (content.match(/[一-鿿㐀-䶿]/g) || []).forEach(c => chars.add(c));
      } catch {}
    }
  }
  return [...chars].sort().join('');
}

async function main() {
  console.log('jf 粉圓子集化');
  if (!fs.existsSync(SRC)) {
    console.error(`找不到字體來源: ${SRC}`);
    process.exit(1);
  }

  console.log('掃描中文字...');
  const zhChars = extractChars(SCAN_DIRS);
  const allChars = zhChars + BASE_CHARS;
  console.log(`  中文 ${zhChars.length} 字 + 基本 ${BASE_CHARS.length} 字 = ${allChars.length}\n`);

  console.log('子集化中（可能需 30 秒）...');
  const subsetFont = require('subset-font');
  const font = fs.readFileSync(SRC);
  const subset = await subsetFont(font, allChars, { targetFormat: 'woff2' });
  fs.writeFileSync(OUT, subset);

  const originalMB = (font.length / 1024 / 1024).toFixed(1);
  const newKB = (subset.length / 1024).toFixed(1);
  console.log(`  ${originalMB} MB → ${newKB} KB`);
  console.log(`  輸出: ${path.resolve(OUT)}`);
}

main().catch(err => { console.error(err); process.exit(1); });
