# Hello Ruru Design System v1.7

> 最後更新：2026-02-07

---

## 目錄

| 章節 | 內容 |
|------|------|
| 色彩系統 | 18 色完整色票（主色、粉色系、紫色系、中性色、文字色階） |
| 字體系統 | 源泉圓體 GenSenRounded 引入方式、字重規範、字級系統 |
| 元件規範 | 圓角、陰影、漸層、動畫 |
| Icon 規範 | Lucide SVG 線條風格、禁止 Emoji / 填充 Icon |
| 品牌頁首 | `<hello-ruru-header>` Web Component |
| 卡片/按鈕 | 完整 CSS 範例 |
| 深淺模式 | Toggle + JS 邏輯 |
| 頁面結構 | Layout + 響應式斷點 |
| Footer 規範 | 統一頁尾格式、年份自動更新 |
| 響應式斷點 | Desktop / Tablet / Mobile |
| PWA 圖示 | 檔案清單 + 設計規則 |
| 禁止事項 | 13 條紅線 |
| AI 快速指令 | 可直接複製給任何 AI |

---

## 品牌調性

關鍵詞：溫柔、質感、日系文青、簡約

---

## 色彩系統

### 主色調

| 用途 | 名稱 | 色碼 | 說明 |
|------|------|------|------|
| 主色 | Rose | `#D4A5A5` | 品牌主視覺、按鈕、強調 |
| 次色 | Lavender | `#B8A9C9` | 輔助裝飾、hover 狀態 |

### 粉色系

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 腮紅粉 | `#F5D0C5` | 背景輔助、淺色卡片 |
| 灰玫瑰 | `#C9929A` | 卡片 icon、標籤、按鈕 hover |
| 撫子粉 | `#E8B4B8` | hover 狀態、裝飾 |
| 櫻花粉 | `#FEDFE1` | 淺背景、提示框 |

### 紫色系

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 藕荷 | `#9B7E93` | 文字輔助、hover |
| 藤紫 | `#C4B7D7` | 淺紫背景、分隔線 |
| 桔梗紫 | `#8F77B5` | 深紫強調、連結 |

### 中性色

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 鼠尾草綠 | `#A8B5A0` | 對比撞色、成功狀態 |
| 霧灰 | `#E8E4E1` | 背景底色、分隔 |
| 暖灰 | `#B5ADA7` | 禁用狀態、邊框 |
| 炭灰 | `#5C5856` | 深色文字 |

### 文字色階

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 墨色 | `#333333` | 標題文字 |
| 炭灰 | `#4A4A4A` | 內文文字 |
| 灰石 | `#888888` | 說明文字 |
| 淺灰 | `#AAAAAA` | 註解、placeholder |
| 雪白 | `#FAFAFA` | 淺色背景 |
| 純白 | `#FFFFFF` | 卡片、容器 |

---

## 字體系統

> **v1.7（2026-02-07）**：明確禁用 `font-weight: 300`。GenSenRounded 僅提供 400/500/700 三個字重。
>
> **v1.6（2026-02-06）**：全面更換為源泉圓體（GenSenRounded TW），取代獅尾四季春系列，解決鋸齒問題。OFL 授權商用免費。

### 字體家族

| 用途 | 字體名稱 | 字重 | Fallback | 說明 |
|------|---------|------|----------|------|
| 標題（H1, H2） | 源泉圓體 GenSenRounded | 700 Bold | Noto Sans TC | 圓潤溫柔，基於思源黑體 |
| 內文（H3, p） | 源泉圓體 GenSenRounded | **500 Medium** | Noto Sans TC | 清晰好讀，無鋸齒 |
| 輕量文字 | 源泉圓體 GenSenRounded | 400 Regular | Noto Sans TC | 副標題、說明文字 |
| 小字/註解（≤12px） | Noto Sans TC | 400 Regular | sans-serif | 確保清晰 |
| 程式碼 | JetBrains Mono | 400 | Fira Code | 等寬字體 |

### 字體引入方式

**CDN**：`https://lab.helloruru.com/fonts/`

```css
/* 源泉圓體 GenSenRounded TW */
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

/* Noto Sans TC (Google Fonts) */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;700&display=swap');
```

### 語言對應

