                                                                                                    # OGP AWS Production Deployment Guide

This guide explains how to deploy the Open Government Platform to AWS using the Terraform configuration in this `infra` folder.

## Architecture

- CloudFront
- Application Load Balancer (public subnets)
- Auto Scaling Group with 2 app instances in private subnets (min=2, desired=2, max=4)
- RDS PostgreSQL (Single-AZ) in DB subnets
- S3 bucket for uploads/static
- Parameter Store (SSM) for app secrets/config

## 1) Prerequisites

- AWS CLI installed and configured
- Terraform installed
- IAM user/role with permissions for EC2, VPC, ELB, ASG, IAM, RDS, S3, CloudFront, SSM, CloudWatch
- Region used in this setup: `af-south-1`

Quick checks:

```bash
aws sts get-caller-identity
terraform -version
```

## 2) Required SSM Parameters

Create these before first deployment (replace placeholder values):

```bash
aws ssm put-parameter --name '/ogp/prod/db/password' --type 'SecureString' --value 'REPLACE_DB_PASSWORD' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/nextauth/secret' --type 'SecureString' --value 'REPLACE_NEXTAUTH_SECRET' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/nextauth/url' --type 'String' --value 'https://yourdomain.com' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/app/public_url' --type 'String' --value 'https://yourdomain.com' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/s3/bucket_name' --type 'String' --value 'REPLACE_BUCKET_NAME' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/ses/from_email' --type 'String' --value 'noreply@beiraewawa.com' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/twilio/account_sid' --type 'String' --value 'AC00000000000000000000000000000000' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/twilio/auth_token' --type 'SecureString' --value 'dummy-token-not-real' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/twilio/whatsapp_from' --type 'String' --value 'whatsapp:+14155238886' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/mapbox/token' --type 'String' --value 'REPLACE_MAPBOX_TOKEN' --overwrite --region af-south-1
```

Note: Twilio values can be placeholders for initial deploy, but replace with real credentials before enabling notifications.

### Canonical URL (production)

Use **one** primary site URL everywhere (NextAuth, cookies, OAuth redirects, emails). For **beiraewawa.com** the canonical host is:

**`https://www.beiraewawa.com`**

After you point DNS / CloudFront at this host, set SSM to that exact value (no trailing slash unless your team standardizes otherwise):

```bash
aws ssm put-parameter --name '/ogp/prod/nextauth/url' --type 'String' --value 'https://www.beiraewawa.com' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/app/public_url' --type 'String' --value 'https://www.beiraewawa.com' --overwrite --region af-south-1
```

### Email notifications (SES)

Notify-category email uses **Amazon SES in the same region as `AWS_REGION`** on the EC2 instances (typically **`af-south-1`**). The EC2 role must allow `ses:SendEmail` (included in this repo’s Terraform).

1. **AWS Console** → **SES** → region **`af-south-1`** → **Verified identities**  
   - Add and verify a **domain** (e.g. `beiraewawa.com`) *or* a single **email** you send from (e.g. `noreply@beiraewawa.com`).  
   - **From** address in SSM must match that identity exactly.

2. **Sandbox vs production**  
   - In **sandbox**, SES only sends **to** verified addresses too — verify each category **responsável** email you test with, **or** request **production access** for `af-south-1` to send to any recipient.

3. **SSM** (then **`./deploy.sh`** so `.env.production` picks it up):

```bash
aws ssm put-parameter --name '/ogp/prod/ses/from_email' --type 'String' --value 'noreply@beiraewawa.com' --overwrite --region af-south-1
```

Use a **verified** sender; avoid placeholders like `yourdomain.com`. Optional: set **`SES_REGION=af-south-1`** in `.env.production` if you ever need SES in a different region than `AWS_REGION`.

In your OAuth provider (e.g. Google), add redirect URIs for this host, e.g. `https://www.beiraewawa.com/api/auth/callback/google` (adjust path if your app differs).

