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

## WhatsApp Setup (Twilio)

### Step 1: Create Twilio Account

1. **Sign up** at [https://www.twilio.com](https://www.twilio.com)
2. **Verify your account** (may require phone verification)
3. **Get your Account SID and Auth Token** from the Twilio Console dashboard

### Step 2: Set up WhatsApp Sandbox (for testing)

1. **Go to Twilio Console** → **Messaging** → **Try it out** → **Send a WhatsApp message**
2. **Join the sandbox** by sending the join code to the Twilio WhatsApp number
3. **Note the sandbox WhatsApp number** (usually `whatsapp:+14155238886`)

### Step 3: Request WhatsApp Production Access

1. **Go to Twilio Console** → **Messaging** → **Settings** → **WhatsApp Senders**
2. **Request WhatsApp Business API access**:
   - Fill out the application form
   - Provide business information
   - Wait for approval (can take 1-3 business days)

### Step 4: Configure Environment Variables

Add to your `.env.production` file:

```env
# Twilio Configuration
TWILIO_ACCOUNT_SID="your-twilio-account-sid"
TWILIO_AUTH_TOKEN="your-twilio-auth-token"
TWILIO_WHATSAPP_FROM="whatsapp:+14155238886"  # Sandbox number or your approved WhatsApp number
```

## Phone Number Format

The system automatically normalizes phone numbers:
- Removes spaces and special characters
- Adds Mozambique country code (258) if missing
- Formats as: `258XXXXXXXXX` (without leading 0)

**Example**:
- Input: `+258 84 123 4567` → Normalized: `258841234567`
- Input: `0841234567` → Normalized: `258841234567`

## Testing

### Test Email Notification

1. Ensure a category has a `responsavel` with an email address configured
2. Create or find a triaged incident (status ≠ "OPEN")
3. Click "Notificar vereação" button
4. Check the email inbox

### Test WhatsApp Notification

1. Ensure a category has a `responsavel` with a phone number configured
2. **For sandbox**: Join the Twilio WhatsApp sandbox first
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

1. **Check Twilio credentials**:
   - Verify Account SID and Auth Token are correct
   - Check Twilio Console for account status

2. **Check phone number format**:
   - Ensure phone number includes country code
   - Format should be: `258XXXXXXXXX` (Mozambique)

3. **Sandbox limitations**:
   - In sandbox mode, recipient must join the sandbox first
   - Send join code to Twilio WhatsApp number to join

4. **Check application logs**:
   - Look for "Error sending WhatsApp notification" in server logs
   - Check audit log metadata for notification results

### Both Services Not Working

1. **Check package installation**:
   ```bash
   cd apps/web
   pnpm list @aws-sdk/client-ses twilio
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

### Twilio WhatsApp
- **Sandbox**: Free (limited to sandbox participants)
- **Production**: ~$0.005 per message (varies by country)
- **Setup fee**: May apply for WhatsApp Business API approval

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use IAM roles** instead of access keys when possible (EC2 instances)
3. **Rotate credentials** regularly
4. **Use environment-specific** credentials (dev/staging/production)
5. **Monitor usage** in AWS SES and Twilio dashboards
6. **Set up billing alerts** in both services

## Alternative Solutions

If AWS SES or Twilio are not suitable:

### Email Alternatives
- **SendGrid**: Popular email service with generous free tier
- **Mailgun**: Developer-friendly email API
- **Postmark**: Transactional email service

### WhatsApp Alternatives
- **360dialog**: WhatsApp Business API provider
- **MessageBird**: Multi-channel messaging platform
- **AWS Pinpoint**: AWS service with WhatsApp support (via partners)

To use alternatives, modify `/apps/web/src/lib/services/notification-service.ts` to use the alternative SDKs.
