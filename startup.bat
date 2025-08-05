@echo off
setlocal enabledelayedexpansion

REM Hasta Radiologi Project Startup Script
REM Starts the Node.js API server for Hasta Radiologi

echo.
echo Hasta Radiologi Project Startup
echo ===============================

REM Check basic requirements
echo [1/4] Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found! Please install Node.js first.
    pause
    exit /b 1
)
echo OK: Node.js available

REM Check npm
echo [2/4] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not found! Please install npm first.
    pause
    exit /b 1
)
echo OK: npm available

REM Check dependencies
echo [3/4] Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)
echo OK: Dependencies ready

REM Check environment file
echo [4/4] Checking environment...
if not exist ".env" (
    echo Creating .env from .env.example...
    copy ".env.example" ".env" >nul
    if errorlevel 1 (
        echo WARNING: Could not create .env file
    ) else (
        echo OK: .env file created
    )
) else (
    echo OK: .env file exists
)

echo.
echo Starting Hasta Radiologi API Server...
echo.
echo Server will start at: http://localhost:3001
echo Environment: development
echo.
echo Available endpoints:
echo - API Documentation: http://localhost:3001/docs
echo - Health Check: http://localhost:3001/health
echo - Worklist API: http://localhost:3001/api/worklist
echo.
echo Press Ctrl+C to stop the server
echo.

REM Start the development server
npm run dev

echo.
echo Server stopped.
pause
