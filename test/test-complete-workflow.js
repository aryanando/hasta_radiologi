const DicomInstanceService = require('../src/services/dicomInstanceService');

async function testCompleteWorkflow() {
  const service = new DicomInstanceService();
  
  console.log('🔬 Testing Complete DICOM Workflow...\n');
  
  try {
    // Step 1: Create a DICOM instance with PatientID 123456 (the one from the error)
    console.log('📝 Step 1: Creating DICOM instance for PatientID=123456...');
    
    const instanceData = {
      patientID: '123456',  // This is the PatientID from the error message
      patientName: 'DOE^JOHN^MIDDLE',
      patientBirthDate: '19850315',
      patientSex: 'M',
      studyDescription: 'Chest X-Ray Examination',
      seriesDescription: 'PA and Lateral Views',
      modality: 'CR',
      accessionNumber: 'ACC20250801001',
      institutionName: 'Hasta Radiologi',
      stationName: 'CR_STATION_1',
      referringPhysicianName: 'DR^SMITH^ROBERT',
      performingPhysicianName: 'DR^JOHNSON^MARY'
    };
    
    const result = await service.createDicomInstance(instanceData);
    
    if (!result.success) {
      console.error('❌ Failed to create DICOM instance:', result.message);
      return;
    }
    
    console.log(`✅ Created DICOM instance: ${result.data.filename}`);
    console.log('📋 Instance details:');
    console.log(`   Patient ID: ${result.data.patientID}`);
    console.log(`   StudyInstanceUID: ${result.data.uids.studyInstanceUID}`);
    console.log(`   SeriesInstanceUID: ${result.data.uids.seriesInstanceUID}`);
    console.log(`   SOPInstanceUID: ${result.data.uids.sopInstanceUID}`);
    
    // Step 2: Validate the instance
    console.log('\n🔍 Step 2: Validating DICOM instance...');
    const validation = await service.validateInstance(result.data.filename);
    
    if (validation.success) {
      console.log('✅ Validation passed:');
      console.log(`   Has all required tags: ${validation.data.isValid}`);
      console.log(`   Has StudyInstanceUID: ${validation.data.hasStudyInstanceUID}`);
      console.log(`   Has SeriesInstanceUID: ${validation.data.hasSeriesInstanceUID}`);
      console.log(`   Has SOPInstanceUID: ${validation.data.hasSOPInstanceUID}`);
      
      if (!validation.data.isValid) {
        console.log('❌ DICOM instance is missing required tags!');
        return;
      }
    } else {
      console.error('❌ Validation failed:', validation.message);
      return;
    }
    
    // Step 3: Display the DICOM structure
    console.log('\n📋 Step 3: DICOM structure:');
    const { spawn } = require('child_process');
    
    return new Promise((resolve) => {
      const dcmdump = spawn('/opt/homebrew/bin/dcmdump', [
        result.data.filepath,
        '--print-all'
      ]);
      
      let output = '';
      
      dcmdump.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      dcmdump.on('close', (code) => {
        if (code === 0) {
          // Show key tags
          console.log('Key DICOM tags:');
          
          const lines = output.split('\n');
          const keyTags = [
            '(0010,0020)', // PatientID
            '(0020,000d)', // StudyInstanceUID
            '(0020,000e)', // SeriesInstanceUID
            '(0008,0018)', // SOPInstanceUID
            '(0008,0016)', // SOPClassUID
            '(0010,0010)', // PatientName
            '(0008,0060)', // Modality
            '(0008,1030)', // StudyDescription
          ];
          
          for (const tag of keyTags) {
            const line = lines.find(l => l.includes(tag));
            if (line) {
              console.log(`   ${line.trim()}`);
            }
          }
          
          console.log('\n🎯 Step 4: Summary');
          console.log('✅ DICOM instance created successfully with all required tags');
          console.log('✅ This instance should NOT cause the Orthanc error you encountered');
          console.log('✅ All mandatory UIDs are present and properly formatted');
          
          console.log('\n💡 Next steps:');
          console.log('   1. Use this service to generate proper DICOM instances');
          console.log('   2. Send instances to Orthanc using the sendToOrthanc method');
          console.log('   3. The API endpoints are available at /api/dicom/instances');
          
          resolve();
        } else {
          console.error('❌ Failed to dump DICOM file');
          resolve();
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Error in workflow:', error.message);
  }
}

// Run the test
testCompleteWorkflow().then(() => {
  console.log('\n🏁 Test completed');
});
