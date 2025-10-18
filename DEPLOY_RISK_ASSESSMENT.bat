@echo off
echo ========================================
echo AI 風險評估系統 - 完整部署
echo ========================================
echo.

echo [1/2] 部署 Edge Function...
call npx supabase functions deploy risk-assessment-analyzer --no-verify-jwt

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Edge Function 部署失敗
    pause
    exit /b 1
)

echo ✅ Edge Function 部署成功
echo.

echo [2/2] 設置資料庫...
echo.
echo ⚠️ 請在 Supabase Dashboard SQL Editor 中執行：
echo    QUICK_RISK_ASSESSMENT_SETUP.sql
echo.
pause

echo.
echo ========================================
echo 🎉 部署完成！
echo ========================================
echo.
echo 下一步：
echo 1. 在 Supabase Dashboard 執行 SQL
echo 2. 刷新瀏覽器
echo 3. 使用 fengfinancial 帳號登入
echo 4. 安裝 AI 風險評估模組
echo.
pause


