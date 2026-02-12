@echo off
setlocal enabledelayedexpansion
echo SEO Quest - Processing All 27 Images
echo ========================================

set MAGICK="C:\Program Files\ImageMagick-7.1.2-Q16-HDRI\magick.exe"
set INPUT_DIR=assets\scenes\encounters
set OUTPUT_DIR=assets\scenes\encounters-edited
set BACKUP_DIR=assets\scenes\encounters-backup

:: Create directories
if not exist "%OUTPUT_DIR%" mkdir "%OUTPUT_DIR%"
if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

:: Backup original files
echo.
echo [1/3] Backing up original files...
xcopy "%INPUT_DIR%\*.webp" "%BACKUP_DIR%\" /Y /Q >nul
echo Done: %BACKUP_DIR%

:: Process each image
echo.
echo [2/3] Adding borders to 27 images...
echo.

set COUNT=0
for %%F in (%INPUT_DIR%\*.webp) do (
    set /a COUNT+=1
    echo [!COUNT!/27] %%~nxF
    %MAGICK% "%%F" -bordercolor "#D4A574" -border 2x2 -bordercolor "#3D2817" -border 3x3 "%OUTPUT_DIR%\%%~nxF" 2>nul
)

echo.
echo [3/3] Verification...
dir /b "%OUTPUT_DIR%\*.webp" | find /c ".webp"
echo files created in %OUTPUT_DIR%

echo.
echo ========================================
echo SUCCESS! All images processed!
echo ========================================
echo.
echo Output: %OUTPUT_DIR%
echo Backup: %BACKUP_DIR%
echo.
echo Next step: Review the images
echo   start %OUTPUT_DIR%
echo.
echo If satisfied, replace originals:
echo   xcopy %OUTPUT_DIR%\*.webp %INPUT_DIR%\ /Y
echo.

start %OUTPUT_DIR%
