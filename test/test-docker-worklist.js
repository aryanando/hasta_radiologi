const DockerDicomWorklistService = require('../src/services/dockerDicomWorklistService');

async function testDockerWorklist() {
  const service = new DockerDicomWorklistService();
  
  console.log('Testing Docker DICOM worklist generation...\n');
  
  try {
    // Test with sample patient data
    const patientData = {
      patientId: 'TEST001',
      patientName: 'Doe^John',
      patientBirthDate: '19900115',
      patientSex: 'M',
      studyInstanceUID: '1.2.3.4.5.6.7.8.9.10',
      accessionNumber: 'ACC001',
      scheduledStationAETitle: 'STATION1',
      scheduledProcedureStepStartDate: '20241220',
      scheduledProcedureStepStartTime: '090000',
      modality: 'CR',
      scheduledProcedureStepDescription: 'Chest X-Ray',
      scheduledProcedureStepID: 'SPS001',
      requestedProcedureID: 'RP001',
      requestedProcedureDescription: 'Chest X-Ray Examination'
    };
    
    console.log('Patient data:', JSON.stringify(patientData, null, 2));
    
    const filename = await service.generateDicomWorklist(patientData);
    console.log(`\n✅ Successfully generated DICOM worklist: ${filename}`);
    
    // Check if file exists
    const fs = require('fs');
    const filePath = `/Volumes/SSD Samsung 980/Project/hasta_radiologi/worklists/${filename}`;
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      console.log(`📁 File size: ${stats.size} bytes`);
      console.log(`📅 Created: ${stats.birthtime}`);
    } else {
      console.log('❌ File not found');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testDockerWorklist();
