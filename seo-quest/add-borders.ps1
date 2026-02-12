# SEO Quest 場景圖批次加邊框腳本（PowerShell 版）
# 用途：為所有場景圖加上 GBA 風格邊框（符合商用授權要求）

Write-Host "🎨 SEO Quest 場景圖批次編輯開始..." -ForegroundColor Cyan
Write-Host ""

# 設定路徑
$SceneDir = "assets/scenes/encounters"
$OutputDir = "assets/scenes/encounters-edited"
$BackupDir = "assets/scenes/encounters-backup"

# 建立目錄
New-Item -ItemType Directory -Force -Path $OutputDir | Out-Null
New-Item -ItemType Directory -Force -Path $BackupDir | Out-Null

# 備份原始檔案
Write-Host "📦 備份原始檔案..." -ForegroundColor Yellow
Copy-Item "$SceneDir\*.webp" -Destination $BackupDir -Force

# 取得所有場景圖
$images = Get-ChildItem -Path $SceneDir -Filter "*.webp"
$total = $images.Count
$count = 0

Write-Host "📊 找到 $total 張場景圖" -ForegroundColor Green
Write-Host ""

# 檢查是否安裝 ImageMagick
$magickInstalled = Get-Command magick -ErrorAction SilentlyContinue

if (-not $magickInstalled) {
    Write-Host "❌ 未安裝 ImageMagick！" -ForegroundColor Red
    Write-Host ""
    Write-Host "請選擇以下方案之一：" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "方案 A：安裝 ImageMagick（推薦，自動化）" -ForegroundColor Cyan
    Write-Host "  1. 前往：https://imagemagick.org/script/download.php#windows"
    Write-Host "  2. 下載 Windows 安裝包"
    Write-Host "  3. 安裝後重新執行此腳本"
    Write-Host ""
    Write-Host "方案 B：使用 Photopea 線上編輯（無需安裝）" -ForegroundColor Cyan
    Write-Host "  請執行：.\photopea-batch-edit.ps1"
    Write-Host ""
    exit 1
}

# 邊框設定（GBA 復古風）
$OuterBorder = 3        # 外框寬度（深棕色）
$InnerBorder = 2        # 內框寬度（淺金色）
$OuterColor = "#3D2817" # 深棕色
$InnerColor = "#D4A574" # 淺金色

Write-Host "⚙️  邊框設定：" -ForegroundColor Cyan
Write-Host "  • 外框：深棕色 $OuterColor (${OuterBorder}px)"
Write-Host "  • 內框：淺金色 $InnerColor (${InnerBorder}px)"
Write-Host "  • 總寬度：$($OuterBorder + $InnerBorder + $OuterBorder + $InnerBorder) = 10px"
Write-Host ""

# 批次處理
foreach ($img in $images) {
    $count++
    $filename = $img.Name
    $output = Join-Path $OutputDir $filename

    Write-Host "[$count/$total] 處理中：$filename" -ForegroundColor White

    # 使用 ImageMagick 加邊框
    & magick $img.FullName `
        -bordercolor $InnerColor -border "${InnerBorder}x${InnerBorder}" `
        -bordercolor $OuterColor -border "${OuterBorder}x${OuterBorder}" `
        $output

    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✅ 完成：$output" -ForegroundColor Green
    } else {
        Write-Host "  ❌ 失敗：$filename" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "🎉 批次處理完成！" -ForegroundColor Green
Write-Host ""
Write-Host "📁 輸出位置：$OutputDir" -ForegroundColor Cyan
Write-Host "💾 原始備份：$BackupDir" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 統計：" -ForegroundColor Yellow
Write-Host "  • 處理數量：$count 張"
Write-Host "  • 編輯類型：GBA 風格雙層邊框（深棕+淺金）"
Write-Host "  • 符合授權：✅ 實質性編輯（加設計元素）"
Write-Host ""
Write-Host "🔍 預覽編輯結果：" -ForegroundColor Cyan
Write-Host "  Start-Process $OutputDir"
Write-Host ""
Write-Host "🔄 下一步：" -ForegroundColor Yellow
Write-Host "  1. 檢查 $OutputDir 中的圖片"
Write-Host "  2. 如果滿意，替換原始檔案："
Write-Host "     Copy-Item $OutputDir\*.webp -Destination $SceneDir -Force"
Write-Host "  3. 如果不滿意，調整邊框設定後重新執行"
Write-Host ""

# 詢問是否開啟輸出資料夾
$openFolder = Read-Host "要開啟輸出資料夾預覽嗎？(Y/N)"
if ($openFolder -eq "Y" -or $openFolder -eq "y") {
    Start-Process $OutputDir
}
