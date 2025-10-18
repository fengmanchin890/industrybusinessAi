# API Endpoints 测试脚本
# 测试 AI Core 和 Data Connector 服务的所有 endpoints

param(
    [string]$AICoreURL = "http://localhost:8000",
    [string]$DataConnectorURL = "http://localhost:8001",
    [string]$Token = ""
)

$ErrorActionPreference = "Continue"
$SuccessCount = 0
$FailCount = 0
$TotalTests = 0

# 颜色输出函数
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Test-Endpoint {
    param(
        [string]$Name,
        [string]$URL,
        [string]$Method = "GET",
        [object]$Body = $null,
        [hashtable]$Headers = @{}
    )
    
    $global:TotalTests++
    
    Write-Host "`n[$global:TotalTests] Testing: " -NoNewline
    Write-ColorOutput Yellow "$Name"
    Write-Host "    URL: $URL"
    Write-Host "    Method: $Method"
    
    try {
        $params = @{
            Uri = $URL
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = ($Body | ConvertTo-Json -Depth 10)
            Write-Host "    Body: $($params.Body)"
        }
        
        $startTime = Get-Date
        $response = Invoke-RestMethod @params
        $endTime = Get-Date
        $duration = ($endTime - $startTime).TotalMilliseconds
        
        Write-ColorOutput Green "    ✓ PASSED (${duration}ms)"
        Write-Host "    Response: $($response | ConvertTo-Json -Depth 2 -Compress)"
        
        $global:SuccessCount++
        return $true
        
    } catch {
        Write-ColorOutput Red "    ✗ FAILED"
        Write-ColorOutput Red "    Error: $($_.Exception.Message)"
        
        if ($_.Exception.Response) {
            $statusCode = $_.Exception.Response.StatusCode.value__
            Write-ColorOutput Red "    Status Code: $statusCode"
        }
        
        $global:FailCount++
        return $false
    }
}

Write-ColorOutput Cyan @"
╔════════════════════════════════════════════════════════════════╗
║         AI Business Platform - API Endpoints Test Suite        ║
╚════════════════════════════════════════════════════════════════╝
"@

Write-Host "`nConfiguration:"
Write-Host "  AI Core URL: $AICoreURL"
Write-Host "  Data Connector URL: $DataConnectorURL"
Write-Host "  Using Auth Token: $(if($Token){'Yes'}else{'No'})"

$authHeaders = @{}
if ($Token) {
    $authHeaders["Authorization"] = "Bearer $Token"
}

# ============================================================
# AI CORE SERVICE TESTS
# ============================================================

Write-ColorOutput Cyan "`n`n════════════════════════════════════════════════════════════════"
Write-ColorOutput Cyan "  AI CORE SERVICE TESTS"
Write-ColorOutput Cyan "════════════════════════════════════════════════════════════════"

# Health Check
Test-Endpoint -Name "AI Core - Health Check" `
    -URL "$AICoreURL/health" `
    -Method "GET"

# Embeddings Collection List
Test-Endpoint -Name "AI Core - List Embeddings Collections" `
    -URL "$AICoreURL/api/v1/embeddings/collections" `
    -Method "GET" `
    -Headers $authHeaders

# Embeddings Upsert
Test-Endpoint -Name "AI Core - Upsert Embeddings" `
    -URL "$AICoreURL/api/v1/embeddings/upsert" `
    -Method "POST" `
    -Headers $authHeaders `
    -Body @{
        collection = "test_collection"
        documents = @(
            @{
                id = "doc1"
                content = "這是測試文件"
                metadata = @{ source = "test" }
            }
        )
    }

# Embeddings Search
Test-Endpoint -Name "AI Core - Search Embeddings" `
    -URL "$AICoreURL/api/v1/embeddings/search" `
    -Method "POST" `
    -Headers $authHeaders `
    -Body @{
        collection = "test_collection"
        query = "測試"
        limit = 5
    }

# NLP Generate
Test-Endpoint -Name "AI Core - Generate Text" `
    -URL "$AICoreURL/api/v1/nlp/generate" `
    -Method "POST" `
    -Headers $authHeaders `
    -Body @{
        prompt = "你好，請介紹一下台灣"
        max_tokens = 100
        temperature = 0.7
        model = "gpt-3.5-turbo"
    }

# NLP Chat
Test-Endpoint -Name "AI Core - Chat" `
    -URL "$AICoreURL/api/v1/nlp/chat" `
    -Method "POST" `
    -Headers $authHeaders `
    -Body @{
        messages = @(
            @{ role = "user"; content = "你好" }
        )
        max_tokens = 50
    }

# NLP Summarize
Test-Endpoint -Name "AI Core - Summarize Text" `
    -URL "$AICoreURL/api/v1/nlp/summarize" `
    -Method "POST" `
    -Headers $authHeaders `
    -Body @{
        text = "人工智能（Artificial Intelligence，AI）是計算機科學的一個分支，致力於創建能夠執行通常需要人類智能的任務的系統。"
        max_length = 50
    }

# NLP Translate
Test-Endpoint -Name "AI Core - Translate Text" `
    -URL "$AICoreURL/api/v1/nlp/translate" `
    -Method "POST" `
    -Headers $authHeaders `
    -Body @{
        text = "Hello, how are you?"
        target_language = "zh-TW"
    }

# Vision Analyze
Test-Endpoint -Name "AI Core - Analyze Image" `
    -URL "$AICoreURL/api/v1/vision/analyze" `
    -Method "POST" `
    -Headers $authHeaders `
    -Body @{
        image_base64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
        prompt = "Describe this image"
    }

# Module Registry
Test-Endpoint -Name "AI Core - List Module Registry" `
    -URL "$AICoreURL/api/v1/modules/registry" `
    -Method "GET" `
    -Headers $authHeaders

