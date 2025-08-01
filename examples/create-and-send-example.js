const DicomInstanceService = require('../src/services/dicomInstanceService');

async function createAndSendExample() {
  const service = new DicomInstanceService();
  
  console.log('🏥 Creating and sending DICOM example...\n');
  
  // Define patient data
  const patientData = {
    patientID: 'EXAMPLE001',
    patientName: 'EXAMPLE^PATIENT^DEMO',
    patientBirthDate: '1990-01-15', // Can use YYYY-MM-DD format
    patientSex: 'F',
    studyDescription: 'CT Abdomen with Contrast',
    seriesDescription: 'Axial CT Abdomen',
    modality: 'CT', // CT, CR, MR, US, etc.
    accessionNumber: `ACC${Date.now()}`, // Unique accession number
    institutionName: 'Hasta Radiologi Clinic',
    stationName: 'CT_SCANNER_1',
    referringPhysicianName: 'DR^WILSON^ROBERT',
    performingPhysicianName: 'DR^BROWN^SARAH',
    studyDate: '2025-08-01', // Optional: defaults to today
    studyTime: '14:30:00'    // Optional: defaults to now
  };
  
  try {
    // Step 1: Create DICOM instance
    console.log('📝 Creating DICOM instance...');
    const createResult = await service.createDicomInstance(patientData);
    
    if (!createResult.success) {
      console.error('❌ Failed to create DICOM:', createResult.message);
      return;
    }
    
    console.log('✅ DICOM instance created successfully!');
    console.log('📄 Filename:', createResult.data.filename);
    console.log('🆔 Patient ID:', createResult.data.patientID);
    console.log('📊 Study UID:', createResult.data.uids.studyInstanceUID);
    
    // Step 2: Validate the instance (optional)
    console.log('\n🔍 Validating DICOM instance...');
    const validation = await service.validateInstance(createResult.data.filename);
    
    if (validation.success && validation.data.isValid) {
      console.log('✅ Validation passed - all required tags present');
    } else {
      console.warn('⚠️ Validation issues:', validation.message);
    }
    
    // Step 3: Send to Orthanc
    console.log('\n📤 Sending to Orthanc...');
    const sendConfig = {
      host: 'localhost',
      port: 4242,
      aet: 'ORTHANC',
      sourceAet: 'HASTA_RADIOLOGI'
    };
    
    const sendResult = await service.sendToOrthanc(createResult.data.filename, sendConfig);
    
    if (sendResult.success) {
      console.log('✅ Successfully sent to Orthanc!');
      console.log('🌐 Check Orthanc web interface: http://localhost:8042');
      console.log('👤 Look for patient:', patientData.patientName);
      console.log('🆔 Patient ID:', patientData.patientID);
      console.log('📊 Study Description:', patientData.studyDescription);
    } else {
      console.error('❌ Failed to send to Orthanc:', sendResult.message);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run the example
createAndSendExample().then(() => {
  console.log('\n🏁 Create and send example completed!');
}).catch(err => {
  console.error('❌ Example failed:', err);
});
