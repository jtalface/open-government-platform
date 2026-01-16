#!/bin/bash

# Development setup script for Open Government Platform

set -e

echo "🚀 Setting up Open Government Platform for development..."

# Check prerequisites
echo "📋 Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js >= 20.0.0"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Installing pnpm..."
    npm install -g pnpm
fi

if ! command -v psql &> /dev/null; then
    echo "⚠️  PostgreSQL client not found. Please ensure PostgreSQL is installed."
fi

echo "✅ Prerequisites check complete"

# Install dependencies
echo "📦 Installing dependencies..."
pnpm install

# Setup environment files
echo "⚙️  Setting up environment files..."

if [ ! -f "apps/web/.env.local" ]; then
    cp apps/web/.env.example apps/web/.env.local
    echo "✅ Created apps/web/.env.local - Please update with your credentials"
else
    echo "⚠️  apps/web/.env.local already exists"
fi

if [ ! -f "packages/database/.env" ]; then
    cp packages/database/.env.example packages/database/.env
    echo "✅ Created packages/database/.env - Please update with your credentials"
else
    echo "⚠️  packages/database/.env already exists"
fi

# Setup database
echo "🗄️  Setting up database..."
echo "Please ensure PostgreSQL is running and the database 'ogp_dev' exists."
read -p "Continue with database setup? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    # Enable PostGIS extension
    echo "Enabling PostGIS extension..."
    psql -d ogp_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;" || echo "⚠️  Could not enable PostGIS. Please do it manually."
    
    # Generate Prisma client
    echo "Generating Prisma client..."
    pnpm db:generate
    
    # Run migrations
    echo "Running migrations..."
    pnpm db:migrate
    
    # Seed database
    echo "Seeding database..."
    pnpm db:seed
    
    echo "✅ Database setup complete"
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Update apps/web/.env.local with your Mapbox token"
echo "2. Ensure your database credentials are correct"
echo "3. Run 'pnpm dev' to start the development server"
echo "4. Visit http://localhost:3000"
echo ""
echo "🔐 Test accounts:"
echo "   Admin:   admin@lisboa.pt / demo123"
echo "   Manager: manager@lisboa.pt / demo123"
echo "   Citizen: citizen1@example.com / demo123"
echo ""

