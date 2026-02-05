# HelloRuru 全域字體

Design System v1.4 的獅尾字體子集化版本，供所有 HelloRuru 網站共用。

## 字體檔案

| 檔案 | 字體 | 用途 | 大小 |
|------|------|------|------|
| `SweiSpring-Regular.woff2` | 獅尾四季春 | H3、內文 | ~150 KB |
| `SweiSugar-Bold.woff2` | 獅尾加糖 | H1、H2 標題 | ~200 KB |

## 使用方式

在任何 HelloRuru 網站的 CSS 中：

```css
@font-face {
  font-family: 'Swei Spring';
  src: url('https://lab.helloruru.com/fonts/SweiSpring-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}

@font-face {
  font-family: 'Swei Sugar';
  src: url('https://lab.helloruru.com/fonts/SweiSugar-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
```

## 自動更新

當任何網站的 HTML 檔案有變更時，GitHub Actions 會自動：

1. 掃描所有網站的中文字元
2. 重新子集化字體
3. 自動 commit 更新

## 手動更新

```bash
cd fonts
npm install subset-font
node subset-fonts.js
```

## 掃描範圍

- `helloruru.github.io` (lab.helloruru.com)
- `tools` (tools.helloruru.com)
- `happy-exit` (newday.helloruru.com)

## 授權

獅尾字體採用 SIL Open Font License 1.1，可自由商用。

- [獅尾四季春](https://github.com/max32002/swei-spring)
- [獅尾加糖](https://github.com/max32002/swei-sugar)
