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
| **Admin** | admin@beira.gov.mz | demo123 | Full access |
| **Manager** | manager@beira.gov.mz | demo123 | Dashboard + tickets |
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

## Citizen Polls

The Citizen Polls feature allows managers and admins to create binary-choice polls that are displayed prominently to citizens on the incidents and map pages.

### Overview

Polls provide a simple way for municipalities to gauge citizen opinion on municipal priorities and decisions. When a poll is active, it appears as a banner at the top of citizen-facing pages, making it impossible to miss.

### Key Features

- **Binary Choice Polls**: Simple yes/no or A/B questions for easy decision-making
- **Prominent Placement**: Active polls appear at the top of incidents list and map pages
- **One Vote Per Citizen**: Each citizen can vote once per poll (enforced by database constraint)
- **Single Active Poll**: Only one poll can be active at a time per municipality
- **Private Results**: Poll results are visible only to the poll creator and admins
- **Poll Management**: Full lifecycle management (Draft → Active → Closed → Archived)
- **Real-time Updates**: Poll results update in real-time as citizens vote
- **Scheduled Polls**: Optional start and end dates for time-bound polls

### Access Control (RBAC)

- **Citizens**: Can view active polls and vote once per poll (authentication required)
- **Managers**: Can create polls, activate/close their own polls, view results for their polls
- **Admins**: Can create polls, activate/close any poll, view all poll results in municipality

### Poll Lifecycle

1. **DRAFT**: Poll is created but not visible to citizens
2. **ACTIVE**: Poll is visible and citizens can vote (only one active poll allowed)
3. **CLOSED**: Poll is closed and no longer accepting votes
4. **ARCHIVED**: Poll is archived and hidden from management views

### Data Model

**Poll**
- `id` - UUID
- `municipalityId` - Municipality scope
- `createdByUserId` - Poll creator (manager/admin)
- `title` - Poll question (min 10 characters)
- `optionA` - First choice label
- `optionB` - Second choice label
- `status` - DRAFT | ACTIVE | CLOSED | ARCHIVED
- `startsAt` - Optional start timestamp
- `endsAt` - Optional end timestamp
- `closedAt` - Timestamp when closed
- `closedByUserId` - Who closed the poll

**PollVote**
- `id` - UUID
- `pollId` - Reference to poll
- `userId` - Voter
- `choice` - A or B
- `createdAt` - Vote timestamp
- **Unique constraint**: `(pollId, userId)` ensures one vote per poll per user

### UI Features

**Citizen Experience**
- **Poll Banner**: Appears at top of incidents and map pages when poll is active
- **Voting Interface**: Two prominent buttons for binary choice (Option A vs Option B)
- **Vote Confirmation**: "Thanks for voting" message with chosen option displayed
- **Sign-in Prompt**: Anonymous users are prompted to sign in before voting

**Manager/Admin Experience**
- **Polls Dashboard**: View all polls with status filters (All, Active, Draft, Closed)
- **Create Poll**: Modal form with question, options, status, and optional scheduling
- **Poll Results**: Detailed view with vote counts, percentages, and visual bar charts
- **Quick Actions**: Activate draft polls, close active polls, view results
- **Status Indicators**: Color-coded badges for poll status

### API Endpoints

**Citizen (Public Read)**
- `GET /api/municipalities/:municipalityId/polls/active` - Get currently active poll
- `POST /api/polls/:pollId/votes` - Cast a vote (choice: A or B)

**Manager/Admin (Write)**
- `POST /api/municipalities/:municipalityId/polls` - Create poll
- `GET /api/municipalities/:municipalityId/polls` - List polls with filters
- `GET /api/polls/:pollId` - Get poll details
- `PATCH /api/polls/:pollId` - Update poll (DRAFT only or admin override)
- `POST /api/polls/:pollId/activate` - Activate poll (auto-closes previous active poll)
- `POST /api/polls/:pollId/close` - Close poll
- `POST /api/polls/:pollId/archive` - Archive poll

**Results (Private)**
- `GET /api/polls/:pollId/results` - Get poll results (creator or admin only)

Returns:
```json
{
  "pollId": "...",
  "title": "Should we prioritize pothole repairs?",
  "optionA": { "label": "Yes", "count": 150, "percent": 75 },
  "optionB": { "label": "No", "count": 50, "percent": 25 },
  "totalVotes": 200
}
```

### Business Rules

1. **Single Active Poll**: Creating or activating a new poll automatically closes any existing active poll
2. **One Vote Per User**: Database unique constraint prevents duplicate votes
3. **Authentication Required**: Votes must be authenticated (no anonymous voting)
4. **Municipality Scoping**: All queries and mutations scoped to user's municipality
5. **Creator Permissions**: Managers can only manage polls they created
6. **Admin Override**: Admins can manage any poll in their municipality
7. **Results Privacy**: Results visible only to creator and admins (citizens see only their vote)
8. **Edit Restrictions**: Polls can only be edited in DRAFT status (or by admin)

### Audit Logging

All poll operations are logged to the audit trail:
- `POLL_CREATED` - Poll created with title and status
- `POLL_ACTIVATED` - Poll activated (previous active poll auto-closed)
- `POLL_CLOSED` - Poll closed by user
- `POLL_ARCHIVED` - Poll archived
- `POLL_VOTED` - Citizen voted (vote choice not logged for privacy)

### Seed Data

The seed script creates 1 active poll for development:
- **Question**: "Should the municipality prioritize pothole repairs this month?"
- **Options**: "Yes, absolutely" vs "No, focus on other issues"
- **Sample Votes**: 3 votes (2 for A, 1 for B)

### Testing

Backend tests verify:
- ✅ Citizens can view and vote on active polls
- ✅ One vote per user per poll enforced
- ✅ Only one active poll allowed per municipality
- ✅ Managers can create and manage their own polls
- ✅ Admins can view all results and manage all polls
- ✅ Poll creator authorization (managers can't view other managers' results)
- ✅ Authentication required for voting

