#!/usr/bin/env node

const WorklistAPIServer = require('../lib/apiServer');

/**
 * Start the DICOM Worklist API Server
 */
async function startServer() {
  const server = new WorklistAPIServer();
  
  try {
    await server.start();
    
    // Graceful shutdown handling
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down server...');
      await server.stop();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      console.log('\n🛑 Shutting down server...');
      await server.stop();
      process.exit(0);
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  startServer();
}

module.exports = startServer;
