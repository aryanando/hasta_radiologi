# DICOM Worklist Generator

A simple and focused tool for generating DICOM worklists compatible with Orthanc PACS servers.

## Overview

This tool creates DICOM worklist files (.wl) that can be used with Orthanc's Modality Worklist (MWL) plugin. It provides both interactive CLI and programmatic interfaces for worklist creation.

## Features

- ✅ Interactive CLI for worklist creation
- ✅ **REST API for SIM RS integration**
- ✅ Batch worklist generation
- ✅ DICOM-compliant worklist format
- ✅ Orthanc MWL integration ready
- ✅ Sample data generation
- ✅ Worklist management (list, stats)
- ✅ **Real-time API for hospital systems**

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
**Option A: Interactive Setup (Recommended)**
```bash
npm run config
```

**Option B: Manual Setup**
Copy the example environment file and modify as needed:
```bash
copy .env.example .env
```

Edit the `.env` file to configure:
- Worklist storage directory
- Default institution settings
- File naming preferences
- Cleanup policies

### 3. Interactive CLI
```bash
npm start
# or
npm run worklist
```

### 3. Create Single Worklist
```bash
npm run create
```

### 4. Start REST API Server
```bash
npm run api
# or for development with auto-restart
npm run dev
```

### 5. Test SIM RS Integration
```bash
npm run simrs
```

## REST API for SIM RS Integration

The system provides a REST API that allows your Hospital Information System (SIM RS) to automatically create DICOM worklists when radiology requests are made.

### Quick API Start
```bash
# Start the API server
npm run api

# API will be available at: http://localhost:3000
# Documentation: http://localhost:3000/api
# Health check: http://localhost:3000/health
```

### Create Worklist via API
```bash
curl -X POST http://localhost:3000/api/worklist \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P123456",
    "patientName": "DOE^JOHN^MIDDLE",
    "accessionNumber": "ACC789012",
    "scheduledDate": "2025-08-23",
    "scheduledTime": "14:30:00",
    "studyDescription": "Chest X-Ray"
  }'
```

### SIM RS Integration Example
When a radiology request is made in your SIM RS:

```javascript
// In your SIM RS application
const worklistAPI = 'http://localhost:3000/api/worklist';

const radiologyData = {
  patientId: patient.mrn,
  patientName: `${patient.lastName}^${patient.firstName}`,
  accessionNumber: generateAccessionNumber(),
  scheduledDate: appointment.date,
  scheduledTime: appointment.time,
  studyDescription: examination.type,
  modality: examination.modality,
  referringPhysician: `DR^${doctor.lastName}^${doctor.firstName}`
};

fetch(worklistAPI, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(radiologyData)
});
```

📋 **See [API.md](API.md) for complete API documentation**

## CLI Interface

The interactive CLI provides the following options:

1. **Create single worklist** - Step-by-step worklist creation
2. **Create batch worklists** - Multiple worklists at once
3. **List existing worklists** - View all generated worklists
4. **Generate sample data** - Create test data
5. **Exit** - Close the application

### Sample CLI Session
```
🏥 Hasta Radiologi - Orthanc Worklist Generator
================================================

What would you like to do?
1. Create single worklist
2. Create batch worklists
3. List existing worklists
4. Generate sample data
5. Exit

Enter choice (1-5): 1

📝 Creating Single Worklist
============================

Patient Information:
Patient ID: P123456
Patient Name (LastName^FirstName): DOE^JOHN^MIDDLE
...
```

## Programmatic Usage

### Single Worklist
```javascript
const WorklistService = require('./lib/worklistService');

const service = new WorklistService();

const worklistData = {
  patientId: 'P123456',
  patientName: 'DOE^JOHN^MIDDLE',
  patientBirthDate: '1985-05-15',
  patientSex: 'M',
  accessionNumber: 'ACC123456',
  studyDescription: 'Chest X-Ray',
  scheduledDate: '2025-08-23',
  scheduledTime: '14:30:00',
  modality: 'CR'
};

const result = await service.createWorklist(worklistData);
console.log(result);
```

### Batch Worklists
```javascript
const worklistsData = [
  { patientId: 'P1', patientName: 'DOE^JOHN', ... },
  { patientId: 'P2', patientName: 'SMITH^JANE', ... },
  // ... more worklists
];

const result = await service.createWorklistBatch(worklistsData);
console.log(result);
```

## Configuration

### Environment Variables

The application can be configured using environment variables in a `.env` file:

