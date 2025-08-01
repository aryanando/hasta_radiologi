const DicomInstanceService = require('../services/dicomInstanceService');

/**
 * DICOM Instance Controller
 * Handles HTTP requests for DICOM instance operations
 */
class DicomInstanceController {
  constructor() {
    this.instanceService = new DicomInstanceService();
  }

  /**
   * Create a new DICOM instance
   * POST /api/dicom/instances
   */
  async createInstance(request, reply) {
    try {
      const instanceData = request.body;
      
      if (!instanceData.patientID) {
        return reply.status(400).send({
          success: false,
          message: 'PatientID is required',
          data: null
        });
      }

      const result = await this.instanceService.createDicomInstance(instanceData);
      
      if (result.success) {
        return reply.status(201).send(result);
      } else {
        return reply.status(500).send(result);
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * Create multiple DICOM instances
   * POST /api/dicom/instances/batch
   */
  async createInstanceBatch(request, reply) {
    try {
      const instancesData = request.body.instances || request.body;
      
      if (!Array.isArray(instancesData)) {
        return reply.status(400).send({
          success: false,
          message: 'Request body must be an array of instance data',
          data: null
        });
      }

      const result = await this.instanceService.createInstanceBatch(instancesData);
      
      if (result.success) {
        return reply.status(201).send(result);
      } else {
        return reply.status(500).send(result);
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * Get all DICOM instances
   * GET /api/dicom/instances
   */
  async getAllInstances(request, reply) {
    try {
      const result = await this.instanceService.listInstances();
      
      if (result.success) {
        return reply.send(result);
      } else {
        return reply.status(500).send(result);
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * Validate a DICOM instance
   * GET /api/dicom/instances/:filename/validate
   */
  async validateInstance(request, reply) {
    try {
      const { filename } = request.params;
      
      if (!filename) {
        return reply.status(400).send({
          success: false,
          message: 'Filename is required',
          data: null
        });
      }

      const result = await this.instanceService.validateInstance(filename);
      
      if (result.success) {
        return reply.send(result);
      } else {
        return reply.status(500).send(result);
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * Delete a DICOM instance
   * DELETE /api/dicom/instances/:filename
   */
  async deleteInstance(request, reply) {
    try {
      const { filename } = request.params;
      
      if (!filename) {
        return reply.status(400).send({
          success: false,
          message: 'Filename is required',
          data: null
        });
      }

      const result = await this.instanceService.deleteInstance(filename);
      
      if (result.success) {
        return reply.send(result);
      } else {
        return reply.status(500).send(result);
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * Send DICOM instance to Orthanc
   * POST /api/dicom/instances/:filename/send
   */
  async sendToOrthanc(request, reply) {
    try {
      const { filename } = request.params;
      const orthancConfig = request.body || {};
      
      if (!filename) {
        return reply.status(400).send({
          success: false,
          message: 'Filename is required',
          data: null
        });
      }

      const result = await this.instanceService.sendToOrthanc(filename, orthancConfig);
      
      if (result.success) {
        return reply.send(result);
      } else {
        return reply.status(500).send(result);
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * Check DCMTK tools availability
   * GET /api/dicom/tools-status
   */
  async checkToolsStatus(request, reply) {
    try {
      const result = await this.instanceService.checkDcmtkAvailability();
      
      if (result.success) {
        return reply.send(result);
      } else {
        return reply.status(500).send(result);
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * Create a sample DICOM instance for testing
   * POST /api/dicom/instances/sample
   */
  async createSampleInstance(request, reply) {
    try {
      // Generate sample data with optional overrides from request body
      const overrides = request.body || {};
      
      const sampleData = {
        patientID: overrides.patientID || `SAMPLE_${Date.now()}`,
        patientName: overrides.patientName || 'SAMPLE^PATIENT^TEST',
        patientBirthDate: overrides.patientBirthDate || '19900101',
        patientSex: overrides.patientSex || 'M',
        studyDescription: overrides.studyDescription || 'Sample Study for Testing',
        seriesDescription: overrides.seriesDescription || 'Sample Series',
        modality: overrides.modality || 'CR',
        accessionNumber: overrides.accessionNumber || `SAMPLE_ACC_${Date.now()}`,
        institutionName: overrides.institutionName || 'Hasta Radiologi',
        referringPhysicianName: overrides.referringPhysicianName || 'DR^SAMPLE^REFERRING',
        performingPhysicianName: overrides.performingPhysicianName || 'DR^SAMPLE^PERFORMING',
        ...overrides
      };

      const result = await this.instanceService.createDicomInstance(sampleData);
      
      if (result.success) {
        return reply.status(201).send({
          success: true,
          message: 'Sample DICOM instance created successfully',
          data: {
            ...result.data,
            sampleData: sampleData
          }
        });
      } else {
        return reply.status(500).send(result);
      }
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
        data: null
      });
    }
  }

  /**
   * Get DICOM instance file content
   * GET /api/dicom/instances/:filename/download
   */
  async downloadInstance(request, reply) {
    try {
      const { filename } = request.params;
      const path = require('path');
      const fs = require('fs');
      
      if (!filename) {
        return reply.status(400).send({
          success: false,
          message: 'Filename is required',
          data: null
        });
      }

      const instancesDir = path.join(process.cwd(), 'instances');
      const filepath = path.join(instancesDir, filename);
      
      if (!fs.existsSync(filepath)) {
        return reply.status(404).send({
          success: false,
          message: 'DICOM instance file not found',
          data: null
        });
      }

      const stats = fs.statSync(filepath);
      
      reply
        .header('Content-Type', 'application/dicom')
        .header('Content-Disposition', `attachment; filename="${filename}"`)
        .header('Content-Length', stats.size)
        .send(fs.createReadStream(filepath));
        
    } catch (error) {
      return reply.status(500).send({
        success: false,
        message: error.message,
        data: null
      });
    }
  }
}

module.exports = DicomInstanceController;
