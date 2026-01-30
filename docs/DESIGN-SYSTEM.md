# Hello Ruru Design System v1.2

> 最後更新：2026-01-30

---

## 品牌調性

**關鍵詞**：溫柔、質感、日系文青、簡約

---

## 色彩系統

### 主色調

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 乾燥玫瑰 | `#D4A5A5` | 主強調色、CTA 按鈕 |
| 薰衣草紫 | `#B8A9C9` | 次強調色、漸層搭配 |

### 粉色系

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 腮紅粉 | `#F5D0C5` | 背景輔助、淺色卡片 |
| 灰玫瑰 | `#C9929A` | 卡片 icon、標籤 |
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

### 字體家族

| 用途 | 字體名稱 | Fallback | 說明 |
|------|---------|----------|------|
| 標題 | 獅尾四季春加糖 (Swei Spring Sugar) | Noto Sans TC, sans-serif | 圓潤甜美，品牌識別 |
| 內文 | 獅尾四季春 (Swei Spring) | Noto Sans TC, sans-serif | 清新好讀 |
| 小字/註解 | Noto Sans TC | sans-serif | 12px 以下確保清晰 |
| 程式碼 | JetBrains Mono | Fira Code, monospace | 等寬字體 |

### 語言對應

| 語言 | 字體處理 | 備註 |
|------|---------|------|
| **繁體中文** | 獅尾四季春系列（完整支援） | 主要語言 |
| **英文** | 獅尾四季春內建英數字 | 風格一致，不需額外指定 |
| **日文** | 獅尾四季春內建假名 + 常用漢字 | 缺字自動 fallback 至 Noto Sans TC |

### 字重規範

| 字重 | 數值 | 用途 |
|------|------|------|
| Light | 300 | 大面積內文（僅獅尾四季春） |
| Regular | 400 | 內文、說明文字 |
| Medium | 500 | 小標題、按鈕、強調 |
| Bold | 700 | 頁面主標題、品牌標語 |

---

## 字級系統

### 桌面版 (≥768px)

| 層級 | 用途 | 字體 | 字重 | 字級 | 行高 |
|------|------|------|------|------|------|
| H1 | 頁面主標題 | 獅尾四季春加糖 | 700 | 40px (2.5rem) | 1.3 |
| H2 | 區塊標題 | 獅尾四季春加糖 | 500 | 28px (1.75rem) | 1.3 |
| H3 | 小標題 | 獅尾四季春 | 500 | 20px (1.25rem) | 1.3 |
| Body | 內文 | 獅尾四季春 | 400 | 16px (1rem) | 1.8 |
| Small | 說明文字 | 獅尾四季春 | 400 | 14px (0.875rem) | 1.6 |
| Caption | 註解、時間戳 | Noto Sans TC | 400 | 12px (0.75rem) | 1.6 |

### 手機版 (<768px)

| 層級 | 字級 | 備註 |
|------|------|------|
| H1 | 30px (1.875rem) | 縮小 |
| H2 | 24px (1.5rem) | 縮小 |
| H3 | 18px (1.125rem) | 縮小 |
| Body | 16px (1rem) | 維持不變 |
| Small | 14px (0.875rem) | 維持不變 |
| Caption | 12px (0.75rem) | 維持不變 |

---

## 字距與行高

| 類型 | 數值 | 用途 |
|------|------|------|
| **行高 - 緊湊** | 1.3 | 標題 |
| **行高 - 一般** | 1.6 | 短文、UI |
| **行高 - 寬鬆** | 1.8 | 長文閱讀 |
| **字距 - 緊湊** | -0.01em | 大標題 |
| **字距 - 一般** | 0.02em | 內文 |
| **字距 - 寬鬆** | 0.08em | 品牌標語、英文小字 |

---

## 圓角系統

| 元素 | 圓角值 | 說明 |
|------|--------|------|
| 按鈕 | 24px | 品牌特色，圓潤感 |
| 卡片 | 24px | 統一視覺 |
| 輸入框 | 12px | 較小元素 |
| 標籤/Badge | 8px | 小型元素 |
| 頭像 | 50% | 圓形 |

---

## 圖示規範

| 項目 | 規範 |
|------|------|
| 風格 | SVG 線條風格 (Outline) |
| 線寬 | 1.5px - 2px |
| 顏色 | 繼承文字顏色或使用品牌色 |
| 禁止 | ❌ 不使用 Emoji 作為 UI 圖示 |

