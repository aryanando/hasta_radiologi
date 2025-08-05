# Hasta Radiologi Project Startup Script (PowerShell)
# Starts the Node.js API server for Hasta Radiologi

Write-Host ""
Write-Host "Hasta Radiologi Project Startup" -ForegroundColor Cyan
Write-Host "==============================="
Write-Host ""

# Check Node.js
Write-Host "[1/4] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "OK: Node.js found - $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: Node.js not found! Please install Node.js first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check npm
Write-Host "[2/4] Checking npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "OK: npm found - $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "ERROR: npm not found! Please install npm first." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Check dependencies
Write-Host "[3/4] Checking dependencies..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "OK: Dependencies found" -ForegroundColor Green
} else {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    try {
        npm install
        Write-Host "OK: Dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check environment file
Write-Host "[4/4] Checking environment..." -ForegroundColor Yellow
if (Test-Path ".env") {
    Write-Host "OK: .env file exists" -ForegroundColor Green
} else {
    if (Test-Path ".env.example") {
        Write-Host "Creating .env from .env.example..." -ForegroundColor Yellow
        try {
            Copy-Item ".env.example" ".env"
            Write-Host "OK: .env file created" -ForegroundColor Green
        } catch {
            Write-Host "WARNING: Could not create .env file" -ForegroundColor Yellow
        }
    } else {
        Write-Host "WARNING: No .env or .env.example found" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Starting Hasta Radiologi API Server..." -ForegroundColor Cyan
Write-Host ""
Write-Host "Server will start at: http://localhost:3001" -ForegroundColor Green
Write-Host "Environment: development" -ForegroundColor Gray
Write-Host ""
Write-Host "Available endpoints:" -ForegroundColor Yellow
Write-Host "- API Documentation: http://localhost:3001/docs" -ForegroundColor Gray
Write-Host "- Health Check: http://localhost:3001/health" -ForegroundColor Gray
Write-Host "- Worklist API: http://localhost:3001/api/worklist" -ForegroundColor Gray
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the development server
try {
    npm run dev
} catch {
    Write-Host ""
    Write-Host "ERROR: Failed to start the server!" -ForegroundColor Red
    Write-Host "Check the error messages above for details." -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"
