# Open Government Platform (OGP)

A production-grade, mobile-first municipal incident reporting and transparency platform.

## Overview

This platform enables citizens to report municipal incidents, managers to triage and create tickets, and administrators to manage municipality configuration. It features neighborhood-scoped voting, geo-based incident tracking, and public transparency features.

## Architecture

### Tech Stack

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, TypeScript
- **Database**: PostgreSQL + PostGIS
- **ORM**: Prisma
- **Auth**: NextAuth.js
- **Maps**: Mapbox GL
- **Monorepo**: pnpm workspaces + Turbo

### Monorepo Structure

```
open-government-platform/
├── apps/
│   └── web/              # Next.js web application (PWA)
├── packages/
│   ├── database/         # Prisma schema, migrations, seed data
│   ├── api-client/       # Type-safe API client
│   ├── ui/               # Shared UI components
│   └── types/            # Shared TypeScript types
```

## User Roles

1. **Citizen** - Report incidents, vote on incidents in their neighborhood, view public tickets
2. **Manager** - Triage incidents, create/manage tickets, post updates
3. **Administrator** - Manage users, roles, categories, neighborhoods, municipality settings

## Key Features

### Phase 1 (MVP)
- ✅ Citizen incident reporting with GPS + reverse geocoding
- ✅ Neighborhood-scoped voting
- ✅ Importance scoring (neighborhood-weighted + recency)
- ✅ Mobile-first responsive design
- ✅ Authentication & RBAC

### Phase 2 (Manager Tools)
- 🚧 Map-based incident triage
- 🚧 Ticket management dashboard
- 🚧 Status tracking & audit logs

### Phase 3 (Transparency)
- 📋 Public ticket progress pages
- 📋 Public update timeline

### Phase 4 (Admin Controls)
- 📋 Role management UI
- 📋 Category management
- 📋 Neighborhood configuration

### Phase 5 (Production)
- 📋 Performance optimization
- 📋 PWA features
- 📋 i18n (Portuguese/English)

## 🚀 Getting Started

### Quick Start (5 minutes)

**New here?** Follow our quick start guide:

👉 **[QUICKSTART.md](./QUICKSTART.md)** - Get running in 5 minutes!

### Documentation

We have comprehensive documentation:

| Document | Description |
|----------|-------------|
| **[INDEX.md](./INDEX.md)** | 📑 Documentation navigator |
| **[QUICKSTART.md](./QUICKSTART.md)** | ⚡ 5-minute setup guide |
| **[SETUP.md](./SETUP.md)** | 🔧 Detailed development guide |
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | 🏗️ System design & patterns |
| **[API.md](./API.md)** | 🔌 API endpoint reference |
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | ✅ What's built & what's not |

### Prerequisites

- Node.js >= 20.0.0
- pnpm >= 8.0.0
- PostgreSQL 15+ with PostGIS extension
- Mapbox API key (optional for Phase 1)

### One-Command Setup

```bash
# Run the setup script
./scripts/setup-dev.sh
```

Or manually:

```bash
# 1. Install dependencies
pnpm install

# 2. Setup environment
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your credentials

# 3. Initialize database
createdb ogp_dev
psql ogp_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;"
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 4. Start development
pnpm dev
```

Visit: **http://localhost:3000**

### Test Accounts

After seeding, sign in with:

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | admin@lisboa.pt | demo123 | Full access |
| **Manager** | manager@lisboa.pt | demo123 | Dashboard + tickets |
| **Citizen** | citizen1@example.com | demo123 | Report + vote |

More accounts in [QUICKSTART.md](./QUICKSTART.md)

## Database Schema

### Core Entities

- **Municipality** - Multi-tenant municipality configuration
- **User** - Users with role-based access (CITIZEN, MANAGER, ADMIN)
- **Category** - Extensible incident categories per municipality
- **Neighborhood** - Geographic boundaries (GeoJSON polygons)
- **IncidentEvent** - Citizen-reported incidents with geo data
- **Vote** - Neighborhood-scoped votes on incidents
- **Ticket** - Manager-created work items from incidents
- **TicketUpdate** - Progress updates (public/internal)
- **AuditLog** - Audit trail for sensitive actions

## API Design

### Authentication
- `POST /api/auth/signin` - Sign in
- `POST /api/auth/signout` - Sign out
- `POST /api/auth/signup` - Register new user

### Incidents (Citizen)
- `POST /api/incidents` - Create incident
- `GET /api/incidents` - List incidents (filtered, nearby)
- `GET /api/incidents/:id` - Get incident details
- `POST /api/incidents/:id/vote` - Vote on incident
- `DELETE /api/incidents/:id/vote` - Remove vote

### Tickets (Manager)
- `POST /api/tickets` - Create ticket from incident
- `GET /api/tickets` - List tickets
- `PATCH /api/tickets/:id` - Update ticket status
- `POST /api/tickets/:id/updates` - Add progress update

