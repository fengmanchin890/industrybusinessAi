@echo off
echo ========================================
echo Deploying Fraud Detection Analyzer Fix
echo ========================================
echo.

echo Deploying updated edge function...
call npx supabase functions deploy fraud-detection-analyzer --no-verify-jwt

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Deployment completed successfully!
    echo ========================================
    echo.
    echo Changes made:
    echo - Fixed amount type conversion ^(string to number^)
    echo - Added proper error handling for database queries
    echo - Fixed country code comparison ^(TW vs Taiwan^)
    echo - Added try-catch blocks for all database operations
    echo - Fixed duplicate alert generation in frontend
    echo.
    echo The edge function should now work properly!
    echo Please refresh your browser and test the fraud detection module.
) else (
    echo.
    echo ========================================
    echo Deployment failed!
    echo ========================================
    echo Please check:
    echo 1. You are logged in to Supabase CLI
    echo 2. Your Supabase project is linked
    echo 3. You have proper permissions
    echo.
    echo Try running: npx supabase login
    echo Then link project: npx supabase link --project-ref your-project-ref
)

pause


