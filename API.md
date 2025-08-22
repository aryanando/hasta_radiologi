# DICOM Worklist REST API Documentation

## Base URL
```
http://localhost:3000
```

## Authentication
Currently no authentication required. Add API keys or JWT tokens as needed.

## Endpoints

### Health Check
```http
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-08-22T07:00:00.000Z",
  "service": "DICOM Worklist API",
  "version": "1.0.0"
}
```

### API Information
```http
GET /api
```

**Response:**
```json
{
  "name": "DICOM Worklist REST API",
  "version": "1.0.0",
  "description": "REST API for creating DICOM worklists from SIM RS",
  "endpoints": {
    "GET /health": "Health check",
    "GET /api": "API information",
    "POST /api/worklist": "Create single worklist",
    "POST /api/worklist/batch": "Create multiple worklists",
    "GET /api/worklists": "List all worklists",
    "GET /api/worklists/stats": "Get worklist statistics",
    "DELETE /api/worklist/:filename": "Delete a worklist",
    "POST /api/worklists/cleanup": "Cleanup old worklists",
    "GET /api/pacs/worklists": "Query all worklists from PACS",
    "GET /api/pacs/patients": "Query patients from PACS",
    "GET /api/pacs/studies/:patientId": "Query studies for patient",
    "GET /api/pacs/status": "Get PACS service status",
    "POST /api/pacs/test": "Test PACS connectivity"
  }
}
```

### Create Single Worklist
```http
POST /api/worklist
Content-Type: application/json

{
  "patientId": "P123456",
  "patientName": "DOE^JOHN^MIDDLE",
  "patientBirthDate": "1985-05-15",
  "patientSex": "M",
  "accessionNumber": "ACC789012",
  "studyDescription": "Chest X-Ray",
  "scheduledDate": "2025-08-23",
  "scheduledTime": "14:30:00",
  "modality": "CR",
  "scheduledProcedureStepDescription": "Chest X-Ray PA and Lateral",
  "requestedProcedureDescription": "Chest X-Ray - Routine",
  "referringPhysician": "DR^SMITH^ROBERT"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Worklist created successfully",
  "data": {
    "filename": "ACC789012_1692792000000.wl",
    "filepath": "/path/to/worklist/file",
    "size": 1024,
    "accessionNumber": "ACC789012",
    "patientId": "P123456",
    "createdAt": "2025-08-22T07:00:00.000Z"
  }
}
```

### Create Batch Worklists
```http
POST /api/worklist/batch
Content-Type: application/json

{
  "worklists": [
    {
      "patientId": "P123456",
      "patientName": "DOE^JOHN",
      "accessionNumber": "ACC001",
      "scheduledDate": "2025-08-23",
      "scheduledTime": "09:00:00",
      ...
    },
    {
      "patientId": "P789012",
      "patientName": "SMITH^JANE",
      "accessionNumber": "ACC002",
      "scheduledDate": "2025-08-23",
      "scheduledTime": "10:30:00",
      ...
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Batch processing completed. 2 succeeded, 0 failed.",
  "data": {
    "total": 2,
    "succeeded": 2,
    "failed": 0,
    "results": [...],
    "createdAt": "2025-08-22T07:00:00.000Z"
  }
}
```

### List All Worklists
```http
GET /api/worklists
```

**Response:**
```json
{
  "success": true,
  "data": {
    "count": 5,
    "files": [
      {
        "filename": "ACC001_1692792000000.wl",
        "size": 1024,
        "created": "2025-08-22T07:00:00.000Z",
        "modified": "2025-08-22T07:00:00.000Z"
      },
      ...
    ]
  }
}
```

## PACS Integration Endpoints

### Query All Worklists from PACS
```http
GET /api/pacs/worklists
```

**Description:** Query and retrieve all available worklists from the PACS server using DCMTK FindSCU.

