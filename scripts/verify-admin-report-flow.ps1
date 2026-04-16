param(
  [Parameter(Mandatory = $true)]
  [string]$ReportId,

  [Parameter(Mandatory = $true)]
  [string]$AdminUserId,

  [Parameter(Mandatory = $false)]
  [string]$ApiBase = "http://localhost:3000",

  [Parameter(Mandatory = $false)]
  [string]$DbUrl = "postgresql://postgres:postgres@127.0.0.1:64322/postgres",

  [Parameter(Mandatory = $false)]
  [string]$ResolutionNote = "Resolved by verification script"

  ,
  [Parameter(Mandatory = $false)]
  [string]$AuthToken = ""

  ,
  [Parameter(Mandatory = $false)]
  [switch]$SkipApi
)

$ErrorActionPreference = "Stop"

function Show-AuthHintIfNeeded {
  param(
    [string]$RawResponse,
    [string]$StepName
  )

  if ($RawResponse -match "HTTP/1\.[01] 401" -or $RawResponse -match "HTTP/2 401") {
    Write-Host "[hint] $StepName returned 401 Unauthorized. Provide -AuthToken or run in a logged-in browser session." -ForegroundColor Yellow
  } elseif ($RawResponse -match "curl:\s*\(7\)") {
    Write-Host "[hint] $StepName could not connect to API. Start the app with npm run dev and retry." -ForegroundColor Yellow
  }
}

Write-Host "=== 1) API health check ===" -ForegroundColor Cyan
if ($SkipApi) {
  Write-Host "Skipped by -SkipApi switch." -ForegroundColor Yellow
} else {
  $healthHeaders = @("-H", "Content-Type: application/json")
  if ($AuthToken) {
    $healthHeaders += @("-H", "Authorization: Bearer $AuthToken")
  }
  $healthResponse = curl.exe -sS -i "$ApiBase/api/health" @healthHeaders
  Write-Output $healthResponse
  Show-AuthHintIfNeeded -RawResponse ($healthResponse -join "`n") -StepName "Health check"
}
Write-Host ""

Write-Host "=== 2) Resolve report API call ===" -ForegroundColor Cyan
if ($SkipApi) {
  Write-Host "Skipped by -SkipApi switch." -ForegroundColor Yellow
} else {
  $payload = @{
    reportId = $ReportId
    resolverId = $AdminUserId
    resolutionNote = $ResolutionNote
  } | ConvertTo-Json -Compress

  $resolveHeaders = @("-H", "Content-Type: application/json")
  if ($AuthToken) {
    $resolveHeaders += @("-H", "Authorization: Bearer $AuthToken")
  }
  $resolveResponse = curl.exe -sS -i -X POST "$ApiBase/api/admin/resolve-report" @resolveHeaders --data-raw $payload
  Write-Output $resolveResponse
  Show-AuthHintIfNeeded -RawResponse ($resolveResponse -join "`n") -StepName "Resolve report"
}
Write-Host ""

Write-Host "=== 3) Database verification ===" -ForegroundColor Cyan
$tmp = Join-Path $PWD "scripts\_tmp_verify_admin_report.js"
@'
const { Client } = require("pg");

(async () => {
  const reportId = process.argv[2];
  const dbUrl = process.argv[3];

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const report = await client.query(
    `SELECT id, status, resolution_note, resolved_at, resolved_by
     FROM public.user_reports
     WHERE id = $1`,
    [reportId]
  );

  const logs = await client.query(
    `SELECT action, action_type, object_type, object_id, created_at
     FROM public.user_activity_logs
     WHERE object_type = 'user_report' AND object_id = $1
     ORDER BY created_at DESC
     LIMIT 5`,
    [reportId]
  );

  const notif = await client.query(
    `SELECT user_id, type, title, message, related_object_type, related_object_id, created_at
     FROM public.user_notifications
     WHERE related_object_type = 'user_report' AND related_object_id = $1
     ORDER BY created_at DESC
     LIMIT 5`,
    [reportId]
  );

  console.log("report:", report.rows);
  console.log("activity_logs:", logs.rows);
  console.log("notifications:", notif.rows);

  await client.end();
})();
'@ | Set-Content -Path $tmp -Encoding utf8

node $tmp $ReportId $DbUrl
Remove-Item $tmp -Force

Write-Host ""
Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "Expected:"
Write-Host "- user_reports.status = resolved"
Write-Host "- user_reports.resolution_note is populated"
Write-Host "- at least one user_activity_logs row for this report"
Write-Host "- user_notifications row is expected only when using the admin UI/server action flow"
Write-Host "  (the API route may resolve a report without inserting notifications)."
