# Quick Start Guide

Get up and running with the Open Government Platform in 5 minutes!

## Prerequisites Check

```bash
# Check Node.js version (should be >= 20)
node --version

# Check if pnpm is installed
pnpm --version

# Check if PostgreSQL is installed
psql --version

# If pnpm is not installed:
npm install -g pnpm
```

## Step 1: Clone and Install (1 minute)

```bash
cd /path/to/open-government-platform
pnpm install
```

## Step 2: Database Setup (2 minutes)

```bash
# Create database
createdb ogp_dev

# Enable PostGIS extension
psql ogp_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Verify PostGIS is enabled
psql ogp_dev -c "SELECT PostGIS_version();"
```

## Step 3: Environment Configuration (1 minute)

```bash
# Copy environment files
cp apps/web/.env.example apps/web/.env.local
cp packages/database/.env.example packages/database/.env
```

Edit `apps/web/.env.local`:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ogp_dev?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="supersecretkey123456789"  # Change this!
NEXT_PUBLIC_MAPBOX_TOKEN=""  # Optional for now
```

**Important**: Replace `postgres:postgres` with your PostgreSQL username and password if different.

## Step 4: Initialize Database (1 minute)

```bash
# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed with sample data
pnpm db:seed
```

You should see:
```
✓ Created municipality: Lisboa
✓ Created 3 neighborhoods
✓ Created 4 categories
✓ Created 5 test users
✓ Created 3 sample incidents
✓ Created sample ticket with update
✅ Database seeded successfully!
```

## Step 5: Start Development Server (30 seconds)

```bash
pnpm dev
```

Wait for:
```
▲ Next.js 14.1.0
- Local:        http://localhost:3000
✓ Ready in 2.5s
```

## Step 6: Test the Application

### Open your browser to: [http://localhost:3000](http://localhost:3000)

You'll be redirected to the sign-in page.

### Test Accounts:

| Role | Email | Password | What to Test |
|------|-------|----------|--------------|
| **Citizen** | citizen1@example.com | demo123 | Report incidents, vote |
| **Manager** | manager@lisboa.pt | demo123 | View dashboard, manage tickets |
| **Admin** | admin@lisboa.pt | demo123 | Full access |

## What to Try

### As a Citizen:
1. ✅ **Sign in** with `citizen1@example.com` / `demo123`
2. ✅ **View incidents** - See 3 seeded incidents
3. ✅ **Create incident** - Click "Reportar" (allow location access)
4. ✅ **Vote** - Open an incident and click up/down buttons
5. ✅ **Filter** - Click category pills at the top

### As a Manager:
1. ✅ **Sign in** with `manager@lisboa.pt` / `demo123`
2. ✅ **View dashboard** - See stats and map placeholder
3. 🚧 **Tickets** - Structure is there, API pending

### As an Admin:
1. ✅ **Sign in** with `admin@lisboa.pt` / `demo123`
2. ✅ **All manager features**
3. 🚧 **Admin panel** - Route protected, UI pending

## Troubleshooting

### "Cannot connect to database"

```bash
# Check if PostgreSQL is running
pg_ctl status

# Start PostgreSQL (macOS with Homebrew)
brew services start postgresql@15

# Start PostgreSQL (Ubuntu)
sudo service postgresql start

# Test connection
psql -d ogp_dev -c "SELECT 1;"
```

### "PostGIS not found"

```bash
# Install PostGIS
# macOS
brew install postgis

# Ubuntu
sudo apt-get install postgresql-15-postgis-3

# Enable in database
psql ogp_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### "Port 3000 already in use"

```bash
# Find and kill the process
lsof -ti:3000 | xargs kill -9

# Or run on different port
PORT=3001 pnpm dev
```

### "Prisma Client not generated"

```bash
# Clean and regenerate
rm -rf node_modules/.prisma
pnpm db:generate
```

### "Module not found" errors

```bash
# Clean install
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install
```

## Verify Everything Works

### Test the API directly:

```bash
# List incidents (requires authentication, will redirect)
curl http://localhost:3000/api/incidents

# Health check (if we add one)
curl http://localhost:3000/api/health
```

### Check the database:

```bash
# Connect to database
psql ogp_dev

# Count incidents
SELECT COUNT(*) FROM incident_events;
# Should show: 3

# List users
SELECT email, role FROM users;
# Should show: 5 users

# Exit psql
\q
```

## Next Steps

Now that everything is running:

1. 📖 **Read ARCHITECTURE.md** - Understand the system design
2. 📖 **Read API.md** - Learn the API endpoints
3. 📖 **Read SETUP.md** - Detailed development guide
4. 🔨 **Pick a TODO** - Check IMPLEMENTATION_SUMMARY.md for tasks

## Common Development Tasks

### Reset database to clean state:

```bash
./scripts/reset-db.sh
```

### Open Prisma Studio (database GUI):

```bash
pnpm db:studio
```

### View logs:

```bash
# Terminal with pnpm dev shows logs
# Look for errors in the console
```

### Format code:

```bash
pnpm format
```

### Run linter:

```bash
pnpm lint
```

## Getting Help

1. Check [SETUP.md](./SETUP.md) for detailed troubleshooting
2. Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for what's implemented
3. Look for TODO comments in the code
4. Check Prisma documentation: https://www.prisma.io/docs
5. Check Next.js documentation: https://nextjs.org/docs

## What's Working vs. Not Working

### ✅ Fully Working:
- Authentication (sign in/out)
- Incident creation with GPS
- Incident listing with filters
- Incident detail view
- Voting system
- Importance scoring
- Neighborhood detection
- Role-based access control

### 🚧 Partially Working:
- Manager dashboard (UI only, no real data)
- Ticket management (structure only)

### ❌ Not Implemented:
- Map visualization (placeholder only)
- Media uploads
- Ticket APIs
- Admin configuration UI
- Email notifications
- Real-time updates

## Success Criteria

You've successfully set up the platform if:
- ✅ You can sign in with test accounts
- ✅ You can see the list of 3 seeded incidents
- ✅ You can create a new incident (with GPS location)
- ✅ You can vote on incidents
- ✅ You can switch between citizen and manager views

## Ready to Contribute?

Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md) for:
- What's complete ✅
- What's scaffolded 🚧
- What needs implementation ❌

Pick a TODO and start coding!

---

**Happy Coding! 🚀**

