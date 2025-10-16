# AI Business Platform - Development Environment Setup Script
# For Windows PowerShell

Write-Host "Setting up AI Business Platform development environment..." -ForegroundColor Green

# Check prerequisites
Write-Host "`nChecking prerequisites..." -ForegroundColor Yellow

if (!(Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Docker is required but not installed." -ForegroundColor Red
    exit 1
}

if (!(Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is required but not installed." -ForegroundColor Red
    exit 1
}

if (!(Get-Command python -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Python 3 is required but not installed." -ForegroundColor Red
    exit 1
}

Write-Host "SUCCESS: All prerequisites are installed" -ForegroundColor Green

# Copy environment file if it doesn't exist
if (!(Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host "Created .env file from .env.example - please configure it" -ForegroundColor Yellow
    } else {
        Write-Host "WARNING: No .env.example found, please create .env manually" -ForegroundColor Yellow
    }
}

# Install frontend dependencies
Write-Host "`nInstalling frontend dependencies..." -ForegroundColor Yellow
Set-Location frontend
npm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Frontend dependency installation failed" -ForegroundColor Red
    exit 1
}
Set-Location ..

# Install AI Core dependencies
Write-Host "`nInstalling AI Core dependencies..." -ForegroundColor Yellow
Set-Location services/ai-core
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: AI Core dependency installation failed" -ForegroundColor Red
    exit 1
}
deactivate
Set-Location ../..

# Install Data Connector dependencies
Write-Host "`nInstalling Data Connector dependencies..." -ForegroundColor Yellow
Set-Location services/data-connector
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Data Connector dependency installation failed" -ForegroundColor Red
    exit 1
}
deactivate
Set-Location ../..

# Start Docker services
Write-Host "`nStarting Docker services..." -ForegroundColor Yellow
docker-compose -f infra/docker-compose.yml up -d qdrant redis postgres prometheus grafana
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to start Docker services" -ForegroundColor Red
    exit 1
}

Write-Host "`nSUCCESS: Development environment ready!" -ForegroundColor Green
Write-Host "`nService URLs:" -ForegroundColor Cyan
Write-Host "  Frontend:        http://localhost:5173" -ForegroundColor White
Write-Host "  AI Core:         http://localhost:8000" -ForegroundColor White
Write-Host "  Data Connector:  http://localhost:8001" -ForegroundColor White
Write-Host "  Grafana:         http://localhost:3000 (admin/admin)" -ForegroundColor White
Write-Host "  Prometheus:      http://localhost:9090" -ForegroundColor White
Write-Host "  Qdrant:          http://localhost:6333" -ForegroundColor White
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "  1. Configure .env file with your API keys" -ForegroundColor White
Write-Host "  2. Run services manually or use Docker Compose" -ForegroundColor White
Write-Host "     docker-compose -f infra/docker-compose.yml up" -ForegroundColor Gray

