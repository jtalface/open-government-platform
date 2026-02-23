#!/bin/bash

# Open Government Platform - EC2 Setup Script
# Supports: Amazon Linux 2023 (recommended), Amazon Linux 2, Ubuntu 22.04
# Run this script on a fresh EC2 instance

set -e  # Exit on error

echo "🚀 Starting Open Government Platform deployment setup..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Detect OS
detect_os() {
    if [ -f /etc/os-release ]; then
        . /etc/os-release
        OS_ID="${ID}"
        OS_VERSION="${VERSION_ID:-}"
    else
        echo -e "${RED}❌ Cannot detect OS. /etc/os-release not found.${NC}"
        exit 1
    fi
}

# Install packages based on OS
install_amazon_linux() {
    echo -e "${YELLOW}📦 Detected Amazon Linux. Using dnf package manager...${NC}"
    
    # Update system
    echo -e "${YELLOW}📦 Updating system packages...${NC}"
    sudo dnf update -y

    # Install Node.js 20.x via NodeSource (works for Amazon Linux 2 and 2023)
    echo -e "${YELLOW}📦 Installing Node.js 20.x...${NC}"
    curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
    sudo dnf install -y nodejs

    # Install PostgreSQL client (try postgresql15 first, fallback to postgresql)
    echo -e "${YELLOW}📦 Installing PostgreSQL client...${NC}"
    sudo dnf install -y postgresql15 2>/dev/null || sudo dnf install -y postgresql

    # Install Nginx
    echo -e "${YELLOW}📦 Installing Nginx...${NC}"
    sudo dnf install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx

    # Install Git
    echo -e "${YELLOW}📦 Installing Git...${NC}"
    sudo dnf install -y git

    # Install Certbot for SSL
    echo -e "${YELLOW}📦 Installing Certbot...${NC}"
    sudo dnf install -y certbot python3-certbot-nginx || {
        echo -e "${YELLOW}⚠️  Certbot not in default repos. Install manually: https://certbot.eff.org/instructions${NC}"
    }

    # Install useful tools
    echo -e "${YELLOW}📦 Installing additional tools...${NC}"
    sudo dnf install -y htop curl wget unzip gcc-c++ make

    # Firewall: Amazon Linux uses firewalld (optional - AWS Security Groups often suffice)
    echo -e "${YELLOW}🔥 Firewall: AWS Security Groups handle most traffic. Skipping local firewall.${NC}"
    echo -e "${YELLOW}   Ensure your EC2 Security Group allows SSH (22), HTTP (80), HTTPS (443).${NC}"
}

install_ubuntu_debian() {
    echo -e "${YELLOW}📦 Detected Ubuntu/Debian. Using apt package manager...${NC}"
    
    # Update system
    echo -e "${YELLOW}📦 Updating system packages...${NC}"
    sudo apt update && sudo apt upgrade -y

    # Install Node.js 20.x
    echo -e "${YELLOW}📦 Installing Node.js 20.x...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt install -y nodejs

    # Install PostgreSQL client
    echo -e "${YELLOW}📦 Installing PostgreSQL client...${NC}"
    sudo apt install -y postgresql-client

    # Install Nginx
    echo -e "${YELLOW}📦 Installing Nginx...${NC}"
    sudo apt install -y nginx
    sudo systemctl enable nginx
    sudo systemctl start nginx

    # Install Git
    echo -e "${YELLOW}📦 Installing Git...${NC}"
    sudo apt install -y git

    # Install Certbot for SSL
    echo -e "${YELLOW}📦 Installing Certbot...${NC}"
    sudo apt install -y certbot python3-certbot-nginx

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
}

# Main installation
detect_os

case "$OS_ID" in
    amzn|amazon)
        install_amazon_linux
        ;;
    ubuntu|debian)
        install_ubuntu_debian
        ;;
    *)
        echo -e "${RED}❌ Unsupported OS: $OS_ID${NC}"
        echo "This script supports: Amazon Linux 2023, Amazon Linux 2, Ubuntu 22.04"
        echo "For other systems, follow the manual steps in DEPLOYMENT.md"
        exit 1
        ;;
esac

# Common installations (same for all OS)
echo ""
echo -e "${YELLOW}📦 Installing pnpm...${NC}"
sudo npm install -g pnpm
PNPM_VERSION=$(pnpm --version)
echo -e "${GREEN}✅ pnpm installed: $PNPM_VERSION${NC}"

echo -e "${YELLOW}📦 Installing PM2...${NC}"
sudo npm install -g pm2
echo -e "${GREEN}✅ PM2 installed${NC}"

# Install AWS CLI (optional, for S3 backups)
echo -e "${YELLOW}📦 Installing AWS CLI...${NC}"
if ! command -v aws &> /dev/null; then
    curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
    unzip -o awscliv2.zip
    sudo ./aws/install
    rm -rf aws awscliv2.zip
    echo -e "${GREEN}✅ AWS CLI installed${NC}"
else
    echo -e "${GREEN}✅ AWS CLI already installed${NC}"
fi

# Verify Node.js installation
NODE_VERSION=$(node --version)
echo -e "${GREEN}✅ Node.js installed: $NODE_VERSION${NC}"

# Setup PM2 startup
echo -e "${YELLOW}⚙️  Configuring PM2 startup...${NC}"
pm2 startup systemd | grep "sudo" | bash || true
echo -e "${GREEN}✅ PM2 startup configured${NC}"

# Determine home directory (ec2-user on Amazon Linux, ubuntu on Ubuntu)
APP_USER="${SUDO_USER:-$USER}"
APP_HOME="${HOME}"
echo ""
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Detected OS: $OS_ID"
echo "Application user: $APP_USER"
echo "Home directory: $APP_HOME"
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
