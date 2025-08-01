const OrthancWorklistService = require('../src/services/orthancWorklistService');

/**
 * Test script for Orthanc Worklist Generator
 */
async function testWorklistGenerator() {
  console.log('🧪 Testing Orthanc Worklist Generator\n');

  const worklistService = new OrthancWorklistService();

  try {
    // Test 1: Create a single worklist
    console.log('Test 1: Creating single worklist...');
    const sampleData = {
      patientId: 'TEST001',
      patientName: 'TEST^PATIENT^SAMPLE',
      patientBirthDate: '1990-01-01',
      patientSex: 'M',
      accessionNumber: 'ACC_TEST_001',
      studyDescription: 'Test Chest X-Ray',
      scheduledDate: '2025-08-02',
      scheduledTime: '10:00',
      modality: 'CR',
      scheduledProcedureStepDescription: 'Test Chest X-Ray PA and Lateral',
      requestedProcedureDescription: 'Test Chest X-Ray - Routine',
      referringPhysician: 'DR^TEST^REFERRING',
      performingPhysician: 'DR^TEST^PERFORMING'
    };

    const result1 = await worklistService.createWorklist(sampleData);
    
    if (result1.success) {
      console.log('✅ Single worklist created successfully');
      console.log(`   File: ${result1.data.filename}`);
    } else {
      console.log('❌ Failed to create single worklist:', result1.message);
    }

    // Test 2: Create batch worklists
    console.log('\nTest 2: Creating batch worklists...');
    const batchData = [
      {
        ...sampleData,
        patientId: 'BATCH001',
        accessionNumber: 'ACC_BATCH_001',
        patientName: 'BATCH^PATIENT^ONE'
      },
      {
        ...sampleData,
        patientId: 'BATCH002',
        accessionNumber: 'ACC_BATCH_002',
        patientName: 'BATCH^PATIENT^TWO',
        scheduledTime: '11:00'
      },
      {
        ...sampleData,
        patientId: 'BATCH003',
        accessionNumber: 'ACC_BATCH_003',
        patientName: 'BATCH^PATIENT^THREE',
        scheduledTime: '12:00'
      }
    ];

    const result2 = await worklistService.createWorklistBatch(batchData);
    
    if (result2.success) {
      console.log('✅ Batch worklists created successfully');
      console.log(`   Total: ${result2.data.total}, Succeeded: ${result2.data.succeeded}, Failed: ${result2.data.failed}`);
    } else {
      console.log('❌ Failed to create batch worklists:', result2.message);
    }

    // Test 3: List all worklists
    console.log('\nTest 3: Listing all worklists...');
    const result3 = await worklistService.getAllWorklists();
    
    if (result3.success) {
      console.log(`✅ Found ${result3.data.count} worklist file(s)`);
      result3.data.files.forEach((file, index) => {
        console.log(`   ${index + 1}. ${file.filename} (${file.size} bytes)`);
      });
    } else {
      console.log('❌ Failed to list worklists:', result3.message);
    }

    // Test 4: Get statistics
    console.log('\nTest 4: Getting statistics...');
    const result4 = await worklistService.getWorklistStats();
    
    if (result4.success) {
      console.log('✅ Statistics retrieved successfully');
      console.log(`   Total files: ${result4.data.totalFiles}`);
      console.log(`   Total size: ${result4.data.totalSize} bytes`);
      console.log(`   Average size: ${Math.round(result4.data.averageSize)} bytes`);
    } else {
      console.log('❌ Failed to get statistics:', result4.message);
    }

    // Test 5: Generate sample data
    console.log('\nTest 5: Generating sample data...');
    const sampleGenerated = worklistService.generateSampleData();
    console.log('✅ Sample data generated');
    console.log(`   Patient ID: ${sampleGenerated.patientId}`);
    console.log(`   Patient Name: ${sampleGenerated.patientName}`);
    console.log(`   Accession Number: ${sampleGenerated.accessionNumber}`);

    console.log('\n🎉 All tests completed successfully!');
    console.log('\n📁 Check the worklists/ directory for generated files');
    console.log('🚀 You can now start the API server with: npm run dev');
    console.log('🖥️  Or use the CLI tool with: npm run worklist');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error.stack);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  testWorklistGenerator();
}

module.exports = testWorklistGenerator;