**Response:**
```json
{
  "success": true,
  "message": "Worklists retrieved from PACS successfully",
  "data": {
    "count": 6,
    "worklists": [
      {
        "patientName": "SMITH^JANE^MARIE",
        "patientId": "P236",
        "accessionNumber": "ACC168",
        "modality": "CT",
        "scheduledStationAETitle": "ORTHANC",
        "scheduledDate": "2025-08-06",
        "scheduledTime": "09:00:00",
        "retrievedAt": "2025-08-22T07:24:30.082Z"
      },
      {
        "patientName": "JOHNSON^MIKE^DAVID",
        "patientId": "P29",
        "accessionNumber": "ACC18",
        "modality": "MR",
        "scheduledStationAETitle": "ORTHANC",
        "scheduledDate": "2025-08-06",
        "scheduledTime": "11:30:00",
        "retrievedAt": "2025-08-22T07:24:30.082Z"
      }
    ],
    "pacsHost": "host.docker.internal",
    "pacsPort": "4242",
    "queriedAt": "2025-08-22T07:24:30.082Z"
  }
}
```

### Query Patients from PACS
```http
GET /api/pacs/patients
```

**Query Parameters:**
- `patientName` (optional): Patient name pattern (default: "*" for all patients)

**Description:** Query patient information from the PACS server.

**Response:**
```json
{
  "success": true,
  "message": "Patients retrieved from PACS successfully",
  "data": {
    "count": 3,
    "patients": [
      {
        "patientName": "DOE^JOHN^MIDDLE",
        "patientId": "P669",
        "patientBirthDate": "1985-05-15",
        "patientSex": "M"
      }
    ],
    "queriedAt": "2025-08-22T07:24:30.082Z"
  }
}
```

### Query Studies for Patient
```http
GET /api/pacs/studies/{patientId}
```

**Path Parameters:**
- `patientId`: The patient ID to query studies for

**Description:** Query all studies for a specific patient from the PACS server.

**Response:**
```json
{
  "success": true,
  "message": "Studies retrieved from PACS successfully",
  "data": {
    "count": 2,
    "studies": [
      {
        "studyInstanceUID": "1.2.840.113619.2.55.3.12345",
        "studyDescription": "Chest X-Ray",
        "studyDate": "2025-08-22",
        "studyTime": "14:30:00",
        "accessionNumber": "ACC123"
      }
    ],
    "patientId": "P669",
    "queriedAt": "2025-08-22T07:24:30.082Z"
  }
}
```

### Get PACS Service Status
```http
GET /api/pacs/status
```

**Description:** Get the current status and configuration of the PACS service.

**Response:**
```json
{
  "success": true,
  "data": {
    "service": "PACS Service",
    "version": "1.0.0",
    "container": "dcmtk-findscu-client",
    "configuration": {
      "pacsHost": "host.docker.internal",
      "pacsPort": "4242",
      "localAET": "FINDSCU",
      "remoteAET": "ORTHANC"
    },
    "connectivity": {
      "success": true,
      "message": "PACS connection successful",
      "data": {
        "pacsHost": "host.docker.internal",
        "pacsPort": "4242",
        "localAET": "FINDSCU",
        "remoteAET": "ORTHANC",
        "testedAt": "2025-08-22T07:24:30.082Z"
      }
    },
    "lastChecked": "2025-08-22T07:24:30.082Z"
  }
}
```

### Test PACS Connectivity
```http
POST /api/pacs/test
```

**Description:** Test the connection to the PACS server using DCMTK FindSCU.

**Response:**
```json
{
  "success": true,
  "message": "PACS connection test successful",
  "data": {
    "pacsHost": "host.docker.internal",
    "pacsPort": "4242",
    "localAET": "FINDSCU",
    "remoteAET": "ORTHANC",
    "testedAt": "2025-08-22T07:24:30.082Z"
  }
}
```

### Get Worklist Statistics
```http
GET /api/worklists/stats
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalFiles": 10,
    "totalSize": 10240,
    "averageSize": 1024
  }
}
```

### Delete Worklist
```http
DELETE /api/worklist/ACC001_1692792000000.wl
```

**Response:**
```json
{
  "success": true,
  "message": "Worklist deleted successfully",
  "data": {
    "filename": "ACC001_1692792000000.wl"
  }
}
```

### Cleanup Old Worklists
```http
POST /api/worklists/cleanup
Content-Type: application/json

{
  "days": 30
}
```

**Response:**
```json
{
  "success": true,
  "message": "Cleanup completed. 3 files deleted.",
  "data": {
    "deletedCount": 3,
    "deletedFiles": ["old1.wl", "old2.wl", "old3.wl"]
  }
}
```

## PACS Integration Requirements

### Prerequisites
- DCMTK FindSCU Docker container must be running
- PACS server (Orthanc) must be accessible
- Network connectivity between API server and DCMTK container

