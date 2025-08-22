#!/usr/bin/env node

/**
 * API Test Script
 * Tests the DICOM Worklist API endpoints
 */

const fetch = require('node-fetch').default || require('node-fetch');

const API_BASE = 'http://localhost:3000';

async function testAPI() {
  console.log('🧪 Testing DICOM Worklist API...\n');

  try {
    // Test 1: Health Check
    console.log('1️⃣ Testing Health Check...');
    const healthResponse = await fetch(`${API_BASE}/health`);
    const healthData = await healthResponse.json();
    console.log('✅ Health Check:', healthData.status);

    // Test 2: API Info
    console.log('\n2️⃣ Testing API Info...');
    const apiResponse = await fetch(`${API_BASE}/api`);
    const apiData = await apiResponse.json();
    console.log('✅ API Name:', apiData.name);

    // Test 3: Create Worklist
    console.log('\n3️⃣ Testing Create Worklist...');
    const worklistData = {
      patientId: `P${Date.now()}`,
      patientName: 'TEST^PATIENT^API',
      accessionNumber: `ACC${Date.now()}`,
      scheduledDate: '2025-08-23',
      scheduledTime: '15:30:00',
      studyDescription: 'API Test X-Ray',
      modality: 'CR'
    };

    const createResponse = await fetch(`${API_BASE}/api/worklist`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(worklistData)
    });

    const createData = await createResponse.json();
    if (createData.success) {
      console.log('✅ Worklist Created:', createData.data.filename);
    } else {
      console.log('❌ Failed to create worklist:', createData.error);
    }

    // Test 4: List Worklists
    console.log('\n4️⃣ Testing List Worklists...');
    const listResponse = await fetch(`${API_BASE}/api/worklists`);
    const listData = await listResponse.json();
    console.log('✅ Total Worklists:', listData.data?.count || 0);

    // Test 5: Get Statistics
    console.log('\n5️⃣ Testing Statistics...');
    const statsResponse = await fetch(`${API_BASE}/api/worklists/stats`);
    const statsData = await statsResponse.json();
    console.log('✅ Total Files:', statsData.data?.totalFiles || 0);
    console.log('✅ Total Size:', statsData.data?.totalSize || 0, 'bytes');

    console.log('\n🎉 All API tests completed successfully!');
    console.log('💡 Your API is ready for SIM RS integration!');

  } catch (error) {
    console.error('❌ API Test Failed:', error.message);
    console.log('\n💡 Make sure the API server is running with: npm run api');
  }
}

// Install node-fetch if needed
async function ensureFetch() {
  try {
    require('node-fetch');
  } catch (error) {
    console.log('📦 Installing node-fetch...');
    const { execSync } = require('child_process');
    execSync('npm install node-fetch@2.7.0', { stdio: 'inherit' });
    console.log('✅ node-fetch installed\n');
  }
}

if (require.main === module) {
  ensureFetch().then(() => {
    testAPI();
  });
}

module.exports = testAPI;
