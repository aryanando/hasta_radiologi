/**
 * PACS FindSCU API Integration Examples
 * Demonstrates how to use the new PACS endpoints
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

/**
 * Example: Query all worklists from PACS
 */
async function queryAllWorklists() {
  try {
    console.log('\n🔍 Querying all worklists from PACS...\n');
    
    const response = await axios.get(`${API_BASE}/pacs/worklists`);
    
    if (response.data.success) {
      const { count, worklists, pacsHost, pacsPort, queriedAt } = response.data.data;
      
      console.log(`✅ Found ${count} worklist entries from ${pacsHost}:${pacsPort}`);
      console.log(`📅 Queried at: ${queriedAt}\n`);
      
      worklists.forEach((worklist, index) => {
        console.log(`📋 Worklist ${index + 1}:`);
        console.log(`   Patient: ${worklist.patientName} (ID: ${worklist.patientId})`);
        console.log(`   Accession: ${worklist.accessionNumber}`);
        console.log(`   Modality: ${worklist.modality}`);
        console.log(`   Scheduled: ${worklist.scheduledDate} ${worklist.scheduledTime}`);
        console.log(`   Station AET: ${worklist.scheduledStationAETitle}`);
        console.log('');
      });
      
      return worklists;
    } else {
      console.error('❌ Failed to query worklists:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error querying worklists:', error.response?.data || error.message);
  }
}

/**
 * Example: Query patients from PACS
 */
async function queryPatients(patientName = '*') {
  try {
    console.log(`\n👤 Querying patients matching: "${patientName}"\n`);
    
    const response = await axios.get(`${API_BASE}/pacs/patients`, {
      params: { patientName }
    });
    
    if (response.data.success) {
      const { count, patients, queriedAt } = response.data.data;
      
      console.log(`✅ Found ${count} patients`);
      console.log(`📅 Queried at: ${queriedAt}\n`);
      
      patients.forEach((patient, index) => {
        console.log(`👤 Patient ${index + 1}:`);
        console.log(`   Name: ${patient.patientName}`);
        console.log(`   ID: ${patient.patientId}`);
        console.log(`   Birth Date: ${patient.patientBirthDate || 'N/A'}`);
        console.log(`   Sex: ${patient.patientSex || 'N/A'}`);
        console.log('');
      });
      
      return patients;
    } else {
      console.error('❌ Failed to query patients:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error querying patients:', error.response?.data || error.message);
  }
}

/**
 * Example: Query studies for a specific patient
 */
async function queryStudies(patientId) {
  try {
    console.log(`\n📊 Querying studies for patient: ${patientId}\n`);
    
    const response = await axios.get(`${API_BASE}/pacs/studies/${patientId}`);
    
    if (response.data.success) {
      const { count, studies, queriedAt } = response.data.data;
      
      console.log(`✅ Found ${count} studies for patient ${patientId}`);
      console.log(`📅 Queried at: ${queriedAt}\n`);
      
      studies.forEach((study, index) => {
        console.log(`📊 Study ${index + 1}:`);
        console.log(`   UID: ${study.studyInstanceUID}`);
        console.log(`   Description: ${study.studyDescription || 'N/A'}`);
        console.log(`   Date: ${study.studyDate} ${study.studyTime || ''}`);
        console.log(`   Accession: ${study.accessionNumber || 'N/A'}`);
        console.log('');
      });
      
      return studies;
    } else {
      console.error('❌ Failed to query studies:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error querying studies:', error.response?.data || error.message);
  }
}

/**
 * Example: Test PACS connectivity
 */
async function testPACSConnection() {
  try {
    console.log('\n🔗 Testing PACS connectivity...\n');
    
    const response = await axios.post(`${API_BASE}/pacs/test`);
    
    if (response.data.success) {
      const { pacsHost, pacsPort, localAET, remoteAET, testedAt } = response.data.data;
      
      console.log('✅ PACS connection successful!');
      console.log(`📡 PACS Server: ${pacsHost}:${pacsPort}`);
      console.log(`🏷️  Local AET: ${localAET}`);
      console.log(`🏷️  Remote AET: ${remoteAET}`);
      console.log(`📅 Tested at: ${testedAt}\n`);
      
      return true;
    } else {
      console.error('❌ PACS connection failed:', response.data.error);
      return false;
    }
  } catch (error) {
    console.error('❌ Error testing PACS connection:', error.response?.data || error.message);
    return false;
  }
}

/**
 * Example: Get PACS service status
 */
async function getPACSStatus() {
  try {
    console.log('\n📊 Getting PACS service status...\n');
    
    const response = await axios.get(`${API_BASE}/pacs/status`);
    
    if (response.data.success) {
      const status = response.data.data;
      
      console.log(`🚀 Service: ${status.service} v${status.version}`);
      console.log(`🐳 Container: ${status.container}`);
      console.log('\n⚙️  Configuration:');
      console.log(`   PACS Host: ${status.configuration.pacsHost}`);
      console.log(`   PACS Port: ${status.configuration.pacsPort}`);
      console.log(`   Local AET: ${status.configuration.localAET}`);
      console.log(`   Remote AET: ${status.configuration.remoteAET}`);
      
      console.log('\n🔗 Connectivity:');
      if (status.connectivity.success) {
        console.log('   Status: ✅ Connected');
      } else {
        console.log('   Status: ❌ Connection Failed');
        console.log(`   Error: ${status.connectivity.error}`);
      }
      
      console.log(`📅 Last checked: ${status.lastChecked}\n`);
      
      return status;
    } else {
      console.error('❌ Failed to get PACS status:', response.data.error);
    }
  } catch (error) {
    console.error('❌ Error getting PACS status:', error.response?.data || error.message);
  }
}

/**
 * Example: Search for specific patient by name
 */
async function searchPatientByName(patientName) {
  try {
    console.log(`\n🔍 Searching for patient: "${patientName}"\n`);
    
    // First query patients
    const patients = await queryPatients(patientName);
    
    if (patients && patients.length > 0) {
      console.log(`📋 Now querying worklists for found patients...\n`);
      
      // Then query worklists to see their scheduled procedures
      const worklists = await queryAllWorklists();
      
      if (worklists) {
        // Filter worklists for the found patients
        const matchingWorklists = worklists.filter(wl => 
          patients.some(p => p.patientId === wl.patientId)
        );
        
        console.log(`🎯 Found ${matchingWorklists.length} scheduled procedures for "${patientName}"`);
        
        return {
          patients,
          worklists: matchingWorklists
        };
      }
    }
  } catch (error) {
    console.error('❌ Error in patient search:', error.message);
  }
}

/**
 * Main demo function
 */
async function runDemo() {
  console.log('🚀 PACS FindSCU API Integration Demo');
  console.log('=====================================');
  
  try {
    // Test connection first
    const connected = await testPACSConnection();
    
    if (connected) {
      // Get service status
      await getPACSStatus();
      
      // Query all worklists
      await queryAllWorklists();
      
      // Query all patients
      await queryPatients();
      
      // Search for specific patient
      await searchPatientByName('DOE^JOHN');
      
      // Query studies for a specific patient
      await queryStudies('P140');
      
    } else {
      console.log('\n❌ Cannot continue demo - PACS connection failed');
    }
  } catch (error) {
    console.error('❌ Demo failed:', error.message);
  }
  
  console.log('\n✅ Demo completed!');
}

// Export functions for use in other modules
module.exports = {
  queryAllWorklists,
  queryPatients,
  queryStudies,
  testPACSConnection,
  getPACSStatus,
  searchPatientByName,
  runDemo
};

// Run demo if this file is executed directly
if (require.main === module) {
  runDemo();
}