---

## CSS 變數速查

```css
:root {
  /* ===== 色彩 ===== */
  /* 主色 */
  --color-primary: #D4A5A5;
  --color-secondary: #B8A9C9;
  
  /* 粉色系 */
  --color-blush: #F5D0C5;
  --color-rose-gray: #C9929A;
  --color-nadeshiko: #E8B4B8;
  --color-sakura: #FEDFE1;
  
  /* 紫色系 */
  --color-lotus: #9B7E93;
  --color-wisteria: #C4B7D7;
  --color-bellflower: #8F77B5;
  
  /* 中性色 */
  --color-sage: #A8B5A0;
  --color-mist: #E8E4E1;
  --color-warm-gray: #B5ADA7;
  --color-charcoal: #5C5856;
  
  /* 文字色 */
  --color-text: #333333;
  --color-text-body: #4A4A4A;
  --color-text-muted: #888888;
  --color-text-caption: #AAAAAA;
  --color-bg-light: #FAFAFA;
  --color-bg-white: #FFFFFF;
  
  /* ===== 字體 ===== */
  --font-heading: 'Swei Spring Sugar', 'Noto Sans TC', sans-serif;
  --font-body: 'Swei Spring', 'Noto Sans TC', sans-serif;
  --font-caption: 'Noto Sans TC', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* ===== 字重 ===== */
  --weight-light: 300;
  --weight-regular: 400;
  --weight-medium: 500;
  --weight-bold: 700;
  
  /* ===== 字級 ===== */
  --text-h1: 2.5rem;
  --text-h2: 1.75rem;
  --text-h3: 1.25rem;
  --text-body: 1rem;
  --text-small: 0.875rem;
  --text-caption: 0.75rem;
  
  /* ===== 行高 ===== */
  --leading-tight: 1.3;
  --leading-normal: 1.6;
  --leading-relaxed: 1.8;
  
  /* ===== 圓角 ===== */
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 24px;
  --radius-full: 50%;
}
```

---

## AI 開發指令

當開發 Hello Ruru 相關專案時，請遵循以下規範：

### 字體使用

```
標題 (H1, H2)：使用 var(--font-heading)，即獅尾四季春加糖
內文 (H3, p, span)：使用 var(--font-body)，即獅尾四季春
小字 (12px 以下)：使用 var(--font-caption)，即 Noto Sans TC
```

### 色彩使用

```
主要按鈕/CTA：使用 var(--color-primary) #D4A5A5
次要元素/裝飾：使用 var(--color-secondary) #B8A9C9
漸層背景：linear-gradient(135deg, #D4A5A5, #B8A9C9)
文字：根據層級使用對應的 --color-text 變數
```

### 元件風格

```
按鈕圓角：24px (var(--radius-lg))
卡片圓角：24px
陰影：輕柔、低對比
圖示：SVG outline 風格，禁用 Emoji
整體風格：溫柔、質感、日系文青
```

---

## 檔案引用

### CSS 引用

```html
<link rel="stylesheet" href="https://lab.helloruru.com/assets/css/hello-ruru-typography.css">
```

### 字體 CDN

```css
/* 獅尾四季春加糖 */
@font-face {
  font-family: 'Swei Spring Sugar';
  src: url('https://cdn.jsdelivr.net/gh/nicholaschu/Swei-Spring-Sugar/webfont/SweiSpringSugarCJKtc-Regular.woff2') format('woff2');
  font-weight: 400;
}

/* 獅尾四季春 */
@font-face {
  font-family: 'Swei Spring';
  src: url('https://cdn.jsdelivr.net/gh/nicholaschu/Swei-Spring/webfont/SweiSpringCJKtc-Regular.woff2') format('woff2');
  font-weight: 400;
}

/* Noto Sans TC (Google Fonts) */
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@300;400;500;700&display=swap');
```

---

## 版本紀錄

| 版本 | 日期 | 變更 |
|------|------|------|
| v1.2 | 2026-01-30 | 擴充完整色彩系統（18 色）、完善字體階層規範 |
| v1.1 | 2026-01-30 | 更新字體為獅尾四季春系列 |
| v1.0 | - | 初始版本 |

---

*Hello Ruru Design System - 用溫柔的力量，打造屬於你的數位花園*
