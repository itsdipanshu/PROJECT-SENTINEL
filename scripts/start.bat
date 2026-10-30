@echo off
setlocal
cd /d "%~dp0\.."
echo ===================================================
echo PROJECT SENTINEL – Disaster Intelligence Network
echo Launching Emergency Operations Center
echo ===================================================

echo Checking local AI runtime (Ollama)...
ollama list >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Ollama is not detected or not started.
    echo Sentinel AI assistant will activate when Ollama is running.
) else (
    echo [OK] Ollama is running locally.
    echo Pre-warming Gemma model into RTX 3050 GPU VRAM...
    start /b "" ollama run gemma4:e4b --keepalive 24h "Sentinel ready" >nul 2>&1
)

echo [1/2] Starting Backend FastAPI on http://localhost:8000 ...
start "Sentinel-Backend" cmd /k "cd /d "%~dp0\.." && set PYTHONPATH=. && backend\venv\Scripts\uvicorn backend.app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2/2] Starting Frontend Vite on http://localhost:5173 ...
start "Sentinel-Frontend" cmd /k "cd /d "%~dp0\..\frontend" && npm run dev"

timeout /t 3 /nobreak >nul

echo Opening browser...
start http://localhost:5173

echo ===================================================
echo Project Sentinel is running:
echo   - Web Console: http://localhost:5173
echo   - Health API:  http://localhost:8000/api/health
echo   - Local Model: Gemma on RTX 3050 GPU (100% offline)
echo ===================================================
echo Keep this window open or run stop.bat to terminate.
