const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs').promises;

/**
 * DICOM Instance Service
 * Service for creating proper DICOM instances with all required tags
 */
class DicomInstanceService {
  constructor() {
    this.instancesDir = path.join(process.cwd(), 'instances');
    this.ensureInstancesDirectory();
  }

  /**
   * Ensure instances directory exists
   */
  async ensureInstancesDirectory() {
    try {
      await fs.access(this.instancesDir);
    } catch {
      await fs.mkdir(this.instancesDir, { recursive: true });
    }
  }

  /**
   * Generate required UIDs for DICOM instance
   */
  generateUIDs() {
    const baseUID = '1.2.826.0.1.3680043.8.498';
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000000);
    
    return {
      studyInstanceUID: `${baseUID}.${timestamp}.1.${random}`,
      seriesInstanceUID: `${baseUID}.${timestamp}.2.${random}`,
      sopInstanceUID: `${baseUID}.${timestamp}.3.${random}`
    };
  }

  /**
   * Create a DICOM instance with all required tags
   */
  async createDicomInstance(instanceData) {
    try {
      // Generate required UIDs if not provided
      const uids = instanceData.uids || this.generateUIDs();
      
      // Prepare DICOM data with all required tags
      const dicomData = {
        // Patient Information
        patientID: instanceData.patientID || 'PATIENT001',
        patientName: instanceData.patientName || 'DOE^JOHN',
        patientBirthDate: instanceData.patientBirthDate || '19900101',
        patientSex: instanceData.patientSex || 'M',
        
        // Study Information
        studyInstanceUID: uids.studyInstanceUID,
        studyDate: instanceData.studyDate || new Date().toISOString().slice(0, 10).replace(/-/g, ''),
        studyTime: instanceData.studyTime || new Date().toTimeString().slice(0, 8).replace(/:/g, ''),
        studyDescription: instanceData.studyDescription || 'Study Description',
        accessionNumber: instanceData.accessionNumber || `ACC${Date.now()}`,
        
        // Series Information
        seriesInstanceUID: uids.seriesInstanceUID,
        seriesNumber: instanceData.seriesNumber || '1',
        seriesDescription: instanceData.seriesDescription || 'Series Description',
        modality: instanceData.modality || 'CR',
        
        // Instance Information
        sopInstanceUID: uids.sopInstanceUID,
        sopClassUID: instanceData.sopClassUID || '1.2.840.10008.5.1.4.1.1.1', // CR Image Storage
        instanceNumber: instanceData.instanceNumber || '1',
        
        // Additional Required Tags
        transferSyntaxUID: '1.2.840.10008.1.2.1', // Explicit VR Little Endian
        implementationClassUID: '1.2.826.0.1.3680043.8.498.1',
        implementationVersionName: 'HASTA_RADIOLOGI_1.0',
        
        // Institution Information
        institutionName: instanceData.institutionName || 'Hasta Radiologi',
        stationName: instanceData.stationName || 'WORKSTATION1',
        
        // Physician Information
        referringPhysicianName: instanceData.referringPhysicianName || '',
        performingPhysicianName: instanceData.performingPhysicianName || '',
        
        // Image Information (for image-based SOP Classes)
        rows: instanceData.rows || 512,
        columns: instanceData.columns || 512,
        bitsAllocated: instanceData.bitsAllocated || 16,
        bitsStored: instanceData.bitsStored || 12,
        highBit: instanceData.highBit || 11,
        pixelRepresentation: instanceData.pixelRepresentation || 0,
        samplesPerPixel: instanceData.samplesPerPixel || 1,
        photometricInterpretation: instanceData.photometricInterpretation || 'MONOCHROME2'
      };
      
      // Create DICOM file using dcmtk tools
      const filename = await this.createDicomFile(dicomData);
      
      return {
        success: true,
        message: 'DICOM instance created successfully',
        data: {
          filename,
          filepath: path.join(this.instancesDir, filename),
          uids: uids,
          patientID: dicomData.patientID,
          studyInstanceUID: dicomData.studyInstanceUID,
          seriesInstanceUID: dicomData.seriesInstanceUID,
          sopInstanceUID: dicomData.sopInstanceUID
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
   * Create DICOM file using dcmtk dump2dcm tool
   */
  async createDicomFile(dicomData) {
    const timestamp = Date.now();
    const tempDumpFile = path.join(this.instancesDir, `temp_${timestamp}.dump`);
    const outputDcmFile = `instance_${timestamp}.dcm`;
    const outputDcmPath = path.join(this.instancesDir, outputDcmFile);

    try {
      // Create DICOM dump content
      const dumpContent = this.generateDicomDump(dicomData);
      
      // Write dump file
      await fs.writeFile(tempDumpFile, dumpContent);
      
      // Convert dump to DICOM using dump2dcm
      const conversionResult = await this.executeCommand('dump2dcm', [
        tempDumpFile,
        outputDcmPath,
        '+te'  // Explicit VR Little Endian
      ]);
      
      if (!conversionResult.success) {
        throw new Error(`Failed to create DICOM file: ${conversionResult.error}`);
      }
      
      // Clean up temp file
      try {
        await fs.unlink(tempDumpFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      
      return outputDcmFile;
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempDumpFile);
      } catch (e) {
        // Ignore cleanup errors
      }
      throw error;
    }
  }

  /**
   * Generate DICOM dump format content
   */
  generateDicomDump(data) {
    return `# DICOM File Format
# Generated by Hasta Radiologi DICOM Instance Service
# ${new Date().toISOString()}

# Meta Information
(0002,0001) OB 00\\01
(0002,0002) UI [${data.sopClassUID}]
(0002,0003) UI [${data.sopInstanceUID}]
(0002,0010) UI [${data.transferSyntaxUID}]
(0002,0012) UI [${data.implementationClassUID}]
(0002,0013) SH [${data.implementationVersionName}]

# Patient Information
(0010,0010) PN [${data.patientName}]
(0010,0020) LO [${data.patientID}]
(0010,0030) DA [${data.patientBirthDate}]
(0010,0040) CS [${data.patientSex}]

# Study Information
(0020,000d) UI [${data.studyInstanceUID}]
(0008,0020) DA [${data.studyDate}]
(0008,0030) TM [${data.studyTime}]
(0008,1030) LO [${data.studyDescription}]
(0008,0050) SH [${data.accessionNumber}]

# Series Information
(0020,000e) UI [${data.seriesInstanceUID}]
(0020,0011) IS [${data.seriesNumber}]
(0008,103e) LO [${data.seriesDescription}]
(0008,0060) CS [${data.modality}]

# Instance Information
(0008,0018) UI [${data.sopInstanceUID}]
(0008,0016) UI [${data.sopClassUID}]
(0020,0013) IS [${data.instanceNumber}]

# Institution Information
(0008,0080) LO [${data.institutionName}]
(0008,1010) SH [${data.stationName}]

# Physician Information
(0008,0090) PN [${data.referringPhysicianName}]
(0008,1050) PN [${data.performingPhysicianName}]

# Image Information (for image SOP classes)
(0028,0010) US ${data.rows}
(0028,0011) US ${data.columns}
(0028,0100) US ${data.bitsAllocated}
(0028,0101) US ${data.bitsStored}
(0028,0102) US ${data.highBit}
(0028,0103) US ${data.pixelRepresentation}
(0028,0002) US ${data.samplesPerPixel}
(0028,0004) CS [${data.photometricInterpretation}]

# Minimal pixel data (placeholder for CR image)
(7fe0,0010) OW 0000\\0000\\0000\\0000
`;
  }

  /**
   * Create a batch of DICOM instances
   */
  async createInstanceBatch(instancesData) {
    try {
      const results = [];
      
      for (let i = 0; i < instancesData.length; i++) {
        const result = await this.createDicomInstance(instancesData[i]);
        results.push(result);
        
        // Small delay between creations
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      
      const successCount = results.filter(r => r.success).length;
      const failedCount = results.length - successCount;
      
      return {
        success: true,
        message: `Batch DICOM instances created`,
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
   * Get all DICOM instance files
   */
  async listInstances() {
    try {
      const files = await fs.readdir(this.instancesDir);
      const instanceFiles = files.filter(file => file.endsWith('.dcm'));
      
      const fileDetails = await Promise.all(
        instanceFiles.map(async (file) => {
          const filepath = path.join(this.instancesDir, file);
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
        message: 'DICOM instances retrieved successfully',
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
   * Delete a DICOM instance file
   */
  async deleteInstance(filename) {
    try {
      const filepath = path.join(this.instancesDir, filename);
      await fs.unlink(filepath);
      
      return {
        success: true,
        message: 'DICOM instance deleted successfully',
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
   * Validate DICOM instance file
   */
  async validateInstance(filename) {
    try {
      const filepath = path.join(this.instancesDir, filename);
      
      // Use dcmdump to validate
      const validationResult = await this.executeCommand('dcmdump', [
        '--scan-directories',
        '--print-all',
        filepath
      ]);
      
      if (validationResult.success) {
        // Check for required tags in output
        const output = validationResult.output;
        const hasStudyUID = output.includes('StudyInstanceUID') || output.includes('(0020,000d)');
        const hasSeriesUID = output.includes('SeriesInstanceUID') || output.includes('(0020,000e)');
        const hasSOPUID = output.includes('SOPInstanceUID') || output.includes('(0008,0018)');
        
        return {
          success: true,
          message: 'DICOM instance validation completed',
          data: {
            filename,
            isValid: hasStudyUID && hasSeriesUID && hasSOPUID,
            hasStudyInstanceUID: hasStudyUID,
            hasSeriesInstanceUID: hasSeriesUID,
            hasSOPInstanceUID: hasSOPUID,
            details: output
          }
        };
      } else {
        return {
          success: false,
          message: `Validation failed: ${validationResult.error}`,
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
   * Send DICOM instance to Orthanc
   */
  async sendToOrthanc(filename, orthancConfig = {}) {
    try {
      const filepath = path.join(this.instancesDir, filename);
      const orthancHost = orthancConfig.host || 'localhost';
      const orthancPort = orthancConfig.port || 4242;
      const orthancAET = orthancConfig.aet || 'ORTHANC';
      const sourceAET = orthancConfig.sourceAet || 'HASTA_RADIOLOGI';
      
      // Use storescu to send DICOM file
      const sendResult = await this.executeCommand('storescu', [
        '-aet', sourceAET,
        '-aec', orthancAET,
        orthancHost, orthancPort.toString(),
        filepath
      ]);
      
      if (sendResult.success) {
        return {
          success: true,
          message: `DICOM instance sent to Orthanc successfully`,
          data: {
            filename,
            orthancHost,
            orthancPort,
            output: sendResult.output
          }
        };
      } else {
        return {
          success: false,
          message: `Failed to send to Orthanc: ${sendResult.error}`,
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
   * Execute command
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

  /**
   * Check if dcmtk tools are available
   */
  async checkDcmtkAvailability() {
    try {
      const toolsToCheck = ['dump2dcm', 'dcmdump', 'storescu'];
      const results = {};
      
      for (const tool of toolsToCheck) {
        const result = await this.executeCommand('which', [tool]);
        results[tool] = result.success ? result.output : 'Not found';
      }
      
      const allAvailable = Object.values(results).every(path => path !== 'Not found');
      
      return {
        success: allAvailable,
        message: allAvailable ? 'All DCMTK tools are available' : 'Some DCMTK tools are missing',
        data: results
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: null
      };
    }
  }
}

module.exports = DicomInstanceService;
