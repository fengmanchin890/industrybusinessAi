# Start all AI Platform services
# For Windows PowerShell

Write-Host "Starting AI Business Platform services..." -ForegroundColor Green

# Start Docker infrastructure
Write-Host "`nStarting Docker infrastructure..." -ForegroundColor Yellow
docker-compose -f infra/docker-compose.yml up -d

if ($LASTEXITCODE -eq 0) {
    Write-Host "`nSUCCESS: All services started successfully!" -ForegroundColor Green
    Write-Host "`nService URLs:" -ForegroundColor Cyan
    Write-Host "  Frontend:        http://localhost:5173" -ForegroundColor White
    Write-Host "  AI Core:         http://localhost:8000/docs" -ForegroundColor White
    Write-Host "  Data Connector:  http://localhost:8001/docs" -ForegroundColor White
    Write-Host "  Grafana:         http://localhost:3000" -ForegroundColor White
    Write-Host "  Prometheus:      http://localhost:9090" -ForegroundColor White
    Write-Host "`nTo view logs:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f infra/docker-compose.yml logs -f" -ForegroundColor Gray
    Write-Host "`nTo stop services:" -ForegroundColor Yellow
    Write-Host "  docker-compose -f infra/docker-compose.yml down" -ForegroundColor Gray
} else {
    Write-Host "ERROR: Failed to start services" -ForegroundColor Red
    exit 1
}

