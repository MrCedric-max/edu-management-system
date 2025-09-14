@echo off
echo 🌐 Starting Frontend Server...
echo.

REM Check if Python is available
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo Using Python HTTP server...
    cd frontend
    python -m http.server 3000
) else (
    REM Check if Node.js is available
    where node >nul 2>nul
    if %ERRORLEVEL% EQU 0 (
        echo Using Node.js HTTP server...
        cd frontend
        npx http-server -p 3000 -c-1
    ) else (
        echo ❌ Neither Python nor Node.js found. Please install one of them.
        echo Python: https://python.org/
        echo Node.js: https://nodejs.org/
        pause
        exit /b 1
    )
)
