@echo off
title Data Connector Service
echo ========================================
echo   Data Connector Service
echo ========================================
echo.
echo Starting on port 8001...
echo Press Ctrl+C to stop
echo.
cd /d "%~dp0"
python -m app.main
pause

