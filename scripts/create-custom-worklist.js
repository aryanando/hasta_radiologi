#!/usr/bin/env node
/**
 * Create Custom DICOM Worklist File
 * Generates a specific worklist with custom patient and procedure data
 */

const path = require('path');
const fs = require('fs').promises;

// Import the worklist service
const OrthancWorklistService = require('../src/services/orthancWorklistService');

async function createCustomWorklist() {
    console.log('🏥 Creating Custom DICOM Worklist File');
    console.log('=' * 40);
    console.log('');
    
    try {
        const worklistService = new OrthancWorklistService();
        
        // Custom worklist data
        const customWorklistData = {
            // Patient Information
            patientId: 'CUSTOM_P001',
            patientName: 'HASTA^PATIENT^CUSTOM',
            patientBirthDate: '1985-03-15',
            patientSex: 'F',
            
            // Study Information
            accessionNumber: 'ACC_CUSTOM_001',
            studyDescription: 'Custom Chest X-Ray Study',
            studyInstanceUID: '1.2.840.113619.2.176.2025.1.08.04.' + Date.now(),
            
            // Scheduling Information
            scheduledDate: '2025-08-05',
            scheduledTime: '14:30',
            
            // Procedure Information
            modality: 'CR',
            scheduledStationAETitle: 'XRAY_ROOM_1',
            scheduledProcedureStepDescription: 'Chest X-Ray PA and Lateral Views',
            scheduledProcedureStepID: 'SPS_' + Date.now(),
            requestedProcedureDescription: 'Chest X-Ray - Custom Protocol',
            requestedProcedureID: 'RP_' + Date.now(),
            
            // Physician Information
            referringPhysician: 'DR^HASTA^REFERRING',
            performingPhysician: 'DR^CUSTOM^RADIOLOGIST',
            
            // Institution Information
            institutionName: 'Hasta Radiologi Hospital',
            departmentName: 'Radiology Department'
        };
        
        console.log('📋 Worklist Data:');
        console.log(`   Patient: ${customWorklistData.patientName}`);
        console.log(`   Patient ID: ${customWorklistData.patientId}`);
        console.log(`   Accession: ${customWorklistData.accessionNumber}`);
        console.log(`   Study: ${customWorklistData.studyDescription}`);
        console.log(`   Date/Time: ${customWorklistData.scheduledDate} ${customWorklistData.scheduledTime}`);
        console.log(`   Modality: ${customWorklistData.modality}`);
        console.log('');
        
        // Create the worklist
        console.log('⏳ Generating DICOM worklist file...');
        const result = await worklistService.createWorklist(customWorklistData);
        
        if (result.success) {
            console.log('✅ Custom worklist created successfully!');
            console.log(`📁 Filename: ${result.data.filename}`);
            console.log(`📍 Path: ${result.data.filepath}`);
            console.log(`📊 Size: ${result.data.size} bytes`);
            
            // Copy to Orthanc directory
            const orthancWorklistDir = path.join(__dirname, '../../orthanc-mwl/worklists');
            const sourceFile = result.data.filepath;
            const destFile = path.join(orthancWorklistDir, result.data.filename);
            
            console.log('');
            console.log('📋 Copying to Orthanc worklist directory...');
            
            try {
                await fs.copyFile(sourceFile, destFile);
                console.log('✅ File copied to Orthanc worklists directory');
                console.log(`📂 Orthanc path: ${destFile}`);
            } catch (copyError) {
                console.log('⚠️  Note: Could not copy to Orthanc directory');
                console.log(`   Manual copy needed: ${sourceFile} → ${orthancWorklistDir}`);
            }
            
            console.log('');
            console.log('🎉 Custom worklist file created successfully!');
            
        } else {
            console.log('❌ Failed to create worklist:');
            console.log(`   Error: ${result.message}`);
        }
        
    } catch (error) {
        console.log('❌ Error creating custom worklist:');
        console.log(`   ${error.message}`);
    }
}

// Run if called directly
if (require.main === module) {
    createCustomWorklist()
        .then(() => process.exit(0))
        .catch(error => {
            console.error('Script error:', error);
            process.exit(1);
        });
}

module.exports = createCustomWorklist;
