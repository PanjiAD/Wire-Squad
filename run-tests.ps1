# Finds a Node.js runtime (project copy first, then portable copies, then PATH,
# then the usual Windows install locations) and runs the engine test suite.
#
#   powershell -ExecutionPolicy Bypass -File .\run-tests.ps1
#   powershell -ExecutionPolicy Bypass -File .\run-tests.ps1 -Sim 25
#   powershell -ExecutionPolicy Bypass -File .\run-tests.ps1 -Sim 200 -Oracle
#   powershell -ExecutionPolicy Bypass -File .\run-tests.ps1 -Bundle
#   powershell -ExecutionPolicy Bypass -File .\run-tests.ps1 -NodePath C:\node\node.exe

param(
  [int]$Sim = 0,
  [switch]$Oracle,
  [switch]$Bundle,
  [string]$NodePath = ''
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Find-Node {
  param([string]$Preferred)
  if ($Preferred) {
    if (Test-Path $Preferred) { return $Preferred }
    throw "Node not found at $Preferred"
  }

  $roots = @(
    (Join-Path $root 'tools\node'),
    (Join-Path $env:TEMP 'nodejs-portable')
  )
  foreach ($searchRoot in $roots) {
    if (-not (Test-Path $searchRoot)) { continue }
    $found = Get-ChildItem -Path $searchRoot -Filter node.exe -Recurse -Depth 2 -ErrorAction SilentlyContinue |
      Sort-Object FullName |
      Select-Object -First 1
    if ($found) { return $found.FullName }
  }

  $onPath = Get-Command node -ErrorAction SilentlyContinue
  if ($onPath) { return $onPath.Source }

  foreach ($candidate in @(
    "$env:ProgramFiles\nodejs\node.exe",
    "${env:ProgramFiles(x86)}\nodejs\node.exe",
    "$env:LOCALAPPDATA\Programs\nodejs\node.exe"
  )) {
    if (Test-Path $candidate) { return $candidate }
  }

  throw 'Node.js not found. Put a portable copy in .\tools\node or install Node LTS.'
}

$node = Find-Node -Preferred $NodePath
Write-Host "Node: $node"
& $node --version

Push-Location $root
try {
  # Launch each Node run as its own process: the portable Electron-as-Node
  # build tears down the calling console when a --test run finishes, which
  # would silently cancel the rest of this script.
  function Invoke-Node {
    param([string[]]$Arguments)
    $process = Start-Process -FilePath $node -ArgumentList $Arguments -Wait -PassThru -NoNewWindow
    if ($process.ExitCode -ne 0) { exit $process.ExitCode }
  }

  # The test runner needs a file glob; a bare directory fails to resolve.
  Invoke-Node @('--test', 'tests/*.test.js')
  if ($Sim -gt 0) {
    # Sim is an int, so cast it back to text for the CLI.
    $simArgs = @('tests/simulate-cli.js', "$Sim")
    if ($Oracle) { $simArgs += '--oracle' }
    Invoke-Node $simArgs
  }
  if ($Bundle) {
    Invoke-Node @('tools/bundle.mjs')
  }
} finally {
  Pop-Location
}
