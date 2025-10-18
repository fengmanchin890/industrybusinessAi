@echo off
echo ==========================================
echo 部署 AI 詐欺偵測引擎 Edge Function
echo ==========================================
echo.

cd /d "%~dp0"

echo 正在部署 fraud-detection-analyzer...
supabase functions deploy fraud-detection-analyzer --project-ref ergqqdirsvmamowpklia --no-verify-jwt

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ==========================================
    echo ✅ 部署成功！
    echo ==========================================
    echo.
    echo 測試 Edge Function:
    echo https://ergqqdirsvmamowpklia.supabase.co/functions/v1/fraud-detection-analyzer
    echo.
) else (
    echo.
    echo ==========================================
    echo ❌ 部署失敗！
    echo ==========================================
    echo.
    echo 請檢查:
    echo 1. Supabase CLI 是否已安裝
    echo 2. 是否已登入 (supabase login)
    echo 3. 專案是否已連接 (supabase link)
    echo.
)

pause


