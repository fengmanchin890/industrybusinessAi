@echo off
title Finance Service
echo ========================================
echo   Finance Service Starting
echo ========================================
echo.
echo Port: 8002
echo Docs: http://localhost:8002/docs
echo.
cd /d "%~dp0"
python -m app.main
pause

