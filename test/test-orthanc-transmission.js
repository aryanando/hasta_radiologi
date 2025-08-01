const DicomInstanceService = require('../src/services/dicomInstanceService');

async function sendToOrthanc() {
  const service = new DicomInstanceService();
  
  console.log('🏥 Testing DICOM transmission to Orthanc...\n');
  
  try {
    // Step 1: Create a new DICOM instance specifically for transmission test
    console.log('📝 Step 1: Creating DICOM instance for transmission...');
    
    const instanceData = {
      patientID: '999888',  // Different patient ID for easy identification
      patientName: 'ORTHANC^TEST^TRANSMISSION',
      patientBirthDate: '19920520',
      patientSex: 'F',
      studyDescription: 'Orthanc Transmission Test',
      seriesDescription: 'Test Series for Orthanc',
      modality: 'CR',
      accessionNumber: `ORTHANC_TEST_${Date.now()}`,
      institutionName: 'Hasta Radiologi',
      stationName: 'TEST_STATION',
      referringPhysicianName: 'DR^TEST^REFERRING',
      performingPhysicianName: 'DR^TEST^PERFORMING'
    };
    
    const result = await service.createDicomInstance(instanceData);
    
    if (!result.success) {
      console.error('❌ Failed to create DICOM instance:', result.message);
      return;
    }
    
    console.log(`✅ Created DICOM instance: ${result.data.filename}`);
    console.log(`📋 Patient ID: ${result.data.patientID}`);
    console.log(`🔗 StudyInstanceUID: ${result.data.uids.studyInstanceUID}`);
    
    // Step 2: Validate the instance
    console.log('\n🔍 Step 2: Validating DICOM instance...');
    const validation = await service.validateInstance(result.data.filename);
    
    if (!validation.success || !validation.data.isValid) {
      console.error('❌ DICOM validation failed');
      return;
    }
    
    console.log('✅ DICOM validation passed - all required tags present');
    
    // Step 3: Try different Orthanc configurations
    console.log('\n📤 Step 3: Attempting to send to Orthanc...');
    
    const orthancConfigs = [
      { host: 'localhost', port: 4242, aet: 'ORTHANC', sourceAet: 'HASTA_RADIOLOGI' },
      { host: '127.0.0.1', port: 4242, aet: 'ORTHANC', sourceAet: 'HASTA_RADIOLOGI' },
      { host: 'localhost', port: 104, aet: 'ORTHANC', sourceAet: 'HASTA_RADIOLOGI' }, // Standard DICOM port
    ];
    
    for (let i = 0; i < orthancConfigs.length; i++) {
      const config = orthancConfigs[i];
      console.log(`\n🔄 Attempt ${i + 1}: Sending to ${config.host}:${config.port}...`);
      
      const sendResult = await service.sendToOrthanc(result.data.filename, config);
      
      if (sendResult.success) {
        console.log('✅ Successfully sent to Orthanc!');
        console.log('📡 Configuration:', JSON.stringify(config, null, 2));
        console.log('📋 Output:', sendResult.data.output || 'No output');
        
        // Check if we can verify the transmission
        console.log('\n🔍 Verifying transmission...');
        
        // Wait a moment for Orthanc to process
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        console.log('✅ DICOM instance sent successfully to Orthanc');
        console.log('🎯 You should now see the patient "ORTHANC^TEST^TRANSMISSION" with PatientID=999888 in your Orthanc web interface');
        console.log('🌐 Check: http://localhost:8042/app/explorer.html');
        
        return;
      } else {
        console.log(`❌ Failed with config ${i + 1}:`, sendResult.message);
      }
    }
    
    console.log('\n⚠️  All transmission attempts failed.');
    console.log('💡 This could mean:');
    console.log('   1. Orthanc DICOM server is not running on the expected port');
    console.log('   2. Orthanc AE Title configuration doesn\'t match');
    console.log('   3. Network/firewall issues');
    console.log('   4. Orthanc is not configured to accept C-STORE operations');
    
    console.log('\n🔧 Troubleshooting steps:');
    console.log('   1. Check Orthanc configuration file for DICOM port and AE Title');
    console.log('   2. Verify Orthanc is running: netstat -an | grep 4242');
    console.log('   3. Check Orthanc logs for connection attempts');
    console.log('   4. Try manual storescu command:');
    console.log(`      storescu -aet HASTA_RADIOLOGI -aec ORTHANC localhost 4242 instances/${result.data.filename}`);
    
  } catch (error) {
    console.error('❌ Error during transmission test:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Run the test
sendToOrthanc().then(() => {
  console.log('\n🏁 Transmission test completed');
}).catch(err => {
  console.error('❌ Test failed:', err);
});
