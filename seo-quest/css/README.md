# SEO Quest - CSS 架構說明

> 雙層變數架構（Palette + Semantic）+ 模組化設計

**最後更新**：2026-02-12
**作者**：Claude + 小玫瑰

---

## 📁 目錄結構

```
css/
├── base/                      # 基礎層
│   ├── tokens.css            # 🎨 設計變數（Palette + Semantic）
│   ├── fonts.css             # 📝 字體引用
│   ├── reset.css             # 🔄 CSS Reset
│   └── utilities.css         # 🛠️ 工具類別
├── components/                # 元件層
│   ├── error-boundary.css    # 🛡️ 錯誤邊界
│   ├── resource-loader.css   # 📦 資源預載入
│   ├── mode-switch.css       # 🔄 模式切換器
│   ├── progress.css          # 📊 進度條/經驗值
│   └── transitions.css       # ✨ 階段轉場動畫
├── layout.css                # 📐 版面配置
├── typography.css            # ✍️ 文字排版
├── style.css                 # 🚀 主入口檔案
└── README.md                 # 📖 本文件
```

---

## 🎨 設計系統架構

### 雙層變數系統

#### 第一層：Palette（原始色盤）

純粹的顏色定義，不帶任何語意。

```css
:root {
  /* 玫瑰色系 */
  --rose-50: #FFF1F2;
  --rose-100: #FFE4E6;
  --rose-500: #D4A5A5;  /* 主要玫瑰色 */
  --rose-900: #5F3F3F;

  /* 紫色系 */
  --purple-500: #B8A9C9;

  /* 中性灰系 */
  --gray-50: #F9FAFB;
  --gray-900: #111827;
}
```

#### 第二層：Semantic（語意變數）

對應到實際使用場景的變數。

```css
:root {
  /* 品牌顏色 */
  --color-primary: var(--rose-500);
  --color-secondary: var(--purple-500);

  /* 背景顏色 */
  --color-background: #FFFFFF;
  --color-surface: var(--gray-100);

  /* 文字顏色 */
  --color-text-primary: var(--gray-900);
  --color-text-secondary: var(--gray-600);

  /* 狀態顏色 */
  --color-success: var(--green-500);
  --color-error: var(--red-500);
}
```

### 優勢

✅ **易維護**：改顏色只需修改 `:root`
✅ **深色模式**：只需重新定義語意變數
✅ **可擴充**：新增主題不影響元件
✅ **語意清晰**：`--color-primary` 比 `--rose-500` 更易理解

---

## 🎯 使用方式

### ✅ 推薦：使用 Semantic 變數

```css
/* 元件樣式 */
.button {
  background: var(--color-primary);      /* ✅ 好 */
  color: var(--color-text-inverse);
  border: 1px solid var(--color-border);
}

.button:hover {
  background: var(--color-primary-hover);
}
```

### ⚠️ 特殊情況：可使用 Palette

```css
/* 漸層效果 */
.gradient-bg {
  background: linear-gradient(
    135deg,
    var(--rose-300),      /* ⚠️ 特殊情況 */
    var(--purple-300)
  );
}
```

### ❌ 避免：硬編碼顏色

```css
.button {
  background: #D4A5A5;  /* ❌ 不好 - 無法統一管理 */
  color: #FFFFFF;       /* ❌ 不好 - 無法切換主題 */
}
```

---

## 🏗️ 檔案說明

### 基礎層 (Base)

#### `tokens.css` - 設計變數

包含所有設計 token：

- **Palette**：原始色盤（50-900）
- **Semantic**：語意變數
- **Typography**：字體、字重、行高
- **Spacing**：4px 基準間距系統
- **Radius**：圓角
- **Shadow**：陰影
- **Transition**：過渡效果
- **Z-index**：層級
- **Breakpoints**：斷點

#### `fonts.css` - 字體引用

引用字體檔案：

- **GenSenRounded**（主要字體）：Regular, Medium, Bold
- **Noto Sans TC**（備用字體）
- **JetBrains Mono**（等寬字體）

#### `reset.css` - CSS 重置

現代化的 CSS Reset：

- Box Model 重置
- 標題、段落、列表重置
- 表單元素統一樣式
- 無障礙考量（focus-visible, reduced-motion）

#### `utilities.css` - 工具類別

常用工具類別：

- Display、Flex、Grid
- 文字對齊、顏色、大小
- 間距（Margin、Padding）
- 圓角、邊框、陰影
- Position、Overflow、Cursor

---

### 元件層 (Components)

#### `error-boundary.css` - 錯誤邊界

友善的錯誤提示 UI：

- Overlay 遮罩
- 錯誤卡片
- 建議列表
- Debug 資訊（開發模式）

#### `resource-loader.css` - 資源預載入

載入畫面樣式：

- 漸層背景
- Logo 動畫
- 進度條（含閃光效果）
- 百分比顯示

#### `mode-switch.css` - 模式切換器

Tutorial Mode ⇄ Tool Mode 切換器。

#### `progress.css` - 進度條/經驗值

