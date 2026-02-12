# SEO Quest 場景圖批次編輯 - 執行指南

## ✅ 前置條件檢查

### 1. 確認 ImageMagick 已安裝
```powershell
magick -version
```

如果看到版本資訊（例如 `Version: ImageMagick 7.1.x`），表示安裝成功！

如果看到錯誤（`command not found`），請：
1. 確認已安裝 ImageMagick
2. 重新啟動 VS Code Terminal
3. 如果還是失敗，重新啟動電腦

---

## 🚀 執行批次編輯

### 方法 1：PowerShell 版本（推薦，Windows 環境）

```powershell
cd C:\Users\Ruru\helloruru.github.io\seo-quest
powershell -ExecutionPolicy Bypass -File add-borders.ps1
```

### 方法 2：Bash 版本（WSL 環境）

```bash
cd ~/helloruru.github.io/seo-quest
bash add-borders.sh
```

---

## 📊 執行過程

你會看到類似這樣的輸出：

```
🎨 SEO Quest 場景圖批次編輯開始...

📦 備份原始檔案...
📊 找到 27 張場景圖

⚙️  邊框設定：
  • 外框：深棕色 #3D2817 (3px)
  • 內框：淺金色 #D4A574 (2px)
  • 總寬度：10px

[1/27] 處理中：blue-shopping-1.webp
  ✅ 完成：assets/scenes/encounters-edited/blue-shopping-1.webp
[2/27] 處理中：blue-shopping-2.webp
  ✅ 完成：assets/scenes/encounters-edited/blue-shopping-2.webp
...
[27/27] 處理中：io-portal-2.webp
  ✅ 完成：assets/scenes/encounters-edited/io-portal-2.webp

🎉 批次處理完成！

📁 輸出位置：assets/scenes/encounters-edited
💾 原始備份：assets/scenes/encounters-backup
```

---

## 🔍 檢查結果

### 1. 開啟輸出資料夾
```powershell
Start-Process assets/scenes/encounters-edited
```

### 2. 對比編輯前後
- **原始檔案**：`assets/scenes/encounters/`
- **編輯後**：`assets/scenes/encounters-edited/`
- **備份**：`assets/scenes/encounters-backup/`

### 3. 檢查其中一張圖片
```powershell
Start-Process assets/scenes/encounters-edited/io-portal-1.webp
```

---

## ✅ 如果滿意，替換原始檔案

```powershell
# 複製編輯後的圖片到原始位置
Copy-Item assets/scenes/encounters-edited/*.webp -Destination assets/scenes/encounters/ -Force
```

⚠️ **注意**：執行後會覆蓋原始檔案（但有備份在 `encounters-backup/`）

---

## 🔧 如果不滿意，調整邊框設定

### 修改顏色

編輯 `add-borders.ps1`，找到這幾行：

```powershell
$OuterColor = "#3D2817" # 深棕色
$InnerColor = "#D4A574" # 淺金色
```

改成你想要的顏色，例如：

```powershell
# 現代白色風格
$OuterColor = "#FFFFFF" # 白色
$InnerColor = "#E0E0E0" # 淺灰

# 古典紫金風格
$OuterColor = "#4A3850" # 深紫
$InnerColor = "#D4A574" # 金色
```

### 修改邊框寬度

```powershell
$OuterBorder = 3  # 外框寬度（改成 5 會更粗）
$InnerBorder = 2  # 內框寬度（改成 1 會更細）
```

修改後，重新執行腳本即可。

---

## ❓ 常見問題

### Q: 腳本執行失敗，顯示「無法執行」？
**A**: 執行此指令允許腳本執行：
```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### Q: 可以只處理某幾張圖嗎？
**A**: 編輯腳本，修改這行：
```powershell
$images = Get-ChildItem -Path $SceneDir -Filter "io-*.webp"  # 只處理 io 開頭的
```

### Q: 檔案大小會增加嗎？
**A**: 會稍微增加（加邊框後圖片變大），但 WebP 壓縮效率高，增加約 5-10%。

### Q: 如何恢復原始檔案？
**A**: 從備份復原：
```powershell
Copy-Item assets/scenes/encounters-backup/*.webp -Destination assets/scenes/encounters/ -Force
```

---

## 🎉 完成後

編輯完成後，記得在遊戲「關於」頁面加上授權標註：

```markdown
場景美術：AI 輔助創作（Nova Anime XL）+ 人工編輯
```

即符合商用授權要求！✅