| 語言 | 字體處理 | 備註 |
|------|---------|------|
| 繁體中文 | 源泉圓體 GenSenRounded | 完整支援，主要語言 |
| 英文 | GenSenRounded 內建 | 風格一致 |
| 日文 | GenSenRounded 內建 | 缺字 fallback 至 Noto Sans TC |

### 字重規範

**可用字重**：

| 字重 | 數值 | 用途 |
|------|------|------|
| Regular | 400 | 輕量文字、副標題、說明 |
| **Medium** | **500** | **內文預設**、按鈕、小標題 |
| Bold | 700 | 頁面主標題、品牌標語 |

**禁止字重**：

| 數值 | 狀態 | 原因 |
|------|------|------|
| 100, 200, 300 | 禁止 | GenSenRounded 無此字重，瀏覽器 fallback 不一致 |
| 600, 800, 900 | 禁止 | GenSenRounded 無此字重 |

> **重要**：使用不存在的字重會導致瀏覽器在自訂字體和 fallback 字體之間不一致地 fallback，造成同一行文字出現粗細混亂的視覺問題。

### 字級系統

| 層級 | 桌面版 | 手機版 | 字重 | 行高 |
|------|--------|--------|------|------|
| H1 | 40px | 30px | 700 | 1.3 |
| H2 | 28px | 24px | 500 | 1.3 |
| H3 | 20px | 18px | 500 | 1.3 |
| Body | 16px | 16px | **500** | 1.8 |
| Small | 14px | 14px | 500 | 1.6 |
| Caption | 12px | 12px | 400 | 1.6 |

---

## 元件規範

### 圓角系統

| 元素 | 圓角值 | CSS 變數 |
|------|--------|----------|
| 按鈕 | 24px | `--radius-lg` |
| 卡片 | 24px | `--radius-lg` |
| 輸入框 | 12px | `--radius-md` |
| 標籤/Badge | 8px | `--radius-sm` |
| 頭像 | 50% | `--radius-full` |

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
| 風格 | SVG 線條風格 (Outline / Stroke) |
| 線寬 | 1.5px – 2px |
| 尺寸 | 16px / 20px / 24px |
| 顏色 | 繼承 `currentColor` 或品牌色 |
| 首選來源 | [Lucide Icons](https://lucide.dev) |
| 禁止 | Emoji 作為 UI 圖示 |
| 禁止 | 填充（Filled）風格 Icon |

---

## 品牌頁首

> **v1.7 新增（2026-02-07）**：所有公開工具網站必須使用統一的品牌頁首 Web Component。

### Web Component

**CDN**：`https://lab.helloruru.com/shared/brand-header.js`
**原始碼**：`helloruru.github.io/shared/brand-header.js`

### 使用方式

```html
<script src="https://lab.helloruru.com/shared/brand-header.js"></script>
<hello-ruru-header title="網站標題"></hello-ruru-header>
```

### 屬性

| 屬性 | 說明 | 預設值 |
|------|------|--------|
| `title` | 網站標題文字 | （無） |
| `href` | Logo 連結目標 | `https://lab.helloruru.com` |

### 功能

- 花朵 Logo SVG + "Hello Ruru" 粉紫漸層文字 + 網站標題
- Shadow DOM 隔離樣式，不影響各站 CSS
- GenSenRounded 字體（自帶載入）
- 更新 `brand-header.js` 即全站同步

### 適用範圍

| 網站 | title 屬性 | 是否必要 |
|------|-----------|----------|
| `tools.helloruru.com/hihi/` | 問安圖產生器 | 必要 |
| `tools.helloruru.com/reader-quiz/` | 電子書閱讀器選購測驗 | 必要 |
| `tools.helloruru.com/spell/` | SD 咒語產生器 | 必要 |
| `newday.helloruru.com` | 離職全能導航幫手 | 必要 |
| `lab.helloruru.com` | —（已有完整花朵 Hero） | 不需要 |

### 禁止事項

- 禁止各站自行實作品牌 Logo / Header
- 禁止修改 Web Component 的 Shadow DOM 內部樣式
- 禁止移除品牌頁首

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
  font-family: 'GenSenRounded', 'Noto Sans TC', sans-serif;
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
  font-family: 'GenSenRounded', 'Noto Sans TC', sans-serif;
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
  font-family: 'GenSenRounded', 'Noto Sans TC', sans-serif;
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
  font-family: 'GenSenRounded', 'Noto Sans TC', sans-serif;
  font-size: 20px;
  font-weight: 500;
  color: #333333;
  margin-bottom: 12px;
}

