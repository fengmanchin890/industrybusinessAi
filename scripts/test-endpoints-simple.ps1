# Simple API Endpoints Test Script
# Tests AI Core and Data Connector services

$AICoreURL = "http://localhost:8000"
$DataConnectorURL = "http://localhost:8001"

$SuccessCount = 0
$FailCount = 0
$TotalTests = 0

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$URL,
        [string]$Method = "GET"
    )
    
    $script:TotalTests++
    
    Write-Host "`n[$script:TotalTests] Testing: $Name" -ForegroundColor Yellow
    Write-Host "    URL: $URL"
    Write-Host "    Method: $Method"
    
    try {
        $params = @{
            Uri = $URL
            Method = $Method
            ContentType = "application/json"
            TimeoutSec = 10
        }
        
        $startTime = Get-Date
        $response = Invoke-RestMethod @params
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-Host "    PASSED (${duration}ms)" -ForegroundColor Green
        Write-Host "    Response: OK"
        
        $script:SuccessCount++
        return $true
        
    } catch {
        Write-Host "    FAILED" -ForegroundColor Red
        Write-Host "    Error: $($_.Exception.Message)" -ForegroundColor Red
        
        $script:FailCount++
        return $false
    }
}

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  AI Business Platform - API Endpoints Test Suite" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "`nConfiguration:"
Write-Host "  AI Core URL: $AICoreURL"
Write-Host "  Data Connector URL: $DataConnectorURL"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  AI CORE SERVICE TESTS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Test-Endpoint -Name "AI Core - Health Check" -URL "$AICoreURL/health" -Method "GET"
Test-Endpoint -Name "AI Core - Metrics" -URL "$AICoreURL/metrics" -Method "GET"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  DATA CONNECTOR SERVICE TESTS" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Test-Endpoint -Name "Data Connector - Health Check" -URL "$DataConnectorURL/health" -Method "GET"
Test-Endpoint -Name "Data Connector - Connection Health" -URL "$DataConnectorURL/api/v1/connectors/connections/health/check" -Method "GET"
Test-Endpoint -Name "Data Connector - POS Health" -URL "$DataConnectorURL/api/v1/connectors/pos/health" -Method "GET"
Test-Endpoint -Name "Data Connector - Upload Health" -URL "$DataConnectorURL/api/v1/connectors/upload/health" -Method "GET"
Test-Endpoint -Name "Data Connector - Database Health" -URL "$DataConnectorURL/api/v1/connectors/database/health" -Method "GET"
Test-Endpoint -Name "Data Connector - Storage Health" -URL "$DataConnectorURL/api/v1/connectors/storage/health" -Method "GET"
Test-Endpoint -Name "Data Connector - Taiwan APIs Health" -URL "$DataConnectorURL/api/v1/connectors/taiwan/health" -Method "GET"

Write-Host "`n============================================================" -ForegroundColor Cyan
Write-Host "  TEST SUMMARY" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

Write-Host "`nTotal Tests: $TotalTests"
Write-Host "  Passed: $SuccessCount" -ForegroundColor Green
Write-Host "  Failed: $FailCount" -ForegroundColor Red

$passRate = if ($TotalTests -gt 0) { [math]::Round(($SuccessCount / $TotalTests) * 100, 2) } else { 0 }
Write-Host "  Pass Rate: $passRate%"

if ($FailCount -eq 0) {
    Write-Host "`nAll tests passed!" -ForegroundColor Green
    exit 0
} else {
    Write-Host "`nSome tests failed. Services may not be running." -ForegroundColor Red
    Write-Host "Please start services using: .\scripts\start-services.ps1" -ForegroundColor Yellow
    exit 1
}

