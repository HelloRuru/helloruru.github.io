# Hello Ruru — UI Snippets

可重用的 UI 元件片段，遵循 Design System v1.4 規範。

## 檔案結構

```
snippets/
├── logo.svg              # 品牌 Logo（花朵圖案）
├── hero.html             # Hero 區塊（含 Logo）
├── intro.html            # 介紹區塊
├── section.html          # Section 區塊範本
├── card.html             # 卡片元件範例
├── footer.html           # Footer（含年份腳本）
├── back-to-top.html      # 回到頂部按鈕
├── external-links.html   # 外部連結區塊
├── color-playground.html # 色票互動區
└── icons/                # SVG Icons
    ├── dashboard.svg     # 四格方塊
    ├── search.svg        # 搜尋
    ├── document.svg      # 文件
    ├── edit.svg          # 編輯筆
    ├── book.svg          # 書本
    ├── check-circle.svg  # 打勾圓圈
    ├── music.svg         # 音符
    ├── monitor.svg       # 螢幕
    ├── mail.svg          # Email
    ├── chevron-up.svg    # 向上箭頭
    ├── linkedin.svg      # LinkedIn
    ├── facebook.svg      # Facebook
    └── instagram.svg     # Instagram
```

## 使用方式

### Logo
直接使用 `logo.svg`，或複製 SVG 程式碼到 HTML 中。

### Icon
所有 Icon 使用 `stroke="currentColor"`，會繼承父元素的文字顏色。
建議搭配 `width` 和 `height` 設定尺寸（16px / 20px / 24px）。

### 卡片顏色
Icon 背景顏色 class：
- `.rose` — 乾燥玫瑰
- `.lavender` — 薰衣草紫
- `.sage` — 鼠尾草綠
- `.blush` — 腮紅粉

## 品牌色碼速查

| 名稱 | 色碼 |
|------|------|
| Rose（主色） | `#D4A5A5` |
| Lavender（次色） | `#B8A9C9` |
| 腮紅粉 | `#F5D0C5` |
| 灰玫瑰 | `#C9929A` |
| 撫子粉 | `#E8B4B8` |
| 櫻花粉 | `#FEDFE1` |
| 藕荷 | `#9B7E93` |
| 藤紫 | `#C4B7D7` |
| 桔梗紫 | `#8F77B5` |
| 鼠尾草綠 | `#A8B5A0` |
