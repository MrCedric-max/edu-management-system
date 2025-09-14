@echo off
echo 🚀 Starting Educational Management System...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    echo Visit: https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    if %ERRORLEVEL% NEQ 0 (
        echo ❌ Failed to install backend dependencies
        pause
        exit /b 1
    )
)

REM Check if .env file exists
if not exist "backend\.env" (
    echo ⚠️ .env file not found. Creating from template...
    copy "backend\env.example" "backend\.env"
    echo 📝 Please update backend\.env with your database credentials
    echo.
)

REM Start the backend server
echo 🖥️ Starting backend server...
start "Backend Server" cmd /k "cd backend && node server.js"

REM Wait a moment for backend to start
echo ⏳ Waiting for backend to start...
timeout /t 5 /nobreak >nul

REM Test backend health
echo 🔍 Testing backend health...
curl -s http://localhost:3001/health >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo ✅ Backend is running
) else (
    echo ⚠️ Backend may not be ready yet
)

REM Start the frontend server
echo 🌐 Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npx http-server -p 3000 -c-1"

REM Wait a moment for frontend to start
timeout /t 2 /nobreak >nul

echo.
echo ✅ System started successfully!
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend: http://localhost:3001
echo 📊 Health Check: http://localhost:3001/health
echo.
echo Press any key to exit...
pause >nul
