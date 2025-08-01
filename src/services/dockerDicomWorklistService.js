const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * Docker DICOM Worklist Service
 * Service layer that uses Docker wl-generator for proper DICOM generation
 */
class DockerDicomWorklistService {
  constructor() {
    this.worklistDir = path.join(process.cwd(), 'worklists');
    this.dockerImage = 'wl-generator';
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
   * Create a new worklist entry using Docker
   */
  async createWorklist(worklistData) {
    try {
      // Sanitize data
      const sanitizedData = this.sanitizeWorklistData(worklistData);
      
      // Create input JSON file for Docker container
      const inputJsonFile = path.join(this.worklistDir, `input_${Date.now()}.json`);
      await fs.writeFile(inputJsonFile, JSON.stringify(sanitizedData, null, 2));
      
      // Execute Docker command
      const result = await this.executeDockerCommand();
      
      // Clean up input file
      try {
        await fs.unlink(inputJsonFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      if (result.success) {
        // Get the latest created file
        const filesResult = await this.listWorklistFiles();
        
        if (filesResult.success && filesResult.data && filesResult.data.files) {
          const files = filesResult.data.files;
          if (files.length > 0) {
            const latestFile = files.sort((a, b) => b.created - a.created)[0];
            
            return {
              success: true,
              message: 'DICOM worklist created successfully using Docker',
              data: {
                filename: latestFile.filename,
                filepath: latestFile.filepath,
                size: latestFile.size
              }
            };
          } else {
            return {
              success: false,
              message: 'Docker command succeeded but no files were created',
              data: null
            };
          }
        } else {
          return {
            success: false,
            message: 'Docker command succeeded but could not list files: ' + (filesResult.message || 'Unknown error'),
            data: null
          };
        }
      } else {
        return {
          success: false,
          message: result.error || 'Failed to create worklist using Docker',
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
   * Create multiple worklist entries using Docker
   */
  async createWorklistBatch(worklistsData) {
    try {
      const results = [];
      
      // Process each worklist individually with Docker
      for (let i = 0; i < worklistsData.length; i++) {
        const sanitizedData = this.sanitizeWorklistData(worklistsData[i]);
        
        // Create individual input file
        const inputJsonFile = path.join(this.worklistDir, `batch_input_${Date.now()}_${i}.json`);
        await fs.writeFile(inputJsonFile, JSON.stringify(sanitizedData, null, 2));
        
        // Execute Docker command for this worklist
        const result = await this.executeDockerCommand();
        
        // Clean up input file
        try {
          await fs.unlink(inputJsonFile);
        } catch (e) {
          // Ignore cleanup errors
        }
        
        results.push({ success: result.success });
        
        // Small delay between Docker runs
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;
      
      return {
        success: true,
        message: `Batch DICOM worklists created using Docker`,
        data: {
          total: results.length,
          succeeded: successCount,
          failed: failedCount,
          results: results
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
  async listWorklistFiles() {
    try {
      const files = await fs.readdir(this.worklistDir);
      const worklistFiles = files.filter(file => 
        file.endsWith('.dcm') || file.endsWith('.wl')
      );
      
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
   * Execute Docker command to generate worklist
   */
  async executeDockerCommand() {
    return new Promise((resolve) => {
      const dockerArgs = [
        'run',
        '--rm',
        '-v', `${this.worklistDir}:/output`,
        this.dockerImage
      ];

      const docker = spawn('docker', dockerArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      docker.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      docker.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      docker.on('close', (code) => {
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
            error: stderr.trim() || `Docker command exited with code ${code}`
          });
        }
      });

      docker.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: `Failed to execute Docker command: ${error.message}`
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
   * Generate DICOM worklist (alias for createWorklist)
   */
  async generateDicomWorklist(patientData) {
    try {
      const result = await this.createWorklist(patientData);
      
      if (result.success && result.data && result.data.filename) {
        return result.data.filename;
      } else {
        throw new Error(result.message || 'Failed to generate worklist');
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a sample worklist using Docker
   */
  async createSampleWorklist() {
    try {
      const sampleData = this.generateSampleData();
      const result = await this.createWorklist(sampleData);
      
      if (result.success) {
        return {
          success: true,
          message: 'Sample DICOM worklist created successfully using Docker',
          data: result.data
        };
      } else {
        return {
          success: false,
          message: result.message,
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
   * Check if Docker and the wl-generator image are available
   */
  async checkDockerAvailability() {
    try {
      // Check if Docker is available
      const dockerVersion = await this.executeCommand('docker', ['--version']);
      
      if (!dockerVersion.success) {
        return {
          success: false,
          message: 'Docker is not available',
          data: null
        };
      }

      // Check if wl-generator image exists
      const imageCheck = await this.executeCommand('docker', ['images', '-q', this.dockerImage]);
      
      if (!imageCheck.success || !imageCheck.output.trim()) {
        return {
          success: false,
          message: `Docker image '${this.dockerImage}' not found`,
          data: null
        };
      }

      return {
        success: true,
        message: 'Docker and wl-generator image are available',
        data: {
          dockerVersion: dockerVersion.output.trim(),
          imageId: imageCheck.output.trim()
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
   * Execute a general command
   */
  async executeCommand(command, args) {
    return new Promise((resolve) => {
      const proc = spawn(command, args);
      
      let stdout = '';
      let stderr = '';

      proc.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      proc.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      proc.on('close', (code) => {
        resolve({
          success: code === 0,
          output: stdout.trim(),
          error: stderr.trim()
        });
      });

      proc.on('error', (error) => {
        resolve({
          success: false,
          output: '',
          error: error.message
        });
      });
    });
  }
}

module.exports = DockerDicomWorklistService;
