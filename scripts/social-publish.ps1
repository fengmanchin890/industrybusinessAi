param(
  [Parameter(Mandatory=$true)] [string]$ProjectRef,
  [Parameter(Mandatory=$true)] [string]$ServiceRoleKey,
  [Parameter(Mandatory=$false)] [string]$PostId
)

$ErrorActionPreference = 'Stop'

# Build URLs
$SUPABASE_URL  = "https://$ProjectRef.supabase.co"
$FUNCTIONS_URL = "https://$ProjectRef.functions.supabase.co"

Write-Host "Supabase URL: $SUPABASE_URL" -ForegroundColor Cyan
Write-Host "Functions URL: $FUNCTIONS_URL" -ForegroundColor Cyan

$headersApi = @{ apikey = $ServiceRoleKey; Authorization = "Bearer $ServiceRoleKey" }

if (-not $PostId -or [string]::IsNullOrWhiteSpace($PostId)) {
  Write-Host "No PostId provided. Fetching latest draft..." -ForegroundColor Yellow
  $latest = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/marketing_posts?select=id&status=eq.draft&order=created_at.desc&limit=1" -Headers $headersApi -Method Get
  if (-not $latest) { throw "No draft posts found. Please create one from the app." }
  $PostId = $latest[0].id
}

Write-Host "Publishing post: $PostId" -ForegroundColor Green

$headersFn = @{ "Content-Type"="application/json"; apikey=$ServiceRoleKey; Authorization="Bearer $ServiceRoleKey" }
$body = @{ post_id = $PostId } | ConvertTo-Json

$resp = Invoke-RestMethod -Uri "$FUNCTIONS_URL/social-publish" -Method Post -Headers $headersFn -Body $body
Write-Host ("Function response: " + ($resp | ConvertTo-Json -Depth 5)) -ForegroundColor Gray

# Read latest status
$post = Invoke-RestMethod -Uri "$SUPABASE_URL/rest/v1/marketing_posts?select=title,channel,status,created_at&id=eq.$PostId" -Headers $headersApi -Method Get
Write-Host ("Status: " + ($post | ConvertTo-Json -Depth 5)) -ForegroundColor Magenta


