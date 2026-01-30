# Hello Ruru Design System v1.3

> 最後更新：2026-01-30

---

## 目錄

| 章節 | 內容 |
|------|------|
| 色彩系統 | 18 色完整色票（主色、粉色系、紫色系、中性色、文字色階） |
| 字體系統 | 獅尾四季春 + 加糖版引入方式、字級規範、語言對應 |
| 元件規範 | 圓角、陰影、漸層、動畫 |
| Icon 規範 | SVG 線條風格、禁止 Emoji |
| 卡片/按鈕 | 完整 CSS 範例 |
| 深淺模式 | Toggle + JS 邏輯 |
| 頁面結構 | Layout + 響應式斷點 |
| 響應式斷點 | Desktop / Tablet / Mobile |
| PWA 圖示 | 檔案清單 + 設計規則 |
| 禁止事項 | 5 條紅線 |
| AI 快速指令 | 可直接複製給任何 AI |

---

## 品牌調性

關鍵詞：溫柔、質感、日系文青、簡約

---

## 色彩系統

### 主色調

| 用途 | 名稱 | 色碼 | 說明 |
|------|------|------|------|
| 主色 | Rose | #D4A5A5 | 品牌主視覺、按鈕、強調 |
| 次色 | Lavender | #B8A9C9 | 輔助裝飾、hover 狀態 |

### 粉色系

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 腮紅粉 | #F5D0C5 | 背景輔助、淺色卡片 |
| 灰玫瑰 | #C9929A | 卡片 icon、標籤 |
| 撫子粉 | #E8B4B8 | hover 狀態、裝飾 |
| 櫻花粉 | #FEDFE1 | 淺背景、提示框 |

### 紫色系

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 藕荷 | #9B7E93 | 文字輔助、hover |
| 藤紫 | #C4B7D7 | 淺紫背景、分隔線 |
| 桔梗紫 | #8F77B5 | 深紫強調、連結 |

### 中性色

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 鼠尾草綠 | #A8B5A0 | 對比撞色、成功狀態 |
| 霧灰 | #E8E4E1 | 背景底色、分隔 |
| 暖灰 | #B5ADA7 | 禁用狀態、邊框 |
| 炭灰 | #5C5856 | 深色文字 |

### 文字色階

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 墨色 | #333333 | 標題文字 |
| 炭灰 | #4A4A4A | 內文文字 |
| 灰石 | #888888 | 說明文字 |
| 淺灰 | #AAAAAA | 註解、placeholder |
| 雪白 | #FAFAFA | 淺色背景 |
| 純白 | #FFFFFF | 卡片、容器 |

---

## 字體系統

### 字體家族

| 用途 | 字體名稱 | Fallback | 說明 |
|------|---------|----------|------|
| 標題 | 獅尾四季春加糖 | Noto Sans TC | 圓潤甜美，品牌識別 |
| 內文 | 獅尾四季春 | Noto Sans TC | 清新好讀 |
| 小字/註解 | Noto Sans TC | sans-serif | 12px 以下確保清晰 |
| 程式碼 | JetBrains Mono | Fira Code | 等寬字體 |

### 字體引入方式

```css
/* 獅尾四季春加糖（標題用） */
@font-face {
  font-family: 'Swei Spring Sugar';
  src: url('https://cdn.jsdelivr.net/gh/nicholaschu/Swei-Spring-Sugar/webfont/SweiSpringSugarCJKtc-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Swei Spring Sugar';
  src: url('https://cdn.jsdelivr.net/gh/nicholaschu/Swei-Spring-Sugar/webfont/SweiSpringSugarCJKtc-Medium.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: 'Swei Spring Sugar';
  src: url('https://cdn.jsdelivr.net/gh/nicholaschu/Swei-Spring-Sugar/webfont/SweiSpringSugarCJKtc-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}

/* 獅尾四季春（內文用） */
@font-face {
  font-family: 'Swei Spring';
  src: url('https://cdn.jsdelivr.net/gh/nicholaschu/Swei-Spring/webfont/SweiSpringCJKtc-Light.woff2') format('woff2');
  font-weight: 300;
  font-display: swap;
}
@font-face {
  font-family: 'Swei Spring';
  src: url('https://cdn.jsdelivr.net/gh/nicholaschu/Swei-Spring/webfont/SweiSpringCJKtc-Regular.woff2') format('woff2');
  font-weight: 400;
  font-display: swap;
}
@font-face {
  font-family: 'Swei Spring';
  src: url('https://cdn.jsdelivr.net/gh/nicholaschu/Swei-Spring/webfont/SweiSpringCJKtc-Medium.woff2') format('woff2');
  font-weight: 500;
  font-display: swap;
}
@font-face {
  font-family: 'Swei Spring';
  src: url('https://cdn.jsdelivr.net/gh/nicholaschu/Swei-Spring/webfont/SweiSpringCJKtc-Bold.woff2') format('woff2');
  font-weight: 700;
  font-display: swap;
}

/* Noto Sans TC (Google Fonts) */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap');
```

