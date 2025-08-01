const fastify = require('fastify')({ 
  logger: {
    level: 'info',
    prettyPrint: process.env.NODE_ENV === 'development'
  }
});

// Start server function
async function start() {
  try {
    // Load environment variables
    require('dotenv').config();
    
    // Register the main app
    await fastify.register(require('./app'));
    
    // Start listening
    const port = process.env.PORT || 3000;
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    
    await fastify.listen({ port: parseInt(port), host });
    
    console.log(`🚀 Server running on http://${host}:${port}`);
    console.log(`📋 API Documentation: http://${host}:${port}/documentation`);
    console.log(`🏥 Orthanc Worklists: http://${host}:${port}/api/orthanc/worklists`);
    console.log(`🔬 DICOM Instances: http://${host}:${port}/api/dicom/instances`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  try {
    await fastify.close();
    console.log('✅ Server closed successfully');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the server
start();
