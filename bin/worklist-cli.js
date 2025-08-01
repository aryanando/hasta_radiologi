#!/usr/bin/env node

const OrthancWorklistService = require('../src/services/orthancWorklistService');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const worklistService = new OrthancWorklistService();

/**
 * CLI Tool for Orthanc Worklist Generation
 */
class OrthancWorklistCLI {
  constructor() {
    this.worklistData = {};
  }

  /**
   * Start the CLI interface
   */
  async start() {
    console.log('\n🏥 Hasta Radiologi - Orthanc Worklist Generator');
    console.log('================================================\n');

    const action = await this.askQuestion('What would you like to do?\n1. Create single worklist\n2. Create batch worklists\n3. List existing worklists\n4. Generate sample data\n5. Exit\n\nEnter choice (1-5): ');

    switch (action.trim()) {
      case '1':
        await this.createSingleWorklist();
        break;
      case '2':
        await this.createBatchWorklists();
        break;
      case '3':
        await this.listWorklists();
        break;
      case '4':
        await this.generateSampleData();
        break;
      case '5':
        console.log('Goodbye! 👋');
        process.exit(0);
        break;
      default:
        console.log('Invalid choice. Please try again.');
        await this.start();
    }
  }

  /**
   * Create a single worklist interactively
   */
  async createSingleWorklist() {
    console.log('\n📝 Creating Single Worklist');
    console.log('============================\n');

    try {
      // Patient Information
      console.log('Patient Information:');
      this.worklistData.patientId = await this.askQuestion('Patient ID: ');
      this.worklistData.patientName = await this.askQuestion('Patient Name (LastName^FirstName): ');
      this.worklistData.patientBirthDate = await this.askQuestion('Patient Birth Date (YYYY-MM-DD): ');
      this.worklistData.patientSex = await this.askQuestion('Patient Sex (M/F/U): ');

      // Study Information
      console.log('\nStudy Information:');
      this.worklistData.accessionNumber = await this.askQuestion('Accession Number: ');
      this.worklistData.studyDescription = await this.askQuestion('Study Description: ');
      this.worklistData.scheduledDate = await this.askQuestion('Scheduled Date (YYYY-MM-DD): ');
      this.worklistData.scheduledTime = await this.askQuestion('Scheduled Time (HH:MM): ');

      // Procedure Information
      console.log('\nProcedure Information:');
      this.worklistData.modality = await this.askQuestion('Modality (CR/CT/MR/US/etc.) [CR]: ') || 'CR';
      this.worklistData.scheduledProcedureStepDescription = await this.askQuestion('Procedure Description: ');
      this.worklistData.requestedProcedureDescription = await this.askQuestion('Requested Procedure: ');

      // Optional Information
      console.log('\nOptional Information:');
      this.worklistData.referringPhysician = await this.askQuestion('Referring Physician [optional]: ');
      this.worklistData.performingPhysician = await this.askQuestion('Performing Physician [optional]: ');

      // Generate worklist
      console.log('\n⏳ Generating worklist...');
      const result = await worklistService.createWorklist(this.worklistData);

      if (result.success) {
        console.log('✅ Worklist created successfully!');
        console.log(`📁 File: ${result.data.filename}`);
        console.log(`📍 Path: ${result.data.filepath}`);
        console.log('💡 Note: Generated as DICOM (.dcm) file for Orthanc compatibility');
      } else {
        console.log('❌ Failed to create worklist:');
        console.log(result.message);
      }

    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    await this.askToContinue();
  }

  /**
   * Create batch worklists from CSV or manual input
   */
  async createBatchWorklists() {
    console.log('\n📋 Creating Batch Worklists');
    console.log('============================\n');

    const method = await this.askQuestion('How would you like to create batch worklists?\n1. Manual input (limited)\n2. Generate sample batch\n\nEnter choice (1-2): ');

    if (method === '1') {
      await this.createManualBatch();
    } else if (method === '2') {
      await this.generateSampleBatch();
    } else {
      console.log('Invalid choice.');
    }

    await this.askToContinue();
  }

  /**
   * Create manual batch (limited to 3 entries for demo)
   */
  async createManualBatch() {
    const worklists = [];
    const count = parseInt(await this.askQuestion('How many worklists to create (max 3): ')) || 1;
    const maxCount = Math.min(count, 3);

    for (let i = 0; i < maxCount; i++) {
      console.log(`\n--- Worklist ${i + 1} ---`);
      const worklistData = {
        patientId: await this.askQuestion('Patient ID: '),
        patientName: await this.askQuestion('Patient Name: '),
        patientBirthDate: await this.askQuestion('Patient Birth Date (YYYY-MM-DD): '),
        patientSex: await this.askQuestion('Patient Sex (M/F/U): '),
        accessionNumber: await this.askQuestion('Accession Number: '),
        studyDescription: await this.askQuestion('Study Description: '),
        scheduledDate: await this.askQuestion('Scheduled Date (YYYY-MM-DD): '),
        scheduledTime: await this.askQuestion('Scheduled Time (HH:MM): ')
      };
      worklists.push(worklistData);
    }

    console.log('\n⏳ Generating batch worklists...');
    const result = await worklistService.createWorklistBatch(worklists);

    if (result.success) {
      console.log('✅ Batch worklists created!');
      console.log(`📊 Total: ${result.data.total}, Succeeded: ${result.data.succeeded}, Failed: ${result.data.failed}`);
    } else {
      console.log('❌ Failed to create batch worklists:');
      console.log(result.message);
    }
  }

  /**
   * Generate sample batch
   */
  async generateSampleBatch() {
    const count = parseInt(await this.askQuestion('How many sample worklists to generate (1-10): ')) || 3;
    const maxCount = Math.min(count, 10);

    const sampleWorklists = [];
    for (let i = 0; i < maxCount; i++) {
      const sample = worklistService.generateSampleData();
      sample.patientId = `P${Date.now()}_${i}`;
      sample.accessionNumber = `ACC${Date.now()}_${i}`;
      sample.patientName = `PATIENT^${i + 1}^TEST`;
      sampleWorklists.push(sample);
    }

    console.log('\n⏳ Generating sample worklists...');
    const result = await worklistService.createWorklistBatch(sampleWorklists);

    if (result.success) {
      console.log('✅ Sample worklists created!');
      console.log(`📊 Total: ${result.data.total}, Succeeded: ${result.data.succeeded}, Failed: ${result.data.failed}`);
    } else {
      console.log('❌ Failed to create sample worklists:');
      console.log(result.message);
    }
  }

  /**
   * List existing worklists
   */
  async listWorklists() {
    console.log('\n📂 Existing Worklists');
    console.log('======================\n');

    try {
      const result = await worklistService.getAllWorklists();

      if (result.success && result.data.files.length > 0) {
        console.log(`Found ${result.data.count} DICOM worklist file(s):\n`);
        
        result.data.files.forEach((file, index) => {
          console.log(`${index + 1}. ${file.filename}`);
          console.log(`   📅 Created: ${file.created.toLocaleString()}`);
          console.log(`   📊 Size: ${file.size} bytes`);
          console.log('');
        });

        // Get statistics
        const statsResult = await worklistService.getWorklistStats();
        if (statsResult.success) {
          console.log('📈 Statistics:');
          console.log(`   Total files: ${statsResult.data.totalFiles}`);
          console.log(`   Total size: ${statsResult.data.totalSize} bytes`);
          console.log(`   Average size: ${Math.round(statsResult.data.averageSize)} bytes`);
        }
      } else {
        console.log('No DICOM worklist files found.');
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    await this.askToContinue();
  }

  /**
   * Generate and display sample data
   */
  async generateSampleData() {
    console.log('\n🎯 Sample Worklist Data');
    console.log('========================\n');

    try {
      const sampleData = worklistService.generateSampleData();
      
      console.log('Patient Information:');
      console.log(`  Patient ID: ${sampleData.patientId}`);
      console.log(`  Patient Name: ${sampleData.patientName}`);
      console.log(`  Birth Date: ${sampleData.patientBirthDate}`);
      console.log(`  Sex: ${sampleData.patientSex}`);
      
      console.log('\nStudy Information:');
      console.log(`  Accession Number: ${sampleData.accessionNumber}`);
      console.log(`  Study Description: ${sampleData.studyDescription}`);
      console.log(`  Scheduled Date: ${sampleData.scheduledDate}`);
      console.log(`  Scheduled Time: ${sampleData.scheduledTime}`);
      
      console.log('\nProcedure Information:');
      console.log(`  Modality: ${sampleData.modality}`);
      console.log(`  Procedure: ${sampleData.scheduledProcedureStepDescription}`);
      console.log(`  Requested: ${sampleData.requestedProcedureDescription}`);

      const create = await this.askQuestion('\nWould you like to create a worklist with this sample data? (y/n): ');
      
      if (create.toLowerCase() === 'y' || create.toLowerCase() === 'yes') {
        console.log('\n⏳ Creating worklist...');
        const result = await worklistService.createWorklist(sampleData);
        
        if (result.success) {
          console.log('✅ Sample worklist created successfully!');
          console.log(`📁 File: ${result.data.filename}`);
        } else {
          console.log('❌ Failed to create worklist:');
          console.log(result.message);
        }
      }
    } catch (error) {
      console.log('❌ Error:', error.message);
    }

    await this.askToContinue();
  }

  /**
   * Ask a question and wait for answer
   */
  askQuestion(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer);
      });
    });
  }

  /**
   * Ask if user wants to continue
   */
  async askToContinue() {
    console.log('\n');
    const continueChoice = await this.askQuestion('Would you like to do something else? (y/n): ');
    
    if (continueChoice.toLowerCase() === 'y' || continueChoice.toLowerCase() === 'yes') {
      await this.start();
    } else {
      console.log('Goodbye! 👋');
      rl.close();
      process.exit(0);
    }
  }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nGoodbye! 👋');
  rl.close();
  process.exit(0);
});

// Start the CLI
if (require.main === module) {
  const cli = new OrthancWorklistCLI();
  cli.start().catch(console.error);
}

module.exports = OrthancWorklistCLI;
