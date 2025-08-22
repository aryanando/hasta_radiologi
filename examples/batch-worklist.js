#!/usr/bin/env node

const WorklistService = require('../lib/worklistService');

/**
 * Example: Create multiple worklists in batch
 */
async function createBatchWorklists() {
  const worklistService = new WorklistService();
  
  console.log('🏥 Creating Batch Worklists...');
  
  // Sample batch data
  const worklistsData = [
    {
      patientId: `P${Date.now()}_1`,
      patientName: 'SMITH^JANE^MARY',
      patientBirthDate: '1975-03-20',
      patientSex: 'F',
      accessionNumber: `ACC${Date.now()}_1`,
      studyDescription: 'CT Chest',
      scheduledDate: '2025-08-23',
      scheduledTime: '09:00:00',
      modality: 'CT',
      scheduledProcedureStepDescription: 'CT Chest with Contrast',
      requestedProcedureDescription: 'CT Chest - Routine'
    },
    {
      patientId: `P${Date.now()}_2`,
      patientName: 'BROWN^ROBERT^JAMES',
      patientBirthDate: '1980-07-10',
      patientSex: 'M',
      accessionNumber: `ACC${Date.now()}_2`,
      studyDescription: 'MRI Brain',
      scheduledDate: '2025-08-23',
      scheduledTime: '11:30:00',
      modality: 'MR',
      scheduledProcedureStepDescription: 'MRI Brain without Contrast',
      requestedProcedureDescription: 'MRI Brain - Headache Investigation'
    },
    {
      patientId: `P${Date.now()}_3`,
      patientName: 'WILSON^ALICE^ROSE',
      patientBirthDate: '1992-12-05',
      patientSex: 'F',
      accessionNumber: `ACC${Date.now()}_3`,
      studyDescription: 'Ultrasound Abdomen',
      scheduledDate: '2025-08-23',
      scheduledTime: '14:15:00',
      modality: 'US',
      scheduledProcedureStepDescription: 'Ultrasound Abdomen Complete',
      requestedProcedureDescription: 'Ultrasound Abdomen - Routine'
    }
  ];
  
  try {
    const result = await worklistService.createWorklistBatch(worklistsData);
    
    if (result.success) {
      console.log('✅ Batch worklists created successfully!');
      console.log(`📊 Total: ${result.data.total}`);
      console.log(`✅ Succeeded: ${result.data.succeeded}`);
      console.log(`❌ Failed: ${result.data.failed}`);
      
      // Show details for successful ones
      const successful = result.data.results.filter(r => r.success);
      console.log('\n📁 Created files:');
      successful.forEach((r, i) => {
        console.log(`   ${i + 1}. ${r.data.filename} (${r.data.size} bytes)`);
      });
    } else {
      console.log('❌ Failed to create batch worklists:', result.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  createBatchWorklists();
}

module.exports = createBatchWorklists;
