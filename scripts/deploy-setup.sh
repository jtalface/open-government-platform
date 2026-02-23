#!/bin/bash

# Open Government Platform - EC2 Setup Script
# Run this script on a fresh Ubuntu 22.04 EC2 instance

set -e  # Exit on error

echo "🚀 Starting Open Government Platform deployment setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Update system
echo -e "${YELLOW}📦 Updating system packages...${NC}"
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
echo -e "${YELLOW}📦 Installing Node.js 20.x...${NC}"
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify Node.js installation
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"

# Install pnpm
echo -e "${YELLOW}📦 Installing pnpm...${NC}"
sudo npm install -g pnpm
PNPM_VERSION=$(pnpm --version)
echo -e "${GREEN}✅ pnpm installed: $PNPM_VERSION${NC}"

# Install PostgreSQL client
echo -e "${YELLOW}📦 Installing PostgreSQL client...${NC}"
sudo apt install -y postgresql-client

# Install Nginx
echo -e "${YELLOW}📦 Installing Nginx...${NC}"
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
echo -e "${GREEN}✅ Nginx installed and started${NC}"

# Install PM2
echo -e "${YELLOW}📦 Installing PM2...${NC}"
sudo npm install -g pm2
echo -e "${GREEN}✅ PM2 installed${NC}"

# Install Git
echo -e "${YELLOW}📦 Installing Git...${NC}"
sudo apt install -y git
echo -e "${GREEN}✅ Git installed${NC}"

# Install Certbot for SSL
echo -e "${YELLOW}📦 Installing Certbot...${NC}"
sudo apt install -y certbot python3-certbot-nginx
echo -e "${GREEN}✅ Certbot installed${NC}"

# Install AWS CLI (optional, for S3 backups)
echo -e "${YELLOW}📦 Installing AWS CLI...${NC}"
if ! command -v aws &> /dev/null; then
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
    echo -e "${GREEN}✅ AWS CLI installed${NC}"
else
    echo -e "${GREEN}✅ AWS CLI already installed${NC}"
fi

# Install useful tools
echo -e "${YELLOW}📦 Installing additional tools...${NC}"
sudo apt install -y htop curl wget unzip build-essential

# Configure UFW Firewall
echo -e "${YELLOW}🔥 Configuring firewall...${NC}"
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
echo -e "${YELLOW}⚠️  Firewall will be enabled. Make sure SSH access is configured!${NC}"
read -p "Enable firewall now? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    sudo ufw --force enable
    echo -e "${GREEN}✅ Firewall enabled${NC}"
else
    echo -e "${YELLOW}⚠️  Firewall not enabled. Enable manually with: sudo ufw enable${NC}"
fi

# Setup PM2 startup
echo -e "${YELLOW}⚙️  Configuring PM2 startup...${NC}"
pm2 startup systemd | grep "sudo" | bash || true
echo -e "${GREEN}✅ PM2 startup configured${NC}"

echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Clone your repository: git clone https://github.com/jtalface/open-government-platform.git"
echo "2. Install dependencies: cd open-government-platform && pnpm install"
echo "3. Build application: pnpm build"
echo "4. Configure environment variables in apps/web/.env.production"
echo "5. Run database migrations: pnpm db:migrate"
echo "6. Start application with PM2: pm2 start ecosystem.config.js"
echo "7. Configure Nginx (see DEPLOYMENT.md)"
echo "8. Set up SSL: sudo certbot --nginx -d yourdomain.com"
echo ""
echo "For detailed instructions, see DEPLOYMENT.md"
