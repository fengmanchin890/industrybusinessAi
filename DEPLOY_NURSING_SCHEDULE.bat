@echo off
chcp 65001 >nul
echo ========================================
echo 🏥 AI 護理排班系統 - 完整部署
echo ========================================
echo.
echo 此腳本將部署完整的 AI 護理排班系統：
echo   1. 資料庫表結構 (7張表 + 3個函數)
echo   2. Edge Function with AI
echo   3. 示例數據 (8位護理師 + 8個班次)
echo.
echo ----------------------------------------
pause

echo.
echo 📦 步驟 1: 部署 Edge Function...
echo ========================================
cd supabase
call supabase functions deploy nursing-schedule-ai
if errorlevel 1 (
    echo ❌ Edge Function 部署失敗
    pause
    exit /b 1
)
cd ..
echo ✅ Edge Function 部署成功
echo.

echo 📊 步驟 2: 創建資料庫表結構...
echo ========================================
echo 請在 Supabase Dashboard 的 SQL Editor 中執行：
echo.
echo 檔案：supabase/migrations/20251018280000_add_nursing_schedule_tables.sql
echo.
pause

echo 📝 步驟 3: 載入示例數據...
echo ========================================
echo 請在 Supabase Dashboard 的 SQL Editor 中執行：
echo.
echo 檔案：QUICK_NURSING_SCHEDULE_SETUP.sql
echo.
pause

echo.
echo ========================================
echo ✅ AI 護理排班系統部署完成！
echo ========================================
echo.
echo 📋 驗證清單：
echo   □ Edge Function 已部署
echo   □ 資料庫表已創建 (7張表)
echo   □ 示例數據已載入 (8護理師 + 8班次)
echo.
echo 🚀 立即測試：
echo   1. 使用 fenghospital 帳戶登入
echo   2. 進入「AI 護理排班」模組
echo   3. 查看護理人員和班次
echo   4. 點擊「AI 優化排班」
echo   5. 覆蓋率應從 25%% 提升至 90%%+
echo.
echo 📖 詳細文檔：NURSING_SCHEDULE_COMPLETE.md
echo.
pause
