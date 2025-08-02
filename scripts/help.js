#!/usr/bin/env node

console.log('🏥 Hasta Radiologi DICOM Commands\n');

console.log('📋 Quick One-Liner Commands:');
console.log('');

console.log('🚀 Basic Commands:');
console.log('  npm run quick:demo         - Run your existing transmission test');
console.log('  npm run quick:single       - Create and send single DICOM instance');
console.log('  npm run quick:batch        - Create and send 5 patient batch');
console.log('');

console.log('🎯 Demo Commands:');
console.log('  npm run demo:create-send   - Single patient demo (CT Abdomen)');
console.log('  npm run demo:batch         - Multi-patient demo (5 different modalities)');
console.log('  npm run dicom:send-demo    - Alias for demo:create-send');
console.log('  npm run dicom:send-batch   - Alias for demo:batch');
console.log('');

console.log('🧪 Test Commands:');
console.log('  npm run test:transmission  - Your original test script');
console.log('  npm run test:instance      - Test DICOM instance creation');
console.log('  npm run test:workflow      - Complete workflow test');
console.log('');

console.log('🏥 Server Commands:');
console.log('  npm run dev                - Start development server');
console.log('  npm start                  - Start production server');
console.log('');

console.log('�️ PACS Viewer Commands:');
console.log('  npm run setup:pacs         - Setup OHIF PACS viewer');
console.log('  npm run start:pacs         - Start PACS viewer');
console.log('  npm run pacs:setup         - Alias for setup:pacs');
console.log('  npm run pacs:start         - Alias for start:pacs');
console.log('  npm run viewer:setup       - Alias for setup:pacs');
console.log('  npm run viewer:start       - Alias for start:pacs');
console.log('');

console.log('�📡 Example Usage:');
console.log('');
console.log('  # Create and send a single patient:');
console.log('  npm run quick:single');
console.log('');
console.log('  # Create and send 5 patients with different modalities:');
console.log('  npm run quick:batch');
console.log('');
console.log('  # Run your existing test:');
console.log('  npm run quick:demo');
console.log('');

console.log('🌐 After running any command, check Orthanc at:');
console.log('   http://localhost:8042/app/explorer.html');
console.log('');

console.log('�️ To view DICOM images in PACS viewer:');
console.log('  1. npm run setup:pacs      # Setup viewer (first time only)');
console.log('  2. npm run start:pacs      # Start viewer at http://localhost:3000');
console.log('');

console.log('�📝 Need to modify patient data?');
console.log('   Edit: examples/create-and-send-example.js');
console.log('   Edit: examples/batch-create-send.js');
console.log('');

console.log('💡 Tips:');
console.log('  - Make sure Orthanc is running on localhost:4242 (DICOM) and :8042 (Web)');
console.log('  - Each command creates DICOM files with all required tags');
console.log('  - PACS viewer connects to Orthanc at localhost:8042');
console.log('  - Use npm run quick:demo to add test data, then view in PACS');
console.log('  - No more "missing required tags" errors! 🎉');
console.log('');
