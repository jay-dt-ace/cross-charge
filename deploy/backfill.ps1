<#
.SYNOPSIS
  Backfills Cross Charge workflow executions for a date range across all tenants.
  For each date: patches each tenant workflow with target_date, triggers all runs,
  waits GapSeconds, then checks and logs every execution status before moving on.

.PARAMETER StartDate   First date to backfill (YYYY-MM-DD). Default: 2026-09-07
.PARAMETER EndDate     Last date to backfill  (YYYY-MM-DD). Default: 2026-09-29
.PARAMETER EnvFilter   Optional. Filter tenants by env column.
.PARAMETER TenantFilter Optional. Run only a specific tenant_id.
.PARAMETER GapSeconds  Seconds to wait between date batches. Default: 300 (5 min).

.EXAMPLE
  .\backfill.ps1
  .\backfill.ps1 -TenantFilter wmw59814
  .\backfill.ps1 -StartDate 2026-09-20 -EndDate 2026-09-29
#>
param(
    [string]$StartDate    = "2026-09-07",
    [string]$EndDate      = "2026-09-29",
    [string]$EnvFilter    = "",
    [string]$TenantFilter = "",
    [int]$GapSeconds      = 300
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Continue"

$root        = Split-Path $PSScriptRoot -Parent
$secretsFile = Join-Path $root "secrets.json"
$tenantsFile = Join-Path $root "tenants.csv"
$logFile     = Join-Path $PSScriptRoot "backfill-$(Get-Date -Format 'yyyyMMdd-HHmmss').log"

foreach ($f in @($secretsFile, $tenantsFile)) {
    if (-not (Test-Path $f)) { Write-Error "Required file not found: $f"; exit 1 }
}

$secrets = Get-Content $secretsFile | ConvertFrom-Json
$tenants = @(Import-Csv $tenantsFile)  

if ($EnvFilter)    { $tenants = $tenants | Where-Object { $_.env -eq $EnvFilter } }
if ($TenantFilter) { $tenants = $tenants | Where-Object { $_.tenant_id -eq $TenantFilter } }
if ($tenants.Count -eq 0) { Write-Warning "No tenants matched filter."; exit 0 }

function Write-Log {
    param([string]$Msg, [string]$Color = "White")
    $line = "$(Get-Date -Format 'HH:mm:ss') $Msg"
    Add-Content $logFile $line
    Write-Host $line -ForegroundColor $Color
}

function Get-Token {
    $body = "grant_type=client_credentials" +
            "&client_id=$([uri]::EscapeDataString($secrets.deployment.client_id))" +
            "&client_secret=$([uri]::EscapeDataString($secrets.deployment.client_secret))" +
            "&scope=automation:workflows:read automation:workflows:write"
    $resp = Invoke-RestMethod -Uri "https://sso.dynatrace.com/sso/oauth2/token" `
                              -Method POST -ContentType "application/x-www-form-urlencoded" -Body $body
    return $resp.access_token
}

function Get-StatusColor {
    param([string]$Status)
    switch ($Status) {
        "SUCCESS"   { return "Green" }
        "RUNNING"   { return "Yellow" }
        "FAILED"    { return "Red" }
        "CANCELLED" { return "Red" }
        default     { return "White" }
    }
}

# Build date list
$dates = @()
$cur = [datetime]::ParseExact($StartDate, "yyyy-MM-dd", $null)
$end = [datetime]::ParseExact($EndDate,   "yyyy-MM-dd", $null)
while ($cur -le $end) { $dates += $cur.ToString("yyyy-MM-dd"); $cur = $cur.AddDays(1) }

Write-Log "Cross Charge Backfill" "Cyan"
Write-Log "  Tenants : $($tenants.Count)" "Cyan"
Write-Log "  Dates   : $($dates.Count)  ($StartDate to $EndDate)" "Cyan"
Write-Log "  Gap     : ${GapSeconds}s between date batches" "Cyan"
Write-Log "  Log     : $logFile`n" "Cyan"

# Resolve workflow IDs once up front
Write-Log "Resolving workflow IDs..." "Yellow"
$tenantMeta = [System.Collections.Generic.List[hashtable]]::new()

foreach ($tenant in $tenants) {
    $tenantUrl = "https://$($tenant.tenant_id).apps.dynatrace.com"
    $label     = "$($tenant.tenant_id) ($($tenant.tenant_code) / $($tenant.env))"
    try {
        $token = Get-Token
        $auth  = @{ Authorization = "Bearer $token"; Accept = "application/json" }

        # Query API (escape the title query)
        $wfSearch = Invoke-RestMethod -Uri "$tenantUrl/platform/automation/v1/workflows?title=$([uri]::EscapeDataString('Cross Charge Workflow'))" -Headers $auth

        # Normalize common response shapes into an array
        $candidates = @()
        if ($null -ne $wfSearch) {
            if ($wfSearch.psobject.properties.name -contains 'results') {
                $candidates = @($wfSearch.results)
            } elseif ($wfSearch.psobject.properties.name -contains 'workflows') {
                $candidates = @($wfSearch.workflows)
            } elseif ($wfSearch -is [System.Array] -or $wfSearch -is [System.Collections.IEnumerable]) {
                $candidates = @($wfSearch)
            } else {
                $candidates = @($wfSearch)
            }
        }

        # Log all returned candidates for visibility
        if (@($candidates).Count -gt 0) {
            Write-Log "  $label -> API returned candidates:" "Yellow"
            foreach ($c in $candidates) {
                $idVal = if ($c.PSObject.Properties.Match('id')) { $c.id } elseif ($c.PSObject.Properties.Match('workflowId')) { $c.workflowId } else { '(no id)' }
                $titleVal = if ($c.PSObject.Properties.Match('title')) { $c.title } else { '(no title)' }
                Write-Log "    id: $idVal  title: $titleVal" "White"
            }
        } else {
            Write-Log "  $label -> API returned no candidates" "Red"
        }

        # Prefer exact (case-insensitive) title match
        $exactMatches = @($candidates | Where-Object { $_.title -and ($_.title.Trim() -ieq 'Cross Charge Workflow') })
        if (@($exactMatches).Count -gt 0) {
            if (@($exactMatches).Count -gt 1) {
                Write-Log "  $label -> MULTIPLE exact matches found (using first)." "Yellow"
            }
            $wf = $exactMatches[0]
            Write-Log "  $label -> selected exact-match workflow id $($wf.id)" "Green"
        } elseif (@($candidates).Count -gt 0) {
            # Fallback behavior (kept for compatibility)
            Write-Log "  $label -> NO exact title match; falling back to first candidate (possible partial match)" "Yellow"
            $wf = $candidates[0]
            Write-Log "  $label -> selected fallback workflow id $($wf.id)" "Yellow"
        } else {
            $wf = $null
        }

        if ($wf -and $wf.id) {
            $tenantMeta.Add(@{ label = $label; tenantUrl = $tenantUrl; workflowId = $wf.id })
        } else {
            Write-Log "  $label -> NO WORKFLOW FOUND - skipping" "Red"
        }
    } catch {
        Write-Log "  $label -> ERROR: $_" "Red"
    }
}

if ($tenantMeta.Count -eq 0) { Write-Log "No workflows found. Exiting." "Red"; exit 1 }
Write-Log "`n$($tenantMeta.Count) tenant(s) ready.`n" "Cyan"

$grandTotalOk   = 0
$grandTotalFail = 0

foreach ($date in $dates) {
    Write-Log "=== $date - Triggering ===" "Cyan"

    # Track executions fired this date batch
    $executions = [System.Collections.Generic.List[hashtable]]::new()

    foreach ($meta in $tenantMeta) {
        try {
            # Get fresh token for this operation (avoid stale/expired token)
            $token   = Get-Token
            $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json"; Accept = "application/json" }

            # Build trimmed/escaped workflow path and include adminAccess flag
            $workflowId = $meta.workflowId.ToString().Trim()
            $baseWorkflowPath = "$($meta.tenantUrl)/platform/automation/v1/workflows/$([uri]::EscapeDataString($workflowId))"

            # GET current workflow definition (include adminAccess=false)
            $workflowGetUrl = "${baseWorkflowPath}?adminAccess=false"
            Write-Log "    GET $workflowGetUrl" "Yellow"
            $wfObj = Invoke-RestMethod -Uri $workflowGetUrl -Headers $headers -Method Get -ErrorAction Stop
            $wfJson = $wfObj | ConvertTo-Json -Depth 10

            # PATCH target_date via string replacement on the JSON string
            $wfJson = $wfJson -replace '"target_date"\s*:\s*"[^"]*"', """target_date"": ""$date"""

            # PUT updated workflow back (include adminAccess=false)
            $workflowPutUrl = "${baseWorkflowPath}?adminAccess=false"
            Invoke-RestMethod -Uri $workflowPutUrl -Method Put -Headers $headers -Body $wfJson -ErrorAction Stop | Out-Null

            # Trigger execution (include adminAccess=false)
            $runUrl = "${baseWorkflowPath}/runs?adminAccess=false"
            $runResp = Invoke-RestMethod -Uri $runUrl -Method Post -Headers $headers -Body "{}" -ErrorAction Stop

            Write-Log "  TRIGGERED  $($meta.label) -> execution $($runResp.id)" "Green"
            $executions.Add(@{ meta = $meta; executionId = $runResp.id })
        } catch {
            Write-Log "  FAILED     $($meta.label) -> $_" "Red"
            $grandTotalFail++
        }
    }

    # Wait for workflows to complete before checking status
    if ($executions.Count -gt 0) {
        Write-Log "  Waiting ${GapSeconds}s for executions to complete..." "Yellow"
        Start-Sleep -Seconds $GapSeconds

        Write-Log "=== $date - Status Check ===" "Cyan"
        foreach ($exec in $executions) {
            try {
                $token   = Get-Token
                $headers = @{ Authorization = "Bearer $token"; Accept = "application/json" }
                $status  = Invoke-RestMethod -Uri "$($exec.meta.tenantUrl)/platform/automation/v1/executions/$($exec.executionId)" -Headers $headers
                $state   = $status.status
                $color   = Get-StatusColor $state
                Write-Log "  $state  $($exec.meta.label) -> $($exec.executionId)" $color
                if ($state -eq "SUCCESS") { $grandTotalOk++ } else { $grandTotalFail++ }
            } catch {
                Write-Log "  ERROR checking status $($exec.meta.label) -> $_" "Red"
                $grandTotalFail++
            }
        }
    }

    Write-Log "" "White"
}

# Restore target_date to "" on all tenants
Write-Log "Restoring target_date to empty on all tenants..." "Yellow"
foreach ($meta in $tenantMeta) {
    try {
        $token   = Get-Token
        $headers = @{ Authorization = "Bearer $token"; "Content-Type" = "application/json"; Accept = "application/json" }
        
        # Build trimmed/escaped workflow path
        $workflowId = $meta.workflowId.ToString().Trim()
        $baseWorkflowPath = "$($meta.tenantUrl)/platform/automation/v1/workflows/$([uri]::EscapeDataString($workflowId))"
        
        # GET for restore (include adminAccess=false)
        $workflowGetUrl = "${baseWorkflowPath}?adminAccess=false"
        Write-Log "  Restoring: GET $workflowGetUrl" "Yellow"
        $wfJson = (Invoke-WebRequest -Uri $workflowGetUrl -Headers $headers -UseBasicParsing).Content
        
        # PATCH target_date to empty
        $wfJson = $wfJson -replace '"target_date"\s*:\s*"[^"]*"', '"target_date": ""'
        
        # PUT back (include adminAccess=false)
        $workflowPutUrl = "${baseWorkflowPath}?adminAccess=false"
        Write-Log "  Restoring: PUT $workflowPutUrl" "Yellow"
        Invoke-RestMethod -Uri $workflowPutUrl `
                          -Method PUT -Headers $headers -Body $wfJson | Out-Null
        Write-Log "  $($meta.label) -> restored" "Green"
    } catch {
        Write-Log "  $($meta.label) -> restore FAILED: $_" "Red"
    }
}

Write-Log "`n--------------------------------------" "Cyan"
Write-Log "BACKFILL COMPLETE" "Cyan"
Write-Log "  SUCCESS : $grandTotalOk" "Green"
Write-Log "  FAILED  : $grandTotalFail" $(if ($grandTotalFail -gt 0) { "Red" } else { "Green" })
Write-Log "--------------------------------------" "Cyan"