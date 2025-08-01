const DicomInstanceService = require('../src/services/dicomInstanceService');

async function testDicomInstanceService() {
  const service = new DicomInstanceService();
  
  console.log('Testing DICOM Instance Service...\n');
  
  try {
    // Check if DCMTK tools are available
    console.log('🔍 Checking DCMTK availability...');
    const toolCheck = await service.checkDcmtkAvailability();
    console.log('Tools status:', toolCheck.data);
    
    if (!toolCheck.success) {
      console.log('⚠️  Some DCMTK tools are missing, continuing with limited functionality');
    }
    
    // Test creating a DICOM instance
    console.log('\n📝 Creating DICOM instance with all required tags...');
    
    const instanceData = {
      patientID: '123456',
      patientName: 'TEST^PATIENT^MIDDLE',
      patientBirthDate: '19900115',
      patientSex: 'M',
      studyDescription: 'Chest X-Ray Study',
      seriesDescription: 'PA and Lateral Views',
      modality: 'CR',
      accessionNumber: 'ACC001',
      institutionName: 'Hasta Radiologi',
      referringPhysicianName: 'DR^SMITH^JOHN',
      performingPhysicianName: 'DR^JONES^MARY'
    };
    
    console.log('Instance data:', JSON.stringify(instanceData, null, 2));
    
    const result = await service.createDicomInstance(instanceData);
    
    if (result.success) {
      console.log(`\n✅ Successfully created DICOM instance: ${result.data.filename}`);
      console.log('📋 Generated UIDs:');
      console.log(`   StudyInstanceUID: ${result.data.uids.studyInstanceUID}`);
      console.log(`   SeriesInstanceUID: ${result.data.uids.seriesInstanceUID}`);
      console.log(`   SOPInstanceUID: ${result.data.uids.sopInstanceUID}`);
      
      // Check if file exists
      const fs = require('fs');
      if (fs.existsSync(result.data.filepath)) {
        const stats = fs.statSync(result.data.filepath);
        console.log(`📁 File size: ${stats.size} bytes`);
        console.log(`📅 Created: ${stats.birthtime}`);
        
        // Validate the instance
        if (toolCheck.data.dcmdump !== 'Not found') {
          console.log('\n🔍 Validating DICOM instance...');
          const validation = await service.validateInstance(result.data.filename);
          
          if (validation.success) {
            console.log('✅ Validation results:');
            console.log(`   Is Valid: ${validation.data.isValid}`);
            console.log(`   Has StudyInstanceUID: ${validation.data.hasStudyInstanceUID}`);
            console.log(`   Has SeriesInstanceUID: ${validation.data.hasSeriesInstanceUID}`);
            console.log(`   Has SOPInstanceUID: ${validation.data.hasSOPInstanceUID}`);
            
            if (!validation.data.isValid) {
              console.log('❌ DICOM instance is missing required tags!');
              console.log('Details:', validation.data.details.slice(0, 500) + '...');
            }
          } else {
            console.log('❌ Validation failed:', validation.message);
          }
        }
      } else {
        console.log('❌ File not found at expected location');
      }
      
    } else {
      console.error('❌ Failed to create DICOM instance:', result.message);
    }
    
    // List all instances
    console.log('\n📂 Listing all DICOM instances...');
    const listResult = await service.listInstances();
    if (listResult.success) {
      console.log(`Found ${listResult.data.count} instance(s):`);
      listResult.data.files.forEach(file => {
        console.log(`   ${file.filename} (${file.size} bytes)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
testDicomInstanceService();
