# Email and WhatsApp Notifications Setup

This guide explains how to configure email and WhatsApp notifications for the "Notificar vereação" feature.

## Overview

When a manager clicks "Notificar vereação" on a triaged incident, the system will:
1. Send an email to the `responsavel` (responsible person) email address
2. Send a WhatsApp message to the `responsavel` phone number

## Email Setup (AWS SES)

### Step 1: Set up AWS SES

1. **Go to AWS Console** → **Simple Email Service (SES)**
2. **Verify your domain or email address**:
   - For production: Verify your domain (e.g., `beira.gov.mz`)
   - For testing: Verify individual email addresses
3. **Request production access** (if needed):
   - By default, SES is in "sandbox mode" (can only send to verified emails)
   - Request production access to send to any email address

### Step 2: Create IAM User (if not using EC2 instance role)

1. **Create IAM user** with SES permissions:
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

2. **Generate access keys** for the IAM user

### Step 3: Configure Environment Variables

Add to your `.env.production` file:

```env
# AWS SES Configuration
AWS_REGION="us-east-1"  # Your AWS region
AWS_ACCESS_KEY_ID="your-ses-access-key-id"
AWS_SECRET_ACCESS_KEY="your-ses-secret-access-key"
SES_FROM_EMAIL="noreply@beira.gov.mz"  # Verified sender email
```

**Note**: If your EC2 instance has an IAM role with SES permissions, you can omit `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY`. The SDK will use the instance role automatically.

## WhatsApp Setup (Meta WhatsApp Cloud API)

### Step 1: Meta app and token

1. **Meta for Developers** → create or select an app → add **WhatsApp**.
2. From **WhatsApp → API setup**, copy **Phone number ID** and create a **permanent or long-lived** user/system token with **`whatsapp_business_messaging`** (and **`whatsapp_business_management`** if you manage templates via API).

### Step 2: Webhook (inbound + delivery status)

1. Callback URL: **`https://<your-host>/api/webhooks/whatsapp`**
2. **Verify token**: choose a random string; set the same value as **`WHATSAPP_VERIFY_TOKEN`** in the app environment.
3. **`META_APP_SECRET`**: from the app’s **Settings → Basic**; used to validate **`X-Hub-Signature-256`** on POST webhooks (recommended in production).

### Step 3: Configure environment variables

Add to your `.env.production` (or `.env.local` for dev):

```env
# Meta WhatsApp Cloud API
WHATSAPP_ACCESS_TOKEN="your-token"
WHATSAPP_PHONE_NUMBER_ID="your-phone-number-id"
WHATSAPP_VERIFY_TOKEN="your-webhook-verify-token"
WHATSAPP_API_VERSION="v21.0"
META_APP_SECRET="your-meta-app-secret"
```

## Phone number format

The system **strips non-digits** only; it does **not** guess a missing country code. Store the **full international** number (e.g. Mozambique `258…`, US `1…`).

**Examples** (after normalization for Cloud API `to`):
- Input: `+258 84 123 4567` → `258841234567`
- Input: `whatsapp:+14155552671` → `14155552671`

## Testing

### Test Email Notification

1. Ensure a category has a `responsavel` with an email address configured
2. Create or find a triaged incident (status ≠ "OPEN")
3. Click "Notificar vereação" button
4. Check the email inbox

### Test WhatsApp Notification

1. Ensure a category has a `responsavel` with a phone number configured (international digits).
2. Ensure **`WHATSAPP_ACCESS_TOKEN`** and **`WHATSAPP_PHONE_NUMBER_ID`** are set.
3. Create or find a triaged incident (status ≠ "OPEN")
4. Click "Notificar vereação" button
5. Check WhatsApp for the message

## Troubleshooting

### Email Not Sending

1. **Check AWS SES status**:
   - Verify sender email/domain is verified
   - Check if account is in sandbox mode (can only send to verified emails)
   - Check CloudWatch logs for SES errors

2. **Check environment variables**:
   ```bash
   echo $AWS_REGION
   echo $AWS_ACCESS_KEY_ID
   echo $SES_FROM_EMAIL
   ```

3. **Check application logs**:
   - Look for "Error sending email notification" in server logs
   - Check audit log metadata for notification results

### WhatsApp Not Sending

1. **Check Meta credentials**: `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_API_VERSION` (must match the Graph version your app uses in Meta).
2. **Check phone number format**: full international digits after normalization.
3. **Graph errors**: open server logs for HTTP status and `error.message` / `code` from Meta.
4. **Audit log**: notification attempt metadata on the incident notify API response.

### Both Services Not Working

1. **Check package installation**:
   ```bash
   cd apps/web
   pnpm list @aws-sdk/client-ses
   ```

2. **Verify environment variables are loaded**:
   - Restart the application after adding environment variables
   - Check `.env.production` file exists and is readable

3. **Check IAM permissions** (if using EC2 instance role):
   - Ensure EC2 instance role has SES permissions
   - Verify role is attached to the instance

## Cost Considerations

### AWS SES
- **Free tier**: 62,000 emails/month (if sent from EC2)
- **Pricing**: $0.10 per 1,000 emails after free tier
- **Very cost-effective** for low to medium volume

### Meta WhatsApp Cloud API
- Pricing and free tiers are defined by **Meta** for conversation-based billing; see current Meta/WhatsApp Business pricing for your region.

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use IAM roles** instead of access keys when possible (EC2 instances)
3. **Rotate credentials** regularly
4. **Use environment-specific** credentials (dev/staging/production)
5. **Monitor usage** in AWS SES and Meta Business / WhatsApp tools
6. **Set up billing alerts** in both services

## Alternative Solutions

If AWS SES or Meta WhatsApp Cloud API are not suitable:

### Email Alternatives
- **SendGrid**: Popular email service with generous free tier
- **Mailgun**: Developer-friendly email API
- **Postmark**: Transactional email service

### WhatsApp Alternatives
- **360dialog**: WhatsApp Business API provider
- **MessageBird**: Multi-channel messaging platform
- **AWS Pinpoint**: AWS service with WhatsApp support (via partners)

To use alternatives, replace or extend the WhatsApp helpers in `apps/web/src/lib/services/whatsapp-cloud-api.ts` and the send path in `notification-service.ts`.
