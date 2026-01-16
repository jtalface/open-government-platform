#!/bin/bash

# Reset database script - WARNING: This will delete all data!

set -e

echo "⚠️  WARNING: This will delete all data in the database!"
read -p "Are you sure you want to continue? (yes/no) " -n 3 -r
echo

if [[ ! $REPLY =~ ^yes$ ]]; then
    echo "Aborted."
    exit 1
fi

echo "🗑️  Resetting database..."

# Drop and recreate database
psql postgres -c "DROP DATABASE IF EXISTS ogp_dev;"
psql postgres -c "CREATE DATABASE ogp_dev;"

# Enable PostGIS
psql ogp_dev -c "CREATE EXTENSION IF NOT EXISTS postgis;"

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

echo "✅ Database reset complete!"

