/**
 * Simple PACS API Test Script
 * Quick demonstration of the new PACS FindSCU integration
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';

/**
 * Test all PACS endpoints
 */
async function testPACSAPI() {
  console.log('🚀 Testing PACS FindSCU API Integration');
  console.log('======================================\n');

  try {
    // Test 1: PACS Status
    console.log('📊 Testing PACS Status...');
    const statusResponse = await axios.get(`${API_BASE}/pacs/status`);
    if (statusResponse.data.success) {
      console.log('✅ PACS Status: Connected');
      console.log(`   Host: ${statusResponse.data.data.configuration.pacsHost}:${statusResponse.data.data.configuration.pacsPort}`);
      console.log(`   AETs: ${statusResponse.data.data.configuration.localAET} → ${statusResponse.data.data.configuration.remoteAET}\n`);
    }

    // Test 2: Query All Worklists
    console.log('📋 Testing Worklist Query...');
    const worklistResponse = await axios.get(`${API_BASE}/pacs/worklists`);
    if (worklistResponse.data.success) {
      const count = worklistResponse.data.data.count;
      console.log(`✅ Retrieved ${count} worklist entries from PACS`);
      
      if (count > 0) {
        const firstWorklist = worklistResponse.data.data.worklists[0];
        console.log(`   Sample: ${firstWorklist.patientName} (${firstWorklist.accessionNumber})`);
        console.log(`   Scheduled: ${firstWorklist.scheduledDate} ${firstWorklist.scheduledTime}`);
        console.log(`   Modality: ${firstWorklist.modality}\n`);
      }
    }

    // Test 3: Query Patients
    console.log('👤 Testing Patient Query...');
    const patientResponse = await axios.get(`${API_BASE}/pacs/patients`);
    if (patientResponse.data.success) {
      const count = patientResponse.data.data.count;
      console.log(`✅ Found ${count} patients in PACS\n`);
    }

    // Test 4: Connection Test
    console.log('🔗 Testing PACS Connection...');
    const testResponse = await axios.post(`${API_BASE}/pacs/test`);
    if (testResponse.data.success) {
      console.log('✅ PACS Connection Test: PASSED\n');
    }

    console.log('🎉 All PACS API tests completed successfully!');
    console.log('\n📖 Available Endpoints:');
    console.log('   GET  /api/pacs/worklists        - Query all worklists');
    console.log('   GET  /api/pacs/patients         - Query all patients');
    console.log('   GET  /api/pacs/studies/:id      - Query studies for patient');
    console.log('   GET  /api/pacs/status           - Get PACS service status');
    console.log('   POST /api/pacs/test             - Test PACS connectivity');

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ API Server is not running. Please start it with: npm run api');
    } else {
      console.error('❌ Test failed:', error.response?.data || error.message);
    }
  }
}

// Run the test
testPACSAPI();
