@echo off
echo 🚀 Starting Creasearch Market...

REM Check if .env files exist
if not exist "backend\.env" (
    echo ❌ Error: backend\.env not found. Please create it first.
    pause
    exit /b 1
)

if not exist "frontend\.env" (
    echo ❌ Error: frontend\.env not found. Please create it first.
    pause
    exit /b 1
)

REM Install dependencies if node_modules don't exist
if not exist "backend\node_modules" (
    echo 📦 Installing backend dependencies...
    cd backend
    call npm install
    cd ..
)

if not exist "frontend\node_modules" (
    echo 📦 Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
)

REM Start backend
echo 🔧 Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

REM Wait a bit for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend
echo 🎨 Starting frontend server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

echo ✅ Servers started!
echo 📡 Backend: http://localhost:5000
echo 🌐 Frontend: http://localhost:5173
echo.
echo Close the terminal windows to stop the servers.
pause
