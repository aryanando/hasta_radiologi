const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * Python DICOM Worklist Service
 * Service layer that uses Python pydicom for proper DICOM generation
 */
class PythonDicomWorklistService {
  constructor() {
    this.scriptPath = path.join(__dirname, '../../scripts/dicom_worklist_generator.py');
    this.worklistDir = path.join(process.cwd(), 'worklists');
    this.ensureWorklistDirectory();
  }

  /**
   * Ensure worklist directory exists
   */
  async ensureWorklistDirectory() {
    try {
      await fs.access(this.worklistDir);
    } catch {
      await fs.mkdir(this.worklistDir, { recursive: true });
    }
  }

  /**
   * Create a new worklist entry using Python script
   */
  async createWorklist(worklistData) {
    try {
      // Sanitize data
      const sanitizedData = this.sanitizeWorklistData(worklistData);
      
      // Create temporary JSON file
      const tempJsonFile = path.join(this.worklistDir, `temp_${Date.now()}.json`);
      await fs.writeFile(tempJsonFile, JSON.stringify(sanitizedData, null, 2));
      
      // Execute Python script
      const result = await this.executePythonScript([tempJsonFile]);
      
      // Clean up temp file
      try {
        await fs.unlink(tempJsonFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      if (result.success) {
        // Get the created file info
        const files = await this.listWorklistFiles();
        const latestFile = files.files.sort((a, b) => b.created - a.created)[0];
        
        return {
          success: true,
          message: 'DICOM worklist created successfully',
          data: {
            filename: latestFile ? latestFile.filename : 'unknown',
            filepath: latestFile ? latestFile.filepath : 'unknown',
            size: latestFile ? latestFile.size : 0
          }
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to create worklist',
          data: null
        };
      }
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
   */
  async createWorklistBatch(worklistsData) {
    try {
      const sanitizedData = worklistsData.map(data => this.sanitizeWorklistData(data));
      
      // Create temporary JSON file for batch
      const tempJsonFile = path.join(this.worklistDir, `batch_temp_${Date.now()}.json`);
      await fs.writeFile(tempJsonFile, JSON.stringify(sanitizedData, null, 2));
      
      // Execute Python script
      const result = await this.executePythonScript([tempJsonFile]);
      
      // Clean up temp file
      try {
        await fs.unlink(tempJsonFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      if (result.success) {
        return {
          success: true,
          message: `Batch DICOM worklists created successfully`,
          data: {
            total: sanitizedData.length,
            succeeded: sanitizedData.length,
            failed: 0,
            results: sanitizedData.map(() => ({ success: true }))
          }
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to create batch worklists',
          data: null
        };
      }
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
  async listWorklistFiles() {
    try {
      const files = await fs.readdir(this.worklistDir);
      const worklistFiles = files.filter(file => file.endsWith('.wl'));
      
      const fileDetails = await Promise.all(
        worklistFiles.map(async (file) => {
          const filepath = path.join(this.worklistDir, file);
          const stats = await fs.stat(filepath);
          return {
            filename: file,
            filepath,
            size: stats.size,
            created: stats.birthtime,
            modified: stats.mtime
          };
        })
      );
      
      return {
        success: true,
        message: 'Worklists retrieved successfully',
        data: {
          count: fileDetails.length,
          files: fileDetails
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
   * Get all worklists (alias for compatibility)
   */
  async getAllWorklists() {
    return this.listWorklistFiles();
  }

  /**
   * Delete a worklist file
   */
  async deleteWorklist(filename) {
    try {
      const filepath = path.join(this.worklistDir, filename);
      await fs.unlink(filepath);
      
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
   */
  async cleanupOldWorklists(daysOld = 30) {
    try {
      const result = await this.listWorklistFiles();
      if (!result.success) {
        throw new Error(result.message);
      }

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysOld);
      
      const deletedFiles = [];
      
      for (const file of result.data.files) {
        if (file.created < cutoffDate) {
          try {
            await this.deleteWorklist(file.filename);
            deletedFiles.push(file.filename);
          } catch (error) {
            console.error(`Failed to delete ${file.filename}:`, error.message);
          }
        }
      }
      
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
   */
  async getWorklistStats() {
    try {
      const result = await this.listWorklistFiles();
      if (!result.success) {
        throw new Error(result.message);
      }

      const files = result.data.files;
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
   * Generate sample data for testing
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

  /**
   * Execute Python script
   */
  async executePythonScript(args) {
    return new Promise((resolve) => {
      const python = spawn('python3', [this.scriptPath, ...args], {
        cwd: this.worklistDir
      });

      let stdout = '';
      let stderr = '';

      python.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      python.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      python.on('close', (code) => {
        if (code === 0) {
          resolve({
            success: true,
            output: stdout.trim(),
            error: null
          });
        } else {
          resolve({
            success: false,
            output: stdout.trim(),
            error: stderr.trim() || `Python script exited with code ${code}`
          });
        }
      });

      python.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: `Failed to execute Python script: ${error.message}`
        });
      });
    });
  }

  /**
   * Sanitize and validate worklist data
   */
  sanitizeWorklistData(data) {
    return {
      // Patient Information
      patientId: String(data.patientId || '').trim(),
      patientName: String(data.patientName || '').trim(),
      patientBirthDate: data.patientBirthDate,
      patientSex: String(data.patientSex || 'U').toUpperCase().charAt(0),
      
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
   * Create a sample worklist using Python script
   */
  async createSampleWorklist() {
    try {
      const result = await this.executePythonScript(['--sample']);
      
      if (result.success) {
        return {
          success: true,
          message: 'Sample DICOM worklist created successfully',
          data: { output: result.output }
        };
      } else {
        return {
          success: false,
          message: result.error || 'Failed to create sample worklist',
          data: null
        };
      }
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }
}

module.exports = PythonDicomWorklistService;
