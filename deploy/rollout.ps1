<#
.SYNOPSIS
  Deploys the Cross Charge app to one or more Dynatrace tenants.

.PARAMETER EnvFilter
  Optional. Filter tenants by env column: "Dev" or "Prod". Omit to run all.

.PARAMETER TenantFilter
  Optional. Run only a specific tenant_id (for testing a single tenant).

.EXAMPLE
  .\rollout.ps1 -EnvFilter Dev
  .\rollout.ps1 -TenantFilter wmw59814
  .\rollout.ps1
#>
param(
    [string]$EnvFilter = "",
    [string]$TenantFilter = ""
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

# --- Paths ---
$root        = Split-Path $PSScriptRoot -Parent
$secretsFile = Join-Path $root "secrets.json"
$tenantsFile = Join-Path $root "tenants.csv"
$appBundle   = Join-Path $root "out\artifact.zip"
$wfTemplate  = Join-Path $PSScriptRoot "workflow-template.json"
$logFile     = Join-Path $PSScriptRoot "rollout-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

# --- Preflight ---
foreach ($f in @($secretsFile, $tenantsFile, $appBundle, $wfTemplate)) {
    if (-not (Test-Path $f)) {
        Write-Error "Required file not found: $f"
        exit 1
    }
}

$secrets = Get-Content $secretsFile | ConvertFrom-Json
$tenants = Import-Csv $tenantsFile
$wfJson  = Get-Content $wfTemplate -Raw

if ($EnvFilter)    { $tenants = $tenants | Where-Object { $_.env -eq $EnvFilter } }
if ($TenantFilter) { $tenants = $tenants | Where-Object { $_.tenant_id -eq $TenantFilter } }

if ($tenants.Count -eq 0) {
    Write-Warning "No tenants matched the filter. Exiting."
    exit 0
}

Write-Host "`nCross Charge Rollout - $($tenants.Count) tenant(s)" -ForegroundColor Cyan
Write-Host "Log: $logFile`n"

# --- Helpers ---
function Write-Log {
    param([string]$Msg, [string]$Color = "White")
    $line = "$(Get-Date -Format 'HH:mm:ss') $Msg"
    Add-Content $logFile $line
    Write-Host $line -ForegroundColor $Color
}

function Get-BearerToken {
    param([string]$TenantUrl)
    $body = "grant_type=client_credentials" +
            "&client_id=$([uri]::EscapeDataString($secrets.deployment.client_id))" +
            "&client_secret=$([uri]::EscapeDataString($secrets.deployment.client_secret))" +
            "&scope=automation:workflows:read automation:workflows:write settings:objects:write settings:objects:read app-engine:apps:install"
    $resp = Invoke-RestMethod -Uri "https://sso.dynatrace.com/sso/oauth2/token" `
                              -Method POST `
                              -ContentType "application/x-www-form-urlencoded" `
                              -Body $body
    return $resp.access_token
}

# --- Per-tenant loop ---
$results = @()

foreach ($tenant in $tenants) {
    $tenantUrl = "https://$($tenant.tenant_id).apps.dynatrace.com"
    $liveUrl   = "https://$($tenant.tenant_id).live.dynatrace.com"
    $label     = "$($tenant.tenant_id) ($($tenant.tenant_code) / $($tenant.env))"
    $ok        = $true

    Write-Log "`n=== $label ===" "Cyan"

    # 1. Get bearer token
    try {
        $token = Get-BearerToken -TenantUrl $tenantUrl
        $auth  = @{ Authorization = "Bearer $token"; Accept = "application/json" }
        Write-Log "  [1] Token OK" "Green"
    } catch {
        Write-Log "  [1] FAILED - could not get token: $_" "Red"
        $results += [pscustomobject]@{ Tenant = $label; Status = "FAILED (token)" }
        continue
    }

    # 2. Delete old workflow
    try {
        $wfSearch = Invoke-RestMethod -Uri "$tenantUrl/platform/automation/v1/workflows?title=Cross+Charge+Workflow" -Headers $auth
        if ($wfSearch.count -gt 0) {
            $wfId = $wfSearch.results[0].id
            Invoke-RestMethod -Uri "$tenantUrl/platform/automation/v1/workflows/$wfId" -Method DELETE -Headers $auth | Out-Null
            Write-Log "  [2] Deleted old workflow: $wfId" "Green"
        } else {
            Write-Log "  [2] No existing workflow found - skipping delete" "Yellow"
        }
    } catch {
        Write-Log "  [2] WARNING - could not delete workflow: $_" "Yellow"
    }

    # 3. Deploy app bundle
    try {
        $deployHeaders = @{
            "Authorization" = "Bearer $token"
            "Content-Type"  = "application/zip"
            "Accept"        = "application/json"
        }
        Invoke-RestMethod -Uri "$tenantUrl/platform/app-engine/registry/v1/apps" `
                          -Method POST `
                          -Headers $deployHeaders `
                          -InFile $appBundle | Out-Null
        Write-Log "  [3] App deployed" "Green"
    } catch {
        Write-Log "  [3] FAILED - app deploy: $_" "Red"
        $results += [pscustomobject]@{ Tenant = $label; Status = "FAILED (deploy)" }
        $ok = $false
        continue
    }

    $jsonHeaders = @{
        "Authorization" = "Bearer $token"
        "Content-Type"  = "application/json; charset=utf-8"
        "Accept"        = "application/json"
    }

    # Wait for app schemas to register after deployment
    Write-Log "  Waiting 30s for app schemas to register..." "Yellow"
    Start-Sleep -Seconds 30

    # 4. Create bizevent settings
    $bizObjectId = $null
    try {
        $bizBody = ConvertTo-Json -Depth 5 @(
            @{
                schemaId      = "app:my.cross.charge:send-bizevent-connection"
                schemaVersion = "0.0.1"
                scope         = "environment"
                value         = @{
                    name  = $secrets.bizevent_target.name
                    url   = $secrets.bizevent_target.url
                    token = $secrets.bizevent_target.token
                }
            }
        )
        $bizResp     = Invoke-RestMethod -Uri "$liveUrl/api/v2/settings/objects" -Method POST -Headers $jsonHeaders -Body $bizBody
        $bizObjectId = $bizResp[0].objectId
        Write-Log "  [4] BizEvent settings created: $bizObjectId" "Green"
    } catch {
        Write-Log "  [4] FAILED - bizevent settings: $_" "Red"
        $results += [pscustomobject]@{ Tenant = $label; Status = "FAILED (bizevent settings)" }
        $ok = $false
        continue
    }

    # 5. Create rate card settings
    $rcObjectId = $null
    try {
        $rcBody = ConvertTo-Json -Depth 5 @(
            @{
                schemaId      = "app:my.cross.charge:get-rate-card-connection"
                schemaVersion = "0.1.0"
                scope         = "environment"
                value         = @{
                    rate_card_type = "account"
                    client_id      = $secrets.rate_card.client_id
                    client_secret  = $secrets.rate_card.client_secret
                    account_id     = $secrets.deployment.account_id
                    tag_keys       = @(@{ tag_key = $tenant.tag_key })
                }
            }
        )
        $rcResp     = Invoke-RestMethod -Uri "$liveUrl/api/v2/settings/objects" -Method POST -Headers $jsonHeaders -Body $rcBody
        $rcObjectId = $rcResp[0].objectId
        Write-Log "  [5] Rate card settings created: $rcObjectId" "Green"
    } catch {
        Write-Log "  [5] FAILED - rate card settings: $_" "Red"
        $results += [pscustomobject]@{ Tenant = $label; Status = "FAILED (rate card settings)" }
        $ok = $false
        continue
    }

    # 6. Create workflow
    try {
        $wfBody = $wfJson -replace "RATE_CARD_CONNECTION_ID", $rcObjectId `
                          -replace "BIZEVENT_CONNECTION_ID",  $bizObjectId
        $wfResp = Invoke-RestMethod -Uri "$tenantUrl/platform/automation/v1/workflows" `
                                    -Method POST -Headers $jsonHeaders -Body $wfBody
        Write-Log "  [6] Workflow created: $($wfResp.id)" "Green"
    } catch {
        Write-Log "  [6] FAILED - workflow creation: $_" "Red"
        $results += [pscustomobject]@{ Tenant = $label; Status = "FAILED (workflow)" }
        $ok = $false
    }

    if ($ok) {
        $results += [pscustomobject]@{ Tenant = $label; Status = "OK" }
        Write-Log "  DONE" "Green"
    }
}

# --- Summary ---
Write-Log "`n--------------------------------------" "Cyan"
Write-Log "SUMMARY" "Cyan"
$results | ForEach-Object {
    $color = if ($_.Status -eq "OK") { "Green" } else { "Red" }
    Write-Log "  $($_.Tenant)  ->  $($_.Status)" $color
}
Write-Log "--------------------------------------" "Cyan"
