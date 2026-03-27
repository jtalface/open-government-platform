#!/usr/bin/env bash
# Merge selected SSM parameters into apps/web/.env.production (production EC2).
# Used on deploy so canonical URLs, Twilio, and SES sender match SSM.
set -euo pipefail

REGION="${AWS_REGION:-af-south-1}"
PARAM_BASE="${SSM_PARAM_BASE:-/ogp/prod}"
APP_ROOT="${APP_ROOT:-/opt/ogp/app}"
ENV_FILE="${APP_ROOT}/apps/web/.env.production"

if [[ ! -f "${ENV_FILE}" ]]; then
  echo "Missing ${ENV_FILE} — bootstrap user-data should create it first." >&2
  exit 1
fi

NEXTAUTH_URL="$(aws ssm get-parameter --name "${PARAM_BASE}/nextauth/url" --region "${REGION}" --query 'Parameter.Value' --output text)"
APP_PUBLIC_URL="$(aws ssm get-parameter --name "${PARAM_BASE}/app/public_url" --region "${REGION}" --query 'Parameter.Value' --output text)"

TWILIO_ACCOUNT_SID="$(aws ssm get-parameter --name "${PARAM_BASE}/twilio/account_sid" --region "${REGION}" --query 'Parameter.Value' --output text)"
TWILIO_AUTH_TOKEN="$(aws ssm get-parameter --name "${PARAM_BASE}/twilio/auth_token" --with-decryption --region "${REGION}" --query 'Parameter.Value' --output text)"
TWILIO_WHATSAPP_FROM="$(aws ssm get-parameter --name "${PARAM_BASE}/twilio/whatsapp_from" --region "${REGION}" --query 'Parameter.Value' --output text)"
SES_FROM_EMAIL="$(aws ssm get-parameter --name "${PARAM_BASE}/ses/from_email" --region "${REGION}" --query 'Parameter.Value' --output text)"

export NA="${NEXTAUTH_URL}" PU="${APP_PUBLIC_URL}"
export TSID="${TWILIO_ACCOUNT_SID}" TTOK="${TWILIO_AUTH_TOKEN}" TFROM="${TWILIO_WHATSAPP_FROM}" SFE="${SES_FROM_EMAIL}"

perl -i -pe '
  BEGIN {
    $na = $ENV{NA}; $pu = $ENV{PU};
    $tsid = $ENV{TSID}; $ttok = $ENV{TTOK}; $tfrom = $ENV{TFROM}; $sfe = $ENV{SFE};
  }
  s/^NEXTAUTH_URL=.*/NEXTAUTH_URL="$na"/;
  s/^NEXT_PUBLIC_APP_URL=.*/NEXT_PUBLIC_APP_URL="$pu"/;
  s/^TWILIO_ACCOUNT_SID=.*/TWILIO_ACCOUNT_SID="$tsid"/;
  s/^TWILIO_AUTH_TOKEN=.*/TWILIO_AUTH_TOKEN="$ttok"/;
  s/^TWILIO_WHATSAPP_FROM=.*/TWILIO_WHATSAPP_FROM="$tfrom"/;
  s/^SES_FROM_EMAIL=.*/SES_FROM_EMAIL="$sfe"/;
' "${ENV_FILE}"

echo "Updated web .env from SSM (${PARAM_BASE}): URLs, Twilio, SES_FROM_EMAIL."