Then run **`./deploy.sh`** from your machine (repo root). It refreshes `NEXTAUTH_URL` / `NEXT_PUBLIC_APP_URL` from SSM into `.env.production` on each instance before `pnpm build`, so the new canonical URL is baked into the Next.js build.

### CloudFront custom domains (do not skip)

The Terraform `aws_cloudfront_distribution` **must** include your **alternate domain names** and **ACM certificate (us-east-1)**. If you apply with only the default CloudFront certificate, Terraform **removes** `www` / apex hostnames from the distribution and browsers show **403** from CloudFront for `https://www…`.

1. Set in `terraform.tfvars`:
   - **`cloudfront_aliases`** — e.g. `www.beiraewawa.com`, `beiraewawa.com`, and `.org` equivalents.
   - **`cloudfront_acm_certificate_arn`** — ARN of the cert in **`us-east-1`** (same cert you use for HTTPS on those names).

2. Look up the ARN:

```bash
aws acm list-certificates --region us-east-1 --query "CertificateSummaryList[].[DomainName,CertificateArn]" --output table
```

3. **Immediate recovery** if aliases were already removed: AWS Console → **CloudFront** → distribution → **Edit** → restore **alternate domain names** + **Custom SSL certificate** (ACM in **N. Virginia**), save, wait until **Deployed**. Then fix Terraform as above so the next `apply` does not strip them again.

## 3) Terraform Init / Validate / Plan / Apply

From project root:

```bash
cd infra
terraform init
terraform validate
```

Create and apply plan:

```bash
terraform plan -out=tfplan -var="aws_region=af-south-1" -var="project_name=ogp" -var="domain_name=yourdomain.com" -var='public_subnets=["10.0.1.0/24","10.0.2.0/24"]' -var='private_subnets=["10.0.11.0/24","10.0.12.0/24"]' -var='db_subnets=["10.0.21.0/24","10.0.22.0/24"]' -var="db_username=ogp_admin" -var="db_password_ssm_param=/ogp/prod/db/password"
terraform apply tfplan
```

## 4) Post-Deploy Health Checks

### Target health (must be healthy)

```bash
aws elbv2 describe-target-health --region af-south-1 --target-group-arn $(aws elbv2 describe-target-groups --region af-south-1 --names ogp-tg --query "TargetGroups[0].TargetGroupArn" --output text) --query "TargetHealthDescriptions[].{Id:Target.Id,State:TargetHealth.State,Reason:TargetHealth.Reason}" --output table
```

### ALB URL

```bash
aws elbv2 describe-load-balancers --region af-south-1 --names ogp-alb --query "LoadBalancers[0].DNSName" --output text
```

### CloudFront URL

```bash
aws cloudfront list-distributions --query "DistributionList.Items[].{Id:Id,Domain:DomainName,Status:Status}" --output table
```

Open ALB and CloudFront URLs in browser and verify the app loads.

### Production smoke-test checklist (app)

Run this quick checklist after each production deploy:

- [ ] Sign in works (valid user, no 500/error page)
- [ ] Sign up works (new citizen can register with 3 security questions)
- [ ] Forgot password works (phone -> questions -> reset -> sign in with new password)
- [ ] Incidents list loads and incident detail page opens
- [ ] Admin can open removed incidents page and view soft-deleted records
- [ ] Core navigation pages load (`/`, auth pages, incidents pages, admin pages)
- [ ] No critical runtime errors in PM2 logs on app instances

Optional quick command checks:

```bash
pm2 logs ogp-web --lines 200 --nostream
```

```bash
cd /opt/ogp/app && pnpm --filter @ogp/database exec prisma migrate status
```

## 5) If Targets Are Unhealthy

1. Check app process and local response on each instance with SSM:

```bash
aws ssm send-command --region af-south-1 --instance-ids <INSTANCE_ID_1> <INSTANCE_ID_2> --document-name "AWS-RunShellScript" --parameters '{"commands":["export HOME=/root PM2_HOME=/root/.pm2","pm2 status","pm2 logs ogp-web --lines 120 --nostream","ss -lntp | grep :4000 || true","curl -I -s http://127.0.0.1:4000/ | head -n 1 || true"]}' --query "Command.CommandId" --output text
```

