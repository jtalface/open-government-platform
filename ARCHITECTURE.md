# Architecture Documentation

## System Overview

The Open Government Platform (OGP) is a multi-tenant municipal incident reporting and transparency platform built with a modern, mobile-first architecture.

## Architectural Principles

1. **Mobile-First**: Responsive design optimized for mobile devices
2. **Multi-Tenancy**: Municipality-scoped data and configuration
3. **Role-Based Access**: Three-tier access (Citizen, Manager, Admin)
4. **Geo-Aware**: PostGIS-powered location services
5. **Extensible**: Plugin-ready for categories, neighborhoods, and workflows
6. **PWA-Ready**: Progressive Web App capabilities for offline support

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Citizen   │  │   Manager   │  │    Admin    │     │
│  │     UI      │  │ Dashboard   │  │   Console   │     │
│  └─────────────┘  └─────────────┘  └─────────────┘     │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│               Next.js App Router (SSR/CSR)               │
│  ┌──────────────────────────────────────────────────┐   │
│  │  Pages & Components (React + TypeScript)        │   │
│  └──────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────┐   │
│  │  State Management (React Query + Zustand)       │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                  API Layer (Next.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐             │
│  │ Incidents│  │ Tickets  │  │  Admin   │             │
│  │   API    │  │   API    │  │   API    │             │
│  └──────────┘  └──────────┘  └──────────┘             │
│  ┌─────────────────────────────────────────────┐       │
│  │     Middleware (Auth + RBAC)               │       │
│  └─────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                 Business Logic Layer                     │
│  ┌──────────────────┐  ┌─────────────────────┐         │
│  │ Incident Service │  │ Scoring Algorithm   │         │
│  └──────────────────┘  └─────────────────────┘         │
│  ┌──────────────────┐  ┌─────────────────────┐         │
│  │   Geo Service    │  │  Notification Svc   │         │
│  └──────────────────┘  └─────────────────────┘         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│              Infrastructure Layer                        │
│  ┌──────────────────┐  ┌─────────────────────┐         │
│  │  Prisma ORM     │  │   NextAuth.js       │         │
│  └──────────────────┘  └─────────────────────┘         │
└─────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────┐
│                   Data Layer                             │
│  ┌──────────────────────────────────────────────────┐   │
│  │      PostgreSQL + PostGIS                       │   │
│  │  ┌────────┐ ┌─────────┐ ┌────────┐ ┌────────┐  │   │
│  │  │ Users  │ │Incidents│ │Tickets │ │ Votes  │  │   │
│  │  └────────┘ └─────────┘ └────────┘ └────────┘  │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

## Domain Model

### Core Entities

```typescript
Municipality (Tenant)
├── settings (map, voting, scoring)
├── Categories (extensible)
├── Neighborhoods (PostGIS polygons)
└── Users (role-based)

IncidentEvent
├── location (PostGIS Point)
├── geohash (for clustering)
├── neighborhoodId (derived)
├── voteStats (aggregated)
├── importanceScore (calculated)
└── ticket (optional link)

Vote
├── incidentId
├── userId
├── neighborhoodId (scoped)
└── value (+1/-1)

Ticket
├── incidentId (optional)
├── status (workflow)
├── priority
├── assignedTo (manager)
├── publicVisibility
└── updates (timeline)
```

### Entity Relationships

```
Municipality 1───* User
Municipality 1───* Category
Municipality 1───* Neighborhood
Municipality 1───* IncidentEvent

User 1───* IncidentEvent (created)
User 1───* Vote
User 1───* Ticket (created/assigned)

IncidentEvent 1───* Vote
IncidentEvent 1───1 Ticket (optional)

Ticket 1───* TicketUpdate

Neighborhood 1───* User (optional)
Neighborhood 1───* IncidentEvent
Neighborhood 1───* Vote
```

## Key Algorithms

### 1. Importance Scoring

**Purpose**: Rank incidents by neighborhood relevance + recency

**Formula**:
```
score = (neighborhoodScore × Wn + globalScore × Wg) × decayFactor

where:
  neighborhoodScore = upvotes - downvotes (same neighborhood)
  globalScore = upvotes - downvotes (all)
  Wn = neighborhood weight (default: 2.0)
  Wg = global weight (default: 1.0)
  decayFactor = e^(-age_days / decay_period)
  decay_period = 30 days (configurable)
```

**Implementation**: `apps/web/src/lib/services/importance-scoring.ts`

### 2. Neighborhood Detection

**Purpose**: Map GPS coordinates to neighborhood polygon

**Process**:
1. Use PostGIS `ST_Contains(polygon, point)` for exact containment
2. Fallback to `ST_Distance` for nearest neighborhood
3. Cache result in incident record

**Implementation**: `apps/web/src/lib/geo/neighborhood.ts`

### 3. Nearby Incidents Query

**Purpose**: Find incidents within radius

**Query**:
```sql
SELECT *
FROM incident_events
WHERE ST_DWithin(
  location::geography,
  ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography,
  radius_meters
)
ORDER BY importance_score DESC
```

**Implementation**: `apps/web/src/lib/services/incident-service.ts`

## Security Model

### Authentication

- **Provider**: NextAuth.js with credentials
- **Strategy**: JWT tokens (stateless)
- **Session**: HTTP-only cookies
- **Password**: bcrypt hashing (10 rounds)

### Authorization (RBAC)

```
Role Hierarchy:
  ADMIN > MANAGER > CITIZEN

Permissions:
  CITIZEN:
    - Create incidents
    - Vote on incidents (neighborhood-scoped)
    - View public tickets
  
  MANAGER (includes CITIZEN):
    - View all incidents in municipality
    - Create/update tickets
    - Assign tickets
    - Post updates (public/internal)
  
  ADMIN (includes MANAGER):
    - Manage users/roles
    - Configure categories
    - Manage neighborhoods
    - Municipality settings
```

**Implementation**: `apps/web/src/lib/auth/rbac.ts`

### Data Isolation

- **Municipality Scoping**: All queries filtered by `municipalityId`
- **Neighborhood Scoping**: Votes weighted by `neighborhoodId`
- **Audit Logging**: All sensitive actions logged

## Performance Considerations

### Database Indexes

```sql
-- Geospatial indexes
CREATE INDEX idx_incident_location ON incident_events USING GIST (location);
CREATE INDEX idx_neighborhood_geometry ON neighborhoods USING GIST (geometry);

-- Query optimization
CREATE INDEX idx_incident_score ON incident_events (importance_score DESC);
CREATE INDEX idx_incident_created ON incident_events (created_at DESC);
CREATE INDEX idx_incident_geohash ON incident_events (geohash);

-- Foreign keys
CREATE INDEX idx_incident_municipality ON incident_events (municipality_id);
CREATE INDEX idx_incident_neighborhood ON incident_events (neighborhood_id);
```

### Caching Strategy

1. **React Query**: Client-side caching (1 minute stale time)
2. **Materialized Views**: Consider for heavy aggregations
3. **Redis** (future): Session storage, rate limiting

### Query Optimization

- Use bounding box queries before distance calculations
- Limit results with pagination
- Denormalize lat/lng for faster queries
- Pre-calculate importance scores on vote changes

## Scalability

### Horizontal Scaling

- **Stateless API**: Scale Next.js instances behind load balancer
- **Database**: Read replicas for GET requests
- **Media Storage**: S3/CDN for uploads

### Multi-Tenancy

- Partition strategy: Shared database, tenant-filtered queries
- Future: Tenant-specific databases for large municipalities

### Monitoring

- Request IDs for tracing
- Structured logging (JSON)
- Error tracking (Sentry-ready)
- Performance metrics (future: OpenTelemetry)

## Future Architecture

### Phase 3-5 Enhancements

1. **Event Sourcing**: Audit log as event stream
2. **Real-Time**: WebSocket for live updates
3. **Notifications**: Push notifications via PWA
4. **Background Jobs**: Bull queue for async tasks
5. **Search**: Elasticsearch for full-text search
6. **Analytics**: Data warehouse for reporting

### Native App Strategy

Current architecture supports React Native/Capacitor:

- Shared types package
- REST API (not GraphQL for simplicity)
- JWT auth (portable)
- Offline-first considerations

### Microservices Migration Path

If needed:

```
API Gateway (Next.js)
├── Incident Service (Node.js)
├── Ticket Service (Node.js)
├── Notification Service (Node.js)
└── Auth Service (Next.js)
```

## Testing Strategy

### Unit Tests

- Services: `incident-service.test.ts`
- Utilities: `geohash.test.ts`, `scoring.test.ts`
- Components: `IncidentList.test.tsx`

### Integration Tests

- API routes: `POST /api/incidents`
- Auth flow: `signin -> create incident`
- RBAC: Manager access control

### E2E Tests

- Citizen workflow: Report → Vote
- Manager workflow: Triage → Ticket
- Admin workflow: User → Role change

**Recommended Tools**: Vitest, Playwright

## Deployment

### Production Checklist

- [ ] Environment variables secured
- [ ] Database connection pooling (PgBouncer)
- [ ] HTTPS enabled
- [ ] CORS configured
- [ ] Rate limiting (nginx/Cloudflare)
- [ ] Monitoring (Sentry, DataDog)
- [ ] Backups automated
- [ ] CDN for static assets
- [ ] PWA assets generated

### Recommended Stack

- **Hosting**: Vercel (Next.js), Railway (Database), AWS (Full)
- **Database**: AWS RDS PostgreSQL + PostGIS
- **Storage**: AWS S3 + CloudFront
- **Monitoring**: Sentry + Vercel Analytics

## References

- [Next.js App Router](https://nextjs.org/docs/app)
- [Prisma with PostGIS](https://www.prisma.io/docs/concepts/components/prisma-schema/postgresql-extensions)
- [NextAuth.js](https://next-auth.js.org/)
- [PostGIS Functions](https://postgis.net/docs/reference.html)

