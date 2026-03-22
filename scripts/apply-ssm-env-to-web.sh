#!/usr/bin/env bash
# Merge selected SSM parameters into apps/web/.env.production (production EC2).
# Used after SSM changes (e.g. canonical URL) so the next build picks up NEXTAUTH_URL / NEXT_PUBLIC_APP_URL.
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

export NA="${NEXTAUTH_URL}" PU="${APP_PUBLIC_URL}"
perl -i -pe '
  BEGIN { $na = $ENV{NA}; $pu = $ENV{PU} }
  s/^NEXTAUTH_URL=.*/NEXTAUTH_URL="$na"/;
  s/^NEXT_PUBLIC_APP_URL=.*/NEXT_PUBLIC_APP_URL="$pu"/;
' "${ENV_FILE}"

echo "Updated NEXTAUTH_URL and NEXT_PUBLIC_APP_URL in ${ENV_FILE} from SSM (${PARAM_BASE})."
