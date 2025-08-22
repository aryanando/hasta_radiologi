const fs = require('fs');
const path = require('path');
require('dotenv').config();

/**
 * Simple DICOM Worklist Generator
 * Generates DICOM worklist files for Orthanc
 */
class DicomWorklistGenerator {
  constructor(outputDir = null) {
    this.outputDir = outputDir || process.env.WORKLIST_DIR || 'worklists';
    this.filenamePrefix = process.env.FILENAME_PREFIX || '';
    this.filenameSuffix = process.env.FILENAME_SUFFIX || '';
    this.ensureOutputDir();
  }

  /**
   * Ensure output directory exists
   */
  ensureOutputDir() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Generate DICOM worklist file
   * @param {Object} data - Worklist data
   * @returns {Object} - Generation result
   */
  async generateWorklistFile(data) {
    try {
      const filename = this.generateFilename(data.accessionNumber);
      const filepath = path.join(this.outputDir, filename);
      
      // Generate DICOM content (simplified version)
      const dicomContent = this.generateDicomContent(data);
      
      // Write file
      fs.writeFileSync(filepath, dicomContent);
      
      return {
        success: true,
        filename,
        filepath: path.resolve(filepath),
        size: fs.statSync(filepath).size
      };
    } catch (error) {
      throw new Error(`Failed to generate worklist file: ${error.message}`);
    }
  }

  /**
   * Generate batch worklist files
   * @param {Array} worklistsData - Array of worklist data
   * @returns {Promise<Array>} - Array of results
   */
  async generateBatch(worklistsData) {
    const results = [];
    
    for (const data of worklistsData) {
      try {
        const result = await this.generateWorklistFile(data);
        results.push({ success: true, data: result });
      } catch (error) {
        results.push({ success: false, error: error.message, data });
      }
    }
    
    return results;
  }

  /**
   * Generate filename for worklist
   * @param {string} accessionNumber - Accession number
   * @returns {string} - Generated filename
   */
  generateFilename(accessionNumber) {
    const timestamp = Date.now();
    const sanitized = accessionNumber.replace(/[^a-zA-Z0-9]/g, '_');
    const prefix = this.filenamePrefix;
    const suffix = this.filenameSuffix;
    return `${prefix}${sanitized}_${timestamp}${suffix}.wl`;
  }

  /**
   * Generate DICOM content (simplified DICOM-like format)
   * @param {Object} data - Worklist data
   * @returns {string} - DICOM content
   */
  generateDicomContent(data) {
    const now = new Date();
    const content = [
      '# DICOM Worklist File',
      `# Generated: ${now.toISOString()}`,
      '',
      '# Patient Information',
      `PatientID=${data.patientId || ''}`,
      `PatientsName=${data.patientName || ''}`,
      `PatientsBirthDate=${data.patientBirthDate || ''}`,
      `PatientsSex=${data.patientSex || 'U'}`,
      '',
      '# Study Information',
      `StudyInstanceUID=${data.studyInstanceUID || this.generateUID()}`,
      `AccessionNumber=${data.accessionNumber || ''}`,
      `StudyDescription=${data.studyDescription || ''}`,
      '',
      '# Scheduled Procedure Step',
      `ScheduledProcedureStepSequence.ScheduledStationAETitle=${data.scheduledStationAETitle || 'ORTHANC'}`,
      `ScheduledProcedureStepSequence.ScheduledProcedureStepStartDate=${data.scheduledDate || ''}`,
      `ScheduledProcedureStepSequence.ScheduledProcedureStepStartTime=${data.scheduledTime || ''}`,
      `ScheduledProcedureStepSequence.Modality=${data.modality || 'CR'}`,
      `ScheduledProcedureStepSequence.ScheduledProcedureStepDescription=${data.scheduledProcedureStepDescription || ''}`,
      '',
      '# Requested Procedure',
      `RequestedProcedureDescription=${data.requestedProcedureDescription || ''}`,
      '',
      '# Physicians',
      `ReferringPhysiciansName=${data.referringPhysician || ''}`,
      `ScheduledProcedureStepSequence.ScheduledPerformingPhysiciansName=${data.performingPhysician || ''}`,
      '',
      '# Institution',
      `InstitutionName=${data.institutionName || 'Hasta Radiologi'}`,
      `InstitutionalDepartmentName=${data.departmentName || 'Radiology'}`,
      ''
    ];
    
    return content.join('\n');
  }

  /**
   * Generate simple UID
   * @returns {string} - Generated UID
   */
  generateUID() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    return `1.2.826.0.1.3680043.8.498.${timestamp}.${random}`;
  }

  /**
   * List all worklist files
   * @returns {Promise<Array>} - Array of file information
   */
  async listWorklistFiles() {
    try {
      const files = fs.readdirSync(this.outputDir)
        .filter(file => file.endsWith('.wl'))
        .map(file => {
          const filepath = path.join(this.outputDir, file);
          const stats = fs.statSync(filepath);
          return {
            filename: file,
            filepath: path.resolve(filepath),
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        });
      
      return files.sort((a, b) => b.created - a.created);
    } catch (error) {
      throw new Error(`Failed to list worklist files: ${error.message}`);
    }
  }

  /**
   * Delete a worklist file
   * @param {string} filename - Filename to delete
   */
  async deleteWorklistFile(filename) {
    try {
      const filepath = path.join(this.outputDir, filename);
      fs.unlinkSync(filepath);
    } catch (error) {
      throw new Error(`Failed to delete worklist file: ${error.message}`);
    }
  }

  /**
   * Clean up old files
   * @param {number} daysOld - Delete files older than this many days
   * @returns {Promise<Array>} - Array of deleted files
   */
  async cleanupOldFiles(daysOld = null) {
    try {
      const cleanupDays = daysOld || parseInt(process.env.CLEANUP_DAYS) || 30;
      const files = await this.listWorklistFiles();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - cleanupDays);
      
      const oldFiles = files.filter(file => file.created < cutoffDate);
      const deletedFiles = [];
      
      for (const file of oldFiles) {
        try {
          await this.deleteWorklistFile(file.filename);
          deletedFiles.push(file.filename);
        } catch (error) {
          console.warn(`Failed to delete ${file.filename}: ${error.message}`);
        }
      }
      
      return deletedFiles;
    } catch (error) {
      throw new Error(`Failed to cleanup old files: ${error.message}`);
    }
  }
}

module.exports = DicomWorklistGenerator;