### Configuration
The PACS integration is configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `PACS_HOST` | host.docker.internal | PACS server hostname |
| `PACS_PORT` | 4242 | PACS server port |
| `LOCAL_AET` | FINDSCU | Local Application Entity Title |
| `REMOTE_AET` | ORTHANC | Remote Application Entity Title |

### PACS Error Responses

#### Connection Failed (500)
```json
{
  "success": false,
  "error": "PACS connection failed: Association Request Failed",
  "details": {
    "pacsHost": "host.docker.internal",
    "pacsPort": "4242",
    "container": "dcmtk-findscu-client"
  }
}
```

#### Container Not Found (500)
```json
{
  "success": false,
  "error": "Command failed: docker exec dcmtk-findscu-client ...",
  "details": {
    "pacsHost": "host.docker.internal",
    "pacsPort": "4242",
    "container": "dcmtk-findscu-client"
  }
}
```

## Required Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `patientId` | string | ✅ | Unique patient identifier |
| `patientName` | string | ✅ | Patient name (DICOM format: Last^First^Middle) |
| `accessionNumber` | string | ✅ | Unique study identifier |
| `scheduledDate` | string | ✅ | Scheduled date (YYYY-MM-DD) |
| `scheduledTime` | string | ✅ | Scheduled time (HH:MM:SS) |

## Optional Fields

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `patientBirthDate` | string | - | Patient birth date (YYYY-MM-DD) |
| `patientSex` | string | 'U' | Patient sex (M/F/U) |
| `studyDescription` | string | - | Description of the study |
| `modality` | string | 'CR' | Imaging modality (CR, CT, MR, US, etc.) |
| `scheduledProcedureStepDescription` | string | - | Procedure description |
| `requestedProcedureDescription` | string | - | Requested procedure |
| `referringPhysician` | string | - | Referring physician name |
| `performingPhysician` | string | - | Performing physician name |
| `institutionName` | string | 'Hasta Radiologi' | Institution name |
| `departmentName` | string | 'Radiology' | Department name |

## Usage Examples

### SIM RS Integration Flow
1. **Create Worklist**: When a radiology exam is scheduled in SIM RS
```javascript
// Create worklist for new patient exam
const worklistData = {
  patientId: "P123456",
  patientName: "DOE^JOHN^MIDDLE",
  accessionNumber: "ACC789012",
  scheduledDate: "2025-08-23",
  scheduledTime: "14:30:00",
  modality: "CR",
  studyDescription: "Chest X-Ray"
};

const response = await fetch('/api/worklist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(worklistData)
});
```

2. **Query Available Worklists**: Check what exams are scheduled
```javascript
// Query all scheduled exams from PACS
const worklists = await fetch('/api/pacs/worklists');
const data = await worklists.json();

console.log(`Found ${data.data.count} scheduled exams`);
data.data.worklists.forEach(exam => {
  console.log(`${exam.patientName} - ${exam.modality} at ${exam.scheduledTime}`);
});
```

3. **Search for Specific Patient**: Find patient's scheduled exams
```javascript
// Search for specific patient
const patientSearch = await fetch('/api/pacs/patients?patientName=DOE^JOHN');
const patients = await patientSearch.json();

// Get studies for patient
const studies = await fetch(`/api/pacs/studies/${patients.data.patients[0].patientId}`);
```

### Batch Worklist Creation
```javascript
// Create multiple worklists for daily schedule
const dailySchedule = {
  worklists: [
    {
      patientId: "P001",
      patientName: "SMITH^JANE",
      accessionNumber: "ACC001",
      scheduledDate: "2025-08-23",
      scheduledTime: "09:00:00",
      modality: "CT"
    },
    {
      patientId: "P002", 
      patientName: "JOHNSON^MIKE",
      accessionNumber: "ACC002",
      scheduledDate: "2025-08-23",
      scheduledTime: "10:30:00",
      modality: "MR"
    }
  ]
};

const response = await fetch('/api/worklist/batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(dailySchedule)
});
```

## Error Responses

### Validation Error (400)
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    "patientId is required",
    "scheduledDate must be in YYYY-MM-DD format"
  ]
}
```

### Server Error (500)
```json
{
  "success": false,
  "error": "Internal server error"
}
```

### Not Found (404)
```json
{
  "success": false,
  "error": "Endpoint not found",
  "message": "GET /invalid/endpoint is not a valid endpoint"
}
```
