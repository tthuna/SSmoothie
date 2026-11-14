# Installs (or updates) the Smoothie theme into Millennium.
# Usage (PowerShell): irm https://raw.githubusercontent.com/tthuna/SSmoothie/main/install.ps1 | iex
$ErrorActionPreference = "Stop"

$steam = (Get-ItemProperty -Path "HKCU:\Software\Valve\Steam" -Name SteamPath -ErrorAction SilentlyContinue).SteamPath
if (-not $steam) { throw "Steam not found. Install Steam first." }
$steam = $steam -replace "/", "\"
$themes = Join-Path $steam "millennium\themes"
if (-not (Test-Path (Join-Path $steam "millennium"))) {
    throw "Millennium not found in $steam. Install it first: https://steambrew.app"
}

$tmp = Join-Path $env:TEMP "smoothie-install"
Remove-Item -Recurse -Force $tmp -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force $tmp | Out-Null
$zip = Join-Path $tmp "smoothie.zip"
Write-Host "Downloading Smoothie..."
Invoke-WebRequest "https://github.com/tthuna/SSmoothie/archive/refs/heads/main.zip" -OutFile $zip -UseBasicParsing
Expand-Archive $zip -DestinationPath $tmp

$dest = Join-Path $themes "smoothie"
New-Item -ItemType Directory -Force $dest | Out-Null
Copy-Item -Recurse -Force (Join-Path $tmp "SSmoothie-main\*") $dest
Remove-Item -Recurse -Force $tmp

Write-Host "Smoothie installed in $dest"
Write-Host "Restart Steam, then pick Smoothie in Millennium > Themes."
