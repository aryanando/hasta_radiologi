const PythonDicomWorklistService = require('../src/services/pythonDicomWorklistService');

/**
 * Test script for Python DICOM Worklist Generator
 */
async function testPythonWorklistGenerator() {
  console.log('🧪 Testing Python DICOM Worklist Generator\n');

  const worklistService = new PythonDicomWorklistService();

  try {
    // Test 1: Create sample worklist using Python
    console.log('Test 1: Creating sample worklist with Python...');
    const result1 = await worklistService.createSampleWorklist();
    
    if (result1.success) {
      console.log('✅ Sample worklist created successfully');
      console.log(`   Output: ${result1.data.output}`);
    } else {
      console.log('❌ Failed to create sample worklist:', result1.message);
    }

    // Test 2: Create a single worklist
    console.log('\nTest 2: Creating single worklist...');
    const sampleData = {
      patientId: 'PYTEST001',
      patientName: 'PYTHON^TEST^PATIENT',
      patientBirthDate: '1990-01-01',
      patientSex: 'M',
      accessionNumber: 'ACC_PYTEST_001',
      studyDescription: 'Python Test Chest X-Ray',
      scheduledDate: '2025-08-02',
      scheduledTime: '10:00',
      modality: 'CR',
      scheduledProcedureStepDescription: 'Python Test Chest X-Ray PA and Lateral',
      requestedProcedureDescription: 'Python Test Chest X-Ray - Routine',
      referringPhysician: 'DR^PYTHON^TEST',
      performingPhysician: 'DR^PYDICOM^TEST'
    };

    const result2 = await worklistService.createWorklist(sampleData);
    
    if (result2.success) {
      console.log('✅ Single worklist created successfully');
      console.log(`   File: ${result2.data.filename}`);
      console.log(`   Size: ${result2.data.size} bytes`);
    } else {
      console.log('❌ Failed to create single worklist:', result2.message);
    }

    // Test 3: Create batch worklists
    console.log('\nTest 3: Creating batch worklists...');
    const batchData = [
      {
        ...sampleData,
        patientId: 'PYBATCH001',
        accessionNumber: 'ACC_PYBATCH_001',
        patientName: 'PYBATCH^PATIENT^ONE'
      },
      {
        ...sampleData,
        patientId: 'PYBATCH002',
        accessionNumber: 'ACC_PYBATCH_002',
        patientName: 'PYBATCH^PATIENT^TWO',
        scheduledTime: '11:00'
      }
    ];

    const result3 = await worklistService.createWorklistBatch(batchData);
    
    if (result3.success) {
      console.log('✅ Batch worklists created successfully');
      console.log(`   Total: ${result3.data.total}, Succeeded: ${result3.data.succeeded}, Failed: ${result3.data.failed}`);
    } else {
      console.log('❌ Failed to create batch worklists:', result3.message);
    }

    // Test 4: List all worklists
    console.log('\nTest 4: Listing all worklists...');
    const result4 = await worklistService.getAllWorklists();
    
    if (result4.success) {
      console.log(`✅ Found ${result4.data.count} DICOM worklist file(s)`);
      result4.data.files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.filename} (${file.size} bytes)`);
      });
    } else {
      console.log('❌ Failed to list worklists:', result4.message);
    }

    // Test 5: Get statistics
    console.log('\nTest 5: Getting statistics...');
    const result5 = await worklistService.getWorklistStats();
    
    if (result5.success) {
      console.log('✅ Statistics retrieved successfully');
      console.log(`   Total files: ${result5.data.totalFiles}`);
      console.log(`   Total size: ${result5.data.totalSize} bytes`);
      console.log(`   Average size: ${Math.round(result5.data.averageSize)} bytes`);
    } else {
      console.log('❌ Failed to get statistics:', result5.message);
    }

    console.log('\n🎉 Python DICOM worklist generator test completed!');
    console.log('\n📁 Check the worklists/ directory for .wl files');
    console.log('🐍 These files are generated using Python pydicom library');
    console.log('🏥 They should be properly formatted for Orthanc PACS');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testPythonWorklistGenerator();
}

module.exports = testPythonWorklistGenerator;