等級、經驗值、星級評分顯示。

#### `transitions.css` - 階段轉場動畫

5 種全螢幕轉場：

1. **Scroll Unroll**（Tutorial → Demo）
2. **Map Movement**（Demo → Practice）
3. **Card Flip**（Practice → Score）
4. **Spotlight**（Score → Levelup）
5. **Particle Burst**（慶祝特效）

---

## 🌈 深色模式支援

已預先準備深色模式架構：

```css
[data-theme="dark"] {
  /* 重新定義語意變數即可 */
  --color-background: var(--gray-900);
  --color-text-primary: var(--gray-50);
  --color-primary: var(--rose-400);  /* 較亮的版本 */
}
```

啟用方式：

```html
<html data-theme="dark">
  <!-- 自動套用深色模式 -->
</html>
```

---

## 📱 響應式設計

### 斷點系統

```css
:root {
  --breakpoint-sm: 640px;   /* 手機橫向 */
  --breakpoint-md: 768px;   /* 平板直向 */
  --breakpoint-lg: 1024px;  /* 平板橫向 */
  --breakpoint-xl: 1280px;  /* 桌面 */
  --breakpoint-2xl: 1536px; /* 大桌面 */
}
```

### 使用範例

```css
/* 預設：手機 */
.card {
  padding: var(--spacing-md);
}

/* 平板以上 */
@media (min-width: 768px) {
  .card {
    padding: var(--spacing-xl);
  }
}

/* 桌面以上 */
@media (min-width: 1024px) {
  .card {
    padding: var(--spacing-2xl);
  }
}
```

---

## ♿ 無障礙支援

### Reduced Motion（減少動畫）

自動偵測使用者偏好：

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Focus Visible

清晰的焦點指示：

```css
:focus-visible {
  outline: 2px solid var(--color-focus);
  outline-offset: 2px;
}
```

### ARIA 屬性支援

```css
[aria-disabled="true"],
[disabled] {
  cursor: not-allowed;
  opacity: 0.5;
}

[aria-busy="true"] {
  cursor: wait;
}
```

---

## 🛠️ 開發建議

### 新增元件

1. 在 `css/components/` 創建新檔案
2. 在 `style.css` 中 import
3. 使用 Semantic 變數
4. 遵循 BEM 命名規範

```css
/* components/new-component.css */
.new-component {
  /* 使用 Semantic 變數 */
  background: var(--color-surface);
  color: var(--color-text-primary);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}

.new-component__header {
  /* BEM 命名 */
}

.new-component--active {
  /* BEM 修飾符 */
}
```

### 新增顏色

1. 在 `tokens.css` 的 Palette 新增原始色盤
2. 在 Semantic 新增語意變數
3. 在元件中使用 Semantic 變數

```css
/* tokens.css - Palette */
:root {
  --teal-500: #14B8A6;  /* 新增原始色 */
}

/* tokens.css - Semantic */
:root {
  --color-highlight: var(--teal-500);  /* 新增語意變數 */
}

/* 元件中使用 */
.highlight {
  background: var(--color-highlight);
}
```

---

## 📊 效能考量

### Import 順序

CSS 載入順序已優化：

1. **Tokens** → 最早載入變數
2. **Fonts** → 字體預載
3. **Reset** → 重置瀏覽器預設
4. **Utilities** → 工具類別
5. **Layout/Typography** → 基礎樣式
6. **Components** → 元件樣式

### 減少重繪

使用 `transform` 和 `opacity` 實作動畫：

```css
/* ✅ 好 - 使用 transform */
.animate {
  transform: translateY(10px);
  transition: transform var(--transition-base);
}

/* ❌ 避免 - 使用 top */
.animate {
  top: 10px;  /* 觸發 reflow */
}
```

---

## 🔍 除錯工具

### Debug 模式

在 HTML 加上 `data-debug="true"`：

```html
<html data-debug="true">
  <!-- 所有元素顯示紅色邊框 -->
</html>
```

### 瀏覽器開發工具

1. **Chrome DevTools** → Elements → Computed
2. 搜尋變數名稱（如 `--color-primary`）
3. 查看實際計算值

---

## 📚 參考資源

- [Design Tokens](https://designtokens.org/)
- [BEM Methodology](http://getbem.com/)
- [Web Content Accessibility Guidelines (WCAG)](https://www.w3.org/WAI/WCAG21/quickref/)
- [Modern CSS Reset](https://piccalil.li/blog/a-modern-css-reset/)

---

## ✅ Checklist

實作新元件時的檢查清單：

- [ ] 使用 Semantic 變數而非硬編碼顏色
- [ ] 遵循 BEM 命名規範
- [ ] 加入 hover、focus、active 狀態
- [ ] 考慮響應式設計
- [ ] 加入無障礙支援（focus-visible, ARIA）
- [ ] 支援 reduced-motion
- [ ] 測試深色模式（如有）

---

**完成！CSS 結構化已完成** 🎉

現在可以開始實作其他元件，所有設計變數和基礎樣式都已就位！
