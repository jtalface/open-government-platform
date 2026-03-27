#!/usr/bin/env bash
# Merge selected SSM parameters into apps/web/.env.production (production EC2).
# Used on deploy so canonical URLs, Twilio, and SES sender match SSM.
# Values are written with safe escaping (Perl was unsafe for Twilio tokens with " \\ $ etc.).
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

export ENV_FILE
export NA="${NEXTAUTH_URL}" PU="${APP_PUBLIC_URL}" \
  TSID="${TWILIO_ACCOUNT_SID}" TTOK="${TWILIO_AUTH_TOKEN}" \
  TFROM="${TWILIO_WHATSAPP_FROM}" SFE="${SES_FROM_EMAIL}"

python3 <<'PY'
import os

def esc(v: str) -> str:
    if v is None:
        v = ""
    return (
        v.replace("\\", "\\\\")
        .replace('"', '\\"')
        .replace("\r", "")
        .replace("\n", "\\n")
    )

path = os.environ["ENV_FILE"]
updates = {
    "NEXTAUTH_URL": os.environ.get("NA", ""),
    "NEXT_PUBLIC_APP_URL": os.environ.get("PU", ""),
    "TWILIO_ACCOUNT_SID": os.environ.get("TSID", ""),
    "TWILIO_AUTH_TOKEN": os.environ.get("TTOK", ""),
    "TWILIO_WHATSAPP_FROM": os.environ.get("TFROM", ""),
    "SES_FROM_EMAIL": os.environ.get("SFE", ""),
}

with open(path, encoding="utf-8") as f:
    lines = f.readlines()

out = []
for line in lines:
    replaced = False
    for k, v in updates.items():
        if line.startswith(k + "="):
            out.append(f'{k}="{esc(v)}"\n')
            replaced = True
            break
    if not replaced:
        out.append(line)

with open(path, "w", encoding="utf-8") as f:
    f.writelines(out)

print(f"Updated web .env from SSM (safe quoting): {path}")
PY