# Module by Industry
Test-Endpoint -Name "AI Core - Get Modules by Industry" `
    -URL "$AICoreURL/api/v1/modules/by-industry/manufacturing" `
    -Method "GET" `
    -Headers $authHeaders

# ============================================================
# DATA CONNECTOR SERVICE TESTS
# ============================================================

Write-ColorOutput Cyan "`n`n════════════════════════════════════════════════════════════════"
Write-ColorOutput Cyan "  DATA CONNECTOR SERVICE TESTS"
Write-ColorOutput Cyan "════════════════════════════════════════════════════════════════"

# Health Check
Test-Endpoint -Name "Data Connector - Health Check" `
    -URL "$DataConnectorURL/health" `
    -Method "GET"

# Connection Health Check
Test-Endpoint -Name "Data Connector - Connection Health" `
    -URL "$DataConnectorURL/api/v1/connectors/connections/health/check" `
    -Method "GET" `
    -Headers $authHeaders

# List Connections
Test-Endpoint -Name "Data Connector - List Connections" `
    -URL "$DataConnectorURL/api/v1/connectors/connections/" `
    -Method "GET" `
    -Headers $authHeaders

# Test Connection
Test-Endpoint -Name "Data Connector - Test Connection" `
    -URL "$DataConnectorURL/api/v1/connectors/connections/test" `
    -Method "POST" `
    -Headers $authHeaders `
    -Body @{
        type = "Excel"
        config = @{
            uploaded = $true
            rows = 100
        }
    }

# POS Health
Test-Endpoint -Name "Data Connector - POS Health" `
    -URL "$DataConnectorURL/api/v1/connectors/pos/health" `
    -Method "GET"

# Upload Health
Test-Endpoint -Name "Data Connector - Upload Health" `
    -URL "$DataConnectorURL/api/v1/connectors/upload/health" `
    -Method "GET"

# Database Health
Test-Endpoint -Name "Data Connector - Database Health" `
    -URL "$DataConnectorURL/api/v1/connectors/database/health" `
    -Method "GET"

# Storage Health
Test-Endpoint -Name "Data Connector - Storage Health" `
    -URL "$DataConnectorURL/api/v1/connectors/storage/health" `
    -Method "GET"

# Taiwan APIs Health
Test-Endpoint -Name "Data Connector - Taiwan APIs Health" `
    -URL "$DataConnectorURL/api/v1/connectors/taiwan/health" `
    -Method "GET"

# ============================================================
# SUMMARY
# ============================================================

Write-ColorOutput Cyan "`n`n════════════════════════════════════════════════════════════════"
Write-ColorOutput Cyan "  TEST SUMMARY"
Write-ColorOutput Cyan "════════════════════════════════════════════════════════════════"

Write-Host "`nTotal Tests: $TotalTests"
Write-ColorOutput Green "  Passed: $SuccessCount"
Write-ColorOutput Red "  Failed: $FailCount"

$passRate = if ($TotalTests -gt 0) { [math]::Round(($SuccessCount / $TotalTests) * 100, 2) } else { 0 }
Write-Host "  Pass Rate: $passRate%"

if ($FailCount -eq 0) {
    Write-ColorOutput Green "`n✓ All tests passed!"
    exit 0
} else {
    Write-ColorOutput Red "`n✗ Some tests failed. Please check the logs above."
    exit 1
}

