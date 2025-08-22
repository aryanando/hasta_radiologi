const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
require('dotenv').config();

/**
 * PACS Service for DICOM operations using DCMTK FindSCU
 * Interfaces with the findscu-dcmtk Docker container
 */
class PACSService {
  constructor() {
    this.findscu_container = 'dcmtk-findscu-client';
    this.pacsHost = process.env.PACS_HOST || 'host.docker.internal';
    this.pacsPort = process.env.PACS_PORT || '4242';
    this.localAET = process.env.LOCAL_AET || 'FINDSCU';
    this.remoteAET = process.env.REMOTE_AET || 'ORTHANC';
  }

  /**
   * Parse DICOM find response into structured data
   */
  parseFindScuResponse(output) {
    const worklists = [];
    const responses = output.split('Find Response:').slice(1);

    for (const response of responses) {
      if (response.includes('(Pending)') || response.includes('Final Find Response')) {
        const worklist = {};

        // Extract patient information
        const patientNameMatch = response.match(/\(0010,0010\) PN \[(.*?)\]/);
        if (patientNameMatch) {
          worklist.patientName = patientNameMatch[1].trim();
        }

        const patientIdMatch = response.match(/\(0010,0020\) LO \[(.*?)\]/);
        if (patientIdMatch) {
          worklist.patientId = patientIdMatch[1].trim();
        }

        const accessionNumberMatch = response.match(/\(0008,0050\) SH \[(.*?)\]/);
        if (accessionNumberMatch) {
          worklist.accessionNumber = accessionNumberMatch[1].trim();
        }

        // Extract scheduled procedure step information
        const modalityMatch = response.match(/\(0008,0060\) CS \[(.*?)\]/);
        if (modalityMatch) {
          worklist.modality = modalityMatch[1].trim();
        }

        const stationAETMatch = response.match(/\(0040,0001\) AE \[(.*?)\]/);
        if (stationAETMatch) {
          worklist.scheduledStationAETitle = stationAETMatch[1].trim();
        }

        const scheduledDateMatch = response.match(/\(0040,0002\) DA \[(.*?)\]/);
        if (scheduledDateMatch) {
          const dateStr = scheduledDateMatch[1].trim();
          // Convert YYYYMMDD to YYYY-MM-DD
          if (dateStr.length === 8) {
            worklist.scheduledDate = `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
          }
        }

        const scheduledTimeMatch = response.match(/\(0040,0003\) TM \[(.*?)\]/);
        if (scheduledTimeMatch) {
          const timeStr = scheduledTimeMatch[1].trim();
          // Convert HHMMSS to HH:MM:SS
          if (timeStr.length >= 4) {
            const hours = timeStr.substring(0,2);
            const minutes = timeStr.substring(2,4);
            const seconds = timeStr.length >= 6 ? timeStr.substring(4,6) : '00';
            worklist.scheduledTime = `${hours}:${minutes}:${seconds}`;
          }
        }

        // Add if we have at least patient name (for simple queries) or essential worklist data
        if (worklist.patientName) {
          worklist.retrievedAt = new Date().toISOString();
          // Mark as incomplete if missing key worklist fields
          if (!worklist.accessionNumber && !worklist.modality) {
            worklist.dataType = 'patient-level';
            worklist.note = 'Limited data - patient name only';
          } else {
            worklist.dataType = 'worklist-level';
          }
          worklists.push(worklist);
        }
      }
    }

    return worklists;
  }

  /**
   * Query all available worklists from PACS
   */
  async queryWorklists() {
    try {
      console.log(`[PACS] Querying worklists from ${this.pacsHost}:${this.pacsPort}`);
      
      const command = `docker exec ${this.findscu_container} findscu -v -aet "${this.localAET}" -aec "${this.remoteAET}" -W -k "ScheduledProcedureStepSequence[0].Modality" -k "ScheduledProcedureStepSequence[0].ScheduledStationAETitle" -k "ScheduledProcedureStepSequence[0].ScheduledProcedureStepStartDate" -k "ScheduledProcedureStepSequence[0].ScheduledProcedureStepStartTime" -k "PatientName" -k "PatientID" -k "AccessionNumber" "${this.pacsHost}" "${this.pacsPort}"`;
      
      console.log(`[PACS] Executing command: ${command}`);
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && stderr.includes('Association Request Failed')) {
        throw new Error(`PACS connection failed: ${stderr}`);
      }

      // FindSCU outputs data to stderr, not stdout
      const worklists = this.parseFindScuResponse(stderr);
      
      return {
        success: true,
        data: {
          count: worklists.length,
          worklists: worklists,
          pacsHost: this.pacsHost,
          pacsPort: this.pacsPort,
          queriedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[PACS] Query failed:', error.message);
      return {
        success: false,
        error: error.message,
        details: {
          pacsHost: this.pacsHost,
          pacsPort: this.pacsPort,
          container: this.findscu_container
        }
      };
    }
  }

  /**
   * Query specific patient information
   */
  async queryPatient(patientName = '*') {
    try {
      console.log(`[PACS] Querying patient: ${patientName}`);
      
      const command = `docker exec ${this.findscu_container} findscu -v -aet "${this.localAET}" -aec "${this.remoteAET}" -P -k "QueryRetrieveLevel=PATIENT" -k "PatientName=${patientName}" -k "PatientID" -k "PatientBirthDate" -k "PatientSex" "${this.pacsHost}" "${this.pacsPort}"`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && stderr.includes('Association Request Failed')) {
        throw new Error(`PACS connection failed: ${stderr}`);
      }

      const patients = this.parsePatientResponse(stdout);
      
      return {
        success: true,
        data: {
          count: patients.length,
          patients: patients,
          queriedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[PACS] Patient query failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse patient query response
   */
  parsePatientResponse(output) {
    const patients = [];
    const responses = output.split('Find Response:').slice(1);

    for (const response of responses) {
      if (response.includes('(Pending)')) {
        const patient = {};

        const patientNameMatch = response.match(/\(0010,0010\) PN \[(.*?)\]/);
        if (patientNameMatch) {
          patient.patientName = patientNameMatch[1].trim();
        }

        const patientIdMatch = response.match(/\(0010,0020\) LO \[(.*?)\]/);
        if (patientIdMatch) {
          patient.patientId = patientIdMatch[1].trim();
        }

        const patientBirthDateMatch = response.match(/\(0010,0030\) DA \[(.*?)\]/);
        if (patientBirthDateMatch) {
          const dateStr = patientBirthDateMatch[1].trim();
          if (dateStr.length === 8) {
            patient.patientBirthDate = `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
          }
        }

        const patientSexMatch = response.match(/\(0010,0040\) CS \[(.*?)\]/);
        if (patientSexMatch) {
          patient.patientSex = patientSexMatch[1].trim();
        }

        if (patient.patientName) {
          patients.push(patient);
        }
      }
    }

    return patients;
  }

