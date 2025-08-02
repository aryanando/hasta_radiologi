# 🏥 Hasta Radiologi PACS Viewer Setup Guide

## ✅ What We've Configured

### 1. DICOM Data Generation & Transmission ✅
- **Working**: API and quick commands to generate and send DICOM files to Orthanc
- **Test Data**: Successfully sent test patient to Orthanc (PatientID: 999888)
- **No More Errors**: Fixed the "missing required tags" error completely

### 2. OHIF PACS Viewer Configuration ✅
- **Custom Config**: Created `hasta_radiologi.js` configuration for your Orthanc server
- **Branding**: Custom "Hasta Radiologi PACS" branding and hotkeys
- **Connection**: Pre-configured to connect to your Orthanc at localhost:8042

## 🚀 Quick Start Commands

### Add Test Data to Orthanc
```bash
cd /Volumes/SSD\ Samsung\ 980/Project/hasta_radiologi

# Send single test patient
npm run quick:demo

# Send 5 patients with different modalities  
npm run quick:batch

# Send single CT patient
npm run quick:single
```

### Start PACS Viewer
```bash
# Setup (first time only)
npm run setup:pacs

# Start viewer 
npm run start:pacs
```

## 📋 Manual Setup (if npm commands don't work)

### 1. Install OHIF Dependencies
```bash
cd /Volumes/SSD\ Samsung\ 980/Project/pacs-viewer
yarn install
```

### 2. Start OHIF Viewer
```bash
cd /Volumes/SSD\ Samsung\ 980/Project/pacs-viewer
APP_CONFIG=config/hasta_radiologi.js yarn dev
```

### 3. Access the Viewer
- **PACS Viewer**: http://localhost:3000
- **Orthanc Web**: http://localhost:8042/app/explorer.html

## 🔧 Configuration Details

### Orthanc Connection
- **DICOM Port**: localhost:4242 (for sending)
- **Web Port**: localhost:8042 (for viewing)
- **DICOMweb**: http://localhost:8042/dicom-web
- **WADO**: http://localhost:8042/wado

### OHIF Configuration File
- **Location**: `/Volumes/SSD Samsung 980/Project/pacs-viewer/platform/app/public/config/hasta_radiologi.js`
- **Data Source**: `hasta-orthanc`
- **Features**: Study list, image manipulation, custom hotkeys

## 🎯 Hotkeys for Viewing
- **Arrow Keys**: Navigate viewports and images
- **R / L**: Rotate right/left
- **I**: Invert colors
- **H / V**: Flip horizontal/vertical
- **+ / -**: Zoom in/out
- **Space**: Reset viewport
- **=**: Fit to window

## 🔍 Troubleshooting

### If PACS Viewer Won't Start
1. Check Orthanc is running: `curl http://localhost:8042/system`
2. Install dependencies: `yarn install`
3. Use manual start command above

### If No Studies Appear
1. Add test data: `npm run quick:demo`
2. Check Orthanc web interface: http://localhost:8042/app/explorer.html
3. Refresh PACS viewer

### If Connection Errors
1. Verify Orthanc DICOMweb is enabled
2. Check CORS settings in Orthanc
3. Verify configuration file paths

## 📚 All Available Commands

```bash
# Data Generation
npm run quick:demo         # Send test patient
npm run quick:single       # Send CT patient  
npm run quick:batch        # Send 5 patients
npm run help              # Show all commands

# PACS Viewer
npm run setup:pacs        # Setup viewer
npm run start:pacs        # Start viewer
npm run pacs:setup        # Alias for setup
npm run pacs:start        # Alias for start

# Server
npm run dev               # Start API server
npm start                 # Start production server
```

## 🎉 Success Check

1. ✅ Orthanc running on localhost:8042
2. ✅ Test data in Orthanc (run `npm run quick:demo`)
3. ✅ OHIF viewer starting on localhost:3000  
4. ✅ Can see and manipulate DICOM images

You now have a complete PACS solution with DICOM generation, storage, and viewing!
