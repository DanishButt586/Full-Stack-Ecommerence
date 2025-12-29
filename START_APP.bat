@echo off
echo ========================================
echo   STARTING E-COMMERCE APP LOCALLY
echo ========================================
echo.

echo [1/3] Checking Backend...
cd Backend
if not exist node_modules (
    echo Installing backend dependencies...
    call npm install
)

echo.
echo [2/3] Starting Backend Server...
start cmd /k "cd /d %cd% && npm run dev"

timeout /t 5 /nobreak >nul

echo.
echo [3/3] Starting Frontend...
cd ..\frontend
if not exist node_modules (
    echo Installing frontend dependencies...
    call npm install
)

start cmd /k "cd /d %cd% && npm start"

echo.
echo ========================================
echo   APP STARTING...
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo ========================================
echo.
echo Press any key to close this window...
pause >nul