### Admin
- `POST /api/admin/users/:id/role` - Assign role
- `POST /api/admin/categories` - Create category
- `POST /api/admin/neighborhoods` - Create neighborhood

## Development

### Project Commands

```bash
# Development
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all apps
pnpm lint             # Lint all packages
pnpm test             # Run tests
pnpm format           # Format code with Prettier

# Database
pnpm db:generate      # Generate Prisma client
pnpm db:migrate       # Run migrations
pnpm db:push          # Push schema changes (dev only)
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database

# Cleanup
pnpm clean            # Clean all build artifacts
```

### Code Structure

#### Domain Layer
Pure business logic and entities (`packages/types`)

#### Application Layer
Use cases and business workflows (`apps/web/src/lib/services`)

#### Infrastructure Layer
Database, storage, external services (`packages/database`, `apps/web/src/lib/infrastructure`)

#### Presentation Layer
API routes and UI components (`apps/web/src/app`)

## Security

- Role-based access control (RBAC) enforced at API and UI levels
- Server-side validation for all mutations
- Rate limiting on incident creation and voting
- One vote per incident per user (unique constraint)
- Neighborhood verification for voting eligibility
- Audit logging for sensitive operations
- Data privacy: citizen identity anonymized by default

## Deployment

### Environment Variables

Required:
- `DATABASE_URL` - PostgreSQL connection string with PostGIS
- `NEXTAUTH_URL` - Application URL
- `NEXTAUTH_SECRET` - NextAuth secret
- `NEXT_PUBLIC_MAPBOX_TOKEN` - Mapbox API token

Optional:
- `S3_BUCKET` - S3 bucket for media uploads
- `S3_REGION` - AWS region
- `AWS_ACCESS_KEY_ID` - AWS credentials
- `AWS_SECRET_ACCESS_KEY` - AWS credentials

### Production Checklist

- [ ] Enable HTTPS
- [ ] Configure CORS
- [ ] Set up CDN for static assets
- [ ] Configure S3 for media uploads
- [ ] Enable database connection pooling
- [ ] Set up monitoring and logging
- [ ] Configure rate limiting
- [ ] Enable PWA features
- [ ] Set up automated backups

## License

MIT

## 📖 Learn More

- **[INDEX.md](./INDEX.md)** - Documentation navigator by role
- **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** - Detailed implementation status
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Deep dive into system design
- **[API.md](./API.md)** - Complete API reference

## 🤝 Contributing

1. Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for current status
2. Pick a TODO item (marked with 🚧 or ❌)
3. Follow existing code patterns
4. Update documentation
5. Test thoroughly with all roles

## 🐛 Troubleshooting

