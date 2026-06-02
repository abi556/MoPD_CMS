# Phase 0 verification — run from mopd-cms/ with API on :3001
# Usage: pwsh apps/web/scripts/verify-phase0.ps1 [-AdminPassword <pwd>] [-OfficerPassword <pwd>]

param(
  [string]$ApiBase = "http://localhost:3001/api/v1",
  [string]$AdminPassword,
  [string]$OfficerPassword
)

$ErrorActionPreference = "Stop"

function Test-Health {
  $health = Invoke-RestMethod -Uri "$ApiBase/health" -Method GET
  if ($health.data.status -ne "ok") {
    throw "Health check failed: $($health | ConvertTo-Json -Compress)"
  }
  Write-Host "OK  GET /health"
}

function Test-Login([string]$Email, [string]$Password, [string]$Label) {
  if (-not $Password) {
    Write-Host "SKIP login $Label (no password; pass -${Label}Password)"
    return
  }
  $body = @{ email = $Email; password = $Password } | ConvertTo-Json
  $res = Invoke-RestMethod -Uri "$ApiBase/auth/login" -Method POST -ContentType "application/json" -Body $body
  if (-not $res.data.accessToken) {
    throw "Login $Label missing accessToken"
  }
  Write-Host "OK  POST /auth/login ($Email) roles=$($res.data.user.roles -join ',')"
}

Write-Host "MoPD CMS Phase 0 verification ($ApiBase)"
Test-Health
Test-Login -Email "admin@mopd.local" -Password $AdminPassword -Label "Admin"
Test-Login -Email "officer@mopd.local" -Password $OfficerPassword -Label "Officer"
Write-Host "Phase 0 API checks passed."
