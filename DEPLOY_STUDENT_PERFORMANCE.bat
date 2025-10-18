@echo off
chcp 65001 >nul
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║     🎓 AI 學生表現分析系統 - 一鍵部署腳本               ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

cd /d "%~dp0"

echo 📦 正在部署 Edge Function...
echo.
supabase functions deploy student-performance-analyzer

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Edge Function 部署成功！
    echo.
    echo 📋 下一步：
    echo.
    echo 1. 在 Supabase SQL Editor 執行：
    echo    QUICK_STUDENT_PERFORMANCE_SETUP.sql
    echo.
    echo 2. 設置 OpenAI API Key（可選但建議）：
    echo    supabase secrets set OPENAI_API_KEY=sk-your-key-here
    echo.
    echo 3. 使用 fengadult company 帳號登入測試
    echo.
    echo 📚 詳細文檔：
    echo    - STUDENT_PERFORMANCE_SETUP_GUIDE.md
    echo    - STUDENT_PERFORMANCE_COMPLETE.md
    echo.
) else (
    echo.
    echo ❌ 部署失敗！
    echo.
    echo 💡 解決方法：
    echo 1. 確認已登入：supabase login
    echo 2. 確認專案連結：supabase link --project-ref ergqqdirsvmamowpklia
    echo 3. 檢查網路連接
    echo.
)

pause


