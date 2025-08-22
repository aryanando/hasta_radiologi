#!/usr/bin/env node

/**
 * Example SIM RS Integration
 * This shows how your Hospital Information System can integrate with the Worklist API
 */

const axios = require('axios');

// Configuration
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3000';

class SIMRSIntegration {
  constructor(baseUrl = API_BASE_URL) {
    this.baseUrl = baseUrl;
    this.api = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }

  /**
   * Create worklist when radiology request is made in SIM RS
   * @param {Object} radiologyRequest - Data from SIM RS
   */
  async createWorklistFromRadiologyRequest(radiologyRequest) {
    try {
      // Transform SIM RS data to DICOM worklist format
      const worklistData = this.transformSIMRSData(radiologyRequest);
      
      console.log('🏥 Creating worklist from SIM RS request...');
      console.log(`📋 Patient: ${worklistData.patientName}`);
      console.log(`🆔 Accession: ${worklistData.accessionNumber}`);
      console.log(`📅 Scheduled: ${worklistData.scheduledDate} ${worklistData.scheduledTime}`);
      
      const response = await this.api.post('/api/worklist', worklistData);
      
      if (response.data.success) {
        console.log('✅ Worklist created successfully!');
        console.log(`📁 File: ${response.data.data.filename}`);
        
        // Update SIM RS with worklist status
        await this.updateSIMRSStatus(radiologyRequest.requestId, 'worklist_created', {
          worklistFile: response.data.data.filename,
          createdAt: response.data.data.createdAt
        });
        
        return response.data;
      }
    } catch (error) {
      console.error('❌ Failed to create worklist:', error.message);
      
      // Update SIM RS with error status
      await this.updateSIMRSStatus(radiologyRequest.requestId, 'worklist_failed', {
        error: error.message
      });
      
      throw error;
    }
  }

  /**
   * Transform SIM RS data to DICOM worklist format
   * @param {Object} simrsData - Data from SIM RS
   */
  transformSIMRSData(simrsData) {
    return {
      // Patient Information
      patientId: simrsData.patient.id || simrsData.patient.mrn,
      patientName: this.formatPatientName(simrsData.patient),
      patientBirthDate: this.formatDate(simrsData.patient.birthDate),
      patientSex: simrsData.patient.gender?.toUpperCase().charAt(0) || 'U',
      
      // Study Information
      accessionNumber: simrsData.accessionNumber || `ACC${Date.now()}`,
      studyDescription: simrsData.examination?.description || simrsData.procedureType,
      scheduledDate: this.formatDate(simrsData.scheduledDate),
      scheduledTime: this.formatTime(simrsData.scheduledTime),
      
      // Procedure Information
      modality: this.mapModalityFromSIMRS(simrsData.modalityType || simrsData.examination?.modality),
      scheduledProcedureStepDescription: simrsData.examination?.procedure || simrsData.procedureDescription,
      requestedProcedureDescription: simrsData.indication || simrsData.clinicalInfo,
      
      // Physician Information
      referringPhysician: this.formatPhysicianName(simrsData.referringDoctor),
      performingPhysician: this.formatPhysicianName(simrsData.performingDoctor),
      
      // Institution Information (from config or SIM RS)
      institutionName: simrsData.hospital?.name || process.env.INSTITUTION_NAME,
      departmentName: simrsData.department?.name || process.env.DEPARTMENT_NAME
    };
  }

  /**
   * Format patient name to DICOM format (Last^First^Middle)
   */
  formatPatientName(patient) {
    const lastName = patient.lastName || patient.surname || '';
    const firstName = patient.firstName || patient.givenName || '';
    const middleName = patient.middleName || '';
    
    return `${lastName}^${firstName}^${middleName}`.replace(/\^+$/, '');
  }

  /**
   * Format physician name to DICOM format
   */
  formatPhysicianName(doctor) {
    if (!doctor) return '';
    
    if (typeof doctor === 'string') return doctor;
    
    const lastName = doctor.lastName || '';
    const firstName = doctor.firstName || '';
    const title = doctor.title || 'DR';
    
    return `${title}^${lastName}^${firstName}`.replace(/\^+$/, '');
  }