Having issues? Check:
1. [QUICKSTART.md](./QUICKSTART.md#troubleshooting) - Common issues
2. [SETUP.md](./SETUP.md#troubleshooting) - Detailed debugging
3. Verify PostgreSQL is running: `pg_ctl status`
4. Check PostGIS is enabled: `psql ogp_dev -c "SELECT PostGIS_version();"`

## 📊 Project Status

**Phase 0 & 1**: ✅ **COMPLETE**
- Full citizen incident workflow
- Authentication & RBAC
- Voting with neighborhood constraints
- Importance scoring algorithm

**Phase 2**: 🚧 **SCAFFOLDED**
- Manager dashboard structure ready
- Ticket management UI scaffolded
- APIs need implementation

See [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for details.

## Support

Questions? Check our comprehensive documentation starting with [INDEX.md](./INDEX.md)!


## 📢 Official Channels Feature

The Official Channels feature enables municipality officials to communicate directly with citizens through official channels.

### Overview

- **Citizens** can browse official channels and view posts from municipal officials
- **Managers/Admins** can publish posts to channels they have permission for
- **Admins** can create/manage channels and grant posting permissions

### Key Features

1. **Channel Management (Admin)**
   - Create official channels for municipal officials
   - Edit channel information (name, title, bio, avatar)
   - Activate/deactivate channels
   - Grant/revoke posting permissions to managers

2. **Post Creation (Manager/Admin)**
   - "Post on my channel" button in dashboard
   - Rich text posts with optional attachments
   - Public visibility by default
   - Automatic audit logging

3. **Citizen View**
   - Browse all active channels in their municipality
   - View channel feeds with reverse chronological posts
   - Verified badge for official channels
   - Mobile-first, responsive design

### Access Control (RBAC)

- **Citizen**: Can only view channels and posts (read-only)
- **Manager**: Can post to channels they have explicit permission for
- **Admin**: Can post to any channel + manage all channels and permissions

All permissions are scoped to the user's municipality.

## Projects

Municipal projects are the next step in the workflow after tickets have been triaged. Once a ticket is approved, administrators can create a **Project** to execute the work. Projects are visible to all users (Citizens, Managers, Admins) for full transparency.

### Project Lifecycle

Projects follow a well-defined status flow:

1. **OPEN** - Initial state after creation
2. **PLANNING** - Project is being planned
3. **FUNDED** - Funding has been secured (requires `fundingSource`)
4. **BIDDING** - Project is in the bidding/tender process
5. **ASSIGNED** - Contractor/vendor has been assigned (requires `assignedToName`)
6. **WORK_STARTED** - Construction/implementation has begun
7. **COMPLETED** - Project is complete

### Key Features

- **One Project per Ticket**: Each project is linked to exactly one ticket (unique constraint)
- **Municipality Scoping**: All projects are scoped to a municipality
- **Budget Tracking**: Track budget amount, currency, and funding source
- **Contractor Management**: Track assigned contractors and bidding references
- **Timeline Tracking**: Automatic timestamps for key milestones (assigned, work started, completed)
- **Archiving**: Projects can be archived while maintaining full history
- **Public Updates**: Projects can have public updates for transparency
- **Status Validation**: Status transitions enforce business rules (e.g., FUNDED requires funding source)

### Access Control (RBAC)

- **Citizen**: Can view all projects and public updates in their municipality (read-only)
- **Manager**: Can view all projects and public updates in their municipality (read-only)
- **Admin**: Full CRUD access - create, edit, update status, archive, unarchive projects

### Data Model

**Project**
- Links to: Municipality, Ticket (unique), Category, Creator (User)
- Fields: title, description, status, budget (amount + currency), funding source, bidding reference, contractor info
- Timestamps: created, updated, assigned, work started, completed, archived
- Relations: Updates (1-to-many)

**ProjectUpdate**
- Links to: Project, Municipality, Author (User)
- Fields: message, visibility (PUBLIC | INTERNAL), attachments
- Public updates are visible to all users; internal updates only to managers/admins

### UI Features

**Projects Tab** (available to all users)
- Three sections: Ongoing, Completed, Archived
- Project cards show: title, category, status, budget, funding, contractor, last update
- Click to view full project details

**Project Detail Page**
- Full project information and timeline
- Link to originating ticket
- Public updates feed
- Admin actions: Edit, Change Status, Archive/Unarchive

**Create Project from Ticket** (Admin only)
- Available on ticket detail pages
- Pre-fills project data from ticket
- Enforces one project per ticket constraint

### API Endpoints

**Citizen (Read)**
- `GET /api/channels` - List all active channels
- `GET /api/channels/:channelId/posts` - Get paginated posts for a channel

**Manager/Admin (Write)**
- `POST /api/channels/:channelId/posts` - Create a new post
- `PATCH /api/channel-posts/:postId` - Update a post (author or admin only)
- `DELETE /api/channel-posts/:postId` - Soft delete a post (author or admin only)
- `GET /api/my-channels` - Get channels user can post to

**Admin Only**
- `GET /api/admin/channels` - List all channels (including inactive)
- `POST /api/admin/channels` - Create a new channel
- `PATCH /api/admin/channels/:channelId` - Update channel
- `GET /api/admin/channels/:channelId/permissions` - List permissions
- `POST /api/admin/channels/:channelId/permissions` - Grant permission
- `DELETE /api/admin/channels/:channelId/permissions?userId=X` - Revoke permission

**Projects API**

*Citizen/Manager/Admin (Read)*
- `GET /api/projects?status=X&archived=true/false&categoryId=X` - List projects with filters
- `GET /api/projects/:projectId` - Get project details (filters updates by role)

*Admin Only (Write)*
- `POST /api/tickets/:ticketId/project` - Create project from ticket
- `PATCH /api/projects/:projectId` - Update project fields
- `POST /api/projects/:projectId/status` - Change project status
- `POST /api/projects/:projectId/archive` - Archive project
- `DELETE /api/projects/:projectId/archive` - Unarchive project

### Database Schema

**OfficialChannel**
- Municipality-scoped official channels
- Contains: name, title, bio, avatarUrl, isActive

**ChannelPermission**
- Many-to-many mapping of users to channels
- Tracks who granted the permission
- Unique constraint on (channelId, userId)

**ChannelPost**
- Posts published to channels
- Supports attachments (JSON array)
- Soft delete with deletedAt field
- Visibility: PUBLIC or DRAFT

### Audit Logging

All channel operations are logged:
- `CHANNEL_CREATED`, `CHANNEL_UPDATED`, `CHANNEL_DEACTIVATED`
- `CHANNEL_PERMISSION_GRANTED`, `CHANNEL_PERMISSION_REVOKED`
- `CHANNEL_POST_CREATED`, `CHANNEL_POST_UPDATED`, `CHANNEL_POST_DELETED`

### Testing

Run channel tests:
```bash
pnpm test src/__tests__/channels/
```

Tests cover:
- Authorization (canPostToChannel, canManagePost)
- RBAC rules (admin, manager, citizen permissions)
- Cross-municipality isolation
- Audit logging

### Seed Data

The seed script creates 3 sample channels per municipality:
1. Mayor - "Maria Santos"
2. Director of Public Works - "Eng. Paulo Mbele"
3. Public Health Officer - "Dr. Amina Ndlovu"

Each channel has sample posts and permissions are granted to the admin and manager users.

