# Hello Ruru Design System v1.5

> 更新日期：2026-02-05
> v1.5 重點：新增 Medium (500) 字重，內文改用 Medium 提升可讀性

---

## 字體系統

### 字體來源

CDN：`https://lab.helloruru.com/fonts/`

| 檔案 | 字重 | 大小 |
|------|------|------|
| `SweiSpring-Regular.woff2` | 400 Regular | ~147KB |
| `SweiSpring-Medium.woff2` | 500 Medium | ~149KB |
| `SweiSugar-Bold.woff2` | 700 Bold | ~207KB |

### 字體對應

| 用途 | 字體 | 字重 | CSS 變數 |
|------|------|------|----------|
| 標題（H1, H2） | Swei Sugar | 700 Bold | `--font-heading` |
| 內文（H3, p） | Swei Spring | **500 Medium** | `--font-body` |
| 小字（≤12px） | Noto Sans TC | 400 Regular | `--font-small` |

### CSS 引用

```css
/* Design System v1.5 — 獅尾字體（全域子集化） */

@font-face {
  font-family: 'Swei Spring';
  src: url('https://lab.helloruru.com/fonts/SweiSpring-Regular.woff2') format('woff2');
  font-weight: 400;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Swei Spring';
  src: url('https://lab.helloruru.com/fonts/SweiSpring-Medium.woff2') format('woff2');
  font-weight: 500;
  font-style: normal;
  font-display: swap;
}

@font-face {
  font-family: 'Swei Sugar';
  src: url('https://lab.helloruru.com/fonts/SweiSugar-Bold.woff2') format('woff2');
  font-weight: 700;
  font-style: normal;
  font-display: swap;
}

:root {
  --font-heading: 'Swei Sugar', 'Noto Sans TC', sans-serif;
  --font-body: 'Swei Spring', 'Noto Sans TC', sans-serif;
  --font-small: 'Noto Sans TC', sans-serif;
}

body {
  font-family: var(--font-body);
  font-weight: 500; /* v1.5: Medium */
}

h1, h2, h3, h4, h5, h6 {
  font-family: var(--font-heading);
}
```

---

## 字級系統

| 層級 | 桌面版 | 手機版 | 字重 | 行高 |
|------|--------|--------|------|------|
| H1 | 40px | 30px | 700 | 1.3 |
| H2 | 28px | 24px | 500 | 1.3 |
| H3 | 20px | 18px | 500 | 1.3 |
| Body | 16px | 16px | **500** | 1.8 |
| Small | 14px | 14px | 500 | 1.6 |
| Caption | 12px | 12px | 400 | 1.6 |

---

## 色彩系統

### 主色調

| 名稱 | 色碼 | 用途 |
|------|------|------|
| Rose | `#D4A5A5` | 主色 |
| Lavender | `#B8A9C9` | 次色 |

### 粉色系

| 名稱 | 色碼 | 用途 |
|------|------|------|
| 腮紅粉 | `#F5D0C5` | 背景輔助、淺色卡片 |
| 灰玫瑰 | `#C9929A` | icon、標籤、hover |
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

### 漸層

| 名稱 | CSS |
|------|-----|
| 主漸層 | `linear-gradient(135deg, #D4A5A5, #B8A9C9)` |
| 淺漸層 | `linear-gradient(180deg, #FFFFFF, #FAFAFA)` |
| 粉紫漸層 | `linear-gradient(135deg, #F5D0C5, #C4B7D7)` |

---

## 圓角系統

| 元素 | 圓角 | CSS 變數 |
|------|------|----------|
| 按鈕 | 24px | `--radius-lg` |
| 卡片 | 24px | `--radius-lg` |
| 輸入框 | 12px | `--radius-md` |
| 標籤/Badge | 8px | `--radius-sm` |
| 頭像 | 50% | `--radius-full` |

---

## 陰影系統

| 層級 | CSS | 用途 |
|------|-----|------|
| 輕柔 | `0 2px 8px rgba(0,0,0,0.06)` | 卡片、按鈕 hover |
| 中等 | `0 4px 16px rgba(0,0,0,0.08)` | 彈出層、下拉選單 |
| 深層 | `0 8px 32px rgba(0,0,0,0.12)` | Modal、Toast |

---

## v1.5 變更記錄

- ✅ 新增 `SweiSpring-Medium.woff2` (500) 字重
- ✅ Body 字重從 400 → **500**
- ✅ Small 字重從 400 → **500**
- ✅ 字體 CDN：`lab.helloruru.com/fonts/`
