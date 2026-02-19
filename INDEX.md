# Open Government Platform - Documentation Index

Welcome! This document helps you navigate the comprehensive documentation for the Open Government Platform.

## 🚀 Getting Started

**New to this project?** Start here:

1. **[QUICKSTART.md](./QUICKSTART.md)** ⭐ - Get running in 5 minutes
2. **[README.md](./README.md)** - Project overview and features
3. **[SETUP.md](./SETUP.md)** - Detailed development setup guide

## 📚 Documentation Structure

```
Documentation/
├── README.md                    → Project overview
├── QUICKSTART.md               → 5-minute setup guide ⭐
├── SETUP.md                    → Detailed setup & troubleshooting
├── ARCHITECTURE.md             → System design & technical decisions
├── API.md                      → API endpoint reference
├── IMPLEMENTATION_SUMMARY.md   → What's built, what's not
└── INDEX.md                    → This file
```

## 📖 Documentation by Role

### 🆕 New Developer
Start your journey:
1. Read [QUICKSTART.md](./QUICKSTART.md)
2. Follow the 5-minute setup
3. Sign in and test features
4. Read [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
5. Pick a TODO and start coding!

### 👨‍💻 Contributing Developer
Working on features:
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - Understand the system
2. [API.md](./API.md) - Learn the endpoints
3. [SETUP.md](./SETUP.md) - Development workflows
4. [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Find TODOs

### 🏗️ Architect / Tech Lead
Planning and reviewing:
1. [ARCHITECTURE.md](./ARCHITECTURE.md) - System design
2. [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) - Current state
3. [API.md](./API.md) - API contracts
4. [README.md](./README.md) - Feature roadmap

### 📱 Frontend Developer
UI/UX work:
1. [QUICKSTART.md](./QUICKSTART.md) - Setup
2. `packages/ui/` - Component library
3. `apps/web/src/components/` - Application components
4. `apps/web/src/app/` - Next.js pages

### 🔧 Backend Developer
API and services:
1. [API.md](./API.md) - Endpoint documentation
2. `apps/web/src/app/api/` - API routes
3. `apps/web/src/lib/services/` - Business logic
4. `packages/database/` - Database schema

### 🗄️ Database Engineer
Schema and queries:
1. `packages/database/prisma/schema.prisma` - Full schema
2. [ARCHITECTURE.md](./ARCHITECTURE.md#database-schema) - Entity relationships
3. `packages/database/prisma/seed.ts` - Sample data
4. [SETUP.md](./SETUP.md#database-commands) - DB commands

### 🧪 QA / Tester
Testing the system:
1. [QUICKSTART.md](./QUICKSTART.md#what-to-try) - Test scenarios
2. [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md#what-has-been-built) - Feature status
3. [API.md](./API.md#testing) - API testing guide
4. Test accounts in [QUICKSTART.md](./QUICKSTART.md#test-accounts)

## 🎯 Documentation by Topic

### Authentication & Authorization
- [ARCHITECTURE.md - Security Model](./ARCHITECTURE.md#security-model)
- `apps/web/src/lib/auth/auth-options.ts` - NextAuth config
- `apps/web/src/lib/auth/rbac.ts` - Role-based access control
- [API.md - Authentication](./API.md#authentication)

### Incidents
- [IMPLEMENTATION_SUMMARY.md - Incident Creation](./IMPLEMENTATION_SUMMARY.md#incident-creation)
- `apps/web/src/lib/services/incident-service.ts` - Business logic
- `apps/web/src/app/api/incidents/` - API routes
- [API.md - Incidents](./API.md#incidents)

### Voting System
- [IMPLEMENTATION_SUMMARY.md - Voting System](./IMPLEMENTATION_SUMMARY.md#voting-system)
- `apps/web/src/app/api/incidents/[id]/vote/` - Vote API
- [ARCHITECTURE.md - Importance Scoring](./ARCHITECTURE.md#1-importance-scoring)

### Geospatial Features
- [ARCHITECTURE.md - Neighborhood Detection](./ARCHITECTURE.md#2-neighborhood-detection)
- `apps/web/src/lib/geo/` - Geo utilities
- `packages/database/prisma/schema.prisma` - PostGIS integration

### Tickets (TODO)
- `packages/database/prisma/schema.prisma` - Ticket schema
- `apps/web/src/app/dashboard/tickets/` - Manager UI
- [IMPLEMENTATION_SUMMARY.md - Ticket Management](./IMPLEMENTATION_SUMMARY.md#ticket-management)

## 🔍 Quick Reference

### Test Accounts
```
Admin:    admin@beira.gov.mz      / demo123
Manager:  manager@beira.gov.mz    / demo123
Citizen:  citizen1@example.com / demo123
```

### Key Commands
```bash
pnpm dev              # Start development
pnpm db:studio        # Open database GUI
pnpm db:seed          # Reset sample data
pnpm db:migrate       # Run migrations
./scripts/reset-db.sh # Full database reset
```

### Important Files
```
schema.prisma         - Database schema
auth-options.ts       - Authentication config
rbac.ts              - Authorization logic
incident-service.ts  - Core business logic
importance-scoring.ts - Scoring algorithm
```

## 📊 Project Status Overview

| Component | Status | Documentation |
|-----------|--------|---------------|
| Database Schema | ✅ Complete | schema.prisma |
| Authentication | ✅ Complete | auth-options.ts, ARCHITECTURE.md |
| Authorization | ✅ Complete | rbac.ts, ARCHITECTURE.md |
| Incident Creation | ✅ Complete | IMPLEMENTATION_SUMMARY.md |
| Incident Listing | ✅ Complete | IMPLEMENTATION_SUMMARY.md |
| Voting System | ✅ Complete | IMPLEMENTATION_SUMMARY.md |
| Importance Scoring | ✅ Complete | importance-scoring.ts |
| Geo Services | ✅ Complete | lib/geo/ |
| Manager Dashboard | 🚧 Scaffolded | apps/web/src/app/dashboard/ |
| Ticket Management | 🚧 Scaffolded | apps/web/src/app/dashboard/tickets/ |
| Map Visualization | ❌ TODO | IncidentMap.tsx |
| Media Uploads | ❌ TODO | - |
| Admin UI | ❌ TODO | - |

## 🛠️ Common Workflows

### Adding a New Feature
1. Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for status
2. Read [ARCHITECTURE.md](./ARCHITECTURE.md) for design patterns
3. Update database schema if needed (`schema.prisma`)
4. Add service layer (`lib/services/`)
5. Add API routes (`app/api/`)
6. Add UI components (`components/`)
7. Update [API.md](./API.md) with new endpoints

### Fixing a Bug
1. Reproduce in development
2. Check [SETUP.md](./SETUP.md#troubleshooting) for known issues
3. Add console logs or debugger
4. Fix and test
5. Consider adding a test

### Database Changes
1. Edit `packages/database/prisma/schema.prisma`
2. Run `pnpm db:migrate` (creates migration)
3. Update seed data if needed
4. Test with `./scripts/reset-db.sh`
5. Update documentation

### API Changes
1. Update route handler
2. Update Zod schema for validation
3. Update types in `packages/types/`
4. Update [API.md](./API.md)
5. Test with curl or Postman

## 🎓 Learning Resources

### Technologies Used
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [NextAuth.js Documentation](https://next-auth.js.org/)
- [PostGIS Documentation](https://postgis.net/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Query Documentation](https://tanstack.com/query/latest)

### Internal Code Examples
- Incident creation: `apps/web/src/components/incidents/CreateIncidentModal.tsx`
- Voting: `apps/web/src/components/incidents/VoteButtons.tsx`
- API route: `apps/web/src/app/api/incidents/route.ts`
- Service: `apps/web/src/lib/services/incident-service.ts`
- RBAC: `apps/web/src/lib/auth/rbac.ts`

## 💡 Tips for Success

### Before You Start
- [ ] Read [QUICKSTART.md](./QUICKSTART.md) completely
- [ ] Get the app running locally
- [ ] Test all working features as each role
- [ ] Read [ARCHITECTURE.md](./ARCHITECTURE.md) overview

### While Developing
- [ ] Follow existing code patterns
- [ ] Use TypeScript strictly (no `any`)
- [ ] Add error handling
- [ ] Test with all three roles
- [ ] Update documentation for changes

### Code Style
- Use `pnpm format` to format code
- Use `pnpm lint` to check for errors
- Follow existing naming conventions
- Add JSDoc comments for complex functions
- Keep components small and focused

## 🆘 Getting Help

### Documentation Not Clear?
1. Check [SETUP.md](./SETUP.md#troubleshooting)
2. Search for TODO comments in code
3. Check Git history for context
4. Ask maintainers

### Feature Not Working?
1. Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) status
2. Look for TODO markers in code
3. Check browser console for errors
4. Check terminal logs
5. Check [SETUP.md](./SETUP.md#troubleshooting)

### Not Sure Where to Start?
1. Read [QUICKSTART.md](./QUICKSTART.md)
2. Browse [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
3. Pick a TODO item marked 🚧
4. Start with UI before API
5. Ask for guidance

## 📝 Contributing

When contributing:
1. ✅ Follow existing patterns
2. ✅ Write type-safe code
3. ✅ Update documentation
4. ✅ Test thoroughly
5. ✅ Add meaningful commit messages

## 🏆 Next Steps

Based on your role:

**New Developer**:
→ [QUICKSTART.md](./QUICKSTART.md)

**Need Detailed Setup**:
→ [SETUP.md](./SETUP.md)

**Understand Architecture**:
→ [ARCHITECTURE.md](./ARCHITECTURE.md)

**Work on Features**:
→ [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)

**API Integration**:
→ [API.md](./API.md)

---

**Questions?** All documentation is in this directory. Start with [QUICKSTART.md](./QUICKSTART.md)!

**Ready to code?** Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for TODOs!

