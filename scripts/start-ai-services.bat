@echo off
REM Batch script to start AI services in separate windows

echo Starting AI Business Platform Services...
echo.

REM Check if we're in the right directory
if not exist "services\ai-core" (
    echo Error: services\ai-core directory not found
    echo Please run this script from the project root directory
    pause
    exit /b 1
)

REM Start AI Core
echo Starting AI Core service...
start "AI Core Service" cmd /k "cd services\ai-core && python -m app.main"

REM Wait a moment
timeout /t 2 /nobreak >nul

REM Start Data Connector
echo Starting Data Connector service...
start "Data Connector Service" cmd /k "cd services\data-connector && python -m app.main"

echo.
echo Services starting in separate windows...
echo.
echo AI Core:          http://localhost:8000
echo Data Connector:   http://localhost:8001
echo.
echo Wait a few seconds for services to initialize, then press any key to run tests...
pause >nul

REM Run tests
echo.
echo Running tests...
powershell -ExecutionPolicy Bypass -File scripts\test-endpoints-simple.ps1

pause

