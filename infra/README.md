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

## 2) SSM parameters: manual vs Terraform-managed

Some paths are still created **manually** (bootstrap and values Terraform does not own yet). Others are **owned by Terraform** (`aws_ssm_parameter` in `main.tf`): Terraform writes the same paths your EC2 `user-data.sh` and `scripts/apply-ssm-env-to-web.sh` already read.

### Terraform-managed SSM (this repo)

Terraform manages these Parameter Store keys (for `project_name = "ogp"` they resolve to **`/ogp/prod/...`**):

| SSM path (default `project_name = "ogp"`) | Terraform variable | Notes |
|---------------------------------------------|----------------------|--------|
| `/ogp/prod/ses/from_email` | `ses_from_email` | Must match a **verified** SES identity |
| `/ogp/prod/whatsapp/access_token` | `whatsapp_access_token` | SecureString; treat as secret |
| `/ogp/prod/whatsapp/phone_number_id` | `whatsapp_phone_number_id` | String |
| `/ogp/prod/whatsapp/verify_token` | `whatsapp_verify_token` | SecureString; webhook GET verify |
| `/ogp/prod/whatsapp/api_version` | `whatsapp_api_version` | Default `v21.0` in `variables.tf` |
| `/ogp/prod/meta/app_secret` | `meta_app_secret` | SecureString; webhook `X-Hub-Signature-256` |

Resources use **`overwrite = true`** so a first `apply` can adopt paths you may have created earlier with the CLI.

**State and secrets:** Terraform stores sensitive values in **state** (values may still appear in plan/apply output depending on settings). Use a **remote, encrypted backend** and restricted IAM for state; prefer **short-lived apply** from a secure machine, or pass secrets via **`TF_VAR_*`** / a **gitignored** `*.tfvars` file instead of committing real tokens.

### Safe checklist: replace placeholders and apply

Do this whenever you rotate Meta tokens or change the verified SES sender.

1. **Do not commit real secrets.** Keep `infra/terraform.tfvars` as placeholders in git if the file is tracked; for real values use a **local** gitignored file (e.g. `infra/secrets.auto.tfvars`) or export `TF_VAR_whatsapp_access_token`, `TF_VAR_whatsapp_verify_token`, `TF_VAR_meta_app_secret`, etc.
2. **SES:** In the SES console (`af-south-1` or your chosen SES region), verify the **same** address you set in `ses_from_email` before relying on email notify.
3. **Meta:** In Meta Developer → WhatsApp, confirm **Phone number ID**, **access token** scopes, and that the webhook **verify token** matches `whatsapp_verify_token`.
4. From **`infra/`** (Terraform auto-loads `terraform.tfvars` if present):

```bash
cd infra
terraform init
terraform plan -out=tfplan
```

5. **Review `tfplan`:** you should see only the expected `aws_ssm_parameter` updates (and any other intentional changes). SecureString values normally show as **sensitive** in the plan.
6. Apply:

```bash
terraform apply tfplan
```

7. **Roll config to running app instances:** SSM is updated immediately, but each instance’s `apps/web/.env.production` is only refreshed when you run **`./deploy.sh`** from the repo root (or you replace instances, e.g. ASG instance refresh after launch template changes).
8. **Smoke-test:** “Notificar vereação” once and confirm email + WhatsApp; check PM2 logs for Graph or SES errors.

### Manual SSM parameters (bootstrap)

Create or update these **outside** Terraform (replace placeholder values). They must exist **before** first RDS/app bootstrap as documented today:

```bash
aws ssm put-parameter --name '/ogp/prod/db/password' --type 'SecureString' --value 'REPLACE_DB_PASSWORD' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/nextauth/secret' --type 'SecureString' --value 'REPLACE_NEXTAUTH_SECRET' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/nextauth/url' --type 'String' --value 'https://yourdomain.com' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/app/public_url' --type 'String' --value 'https://yourdomain.com' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/s3/bucket_name' --type 'String' --value 'REPLACE_BUCKET_NAME' --overwrite --region af-south-1
aws ssm put-parameter --name '/ogp/prod/mapbox/token' --type 'String' --value 'REPLACE_MAPBOX_TOKEN' --overwrite --region af-south-1
```

