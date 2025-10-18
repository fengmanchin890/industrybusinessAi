@echo off
echo ========================================
echo   部署 AI 健康監測系統 Edge Function
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 正在部署 health-monitoring-ai...
call npx supabase functions deploy health-monitoring-ai --no-verify-jwt

if %errorlevel% neq 0 (
    echo.
    echo ❌ 部署失敗！
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ AI 健康監測系統部署完成！
echo ========================================
echo.
echo 📋 後續步驟：
echo 1. 在 Supabase Dashboard 執行 migration SQL
echo 2. 執行 QUICK_HEALTH_MONITORING_SETUP.sql
echo 3. 在前端登入 fenghopital 帳號
echo 4. 進入「AI 健康監測」模組
echo 5. 測試生命體征記錄和 AI 分析功能
echo.
pause


