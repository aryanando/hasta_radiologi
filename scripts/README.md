# Python DICOM Worklist Generator

This directory contains a Python-based DICOM worklist generator that creates proper DICOM Part 10 files compatible with Orthanc PACS server.

## Prerequisites

- Python 3.6 or higher
- pydicom library

## Installation

Install the required Python dependencies:

```bash
# From the project root
npm run install:python-deps

# Or manually
cd scripts
pip3 install -r requirements.txt
```

## Usage

### 1. Command Line Interface

#### Create Sample Worklist
```bash
python3 scripts/dicom_worklist_generator.py --sample
```

#### Create Worklist from JSON File
```bash
python3 scripts/dicom_worklist_generator.py scripts/sample_worklist.json
```

#### Create Batch Worklists
```bash
python3 scripts/dicom_worklist_generator.py scripts/batch_worklist.json
```

### 2. Node.js API Integration

The Python generator is integrated into the Node.js API through the `PythonDicomWorklistService`:

```javascript
const PythonDicomWorklistService = require('./src/services/pythonDicomWorklistService');

const service = new PythonDicomWorklistService();

// Create single worklist
const result = await service.createWorklist(worklistData);

// Create batch worklists
const batchResult = await service.createWorklistBatch(worklistsArray);

// Create sample worklist
const sampleResult = await service.createSampleWorklist();
```

### 3. REST API Endpoints

All existing API endpoints now use the Python generator:

```bash
# Create single worklist
POST /api/worklist

# Create batch worklists
POST /api/worklist/batch

# Create sample worklist
POST /api/worklist/sample

# List worklists
GET /api/worklist

# Download worklist
GET /api/worklist/download/:filename
```

## File Format

The generator creates proper DICOM Part 10 files with `.wl` extension:

### DICOM Structure
- **Preamble**: 128 bytes of zeros
- **DICM Prefix**: "DICM" identifier
- **File Meta Information**: Standard DICOM header
- **Dataset**: Worklist information with proper DICOM tags

### Key DICOM Elements
- Patient Information (0010,xxxx)
- Study Information (0008,xxxx, 0020,xxxx)
- Scheduled Procedure Step Sequence (0040,0100)
- Institution Information
- Physician Information

## JSON Input Format

### Single Worklist
```json
{
  "patientId": "P001",
  "patientName": "DOE^JOHN^MIDDLE",
  "patientBirthDate": "1990-01-01",
  "patientSex": "M",
  "accessionNumber": "ACC001",
  "studyDescription": "Chest X-Ray",
  "scheduledDate": "2025-08-02",
  "scheduledTime": "09:00",
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

### Batch Worklists
```json
[
  { /* worklist 1 */ },
  { /* worklist 2 */ },
  { /* worklist 3 */ }
]
```

## Required Fields

- `patientId`: Unique patient identifier
- `patientName`: Patient name in DICOM format (LastName^FirstName^MiddleName)
- `patientBirthDate`: Birth date (YYYY-MM-DD, YYYY/MM/DD, DD-MM-YYYY, DD/MM/YYYY)
- `patientSex`: M (Male), F (Female), U (Unknown)
- `accessionNumber`: Unique accession number
- `scheduledDate`: Scheduled date (flexible formats)
- `scheduledTime`: Scheduled time (HH:MM or HHMMSS)

## Optional Fields

- `studyDescription`: Description of the study
- `modality`: Imaging modality (default: CR)
- `scheduledStationAETitle`: AE Title (default: ORTHANC)
- `scheduledProcedureStepDescription`: Detailed procedure description
- `requestedProcedureDescription`: Requested procedure description
- `referringPhysician`: Referring physician name
- `performingPhysician`: Performing physician name
- `institutionName`: Institution name (default: Hasta Radiologi)
- `departmentName`: Department name (default: Radiology)
- `studyInstanceUID`: Study Instance UID (auto-generated if not provided)

## Output

Generated files are saved in the `worklists/` directory with naming pattern:
```
{accessionNumber}_{YYYYMMDD_HHMMSS}.wl
```

Examples:
- `ACC001_20250801_143000.wl`
- `ACC_BATCH_001_20250801_143001.wl`

## Testing

Test the Python generator:

```bash
# Test Python generator directly
npm run test:python-worklist

# Test with Node.js integration
npm run test:worklist
```

## Troubleshooting

### Python Not Found
Ensure Python 3 is installed and accessible as `python3`:
```bash
python3 --version
```

### pydicom Not Installed
Install the required dependency:
```bash
pip3 install pydicom
```

### Permission Errors
Ensure the script is executable:
```bash
chmod +x scripts/dicom_worklist_generator.py
```

### File Generation Errors
Check the Python script output for detailed error messages:
```bash
python3 scripts/dicom_worklist_generator.py --sample
```

## Validation

You can validate the generated DICOM files using various tools:

### Using dcmdump (if available)
```bash
dcmdump worklists/ACC001_20250801_143000.wl
```

### Using Python
```python
import pydicom
ds = pydicom.dcmread('worklists/ACC001_20250801_143000.wl')
print(ds)
```

### Using hexdump
```bash
hexdump -C worklists/ACC001_20250801_143000.wl | head -5
```

Should show:
- Bytes 0-127: Zeros (preamble)
- Bytes 128-131: "DICM"
- Subsequent bytes: DICOM data elements

## Integration with Orthanc

1. **Configure Orthanc** to use the worklists directory:
```json
{
  "Worklists": {
    "Enable": true,
    "Database": "/path/to/worklists"
  }
}
```

2. **Place generated files** in the Orthanc worklists directory

3. **Restart Orthanc** to pick up new worklist files

4. **Query worklists** using DICOM C-FIND operations

## Features

✅ Proper DICOM Part 10 format  
✅ Implicit VR Little Endian transfer syntax  
✅ Complete file meta information  
✅ Standard worklist DICOM tags  
✅ Flexible date/time parsing  
✅ Batch processing support  
✅ Error handling and validation  
✅ Integration with Node.js API  
✅ Command-line interface  

## Advantages over Text-based Approach

1. **Native DICOM Format**: Creates true DICOM binary files
2. **Better Compatibility**: Works with all DICOM-compliant systems
3. **Proper Validation**: pydicom ensures DICOM standard compliance
4. **Rich Metadata**: Supports all required DICOM elements
5. **Transfer Syntax**: Uses standard DICOM transfer syntax
6. **File Meta Info**: Includes proper DICOM file meta information
