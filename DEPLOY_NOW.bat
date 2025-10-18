@echo off
echo ========================================
echo   AI 數據治理 Edge Function 部署
echo ========================================
echo.

cd /d "%~dp0"

echo [1/3] 檢查 Supabase CLI...
where supabase >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 未安裝 Supabase CLI
    echo.
    echo 請執行以下命令安裝：
    echo    npm install -g supabase
    echo.
    echo 或訪問：https://supabase.com/docs/guides/cli
    pause
    exit /b 1
)
echo ✅ Supabase CLI 已安裝
echo.

echo [2/3] 連接到項目...
supabase link --project-ref ergqqdirsvmamowpklia
if %errorlevel% neq 0 (
    echo.
    echo ⚠️ 如果需要登入，請先執行：
    echo    supabase login
    pause
    exit /b 1
)
echo.

echo [3/3] 部署 Edge Function...
supabase functions deploy data-governance-analyzer
if %errorlevel% neq 0 (
    echo.
    echo ❌ 部署失敗
    pause
    exit /b 1
)
echo.

echo ========================================
echo   ✅ 部署成功！
echo ========================================
echo.
echo 現在可以：
echo 1. 重新整理瀏覽器
echo 2. 測試 AI 數據治理模組
echo 3. 執行合規檢查
echo.
pause

