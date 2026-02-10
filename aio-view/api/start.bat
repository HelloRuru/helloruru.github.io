@echo off
chcp 65001 >nul
title AIO View - AI Overview 監測工具

echo.
echo ╔════════════════════════════════════════════════════╗
echo ║         AIO View - AI Overview 監測工具            ║
echo ╚════════════════════════════════════════════════════╝
echo.

REM 檢查 Node.js 是否安裝
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [錯誤] 找不到 Node.js！
    echo.
    echo 請先安裝 Node.js：
    echo 1. 前往 https://nodejs.org/
    echo 2. 下載 LTS 版本
    echo 3. 安裝後重新執行此腳本
    echo.
    pause
    exit /b 1
)

echo [✓] Node.js 已安裝
node --version

REM 檢查並安裝依賴
if not exist "node_modules\" (
    echo.
    echo [安裝] 正在安裝依賴套件...
    call npm install
    if %errorlevel% neq 0 (
        echo [錯誤] 安裝失敗
        pause
        exit /b 1
    )
)

REM 安裝 Playwright 瀏覽器（如果需要）
if not exist "node_modules\playwright\.local-browsers\" (
    echo.
    echo [安裝] 正在安裝 Playwright 瀏覽器...
    call npx playwright install chromium
    if %errorlevel% neq 0 (
        echo [錯誤] 安裝 Playwright 失敗
        pause
        exit /b 1
    )
)

echo.
echo [✓] 所有依賴已就緒
echo.
echo ════════════════════════════════════════════════════
echo   正在啟動 AIO View 服務...
echo
echo   本機網址：http://localhost:3000
echo
echo   瀏覽器會自動開啟，如果沒有請手動開啟上述網址
echo
echo   ⚠️  請勿關閉此視窗，關閉後服務會停止
echo ════════════════════════════════════════════════════
echo.

REM 等待 2 秒後開啟瀏覽器
timeout /t 2 /nobreak >nul
start http://localhost:3000

REM 啟動伺服器
node src/index.js

pause
