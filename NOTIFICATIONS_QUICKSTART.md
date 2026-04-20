# Quick Start: Email & WhatsApp Notifications

Follow these steps to get the notification service working after deploying the code changes.

## Step 1: Install Dependencies

On your server (or locally for testing):

```bash
cd /path/to/open-government-platform
pnpm install
```

This will install:
- `@aws-sdk/client-ses` (for email)
- Outbound WhatsApp uses **Meta WhatsApp Cloud API** over HTTP (no Twilio SDK)

## Step 2: Set Up AWS SES (Email)

### Option A: Using IAM Role (Recommended for EC2)

1. **Attach IAM role to EC2 instance** with SES permissions:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "ses:SendEmail",
           "ses:SendRawEmail"
         ],
         "Resource": "*"
       }
     ]
   }
   ```

2. **Verify sender email/domain** in AWS SES Console:
   - Go to AWS Console → SES → Verified identities
   - Add and verify your domain (e.g., `beira.gov.mz`) or email address
   - For testing: Verify individual recipient emails

3. **Request production access** (if needed):
   - SES starts in "sandbox mode" (can only send to verified emails)
   - Request production access to send to any email address

### Option B: Using Access Keys

1. **Create IAM user** with SES permissions (see Option A policy above)
2. **Generate access keys** for the IAM user
3. **Add to environment variables** (see Step 4)

## Step 3: Set Up Meta WhatsApp Cloud API

1. **Meta for Developers** → create/select an app → add **WhatsApp** product.
2. **WhatsApp → API setup**: copy **Phone number ID**, generate a **permanent or long-lived access token** with `whatsapp_business_messaging`.
3. **Webhook** (for inbound + status; outbound works without it):
   - Callback URL: `https://<your-public-host>/api/webhooks/whatsapp`
   - Verify token: set a random string and put the same value in **`WHATSAPP_VERIFY_TOKEN`**.
   - Subscribe to `messages` (and optionally status fields Meta exposes for your WABA).
4. **Templates**: the app sends **plain text** for “Notificar vereação”. If you later switch to named templates, create and **approve** them in Meta Business Manager first.

## Step 4: Configure Environment Variables

Add these to your `.env.production` file (or `.env` for local development):

```env
# AWS SES Configuration
AWS_REGION="us-east-1"  # Your AWS region (e.g., us-east-1, eu-west-1)
AWS_ACCESS_KEY_ID="your-access-key-id"  # Only if not using IAM role
AWS_SECRET_ACCESS_KEY="your-secret-key"  # Only if not using IAM role
SES_FROM_EMAIL="noreply@beira.gov.mz"  # Must be verified in SES

# Meta WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN="your-whatsapp-cloud-api-token"
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
WHATSAPP_VERIFY_TOKEN="your-webhook-verify-token"
WHATSAPP_API_VERSION="v21.0"
META_APP_SECRET="your-meta-app-secret"

# Application URL (for links in notifications)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"  # or http://localhost:4000 for dev
NEXTAUTH_URL="https://yourdomain.com"  # Should already be set
```

**Important Notes:**
- If using EC2 IAM role, you can omit `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- `SES_FROM_EMAIL` must be verified in AWS SES
- Recipient numbers must be reachable on WhatsApp for that WABA (Meta display-phone rules apply)

## Step 5: Restart Application

After adding environment variables:

```bash
# If using PM2
pm2 restart ogp-web

# Or if running directly
# Stop the current process and restart with: pnpm start
```

## Step 6: Configure Category Contacts

Make sure your categories have `responsavel` contact information:

1. **Go to Admin** → **Categories**
2. **Edit a category**
3. **Fill in "Responsável"** fields:
   - Name: Full name
   - Email: Email address (for email notifications)
   - Phone: Phone number (for WhatsApp notifications)

**Phone number format examples:**
- `+258 84 123 4567`
- `0841234567`
- `258841234567`

The system will automatically normalize the phone number.

## Step 7: Test the Service

### Test Email Notification

1. **Ensure a category has responsavel email** configured
2. **Create or find an incident** with status ≠ "OPEN" (e.g., "TRIAGED")
3. **Click "Notificar vereação"** button
4. **Check the email inbox** for the notification

### Test WhatsApp Notification

1. **Ensure** `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set.
2. **Ensure a category has responsavel phone** configured (international format, digits only after normalize).
3. **Create or find an incident** with status ≠ "OPEN"
4. **Click "Notificar vereação"** button
5. **Check WhatsApp** for the message; on failure, read API response in server logs (Graph `error` object).

## Troubleshooting

### Email Not Sending

1. **Check AWS SES status**:
   ```bash
   # Check CloudWatch logs
   # Or check SES console for bounce/complaint rates
   ```

2. **Verify sender email is verified** in SES Console

3. **Check environment variables**:
   ```bash
   echo $AWS_REGION
   echo $SES_FROM_EMAIL
   ```

4. **Check application logs** for errors:
   ```bash
   pm2 logs ogp-web
   # Or check your application logs
   ```

### WhatsApp Not Sending

1. **Check** `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, and `WHATSAPP_API_VERSION` (must match Graph API version in Meta app).
2. **Verify phone number format** (country code + national number, stored as digits).
3. **Meta Business Manager** → WhatsApp → message logs / quality for blocks or policy errors.
4. **Check application logs** for Graph API errors (`code`, `error_subcode`).

### Both Services Not Working

1. **Verify packages installed**:
   ```bash
   cd apps/web
   pnpm list @aws-sdk/client-ses
   ```

2. **Check environment variables loaded**:
   - Restart application after adding variables
   - Verify `.env.production` file exists and is readable

3. **Check IAM permissions** (if using EC2 role):
   - Ensure EC2 instance role has SES permissions
   - Verify role is attached to instance

## Next Steps

- **Monitor usage** in AWS SES and Meta Business / WhatsApp analytics
- **Set up billing alerts** where applicable
- **Request production access** for SES when ready; WhatsApp Cloud API uses your WABA’s limits and quality rating
- **Update phone numbers** in categories as needed

For detailed information, see `NOTIFICATIONS_SETUP.md`.