  /**
   * Format date to YYYY-MM-DD
   */
  formatDate(dateInput) {
    if (!dateInput) return '';
    
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '';
    
    return date.toISOString().split('T')[0];
  }

  /**
   * Format time to HH:MM:SS
   */
  formatTime(timeInput) {
    if (!timeInput) return '';
    
    // If it's already in HH:MM or HH:MM:SS format
    if (typeof timeInput === 'string' && /^\d{1,2}:\d{2}(:\d{2})?$/.test(timeInput)) {
      return timeInput.length === 5 ? `${timeInput}:00` : timeInput;
    }
    
    // If it's a Date object or timestamp
    const date = new Date(timeInput);
    if (isNaN(date.getTime())) return '';
    
    return date.toTimeString().split(' ')[0];
  }

  /**
   * Map SIM RS modality types to DICOM modalities
   */
  mapModalityFromSIMRS(modalityType) {
    const modalityMap = {
      'X-Ray': 'CR',
      'Chest X-Ray': 'CR',
      'Radiography': 'CR',
      'CT Scan': 'CT',
      'CT': 'CT',
      'MRI': 'MR',
      'MR': 'MR',
      'Ultrasound': 'US',
      'USG': 'US',
      'Mammography': 'MG',
      'Fluoroscopy': 'RF',
      'Nuclear Medicine': 'NM'
    };
    
    return modalityMap[modalityType] || process.env.DEFAULT_MODALITY || 'CR';
  }

  /**
   * Update SIM RS with worklist creation status
   * This would call your SIM RS API to update the radiology request status
   */
  async updateSIMRSStatus(requestId, status, data = {}) {
    try {
      // Example - replace with your actual SIM RS API endpoint
      console.log(`📡 Updating SIM RS status for request ${requestId}: ${status}`);
      
      // Uncomment and modify for your SIM RS integration:
      /*
      await axios.post(`${SIMRS_API_URL}/radiology-requests/${requestId}/status`, {
        status: status,
        worklistData: data,
        updatedAt: new Date().toISOString()
      });
      */
      
    } catch (error) {
      console.warn('⚠️ Failed to update SIM RS status:', error.message);
    }
  }

  /**
   * Check API health
   */
  async checkHealth() {
    try {
      const response = await this.api.get('/health');
      return response.data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }
}

// Example usage
async function demonstrateIntegration() {
  const integration = new SIMRSIntegration();
  
  // Check if API is running
  const isHealthy = await integration.checkHealth();
  if (!isHealthy) {
    console.error('❌ Worklist API is not running. Start it with: npm run api');
    return;
  }
  
  // Example radiology request from SIM RS
  const radiologyRequest = {
    requestId: 'REQ123456',
    patient: {
      id: 'P789012',
      mrn: 'MRN123456',
      firstName: 'John',
      lastName: 'Doe',
      middleName: 'Middle',
      birthDate: '1985-05-15',
      gender: 'Male'
    },
    accessionNumber: 'ACC789012345',
    examination: {
      description: 'Chest X-Ray',
      modality: 'X-Ray',
      procedure: 'Chest X-Ray PA and Lateral'
    },
    scheduledDate: '2025-08-23',
    scheduledTime: '14:30:00',
    indication: 'Routine chest examination',
    referringDoctor: {
      firstName: 'Robert',
      lastName: 'Smith',
      title: 'DR'
    },
    hospital: {
      name: 'Hasta Radiologi Hospital'
    },
    department: {
      name: 'Radiology Department'
    }
  };
  
  try {
    const result = await integration.createWorklistFromRadiologyRequest(radiologyRequest);
    console.log('\n🎉 Integration successful!');
    console.log('💡 The worklist is now available in Orthanc PACS');
  } catch (error) {
    console.error('\n❌ Integration failed:', error.message);
  }
}

// Install axios if running this example
async function checkAxios() {
  try {
    require('axios');
  } catch (error) {
    console.log('📦 Installing axios...');
    const { execSync } = require('child_process');
    execSync('npm install axios', { stdio: 'inherit' });
    console.log('✅ Axios installed');
  }
}

if (require.main === module) {
  checkAxios().then(() => {
    demonstrateIntegration();
  });
}

module.exports = SIMRSIntegration;
