# RDS PostgreSQL Setup Guide

Step-by-step guide to create an RDS PostgreSQL database with PostGIS for the Open Government Platform.

## Prerequisites

- AWS Account with RDS permissions
- EC2 instance already running (for security group configuration)
- EC2 security group created (`ogp-ec2-sg`)

---

## Step 1: Create RDS Security Group

**Before creating RDS, create a security group:**

1. Go to **EC2 Console** → **Security Groups**
2. Click **Create Security Group**
3. **Name**: `ogp-rds-sg`
4. **Description**: `Security group for OGP RDS PostgreSQL database`
5. **VPC**: Select the same VPC as your EC2 instance
6. **Inbound Rules**:
   - **Type**: PostgreSQL
   - **Port**: 5432
   - **Source**: Custom → Select `ogp-ec2-sg` (your EC2 security group)
   - **Description**: `Allow PostgreSQL from EC2 instance`
7. **Outbound Rules**: Leave default (All traffic)
8. Click **Create Security Group**

---

## Step 2: Create RDS PostgreSQL Instance

### Via AWS Console

1. **Go to RDS Console**
   - Navigate to **AWS Console** → **RDS** → **Databases**
   - Click **Create Database**

2. **Choose Database Creation Method**
   - Select **Standard create** (recommended for more control)

3. **Engine Options**
   - **Engine Type**: PostgreSQL
   - **Version**: **15.x** or **16.x** (recommended: 15.4 or latest 15.x)
   - ✅ **PostgreSQL 15.x** is recommended for better PostGIS support

4. **Templates**
   - **Production**: For production workloads (multi-AZ, backups)
   - **Dev/Test**: For development/testing (single-AZ, minimal backups)
   - Choose based on your needs

5. **Settings**
   - **DB Instance Identifier**: `ogp-production` (or your preferred name)
   - **Master Username**: `ogp_admin` (or your choice)
   - **Master Password**: 
     - Click **Auto generate a password** (recommended) OR
     - Enter a strong password manually
     - **⚠️ SAVE THE PASSWORD SECURELY!** You'll need it for connection strings.

6. **Instance Configuration**
   - **DB Instance Class**: 
     - **Dev/Test**: `db.t3.micro` (1 vCPU, 1GB RAM) - Free tier eligible
     - **Production**: `db.t3.small` (2 vCPU, 2GB RAM) or `db.t3.medium` (2 vCPU, 4GB RAM)
   - **Storage Type**: **General Purpose SSD (gp3)** (recommended)

7. **Storage**
   - **Allocated Storage**: `20` GB (minimum, increase for production)
   - ✅ **Enable storage autoscaling**: Recommended
   - **Maximum storage threshold**: `100` GB (adjust as needed)

8. **Connectivity**
   - **VPC**: Select the **same VPC** as your EC2 instance
   - **Subnet Group**: Use default or create custom
   - **Public Access**: **No** (for security - database should not be publicly accessible)
   - **VPC Security Group**: Select **Choose existing** → `ogp-rds-sg`
   - **Availability Zone**: Leave default (or choose specific zone)
   - **Port**: `5432` (default PostgreSQL port)

9. **Database Authentication**
   - **Password authentication**: Selected (default)

10. **Additional Configuration** (Expand section)
    - **Initial Database Name**: `ogp_production`
    - **DB Parameter Group**: Leave default
    - **Backup Retention Period**: 
      - **Production**: `7` days
      - **Dev/Test**: `1` day
    - ✅ **Enable Enhanced Monitoring**: Optional (for better insights)
    - **Maintenance Window**: Leave default or set preferred time
    - **Deletion Protection**: 
      - ✅ **Enable** for production
      - ❌ **Disable** for dev/test (easier cleanup)

11. **Monitoring** (Optional)
    - ✅ **Enable Performance Insights**: Optional (has cost implications)
    - **Retention Period**: 7 days (if enabled)

12. **Create Database**
    - Click **Create Database**
    - ⏱️ **Creation takes 5-15 minutes**

---

## Step 3: Get RDS Endpoint

Once the database is created:

1. Go to **RDS Console** → **Databases**
2. Click on your database instance (`ogp-production`)
3. In the **Connectivity & Security** tab, find:
   - **Endpoint**: `ogp-production.xxxxx.us-east-1.rds.amazonaws.com`
   - **Port**: `5432`
   - **VPC**: Your VPC ID
   - **Security Groups**: `ogp-rds-sg`

**Save these details:**
- **Endpoint**: `ogp-production.xxxxx.us-east-1.rds.amazonaws.com`
- **Port**: `5432`
- **Database Name**: `ogp_production`
- **Username**: `ogp_admin`
- **Password**: (the one you saved)

