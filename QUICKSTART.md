# Quick Start Guide

Get the Open Government Platform running locally in about 5 minutes.

## Prerequisites

- **Node.js** >= 20 ([nodejs.org](https://nodejs.org/))
- **pnpm** >= 8 (`npm install -g pnpm`)
- **PostgreSQL** 15+ with PostGIS
- **Docker** (optional, for database only)

---

## Step 1: Clone and Install

```bash
git clone https://github.com/jtalface/open-government-platform.git
cd open-government-platform
pnpm install
```

---

## Step 2: Database Setup

### Option A: Local PostgreSQL

```bash
# Create database
createdb ogp_dev

# Enable PostGIS
psql ogp_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Verify
psql ogp_dev -c "SELECT PostGIS_version();"
```

### Option B: Docker

```bash
# Start PostgreSQL with PostGIS
docker run -d \
  --name ogp-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=ogp_dev \
  -p 5432:5432 \
  postgis/postgis:15-3.4

# Enable PostGIS (usually included in postgis image)
psql -h localhost -U postgres -d ogp_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

---

## Step 3: Environment Configuration

Create the environment files.

### `apps/web/.env.local`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ogp_dev?schema=public"
NEXTAUTH_URL="http://localhost:4000"
NEXTAUTH_SECRET="your-secret-here-change-me"
NEXT_PUBLIC_MAPBOX_TOKEN=""
```

### `packages/database/.env`

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ogp_dev?schema=public"
```

**Notes:**
- Adjust `postgres:postgres` if your PostgreSQL user/password differ
- Generate `NEXTAUTH_SECRET`: `openssl rand -base64 32`
- Mapbox token is optional (map works without it using OpenStreetMap)

---

## Step 4: Initialize Database

```bash
# Generate Prisma client
pnpm db:generate

# Apply schema (use db:push if migrations fail in dev)
pnpm db:push

# Seed sample data
pnpm db:seed
```

Expected output:
```
✓ Created municipality: Beira
✓ Created 3 neighborhoods
✓ Created 4 categories
✓ Created 5 test users
✓ Created 3 sample incidents
✓ Created sample ticket with update
✅ Database seeded successfully!
```

---

## Step 5: Start Development Server

```bash
pnpm dev
```

The app runs at **http://localhost:4000**.

---

## Step 6: Sign In and Explore

### Test Accounts

| Role     | Email / Phone          | Password |
|----------|------------------------|----------|
| Admin    | admin@beira.gov.mz     | demo123  |
| Manager  | manager@beira.gov.mz   | demo123  |
| Citizen  | citizen1@example.com   | demo123  |
| Citizen  | citizen2@example.com   | demo123  |
| Citizen  | citizen3@example.com   | demo123  |

You can also sign in with phone numbers (e.g. `841234567`) for seeded citizens.

### What to Try

**As Citizen:**
1. Sign in → View incidents
2. Create incident (allow location)
3. Upload a photo
4. Vote on incidents
5. View map

**As Manager:**
1. Sign in → Dashboard
2. Manage tickets
3. View incidents

**As Admin:**
1. Sign in → Admin panel
2. Manage categories
3. Manage channels
4. Create posts

---

## Troubleshooting

### "Cannot connect to database"

```bash
# Check PostgreSQL
pg_ctl status   # or: sudo systemctl status postgresql

# Start PostgreSQL
# macOS (Homebrew):
brew services start postgresql@15

# Ubuntu/Debian:
sudo service postgresql start

# Amazon Linux:
sudo systemctl start postgresql
```

### "PostGIS not found"

```bash
# macOS
brew install postgis

# Ubuntu
sudo apt-get install postgresql-15-postgis-3

# Amazon Linux
sudo dnf install postgis

# Then in database:
psql ogp_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

### "Port 4000 already in use"

```bash
# Find and kill process
lsof -ti:4000 | xargs kill -9

# Or use different port
PORT=4001 pnpm dev
```

### "Prisma Client not generated"

```bash
rm -rf node_modules/.prisma
pnpm db:generate
```

### "Module not found"

```bash
rm -rf node_modules apps/*/node_modules packages/*/node_modules
pnpm install
```

---

## Useful Commands

| Command           | Description              |
|-------------------|--------------------------|
| `pnpm dev`        | Start dev server         |
| `pnpm build`       | Build for production     |
| `pnpm db:studio`   | Open Prisma Studio       |
| `pnpm db:seed`     | Re-seed database         |
| `./scripts/reset-db.sh` | Reset database (deletes all data) |
| `pnpm format`      | Format code              |
| `pnpm lint`        | Run linter               |

---

## Next Steps

- [SETUP.md](./SETUP.md) – Detailed setup and troubleshooting
- [DEPLOYMENT.md](./DEPLOYMENT.md) – Deploy to AWS EC2
- [API.md](./API.md) – API reference
- [ARCHITECTURE.md](./ARCHITECTURE.md) – System design

---

**Happy coding**
