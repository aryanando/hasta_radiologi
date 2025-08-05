// End-to-end test: API → File Storage → DICOM Query
require('dotenv').config();
const DicomWorklistGenerator = require('../src/generators/dicomWorklistGenerator');

async function testEndToEnd() {
  console.log('🧪 End-to-End Worklist Test');
  console.log('==============================\n');

  const generator = new DicomWorklistGenerator();
  console.log(`📁 Using worklist directory: ${generator.worklistDir}\n`);

  // Create test worklist data
  const testData = {
    patientId: `P_TEST_${Date.now()}`,
    patientName: 'TESTENV^DYNAMIC^CONFIG',
    patientBirthDate: '1985-05-15',
    patientSex: 'F',
    accessionNumber: `ENV_${Date.now()}`,
    studyDescription: 'Environment Config Test',
    scheduledDate: '2025-08-05',
    scheduledTime: '14:30',
    modality: 'CR',
    institutionName: 'Hasta Radiologi',
    departmentName: 'Radiology'
  };

  try {
    // Step 1: Create worklist file
    console.log('📝 Step 1: Creating worklist file...');
    const result = await generator.generateWorklistFile(testData);
    console.log(`✅ File created: ${result.filename}`);
    console.log(`📍 Path: ${result.filepath}`);
    console.log(`📊 Size: ${result.size} bytes\n`);

    // Step 2: List all worklist files
    console.log('📂 Step 2: Listing all worklist files...');
    const files = await generator.listWorklistFiles();
    console.log(`✅ Found ${files.length} .wl files total`);
    
    const recentFiles = files.slice(0, 3);
    recentFiles.forEach((file, index) => {
      console.log(`   ${index + 1}. ${file.filename} (${file.size} bytes)`);
    });

    console.log('\n🎯 Test completed successfully!');
    console.log('💡 You can now query this worklist via DICOM using:');
    console.log(`    docker exec dcmtk-client findscu -v -W -aet WORKSTATION -aec ORTHANC -k "0010,0020=${testData.patientId}" localhost 4242`);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testEndToEnd();
