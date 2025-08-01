const OrthancWorklistService = require('../services/orthancWorklistService');

/**
 * Orthanc Worklist Controller
 * Handles HTTP requests for worklist operations
 */
class OrthancWorklistController {
  constructor() {
    this.worklistService = new OrthancWorklistService();
  }

  /**
   * Register all worklist routes
   * @param {Object} fastify - Fastify instance
   */
  registerRoutes(fastify) {
    // Create a single worklist
    fastify.post('/api/worklist', {
      schema: {
        body: {
          type: 'object',
          required: ['patientId', 'patientName', 'patientBirthDate', 'patientSex', 'accessionNumber', 'scheduledDate'],
          properties: {
            patientId: { type: 'string' },
            patientName: { type: 'string' },
            patientBirthDate: { type: 'string', format: 'date' },
            patientSex: { type: 'string', enum: ['M', 'F', 'U'] },
            accessionNumber: { type: 'string' },
            studyDescription: { type: 'string' },
            scheduledDate: { type: 'string', format: 'date' },
            scheduledTime: { type: 'string' },
            modality: { type: 'string' },
            scheduledStationAETitle: { type: 'string' },
            scheduledProcedureStepDescription: { type: 'string' },
            requestedProcedureDescription: { type: 'string' },
            referringPhysician: { type: 'string' },
            performingPhysician: { type: 'string' },
            institutionName: { type: 'string' },
            departmentName: { type: 'string' }
          }
        }
      }
    }, this.createWorklist.bind(this));

    // Create multiple worklists
    fastify.post('/api/worklist/batch', {
      schema: {
        body: {
          type: 'object',
          required: ['worklists'],
          properties: {
            worklists: {
              type: 'array',
              items: {
                type: 'object',
                required: ['patientId', 'patientName', 'patientBirthDate', 'patientSex', 'accessionNumber', 'scheduledDate']
              }
            }
          }
        }
      }
    }, this.createWorklistBatch.bind(this));

    // Get all worklists
    fastify.get('/api/worklist', this.getAllWorklists.bind(this));

    // Get worklist statistics
    fastify.get('/api/worklist/stats', this.getWorklistStats.bind(this));

    // Delete a worklist
    fastify.delete('/api/worklist/:filename', {
      schema: {
        params: {
          type: 'object',
          properties: {
            filename: { type: 'string' }
          }
        }
      }
    }, this.deleteWorklist.bind(this));

    // Clean up old worklists
    fastify.delete('/api/worklist/cleanup/:days', {
      schema: {
        params: {
          type: 'object',
          properties: {
            days: { type: 'number', minimum: 1 }
          }
        }
      }
    }, this.cleanupOldWorklists.bind(this));

    // Generate sample worklist data
    fastify.get('/api/worklist/sample', this.generateSampleData.bind(this));

    // Download worklist file
    fastify.get('/api/worklist/download/:filename', {
      schema: {
        params: {
          type: 'object',
          properties: {
            filename: { type: 'string' }
          }
        }
      }
    }, this.downloadWorklist.bind(this));
  }

  /**
   * Create a single worklist
   */
  async createWorklist(request, reply) {
    try {
      const result = await this.worklistService.createWorklist(request.body);
      
      if (result.success) {
        reply.code(201).send(result);
      } else {
        reply.code(400).send(result);
      }
    } catch (error) {
      reply.code(500).send({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Create multiple worklists
   */
  async createWorklistBatch(request, reply) {
    try {
      const { worklists } = request.body;
      const result = await this.worklistService.createWorklistBatch(worklists);
      
      if (result.success) {
        reply.code(201).send(result);
      } else {
        reply.code(400).send(result);
      }
    } catch (error) {
      reply.code(500).send({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get all worklists
   */
  async getAllWorklists(request, reply) {
    try {
      const result = await this.worklistService.getAllWorklists();
      reply.send(result);
    } catch (error) {
      reply.code(500).send({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Get worklist statistics
   */
  async getWorklistStats(request, reply) {
    try {
      const result = await this.worklistService.getWorklistStats();
      reply.send(result);
    } catch (error) {
      reply.code(500).send({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Delete a worklist
   */
  async deleteWorklist(request, reply) {
    try {
      const { filename } = request.params;
      const result = await this.worklistService.deleteWorklist(filename);
      
      if (result.success) {
        reply.send(result);
      } else {
        reply.code(404).send(result);
      }
    } catch (error) {
      reply.code(500).send({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Clean up old worklists
   */
  async cleanupOldWorklists(request, reply) {
    try {
      const { days } = request.params;
      const result = await this.worklistService.cleanupOldWorklists(parseInt(days));
      reply.send(result);
    } catch (error) {
      reply.code(500).send({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Generate sample worklist data
   */
  async generateSampleData(request, reply) {
    try {
      const sampleData = this.worklistService.generateSampleData();
      reply.send({
        success: true,
        message: 'Sample data generated',
        data: sampleData
      });
    } catch (error) {
      reply.code(500).send({
        success: false,
        message: 'Internal server error',
        error: error.message
      });
    }
  }

  /**
   * Download worklist file
   */
  async downloadWorklist(request, reply) {
    try {
      const { filename } = request.params;
      const path = require('path');
      const fs = require('fs').promises;
      
      const worklistDir = path.join(process.cwd(), 'worklists');
      const filepath = path.join(worklistDir, filename);
      
      // Check if file exists
      await fs.access(filepath);
      
      // Set headers for file download
      reply.header('Content-Disposition', `attachment; filename="${filename}"`);
      reply.header('Content-Type', 'application/octet-stream');
      
      // Send file
      const fileStream = require('fs').createReadStream(filepath);
      reply.send(fileStream);
      
    } catch (error) {
      reply.code(404).send({
        success: false,
        message: 'Worklist file not found',
        error: error.message
      });
    }
  }
}

module.exports = OrthancWorklistController;
