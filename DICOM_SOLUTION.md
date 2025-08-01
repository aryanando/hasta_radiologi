# DICOM Orthanc Error Solution

## Problem Description

The original error message was:
```
HTTP-3 ServerContext.cpp:897] Store has failed because required tags (StudyInstanceUID, SeriesInstanceUID, SOPInstanceUID) are missing for the following instance: PatientID=123456
```

This error occurs when DICOM instances are sent to Orthanc without the mandatory DICOM tags that uniquely identify the study, series, and instance.

## Root Cause

The error indicates that a DICOM file with PatientID=123456 was missing these **required DICOM tags**:
- `StudyInstanceUID` (0020,000D) - Uniquely identifies the study
- `SeriesInstanceUID` (0020,000E) - Uniquely identifies the series within the study  
- `SOPInstanceUID` (0008,0018) - Uniquely identifies the instance (image) within the series

## Solution Implemented

We created a comprehensive DICOM instance service that generates properly formatted DICOM files with all required tags:

### 1. DICOM Instance Service (`src/services/dicomInstanceService.js`)

This service:
- ✅ Generates unique UIDs for all required tags using DCMTK tools
- ✅ Creates valid DICOM Part 10 format files with proper headers
- ✅ Includes all mandatory DICOM tags for proper Orthanc storage
- ✅ Validates generated files to ensure compliance

### 2. API Endpoints (`/api/dicom/instances`)

Available endpoints:
- `POST /api/dicom/instances` - Create a new DICOM instance
- `GET /api/dicom/instances` - List all DICOM instances
- `GET /api/dicom/instances/:filename/validate` - Validate a DICOM instance
- `POST /api/dicom/instances/:filename/send` - Send DICOM instance to Orthanc
- `POST /api/dicom/instances/sample` - Create sample DICOM instance for testing

### 3. Example Usage

Create a DICOM instance with PatientID=123456:

```bash
curl -X POST http://localhost:3000/api/dicom/instances \
  -H "Content-Type: application/json" \
  -d '{
    "patientID": "123456",
    "patientName": "DOE^JOHN^MIDDLE",
    "patientBirthDate": "19900115", 
    "patientSex": "M",
    "studyDescription": "Chest X-Ray Study",
    "seriesDescription": "PA and Lateral Views",
    "modality": "CR",
    "accessionNumber": "ACC001",
    "institutionName": "Hasta Radiologi"
  }'
```

Response:
```json
{
  "success": true,
  "message": "DICOM instance created successfully",
  "data": {
    "filename": "instance_1754059022588.dcm",
    "filepath": "/path/to/instance_1754059022588.dcm",
    "uids": {
      "studyInstanceUID": "1.2.826.0.1.3680043.8.498.1754059022588.1.344798",
      "seriesInstanceUID": "1.2.826.0.1.3680043.8.498.1754059022588.2.344798", 
      "sopInstanceUID": "1.2.826.0.1.3680043.8.498.1754059022588.3.344798"
    }
  }
}
```

### 4. Validation

Validate the generated DICOM file:

```bash
curl http://localhost:3000/api/dicom/instances/instance_1754059022588.dcm/validate
```

Result shows all required tags are present:
- ✅ Has StudyInstanceUID: true
- ✅ Has SeriesInstanceUID: true 
- ✅ Has SOPInstanceUID: true
- ✅ Is Valid: true

## Key Features

### Required DICOM Tags Included
- `(0008,0018)` SOPInstanceUID - Instance identifier
- `(0020,000d)` StudyInstanceUID - Study identifier
- `(0020,000e)` SeriesInstanceUID - Series identifier
- `(0010,0020)` PatientID - Patient identifier
- `(0008,0016)` SOPClassUID - SOP Class for the image type

### Additional Standard Tags
- Patient Information: Name, Birth Date, Sex
- Study Information: Date, Time, Description, Accession Number
- Series Information: Number, Description, Modality
- Institution Information: Name, Station Name
- Image Information: Rows, Columns, Bit depth, etc.

## Dependencies

### Required Tools
- **DCMTK** toolkit (`dump2dcm`, `dcmdump`, `storescu`)
- **Node.js** with Fastify framework
- **Prisma** ORM for database operations

### Installation
```bash
# Install DCMTK on macOS
brew install dcmtk

# Install Node.js dependencies
npm install

# Start the server
npm run dev
```

## Server Status

The API server is running at:
- 🚀 **Server**: http://localhost:3000
- 🏥 **Orthanc Worklists**: http://localhost:3000/api/orthanc/worklists
- 🔬 **DICOM Instances**: http://localhost:3000/api/dicom/instances
- ❤️ **Health Check**: http://localhost:3000/health

## Testing

Run the comprehensive test:
```bash
npm run test:workflow
```

This will:
1. Create a DICOM instance with PatientID=123456
2. Validate all required tags are present
3. Display the DICOM structure
4. Confirm the file is ready for Orthanc

## Next Steps

1. **Send to Orthanc**: Use the `/send` endpoint to transmit DICOM instances to your Orthanc server
2. **Integration**: Integrate this service into your existing workflow
3. **Monitoring**: Monitor Orthanc logs to confirm no more missing tag errors

## Summary

✅ **Problem Solved**: DICOM instances now include all required UIDs  
✅ **Orthanc Compatible**: Files are properly formatted for Orthanc storage  
✅ **API Ready**: RESTful endpoints available for integration  
✅ **Validated**: Built-in validation ensures DICOM compliance  

The original error "Store has failed because required tags are missing" should no longer occur when using this service to generate DICOM instances.
