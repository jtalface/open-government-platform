# Open Government Platform - Setup Guide

This guide will help you set up the Open Government Platform for local development.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 20.0.0 ([Download](https://nodejs.org/))
- **pnpm** >= 8.0.0 (`npm install -g pnpm`)
- **PostgreSQL** 15+ with PostGIS extension ([Download](https://www.postgresql.org/download/))
- **Mapbox** API token (free tier) ([Sign up](https://www.mapbox.com/))

## Quick Start

### 1. Clone and Install

```bash
# Install dependencies
pnpm install
```

### 2. Database Setup

Create a PostgreSQL database:

```bash
createdb ogp_dev

# Enable PostGIS extension
psql ogp_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### 3. Environment Configuration

Copy environment files:

```bash
# Web app environment
cp apps/web/.env.example apps/web/.env.local

# Database environment
cp packages/database/.env.example packages/database/.env
```

Edit `apps/web/.env.local`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ogp_dev?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here-change-me"
NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-token-here"
```

**Important**: 
- Replace `postgres:postgres` with your PostgreSQL username and password
- Generate a secure secret for `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- Add your Mapbox token

### 4. Database Migration & Seed

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed with sample data
pnpm db:seed
```

### 5. Start Development Server

```bash
pnpm dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Test Accounts

After seeding, you can log in with:

| Role | Email | Password |
|------|-------|----------|
| **Admin** | admin@lisboa.pt | demo123 |
| **Manager** | manager@lisboa.pt | demo123 |
| **Citizen** | citizen1@example.com | demo123 |
| **Citizen** | citizen2@example.com | demo123 |
| **Citizen** | citizen3@example.com | demo123 |

## Project Structure

```
open-government-platform/
├── apps/
│   └── web/                 # Next.js web application
│       ├── src/
│       │   ├── app/         # Next.js App Router pages
│       │   ├── components/  # React components
│       │   └── lib/         # Utilities and services
│       └── public/          # Static assets
├── packages/
│   ├── database/            # Prisma schema and database
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── seed.ts
│   │   └── src/
│   ├── types/               # Shared TypeScript types
│   └── ui/                  # Shared UI components
└── scripts/                 # Development scripts
```

## Development Workflow

### Running the Application

```bash
# Start all apps in development mode
pnpm dev

# Build for production
pnpm build

# Lint all packages
pnpm lint

# Format code
pnpm format
```

### Database Commands

```bash
# Open Prisma Studio (database GUI)
pnpm db:studio

# Create a new migration
pnpm db:migrate

# Reset database (WARNING: deletes all data)
./scripts/reset-db.sh

# Re-seed database
pnpm db:seed
```

### Adding a New Package

```bash
# Create new package
mkdir -p packages/my-package
cd packages/my-package
pnpm init

# Add dependency to a workspace package
pnpm --filter @ogp/web add @ogp/my-package
```

## Architecture Overview

### Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with PostGIS
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **State Management**: TanStack Query (React Query) + Zustand
- **Maps**: Mapbox GL (to be implemented)

### Key Features Implemented

#### Phase 0 & 1 (Complete)
- ✅ Monorepo setup with pnpm workspaces
- ✅ Database schema with PostGIS
- ✅ Authentication with NextAuth
- ✅ Role-based access control (RBAC)
- ✅ Incident creation with GPS location
- ✅ Incident listing and filtering
- ✅ Voting system with neighborhood constraints
- ✅ Importance scoring algorithm
- ✅ Responsive mobile-first UI

#### Phase 2 (Scaffolded)
- 🚧 Manager dashboard (structure ready)
- 🚧 Ticket management (structure ready)
- 🚧 Map visualization (placeholder)

### Database Schema

Key entities:

- **Municipality**: Multi-tenant configuration
- **User**: Users with roles (CITIZEN, MANAGER, ADMIN)
- **Category**: Extensible incident categories
- **Neighborhood**: Geographic boundaries (PostGIS polygons)
- **IncidentEvent**: Citizen-reported incidents
- **Vote**: Neighborhood-scoped votes
- **Ticket**: Manager work items
- **TicketUpdate**: Progress updates
- **AuditLog**: Audit trail

## API Documentation

### Authentication

```bash
# Sign in
POST /api/auth/signin
Content-Type: application/json

{
  "email": "admin@lisboa.pt",
  "password": "demo123"
}
```

### Incidents

```bash
# List incidents
GET /api/incidents
GET /api/incidents?categoryId=<uuid>
GET /api/incidents?lat=38.7223&lng=-9.1393&radius=5000

# Get incident
GET /api/incidents/:id

# Create incident
POST /api/incidents
Content-Type: application/json

{
  "categoryId": "uuid",
  "title": "Title",
  "description": "Description",
  "location": { "lat": 38.7223, "lng": -9.1393 }
}

# Vote on incident
POST /api/incidents/:id/vote
Content-Type: application/json

{
  "value": 1  // 1 for upvote, -1 for downvote
}

# Remove vote
DELETE /api/incidents/:id/vote
```

### Categories

```bash
# List categories
GET /api/categories
```

## Troubleshooting

### Database Connection Issues

If you see connection errors:

1. Ensure PostgreSQL is running: `pg_ctl status`
2. Check your DATABASE_URL in `.env.local`
3. Verify the database exists: `psql -l | grep ogp_dev`

### PostGIS Not Found

```bash
# Install PostGIS on macOS
brew install postgis

# Install PostGIS on Ubuntu
sudo apt-get install postgis

# Enable in database
psql ogp_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### Port Already in Use

If port 3000 is already in use:

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or run on a different port
PORT=3001 pnpm dev
```

### Prisma Client Issues

```bash
# Regenerate Prisma client
pnpm db:generate

# If issues persist, clear and regenerate
rm -rf node_modules/.prisma
pnpm db:generate
```

## Next Steps

### Phase 2 - Manager Tools (TODO)

- [ ] Implement Mapbox GL map with incident clustering
- [ ] Ticket creation from incidents
- [ ] Ticket status management
- [ ] Manager assignment workflow
- [ ] Ticket dashboard with filtering

### Phase 3 - Transparency (TODO)

- [ ] Public ticket progress pages
- [ ] Public update timeline
- [ ] Citizen notifications

### Phase 4 - Admin Controls (TODO)

- [ ] User role management UI
- [ ] Category CRUD
- [ ] Neighborhood management (GeoJSON upload)
- [ ] Municipality settings

### Phase 5 - Production (TODO)

- [ ] Media upload (S3 integration)
- [ ] Rate limiting
- [ ] Performance optimization
- [ ] PWA features (offline support)
- [ ] i18n (Portuguese/English)
- [ ] Monitoring and logging
- [ ] Automated tests

## Contributing

This is a demo/tutorial project. Key areas that need implementation:

1. **Mapbox Integration**: Replace placeholder map with real Mapbox GL
2. **Media Uploads**: Implement S3 upload for incident photos
3. **Ticket API**: Complete ticket management endpoints
4. **Tests**: Add unit and integration tests
5. **Admin UI**: Build admin configuration pages

## License

MIT

## Support

For questions or issues, please refer to the main README.md

