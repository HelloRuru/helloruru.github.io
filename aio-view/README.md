# AIO View — AI Overview 監測工具

監測你的網站文章是否出現在 Google AI Overview（AI 摘要）中。

## 線上版

https://lab.helloruru.com/aio-view/

## 功能

1. **輸入 Sitemap** — 自動解析文章清單
2. **產生搜尋語句** — 自動產生，可手動編輯
3. **CLI 掃描** — 在本機執行，自動搜尋 Google 並偵測 AIO
4. **結果 Dashboard** — 視覺化顯示、篩選、匯出 CSV

## 架構

```
┌─────────────────────────────────────────────────────────────┐
│  你的電腦（本機）                                            │
│  CLI 腳本 (scan.js) → 用 Playwright 控制瀏覽器搜尋 Google   │
│  輸出 results.json                                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  GitHub Pages（免費）                                        │
│  前端 Dashboard → 上傳 results.json 顯示結果                │
└─────────────────────────────────────────────────────────────┘
```

## 專案結構

```
aio-view/
├── index.html              # 主頁面
├── style.css               # 樣式（Design System v1.4）
├── manifest.json           # PWA 配置
├── browserconfig.xml       # Microsoft Tile
├── icons/                  # 各尺寸 icon
│   ├── favicon.svg
│   ├── apple-touch-icon.svg
│   ├── icon-192.svg
│   ├── icon-512.svg
│   └── safari-pinned-tab.svg
├── js/
│   ├── modules/            # 基礎模組
│   │   ├── utils.js        # 工具函數
│   │   ├── toast.js        # Toast 通知
│   │   ├── storage.js      # localStorage 管理
│   │   └── sitemap.js      # Sitemap 解析
│   ├── components/         # UI 元件
│   │   ├── guide.js        # 使用說明
│   │   ├── stats.js        # 統計卡片
│   │   ├── articles-table.js
│   │   ├── results-table.js
│   │   ├── file-upload.js
│   │   ├── cli-generator.js
│   │   └── sitemap-input.js
│   └── main.js             # 進入點
└── cli/                    # CLI 工具
    ├── package.json
    ├── scan.js             # 掃描腳本
    └── README.md           # CLI 使用說明
```

## CLI 使用方式

### 安裝

```bash
cd aio-view/cli
npm install
npx playwright install chromium
```

### 執行

```bash
node scan.js --input queries.json --output results.json --domain example.com --delay 150
```

### 參數

| 參數 | 說明 | 預設值 |
|------|------|--------|
| `--input, -i` | 搜尋語句 JSON 檔案（必填） | — |
| `--output, -o` | 輸出結果檔案 | `results.json` |
| `--domain, -d` | 要監測的網域 | — |
| `--delay` | 每次搜尋間隔（秒） | `150` |
| `--headless` | 無頭模式 | `false` |

### 注意事項

- 每次搜尋間隔預設 2.5 分鐘，避免觸發 Google 反爬
- 50 篇文章約需 2 小時
- WSL 用戶需在 Windows PowerShell 執行

## 設計規範

使用 [Design System v1.4](https://docs.google.com/document/d/1Y02uCW7yl0rz1gdLw8tVXDsgujIPFhjtasaz4tm514s)

- 主色：Rose `#D4A5A5`
- 次色：Lavender `#B8A9C9`
- 漸層：`linear-gradient(135deg, #D4A5A5, #B8A9C9)`

## 授權

© 2026 Kaoru Tsai. All Rights Reserved.
