# HelloRuru 全域字體

Design System v1.6 的源泉圓體子集化版本，供所有 HelloRuru 網站共用。

## 字體檔案

| 檔案 | 字重 | 用途 | 大小 |
|------|------|------|------|
| `GenSenRounded-Regular.woff2` | 400 Regular | Caption、輔助文字 | ~199 KB |
| `GenSenRounded-Medium.woff2` | 500 Medium | H3、內文（預設） | ~202 KB |
| `GenSenRounded-Bold.woff2` | 700 Bold | H1、H2 標題 | ~205 KB |

## 使用方式

在任何 HelloRuru 網站的 CSS 中：

```css
@font-face {
  font-family: 'GenSenRounded';
  src: url('https://lab.helloruru.com/fonts/GenSenRounded-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'GenSenRounded';
  src: url('https://lab.helloruru.com/fonts/GenSenRounded-Medium.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: 'GenSenRounded';
  src: url('https://lab.helloruru.com/fonts/GenSenRounded-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}
```

## 手動更新

```bash
cd fonts
npm install subset-font
node subset-fonts.js
```

需要先將 GenSenRounded TW OTF 檔案放到 `/tmp/GenSenRounded2TW/`。

## 掃描範圍

- `helloruru.github.io` (lab.helloruru.com)
- `tools` (tools.helloruru.com)
- `happy-exit` (newday.helloruru.com)

## 授權

源泉圓體採用 SIL Open Font License 1.1，可自由商用。

- [源泉圓體 GenSenRounded](https://github.com/ButTaiwan/gensen-font)
- 基底：Adobe Source Han Sans（思源黑體）
