@echo off
echo ========================================
echo   Testing Simplified AI Core
echo ========================================
echo.
echo Starting on port 8000...
echo Press Ctrl+C to stop
echo.
cd /d "%~dp0"
python -m app.main_simple
pause

