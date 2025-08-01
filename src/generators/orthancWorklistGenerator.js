const fs = require('fs').promises;
const path = require('path');

/**
 * Orthanc Worklist Generator
 * Generates DICOM worklist files for Orthanc PACS server
 */
class OrthancWorklistGenerator {
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
      modality = 'CR', // Default to Computed Radiography
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
    const filename = `wl_${patientId}_${accessionNumber}_${Date.now()}.wl`;
    const filepath = path.join(this.worklistDir, filename);

    // Create DICOM worklist content
    const worklistContent = this.createDicomWorklistContent({
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

    // Write file
    await fs.writeFile(filepath, worklistContent, 'utf8');
    
    return {
      filename,
      filepath,
      content: worklistContent
    };
  }

  /**
   * Create DICOM worklist content in text format
   * This format can be converted to DICOM using tools like dcmodify
   */
  createDicomWorklistContent(data) {
    return `# DICOM Worklist File
# Generated: ${new Date().toISOString()}

# Patient Information
(0010,0020) ${data.patientId}                                    # Patient ID
(0010,0010) ${data.patientName}                                  # Patient Name
(0010,0030) ${data.patientBirthDate}                             # Patient Birth Date
(0010,0040) ${data.patientSex}                                   # Patient Sex

# Study Information
(0020,000D) ${data.studyInstanceUID}                             # Study Instance UID
(0008,0050) ${data.accessionNumber}                              # Accession Number
(0008,1030) ${data.studyDescription}                             # Study Description

# Scheduled Procedure Step Information
(0040,0100)[0].(0008,0060) ${data.modality}                      # Modality
(0040,0100)[0].(0040,0001) ${data.scheduledStationAETitle}       # Scheduled Station AE Title
(0040,0100)[0].(0040,0002) ${data.scheduledDate}                 # Scheduled Procedure Step Start Date
(0040,0100)[0].(0040,0003) ${data.scheduledTime}                 # Scheduled Procedure Step Start Time
(0040,0100)[0].(0040,0007) ${data.scheduledProcedureStepDescription} # Scheduled Procedure Step Description

# Requested Procedure Information
(0032,1060) ${data.requestedProcedureDescription}                # Requested Procedure Description

# Physician Information
(0008,0090) ${data.referringPhysician}                           # Referring Physician Name
(0040,0100)[0].(0040,0006) ${data.performingPhysician}           # Scheduled Performing Physician Name

# Institution Information
(0008,0080) ${data.institutionName}                              # Institution Name
(0008,1040) ${data.departmentName}                               # Institution Department Name

# Worklist Information
(0040,1001) ${data.accessionNumber}                              # Requested Procedure ID
(0040,0009) ${this.generateUID()}                                # Scheduled Procedure Step ID
`;
  }

  /**
   * Generate a batch of worklist files
   * @param {Array} worklistsData - Array of worklist data objects
   * @returns {Promise<Array>} - Array of generated file information
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
   * @returns {Promise<Array>} - Array of worklist files
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
      
      return fileDetails;
    } catch (error) {
      throw new Error(`Failed to list worklist files: ${error.message}`);
    }
  }

  /**
   * Delete a worklist file
   * @param {string} filename - Name of the file to delete
   * @returns {Promise<boolean>} - Success status
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
   * @param {number} daysOld - Delete files older than this many days
   * @returns {Promise<Array>} - Array of deleted files
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
   * @param {Object} data - Worklist data
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
   * @param {string} name - Patient name
   * @returns {string} - Formatted name
   */
  formatPatientName(name) {
    if (typeof name === 'string') {
      // If it's already in DICOM format (contains ^), return as is
      if (name.includes('^')) {
        return name;
      }
      // Otherwise, assume it's "FirstName LastName" and convert
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
   * @param {string|Date} date - Date to format
   * @returns {string} - Formatted date
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
   * @param {string} time - Time to format (HH:MM or HH:MM:SS)
   * @returns {string} - Formatted time
   */
  formatTime(time) {
    if (!time) {
      const now = new Date();
      return now.toTimeString().substr(0, 8).replace(/:/g, '');
    }
    
    // Handle various time formats
    let formattedTime = time.replace(/:/g, '');
    
    // If only HHMM provided, add seconds
    if (formattedTime.length === 4) {
      formattedTime += '00';
    }
    
    // Validate time format
    if (!/^\d{6}$/.test(formattedTime)) {
      throw new Error('Invalid time format. Use HH:MM or HH:MM:SS');
    }
    
    return formattedTime;
  }

  /**
   * Generate a DICOM UID
   * @returns {string} - Generated UID
   */
  generateUID() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `1.2.826.0.1.3680043.8.498.${timestamp}.${random}`;
  }

  /**
   * Export worklist to JSON format
   * @param {string} filename - Worklist filename
   * @returns {Promise<Object>} - Parsed worklist data
   */
  async exportToJson(filename) {
    const filepath = path.join(this.worklistDir, filename);
    const content = await fs.readFile(filepath, 'utf8');
    
    // Parse the worklist content and extract data
    const lines = content.split('\n');
    const data = {};
    
    lines.forEach(line => {
      const match = line.match(/\(([^)]+)\)(?:\[0\]\.)?(?:\(([^)]+)\))?\s+(.+?)\s+#\s*(.+)/);
      if (match) {
        const [, tag1, tag2, value, description] = match;
        const tag = tag2 ? `${tag1}.${tag2}` : tag1;
        data[description.trim()] = value.trim();
      }
    });
    
    return data;
  }
}

module.exports = OrthancWorklistGenerator;