### 語言對應

| 語言 | 字體處理 | 備註 |
|------|---------|------|
| 繁體中文 | 獅尾四季春系列 | 完整支援，主要語言 |
| 英文 | 獅尾四季春內建 | 風格一致 |
| 日文 | 獅尾四季春內建 | 缺字 fallback 至 Noto Sans TC |

### 字重規範

| 字重 | 數值 | 用途 |
|------|------|------|
| Light | 300 | 大面積內文 |
| Regular | 400 | 內文、說明文字 |
| Medium | 500 | 小標題、按鈕、強調 |
| Bold | 700 | 頁面主標題、品牌標語 |

### 字級系統 - 桌面版 (≥768px)

| 層級 | 用途 | 字體 | 字重 | 字級 | 行高 |
|------|------|------|------|------|------|
| H1 | 頁面主標題 | 獅尾四季春加糖 | 700 | 40px | 1.3 |
| H2 | 區塊標題 | 獅尾四季春加糖 | 500 | 28px | 1.3 |
| H3 | 小標題 | 獅尾四季春 | 500 | 20px | 1.3 |
| Body | 內文 | 獅尾四季春 | 400 | 16px | 1.8 |
| Small | 說明文字 | 獅尾四季春 | 400 | 14px | 1.6 |
| Caption | 註解 | Noto Sans TC | 400 | 12px | 1.6 |

### 字級系統 - 手機版 (<768px)

| 層級 | 字級 | 備註 |
|------|------|------|
| H1 | 30px | 縮小 |
| H2 | 24px | 縮小 |
| H3 | 18px | 縮小 |
| Body | 16px | 維持 |
| Small | 14px | 維持 |
| Caption | 12px | 維持 |

---

## 元件規範

### 圓角系統

| 元素 | 圓角值 | CSS 變數 |
|------|--------|----------|
| 按鈕 | 24px | --radius-lg |
| 卡片 | 24px | --radius-lg |
| 輸入框 | 12px | --radius-md |
| 標籤/Badge | 8px | --radius-sm |
| 頭像 | 50% | --radius-full |

### 陰影系統

```css
/* 輕柔陰影 - 卡片、按鈕 hover */
--shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.06);

/* 中等陰影 - 彈出層、下拉選單 */
--shadow-md: 0 4px 16px rgba(0, 0, 0, 0.08);

/* 深層陰影 - Modal、Toast */
--shadow-lg: 0 8px 32px rgba(0, 0, 0, 0.12);
```

### 漸層系統

```css
/* 主漸層 - 按鈕、背景裝飾 */
--gradient-primary: linear-gradient(135deg, #D4A5A5 0%, #B8A9C9 100%);

/* 淺漸層 - 卡片背景 */
--gradient-soft: linear-gradient(180deg, #FFFFFF 0%, #FAFAFA 100%);

/* 粉紫漸層 - 特殊強調 */
--gradient-pink: linear-gradient(135deg, #F5D0C5 0%, #C4B7D7 100%);
```

### 動畫系統

```css
/* 過渡時間 */
--transition-fast: 150ms ease;
--transition-normal: 250ms ease;
--transition-slow: 350ms ease;

/* 常用動畫 */
.fade-in {
  animation: fadeIn var(--transition-normal);
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Hover 效果 */
.hover-lift {
  transition: transform var(--transition-normal), box-shadow var(--transition-normal);
}
.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

---

## Icon 規範

| 項目 | 規範 |
|------|------|
| 風格 | SVG 線條風格 (Outline) |
| 線寬 | 1.5px - 2px |
| 尺寸 | 16px / 20px / 24px |
| 顏色 | 繼承 currentColor 或品牌色 |
| 禁止 | ❌ 不使用 Emoji 作為 UI 圖示 |

### 推薦 Icon 庫

- Lucide Icons (https://lucide.dev)
- Heroicons (https://heroicons.com)
- Tabler Icons (https://tabler-icons.io)

---

## 卡片 / 按鈕 CSS 範例

### 按鈕

```css
/* 主要按鈕 */
.btn-primary {
  background: var(--color-primary);
  color: #FFFFFF;
  padding: 12px 24px;
  border: none;
  border-radius: 24px;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.btn-primary:hover {
  background: #C9929A;
  transform: translateY(-2px);
  box-shadow: var(--shadow-sm);
}

/* 次要按鈕 */
.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  padding: 12px 24px;
  border: 2px solid var(--color-primary);
  border-radius: 24px;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
}

