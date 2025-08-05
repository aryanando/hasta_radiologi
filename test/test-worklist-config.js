// Test script to verify worklist directory configuration
require('dotenv').config();
const path = require('path');

console.log('=== Worklist Directory Configuration Test ===');
console.log(`Environment ORTHANC_WORKLIST_DIR: ${process.env.ORTHANC_WORKLIST_DIR}`);

// Test the DicomWorklistGenerator
const DicomWorklistGenerator = require('../src/generators/dicomWorklistGenerator');

const generator = new DicomWorklistGenerator();
console.log('✅ DicomWorklistGenerator created successfully');
console.log('📁 Configured worklist directory:', generator.worklistDir);

// Check if directory exists
const fs = require('fs').promises;

async function testDirectory() {
  try {
    const stats = await fs.stat(generator.worklistDir);
    if (stats.isDirectory()) {
      console.log('✅ Worklist directory exists and is accessible');
      
      // List existing files
      const files = await fs.readdir(generator.worklistDir);
      const wlFiles = files.filter(f => f.endsWith('.wl'));
      console.log(`📄 Found ${wlFiles.length} .wl files in directory`);
      
      if (wlFiles.length > 0) {
        console.log('📋 Recent worklist files:');
        wlFiles.slice(-3).forEach(file => console.log(`   - ${file}`));
      }
    }
  } catch (error) {
    console.log('❌ Error accessing worklist directory:', error.message);
  }
}

testDirectory();
