@echo off
REM ==============================================================================
REM Devmanus Extension - 1-Click Docker Starter (Windows)
REM Starts backend server, Ollama AI, and Chrome Extension Builder via Docker Compose
REM ==============================================================================
echo ====================================================
echo Starting Devmanus Facebook Extension in Docker Mode
echo ====================================================
echo.

REM 1. Auto-build dist/ if npm is available locally
where npm >nul 2>nul
if %errorlevel% equ 0 (
    echo [1/3] Generating Chrome Extension dist bundle...
    call npm run build
    echo [OK] dist bundle generated.
) else (
    echo [NOTICE] npm not found locally. Extension will be built inside Docker.
)
echo.

REM 2. Check Docker
where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH.
    echo Please install Docker Desktop for Windows from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo [2/3] Starting Devmanus Backend, Ollama & Extension containers...
call docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose failed to start.
    echo Make sure Docker Desktop is running.
    pause
    exit /b 1
)

echo [3/3] Checking services...
timeout /t 4 /nobreak >nul

echo.
echo ====================================================
echo          Devmanus Docker Services Ready!
echo ====================================================
echo Backend Server:        http://127.0.0.1:3000/health
echo Sidepanel Web Preview: http://127.0.0.1:3000/sidepanel
echo Extension Assets:      http://127.0.0.1:3000/dist/manifest.json
echo Ollama Engine:         http://127.0.0.1:11434
echo.
echo Chrome Extension Setup:
echo 1. Open Google Chrome: chrome://extensions
echo 2. Enable 'Developer mode' (top right)
echo 3. Click 'Load unpacked' and select the 'dist' folder in this directory
echo 4. Pin Devmanus and open Facebook!
echo.
echo To view logs: docker compose logs -f backend
echo To stop:      docker compose down
echo.
pause
