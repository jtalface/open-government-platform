# Deployment Checklist

Quick reference checklist for deploying Open Government Platform on AWS EC2.

## Pre-Deployment

- [ ] AWS account set up with appropriate permissions
- [ ] Domain name registered (optional but recommended)
- [ ] SSH key pair created/downloaded
- [ ] Mapbox API token obtained (if using maps)

## AWS Infrastructure

### Security Groups
- [ ] EC2 security group created (`ogp-ec2-sg`)
  - [ ] SSH (22) from your IP
  - [ ] HTTP (80) from anywhere
  - [ ] HTTPS (443) from anywhere
- [ ] RDS security group created (`ogp-rds-sg`)
  - [ ] PostgreSQL (5432) from EC2 security group only

### EC2 Instance
- [ ] Instance launched (**Amazon Linux 2023** recommended, or Ubuntu 22.04, t3.medium+)
- [ ] Security group attached
- [ ] Key pair configured
- [ ] IAM role created with S3 permissions (if using S3)
- [ ] Elastic IP allocated and associated (optional)

### RDS Database
- [ ] PostgreSQL instance created (15.x or 16.x)
- [ ] Security group attached
- [ ] Database name set: `ogp_production`
- [ ] Master username and password saved securely
- [ ] Backup retention configured
- [ ] PostGIS extension enabled
- [ ] Connection endpoint noted

### S3 Bucket (Optional)
- [ ] Bucket created with unique name
- [ ] Versioning enabled
- [ ] Encryption enabled
- [ ] Bucket policy configured
- [ ] CORS configured (if needed)

## EC2 Setup

- [ ] Connected to instance via SSH (`ec2-user@` for Amazon Linux, `ubuntu@` for Ubuntu)
- [ ] Ran deploy-setup.sh OR manual install complete
- [ ] Node.js 20.x installed
- [ ] pnpm installed
- [ ] PostgreSQL client installed
- [ ] Nginx installed and running
- [ ] PM2 installed
- [ ] Git installed
- [ ] Certbot installed (for SSL)
- [ ] AWS CLI installed (for backups)
- [ ] Firewall configured (UFW on Ubuntu; Security Groups for Amazon Linux)

## Application Deployment

- [ ] Repository cloned
- [ ] Dependencies installed (`pnpm install`)
- [ ] Application built (`pnpm build`)
- [ ] Environment variables configured:
  - [ ] `apps/web/.env.production` created
  - [ ] `packages/database/.env` created
  - [ ] `DATABASE_URL` set with RDS endpoint
  - [ ] `NEXTAUTH_URL` set to your domain
  - [ ] `NEXTAUTH_SECRET` generated (strong random string)
  - [ ] Mapbox token added (if using)
  - [ ] S3 credentials added (if using S3)
- [ ] Prisma client generated (`pnpm db:generate`)
- [ ] Database migrations run (`pnpm db:migrate` or `pnpm db:push`)
- [ ] Database seeded (optional, initial setup only)
- [ ] PM2 ecosystem config created/updated
- [ ] Application started with PM2
- [ ] PM2 startup configured

## Nginx Configuration

- [ ] Nginx config file created (`/etc/nginx/sites-available/ogp`)
- [ ] Site enabled (`sudo ln -s`)
- [ ] Configuration tested (`sudo nginx -t`)
- [ ] Nginx reloaded (`sudo systemctl reload nginx`)
- [ ] HTTP access working

## SSL/HTTPS

- [ ] Domain DNS pointing to EC2 (A record)
- [ ] SSL certificate obtained (Let's Encrypt or ACM)
- [ ] Nginx configured for HTTPS
- [ ] HTTP to HTTPS redirect configured
- [ ] HTTPS access working

## File Storage

- [ ] Uploads directory created (`public/uploads/incidents/`)
- [ ] Permissions set correctly
- [ ] S3 integration configured (if using S3)
- [ ] Image uploads tested

## Monitoring & Logging

- [ ] PM2 monitoring set up
- [ ] Log rotation configured
- [ ] CloudWatch agent installed (optional)
- [ ] Alarms configured (optional)

## Backups

- [ ] RDS automated backups enabled
- [ ] Backup script created (`scripts/backup.sh`)
- [ ] Backup script tested
- [ ] Cron job configured for regular backups
- [ ] S3 backup bucket created (if using)

## Security

- [ ] Firewall (UFW) enabled
- [ ] SSH key-based authentication only
- [ ] Root login disabled (if applicable)
- [ ] Automatic security updates enabled
- [ ] Strong passwords used everywhere
- [ ] Environment variables secured
- [ ] RDS not publicly accessible
- [ ] Security groups restrictive

## Testing

- [ ] Application accessible via domain
- [ ] HTTPS working correctly
- [ ] Can sign in
- [ ] Can create incidents
- [ ] Image uploads working
- [ ] Can edit incidents (as creator)
- [ ] Map displaying correctly
- [ ] All API endpoints responding
- [ ] Database queries working
- [ ] Performance acceptable

## Post-Deployment

- [ ] Documentation updated with actual endpoints/URLs
- [ ] Team notified of deployment
- [ ] Monitoring dashboards set up
- [ ] Backup verification scheduled
- [ ] Maintenance schedule established

## Quick Commands Reference

```bash
# Application
pm2 status
pm2 logs ogp-web
pm2 restart ogp-web

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
```

## Rollback Plan

If something goes wrong:

1. **Stop application**: `pm2 stop ogp-web`
2. **Revert code**: `git checkout <previous-commit>`
3. **Rebuild**: `pnpm build`
4. **Restart**: `pm2 restart ogp-web`
5. **Check logs**: `pm2 logs ogp-web`

For database issues:
- Restore from RDS snapshot
- Or restore from backup file

---

**Last Updated**: 2026-02-20
