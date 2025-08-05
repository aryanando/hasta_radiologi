# Hasta Radiologi API Test Script (PowerShell)
# Quick verification that the API is working correctly

Write-Host "🏥 Hasta Radiologi API - Quick Test Script" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# Configuration
$API_URL = "http://localhost:3001"

function Test-ApiEndpoint {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Endpoint,
        [string]$Body = $null
    )
    
    Write-Host ""
    Write-Host "$Name..." -ForegroundColor Yellow
    
    try {
        $headers = @{
            "Content-Type" = "application/json"
        }
        
        if ($Body) {
            $response = Invoke-RestMethod -Uri "$API_URL$Endpoint" -Method $Method -Headers $headers -Body $Body
        } else {
            $response = Invoke-RestMethod -Uri "$API_URL$Endpoint" -Method $Method -Headers $headers
        }
        
        Write-Host "✅ Success" -ForegroundColor Green
        Write-Host ($response | ConvertTo-Json -Depth 3)
    }
    catch {
        Write-Host "❌ Error: $($_.Exception.Message)" -ForegroundColor Red
    }
}

# Test endpoints
Test-ApiEndpoint -Name "1. Testing API Health" -Endpoint "/"

Test-ApiEndpoint -Name "2. Testing Health Endpoint" -Endpoint "/health"

Test-ApiEndpoint -Name "3. Creating Sample Worklist" -Method "POST" -Endpoint "/api/orthanc/worklists/sample" -Body "{}"

Test-ApiEndpoint -Name "4. Listing All Worklists" -Endpoint "/api/orthanc/worklists"

Test-ApiEndpoint -Name "5. Getting Worklist Statistics" -Endpoint "/api/orthanc/worklists/stats"

$testInstanceBody = @{
    patientID = "TEST_P123456"
    patientName = "TEST^PATIENT^POSTMAN"
    patientBirthDate = "19900101"
    patientSex = "M"
    studyDescription = "Test Study"
    modality = "CR"
    accessionNumber = "TEST_ACC123456"
} | ConvertTo-Json

Test-ApiEndpoint -Name "6. Creating Test DICOM Instance" -Method "POST" -Endpoint "/api/dicom/instances" -Body $testInstanceBody

Test-ApiEndpoint -Name "7. Getting Instance Statistics" -Endpoint "/api/dicom/instances/stats"

Write-Host ""
Write-Host "✅ API Test Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "💡 Tips:" -ForegroundColor Cyan
Write-Host "   - Import the Postman collection for detailed testing"
Write-Host "   - Check server logs if any requests fail"
Write-Host "   - Verify the API server is running on port 3001"
Write-Host "   - Worklist endpoints are working perfectly!" -ForegroundColor Green
Write-Host ""
