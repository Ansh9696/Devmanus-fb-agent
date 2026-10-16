# ==============================================================================
# Devmanus Facebook Extension - 1-Click Windows Setup (PowerShell)
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "      Devmanus FB Extension - Windows Setup         " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Node.js
Write-Host "[1/4] Checking Node.js..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Host "ERROR: Node.js is not installed." -ForegroundColor Red
    Write-Host "Please install Node.js 20+ from https://nodejs.org/" -ForegroundColor Red
    exit 1
}
$nodeVer = node -v
Write-Host "✓ Node.js found: $nodeVer" -ForegroundColor Green

# 2. Check Ollama & Pull Model
Write-Host "`n[2/4] Checking Ollama & Open-Source AI Models..." -ForegroundColor Yellow
if (Get-Command ollama -ErrorAction SilentlyContinue) {
    Write-Host "✓ Ollama is installed." -ForegroundColor Green
    Write-Host "Pulling high-speed model 'llama3.2:1b'..." -ForegroundColor Cyan
    ollama pull llama3.2:1b
} else {
    Write-Host "WARNING: Ollama not found in PATH." -ForegroundColor Yellow
    Write-Host "Download and install Ollama for Windows from: https://ollama.com/download/windows" -ForegroundColor Yellow
}

# 3. Install Extension Dependencies
Write-Host "`n[3/4] Installing extension dependencies..." -ForegroundColor Yellow
npm install

# 4. Install Backend Dependencies & Configure .env
Write-Host "`n[4/4] Installing backend dependencies..." -ForegroundColor Yellow
Set-Location -Path server
npm install
if (-not (Test-Path .env)) {
    Copy-Item .env.example .env
    Write-Host "✓ Created server/.env preconfigured for local Ollama." -ForegroundColor Green
} else {
    Write-Host "✓ server/.env exists." -ForegroundColor Green
}
Set-Location -Path ..

# 5. Build Extension
Write-Host "`nBuilding extension bundle (dist/)..." -ForegroundColor Yellow
npm run build

Write-Host "`n====================================================" -ForegroundColor Green
Write-Host "            Setup Completed Successfully!           " -ForegroundColor Green
Write-Host "====================================================" -ForegroundColor Green
Write-Host "`nNext steps to run on Windows:" -ForegroundColor Cyan
Write-Host "1. Start backend & frontend watcher:  npm run dev:all (or .\start-windows.bat)"
Write-Host "2. In Google Chrome, go to:           chrome://extensions"
Write-Host "3. Turn ON 'Developer mode' (top right toggle)"
Write-Host "4. Click 'Load unpacked' and select the 'dist' folder"
Write-Host "5. Open Facebook and test!"
