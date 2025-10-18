@echo off
echo ========================================
echo Deploying Virtual Assistant Edge Function
echo ========================================
echo.

cd supabase\functions\virtual-assistant-ai

echo Deploying edge function...
supabase functions deploy virtual-assistant-ai --no-verify-jwt

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✅ Edge function deployed successfully!
    echo.
    echo 🎯 Next steps:
    echo    1. The edge function now handles missing database functions gracefully
    echo    2. Run VERIFY_VIRTUAL_ASSISTANT_SETUP.sql to check database setup
    echo    3. If tables are missing, run the migration:
    echo       supabase/migrations/20251018310000_add_virtual_assistant_tables.sql
    echo    4. Then run QUICK_VIRTUAL_ASSISTANT_SETUP.sql to add sample data
    echo.
) else (
    echo.
    echo ❌ Deployment failed!
    echo    Make sure Supabase CLI is installed and you're logged in
    echo.
)

cd ..\..\..
pause
