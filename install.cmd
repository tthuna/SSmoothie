@echo off
rem Opened from inside the ZIP, Windows extracts only this file to Temp: the theme files are missing.
if not exist "%~dp0install.ps1" (
  echo Extract the ZIP first: right-click it ^> Extract All, then run install.cmd from the extracted folder.
  pause
  exit /b 1
)
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1"
pause
