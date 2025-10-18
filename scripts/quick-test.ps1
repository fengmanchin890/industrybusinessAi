# Quick Test Script - Starts services and runs tests
# This script will:
# 1. Start AI Core service
# 2. Start Data Connector service  
# 3. Wait for services to be ready
# 4. Run endpoint tests

$ErrorActionPreference = "Continue"

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  Quick Test - Starting Services and Running Tests" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Check if services are already running
Write-Host "`nChecking if services are already running..."

$aiCoreRunning = $false
$dataConnectorRunning = $false

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8000/health" -Method GET -TimeoutSec 2
    $aiCoreRunning = $true
    Write-Host "  AI Core: RUNNING" -ForegroundColor Green
} catch {
    Write-Host "  AI Core: NOT RUNNING" -ForegroundColor Yellow
}

try {
    $response = Invoke-RestMethod -Uri "http://localhost:8001/health" -Method GET -TimeoutSec 2
    $dataConnectorRunning = $true
    Write-Host "  Data Connector: RUNNING" -ForegroundColor Green
} catch {
    Write-Host "  Data Connector: NOT RUNNING" -ForegroundColor Yellow
}

# Start services if needed
if (-not $aiCoreRunning) {
    Write-Host "`nStarting AI Core service..." -ForegroundColor Yellow
    Write-Host "  You need to manually start: cd services/ai-core && python -m app.main" -ForegroundColor Yellow
}

if (-not $dataConnectorRunning) {
    Write-Host "`nStarting Data Connector service..." -ForegroundColor Yellow
    Write-Host "  You need to manually start: cd services/data-connector && python -m app.main" -ForegroundColor Yellow
}

if (-not $aiCoreRunning -or -not $dataConnectorRunning) {
    Write-Host "`nPlease start the services in separate terminal windows and run this script again." -ForegroundColor Yellow
    Write-Host "Or use Docker: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

# Run tests
Write-Host "`nRunning endpoint tests..." -ForegroundColor Cyan
& "$PSScriptRoot\test-endpoints-simple.ps1"

