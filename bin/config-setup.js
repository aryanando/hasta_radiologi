#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

/**
 * Configuration Setup Utility
 * Helps users set up their .env file interactively
 */
class ConfigSetup {
  constructor() {
    this.config = {};
  }

  /**
   * Start the configuration setup
   */
  async start() {
    console.log('\n🔧 DICOM Worklist Generator - Configuration Setup');
    console.log('==================================================\n');

    console.log('This utility will help you configure the worklist generator.');
    console.log('Press Enter to use default values shown in [brackets].\n');

    try {
      await this.gatherConfiguration();
      await this.saveConfiguration();
      console.log('\n✅ Configuration saved successfully!');
      console.log('💡 You can edit the .env file directly to make further changes.\n');
    } catch (error) {
      console.error('❌ Error during configuration:', error.message);
    }

    rl.close();
  }

  /**
   * Gather configuration from user input
   */
  async gatherConfiguration() {
    console.log('📁 Storage Configuration:');
    this.config.WORKLIST_DIR = await this.askQuestion(
      'Worklist storage directory [worklists]: '
    ) || 'worklists';

    // Check if user wants to integrate with Orthanc MWL
    const orthancIntegration = await this.askQuestion(
      'Do you want to integrate with Orthanc MWL? (y/n) [n]: '
    );

    if (orthancIntegration.toLowerCase() === 'y' || orthancIntegration.toLowerCase() === 'yes') {
      const orthancPath = await this.askQuestion(
        'Enter path to Orthanc MWL worklists directory: '
      );
      if (orthancPath) {
        this.config.WORKLIST_DIR = orthancPath;
      }
    }

    console.log('\n🏥 Institution Configuration:');
    this.config.INSTITUTION_NAME = await this.askQuestion(
      'Institution name [Hasta Radiologi]: '
    ) || 'Hasta Radiologi';

    this.config.DEPARTMENT_NAME = await this.askQuestion(
      'Department name [Radiology]: '
    ) || 'Radiology';

    console.log('\n⚙️ Default Settings:');
    this.config.DEFAULT_MODALITY = await this.askQuestion(
      'Default modality (CR/CT/MR/US/etc.) [CR]: '
    ) || 'CR';

    this.config.DEFAULT_AE_TITLE = await this.askQuestion(
      'Default AE title [ORTHANC]: '
    ) || 'ORTHANC';

    console.log('\n📝 File Naming:');
    this.config.FILENAME_PREFIX = await this.askQuestion(
      'Filename prefix (optional): '
    ) || '';

    this.config.FILENAME_SUFFIX = await this.askQuestion(
      'Filename suffix (optional): '
    ) || '';

    console.log('\n🧹 Cleanup Settings:');
    this.config.CLEANUP_DAYS = await this.askQuestion(
      'Auto-cleanup files older than (days) [30]: '
    ) || '30';

    console.log('\n🔍 Validation Settings:');
    const validateFields = await this.askQuestion(
      'Enable field validation? (y/n) [y]: '
    );
    this.config.VALIDATE_REQUIRED_FIELDS = (validateFields.toLowerCase() !== 'n' && validateFields.toLowerCase() !== 'no').toString();

    const validateDates = await this.askQuestion(
      'Enable date format validation? (y/n) [y]: '
    );
    this.config.VALIDATE_DATE_FORMAT = (validateDates.toLowerCase() !== 'n' && validateDates.toLowerCase() !== 'no').toString();

    console.log('\n📊 Logging Settings:');
    this.config.LOG_LEVEL = await this.askQuestion(
      'Log level (error/warn/info/debug) [info]: '
    ) || 'info';

    this.config.LOG_FILE = await this.askQuestion(
      'Log file path [worklist-generator.log]: '
    ) || 'worklist-generator.log';
  }

  /**
   * Save configuration to .env file
   */
  async saveConfiguration() {
    const envContent = this.generateEnvContent();
    
    // Check if .env already exists
    if (fs.existsSync('.env')) {
      const overwrite = await this.askQuestion(
        '.env file already exists. Overwrite? (y/n) [n]: '
      );
      
      if (overwrite.toLowerCase() !== 'y' && overwrite.toLowerCase() !== 'yes') {
        console.log('Configuration cancelled.');
        return;
      }
    }

    fs.writeFileSync('.env', envContent, 'utf8');
  }

  /**
   * Generate .env file content
   */
  generateEnvContent() {
    return `# DICOM Worklist Generator Configuration
# Generated on ${new Date().toISOString()}

# Directory for storing generated worklist files
WORKLIST_DIR=${this.config.WORKLIST_DIR}

# Default institution information
INSTITUTION_NAME=${this.config.INSTITUTION_NAME}
DEPARTMENT_NAME=${this.config.DEPARTMENT_NAME}

# Default modality settings
DEFAULT_MODALITY=${this.config.DEFAULT_MODALITY}
DEFAULT_AE_TITLE=${this.config.DEFAULT_AE_TITLE}

# File naming options
FILENAME_PREFIX=${this.config.FILENAME_PREFIX}
FILENAME_SUFFIX=${this.config.FILENAME_SUFFIX}

# Cleanup settings (days)
CLEANUP_DAYS=${this.config.CLEANUP_DAYS}

# Validation settings
VALIDATE_REQUIRED_FIELDS=${this.config.VALIDATE_REQUIRED_FIELDS}
VALIDATE_DATE_FORMAT=${this.config.VALIDATE_DATE_FORMAT}

# Logging
LOG_LEVEL=${this.config.LOG_LEVEL}
LOG_FILE=${this.config.LOG_FILE}
`;
  }

  /**
   * Ask a question and wait for answer
   */
  askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nConfiguration cancelled.');
  rl.close();
  process.exit(0);
});

// Start the configuration setup
if (require.main === module) {
  const setup = new ConfigSetup();
  setup.start().catch(console.error);
}

module.exports = ConfigSetup;
