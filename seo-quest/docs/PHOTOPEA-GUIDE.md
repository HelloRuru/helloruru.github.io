# SEO Quest 場景圖編輯教學（Photopea 版）

## 🎨 使用 Photopea 為場景圖加邊框

**優點**：
- ✅ 完全免費
- ✅ 無需安裝軟體
- ✅ 線上瀏覽器即可使用
- ✅ 符合商用授權要求（實質性編輯）

---

## 📋 快速編輯流程（5 分鐘/張）

### 步驟 1：開啟 Photopea
前往：https://www.photopea.com/

### 步驟 2：載入第一張場景圖
1. 點擊「File → Open」
2. 選擇 `assets/scenes/encounters/io-portal-1.webp`
3. 等待載入完成

### 步驟 3：加上 GBA 風格邊框

#### 3-1. 加內框（淺金色）
1. 點擊「Image → Canvas Size」
2. 設定：
   - Width: **+4 pixels**（左右各 2px）
   - Height: **+4 pixels**（上下各 2px）
   - Anchor: 選擇**中間**（9 宮格的中心點）
   - Canvas extension color: **#D4A574**（淺金色）
3. 點擊「OK」

#### 3-2. 加外框（深棕色）
1. 再次點擊「Image → Canvas Size」
2. 設定：
   - Width: **+6 pixels**（左右各 3px）
   - Height: **+6 pixels**（上下各 3px）
   - Anchor: 選擇**中間**
   - Canvas extension color: **#3D2817**（深棕色）
3. 點擊「OK」

### 步驟 4：匯出圖片
1. 點擊「File → Export As → WebP」
2. 設定：
   - Quality: **80**（平衡品質與檔案大小）
   - 檔名：保持原名（例如 `io-portal-1.webp`）
3. 點擊「Save」下載

### 步驟 5：替換原始檔案
1. 將下載的檔案移動到：
   `C:\Users\Ruru\helloruru.github.io\seo-quest\assets\scenes\encounters\`
2. 覆蓋原始檔案

### 步驟 6：重複步驟 2-5（處理其他 26 張）

---

## ⚡ 加速技巧：建立 Photoshop Action

### 錄製動作（只需設定一次）

1. 在 Photopea 點擊「Window → Actions」
2. 點擊「Create new action」，命名為「Add Border」
3. 點擊紅色「Record」按鈕
4. 執行步驟 3-1 和 3-2（加邊框）
5. 點擊「Stop Recording」

### 使用動作（批次處理）

1. 開啟圖片
2. 在 Actions 面板點擊「Add Border」
3. 點擊「Play」按鈕
4. 自動執行加邊框 → 只需 2 秒！

---

## 📊 預計時間

| 方式 | 首張圖片 | 後續圖片 | 總時間（27 張）|
|------|---------|---------|---------------|
| **手動執行** | 5 分鐘 | 3 分鐘/張 | ~80 分鐘 |
| **使用 Action** | 5 分鐘（錄製）| 30 秒/張 | ~20 分鐘 |

---

## 🎯 邊框效果預覽

```
原始圖片（無邊框）
┌─────────────────────┐
│                     │
│   [CG 圖片內容]     │
│                     │
└─────────────────────┘

加邊框後（GBA 風格）
┌─────────────────────────┐  ← 深棕外框（3px）
│░░░░░░░░░░░░░░░░░░░░░░░░░│
│░┌─────────────────────┐░│  ← 淺金內框（2px）
│░│                     │░│
│░│   [CG 圖片內容]     │░│
│░│                     │░│
│░└─────────────────────┘░│
│░░░░░░░░░░░░░░░░░░░░░░░░░│
└─────────────────────────┘
```

---

## ❓ 常見問題

### Q1: 為什麼要加邊框？
**A**: 符合 Nova Anime XL 商用授權要求（需實質性編輯），且提升遊戲 CG 視覺效果。

### Q2: 可以改顏色嗎？
**A**: 可以！修改步驟 3 的顏色代碼：
- 現代風：外框 `#FFFFFF`（白）+ 內框 `#E0E0E0`（淺灰）
- 古典風：外框 `#4A3850`（紫）+ 內框 `#D4A574`（金）

### Q3: 處理 27 張太久了！
**A**: 使用「Action 自動化」或「方案 A：ImageMagick 批次處理」

### Q4: 需要保留原始檔案嗎？
**A**: 建議先備份：
```powershell
cp -r assets/scenes/encounters assets/scenes/encounters-backup
```

---

## 🎉 完成後

編輯完成後，在遊戲「關於」頁面加上：

```markdown
場景美術：AI 輔助創作（Nova Anime XL）+ 人工編輯
```

即符合商用授權要求！✅
