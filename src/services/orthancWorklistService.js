const OrthancWorklistGenerator = require('../generators/orthancWorklistGenerator');

/**
 * Orthanc Worklist Service
 * Service layer for managing Orthanc worklist operations
 */
class OrthancWorklistService {
  constructor() {
    this.generator = new OrthancWorklistGenerator();
  }

  /**
   * Create a new worklist entry
   * @param {Object} worklistData - Worklist data
   * @returns {Promise<Object>} - Created worklist information
   */
  async createWorklist(worklistData) {
    try {
      // Validate and sanitize input data
      const sanitizedData = this.sanitizeWorklistData(worklistData);
      
      // Generate the worklist file
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
   * @returns {Promise<Object>} - List of worklist files
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
   * Delete a worklist file
   * @param {string} filename - Filename to delete
   * @returns {Promise<Object>} - Deletion result
   */
  async deleteWorklist(filename) {
    try {
      await this.generator.deleteWorklistFile(filename);
      
      return {
        success: true,
        message: 'Worklist deleted successfully',
        data: { filename }
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
   * Clean up old worklist files
   * @param {number} daysOld - Delete files older than this many days
   * @returns {Promise<Object>} - Cleanup result
   */
  async cleanupOldWorklists(daysOld = 30) {
    try {
      const deletedFiles = await this.generator.cleanupOldFiles(daysOld);
      
      return {
        success: true,
        message: `Cleanup completed. ${deletedFiles.length} files deleted.`,
        data: {
          deletedCount: deletedFiles.length,
          deletedFiles
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
   * @returns {Promise<Object>} - Worklist statistics
   */
  async getWorklistStats() {
    try {
      const files = await this.generator.listWorklistFiles();
      
      const stats = {
        totalFiles: files.length,
        totalSize: files.reduce((sum, file) => sum + file.size, 0),
        oldestFile: files.length > 0 ? Math.min(...files.map(f => f.created.getTime())) : null,
        newestFile: files.length > 0 ? Math.max(...files.map(f => f.created.getTime())) : null,
        averageSize: files.length > 0 ? files.reduce((sum, file) => sum + file.size, 0) / files.length : 0
      };

      if (stats.oldestFile) {
        stats.oldestFile = new Date(stats.oldestFile);
      }
      if (stats.newestFile) {
        stats.newestFile = new Date(stats.newestFile);
      }
      
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
   * @param {Object} data - Raw worklist data
   * @returns {Object} - Sanitized data
   */
  sanitizeWorklistData(data) {
    return {
      // Patient Information
      patientId: String(data.patientId || '').trim(),
      patientName: String(data.patientName || '').trim(),
      patientBirthDate: data.patientBirthDate,
      patientSex: String(data.patientSex || 'U').toUpperCase().charAt(0), // M, F, or U
      
      // Study Information
      studyInstanceUID: data.studyInstanceUID,
      accessionNumber: String(data.accessionNumber || '').trim(),
      studyDescription: String(data.studyDescription || '').trim(),
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      
      // Procedure Information
      modality: String(data.modality || 'CR').toUpperCase(),
      scheduledStationAETitle: String(data.scheduledStationAETitle || 'ORTHANC').trim(),
      scheduledProcedureStepDescription: String(data.scheduledProcedureStepDescription || '').trim(),
      requestedProcedureDescription: String(data.requestedProcedureDescription || '').trim(),
      
      // Additional Information
      referringPhysician: String(data.referringPhysician || '').trim(),
      performingPhysician: String(data.performingPhysician || '').trim(),
      institutionName: String(data.institutionName || 'Hasta Radiologi').trim(),
      departmentName: String(data.departmentName || 'Radiology').trim()
    };
  }

  /**
   * Generate sample worklist data for testing
   * @returns {Object} - Sample worklist data
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
      modality: 'CR',
      scheduledStationAETitle: 'ORTHANC',
      scheduledProcedureStepDescription: 'Chest X-Ray PA and Lateral',
      requestedProcedureDescription: 'Chest X-Ray - Routine',
      referringPhysician: 'DR^SMITH^ROBERT',
      performingPhysician: 'DR^JOHNSON^MARY',
      institutionName: 'Hasta Radiologi',
      departmentName: 'Radiology'
    };
  }
}

module.exports = OrthancWorklistService;
