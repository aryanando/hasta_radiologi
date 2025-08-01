# Orthanc Worklist Generator Documentation

## Overview

The Orthanc Worklist Generator is a comprehensive solution for creating DICOM worklist files compatible with Orthanc PACS server. It provides both API endpoints and a CLI tool for generating, managing, and organizing worklist files.

## Features

- ✅ Generate DICOM worklist files in Orthanc-compatible format
- ✅ RESTful API for programmatic access
- ✅ Interactive CLI tool for manual worklist creation
- ✅ Batch worklist generation
- ✅ Worklist file management (list, delete, cleanup)
- ✅ Sample data generation for testing
- ✅ File download capabilities
- ✅ Statistics and monitoring

## Architecture

```
src/
├── generators/
│   └── orthancWorklistGenerator.js    # Core worklist generation logic
├── services/
│   └── orthancWorklistService.js      # Business logic layer
├── controllers/
│   └── orthancWorklistController.js   # HTTP request handlers
└── app.js                            # Main application

bin/
└── worklist-cli.js                   # Command-line interface

worklists/                            # Generated worklist files directory
```

## API Endpoints

### Create Single Worklist
```http
POST /api/worklist
Content-Type: application/json

{
  "patientId": "P123456",
  "patientName": "DOE^JOHN^MIDDLE",
  "patientBirthDate": "1985-05-15",
  "patientSex": "M",
  "accessionNumber": "ACC123456",
  "studyDescription": "Chest X-Ray",
  "scheduledDate": "2025-08-02",
  "scheduledTime": "14:30",
  "modality": "CR",
  "scheduledProcedureStepDescription": "Chest X-Ray PA and Lateral",
  "requestedProcedureDescription": "Chest X-Ray - Routine",
  "referringPhysician": "DR^SMITH^ROBERT",
  "performingPhysician": "DR^JOHNSON^MARY"
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
      // ... other fields
    },
    {
      "patientId": "P123457",
      "patientName": "SMITH^JANE",
      // ... other fields
    }
  ]
}
```

### Get All Worklists
```http
GET /api/worklist
```

### Get Worklist Statistics
```http
GET /api/worklist/stats
```

### Download Worklist File
```http
GET /api/worklist/download/{filename}
```

### Delete Worklist
```http
DELETE /api/worklist/{filename}
```

### Cleanup Old Worklists
```http
DELETE /api/worklist/cleanup/{days}
```

### Generate Sample Data
```http
GET /api/worklist/sample
```

## CLI Usage

Start the interactive CLI:
```bash
node bin/worklist-cli.js
```

The CLI provides the following options:
1. Create single worklist (interactive)
2. Create batch worklists
3. List existing worklists
4. Generate sample data
5. Exit

## DICOM Worklist Format

The generated worklist files use DICOM tag format:

```
# Patient Information
(0010,0020) P123456                                    # Patient ID
(0010,0010) DOE^JOHN^MIDDLE                           # Patient Name
(0010,0030) 19850515                                  # Patient Birth Date
(0010,0040) M                                         # Patient Sex

# Study Information
(0020,000D) 1.2.826.0.1.3680043.8.498.1722524400000.1234  # Study Instance UID
(0008,0050) ACC123456                                 # Accession Number
(0008,1030) Chest X-Ray                              # Study Description

# Scheduled Procedure Step Information
(0040,0100)[0].(0008,0060) CR                         # Modality
(0040,0100)[0].(0040,0001) ORTHANC                    # Scheduled Station AE Title
(0040,0100)[0].(0040,0002) 20250802                   # Scheduled Procedure Step Start Date
(0040,0100)[0].(0040,0003) 143000                     # Scheduled Procedure Step Start Time
(0040,0100)[0].(0040,0007) Chest X-Ray PA and Lateral # Scheduled Procedure Step Description
```

## Data Validation

Required fields for worklist creation:
- `patientId`: Unique patient identifier
- `patientName`: Patient name in DICOM format (LastName^FirstName^MiddleName)
- `patientBirthDate`: Date in YYYY-MM-DD format
- `patientSex`: M (Male), F (Female), or U (Unknown)
- `accessionNumber`: Unique accession number
- `scheduledDate`: Scheduled date in YYYY-MM-DD format
- `scheduledTime`: Scheduled time in HH:MM or HH:MM:SS format

Optional fields:
- `studyDescription`: Description of the study
- `modality`: Imaging modality (default: CR)
- `scheduledStationAETitle`: AE Title (default: ORTHANC)
- `scheduledProcedureStepDescription`: Detailed procedure description
- `requestedProcedureDescription`: Requested procedure description
- `referringPhysician`: Referring physician name
- `performingPhysician`: Performing physician name
- `institutionName`: Institution name (default: Hasta Radiologi)
- `departmentName`: Department name (default: Radiology)

## File Management

### Directory Structure
Worklist files are stored in the `worklists/` directory with the naming pattern:
```
wl_{patientId}_{accessionNumber}_{timestamp}.wl
```

### Cleanup Features
- Automatic cleanup of old files
- Configurable retention period
- Batch deletion capabilities

## Error Handling

The system provides comprehensive error handling:
- Input validation errors
- File system errors
- DICOM format validation
- Missing required fields
- Invalid date/time formats

## Integration with Orthanc

To use these worklist files with Orthanc:

1. Configure Orthanc to use the worklist directory:
```json
{
  "Worklists": {
    "Enable": true,
    "Database": "/path/to/worklists"
  }
}
```

2. Restart Orthanc server

3. Worklist files will be automatically detected and served to modalities

## Sample Usage

### Creating a Worklist via API
```javascript
const worklistData = {
  patientId: "P001",
  patientName: "HASTA^PATIENT^TEST",
  patientBirthDate: "1990-01-01",
  patientSex: "M",
  accessionNumber: "ACC001",
  studyDescription: "Chest X-Ray",
  scheduledDate: "2025-08-02",
  scheduledTime: "09:00",
  modality: "CR"
};

const response = await fetch('/api/worklist', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(worklistData)
});

const result = await response.json();
console.log(result);
```

### Using the Service Directly
```javascript
const OrthancWorklistService = require('./src/services/orthancWorklistService');

const service = new OrthancWorklistService();
const result = await service.createWorklist(worklistData);

if (result.success) {
  console.log('Worklist created:', result.data.filename);
} else {
  console.error('Error:', result.message);
}
```

## Security Considerations

- Validate all input data
- Sanitize file names to prevent directory traversal
- Implement access controls for file management
- Log worklist creation activities
- Consider encryption for sensitive patient data

## Monitoring and Maintenance

- Monitor worklist directory size
- Set up automated cleanup schedules
- Track worklist creation statistics
- Monitor API usage and performance
- Regular backup of worklist files

## Troubleshooting

### Common Issues

1. **Invalid date format**: Ensure dates are in YYYY-MM-DD format
2. **Missing required fields**: Check all required fields are provided
3. **File permission errors**: Ensure write permissions on worklists directory
4. **Invalid patient name format**: Use DICOM format (LastName^FirstName)

### Debugging

Enable debug logging:
```javascript
const fastify = require('fastify')({ 
  logger: { 
    level: 'debug',
    prettyPrint: true 
  } 
});
```

Check worklist file contents:
```bash
cat worklists/wl_P001_ACC001_1722524400000.wl
```

## Future Enhancements

- [ ] DICOM binary format support
- [ ] Integration with HIS/RIS systems
- [ ] Real-time worklist synchronization
- [ ] Advanced search and filtering
- [ ] Worklist templates
- [ ] Multi-language support
- [ ] Audit trail functionality
