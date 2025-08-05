# Hasta Radiologi API - Postman Collection

This directory contains the complete Postman collection and environment files for testing the Hasta Radiologi API.

## 📁 Files Included

- `Hasta_Radiologi_API.postman_collection.json` - Main API collection
- `Hasta_Radiologi_Environment.postman_environment.json` - Environment variables
- `README.md` - This documentation

## 🚀 Quick Start

### 1. Import Collection
1. Open Postman
2. Click **Import** button
3. Select `Hasta_Radiologi_API.postman_collection.json`
4. Import `Hasta_Radiologi_Environment.postman_environment.json`

### 2. Set Environment
1. Click on the environment dropdown (top right)
2. Select **"Hasta Radiologi Environment"**

### 3. Start API Server
```bash
cd f:\PROJECT\hasta-pacs\hasta_radiologi
npm start
# or
npm run dev
```

## 📋 API Endpoints Overview

### Health & Info
- `GET /` - API health check and basic information
- `GET /health` - Dedicated health endpoint

### Orthanc Worklists (`/api/orthanc/worklists`)
- `POST /` - Create single worklist
- `POST /batch` - Create multiple worklists
- `GET /` - Get all worklists
- `POST /sample` - Create sample worklist
- `GET /stats` - Get worklist statistics
- `DELETE /:filename` - Delete specific worklist
- `POST /cleanup` - Cleanup old worklists

### DICOM Instances (`/api/dicom/instances`)
- `POST /` - Create DICOM instance
- `POST /batch` - Create multiple instances
- `GET /` - Get all instances
- `GET /stats` - Get instance statistics
- `DELETE /:filename` - Delete specific instance

## 🧪 Testing Features

### Dynamic Variables
The collection automatically generates:
- Random patient IDs: `P{{$randomInt}}`
- Random accession numbers: `ACC{{$randomInt}}`
- Timestamps for unique identifiers

### Automated Tests
Each request includes basic validation:
- ✅ Status code validation (200, 201, 202)
- ✅ Response structure validation
- ✅ Performance testing (< 5 seconds)
- ✅ Success property validation

### Pre-request Scripts
- Sets dynamic timestamps
- Generates unique test data
- Logs request information

## 📊 Sample Data Examples

### Create Worklist Example
```json
{
  "patientId": "P123456789",
  "patientName": "DOE^JOHN^MIDDLE",
  "patientBirthDate": "1985-05-15",
  "patientSex": "M",
  "accessionNumber": "ACC123456789",
  "studyDescription": "Chest X-Ray",
  "scheduledDate": "2025-08-05",
  "scheduledTime": "14:30:00",
  "modality": "CR",
  "scheduledStationAETitle": "ORTHANC",
  "scheduledProcedureStepDescription": "Chest X-Ray PA and Lateral",
  "requestedProcedureDescription": "Chest X-Ray - Routine",
  "referringPhysician": "DR^SMITH^ROBERT",
  "performingPhysician": "DR^JOHNSON^MARY",
  "institutionName": "Hasta Radiologi",
  "departmentName": "Radiology"
}
```

### Create DICOM Instance Example
```json
{
  "patientID": "P123456789",
  "patientName": "WILSON^SARAH^ANNE",
  "patientBirthDate": "19880412",
  "patientSex": "F",
  "studyDescription": "CT Chest with Contrast",
  "seriesDescription": "Axial CT Chest",
  "modality": "CT",
  "accessionNumber": "ACC123456789",
  "institutionName": "Hasta Radiologi",
  "referringPhysicianName": "DR^BROWN^MICHAEL",
  "performingPhysicianName": "DR^WHITE^LISA"
}
```

## 🔧 Environment Variables

| Variable | Default Value | Description |
|----------|---------------|-------------|
| `baseUrl` | `http://localhost:3001` | API base URL |
| `orthancUrl` | `http://localhost:8042` | Orthanc PACS URL |
| `dicomPort` | `4242` | Orthanc DICOM port |
| `institutionName` | `Hasta Radiologi` | Default institution |
| `departmentName` | `Radiology` | Default department |
| `scheduledStationAETitle` | `ORTHANC` | Default AE title |

## 🏥 Integration with Orthanc

The API generates `.wl` files compatible with Orthanc's worklist plugin:

1. **Worklist Creation**: API creates `.wl` files in DICOM format
2. **Orthanc Integration**: Files are automatically recognized by Orthanc
3. **DICOM Queries**: Orthanc responds to C-FIND worklist queries
4. **Real-time Updates**: New worklists are immediately available

## 📝 Testing Workflow

### Basic Testing Sequence
1. **Health Check**: Verify API is running
2. **Create Sample Worklist**: Test worklist generation
3. **List Worklists**: Verify file creation
4. **Create DICOM Instance**: Test instance generation
5. **Get Statistics**: Review system status

### Advanced Testing
1. **Batch Operations**: Test multiple worklist/instance creation
2. **Error Handling**: Test with invalid data
3. **Cleanup Operations**: Test file management
4. **Performance**: Test with large datasets

## 🚨 Troubleshooting

### Common Issues

**API Not Responding**
- Check if server is running: `npm start`
- Verify port 3000 is available
- Check server logs for errors

**Worklist Not Created**
- Verify required fields: `patientId`, `patientName`, `accessionNumber`
- Check file permissions in worklists directory
- Ensure DCMTK container is running (if using DCMTK conversion)

**DICOM Instance Issues**
- Verify `patientID` field is provided
- Check DICOM file format and validation
- Ensure instances directory exists and is writable

### Debug Steps
1. Check server logs in terminal
2. Verify environment variables are set correctly
3. Test individual endpoints before batch operations
4. Use Postman Console for detailed request/response logs

## 📚 Additional Resources

- [Hasta Radiologi API Documentation](../README.md)
- [DICOM Standard](https://www.dicomstandard.org/)
- [Orthanc Documentation](https://book.orthanc-server.com/)
- [Postman Documentation](https://learning.postman.com/)

## 🤝 Support

For issues or questions:
1. Check the API server logs
2. Review this documentation
3. Test with minimal sample data
4. Verify Orthanc integration

---

**Happy Testing! 🎉**

> This collection provides comprehensive testing capabilities for the Hasta Radiologi DICOM management system.
