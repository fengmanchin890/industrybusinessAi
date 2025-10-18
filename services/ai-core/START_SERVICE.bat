@echo off
echo Starting AI Core Service...
cd /d "%~dp0"
python -m app.main
pause

