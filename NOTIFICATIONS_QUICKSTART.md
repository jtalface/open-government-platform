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
- `twilio` (for WhatsApp)

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

## Step 3: Set Up Twilio (WhatsApp)

### For Testing (Sandbox Mode)

1. **Sign up** at [https://www.twilio.com](https://www.twilio.com)
2. **Get credentials** from Twilio Console:
   - Account SID
   - Auth Token
3. **Set up WhatsApp Sandbox**:
   - Go to Twilio Console → Messaging → Try it out → Send a WhatsApp message
   - Note the join code (e.g., `join <code>`)
   - Send the join code to `+1 415 523 8886` from your WhatsApp
   - You're now in the sandbox!

### For Production

1. **Request WhatsApp Business API access**:
   - Go to Twilio Console → Messaging → Settings → WhatsApp Senders
   - Fill out the application form
   - Provide business information
   - Wait for approval (1-3 business days)

## Step 4: Configure Environment Variables

Add these to your `.env.production` file (or `.env` for local development):

```env
# AWS SES Configuration
AWS_REGION="us-east-1"  # Your AWS region (e.g., us-east-1, eu-west-1)
AWS_ACCESS_KEY_ID="your-access-key-id"  # Only if not using IAM role
AWS_SECRET_ACCESS_KEY="your-secret-key"  # Only if not using IAM role
SES_FROM_EMAIL="noreply@beira.gov.mz"  # Must be verified in SES

# Twilio Configuration
TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
TWILIO_AUTH_TOKEN="your-auth-token"
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"  # Sandbox number, or your approved number

# Application URL (for links in notifications)
NEXT_PUBLIC_APP_URL="https://yourdomain.com"  # or http://localhost:4000 for dev
NEXTAUTH_URL="https://yourdomain.com"  # Should already be set
```

**Important Notes:**
- If using EC2 IAM role, you can omit `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`
- `SES_FROM_EMAIL` must be verified in AWS SES
- For sandbox testing, recipient phone numbers must join the Twilio sandbox

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

1. **For sandbox**: Ensure the recipient phone number has joined the Twilio sandbox
2. **Ensure a category has responsavel phone** configured
3. **Create or find an incident** with status ≠ "OPEN"
4. **Click "Notificar vereação"** button
5. **Check WhatsApp** for the message

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

1. **For sandbox**: Ensure recipient joined the sandbox
2. **Check Twilio credentials** are correct
3. **Verify phone number format** (should include country code)
4. **Check Twilio Console** for message logs and errors
5. **Check application logs** for errors

### Both Services Not Working

1. **Verify packages installed**:
   ```bash
   cd apps/web
   pnpm list @aws-sdk/client-ses twilio
   ```

2. **Check environment variables loaded**:
   - Restart application after adding variables
   - Verify `.env.production` file exists and is readable

3. **Check IAM permissions** (if using EC2 role):
   - Ensure EC2 instance role has SES permissions
   - Verify role is attached to instance

## Next Steps

- **Monitor usage** in AWS SES and Twilio dashboards
- **Set up billing alerts** in both services
- **Request production access** for SES and WhatsApp when ready
- **Update phone numbers** in categories as needed

For detailed information, see `NOTIFICATIONS_SETUP.md`.
