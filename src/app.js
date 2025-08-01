const fastify = require('fastify')({ logger: true });
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Register plugins
fastify.register(require('@fastify/cors'), {
  origin: true
});

fastify.register(require('@fastify/env'), {
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

// Routes
fastify.get('/', async (request, reply) => {
  return { 
    message: 'Hasta Radiologi API',
    version: '1.0.0',
    status: 'running'
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

// Example API route
fastify.get('/api/users', async (request, reply) => {
  try {
    const users = await fastify.prisma.user.findMany();
    return { data: users };
  } catch (error) {
    reply.code(500);
    return { error: error.message };
  }
});

// Graceful shutdown
const gracefulShutdown = async () => {
  await fastify.prisma.$disconnect();
  process.exit(0);
};

process.on('SIGINT', gracefulShutdown);
process.on('SIGTERM', gracefulShutdown);

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost';
    
    await fastify.listen({ port: parseInt(port), host });
    fastify.log.info(`Server running on http://${host}:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

if (require.main === module) {
  start();
}

module.exports = fastify;
