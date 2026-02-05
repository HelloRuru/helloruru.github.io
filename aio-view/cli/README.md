# AIO View CLI

Google AI Overview 監測工具的命令列版本。

## 安裝

```bash
# 下載專案
git clone https://github.com/helloruru/helloruru.github.io.git
cd helloruru.github.io/aio-view/cli

# 安裝依賴
npm install

# 安裝 Playwright 瀏覽器
npx playwright install chromium
```

## 使用方式

### 1. 準備搜尋語句

建立 `queries.json` 檔案：

```json
[
  {
    "url": "https://dailyshiru.com/article/123",
    "title": "高雄咖啡廳推薦",
    "query": "高雄 咖啡廳 推薦"
  },
  {
    "url": "https://dailyshiru.com/article/456",
    "title": "左營美食地圖",
    "query": "左營 美食 推薦"
  }
]
```

或使用 [AIO View Dashboard](https://lab.helloruru.com/aio-view/) 自動產生。

### 2. 執行掃描

```bash
node scan.js --input queries.json --output results.json --domain dailyshiru.com
```

### 參數說明

| 參數 | 縮寫 | 說明 | 預設值 |
|------|------|------|--------|
| `--input` | `-i` | 搜尋語句 JSON 檔案（必填） | — |
| `--output` | `-o` | 輸出結果檔案 | `results.json` |
| `--domain` | `-d` | 要監測的網域 | — |
| `--delay` | — | 每次搜尋間隔（秒） | `150` |
| `--headless` | — | 無頭模式（不顯示瀏覽器） | `false` |

### 3. 查看結果

將 `results.json` 上傳到 [AIO View Dashboard](https://lab.helloruru.com/aio-view/) 查看視覺化結果。

## 注意事項

- **搜尋間隔**：預設 150 秒（2.5 分鐘），避免觸發 Google 反爬機制
- **IP 風險**：如果被暫時封鎖，重啟路由器更換 IP 即可
- **執行時間**：50 個語句約需 2 小時，建議睡前執行

## 輸出格式

```json
{
  "scanDate": "2026-02-05",
  "domain": "dailyshiru.com",
  "results": [
    {
      "url": "https://dailyshiru.com/article/123",
      "title": "高雄咖啡廳推薦",
      "query": "高雄 咖啡廳 推薦",
      "hasAIO": true,
      "isCited": true,
      "aioSources": ["dailyshiru.com", "google.com/maps"]
    }
  ]
}
```

## 授權

MIT License © Kaoru Tsai
