# Hello Ruru Design System v1.6

> 更新日期：2026-02-06
> 變更重點：全面更換字體為源泉圓體（GenSenRounded TW），解決獅尾四季春鋸齒問題

---

## 變更紀錄

| 版本 | 日期 | 變更 |
|------|------|------|
| v1.6 | 2026-02-06 | 字體更換為源泉圓體（GenSenRounded TW） |
| v1.5 | 2026-02-05 | 新增 Medium (500) 字重 |
| v1.4 | 2026-02-04 | 初版 Design System |

---

## 字體系統

### 字體選擇

| 項目 | v1.5（舊） | v1.6（新） |
|------|-----------|-----------|
| 標題字體 | 獅尾四季春加糖 (Swei Sugar) | **源泉圓體 (GenSenRounded)** |
| 內文字體 | 獅尾四季春 (Swei Spring) | **源泉圓體 (GenSenRounded)** |
| 基底 | 自製圓體 | **思源黑體（Source Han Sans）圓角版** |
| 授權 | OFL | **OFL（商用免費）** |
| 渲染品質 | 部分字級鋸齒 | **向量渲染，無鋸齒** |
| 繁中涵蓋 | 子集化 | **完整繁體中文（33,955 字）** |

### 更換原因

1. 獅尾四季春在部分螢幕、部分字級出現鋸齒（aliasing）
2. 源泉圓體基於 Adobe 思源黑體，渲染引擎最佳化更完善
3. 同為圓體風格，品牌調性（溫柔、質感）一致
4. OFL 授權，商用完全免費

### 字重配置

| 用途 | 字體 | 字重 | CSS Variable | Fallback |
|------|------|------|-------------|----------|
| 標題（H1, H2） | GenSenRounded | 700 Bold | `--font-title` | Noto Sans TC |
| 內文（H3, p） | GenSenRounded | 500 Medium | `--font-body` | Noto Sans TC |
| 小字（≤12px） | Noto Sans TC | 400 Regular | `--font-small` | sans-serif |
| 程式碼 | JetBrains Mono | 400 | — | Fira Code |

### 字體 CDN

```
https://lab.helloruru.com/fonts/
├── GenSenRounded-Regular.woff2  (400)  ~199 KB
├── GenSenRounded-Medium.woff2   (500)  ~202 KB
└── GenSenRounded-Bold.woff2     (700)  ~205 KB
```

### @font-face 宣告

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

### CSS Variables

```css
:root {
  --font-title: 'GenSenRounded', 'Noto Sans TC', sans-serif;
  --font-body: 'GenSenRounded', 'Noto Sans TC', sans-serif;
  --font-small: 'Noto Sans TC', sans-serif;
}
```

---

## 字級系統（未變更）

| 層級 | 桌面版 | 手機版 | 字重 | 行高 |
|------|--------|--------|------|------|
| H1 | 40px | 30px | 700 | 1.3 |
| H2 | 28px | 24px | 500 | 1.3 |
| H3 | 20px | 18px | 500 | 1.3 |
| Body | 16px | 16px | 500 | 1.8 |
| Small | 14px | 14px | 500 | 1.6 |
| Caption | 12px | 12px | 400 | 1.6 |

---

## 色彩系統（未變更）

主色：`#D4A5A5` Rose / 次色：`#B8A9C9` Lavender

完整色彩規範請見 CLAUDE.md。

---

## 圓角系統（未變更）

| 元素 | 圓角 |
|------|------|
| 按鈕/卡片 | 24px |
| 輸入框 | 12px |
| 標籤/Badge | 8px |
| 頭像 | 50% |

---

## 已更新的網站

| 網站 | 檔案 | 狀態 |
|------|------|------|
| lab.helloruru.com | `index.html` | 已更新 |
| lab.helloruru.com/sge-writer | `index.html`, `style.css` | 已更新 |
| lab.helloruru.com/table-fixer | `index.html` | 已更新 |
| fonts CDN | `subset-fonts.js`, woff2 files | 已更新 |

---

## 字體來源

- **名稱**：源泉圓體 GenSenRounded v2.100
- **作者**：ButTaiwan
- **GitHub**：https://github.com/ButTaiwan/gensen-font
- **授權**：SIL Open Font License 1.1
- **基底**：Adobe Source Han Sans（思源黑體）
