# 移除開發者用戶腳本
# 此腳本將執行 SQL 來刪除 dev@example.com 用戶

param(
    [string]$SupabaseUrl = "https://ergqqdirsvmamowpklia.supabase.co",
    [string]$SupabaseServiceKey = ""
)

if (-not $SupabaseServiceKey) {
    Write-Host "請提供 Supabase Service Key:" -ForegroundColor Red
    Write-Host "使用方法: .\remove-dev-user.ps1 -SupabaseServiceKey 'your-service-key'" -ForegroundColor Yellow
    exit 1
}

Write-Host "正在移除開發者用戶..." -ForegroundColor Yellow

# 讀取 SQL 腳本
$sqlScript = Get-Content -Path ".\remove-dev-user.sql" -Raw

# 設置請求標頭
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer $SupabaseServiceKey"
    "apikey" = $SupabaseServiceKey
}

# 執行 SQL
$body = @{
    query = $sqlScript
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$SupabaseUrl/rest/v1/rpc/exec_sql" -Method Post -Headers $headers -Body $body
    Write-Host "✅ 開發者用戶已成功移除" -ForegroundColor Green
    Write-Host "結果: $($response | ConvertTo-Json -Depth 3)" -ForegroundColor Cyan
} catch {
    Write-Host "❌ 移除失敗: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "請檢查 Supabase Service Key 是否正確" -ForegroundColor Yellow
}