  /**
   * Query studies for a specific patient
   */
  async queryStudies(patientId = '*') {
    try {
      console.log(`[PACS] Querying studies for patient: ${patientId}`);
      
      const command = `docker exec ${this.findscu_container} findscu -v -aet "${this.localAET}" -aec "${this.remoteAET}" -S -k "QueryRetrieveLevel=STUDY" -k "PatientID=${patientId}" -k "StudyInstanceUID" -k "StudyDescription" -k "StudyDate" -k "StudyTime" -k "AccessionNumber" "${this.pacsHost}" "${this.pacsPort}"`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && stderr.includes('Association Request Failed')) {
        throw new Error(`PACS connection failed: ${stderr}`);
      }

      const studies = this.parseStudyResponse(stdout);
      
      return {
        success: true,
        data: {
          count: studies.length,
          studies: studies,
          patientId: patientId,
          queriedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('[PACS] Study query failed:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Parse study query response
   */
  parseStudyResponse(output) {
    const studies = [];
    const responses = output.split('Find Response:').slice(1);

    for (const response of responses) {
      if (response.includes('(Pending)')) {
        const study = {};

        const studyInstanceUIDMatch = response.match(/\(0020,000d\) UI \[(.*?)\]/);
        if (studyInstanceUIDMatch) {
          study.studyInstanceUID = studyInstanceUIDMatch[1].trim();
        }

        const studyDescriptionMatch = response.match(/\(0008,1030\) LO \[(.*?)\]/);
        if (studyDescriptionMatch) {
          study.studyDescription = studyDescriptionMatch[1].trim();
        }

        const studyDateMatch = response.match(/\(0008,0020\) DA \[(.*?)\]/);
        if (studyDateMatch) {
          const dateStr = studyDateMatch[1].trim();
          if (dateStr.length === 8) {
            study.studyDate = `${dateStr.substring(0,4)}-${dateStr.substring(4,6)}-${dateStr.substring(6,8)}`;
          }
        }

        const studyTimeMatch = response.match(/\(0008,0030\) TM \[(.*?)\]/);
        if (studyTimeMatch) {
          const timeStr = studyTimeMatch[1].trim();
          if (timeStr.length >= 4) {
            const hours = timeStr.substring(0,2);
            const minutes = timeStr.substring(2,4);
            const seconds = timeStr.length >= 6 ? timeStr.substring(4,6) : '00';
            study.studyTime = `${hours}:${minutes}:${seconds}`;
          }
        }

        const accessionNumberMatch = response.match(/\(0008,0050\) SH \[(.*?)\]/);
        if (accessionNumberMatch) {
          study.accessionNumber = accessionNumberMatch[1].trim();
        }

        if (study.studyInstanceUID || study.accessionNumber) {
          studies.push(study);
        }
      }
    }

    return studies;
  }

  /**
   * Test PACS connectivity
   */
  async testConnection() {
    try {
      console.log(`[PACS] Testing connection to ${this.pacsHost}:${this.pacsPort}`);
      
      const command = `docker exec ${this.findscu_container} findscu -v -aet "${this.localAET}" -aec "${this.remoteAET}" -W -k "PatientName" "${this.pacsHost}" "${this.pacsPort}"`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && stderr.includes('Association Request Failed')) {
        return {
          success: false,
          error: 'PACS connection failed',
          details: stderr
        };
      }

      return {
        success: true,
        message: 'PACS connection successful',
        data: {
          pacsHost: this.pacsHost,
          pacsPort: this.pacsPort,
          localAET: this.localAET,
          remoteAET: this.remoteAET,
          testedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get PACS service status
   */
  async getStatus() {
    try {
      const connectionTest = await this.testConnection();
      
      return {
        success: true,
        data: {
          service: 'PACS Service',
          version: '1.0.0',
          container: this.findscu_container,
          configuration: {
            pacsHost: this.pacsHost,
            pacsPort: this.pacsPort,
            localAET: this.localAET,
            remoteAET: this.remoteAET
          },
          connectivity: connectionTest,
          lastChecked: new Date().toISOString()
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = PACSService;
