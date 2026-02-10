#!/bin/bash

echo ""
echo "╔════════════════════════════════════════════════════╗"
echo "║         AIO View - AI Overview 監測工具            ║"
echo "╚════════════════════════════════════════════════════╝"
echo ""

# 檢查 Node.js 是否安裝
if ! command -v node &> /dev/null; then
    echo "[錯誤] 找不到 Node.js！"
    echo ""
    echo "請先安裝 Node.js："
    echo "1. 前往 https://nodejs.org/"
    echo "2. 下載 LTS 版本"
    echo "3. 安裝後重新執行此腳本"
    echo ""
    exit 1
fi

echo "[✓] Node.js 已安裝"
node --version

# 檢查並安裝依賴
if [ ! -d "node_modules" ]; then
    echo ""
    echo "[安裝] 正在安裝依賴套件..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[錯誤] 安裝失敗"
        exit 1
    fi
fi

# 安裝 Playwright 瀏覽器（如果需要）
if [ ! -d "node_modules/playwright/.local-browsers" ]; then
    echo ""
    echo "[安裝] 正在安裝 Playwright 瀏覽器..."
    npx playwright install chromium
    if [ $? -ne 0 ]; then
        echo "[錯誤] 安裝 Playwright 失敗"
        exit 1
    fi
fi

echo ""
echo "[✓] 所有依賴已就緒"
echo ""
echo "════════════════════════════════════════════════════"
echo "  正在啟動 AIO View 服務..."
echo ""
echo "  本機網址：http://localhost:3000"
echo ""
echo "  瀏覽器會自動開啟，如果沒有請手動開啟上述網址"
echo ""
echo "  ⚠️  請勿關閉此終端機，關閉後服務會停止"
echo "════════════════════════════════════════════════════"
echo ""

# 等待 2 秒後開啟瀏覽器
sleep 2

# 根據作業系統開啟瀏覽器
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    open http://localhost:3000
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    # Linux
    if command -v xdg-open &> /dev/null; then
        xdg-open http://localhost:3000
    elif command -v gnome-open &> /dev/null; then
        gnome-open http://localhost:3000
    fi
fi

# 啟動伺服器
node src/index.js