**Then** set the Terraform-managed values (in `terraform.tfvars` or via `TF_VAR_*`) and run **`terraform apply`** so `/ogp/prod/ses/from_email` and `/ogp/prod/whatsapp/*` exist before instances rely on them.

Note: WhatsApp Cloud API values must be real Meta credentials before notifications work (see Meta Developer app → WhatsApp → API setup).

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

3. **SSM sender (`ses_from_email`)** — set the variable in `terraform.tfvars` (or `TF_VAR_ses_from_email`) and run **`terraform apply`** so Parameter Store matches your verified identity. Then run **`./deploy.sh`** so each instance’s `apps/web/.env.production` picks up the new `SES_FROM_EMAIL`.

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

`ses_from_email`, `whatsapp_*`, and `meta_app_secret` are **required Terraform variables** for this repo. With `cd infra`, values are picked up from **`terraform.tfvars`** if that file is present. For production secrets, prefer a **gitignored** `*.auto.tfvars` file or **`TF_VAR_*`** environment variables instead of committing tokens.

Create and apply plan:

```bash
terraform plan -out=tfplan -var="aws_region=af-south-1" -var="project_name=ogp" -var="domain_name=yourdomain.com" -var='public_subnets=["10.0.1.0/24","10.0.2.0/24"]' -var='private_subnets=["10.0.11.0/24","10.0.12.0/24"]' -var='db_subnets=["10.0.21.0/24","10.0.22.0/24"]' -var="db_username=ogp_admin" -var="db_password_ssm_param=/ogp/prod/db/password"
terraform apply tfplan
```

Optional (recommended for production secrets): use a gitignored secrets file.

```bash
cat > secrets.auto.tfvars <<'EOF'
ses_from_email           = "noreply@beiraewawa.com"
whatsapp_access_token    = "REPLACE_META_WHATSAPP_ACCESS_TOKEN"
whatsapp_phone_number_id = "REPLACE_PHONE_NUMBER_ID"
whatsapp_verify_token    = "REPLACE_WEBHOOK_VERIFY_TOKEN"
whatsapp_api_version     = "v21.0"
meta_app_secret          = "REPLACE_META_APP_SECRET"
EOF

# This repo ignores infra/secrets.auto.tfvars in .gitignore.
terraform plan -out=tfplan -var-file="secrets.auto.tfvars"
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

2. If WhatsApp send fails, ensure SSM has **`/ogp/prod/whatsapp/access_token`**, **`phone_number_id`**, **`verify_token`**, and optional **`api_version`** / **`/ogp/prod/meta/app_secret`**; refresh `.env.production` from SSM before build.

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
- **SSM:** `/ogp/prod/ses/from_email` verified in SES (`af-south-1`); WhatsApp Cloud API params under **`/ogp/prod/whatsapp/*`** and **`/ogp/prod/meta/app_secret`**
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

3. **WhatsApp (Meta Cloud API)**  
   - **`/ogp/prod/whatsapp/*`** and **`/ogp/prod/meta/app_secret`** in SSM; **`./deploy.sh`** runs **`scripts/apply-ssm-env-to-web.sh`** (Python-safe quoting for secrets).  
   - Webhook callback URL: **`https://<your-host>/api/webhooks/whatsapp`**.  
   - Category **telefone** = full international digits (store country code; no `whatsapp:` prefix).

4. **App releases**  
   - Run **`./deploy.sh`** from your **laptop** (AWS CLI + SSM), not only on EC2, so both instances get the same git revision and env.

5. **Database migrations**  
   - After pulling migrations, run **`prisma migrate deploy`** once against RDS (SSM one-liner in conversation history / use `pnpm exec prisma migrate deploy` on an instance with `DATABASE_URL` loaded).

