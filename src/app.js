const path = require('path');

// Fastify plugin
async function app(fastify, options) {
  const { PrismaClient } = require('@prisma/client');
  const prisma = new PrismaClient();

  // Register plugins
  await fastify.register(require('@fastify/cors'), {
    origin: true
  });

  await fastify.register(require('@fastify/env'), {
    schema: {
      type: 'object',
      required: ['DATABASE_URL'],
      properties: {
        PORT: {
          type: 'string',
          default: '3000'
        },
        NODE_ENV: {
          type: 'string',
          default: 'development'
        },
        DATABASE_URL: {
          type: 'string'
        }
      }
    }
  });

  // Add Prisma to Fastify context
  fastify.decorate('prisma', prisma);

  // Register routes
  await fastify.register(require('./routes/orthancWorklistRoutes'), { prefix: '/api/orthanc' });
  await fastify.register(require('./routes/dicomInstanceRoutes'), { prefix: '/api/dicom' });

  // Routes
  fastify.get('/', async (request, reply) => {
    return { 
      message: 'Hasta Radiologi API',
      version: '1.0.0',
      status: 'running',
      endpoints: {
        worklists: '/api/orthanc/worklists',
        dicomInstances: '/api/dicom/instances',
        health: '/health'
      }
    };
  });

  // Health check route
  fastify.get('/health', async (request, reply) => {
    try {
      // Test database connection
      await fastify.prisma.$queryRaw`SELECT 1`;
      return { 
        status: 'healthy',
        database: 'connected',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      reply.code(500);
      return { 
        status: 'unhealthy',
        database: 'disconnected',
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  });

  // Graceful shutdown hook
  fastify.addHook('onClose', async (instance) => {
    await instance.prisma.$disconnect();
  });
}

module.exports = app;
