@echo off
echo ========================================
echo AI 財務文件審核系統 - 完整部署
echo ========================================
echo.

echo 此腳本將部署完整的 AI 財務文件審核系統，包括：
echo - 資料庫表結構和種子數據
echo - Edge Function (AI 分析引擎)
echo - 前端模組
echo.
pause

echo.
echo [步驟 1/3] 檢查 Supabase 連接...
call npx supabase link --project-ref ergqqdirsvmamowpklia

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Supabase 連接失敗
    echo 請確保：
    echo 1. 已執行 npx supabase login
    echo 2. 有權限訪問此專案
    pause
    exit /b 1
)

echo ✅ Supabase 連接成功
echo.

echo [步驟 2/3] 部署 Edge Function...
echo 正在部署 document-review-analyzer...
call npx supabase functions deploy document-review-analyzer --no-verify-jwt

if %ERRORLEVEL% NEQ 0 (
    echo ❌ Edge Function 部署失敗
    echo 請檢查錯誤訊息
    pause
    exit /b 1
)

echo ✅ Edge Function 部署成功
echo.

echo [步驟 3/3] 設置資料庫...
echo.
echo ⚠️ 重要提示：
echo 請在 Supabase Dashboard 的 SQL Editor 中執行以下檔案：
echo.
echo    QUICK_FINANCIAL_DOCUMENT_REVIEW_SETUP.sql
echo.
echo 步驟：
echo 1. 開啟 https://supabase.com/dashboard/project/ergqqdirsvmamowpklia/sql
echo 2. 點擊 "New query"
echo 3. 複製 QUICK_FINANCIAL_DOCUMENT_REVIEW_SETUP.sql 的內容
echo 4. 貼上並執行
echo 5. 確認看到成功訊息
echo.
pause

echo.
echo ========================================
echo 🎉 部署完成！
echo ========================================
echo.
echo ✅ Edge Function 已部署
echo ✅ 前端模組已準備
echo.
echo 📋 下一步：
echo.
echo 1. 確認資料庫設置完成 (在 Supabase Dashboard 執行 SQL)
echo 2. 刷新前端應用 (Ctrl + Shift + R)
echo 3. 使用金融公司帳號登入
echo 4. 從模組商店安裝 "AI 文件審核系統"
echo 5. 開始使用！
echo.
echo 📖 詳細說明請參考：
echo    FINANCIAL_DOCUMENT_REVIEW_GUIDE.md
echo.
pause


