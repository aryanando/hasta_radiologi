const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const helmet = require('helmet');
const WorklistService = require('../lib/worklistService');
const PACSService = require('../lib/pacsService');
require('dotenv').config();

/**
 * DICOM Worklist REST API Server
 * Provides REST endpoints for SIM RS integration
 */
class WorklistAPIServer {
  constructor(port = process.env.API_PORT || 3000) {
    this.app = express();
    this.port = port;
    this.worklistService = new WorklistService();
    this.pacsService = new PACSService();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  /**
   * Setup middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());
    
    // CORS middleware
    this.app.use(cors({
      origin: process.env.CORS_ORIGIN || '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    // Logging middleware
    this.app.use(morgan('combined'));
    
    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        service: 'DICOM Worklist API',
        version: '1.0.0'
      });
    });

    // API info endpoint
    this.app.get('/api', (req, res) => {
      res.json({
        name: 'DICOM Worklist REST API',
        version: '1.0.0',
        description: 'REST API for creating DICOM worklists from SIM RS',
        endpoints: {
          'GET /health': 'Health check',
          'GET /api': 'API information',
          'POST /api/worklist': 'Create single worklist',
          'POST /api/worklist/batch': 'Create multiple worklists',
          'GET /api/worklists': 'List all worklists',
          'GET /api/worklists/stats': 'Get worklist statistics',
          'DELETE /api/worklist/:filename': 'Delete a worklist',
          'GET /api/pacs/worklists': 'Query all worklists from PACS',
          'GET /api/pacs/patients': 'Query patients from PACS',
          'GET /api/pacs/studies/:patientId': 'Query studies for patient',
          'GET /api/pacs/status': 'Get PACS service status',
          'POST /api/pacs/test': 'Test PACS connectivity'
        }
      });
    });

    // Create single worklist
    this.app.post('/api/worklist', async (req, res) => {
      try {
        const worklistData = req.body;
        
        // Validate required fields
        const validation = this.validateWorklistData(worklistData);
        if (!validation.valid) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed',
            details: validation.errors
          });
        }

        const result = await this.worklistService.createWorklist(worklistData);
        
        if (result.success) {
          res.status(201).json({
            success: true,
            message: 'Worklist created successfully',
            data: {
              filename: result.data.filename,
              filepath: result.data.filepath,
              size: result.data.size,
              accessionNumber: worklistData.accessionNumber,
              patientId: worklistData.patientId,
              createdAt: new Date().toISOString()
            }
          });
        } else {
          res.status(500).json({
            success: false,
            error: result.message
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Create multiple worklists (batch)
    this.app.post('/api/worklist/batch', async (req, res) => {
      try {
        const { worklists } = req.body;
        
        if (!Array.isArray(worklists)) {
          return res.status(400).json({
            success: false,
            error: 'Request body must contain an array of worklists'
          });
        }

        // Validate all worklists
        const validationErrors = [];
        worklists.forEach((worklist, index) => {
          const validation = this.validateWorklistData(worklist);
          if (!validation.valid) {
            validationErrors.push({
              index,
              errors: validation.errors
            });
          }
        });

        if (validationErrors.length > 0) {
          return res.status(400).json({
            success: false,
            error: 'Validation failed for some worklists',
            details: validationErrors
          });
        }

        const result = await this.worklistService.createWorklistBatch(worklists);
        
        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            total: result.data.total,
            succeeded: result.data.succeeded,
            failed: result.data.failed,
            results: result.data.results.map(r => ({
              success: r.success,
              filename: r.success ? r.data.filename : null,
              error: r.success ? null : r.error
            })),
            createdAt: new Date().toISOString()
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // List all worklists
    this.app.get('/api/worklists', async (req, res) => {
      try {
        const result = await this.worklistService.getAllWorklists();
        
        if (result.success) {
          res.json({
            success: true,
            data: {
              count: result.data.count,
              files: result.data.files.map(file => ({
                filename: file.filename,
                size: file.size,
                created: file.created,
                modified: file.modified
              }))
            }
          });
        } else {
          res.status(500).json({
            success: false,
            error: result.message
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get worklist statistics
    this.app.get('/api/worklists/stats', async (req, res) => {
      try {
        const result = await this.worklistService.getWorklistStats();
        
        if (result.success) {
          res.json({
            success: true,
            data: result.data
          });
        } else {
          res.status(500).json({
            success: false,
            error: result.message
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Delete a worklist
    this.app.delete('/api/worklist/:filename', async (req, res) => {
      try {
        const { filename } = req.params;
        
        if (!filename || !filename.endsWith('.wl')) {
          return res.status(400).json({
            success: false,
            error: 'Invalid filename. Must be a .wl file'
          });
        }

        await this.worklistService.generator.deleteWorklistFile(filename);
        
        res.json({
          success: true,
          message: 'Worklist deleted successfully',
          data: { filename }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Cleanup old worklists
    this.app.post('/api/worklists/cleanup', async (req, res) => {
      try {
        const { days } = req.body;
        const deletedFiles = await this.worklistService.generator.cleanupOldFiles(days);
        
        res.json({
          success: true,
          message: `Cleanup completed. ${deletedFiles.length} files deleted.`,
          data: {
            deletedCount: deletedFiles.length,
            deletedFiles
          }
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // PACS Integration Endpoints

    // Query all worklists from PACS
    this.app.get('/api/pacs/worklists', async (req, res) => {
      try {
        const result = await this.pacsService.queryWorklists();
        
        if (result.success) {
          res.json({
            success: true,
            message: 'Worklists retrieved from PACS successfully',
            data: result.data
          });
        } else {
          res.status(500).json({
            success: false,
            error: result.error,
            details: result.details
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Query patients from PACS
    this.app.get('/api/pacs/patients', async (req, res) => {
      try {
        const { patientName } = req.query;
        const result = await this.pacsService.queryPatient(patientName);
        
        if (result.success) {
          res.json({
            success: true,
            message: 'Patients retrieved from PACS successfully',
            data: result.data
          });
        } else {
          res.status(500).json({
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Query studies for a specific patient
    this.app.get('/api/pacs/studies/:patientId', async (req, res) => {
      try {
        const { patientId } = req.params;
        const result = await this.pacsService.queryStudies(patientId);
        
        if (result.success) {
          res.json({
            success: true,
            message: 'Studies retrieved from PACS successfully',
            data: result.data
          });
        } else {
          res.status(500).json({
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Get PACS service status
    this.app.get('/api/pacs/status', async (req, res) => {
      try {
        const result = await this.pacsService.getStatus();
        
        if (result.success) {
          res.json({
            success: true,
            data: result.data
          });
        } else {
          res.status(500).json({
            success: false,
            error: result.error
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });

    // Test PACS connectivity
    this.app.post('/api/pacs/test', async (req, res) => {
      try {
        const result = await this.pacsService.testConnection();
        
        if (result.success) {
          res.json({
            success: true,
            message: 'PACS connection test successful',
            data: result.data
          });
        } else {
          res.status(500).json({
            success: false,
            error: result.error,
            details: result.details
          });
        }
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message
        });
      }
    });
  }

  /**
   * Validate worklist data
   */
  validateWorklistData(data) {
    const errors = [];
    
    // Required fields
    if (!data.patientId) errors.push('patientId is required');
    if (!data.patientName) errors.push('patientName is required');
    if (!data.accessionNumber) errors.push('accessionNumber is required');
    if (!data.scheduledDate) errors.push('scheduledDate is required');
    if (!data.scheduledTime) errors.push('scheduledTime is required');
    
    // Date format validation
    if (data.scheduledDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.scheduledDate)) {
      errors.push('scheduledDate must be in YYYY-MM-DD format');
    }
    
    if (data.patientBirthDate && !/^\d{4}-\d{2}-\d{2}$/.test(data.patientBirthDate)) {
      errors.push('patientBirthDate must be in YYYY-MM-DD format');
    }
    
    // Time format validation
    if (data.scheduledTime && !/^\d{2}:\d{2}(:\d{2})?$/.test(data.scheduledTime)) {
      errors.push('scheduledTime must be in HH:MM or HH:MM:SS format');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Setup error handling
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res, next) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        message: `${req.method} ${req.originalUrl} is not a valid endpoint`
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error('API Error:', err);
      
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
      });
    });
  }

  /**
   * Start the server
   */
  start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log(`\n🚀 DICOM Worklist API Server`);
          console.log(`📡 Running on: http://localhost:${this.port}`);
          console.log(`📋 API Documentation: http://localhost:${this.port}/api`);
          console.log(`❤️  Health Check: http://localhost:${this.port}/health`);
          console.log(`📁 Worklist Directory: ${process.env.WORKLIST_DIR || 'worklists'}\n`);
          resolve();
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the server
   */
  stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log('API Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = WorklistAPIServer;
