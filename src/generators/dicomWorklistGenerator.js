const fs = require('fs').promises;
const path = require('path');

/**
 * DICOM Worklist Generator
 * Creates proper DICOM binary files for Orthanc worklist
 */
class DicomWorklistGenerator {
  constructor() {
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
   * Generate a DICOM worklist file
   * @param {Object} worklistData - Worklist data
   * @returns {Promise<string>} - Path to generated file
   */
  async generateWorklistFile(worklistData) {
    const {
      // Patient Information
      patientId,
      patientName,
      patientBirthDate,
      patientSex,
      
      // Study Information
      studyInstanceUID,
      accessionNumber,
      studyDescription,
      scheduledDate,
      scheduledTime,
      
      // Procedure Information
      modality = 'CR',
      scheduledStationAETitle = 'ORTHANC',
      scheduledProcedureStepDescription,
      requestedProcedureDescription,
      
      // Additional Information
      referringPhysician = '',
      performingPhysician = '',
      institutionName = 'Hasta Radiologi',
      departmentName = 'Radiology'
    } = worklistData;

    // Validate required fields
    this.validateRequiredFields(worklistData);

    // Format patient name for DICOM (LastName^FirstName^MiddleName)
    const formattedPatientName = this.formatPatientName(patientName);
    
    // Generate unique filename
    const filename = `${accessionNumber}_${Date.now()}.dcm`;
    const filepath = path.join(this.worklistDir, filename);

    // Create DICOM binary content
    const dicomBuffer = this.createDicomBuffer({
      patientId,
      patientName: formattedPatientName,
      patientBirthDate: this.formatDate(patientBirthDate),
      patientSex: patientSex.toUpperCase(),
      studyInstanceUID: studyInstanceUID || this.generateUID(),
      accessionNumber,
      studyDescription,
      scheduledDate: this.formatDate(scheduledDate),
      scheduledTime: this.formatTime(scheduledTime),
      modality,
      scheduledStationAETitle,
      scheduledProcedureStepDescription,
      requestedProcedureDescription,
      referringPhysician,
      performingPhysician,
      institutionName,
      departmentName
    });

    // Write binary DICOM file
    await fs.writeFile(filepath, dicomBuffer);
    
    return {
      filename,
      filepath,
      size: dicomBuffer.length
    };
  }

  /**
   * Create DICOM binary buffer
   * This creates a minimal DICOM file with worklist elements
   */
  createDicomBuffer(data) {
    // DICOM file structure with proper headers
    const buffers = [];
    
    // DICOM Preamble (128 bytes of 0x00) + DICM prefix
    const preamble = Buffer.alloc(128, 0x00);
    const dicmPrefix = Buffer.from('DICM', 'ascii');
    buffers.push(preamble, dicmPrefix);

    // File Meta Information
    buffers.push(this.createDataElement('0002', '0000', 'UL', Buffer.alloc(4))); // File Meta Information Group Length
    buffers.push(this.createDataElement('0002', '0001', 'OB', Buffer.from([0x00, 0x01]))); // File Meta Information Version
    buffers.push(this.createDataElement('0002', '0002', 'UI', '1.2.840.10008.5.1.4.31')); // Media Storage SOP Class UID (Basic Worklist Information Model)
    buffers.push(this.createDataElement('0002', '0003', 'UI', this.generateUID())); // Media Storage SOP Instance UID
    buffers.push(this.createDataElement('0002', '0010', 'UI', '1.2.840.10008.1.2')); // Transfer Syntax UID (Implicit VR Little Endian)
    buffers.push(this.createDataElement('0002', '0012', 'UI', '1.2.826.0.1.3680043.8.498')); // Implementation Class UID
    buffers.push(this.createDataElement('0002', '0013', 'SH', 'HASTA_RADIOLOGI')); // Implementation Version Name

    // Patient Information
    buffers.push(this.createDataElement('0010', '0020', 'LO', data.patientId)); // Patient ID
    buffers.push(this.createDataElement('0010', '0010', 'PN', data.patientName)); // Patient Name
    buffers.push(this.createDataElement('0010', '0030', 'DA', data.patientBirthDate)); // Patient Birth Date
    buffers.push(this.createDataElement('0010', '0040', 'CS', data.patientSex)); // Patient Sex

    // Study Information
    buffers.push(this.createDataElement('0020', '000D', 'UI', data.studyInstanceUID)); // Study Instance UID
    buffers.push(this.createDataElement('0008', '0050', 'SH', data.accessionNumber)); // Accession Number
    buffers.push(this.createDataElement('0008', '1030', 'LO', data.studyDescription)); // Study Description

    // Requested Procedure Information
    buffers.push(this.createDataElement('0032', '1060', 'LO', data.requestedProcedureDescription)); // Requested Procedure Description
    buffers.push(this.createDataElement('0040', '1001', 'SH', data.accessionNumber)); // Requested Procedure ID

    // Institution Information
    buffers.push(this.createDataElement('0008', '0080', 'LO', data.institutionName)); // Institution Name
    buffers.push(this.createDataElement('0008', '1040', 'LO', data.departmentName)); // Institution Department Name

    // Physician Information
    if (data.referringPhysician) {
      buffers.push(this.createDataElement('0008', '0090', 'PN', data.referringPhysician)); // Referring Physician Name
    }

    // Scheduled Procedure Step Sequence (0040,0100)
    const spsItems = [];
    
    // Create SPS item
    const spsItem = [];
    spsItem.push(this.createDataElement('0008', '0060', 'CS', data.modality)); // Modality
    spsItem.push(this.createDataElement('0040', '0001', 'AE', data.scheduledStationAETitle)); // Scheduled Station AE Title
    spsItem.push(this.createDataElement('0040', '0002', 'DA', data.scheduledDate)); // Scheduled Procedure Step Start Date
    spsItem.push(this.createDataElement('0040', '0003', 'TM', data.scheduledTime)); // Scheduled Procedure Step Start Time
    spsItem.push(this.createDataElement('0040', '0007', 'LO', data.scheduledProcedureStepDescription)); // Scheduled Procedure Step Description
    spsItem.push(this.createDataElement('0040', '0009', 'SH', this.generateUID())); // Scheduled Procedure Step ID
    
    if (data.performingPhysician) {
      spsItem.push(this.createDataElement('0040', '0006', 'PN', data.performingPhysician)); // Scheduled Performing Physician Name
    }

    // Create sequence item
    const spsItemBuffer = Buffer.concat(spsItem);
    const spsItemWithHeaders = Buffer.concat([
      Buffer.from('FFFE', 'hex'), // Item Tag
      Buffer.from('E000', 'hex'), // Item Tag
      this.encodeLength(spsItemBuffer.length), // Item Length
      spsItemBuffer
    ]);

    // Create the sequence
    const spsSequence = Buffer.concat([
      Buffer.from('0040', 'hex'), // Group
      Buffer.from('0100', 'hex'), // Element
      Buffer.from('SQ', 'ascii'), // VR
      Buffer.from('0000', 'hex'), // Reserved
      this.encodeLength(spsItemWithHeaders.length), // Length
      spsItemWithHeaders,
      Buffer.from('FFFE', 'hex'), // Sequence Delimiter Tag
      Buffer.from('E0DD', 'hex'), // Sequence Delimiter Tag
      Buffer.from('00000000', 'hex') // Length (0)
    ]);

    buffers.push(spsSequence);

    return Buffer.concat(buffers);
  }

  /**
   * Create a DICOM data element
   */
  createDataElement(group, element, vr, value) {
    const groupBuffer = Buffer.from(group, 'hex');
    const elementBuffer = Buffer.from(element, 'hex');
    const vrBuffer = Buffer.from(vr.padEnd(2, ' '), 'ascii');

    let valueBuffer;
    if (Buffer.isBuffer(value)) {
      valueBuffer = value;
    } else {
      valueBuffer = Buffer.from(String(value), 'ascii');
      // Pad to even length if necessary
      if (valueBuffer.length % 2 !== 0) {
        valueBuffer = Buffer.concat([valueBuffer, Buffer.from(' ', 'ascii')]);
      }
    }

    const lengthBuffer = this.encodeLength(valueBuffer.length);

    // For explicit VR, include VR in the element
    let reservedBuffer = Buffer.alloc(2, 0x00);
    
    return Buffer.concat([
      groupBuffer,
      elementBuffer,
      vrBuffer,
      reservedBuffer,
      lengthBuffer,
      valueBuffer
    ]);
  }

  /**
   * Encode length as 4-byte little-endian
   */
  encodeLength(length) {
    const buffer = Buffer.alloc(4);
    buffer.writeUInt32LE(length, 0);
    return buffer;
  }

  /**
   * Generate a batch of worklist files
   */
  async generateBatch(worklistsData) {
    const results = [];
    
    for (const worklistData of worklistsData) {
      try {
        const result = await this.generateWorklistFile(worklistData);
        results.push({ success: true, ...result });
      } catch (error) {
        results.push({ 
          success: false, 
          error: error.message, 
          data: worklistData 
        });
      }
    }
    
    return results;
  }

  /**
   * List all generated worklist files
   */
  async listWorklistFiles() {
    try {
      const files = await fs.readdir(this.worklistDir);
      const worklistFiles = files.filter(file => file.endsWith('.dcm'));
      
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
      
      return fileDetails;
    } catch (error) {
      throw new Error(`Failed to list worklist files: ${error.message}`);
    }
  }

  /**
   * Delete a worklist file
   */
  async deleteWorklistFile(filename) {
    try {
      const filepath = path.join(this.worklistDir, filename);
      await fs.unlink(filepath);
      return true;
    } catch (error) {
      throw new Error(`Failed to delete worklist file: ${error.message}`);
    }
  }

  /**
   * Clean up old worklist files
   */
  async cleanupOldFiles(daysOld = 30) {
    const files = await this.listWorklistFiles();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    
    const deletedFiles = [];
    
    for (const file of files) {
      if (file.created < cutoffDate) {
        try {
          await this.deleteWorklistFile(file.filename);
          deletedFiles.push(file.filename);
        } catch (error) {
          console.error(`Failed to delete ${file.filename}:`, error.message);
        }
      }
    }
    
    return deletedFiles;
  }

  /**
   * Validate required fields
   */
  validateRequiredFields(data) {
    const required = [
      'patientId',
      'patientName',
      'patientBirthDate',
      'patientSex',
      'accessionNumber',
      'scheduledDate',
      'scheduledTime'
    ];

    const missing = required.filter(field => !data[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
  }

  /**
   * Format patient name for DICOM
   */
  formatPatientName(name) {
    if (typeof name === 'string') {
      if (name.includes('^')) {
        return name;
      }
      const parts = name.trim().split(' ');
      if (parts.length >= 2) {
        const lastName = parts.pop();
        const firstName = parts.join(' ');
        return `${lastName}^${firstName}`;
      }
      return `${name}^`;
    }
    
    if (typeof name === 'object') {
      const { firstName = '', lastName = '', middleName = '' } = name;
      return `${lastName}^${firstName}^${middleName}`;
    }
    
    throw new Error('Invalid patient name format');
  }

  /**
   * Format date for DICOM (YYYYMMDD)
   */
  formatDate(date) {
    const d = new Date(date);
    if (isNaN(d.getTime())) {
      throw new Error('Invalid date format');
    }
    
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return `${year}${month}${day}`;
  }

  /**
   * Format time for DICOM (HHMMSS)
   */
  formatTime(time) {
    if (!time) {
      const now = new Date();
      return now.toTimeString().substr(0, 8).replace(/:/g, '');
    }
    
    let formattedTime = time.replace(/:/g, '');
    
    if (formattedTime.length === 4) {
      formattedTime += '00';
    }
    
    if (!/^\d{6}$/.test(formattedTime)) {
      throw new Error('Invalid time format. Use HH:MM or HH:MM:SS');
    }
    
    return formattedTime;
  }

  /**
   * Generate a DICOM UID
   */
  generateUID() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `1.2.826.0.1.3680043.8.498.${timestamp}.${random}`;
  }
}

module.exports = DicomWorklistGenerator;
