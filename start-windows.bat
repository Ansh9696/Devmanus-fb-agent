@echo off
REM ==============================================================================
REM Devmanus Facebook Extension - Windows 1-Click Starter
REM ==============================================================================
echo ====================================================
echo Starting Devmanus Facebook AI Extension on Windows
echo ====================================================
echo.

where ollama >nul 2>nul
if %errorlevel% equ 0 (
    echo [OK] Ollama found. Checking Ollama service...
)

echo Starting backend and frontend concurrently...
call npm run dev:all
pause
