@echo off
title Vyom Drishti - Lunara Co-Registration Engine
color 0B

echo ========================================================
echo        VYOM DRISHTI / LUNARA - SYSTEM LAUNCHER         
echo ========================================================
echo.

cd /d "%~dp0"

echo [*] Checking Python installation...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    pause
    exit /b 1
)

echo [*] Starting Python Backend & Cloudflare Tunnel...
start "Lunara Python Backend" /min cmd /c "python start_pipeline.py"

echo [*] Starting Frontend Server (Vite)...
cd LUNARA_FRONTEND
start "Lunara Frontend Dev Server" /min cmd /c "npm.cmd run dev"
cd ..

echo [*] Waiting for services to initialize...
timeout /t 4 /nobreak >nul

echo [*] Opening browser to local frontend...
start http://localhost:3000

echo.
echo ========================================================
echo  [SUCCESS] All Services Running!
echo  - Local Web UI:    http://localhost:3000
echo  - Python Backend:  http://127.0.0.1:8000
echo  - Cloudflare Tunnel registered with Vercel deployment!
echo ========================================================
echo.
echo You can keep this window open or minimize it.
echo Press any key to close this launcher (services will keep running).
pause >nul
