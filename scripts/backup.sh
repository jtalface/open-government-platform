#!/bin/bash

# Open Government Platform - Backup Script
# Backs up uploads directory to S3

set -e

# Configuration
# Works on Amazon Linux (ec2-user) and Ubuntu (ubuntu)
DATE=$(date +%Y%m%d)
BACKUP_DIR="${HOME}/backups"
UPLOADS_DIR="${HOME}/open-government-platform/apps/web/public/uploads"
S3_BUCKET="your-backup-bucket-name"  # Update this!
RETENTION_DAYS=7

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${YELLOW}📦 Starting backup...${NC}"

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Check if uploads directory exists
if [ ! -d "$UPLOADS_DIR" ]; then
    echo -e "${RED}❌ Uploads directory not found: $UPLOADS_DIR${NC}"
    exit 1
fi

# Create backup archive
BACKUP_FILE="$BACKUP_DIR/uploads-$DATE.tar.gz"
echo -e "${YELLOW}📦 Creating archive...${NC}"
tar -czf "$BACKUP_FILE" -C "$(dirname $UPLOADS_DIR)" "$(basename $UPLOADS_DIR)" 2>/dev/null || {
    echo -e "${RED}❌ Failed to create backup archive${NC}"
    exit 1
}

# Upload to S3
if command -v aws &> /dev/null; then
    echo -e "${YELLOW}☁️  Uploading to S3...${NC}"
    aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/" || {
        echo -e "${RED}❌ Failed to upload to S3${NC}"
        exit 1
    }
    echo -e "${GREEN}✅ Backup uploaded to S3${NC}"
else
    echo -e "${YELLOW}⚠️  AWS CLI not found. Skipping S3 upload.${NC}"
fi

# Cleanup old backups
echo -e "${YELLOW}🧹 Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
find "$BACKUP_DIR" -name "uploads-*.tar.gz" -mtime +$RETENTION_DAYS -delete

# Get backup size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "${GREEN}✅ Backup complete: $BACKUP_FILE ($BACKUP_SIZE)${NC}"
