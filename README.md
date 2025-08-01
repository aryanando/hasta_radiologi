# Hasta Radiologi API

A FastAPI application with Prisma ORM for database management and Orthanc DICOM worklist generation.

## Features

- FastAPI web framework
- Prisma ORM for database operations
- MySQL database connection
- Environment-based configuration
- CORS support
- Health check endpoint
- **🆕 Orthanc DICOM Worklist Generator**
  - Generate proper DICOM binary files for Orthanc PACS
  - Full DICOM Part 10 compliance
  - RESTful API for worklist management
  - Interactive CLI tool
  - Batch worklist creation
  - File management and cleanup

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

3. Generate Prisma client:
```bash
npm run prisma:generate
```

4. Push database schema (or run migrations):
```bash
npm run prisma:push
```

## Development

Start the development server:
```bash
npm run dev
```

The server will start on `http://localhost:3000`

## API Endpoints

### Core Endpoints
- `GET /` - API information
- `GET /health` - Health check with database connection status
- `GET /api/users` - Get all users (example endpoint)

### Orthanc Worklist Endpoints
- `POST /api/worklist` - Create a single worklist
- `POST /api/worklist/batch` - Create multiple worklists
- `GET /api/worklist` - Get all worklist files
- `GET /api/worklist/stats` - Get worklist statistics
- `GET /api/worklist/download/:filename` - Download worklist file
- `DELETE /api/worklist/:filename` - Delete a worklist
- `DELETE /api/worklist/cleanup/:days` - Cleanup old worklists
- `GET /api/worklist/sample` - Generate sample worklist data

## Database

The application connects to a MySQL database. Update the `prisma/schema.prisma` file to match your actual database schema.

## Scripts

- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:push` - Push schema to database
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
- **`npm run worklist`** - Start interactive worklist CLI tool
- **`npm run test:worklist`** - Test worklist generator functionality

## Orthanc Worklist Generator

### Quick Start

1. **Test the worklist generator:**
```bash
npm run test:worklist
```

2. **Use the interactive CLI:**
```bash
npm run worklist
```

3. **Create a worklist via API:**
```bash
curl -X POST http://localhost:3000/api/worklist \
  -H "Content-Type: application/json" \
  -d '{
    "patientId": "P001",
    "patientName": "DOE^JOHN",
    "patientBirthDate": "1990-01-01",
    "patientSex": "M",
    "accessionNumber": "ACC001",
    "studyDescription": "Chest X-Ray",
    "scheduledDate": "2025-08-02",
    "scheduledTime": "10:00"
  }'
```

### Documentation

For complete documentation on the Orthanc Worklist Generator, see [docs/ORTHANC_WORKLIST.md](docs/ORTHANC_WORKLIST.md)