2. If build failed due to Twilio SID format, ensure:
- `TWILIO_ACCOUNT_SID` starts with `AC`
- `.env.production` is refreshed from SSM before build

3. If PM2 process is missing, restart manually:

```bash
aws ssm send-command --region af-south-1 --instance-ids <INSTANCE_ID_1> <INSTANCE_ID_2> --document-name "AWS-RunShellScript" --parameters '{"commands":["export HOME=/root PM2_HOME=/root/.pm2 NODE_ENV=production PORT=4000","cd /opt/ogp/app/apps/web","pm2 delete ogp-web || true","pm2 start pnpm --name ogp-web -- start","pm2 save"]}' --query "Command.CommandId" --output text
```

## 6) Rolling Out Bootstrap Changes

If you change `user-data.sh`:

1. Apply Terraform (updates launch template)
2. Trigger ASG instance refresh:

```bash
aws autoscaling start-instance-refresh --region af-south-1 --auto-scaling-group-name ogp-asg --preferences '{"MinHealthyPercentage":50,"InstanceWarmup":180}'
```

Monitor:

```bash
aws autoscaling describe-instance-refreshes --region af-south-1 --auto-scaling-group-name ogp-asg --query "InstanceRefreshes[0].{Status:Status,Percentage:PercentageComplete,Reason:StatusReason}" --output table
```

## 7) Reusable Release Checklist

- `terraform plan` shows expected changes only
- ASG has 2 healthy instances
- Target group shows healthy targets
- RDS is available
- ALB and CloudFront URLs respond
- **CloudFront:** alternate domain names + custom ACM still present (or match `terraform.tfvars`)
- **SSM:** `/ogp/prod/ses/from_email` verified in SES (`af-south-1`); Twilio params set for WhatsApp
- App deploy from repo root: **`./deploy.sh`** (refreshes SSM → `.env`, runs `pnpm db:generate` before web build)
- Core app flows work (auth, incidents, notify vereação: email + WhatsApp as configured)
- CloudWatch alarms/metrics are normal

## 8) Production guardrails (keep the working setup)

These are the issues that broke production before; do not regress without reading this.

1. **Terraform + CloudFront**  
   - `aws_cloudfront_distribution` in `main.tf` includes **`aliases`** and **`viewer_certificate`** from variables.  
   - **`infra/terraform.tfvars`** must set **`cloudfront_acm_certificate_arn`** to your **us-east-1** ACM ARN whenever **`cloudfront_aliases`** is non-empty. An empty ARN will fail the **precondition** instead of silently removing custom domains again.  
   - Copy from **`terraform.tfvars.example`** if you need a template.  
   - **Never** revert `main.tf` CloudFront to “default certificate only” without understanding you will drop `www` / apex HTTPS.

2. **SES email**  
   - **`/ogp/prod/ses/from_email`** must match a **verified** identity in SES **`af-south-1`**.  
   - Domain DKIM (GoDaddy CNAMEs) must stay correct. Sandbox: verify recipient addresses or use production access.

3. **WhatsApp**  
   - **`/ogp/prod/twilio/*`** in SSM; **`./deploy.sh`** runs **`scripts/apply-ssm-env-to-web.sh`** (Python-safe quoting for secrets).  
   - Category **telefone** = full **E.164** digits (no automatic `258` prefix).

4. **App releases**  
   - Run **`./deploy.sh`** from your **laptop** (AWS CLI + SSM), not only on EC2, so both instances get the same git revision and env.

5. **Database migrations**  
   - After pulling migrations, run **`prisma migrate deploy`** once against RDS (SSM one-liner in conversation history / use `pnpm exec prisma migrate deploy` on an instance with `DATABASE_URL` loaded).

