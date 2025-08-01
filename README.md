# Hasta Radiologi API

A FastAPI application with Prisma ORM for database management.

## Features

- FastAPI web framework
- Prisma ORM for database operations
- MySQL database connection
- Environment-based configuration
- CORS support
- Health check endpoint

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

- `GET /` - API information
- `GET /health` - Health check with database connection status
- `GET /api/users` - Get all users (example endpoint)

## Database

The application connects to a MySQL database. Update the `prisma/schema.prisma` file to match your actual database schema.

## Scripts

- `npm run dev` - Start development server with auto-reload
- `npm start` - Start production server
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:push` - Push schema to database
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio
