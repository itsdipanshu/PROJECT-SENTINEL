@echo off
setlocal
cd /d "%~dp0\.."
echo ===================================================
echo PROJECT SENTINEL – Local Environment Setup
echo ===================================================

echo [1/4] Checking Python and creating Virtual Environment...
if not exist "backend\venv" (
    python -m venv backend\venv
    if errorlevel 1 (
        echo Error: Failed to create Python virtual environment.
        pause
        exit /b 1
    )
) else (
    echo Virtual environment backend\venv already exists.
)

echo [2/4] Installing Python Backend Dependencies...
backend\venv\Scripts\pip install -r backend\requirements.txt
if errorlevel 1 (
    echo Error: Failed to install Python dependencies.
    pause
    exit /b 1
)

echo [3/4] Initializing SQLite Database (33 relational tables)...
set PYTHONPATH=.
backend\venv\Scripts\python -m backend.app.database.init_db
if errorlevel 1 (
    echo Error: Failed to initialize SQLite database.
    pause
    exit /b 1
)

echo [4/4] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..

echo ===================================================
echo SUCCESS: Project Sentinel setup completed!
echo Run start.bat to launch the emergency command center.
echo ===================================================
pause
