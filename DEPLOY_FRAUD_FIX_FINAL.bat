@echo off
echo ========================================
echo Fraud Detection Edge Function - Final Fix
echo ========================================
echo.
echo This will deploy the updated edge function that:
echo - Handles simulated transactions correctly
echo - Prevents "Transaction not found" errors
echo - Adds proper logging for debugging
echo.
echo Press Ctrl+C to cancel, or
pause

echo.
echo [1/2] Deploying edge function...
call npx supabase functions deploy fraud-detection-analyzer --no-verify-jwt

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo SUCCESS! Edge function deployed!
    echo ========================================
    echo.
    echo [2/2] Testing the edge function...
    echo.
    
    echo Testing health check...
    curl -s https://ergqqdirsvmamowpklia.supabase.co/functions/v1/fraud-detection-analyzer
    
    echo.
    echo.
    echo ========================================
    echo Next Steps:
    echo ========================================
    echo 1. Refresh your browser (Ctrl + Shift + R)
    echo 2. Open Fraud Detection module
    echo 3. Check browser console (F12)
    echo 4. You should see:
    echo    - Green checkmarks: Edge Function analysis successful
    echo    - Risk scores calculated
    echo    - No more 500 errors
    echo.
    echo If you still see errors:
    echo - Check Supabase logs at: https://supabase.com/dashboard/project/ergqqdirsvmamowpklia/logs/edge-functions
    echo - Look for "Received data:" log entries
    echo - Check that transactions are being analyzed
    echo.
) else (
    echo.
    echo ========================================
    echo DEPLOYMENT FAILED!
    echo ========================================
    echo.
    echo Common issues:
    echo.
    echo 1. Not logged in to Supabase CLI
    echo    Fix: npx supabase login
    echo.
    echo 2. Project not linked
    echo    Fix: npx supabase link --project-ref ergqqdirsvmamowpklia
    echo.
    echo 3. Permission issues
    echo    Fix: Make sure you have access to this project
    echo.
    echo 4. Network issues
    echo    Fix: Check your internet connection
    echo.
)

echo.
pause


