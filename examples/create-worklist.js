#!/usr/bin/env node

const WorklistService = require('../lib/worklistService');

/**
 * Example: Create a single worklist
 */
async function createWorklist() {
  const worklistService = new WorklistService();
  
  console.log('🏥 Creating Sample Worklist...');
  
  // Sample worklist data
  const worklistData = {
    patientId: `P${Date.now()}`,
    patientName: 'DOE^JOHN^MIDDLE',
    patientBirthDate: '1985-05-15',
    patientSex: 'M',
    accessionNumber: `ACC${Date.now()}`,
    studyDescription: 'Chest X-Ray',
    scheduledDate: '2025-08-23',
    scheduledTime: '14:30:00',
    modality: 'CR',
    scheduledProcedureStepDescription: 'Chest X-Ray PA and Lateral',
    requestedProcedureDescription: 'Chest X-Ray - Routine',
    referringPhysician: 'DR^SMITH^ROBERT'
  };
  
  try {
    const result = await worklistService.createWorklist(worklistData);
    
    if (result.success) {
      console.log('✅ Worklist created successfully!');
      console.log(`📁 File: ${result.data.filename}`);
      console.log(`📍 Path: ${result.data.filepath}`);
      console.log(`📊 Size: ${result.data.size} bytes`);
    } else {
      console.log('❌ Failed to create worklist:', result.message);
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Run if called directly
if (require.main === module) {
  createWorklist();
}

module.exports = createWorklist;