---

## Step 4: Enable PostGIS Extension

**Connect from your EC2 instance:**

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Connect to RDS (replace with your endpoint)
psql -h ogp-production.xxxxx.us-east-1.rds.amazonaws.com \
     -U ogp_admin \
     -d ogp_production

# Enter password when prompted

# In psql, enable PostGIS:
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS postgis_topology;

# Verify PostGIS is installed:
SELECT PostGIS_version();

# Exit psql
\q
```

**Expected Output:**
```
postgis
postgis_topology
```

---

## Step 5: Test Connection

**From EC2 instance, test the connection:**

```bash
# Test connection
psql -h ogp-production.xxxxx.us-east-1.rds.amazonaws.com \
     -U ogp_admin \
     -d ogp_production \
     -c "SELECT version(), PostGIS_version();"
```

**Expected Output:**
```
PostgreSQL 15.x on ...
POSTGIS="3.x" ...
```

---

## Step 6: Update Environment Variables

**On your EC2 instance, update environment files:**

```bash
cd ~/open-government-platform

# Update apps/web/.env.production
nano apps/web/.env.production
```

**Update DATABASE_URL:**
```env
DATABASE_URL="postgresql://ogp_admin:YOUR_PASSWORD@ogp-production.xxxxx.us-east-1.rds.amazonaws.com:5432/ogp_production?schema=public"
```

```bash
# Update packages/database/.env
nano packages/database/.env
```

**Update DATABASE_URL:**
```env
DATABASE_URL="postgresql://ogp_admin:YOUR_PASSWORD@ogp-production.xxxxx.us-east-1.rds.amazonaws.com:5432/ogp_production?schema=public"
```

---

## Step 7: Run Database Migrations

**From EC2 instance:**

```bash
cd ~/open-government-platform

# Generate Prisma client
pnpm db:generate

# Push schema to database
pnpm db:push

# Seed database (optional, for initial setup)
pnpm db:seed
```

---

## Troubleshooting

### Connection Timeout

**Problem**: Cannot connect to RDS from EC2

**Solutions**:
1. **Check Security Groups**:
   - RDS security group must allow inbound from EC2 security group
   - EC2 security group must allow outbound to RDS (usually default)

2. **Check VPC**:
   - EC2 and RDS must be in the same VPC
   - Check subnet routing

3. **Test from EC2**:
   ```bash
   # Test connectivity
   telnet ogp-production.xxxxx.us-east-1.rds.amazonaws.com 5432
   ```

### PostGIS Not Available

**Problem**: `ERROR: extension "postgis" does not exist`

**Solution**:
- RDS PostgreSQL includes PostGIS by default
- Make sure you're connected to the correct database
- Try: `CREATE EXTENSION IF NOT EXISTS postgis;`

### Authentication Failed

**Problem**: `password authentication failed`

**Solutions**:
1. Verify username and password
2. Check if password has special characters (may need URL encoding in connection string)
3. Reset master password in RDS Console if needed

### Database Not Found

**Problem**: `database "ogp_production" does not exist`

**Solution**:
- The initial database name should have been set during creation
- If not, create it manually:
  ```sql
  CREATE DATABASE ogp_production;
  ```

---

## Cost Optimization Tips

1. **Use `db.t3.micro` for dev/test** (Free tier eligible for 12 months)
2. **Enable storage autoscaling** (only pay for what you use)
3. **Set backup retention to 1 day** for dev/test
4. **Stop/Start RDS** when not in use (dev/test only)
5. **Use Reserved Instances** for production (save up to 40%)

---

## Security Best Practices

1. ✅ **Never enable public access** to RDS
2. ✅ **Use strong passwords** (auto-generate recommended)
3. ✅ **Enable deletion protection** for production
4. ✅ **Enable automated backups** (7+ days for production)
5. ✅ **Use VPC security groups** (not public IPs)
6. ✅ **Enable encryption at rest** (default in RDS)
7. ✅ **Rotate passwords regularly**

---

## Quick Reference

**Connection String Format:**
```
postgresql://USERNAME:PASSWORD@ENDPOINT:PORT/DATABASE?schema=public
```

**Example:**
```
postgresql://ogp_admin:MyPassword123@ogp-production.xxxxx.us-east-1.rds.amazonaws.com:5432/ogp_production?schema=public
```

**RDS Console URL:**
```
https://console.aws.amazon.com/rds/home?region=us-east-1#databases:
```

---

**Next Steps:**
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete deployment guide
- [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md) - Deployment checklist
