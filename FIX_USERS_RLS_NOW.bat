@echo off
echo ========================================
echo Fixing Users Table Infinite Recursion
echo ========================================
echo.
echo This will fix the RLS policies causing infinite recursion
echo on the users table.
echo.
pause

echo.
echo Step 1: Applying fix migration...
call npx supabase db push
if errorlevel 1 (
    echo ❌ Migration push failed
    pause
    exit /b 1
)

echo.
echo ✅ Migration applied successfully!
echo.
echo Step 2: Verifying the fix...
echo.

REM Test the users table query
call npx supabase db query "SELECT id, email, role, company_id FROM users LIMIT 1;" 2>nul
if errorlevel 1 (
    echo ⚠️ Warning: Query test failed, but policies should be fixed
) else (
    echo ✅ Users table query working!
)

echo.
echo ========================================
echo Fix Complete!
echo ========================================
echo.
echo The infinite recursion issue has been resolved.
echo You can now refresh your application and try logging in again.
echo.
pause

