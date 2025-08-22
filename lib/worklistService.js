const DicomWorklistGenerator = require('./dicomWorklistGenerator');
require('dotenv').config();

/**
 * Worklist Service
 * Service for managing DICOM worklist operations
 */
class WorklistService {
  constructor() {
    this.generator = new DicomWorklistGenerator();
    this.defaultInstitution = process.env.INSTITUTION_NAME || 'Hasta Radiologi';
    this.defaultDepartment = process.env.DEPARTMENT_NAME || 'Radiology';
    this.defaultModality = process.env.DEFAULT_MODALITY || 'CR';
    this.defaultAeTitle = process.env.DEFAULT_AE_TITLE || 'ORTHANC';
  }

  /**
   * Create a new worklist entry
   * @param {Object} worklistData - Worklist data
   * @returns {Promise<Object>} - Created worklist information
   */
  async createWorklist(worklistData) {
    try {
      const sanitizedData = this.sanitizeWorklistData(worklistData);
      const result = await this.generator.generateWorklistFile(sanitizedData);
      
      return {
        success: true,
        message: 'Worklist created successfully',
        data: result
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Create multiple worklist entries
   * @param {Array} worklistsData - Array of worklist data
   * @returns {Promise<Object>} - Batch creation results
   */
  async createWorklistBatch(worklistsData) {
    try {
      const results = await this.generator.generateBatch(worklistsData);
      
      const successCount = results.filter(r => r.success).length;
      const failureCount = results.filter(r => !r.success).length;
      
      return {
        success: true,
        message: `Batch processing completed. ${successCount} succeeded, ${failureCount} failed.`,
        data: {
          total: results.length,
          succeeded: successCount,
          failed: failureCount,
          results
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Get all worklist files
   */
  async getAllWorklists() {
    try {
      const files = await this.generator.listWorklistFiles();
      
      return {
        success: true,
        message: 'Worklists retrieved successfully',
        data: {
          count: files.length,
          files
        }
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Get worklist statistics
   */
  async getWorklistStats() {
    try {
      const files = await this.generator.listWorklistFiles();
      
      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
        averageSize: files.length > 0 ? files.reduce((sum, file) => sum + file.size, 0) / files.length : 0
      };
      
      return {
        success: true,
        message: 'Statistics retrieved successfully',
        data: stats
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }

  /**
   * Sanitize and validate worklist data
   */
  sanitizeWorklistData(data) {
    return {
      patientId: String(data.patientId || '').trim(),
      patientName: String(data.patientName || '').trim(),
      patientBirthDate: data.patientBirthDate,
      patientSex: String(data.patientSex || 'U').toUpperCase().charAt(0),
      studyInstanceUID: data.studyInstanceUID,
      accessionNumber: String(data.accessionNumber || '').trim(),
      studyDescription: String(data.studyDescription || '').trim(),
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      modality: String(data.modality || this.defaultModality).toUpperCase(),
      scheduledStationAETitle: String(data.scheduledStationAETitle || this.defaultAeTitle).trim(),
      scheduledProcedureStepDescription: String(data.scheduledProcedureStepDescription || '').trim(),
      requestedProcedureDescription: String(data.requestedProcedureDescription || '').trim(),
      referringPhysician: String(data.referringPhysician || '').trim(),
      performingPhysician: String(data.performingPhysician || '').trim(),
      institutionName: String(data.institutionName || this.defaultInstitution).trim(),
      departmentName: String(data.departmentName || this.defaultDepartment).trim()
    };
  }

  /**
   * Generate sample worklist data for testing
   */
  generateSampleData() {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return {
      patientId: `P${Date.now()}`,
      patientName: 'DOE^JOHN^MIDDLE',
      patientBirthDate: '1985-05-15',
      patientSex: 'M',
      accessionNumber: `ACC${Date.now()}`,
      studyDescription: 'Chest X-Ray',
      scheduledDate: tomorrow.toISOString().split('T')[0],
      scheduledTime: '14:30:00',
      modality: this.defaultModality,
      scheduledStationAETitle: this.defaultAeTitle,
      scheduledProcedureStepDescription: 'Chest X-Ray PA and Lateral',
      requestedProcedureDescription: 'Chest X-Ray - Routine',
      referringPhysician: 'DR^SMITH^ROBERT',
      performingPhysician: 'DR^JOHNSON^MARY',
      institutionName: this.defaultInstitution,
      departmentName: this.defaultDepartment
    };
  }
}

module.exports = WorklistService;
