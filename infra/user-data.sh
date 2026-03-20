#!/bin/bash
set -euxo pipefail

# Logs
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

# Ensure PM2 has a valid home in non-interactive cloud-init sessions
export HOME=/root
export PM2_HOME=/root/.pm2

PROJECT_NAME="${project_name}"
REPO_URL="${repo_url}"
APP_DIR="/opt/$${PROJECT_NAME}/app"
AWS_REGION="$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | sed -n 's/.*"region"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p')"
PARAM_BASE="/ogp/prod"

# OS deps (Ubuntu)
apt-get update -y
apt-get install -y curl git unzip build-essential nginx jq awscli

# Node 20 + pnpm + pm2
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
corepack enable
corepack prepare pnpm@8.15.0 --activate
npm install -g pm2

# App code
mkdir -p "/opt/$${PROJECT_NAME}"
if [ ! -d "$${APP_DIR}" ]; then
  git clone "$${REPO_URL}" "$${APP_DIR}"
else
  cd "$${APP_DIR}"
  git fetch --all
  git reset --hard origin/main
fi
cd "$${APP_DIR}"

# Read SSM params
DB_PASSWORD="$(aws ssm get-parameter --name "$${PARAM_BASE}/db/password" --with-decryption --region "$${AWS_REGION}" --query 'Parameter.Value' --output text)"
NEXTAUTH_SECRET="$(aws ssm get-parameter --name "$${PARAM_BASE}/nextauth/secret" --with-decryption --region "$${AWS_REGION}" --query 'Parameter.Value' --output text)"
NEXTAUTH_URL="$(aws ssm get-parameter --name "$${PARAM_BASE}/nextauth/url" --region "$${AWS_REGION}" --query 'Parameter.Value' --output text)"
APP_PUBLIC_URL="$(aws ssm get-parameter --name "$${PARAM_BASE}/app/public_url" --region "$${AWS_REGION}" --query 'Parameter.Value' --output text)"
S3_BUCKET_NAME="$(aws ssm get-parameter --name "$${PARAM_BASE}/s3/bucket_name" --region "$${AWS_REGION}" --query 'Parameter.Value' --output text)"
SES_FROM_EMAIL="$(aws ssm get-parameter --name "$${PARAM_BASE}/ses/from_email" --region "$${AWS_REGION}" --query 'Parameter.Value' --output text)"
TWILIO_ACCOUNT_SID="$(aws ssm get-parameter --name "$${PARAM_BASE}/twilio/account_sid" --region "$${AWS_REGION}" --query 'Parameter.Value' --output text)"
TWILIO_AUTH_TOKEN="$(aws ssm get-parameter --name "$${PARAM_BASE}/twilio/auth_token" --with-decryption --region "$${AWS_REGION}" --query 'Parameter.Value' --output text)"
TWILIO_WHATSAPP_FROM="$(aws ssm get-parameter --name "$${PARAM_BASE}/twilio/whatsapp_from" --region "$${AWS_REGION}" --query 'Parameter.Value' --output text)"
MAPBOX_TOKEN="$(aws ssm get-parameter --name "$${PARAM_BASE}/mapbox/token" --region "$${AWS_REGION}" --query 'Parameter.Value' --output text 2>/dev/null || true)"

RDS_ENDPOINT="${rds_endpoint}"

# Env files expected by this repo
cat > "$${APP_DIR}/apps/web/.env.production" <<EOF
DATABASE_URL="postgresql://ogp_admin:$${DB_PASSWORD}@$${RDS_ENDPOINT}:5432/ogp_production?schema=public"
NEXTAUTH_URL="$${NEXTAUTH_URL}"
NEXTAUTH_SECRET="$${NEXTAUTH_SECRET}"
NEXT_PUBLIC_MAPBOX_TOKEN="$${MAPBOX_TOKEN}"
AWS_REGION="$${AWS_REGION}"
S3_BUCKET_NAME="$${S3_BUCKET_NAME}"
S3_UPLOAD_PREFIX="incidents"
SES_FROM_EMAIL="$${SES_FROM_EMAIL}"
TWILIO_ACCOUNT_SID="$${TWILIO_ACCOUNT_SID}"
TWILIO_AUTH_TOKEN="$${TWILIO_AUTH_TOKEN}"
TWILIO_WHATSAPP_FROM="$${TWILIO_WHATSAPP_FROM}"
NODE_ENV="production"
PORT=4000
NEXT_PUBLIC_APP_URL="$${APP_PUBLIC_URL}"
EOF

mkdir -p "$${APP_DIR}/packages/database"
cat > "$${APP_DIR}/packages/database/.env" <<EOF
DATABASE_URL="postgresql://ogp_admin:$${DB_PASSWORD}@$${RDS_ENDPOINT}:5432/ogp_production?schema=public"
EOF

# Build + migrate + run
cd "$${APP_DIR}"
pnpm install --frozen-lockfile=false
pnpm db:generate
pnpm build
pnpm db:migrate || true

# Start app with explicit env so ALB health checks can pass on port 4000
export NODE_ENV=production
export PORT=4000
pm2 delete ogp-web || true
pm2 start ecosystem.config.js --only ogp-web --update-env
pm2 save
pm2 startup systemd -u root --hp /root || true

# Nginx reverse proxy to app:4000
cat > /etc/nginx/sites-available/ogp <<'EOF'
server {
  listen 80;
  server_name _;
  location / {
    proxy_pass http://127.0.0.1:4000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
EOF

ln -sf /etc/nginx/sites-available/ogp /etc/nginx/sites-enabled/ogp
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable nginx
systemctl restart nginx
