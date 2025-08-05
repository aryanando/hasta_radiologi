#!/bin/bash

# Hasta Radiologi API Test Script
# Quick verification that the API is working correctly

echo "🏥 Hasta Radiologi API - Quick Test Script"
echo "=========================================="

API_URL="http://localhost:3001"

echo ""
echo "1. Testing API Health..."
curl -s -w "Status: %{http_code}\n" "$API_URL/" | jq '.' 2>/dev/null || echo "Response received"

echo ""
echo "2. Testing Health Endpoint..."
curl -s -w "Status: %{http_code}\n" "$API_URL/health" | jq '.' 2>/dev/null || echo "Response received"

echo ""
echo "3. Creating Sample Worklist..."
curl -s -X POST "$API_URL/api/orthanc/worklists/sample" \
  -H "Content-Type: application/json" \
  -d '{}' \
  -w "Status: %{http_code}\n" | jq '.' 2>/dev/null || echo "Response received"

echo ""
echo "4. Listing All Worklists..."
curl -s -w "Status: %{http_code}\n" "$API_URL/api/orthanc/worklists" | jq '.' 2>/dev/null || echo "Response received"

echo ""
echo "5. Getting Worklist Statistics..."
curl -s -w "Status: %{http_code}\n" "$API_URL/api/orthanc/worklists/stats" | jq '.' 2>/dev/null || echo "Response received"

echo ""
echo "6. Creating Test DICOM Instance..."
curl -s -X POST "$API_URL/api/dicom/instances" \
  -H "Content-Type: application/json" \
  -d '{
    "patientID": "TEST_P123456",
    "patientName": "TEST^PATIENT^POSTMAN",
    "patientBirthDate": "19900101",
    "patientSex": "M",
    "studyDescription": "Test Study",
    "modality": "CR",
    "accessionNumber": "TEST_ACC123456"
  }' \
  -w "Status: %{http_code}\n" | jq '.' 2>/dev/null || echo "Response received"

echo ""
echo "7. Getting Instance Statistics..."
curl -s -w "Status: %{http_code}\n" "$API_URL/api/dicom/instances/stats" | jq '.' 2>/dev/null || echo "Response received"

echo ""
echo "✅ API Test Complete!"
echo ""
echo "💡 Tips:"
echo "   - Import the Postman collection for detailed testing"
echo "   - Check server logs if any requests fail"
echo "   - Verify the API server is running on port 3000"
echo ""