| Variable | Default | Description |
|----------|---------|-------------|
| `WORKLIST_DIR` | `worklists` | Directory for storing generated worklist files |
| `INSTITUTION_NAME` | `Hasta Radiologi` | Default institution name |
| `DEPARTMENT_NAME` | `Radiology` | Default department name |
| `DEFAULT_MODALITY` | `CR` | Default imaging modality |
| `DEFAULT_AE_TITLE` | `ORTHANC` | Default AE title for scheduled station |
| `FILENAME_PREFIX` | _(empty)_ | Prefix for generated filenames |
| `FILENAME_SUFFIX` | _(empty)_ | Suffix for generated filenames |
| `CLEANUP_DAYS` | `30` | Auto-cleanup files older than this many days |
| `VALIDATE_REQUIRED_FIELDS` | `true` | Enable field validation |
| `VALIDATE_DATE_FORMAT` | `true` | Enable date format validation |
| `LOG_LEVEL` | `info` | Logging level |
| `LOG_FILE` | `worklist-generator.log` | Log file path |

### Example Configurations

**For Orthanc MWL Integration:**
```bash
# Direct storage to Orthanc worklist directory
WORKLIST_DIR=F:\PROJECT\hasta-pacs\orthanc-mwl\worklists
INSTITUTION_NAME=Hospital ABC
DEPARTMENT_NAME=Radiology Department
```

**For Network Storage:**
```bash
# Network share storage
WORKLIST_DIR=\\server\shared\worklists
FILENAME_PREFIX=HospitalABC_
DEFAULT_MODALITY=CT
```

## Data Structure

### Required Fields
- `patientId` - Unique patient identifier
- `patientName` - Patient name in DICOM format (Last^First^Middle)
- `accessionNumber` - Unique study identifier
- `scheduledDate` - Scheduled date (YYYY-MM-DD)
- `scheduledTime` - Scheduled time (HH:MM:SS)

### Optional Fields
- `patientBirthDate` - Patient birth date (YYYY-MM-DD)
- `patientSex` - Patient sex (M/F/U)
- `studyDescription` - Description of the study
- `modality` - Imaging modality (CR, CT, MR, US, etc.)
- `scheduledProcedureStepDescription` - Procedure description
- `requestedProcedureDescription` - Requested procedure
- `referringPhysician` - Referring physician name
- `performingPhysician` - Performing physician name
- `institutionName` - Institution name (default: 'Hasta Radiologi')
- `departmentName` - Department name (default: 'Radiology')

## File Structure

```
├── bin/
│   └── worklist-cli.js         # Interactive CLI application
├── lib/
│   ├── worklistService.js      # Main service class
│   └── dicomWorklistGenerator.js # DICOM worklist generator
├── examples/
│   ├── create-worklist.js      # Single worklist example
│   └── batch-worklist.js       # Batch creation example
├── worklists/                  # Generated worklist files (.wl)
├── instances/                  # Empty (preserved for future use)
└── package.json               # Project configuration
```

## Output

Generated worklist files are saved in the `worklists/` directory with the naming convention:
```
{AccessionNumber}_{Timestamp}.wl
```

Example: `ACC123456_1692792000000.wl`

## Integration with Orthanc

To use with Orthanc MWL:

1. Configure Orthanc to enable the Modality Worklist plugin
2. Set the worklist directory in Orthanc configuration:
   ```json
   {
     "Worklists": {
       "Enable": true,
       "Database": "/path/to/worklists"
     }
   }
   ```
3. Copy generated `.wl` files to the Orthanc worklist directory
4. Restart Orthanc to load the worklists

## Commands Reference

| Command | Description |
|---------|-------------|
| `npm run api` | **Start REST API server** |
| `npm run dev` | **Start API server with auto-restart** |
| `npm start` | Start interactive CLI |
| `npm run worklist` | Start interactive CLI (alias) |
| `npm run config` | Interactive configuration setup |
| `npm run create` | Run single worklist example |
| `npm run batch` | Run batch worklist example |
| `npm run simrs` | **Test SIM RS integration example** |

## Error Handling

The tool includes comprehensive error handling for:
- Invalid input data
- File system errors
- Missing required fields
- Directory permissions

All operations return structured results with success status and error messages.

## Requirements

- Node.js (v14 or higher)
- Write permissions to the project directory

## License

ISC License

---

**Note**: This tool generates DICOM worklist files in a simplified format compatible with Orthanc. For production use with other PACS systems, additional DICOM compliance testing may be required.