.btn-secondary:hover {
  background: var(--color-primary);
  color: #FFFFFF;
}

/* 漸層按鈕 */
.btn-gradient {
  background: var(--gradient-primary);
  color: #FFFFFF;
  padding: 12px 24px;
  border: none;
  border-radius: 24px;
  font-family: var(--font-body);
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-normal);
}
```

### 卡片

```css
.card {
  background: #FFFFFF;
  border-radius: 24px;
  padding: 24px;
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-normal);
}

.card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-md);
}

.card-title {
  font-family: var(--font-heading);
  font-size: 20px;
  font-weight: 500;
  color: #333333;
  margin-bottom: 12px;
}

.card-content {
  font-family: var(--font-body);
  font-size: 16px;
  color: #4A4A4A;
  line-height: 1.8;
}
```

---

## 深淺模式

### CSS 變數

```css
/* Light Mode（預設） */
:root {
  --bg-primary: #FAFAFA;
  --bg-card: #FFFFFF;
  --text-primary: #333333;
  --text-secondary: #4A4A4A;
  --text-muted: #888888;
  --border-color: #E8E4E1;
}

/* Dark Mode */
[data-theme="dark"] {
  --bg-primary: #1A1A1A;
  --bg-card: #2A2A2A;
  --text-primary: #F5F5F5;
  --text-secondary: #CCCCCC;
  --text-muted: #888888;
  --border-color: #3A3A3A;
}
```

### Toggle 按鈕 HTML

```html
<button class="theme-toggle" aria-label="切換深淺模式">
  <svg class="icon-sun" width="20" height="20"><!-- sun icon --></svg>
  <svg class="icon-moon" width="20" height="20"><!-- moon icon --></svg>
</button>
```

### JS 邏輯

```javascript
// 深淺模式切換
const themeToggle = document.querySelector('.theme-toggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

// 初始化主題
function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (prefersDark.matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

// 切換主題
function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

// 監聽系統主題變更
prefersDark.addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});

// 綁定事件
themeToggle.addEventListener('click', toggleTheme);
initTheme();
```

---

## 頁面結構

### 基本 Layout

```html
<body>
  <header class="header">
    <nav class="nav"><!-- 導航列 --></nav>
  </header>
  
  <main class="main">
    <section class="hero"><!-- 主視覺 --></section>
    <section class="content"><!-- 內容區 --></section>
  </main>
  
  <footer class="footer">
    <!-- 頁尾 -->
  </footer>
</body>
```

### Container 寬度

```css
.container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

@media (max-width: 768px) {
  .container {
    padding: 0 16px;
  }
}
```

---

## 響應式斷點

| 裝置 | 斷點 | 說明 |
|------|------|------|
| Desktop | ≥1024px | 桌面版完整佈局 |
| Tablet | 768px - 1023px | 平板適配 |
| Mobile | <768px | 手機版單欄 |

### Media Query

```css
/* Mobile First */
.element { /* 手機樣式 */ }

@media (min-width: 768px) {
  .element { /* 平板樣式 */ }
}

