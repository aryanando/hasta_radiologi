const DicomInstanceController = require('../controllers/dicomInstanceController');

/**
 * DICOM Instance Routes
 * Routes for DICOM instance management and operations
 */
async function dicomInstanceRoutes(fastify, options) {
  const controller = new DicomInstanceController();

  // Create a new DICOM instance
  fastify.post('/instances', {
    schema: {
      description: 'Create a new DICOM instance with all required tags',
      tags: ['DICOM Instances'],
      body: {
        type: 'object',
        required: ['patientID'],
        properties: {
          patientID: { type: 'string', description: 'Patient ID (required)' },
          patientName: { type: 'string', description: 'Patient name in DICOM format (Lastname^Firstname^Middle)' },
          patientBirthDate: { type: 'string', description: 'Patient birth date (YYYYMMDD)' },
          patientSex: { type: 'string', description: 'Patient sex (M/F/O)' },
          studyDescription: { type: 'string', description: 'Study description' },
          seriesDescription: { type: 'string', description: 'Series description' },
          modality: { type: 'string', description: 'Modality (CR, CT, MR, etc.)' },
          accessionNumber: { type: 'string', description: 'Accession number' },
          institutionName: { type: 'string', description: 'Institution name' },
          referringPhysicianName: { type: 'string', description: 'Referring physician name' },
          performingPhysicianName: { type: 'string', description: 'Performing physician name' }
        }
      },
      response: {
        201: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                filename: { type: 'string' },
                filepath: { type: 'string' },
                uids: {
                  type: 'object',
                  properties: {
                    studyInstanceUID: { type: 'string' },
                    seriesInstanceUID: { type: 'string' },
                    sopInstanceUID: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      }
    }
  }, controller.createInstance.bind(controller));

  // Create multiple DICOM instances
  fastify.post('/instances/batch', {
    schema: {
      description: 'Create multiple DICOM instances in batch',
      tags: ['DICOM Instances'],
      body: {
        type: 'array',
        items: {
          type: 'object',
          required: ['patientID'],
          properties: {
            patientID: { type: 'string' },
            patientName: { type: 'string' },
            patientBirthDate: { type: 'string' },
            patientSex: { type: 'string' },
            studyDescription: { type: 'string' },
            seriesDescription: { type: 'string' },
            modality: { type: 'string' },
            accessionNumber: { type: 'string' }
          }
        }
      }
    }
  }, controller.createInstanceBatch.bind(controller));

  // Get all DICOM instances
  fastify.get('/instances', {
    schema: {
      description: 'Get list of all DICOM instances',
      tags: ['DICOM Instances'],
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
  }, controller.getAllInstances.bind(controller));

  // Validate a DICOM instance
  fastify.get('/instances/:filename/validate', {
    schema: {
      description: 'Validate a DICOM instance file',
      tags: ['DICOM Instances'],
      params: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'DICOM filename' }
        }
      }
    }
  }, controller.validateInstance.bind(controller));

  // Delete a DICOM instance
  fastify.delete('/instances/:filename', {
    schema: {
      description: 'Delete a DICOM instance file',
      tags: ['DICOM Instances'],
      params: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'DICOM filename to delete' }
        }
      }
    }
  }, controller.deleteInstance.bind(controller));

  // Send DICOM instance to Orthanc
  fastify.post('/instances/:filename/send', {
    schema: {
      description: 'Send DICOM instance to Orthanc server',
      tags: ['DICOM Instances'],
      params: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'DICOM filename to send' }
        }
      },
      body: {
        type: 'object',
        properties: {
          host: { type: 'string', description: 'Orthanc host (default: localhost)' },
          port: { type: 'number', description: 'Orthanc port (default: 4242)' },
          aet: { type: 'string', description: 'Orthanc AE Title (default: ORTHANC)' },
          sourceAet: { type: 'string', description: 'Source AE Title (default: HASTA_RADIOLOGI)' }
        }
      }
    }
  }, controller.sendToOrthanc.bind(controller));

  // Check DCMTK tools status
  fastify.get('/tools-status', {
    schema: {
      description: 'Check availability of DCMTK tools',
      tags: ['DICOM Tools'],
      response: {
        200: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            message: { type: 'string' },
            data: {
              type: 'object',
              additionalProperties: { type: 'string' }
            }
          }
        }
      }
    }
  }, controller.checkToolsStatus.bind(controller));

  // Create sample DICOM instance
  fastify.post('/instances/sample', {
    schema: {
      description: 'Create a sample DICOM instance for testing',
      tags: ['DICOM Instances'],
      body: {
        type: 'object',
        properties: {
          patientID: { type: 'string', description: 'Override patient ID' },
          patientName: { type: 'string', description: 'Override patient name' },
          modality: { type: 'string', description: 'Override modality' },
          studyDescription: { type: 'string', description: 'Override study description' }
        }
      }
    }
  }, controller.createSampleInstance.bind(controller));

  // Download DICOM instance file
  fastify.get('/instances/:filename/download', {
    schema: {
      description: 'Download DICOM instance file',
      tags: ['DICOM Instances'],
      params: {
        type: 'object',
        properties: {
          filename: { type: 'string', description: 'DICOM filename to download' }
        }
      }
    }
  }, controller.downloadInstance.bind(controller));
}

module.exports = dicomInstanceRoutes;
