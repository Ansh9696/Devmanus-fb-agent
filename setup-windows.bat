@echo off
REM ==============================================================================
REM Devmanus Facebook Extension - 1-Click Windows Setup (Command Prompt / Batch)
REM ==============================================================================
setlocal enabledelayedexpansion

echo ====================================================
echo       Devmanus FB Extension - Windows Setup
echo ====================================================
echo.

REM 1. Check Node.js
echo [1/4] Checking Node.js installation...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please download and install Node.js 20+ from: https://nodejs.org/
    pause
    exit /b 1
)
node -v
echo [OK] Node.js found.
echo.

REM 2. Check Ollama & Open-Source AI Model
echo [2/4] Checking Ollama & AI Model...
where ollama >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] Ollama is not installed or not in PATH.
    echo Please install Ollama for Windows from: https://ollama.com/download/windows
    echo Once installed, reopen this script.
) else (
    echo [OK] Ollama is installed.
    echo Ensuring model 'llama3.2:1b' is downloaded...
    ollama pull llama3.2:1b
)
echo.

REM 3. Install Extension Dependencies
echo [3/4] Installing extension dependencies...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] npm install failed.
    pause
    exit /b 1
)
echo.

REM 4. Install Backend Dependencies & Configure .env
echo [4/4] Installing backend dependencies...
cd server
call npm install
if not exist .env (
    copy .env.example .env >nul
    echo [OK] Created server\.env preconfigured for local Ollama.
) else (
    echo [OK] server\.env already exists.
)
cd ..
echo.

REM 5. Build Extension Bundle
echo Building extension bundle (dist/)...
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    pause
    exit /b 1
)

echo.
echo ====================================================
echo            Setup Completed Successfully!
echo ====================================================
echo.
echo How to Run on Windows:
echo 1. Double-click 'start-windows.bat' (or run: npm run dev:all)
echo 2. Open Google Chrome and go to: chrome://extensions
echo 3. Turn on 'Developer mode' (toggle in top right)
echo 4. Click 'Load unpacked' and select the 'dist' folder in this directory
echo 5. Pin the Devmanus extension and open Facebook!
echo.
pause
