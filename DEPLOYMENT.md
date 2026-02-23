# AWS EC2 Deployment Guide

Complete step-by-step guide to deploy the Open Government Platform on AWS EC2.

## Supported Operating Systems

| OS | Package Manager | Default User | Recommended |
|----|-----------------|--------------|-------------|
| **Amazon Linux 2023** | `dnf` | `ec2-user` | ✅ Yes |
| Amazon Linux 2 | `dnf` | `ec2-user` | ✅ Yes |
| Ubuntu 22.04 | `apt` | `ubuntu` | ✅ Yes |

**Amazon Linux 2023** is the default AWS AMI, optimized for EC2, and is the recommended choice. The `deploy-setup.sh` script auto-detects your OS and runs the appropriate commands.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [AWS Infrastructure Setup](#aws-infrastructure-setup)
3. [EC2 Instance Setup](#ec2-instance-setup)
4. [Database Setup (RDS PostgreSQL)](#database-setup-rds-postgresql)
5. [S3 Bucket for File Storage](#s3-bucket-for-file-storage)
6. [Application Deployment](#application-deployment)
7. [Nginx Reverse Proxy](#nginx-reverse-proxy)
8. [SSL/HTTPS Setup](#sslhttps-setup)
9. [Process Management](#process-management)
10. [Monitoring & Logging](#monitoring--logging)
11. [Backup Strategy](#backup-strategy)
12. [Security Checklist](#security-checklist)

---

## Prerequisites

- AWS Account with appropriate permissions
- Domain name (optional but recommended)
- SSH key pair for EC2 access
- Basic knowledge of Linux, Node.js, and PostgreSQL

---

## AWS Infrastructure Setup

### Step 1: Create Security Groups

#### Security Group for EC2 Instance
- **Name**: `ogp-ec2-sg`
- **Inbound Rules**:
  - SSH (22) - Your IP only
  - HTTP (80) - 0.0.0.0/0
  - HTTPS (443) - 0.0.0.0/0
- **Outbound Rules**: All traffic

#### Security Group for RDS
- **Name**: `ogp-rds-sg`
- **Inbound Rules**:
  - PostgreSQL (5432) - From `ogp-ec2-sg` only
- **Outbound Rules**: All traffic

### Step 2: Launch EC2 Instance

1. **Instance Type**: `t3.medium` or `t3.large` (minimum 2 vCPU, 4GB RAM)
2. **AMI**: **Amazon Linux 2023** (recommended) or Ubuntu 22.04 LTS
   - **Amazon Linux 2023** is the default AWS option, optimized for EC2, and uses `dnf` package manager
   - Ubuntu 22.04 is also supported; the setup script auto-detects the OS
3. **Storage**: 20GB+ GP3 SSD
4. **Security Group**: `ogp-ec2-sg`
5. **Key Pair**: Your existing or create new
6. **IAM Role**: Create role with S3 read/write permissions (for file uploads)

**IAM Role Permissions** (for S3 access):
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::your-bucket-name/*"
    }
  ]
}
```

### Step 3: Allocate Elastic IP (Optional but Recommended)

1. Go to EC2 → Elastic IPs
2. Allocate Elastic IP
3. Associate with your EC2 instance

---

## Database Setup (RDS PostgreSQL)

### Step 1: Create RDS PostgreSQL Instance

1. **Engine**: PostgreSQL 15.x or 16.x
2. **Template**: Production or Dev/Test (depending on needs)
3. **Instance Class**: `db.t3.micro` (dev) or `db.t3.small` (production)
4. **Storage**: 20GB+ with auto-scaling enabled
5. **VPC**: Same as EC2 instance
6. **Security Group**: `ogp-rds-sg`
7. **Database Name**: `ogp_production`
8. **Master Username**: `ogp_admin` (or your choice)
9. **Master Password**: Generate strong password (save securely!)
10. **Public Access**: No (for security)
11. **Backup Retention**: 7 days (production) or 1 day (dev)

### Step 2: Enable PostGIS Extension

Connect to RDS instance and enable PostGIS:

```bash
# Connect to RDS from EC2 instance
psql -h <rds-endpoint> -U ogp_admin -d ogp_production

# In psql:
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;
\q
```

### Step 3: Get RDS Connection Details

Note down:
- **Endpoint**: `your-db.xxxxx.us-east-1.rds.amazonaws.com`
- **Port**: `5432`
- **Database Name**: `ogp_production`
- **Username**: `ogp_admin`
- **Password**: (saved securely)

---

## S3 Bucket for File Storage

### Step 1: Create S3 Bucket

1. **Bucket Name**: `ogp-uploads-<your-region>` (must be globally unique)
2. **Region**: Same as EC2/RDS
3. **Block Public Access**: Enable (we'll use presigned URLs if needed)
4. **Versioning**: Enable (optional, for file recovery)
5. **Encryption**: Enable (SSE-S3 or SSE-KMS)

### Step 2: Configure Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowEC2Access",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::YOUR_ACCOUNT_ID:role/ogp-ec2-role"
      },
      "Action": [
        "s3:PutObject",
        "s3:GetObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::ogp-uploads-*/*"
    }
  ]
}
```

### Step 3: Create CORS Configuration (if needed for direct uploads)

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
    "AllowedOrigins": ["https://yourdomain.com"],
    "ExposeHeaders": ["ETag"]
  }
]
```

---

## EC2 Instance Setup

### Step 1: Connect to EC2 Instance

```bash
# Amazon Linux 2023 (default user: ec2-user)
ssh -i your-key.pem ec2-user@<ec2-elastic-ip>

# Ubuntu (default user: ubuntu)
ssh -i your-key.pem ubuntu@<ec2-elastic-ip>
```

### Step 2: Run Automated Setup Script (Recommended)

The setup script auto-detects your OS (Amazon Linux or Ubuntu) and installs all dependencies:

```bash
curl -fsSL https://raw.githubusercontent.com/jtalface/open-government-platform/main/scripts/deploy-setup.sh -o deploy-setup.sh
chmod +x deploy-setup.sh
./deploy-setup.sh
```

**Supported OS**: Amazon Linux 2023, Amazon Linux 2, Ubuntu 22.04

### Step 3: Manual Installation (Alternative)

If you prefer manual setup, follow the commands for your OS:

**Amazon Linux 2023** (uses `dnf`):
```bash
sudo dnf update -y
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs postgresql15 nginx git
sudo systemctl enable nginx && sudo systemctl start nginx
npm install -g pnpm pm2
```

**Ubuntu 22.04** (uses `apt`):
```bash
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs postgresql-client nginx git
sudo systemctl enable nginx && sudo systemctl start nginx
npm install -g pnpm pm2
```

### Step 4: Create Application User (Optional but Recommended)

```bash
# Amazon Linux
sudo adduser ogp
sudo usermod -aG wheel ogp

# Ubuntu
sudo adduser --disabled-password --gecos "" ogp
sudo usermod -aG sudo ogp
```

---

## Application Deployment

### Step 1: Clone Repository

```bash
# Amazon Linux: /home/ec2-user
# Ubuntu: /home/ubuntu
cd ~
git clone https://github.com/jtalface/open-government-platform.git
cd open-government-platform
```

### Step 2: Install Dependencies

```bash
pnpm install
```

**Note**: ESLint and TypeScript checking are disabled during builds by default (configured in `next.config.js`). Linting should be done in CI/CD, not during production builds.

### Step 3: Build Application

```bash
# Clean build (if you have cached build artifacts)
rm -rf apps/web/.next

# Build application
pnpm build
```

**Note**: ESLint and TypeScript checking are disabled during builds. If you still see lint errors, try:
```bash
# Clear all caches and rebuild
rm -rf apps/web/.next node_modules/.cache
pnpm build
```

### Step 4: Create Environment Files

#### Create `.env` in `apps/web/`:

```bash
cd apps/web
nano .env.production
```

**Content**:
```env
# Database
DATABASE_URL="postgresql://ogp_admin:YOUR_PASSWORD@your-db.xxxxx.us-east-1.rds.amazonaws.com:5432/ogp_production?schema=public"

# NextAuth
NEXTAUTH_URL="https://yourdomain.com"
NEXTAUTH_SECRET="generate-strong-secret-here-use-openssl-rand-base64-32"

# Mapbox (optional)
NEXT_PUBLIC_MAPBOX_TOKEN="your-mapbox-token"

# AWS S3 (for file uploads)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
S3_BUCKET_NAME="ogp-uploads-your-region"
S3_UPLOAD_PREFIX="incidents"

# Application
NODE_ENV="production"
PORT=4000
```

**Generate NEXTAUTH_SECRET**:
```bash
openssl rand -base64 32
```

#### Create `.env` in `packages/database/`:

```bash
cd ../../packages/database
nano .env
```

**Content**:
```env
DATABASE_URL="postgresql://ogp_admin:YOUR_PASSWORD@your-db.xxxxx.us-east-1.rds.amazonaws.com:5432/ogp_production?schema=public"
```

### Step 5: Generate Prisma Client

```bash
cd ../..
pnpm db:generate
```

### Step 6: Run Database Migrations

```bash
# First, test connection
psql -h your-db.xxxxx.us-east-1.rds.amazonaws.com -U ogp_admin -d ogp_production -c "SELECT version();"

# Run migrations
pnpm db:migrate

# Or if migrations don't exist, push schema
pnpm db:push
```

### Step 7: Seed Database (Optional - only for initial setup)

```bash
pnpm db:seed
```

### Step 8: Update Image Upload to Use S3 (Optional)

If you want to use S3 instead of local storage, update the upload endpoint:

```typescript
// apps/web/src/app/api/incidents/upload/route.ts
// Replace local file storage with S3 upload
```

For now, local storage in `public/uploads/` works, but S3 is recommended for production.

---

## Nginx Reverse Proxy

### Step 1: Create Nginx Configuration

**Ubuntu**: Create in sites-available
```bash
sudo nano /etc/nginx/sites-available/ogp
```

**Amazon Linux**: Create in conf.d
```bash
sudo nano /etc/nginx/conf.d/ogp.conf
```

**Content** (same for both):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Redirect HTTP to HTTPS (after SSL setup)
    # return 301 https://$server_name$request_uri;

    # For now, proxy to Next.js
    location / {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Increase timeouts for large file uploads
    client_max_body_size 10M;
    proxy_read_timeout 300s;
    proxy_connect_timeout 300s;
    proxy_send_timeout 300s;
}
```

### Step 2: Enable Site

**Ubuntu** (uses sites-available/sites-enabled):
```bash
sudo ln -s /etc/nginx/sites-available/ogp /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

**Amazon Linux** (uses conf.d - create config directly):
```bash
# Config goes in /etc/nginx/conf.d/ogp.conf (create this file with the server block above)
sudo nginx -t  # Test configuration
sudo systemctl reload nginx
```

### Step 3: Update NEXTAUTH_URL

Make sure `NEXTAUTH_URL` in `.env.production` matches your domain.

---

## SSL/HTTPS Setup

### Option 1: Using Let's Encrypt (Free)

```bash
# Certbot is installed by deploy-setup.sh
# Amazon Linux: sudo dnf install -y certbot python3-certbot-nginx
# Ubuntu: sudo apt install -y certbot python3-certbot-nginx

# Get certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal is set up automatically
sudo certbot renew --dry-run  # Test renewal
```

### Option 2: Using AWS Certificate Manager (ACM)

1. Request certificate in ACM (must be in same region as CloudFront/ALB)
2. Use with Application Load Balancer or CloudFront
3. Update Nginx to use ALB or configure CloudFront

---

## Process Management

### Step 1: Create PM2 Ecosystem File

The repository includes `ecosystem.config.js` at the project root. Ensure the `cwd` path matches your deployment:

```bash
# Amazon Linux: /home/ec2-user/open-government-platform
# Ubuntu: /home/ubuntu/open-government-platform
cd ~/open-government-platform
```

**Content** (ecosystem.config.js - already in repo):
```javascript
module.exports = {
  apps: [
    {
      name: 'ogp-web',
      script: 'pnpm',
      args: 'start',
      cwd: process.cwd(),  // Uses current directory when run from project root
      env: {
        NODE_ENV: 'production',
        PORT: 4000,
      },
      instances: 1,
      exec_mode: 'fork',
      error_file: '/home/ubuntu/.pm2/logs/ogp-error.log',
      out_file: '/home/ubuntu/.pm2/logs/ogp-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_memory_restart: '1G',
    },
  ],
};
```

### Step 2: Start Application with PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup  # Follow instructions if not already done
```

### Step 3: PM2 Commands

```bash
pm2 status          # Check status
pm2 logs            # View logs
pm2 restart ogp-web # Restart app
pm2 stop ogp-web    # Stop app
pm2 monit           # Monitor resources
```

---

## Monitoring & Logging

### Step 1: Set Up CloudWatch Logs (Optional)

```bash
# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

### Step 2: Monitor Application

- **PM2 Monitoring**: `pm2 monit`
- **System Resources**: `htop` or `top`
- **Nginx Logs**: `/var/log/nginx/access.log` and `/var/log/nginx/error.log`
- **Application Logs**: `pm2 logs`

### Step 3: Set Up Alarms (AWS CloudWatch)

Create alarms for:
- EC2 CPU utilization > 80%
- RDS CPU utilization > 80%
- RDS storage > 80%
- Application errors (if using CloudWatch)

---

## Backup Strategy

### Step 1: Database Backups

RDS automatically creates daily backups (based on retention period).

**Manual Backup**:
```bash
# Create snapshot
aws rds create-db-snapshot \
  --db-instance-identifier your-db-instance \
  --db-snapshot-identifier ogp-manual-$(date +%Y%m%d)
```

### Step 2: Application Files Backup

```bash
# Backup uploads directory
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz /home/ubuntu/open-government-platform/apps/web/public/uploads/

# Upload to S3
aws s3 cp uploads-backup-*.tar.gz s3://your-backup-bucket/
```

### Step 3: Automated Backup Script

Create `/home/ubuntu/backup.sh`:

```bash
#!/bin/bash
DATE=$(date +%Y%m%d)
BACKUP_DIR="/home/ubuntu/backups"

mkdir -p $BACKUP_DIR

# Backup uploads
tar -czf $BACKUP_DIR/uploads-$DATE.tar.gz /home/ubuntu/open-government-platform/apps/web/public/uploads/

# Upload to S3
aws s3 cp $BACKUP_DIR/uploads-$DATE.tar.gz s3://your-backup-bucket/

# Cleanup old backups (keep last 7 days)
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Make executable:
```bash
chmod +x /home/ubuntu/backup.sh
```

Add to crontab:
```bash
crontab -e
# Add: 0 2 * * * /home/ubuntu/backup.sh
```

---

## Security Checklist

### ✅ Completed Steps

- [x] Security groups configured (restrictive inbound rules)
- [x] RDS not publicly accessible
- [x] Strong database passwords
- [x] NEXTAUTH_SECRET generated securely
- [x] SSL/HTTPS enabled
- [x] Firewall rules (UFW) configured

### Additional Security Steps

#### 1. Configure Firewall

**Ubuntu** (UFW):
```bash
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

**Amazon Linux**: AWS Security Groups handle firewall. Ensure your EC2 Security Group allows SSH (22), HTTP (80), HTTPS (443). Local firewalld is optional.

#### 2. Disable Root Login (if using dedicated user)

```bash
sudo nano /etc/ssh/sshd_config
# Set: PermitRootLogin no
sudo systemctl restart sshd
```

#### 3. Keep System Updated

```bash
# Set up automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

#### 4. Environment Variables Security

- Never commit `.env` files
- Use AWS Secrets Manager for sensitive data (optional)
- Rotate credentials regularly

#### 5. Database Security

- Use strong passwords
- Enable SSL connections (RDS supports this)
- Regular security updates
- Monitor for suspicious activity

---

## Post-Deployment Checklist

- [ ] Application accessible via domain
- [ ] HTTPS working correctly
- [ ] Database migrations applied
- [ ] Can create incidents
- [ ] Image uploads working
- [ ] Authentication working
- [ ] All API endpoints responding
- [ ] PM2 process running
- [ ] Nginx serving correctly
- [ ] Logs accessible
- [ ] Backups configured
- [ ] Monitoring set up

---

## Troubleshooting

### Application Not Starting

```bash
# Check PM2 logs
pm2 logs ogp-web

# Check if port is in use
sudo lsof -i :4000

# Restart application
pm2 restart ogp-web
```

### Database Connection Issues

```bash
# Test connection
psql -h your-db-endpoint -U ogp_admin -d ogp_production

# Check security group rules
# Ensure EC2 security group can access RDS security group
```

### Nginx 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify proxy_pass URL
sudo nginx -t
```

### High Memory Usage

```bash
# Monitor with PM2
pm2 monit

# Check system resources
htop

# Consider upgrading instance type or optimizing application
```

---

## Scaling Considerations

### Horizontal Scaling

1. **Application Load Balancer (ALB)**
   - Create ALB in front of multiple EC2 instances
   - Configure target groups
   - Update DNS to point to ALB

2. **Auto Scaling Group**
   - Create launch template
   - Configure auto scaling based on CPU/memory
   - Set min/max/desired capacity

### Database Scaling

1. **Read Replicas**
   - Create read replicas for read-heavy workloads
   - Update application to use read replicas for queries

2. **Vertical Scaling**
   - Upgrade RDS instance class
   - Increase storage with zero downtime

### File Storage

- Use S3 for all file uploads (not local storage)
- Configure CloudFront CDN for faster delivery
- Enable S3 lifecycle policies for old files

---

## Cost Optimization

1. **Use Reserved Instances** for EC2 and RDS (if long-term)
2. **Right-size instances** based on actual usage
3. **Use S3 Intelligent-Tiering** for file storage
4. **Enable RDS automated backups** only for production
5. **Use CloudWatch sparingly** (set log retention)
6. **Clean up unused resources** regularly

---

## Maintenance

### Regular Tasks

- **Weekly**: Review logs, check disk space, verify backups
- **Monthly**: Update system packages, review security groups
- **Quarterly**: Review and optimize costs, security audit

### Updates

```bash
# Pull latest code
cd /home/ubuntu/open-government-platform
git pull origin main

# Install dependencies
pnpm install

# Build application
pnpm build

# Run migrations (if any)
pnpm db:migrate

# Restart application
pm2 restart ogp-web
```

---

## Support & Resources

- **AWS Documentation**: https://docs.aws.amazon.com/
- **Next.js Deployment**: https://nextjs.org/docs/deployment
- **PostgreSQL on RDS**: https://docs.aws.amazon.com/AmazonRDS/latest/UserGuide/CHAP_PostgreSQL.html
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/

---

## Quick Reference Commands

```bash
# Application
pm2 status
pm2 logs ogp-web
pm2 restart ogp-web
pm2 stop ogp-web

# Nginx
sudo nginx -t
sudo systemctl reload nginx
sudo tail -f /var/log/nginx/error.log

# Database
psql -h <rds-endpoint> -U ogp_admin -d ogp_production

# System
htop
df -h
free -h
sudo ufw status
```

---

**Last Updated**: 2026-02-20
**Version**: 1.0
