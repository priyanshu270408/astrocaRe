# ASTROCARE PowerShell Launcher
Set-Location -Path $PSScriptRoot
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Launching ASTROCARE Platform on http://localhost:8000" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan
python server.py
