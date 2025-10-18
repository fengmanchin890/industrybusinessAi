@echo off
echo ========================================
echo   部署 AI 病歷助理系統 Edge Function
echo ========================================
echo.

cd /d "%~dp0"

echo [1/2] 正在部署 medical-record-ai...
call npx supabase functions deploy medical-record-ai --no-verify-jwt

if %errorlevel% neq 0 (
    echo.
    echo ❌ 部署失敗！
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ AI 病歷助理系統部署完成！
echo ========================================
echo.
echo 📋 後續步驟：
echo 1. 在 Supabase Dashboard 執行 migration SQL
echo 2. 執行 QUICK_MEDICAL_RECORD_SETUP.sql
echo 3. 在前端登入 fenghopital 帳號
echo 4. 進入「AI 病歷助理」模組
echo 5. 測試病歷分析和 AI 診斷建議功能
echo.
pause


