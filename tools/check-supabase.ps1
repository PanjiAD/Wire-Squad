# Runs the Supabase smoke test through Start-Process, matching run-tests.ps1.
# The portable Electron-as-Node build tears down the calling console when a
# run finishes, so a nested Start-Process is required on this machine.
#
#   powershell -ExecutionPolicy Bypass -File .\tools\check-supabase.ps1

param(
  [string]$NodePath = '',
  [string]$Script = 'tools/check-supabase.mjs',
  [string[]]$ScriptArgs = @()
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)

$node = $NodePath
if (-not $node) {
  $candidates = @(
    (Join-Path $root 'tools\node\node-v26.13.1-win-x64\node.exe'),
    (Join-Path $root 'tools\nodebin\node-v26.13.1-win-x64\node.exe')
  )
  foreach ($candidate in $candidates) {
    if (Test-Path $candidate) { $node = $candidate; break }
  }
}
if (-not $node) {
  $onPath = Get-Command node -ErrorAction SilentlyContinue
  if ($onPath) { $node = $onPath.Source }
}
if (-not $node) { throw 'Node.js not found. Put a portable copy in .\tools\node.' }

Push-Location $root
try {
  $process = Start-Process -FilePath $node -ArgumentList (@($Script) + $ScriptArgs) -Wait -PassThru -NoNewWindow
  exit $process.ExitCode
} finally {
  Pop-Location
}