@media (min-width: 1024px) {
  .element { /* 桌面樣式 */ }
}
```

---

## PWA 圖示

### 檔案清單

| 檔案名稱 | 尺寸 | 用途 |
|---------|------|------|
| icon-72.png | 72×72 | Android 舊版 |
| icon-96.png | 96×96 | Android 舊版 |
| icon-128.png | 128×128 | Chrome Web Store |
| icon-144.png | 144×144 | Windows 動態磚 |
| icon-152.png | 152×152 | iOS |
| icon-192.png | 192×192 | Android（必要） |
| icon-384.png | 384×384 | Android 高解析 |
| icon-512.png | 512×512 | Android Splash（必要） |
| apple-touch-icon.png | 180×180 | iOS 主畫面 |
| favicon.ico | 32×32 | 瀏覽器分頁 |
| favicon.svg | 向量 | 現代瀏覽器 |

### 設計規則

1. 使用品牌主色 #D4A5A5 作為背景或強調色
2. 圖示簡潔，避免過多細節
3. 確保在小尺寸下仍清晰可辨
4. 圓角建議 20%（與品牌圓角呼應）
5. 提供 maskable icon（安全區域 80%）

### manifest.json 範例

```json
{
  "name": "Hello Ruru",
  "short_name": "Ruru",
  "theme_color": "#D4A5A5",
  "background_color": "#FAFAFA",
  "display": "standalone",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" },
    { "src": "/icons/icon-512-maskable.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable" }
  ]
}
```

---

## 禁止事項

| # | 禁止項目 | 說明 |
|---|---------|------|
| 1 | ❌ 禁止使用 Emoji 作為 UI 圖示 | 用 SVG icon 取代 |
| 2 | ❌ 禁止使用純黑 #000000 | 用 #333333 或 #4A4A4A |
| 3 | ❌ 禁止使用直角 (0px 圓角) | 最小圓角 8px |
| 4 | ❌ 禁止使用系統預設字體 | 必須載入指定字體 |
| 5 | ❌ 禁止使用高對比強烈陰影 | 陰影保持輕柔低對比 |

---

## AI 快速指令

複製以下內容給任何 AI，即可按規範開發：

```
# Hello Ruru Design System v1.3

## 品牌調性
溫柔、質感、日系文青、簡約

## 色彩
主色：#D4A5A5（乾燥玫瑰）
次色：#B8A9C9（薰衣草紫）
漸層：linear-gradient(135deg, #D4A5A5, #B8A9C9)

粉色系：#F5D0C5 腮紅粉 / #C9929A 灰玫瑰 / #E8B4B8 撫子粉 / #FEDFE1 櫻花粉
紫色系：#9B7E93 藕荷 / #C4B7D7 藤紫 / #8F77B5 桔梗紫
中性色：#A8B5A0 鼠尾草綠 / #E8E4E1 霧灰 / #B5ADA7 暖灰 / #5C5856 炭灰

文字色：#333333 標題 / #4A4A4A 內文 / #888888 說明 / #AAAAAA 註解
背景色：#FAFAFA 淺背景 / #FFFFFF 卡片

## 字體
標題（H1, H2）：獅尾四季春加糖, Noto Sans TC, sans-serif
內文（H3, p）：獅尾四季春, Noto Sans TC, sans-serif
小字（12px以下）：Noto Sans TC, sans-serif
程式碼：JetBrains Mono, Fira Code, monospace

字重：300 Light / 400 Regular / 500 Medium / 700 Bold

## 字級
H1：40px (手機 30px)，字重 700，行高 1.3
H2：28px (手機 24px)，字重 500，行高 1.3
H3：20px (手機 18px)，字重 500，行高 1.3
Body：16px，字重 400，行高 1.8
Small：14px，字重 400，行高 1.6
Caption：12px，字重 400，行高 1.6

## 圓角
按鈕/卡片：24px
輸入框：12px
標籤：8px
頭像：50%（圓形）

## 陰影
輕柔：0 2px 8px rgba(0,0,0,0.06)
中等：0 4px 16px rgba(0,0,0,0.08)
深層：0 8px 32px rgba(0,0,0,0.12)

## 圖示
風格：SVG 線條 (Outline)，線寬 1.5-2px
禁止：不使用 Emoji 作為 UI 圖示

## 響應式斷點
Desktop：≥1024px
Tablet：768px - 1023px
Mobile：<768px

## 禁止事項
1. 禁止使用 Emoji 作為 UI 圖示
2. 禁止使用純黑 #000000
3. 禁止使用直角 (0px 圓角)
4. 禁止使用系統預設字體
5. 禁止使用高對比強烈陰影

## 開發規則
1. 按鈕使用主色 #D4A5A5，圓角 24px
2. 卡片背景白色，圓角 24px，陰影輕柔低對比
3. 標題用獅尾四季春加糖，內文用獅尾四季春
4. 12px 以下小字改用 Noto Sans TC 確保清晰
5. 整體風格：溫柔、質感、日系文青
```

---

## 版本紀錄

| 版本 | 日期 | 變更 |
|------|------|------|
| v1.3 | 2026-01-30 | 新增元件規範、深淺模式、頁面結構、PWA 圖示、禁止事項 |
| v1.2 | 2026-01-30 | 擴充完整色彩系統、完善字體階層 |
| v1.1 | 2026-01-30 | 更新字體為獅尾四季春系列 |
| v1.0 | - | 初始版本 |

---

*Hello Ruru Design System - 用溫柔的力量，打造屬於你的數位花園*
