# Quick API Test for Hasta Radiologi
# Simple validation that the API is working

Write-Host "🏥 Hasta Radiologi API - Quick Validation" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green

$baseUrl = "http://localhost:3001"

Write-Host "`n1. Testing API Root..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/" -Method GET
    Write-Host "✅ API is running!" -ForegroundColor Green
    Write-Host "   Version: $($response.version)" -ForegroundColor White
    Write-Host "   Message: $($response.message)" -ForegroundColor White
} catch {
    Write-Host "❌ API not accessible: $_" -ForegroundColor Red
    exit 1
}

Write-Host "`n2. Testing Health Check..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/health" -Method GET
    if ($response.status -eq "healthy") {
        Write-Host "✅ Health check passed!" -ForegroundColor Green
        Write-Host "   Database: $($response.database)" -ForegroundColor White
    } else {
        Write-Host "⚠️  Health check shows issues:" -ForegroundColor Yellow
        Write-Host "   Status: $($response.status)" -ForegroundColor White
        Write-Host "   Database: $($response.database)" -ForegroundColor White
    }
} catch {
    Write-Host "❌ Health check failed: $_" -ForegroundColor Red
}

Write-Host "`n3. Testing Worklists Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orthanc/worklists" -Method GET
    Write-Host "✅ Worklists endpoint working!" -ForegroundColor Green
    Write-Host "   Found $($response.data.count) worklist files" -ForegroundColor White
} catch {
    Write-Host "❌ Worklists endpoint failed: $_" -ForegroundColor Red
}

Write-Host "`n4. Testing DICOM Instances Endpoint..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/dicom/instances" -Method GET
    Write-Host "✅ DICOM instances endpoint working!" -ForegroundColor Green
    Write-Host "   Found $($response.data.count) DICOM files" -ForegroundColor White
} catch {
    Write-Host "❌ DICOM instances endpoint failed: $_" -ForegroundColor Red
}

Write-Host "`n5. Testing Worklist Statistics..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orthanc/worklists/stats" -Method GET
    Write-Host "✅ Statistics endpoint working!" -ForegroundColor Green
} catch {
    Write-Host "❌ Statistics endpoint failed: $_" -ForegroundColor Red
}

Write-Host "`n6. Testing Worklist Creation..." -ForegroundColor Yellow
try {
    $worklistData = @{
        patientId = "QUICKTEST001"
        patientName = "QuickTest^Patient"
        patientBirthDate = "1990-01-01"
        patientSex = "M"
        accessionNumber = "QT001"
        studyDescription = "Quick Test Study"
        scheduledDate = "2025-01-15"
        scheduledTime = "10:00"
        modality = "CR"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$baseUrl/api/orthanc/worklists" -Method POST -Body $worklistData -ContentType "application/json"
    Write-Host "✅ Worklist creation working!" -ForegroundColor Green
    Write-Host "   Created worklist successfully" -ForegroundColor White
} catch {
    Write-Host "❌ Worklist creation failed: $_" -ForegroundColor Red
}

Write-Host "`n✅ Quick API validation complete!" -ForegroundColor Green
Write-Host "💡 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Import the Postman collection for detailed testing" -ForegroundColor White
Write-Host "   2. Use 'npm run worklist' for interactive CLI testing" -ForegroundColor White
Write-Host "   3. Check the README.md for full documentation" -ForegroundColor White
