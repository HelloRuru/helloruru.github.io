# AIO View 本機版 — 完全免費的 AI Overview 監測工具

> 💰 **完全免費、無限掃描** | 🖥️ **本機執行、資料隱私** | 🎯 **操作超簡單**

---

## 🚀 快速開始（3 步驟）

### 1️⃣ 下載專案

```bash
# 使用 Git 下載（推薦）
git clone https://github.com/helloruru/helloruru.github.io.git
cd helloruru.github.io/aio-view/api

# 或直接下載 ZIP：
# https://github.com/helloruru/helloruru.github.io/archive/refs/heads/main.zip
```

### 2️⃣ 雙擊啟動

#### Windows 使用者
雙擊 `start.bat` 檔案

#### macOS/Linux 使用者
雙擊 `start.sh` 檔案（或在終端機執行 `./start.sh`）

### 3️⃣ 開始使用

瀏覽器會自動開啟 **http://localhost:3000**

✨ 就這麼簡單！

---

## 📖 使用說明

### 第一次使用

1. **安裝 Node.js**（如果還沒有）
   - 前往 [nodejs.org](https://nodejs.org/) 下載 **LTS 版本**
   - 安裝後重新執行啟動腳本

2. **自動安裝依賴**
   - 第一次執行時會自動安裝必要套件
   - 包含 Playwright 瀏覽器（約 100MB）
   - 只需安裝一次，之後直接使用

### 掃描流程

1. **輸入 Sitemap**
   - 在網頁輸入你的網站 `sitemap.xml` 網址
   - 點擊「解析」

2. **選擇文章**
   - 勾選要監測的文章
   - 可以編輯搜尋語句

3. **開始掃描**
   - 點擊「開始掃描」按鈕
   - 即時查看掃描進度
   - 掃描完成後自動顯示結果

4. **查看報告**
   - 統計數據：總文章數、有 AIO、被引用、引用率
   - 篩選功能：全部 / 被引用 / 有 AIO 未引用 / 無 AIO
   - 匯出 CSV 報告

### 掃描速度

- **間隔**：每篇文章間隔 2.5 分鐘（避免被 Google 封鎖）
- **預估時間**：
  - 10 篇文章 ≈ 25 分鐘
  - 50 篇文章 ≈ 2 小時
  - 100 篇文章 ≈ 4 小時

💡 **建議**：睡前或外出時執行掃描

---

## 🆚 本機版 vs 線上版

| 功能 | 本機版 | 線上版（lab.helloruru.com） |
|------|--------|----------------------------|
| **價格** | 完全免費 | — |
| **掃描數量** | 無限制 | — |
| **操作方式** | 瀏覽器操作 | 瀏覽器 + CLI |
| **安裝需求** | Node.js | Node.js + Git + CLI 工具 |
| **資料隱私** | 本機執行 | 本機執行 |
| **即時進度** | ✅ 有 | ❌ 無 |
| **自動掃描** | ✅ 自動 | ⚠️ 手動執行 CLI |

---

## ⚙️ 進階設定

### 調整掃描間隔

編輯 `start.bat` 或 `start.sh`，修改 `delay` 參數：

```bash
# 預設 150 秒（2.5 分鐘）
# 可調整為 120 秒（2 分鐘）或更長
```

### 更新到最新版本

```bash
cd helloruru.github.io
git pull origin main
```

---

## 🐛 常見問題

### Q: 啟動時顯示「找不到 Node.js」？
**A:** 請先安裝 Node.js：
1. 前往 [nodejs.org](https://nodejs.org/)
2. 下載 **LTS 版本**
3. 安裝後重新執行啟動腳本

### Q: 掃描到一半可以關閉嗎？
**A:** 可以！已完成的結果會即時保存。下次啟動時可以繼續掃描剩餘文章。

### Q: 會被 Google 封鎖嗎？
**A:** 我們已設定合理的間隔（2.5 分鐘），模擬真實使用者行為。如果真的被封鎖（極少見），重啟路由器更換 IP 即可。

### Q: 可以同時掃描多個網站嗎？
**A:** 建議一次掃描一個網站。如果需要掃描多個，請等待前一個完成後再開始下一個。

### Q: 本機版和線上版的前端可以同步更新嗎？
**A:** 可以！執行 `git pull` 更新專案後，本機版會自動使用最新的前端網頁。

---

## 📊 技術架構

### 前端（網頁）
- 純 HTML + CSS + JavaScript
- 不依賴任何框架
- 自動偵測本機 API 或 CLI 模式

### 後端（Node.js）
- Express.js API 伺服器
- Playwright 瀏覽器自動化
- 任務佇列管理

### 掃描邏輯
- 使用 Playwright 模擬真實瀏覽器
- 偵測 Google AI Overview 區塊
- 提取引用來源並比對網域

---

## 📝 授權

MIT License © Kaoru Tsai

---

## 🔗 相關連結

- 線上版：[lab.helloruru.com/aio-view](https://lab.helloruru.com/aio-view/)
- GitHub：[github.com/helloruru/helloruru.github.io](https://github.com/helloruru/helloruru.github.io)
- 問題回報：[GitHub Issues](https://github.com/helloruru/helloruru.github.io/issues)

---

**需要協助？** 歡迎透過 [hello@helloruru.com](mailto:hello@helloruru.com) 聯繫我們 💌
