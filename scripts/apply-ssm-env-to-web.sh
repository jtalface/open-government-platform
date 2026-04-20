#!/usr/bin/env bash
# Merge selected SSM parameters into apps/web/.env.production (production EC2).
# Used on deploy so canonical URLs, WhatsApp (Meta Cloud API), and SES sender match SSM.
# Values are written with safe escaping for tokens with " \\ $ etc.).
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
WHATSAPP_ACCESS_TOKEN="$(aws ssm get-parameter --name "${PARAM_BASE}/whatsapp/access_token" --with-decryption --region "${REGION}" --query 'Parameter.Value' --output text)"
WHATSAPP_PHONE_NUMBER_ID="$(aws ssm get-parameter --name "${PARAM_BASE}/whatsapp/phone_number_id" --region "${REGION}" --query 'Parameter.Value' --output text)"
WHATSAPP_VERIFY_TOKEN="$(aws ssm get-parameter --name "${PARAM_BASE}/whatsapp/verify_token" --with-decryption --region "${REGION}" --query 'Parameter.Value' --output text)"
WHATSAPP_API_VERSION="$(aws ssm get-parameter --name "${PARAM_BASE}/whatsapp/api_version" --region "${REGION}" --query 'Parameter.Value' --output text 2>/dev/null || echo "")"
META_APP_SECRET="$(aws ssm get-parameter --name "${PARAM_BASE}/meta/app_secret" --with-decryption --region "${REGION}" --query 'Parameter.Value' --output text 2>/dev/null || echo "")"
SES_FROM_EMAIL="$(aws ssm get-parameter --name "${PARAM_BASE}/ses/from_email" --region "${REGION}" --query 'Parameter.Value' --output text)"

export ENV_FILE
export NA="${NEXTAUTH_URL}" PU="${APP_PUBLIC_URL}" \
  WAT="${WHATSAPP_ACCESS_TOKEN}" WPH="${WHATSAPP_PHONE_NUMBER_ID}" \
  WVF="${WHATSAPP_VERIFY_TOKEN}" WAV="${WHATSAPP_API_VERSION}" \
  MAS="${META_APP_SECRET}" SFE="${SES_FROM_EMAIL}"

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
wa_ver = os.environ.get("WAV", "").strip() or "v21.0"
updates = {
    "NEXTAUTH_URL": os.environ.get("NA", ""),
    "NEXT_PUBLIC_APP_URL": os.environ.get("PU", ""),
    "WHATSAPP_ACCESS_TOKEN": os.environ.get("WAT", ""),
    "WHATSAPP_PHONE_NUMBER_ID": os.environ.get("WPH", ""),
    "WHATSAPP_VERIFY_TOKEN": os.environ.get("WVF", ""),
    "WHATSAPP_API_VERSION": wa_ver,
    "META_APP_SECRET": os.environ.get("MAS", ""),
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