.card-content {
  font-family: 'GenSenRounded', 'Noto Sans TC', sans-serif;
  font-size: 16px;
  font-weight: 500;
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
const themeToggle = document.querySelector('.theme-toggle');
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');

function initTheme() {
  const saved = localStorage.getItem('theme');
  if (saved) {
    document.documentElement.setAttribute('data-theme', saved);
  } else if (prefersDark.matches) {
    document.documentElement.setAttribute('data-theme', 'dark');
  }
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
}

prefersDark.addEventListener('change', (e) => {
  if (!localStorage.getItem('theme')) {
    document.documentElement.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  }
});

themeToggle.addEventListener('click', toggleTheme);
initTheme();
```

---

## 頁面結構

### 基本 Layout

```html
<body>
  <!-- 品牌頁首（工具站必要） -->
  <script src="https://lab.helloruru.com/shared/brand-header.js"></script>
  <hello-ruru-header title="網站標題"></hello-ruru-header>

  <header class="hero"><!-- 主視覺 --></header>

  <main class="main">
    <section class="content"><!-- 內容區 --></section>
  </main>

  <footer class="site-footer">
    <!-- 頁尾（見 Footer 規範） -->
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

## Footer 規範

### 標準格式

所有 Hello Ruru 網站必須使用統一的 Footer 格式：

```
© {年份} Kaoru Tsai. All Rights Reserved. | Contact: hello@helloruru.com
```

### 年份顯示規則

| 情況 | 顯示格式 | 範例 |
|------|---------|------|
| 當前年份 = 起始年份 | `{起始年份}` | `© 2026` |
| 當前年份 > 起始年份 | `{起始年份}–{當前年份}` | `© 2026–2027` |

> **注意**：使用 en dash（–）而非連字號（-）

### HTML 實作

```html
<footer class="site-footer">
  <p>&copy; <span id="footer-year"></span> Kaoru Tsai. All Rights Reserved. | Contact: <a href="mailto:hello@helloruru.com">hello@helloruru.com</a></p>
</footer>
<script>
  const startYear = 2026;
  const currentYear = new Date().getFullYear();
  document.getElementById('footer-year').textContent =
    currentYear > startYear ? `${startYear}\u2013${currentYear}` : `${startYear}`;
</script>
```

### 樣式規範

| 項目 | 規範 |
|------|------|
| 字級 | 14px (Small) |
| 顏色 | `#888888` |
| 連結顏色 | `#D4A5A5` |
| 對齊 | 置中 |
| 間距 | `padding: 32px 0` |

### 禁止事項

| 錯誤 | 正確 |
|------|------|
| `All rights reserved.`（小寫） | `All Rights Reserved.`（大寫） |
| `Built with curiosity at HelloRuru` | 必須使用標準格式 |
| 缺少聯絡信箱 | 必須包含 `hello@helloruru.com` |
| `2026-2027`（連字號） | `2026–2027`（en dash） |

---

## 響應式斷點

| 裝置 | 斷點 | 說明 |
|------|------|------|
| Desktop | ≥1024px | 桌面版完整佈局 |
| Tablet | 768px – 1023px | 平板適配 |
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
| icon-72.png | 72x72 | Android 舊版 |
| icon-96.png | 96x96 | Android 舊版 |
| icon-128.png | 128x128 | Chrome Web Store |
| icon-144.png | 144x144 | Windows 動態磚 |
| icon-152.png | 152x152 | iOS |
| icon-192.png | 192x192 | Android（必要） |
| icon-384.png | 384x384 | Android 高解析 |
| icon-512.png | 512x512 | Android Splash（必要） |
| apple-touch-icon.png | 180x180 | iOS 主畫面 |
| favicon.ico | 32x32 | 瀏覽器分頁 |
| favicon.svg | 向量 | 現代瀏覽器 |

### 設計規則

1. 使用品牌主色 `#D4A5A5` 作為背景或強調色
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
| 1 | 禁止使用 Emoji 作為 UI 圖示 | 用 Lucide SVG icon 取代 |
| 2 | 禁止使用純黑 `#000000` | 用 `#333333` 或 `#4A4A4A` |
| 3 | 禁止使用直角 (0px 圓角) | 最小圓角 8px |
| 4 | 禁止使用系統預設字體 | 必須載入 GenSenRounded |
| 5 | 禁止使用高對比強烈陰影 | 陰影保持輕柔低對比 |
| 6 | 禁止非標準 Footer 格式 | 必須符合 Footer 規範 |
| 7 | 禁止使用非規範色彩 | 僅使用色彩系統定義的色碼 |
| 8 | 禁止使用填充 Icon | 僅限線條風格 (Outline/Stroke) |
| 9 | 禁止 `font-weight: 300` | GenSenRounded 僅 400/500/700 |
| 10 | 禁止 `font-weight: 100/200/600/800/900` | 同上 |
| 11 | 禁止各站自行實作品牌 Header | 必須使用 `<hello-ruru-header>` |
| 12 | 禁止省略或修改 Footer 著作權聲明 | 法律效力 |
| 13 | 禁止使用獅尾四季春字體（已棄用） | v1.6 起統一為 GenSenRounded |

---

## AI 快速指令

複製以下內容給任何 AI，即可按規範開發：

```
# Hello Ruru Design System v1.7

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
全站：源泉圓體 GenSenRounded TW, Noto Sans TC, sans-serif
CDN：https://lab.helloruru.com/fonts/GenSenRounded-{Regular|Medium|Bold}.woff2
小字（12px以下）：Noto Sans TC, sans-serif
程式碼：JetBrains Mono, Fira Code, monospace

可用字重：400 Regular / 500 Medium（內文預設） / 700 Bold
禁止字重：100, 200, 300, 600, 800, 900（GenSenRounded 不支援）

## 字級
H1：40px (手機 30px)，字重 700，行高 1.3
H2：28px (手機 24px)，字重 500，行高 1.3
H3：20px (手機 18px)，字重 500，行高 1.3
Body：16px，字重 500，行高 1.8
Small：14px，字重 500，行高 1.6
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
風格：Lucide Icons，SVG 線條 (Outline)，線寬 1.5-2px
禁止：Emoji 作為 UI 圖示、填充 Icon

## 品牌頁首（工具站必要）
<script src="https://lab.helloruru.com/shared/brand-header.js"></script>
<hello-ruru-header title="網站標題"></hello-ruru-header>

## Footer（必須遵守）
格式：© {年份} Kaoru Tsai. All Rights Reserved. | Contact: hello@helloruru.com
年份：2026 或 2026–2027（自動計算，en dash）
字級：14px，顏色 #888888，連結色 #D4A5A5

## 響應式斷點
Desktop：≥1024px
Tablet：768px – 1023px
Mobile：<768px

## 禁止事項
1. 禁止 Emoji 作為 UI 圖示（用 Lucide SVG）
2. 禁止純黑 #000000（用 #333333 或 #4A4A4A）
3. 禁止直角 0px 圓角（最小 8px）
4. 禁止系統預設字體（必須載入 GenSenRounded）
5. 禁止 font-weight: 300 或其他不支援字重
6. 禁止填充 Icon
7. 禁止自行實作品牌 Header（用 Web Component）
8. 禁止非標準 Footer 格式
```

---

## 版本紀錄

| 版本 | 日期 | 變更 |
|------|------|------|
| v1.7 | 2026-02-07 | 禁用 font-weight 300、品牌頁首 Web Component 標準化、Icon 系統規範（Lucide 優先） |
| v1.6 | 2026-02-06 | 全面更換為源泉圓體 GenSenRounded TW，棄用獅尾四季春系列 |
| v1.5 | 2026-02-01 | 字體系統微調、Footer 法律效力聲明 |
| v1.4 | 2026-01-30 | 新增 Footer 規範（統一格式、年份自動更新、程式碼範例） |
| v1.3 | 2026-01-30 | 新增元件規範、深淺模式、頁面結構、PWA 圖示、禁止事項 |
| v1.2 | 2026-01-30 | 擴充完整色彩系統、完善字體階層 |
| v1.1 | 2026-01-30 | 更新字體為獅尾四季春系列 |
| v1.0 | — | 初始版本 |

---

*Hello Ruru Design System v1.7 — 用溫柔的力量，打造屬於你的數位花園*
