const OrthancWorklistController = require('../controllers/orthancWorklistController');

/**
 * Orthanc Worklist Routes
 * Routes for DICOM worklist management operations
 */
async function orthancWorklistRoutes(fastify, options) {
  const controller = new OrthancWorklistController();

  // Create a new worklist entry
  fastify.post('/worklists', {
    schema: {
      description: 'Create a new DICOM worklist entry',
      tags: ['Orthanc Worklists'],
      body: {
        type: 'object',
        required: ['patientId', 'patientName'],
        properties: {
          patientId: { type: 'string', description: 'Patient ID' },
          patientName: { type: 'string', description: 'Patient name' },
          patientBirthDate: { type: 'string', description: 'Patient birth date (YYYYMMDD)' },
          patientSex: { type: 'string', description: 'Patient sex (M/F/O)' },
          studyInstanceUID: { type: 'string', description: 'Study Instance UID' },
          accessionNumber: { type: 'string', description: 'Accession number' },
          scheduledStationAETitle: { type: 'string', description: 'Scheduled station AE title' },
          scheduledProcedureStepStartDate: { type: 'string', description: 'Scheduled procedure step start date' },
          scheduledProcedureStepStartTime: { type: 'string', description: 'Scheduled procedure step start time' },
          modality: { type: 'string', description: 'Modality' },
          scheduledProcedureStepDescription: { type: 'string', description: 'Scheduled procedure step description' },
          scheduledProcedureStepID: { type: 'string', description: 'Scheduled procedure step ID' },
          requestedProcedureID: { type: 'string', description: 'Requested procedure ID' },
          requestedProcedureDescription: { type: 'string', description: 'Requested procedure description' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, controller.createWorklist.bind(controller));

  // Create multiple worklist entries
  fastify.post('/worklists/batch', {
    schema: {
      description: 'Create multiple DICOM worklist entries',
      tags: ['Orthanc Worklists'],
      body: {
        type: 'array',
        items: {
          type: 'object',
          required: ['patientId', 'patientName'],
          properties: {
            patientId: { type: 'string' },
            patientName: { type: 'string' },
            patientBirthDate: { type: 'string' },
            patientSex: { type: 'string' },
            accessionNumber: { type: 'string' },
            modality: { type: 'string' }
          }
        }
      }
    }
  }, controller.createWorklistBatch.bind(controller));

  // Get all worklist files
  fastify.get('/worklists', {
    schema: {
      description: 'Get all DICOM worklist files',
      tags: ['Orthanc Worklists'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                count: { type: 'number' },
                files: {
                  type: 'array',
                  items: {
                    type: 'object',
                    properties: {
                      filename: { type: 'string' },
                      filepath: { type: 'string' },
                      size: { type: 'number' },
                      created: { type: 'string' },
                      modified: { type: 'string' }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, controller.getAllWorklists.bind(controller));

  // Delete a worklist file
  fastify.delete('/worklists/:filename', {
    schema: {
      description: 'Delete a DICOM worklist file',
      tags: ['Orthanc Worklists'],
      params: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'Worklist filename to delete' }
        }
      }
    }
  }, controller.deleteWorklist.bind(controller));

  // Clean up old worklist files
  fastify.post('/worklists/cleanup', {
    schema: {
      description: 'Clean up old DICOM worklist files',
      tags: ['Orthanc Worklists'],
      body: {
        type: 'object',
        properties: {
          daysOld: { type: 'number', description: 'Delete files older than X days (default: 30)' }
        }
      }
    }
  }, controller.cleanupOldWorklists.bind(controller));

  // Get worklist statistics
  fastify.get('/worklists/stats', {
    schema: {
      description: 'Get DICOM worklist statistics',
      tags: ['Orthanc Worklists'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, controller.getWorklistStats.bind(controller));

  // Create sample worklist
  fastify.post('/worklists/sample', {
    schema: {
      description: 'Create a sample DICOM worklist for testing',
      tags: ['Orthanc Worklists'],
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: { type: 'object' }
          }
        }
      }
    }
  }, controller.createSampleWorklist.bind(controller));
}

module.exports = orthancWorklistRoutes;
