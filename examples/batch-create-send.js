const DicomInstanceService = require('../src/services/dicomInstanceService');

async function batchCreateAndSend() {
  const service = new DicomInstanceService();
  
  // Define multiple patients
  const patients = [
    {
      patientID: 'BATCH001',
      patientName: 'BATCH^PATIENT^ONE',
      patientBirthDate: '1985-03-15',
      patientSex: 'M',
      modality: 'CR',
      studyDescription: 'Chest X-Ray PA and Lateral',
      seriesDescription: 'PA Chest',
      institutionName: 'Hasta Radiologi',
      stationName: 'XRAY_ROOM_1'
    },
    {
      patientID: 'BATCH002', 
      patientName: 'BATCH^PATIENT^TWO',
      patientBirthDate: '1978-11-22',
      patientSex: 'F',
      modality: 'CT',
      studyDescription: 'Head CT without Contrast',
      seriesDescription: 'Axial Head CT',
      institutionName: 'Hasta Radiologi',
      stationName: 'CT_SCANNER_1'
    },
    {
      patientID: 'BATCH003',
      patientName: 'BATCH^PATIENT^THREE',
      patientBirthDate: '1992-07-08',
      patientSex: 'M',
      modality: 'MR',
      studyDescription: 'Brain MRI T1 and T2',
      seriesDescription: 'T1 Sagittal',
      institutionName: 'Hasta Radiologi',
      stationName: 'MRI_SCANNER_1'
    },
    {
      patientID: 'BATCH004',
      patientName: 'BATCH^PATIENT^FOUR',
      patientBirthDate: '1965-12-03',
      patientSex: 'F',
      modality: 'US',
      studyDescription: 'Abdominal Ultrasound',
      seriesDescription: 'Upper Abdomen US',
      institutionName: 'Hasta Radiologi',
      stationName: 'US_ROOM_1'
    },
    {
      patientID: 'BATCH005',
      patientName: 'BATCH^PATIENT^FIVE',
      patientBirthDate: '1989-05-18',
      patientSex: 'M',
      modality: 'DX',
      studyDescription: 'Digital Radiography Knee',
      seriesDescription: 'AP and Lateral Knee',
      institutionName: 'Hasta Radiologi',
      stationName: 'DR_ROOM_1'
    }
  ];
  
  console.log(`🏥 Processing ${patients.length} patients in batch...\n`);
  
  const results = {
    successful: 0,
    failed: 0,
    details: []
  };
  
  for (let i = 0; i < patients.length; i++) {
    const patient = patients[i];
    console.log(`\n📝 Processing patient ${i + 1}/${patients.length}: ${patient.patientName}`);
    
    try {
      // Create DICOM instance
      const createResult = await service.createDicomInstance({
        ...patient,
        accessionNumber: `BATCH_${Date.now()}_${String(i + 1).padStart(3, '0')}`,
        referringPhysicianName: 'DR^BATCH^REFERRING',
        performingPhysicianName: 'DR^BATCH^PERFORMING'
      });
      
      if (!createResult.success) {
        console.error(`❌ Failed to create DICOM for ${patient.patientID}: ${createResult.message}`);
        results.failed++;
        results.details.push({
          patientID: patient.patientID,
          status: 'create_failed',
          error: createResult.message
        });
        continue;
      }
      
      console.log(`✅ Created: ${createResult.data.filename}`);
      
      // Send to Orthanc
      const sendResult = await service.sendToOrthanc(createResult.data.filename, {
        host: 'localhost',
        port: 4242,
        aet: 'ORTHANC',
        sourceAet: 'HASTA_RADIOLOGI'
      });
      
      if (sendResult.success) {
        console.log(`✅ ${patient.patientID} sent successfully to Orthanc`);
        results.successful++;
        results.details.push({
          patientID: patient.patientID,
          patientName: patient.patientName,
          modality: patient.modality,
          filename: createResult.data.filename,
          status: 'success'
        });
      } else {
        console.error(`❌ Failed to send ${patient.patientID}: ${sendResult.message}`);
        results.failed++;
        results.details.push({
          patientID: patient.patientID,
          status: 'send_failed',
          error: sendResult.message
        });
      }
      
      // Small delay between transmissions to avoid overwhelming Orthanc
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Error processing ${patient.patientID}:`, error.message);
      results.failed++;
      results.details.push({
        patientID: patient.patientID,
        status: 'error',
        error: error.message
      });
    }
  }
  
  console.log('\n🏁 Batch processing completed!');
  console.log(`📊 Results: ${results.successful} successful, ${results.failed} failed`);
  console.log('\n📋 Summary:');
  
  results.details.forEach(detail => {
    if (detail.status === 'success') {
      console.log(`✅ ${detail.patientID} (${detail.modality}) - ${detail.patientName}`);
    } else {
      console.log(`❌ ${detail.patientID} - ${detail.status}: ${detail.error}`);
    }
  });
  
  if (results.successful > 0) {
    console.log('\n🌐 Check Orthanc web interface: http://localhost:8042');
    console.log('👥 Look for patients with IDs: BATCH001, BATCH002, BATCH003, BATCH004, BATCH005');
  }
}

// Run batch processing
batchCreateAndSend().then(() => {
  console.log('\n🎯 Batch create and send completed!');
}).catch(err => {
  console.error('❌ Batch processing failed:', err);
});
