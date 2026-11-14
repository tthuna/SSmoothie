# Installs (or updates) the Smoothie theme into Millennium, from the folder this script is in.
# Usage: double-click install.cmd (or run this script in PowerShell).
$ErrorActionPreference = "Stop"

$steam = (Get-ItemProperty -Path "HKCU:\Software\Valve\Steam" -Name SteamPath -ErrorAction SilentlyContinue).SteamPath
if (-not $steam) { throw "Steam not found. Install Steam first." }
$steam = $steam -replace "/", "\"
if (-not (Test-Path (Join-Path $steam "millennium"))) {
    throw "Millennium not found in $steam. Install it first: https://steambrew.app"
}

$dest = Join-Path $steam "millennium\themes\smoothie"
if ((Resolve-Path $PSScriptRoot).Path -ne $dest) {
    New-Item -ItemType Directory -Force $dest | Out-Null
    Get-ChildItem -Force $PSScriptRoot | Where-Object Name -ne ".git" | Copy-Item -Destination $dest -Recurse -Force
}

Write-Host "Smoothie installed in $dest"
Write-Host "Restart Steam, then pick Smoothie in Millennium > Themes."
