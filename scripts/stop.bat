@echo off
setlocal
cd /d "%~dp0\.."
echo ===================================================
echo PROJECT SENTINEL – Terminating Local Services
echo ===================================================

echo Stopping Uvicorn backend process (port 8000)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /F /PID %%a 2>nul
)

echo Stopping Vite frontend process (port 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :5173') do (
    taskkill /F /PID %%a 2>nul
)

taskkill /F /IM uvicorn.exe 2>nul
taskkill /F /FI "WINDOWTITLE eq Sentinel-Backend*" 2>nul
taskkill /F /FI "WINDOWTITLE eq Sentinel-Frontend*" 2>nul

echo ===================================================
echo All Project Sentinel local services terminated cleanly.
echo ===================================================
timeout /t 2 /nobreak >nul
