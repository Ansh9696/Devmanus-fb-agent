@echo off
REM ==============================================================================
REM Devmanus Extension - 1-Click Docker Starter (Windows)
REM Starts backend server and Ollama AI via Docker Compose
REM ==============================================================================
echo ====================================================
echo Starting Devmanus Facebook Extension in Docker Mode
echo ====================================================
echo.

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed or not in PATH.
    echo Please install Docker Desktop for Windows from: https://www.docker.com/products/docker-desktop/
    pause
    exit /b 1
)

echo Starting Devmanus Backend & Ollama containers...
call docker compose up -d --build
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose failed to start.
    echo Make sure Docker Desktop is running.
    pause
    exit /b 1
)

echo.
echo ====================================================
echo          Devmanus Docker Services Ready!
echo ====================================================
echo Backend Server: http://127.0.0.1:3000/health
echo Ollama Engine:  http://127.0.0.1:11434
echo.
echo Chrome Extension Setup:
echo 1. Open Google Chrome: chrome://extensions
echo 2. Enable 'Developer mode' (top right)
echo 3. Click 'Load unpacked' and select the 'dist' folder
echo 4. Pin Devmanus and open Facebook!
echo.
echo To view logs: docker compose logs -f backend
echo To stop:      docker compose down
echo.
pause
