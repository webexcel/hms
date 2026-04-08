#!/bin/bash
# =============================================================================
# Hotel Udhayam International - Production Deployment Script
#
# Domain: hoteludhayam.international
# Subdomains:
#   - hoteludhayam.international       → Public website
#   - app.hoteludhayam.international   → PMS admin panel
#   - api.hoteludhayam.international   → Express API server
#
# Run this on your VPS as root or with sudo.
# =============================================================================

set -e

APP_DIR="/var/www/hotel"
REPO_URL="YOUR_GIT_REPO_URL"  # Change this to your repo
BRANCH="main"

echo "========================================="
echo "  Hotel Udhayam International - Deploy"
echo "========================================="

# --- 1. System packages ---
echo "[1/8] Installing system packages..."
apt update -y
apt install -y curl git nginx mysql-server certbot python3-certbot-nginx

# Install Node.js 20
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo "  Node: $(node -v) | npm: $(npm -v) | PM2: $(pm2 -v)"

# --- 2. Create directories ---
echo "[2/8] Setting up directories..."
mkdir -p $APP_DIR
mkdir -p /var/log/hotel

# --- 3. Clone/pull code ---
echo "[3/8] Pulling latest code..."
if [ -d "$APP_DIR/.git" ]; then
    cd $APP_DIR
    git pull origin $BRANCH
else
    git clone $REPO_URL $APP_DIR
    cd $APP_DIR
fi

# --- 4. Install dependencies ---
echo "[4/8] Installing dependencies..."
npm install --workspaces --production=false

# --- 5. Build frontend apps ---
echo "[5/8] Building website..."
cd $APP_DIR/website
cp .env.production .env 2>/dev/null || true
npx vite build

echo "       Building PMS admin..."
cd $APP_DIR/client
cp .env.production .env 2>/dev/null || true
npx vite build

# --- 6. Setup server .env ---
echo "[6/8] Configuring server..."
cd $APP_DIR/server
if [ ! -f .env ]; then
    cp .env.production .env
    echo "  ⚠ IMPORTANT: Edit /var/www/hotel/server/.env with your actual secrets!"
    echo "    - DB_PASS, JWT_SECRET, JWT_REFRESH_SECRET must be changed"
fi

# --- 7. Setup MySQL ---
echo "[7/8] Setting up MySQL..."
echo "  Creating database and user (if not exists)..."
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS hotel_master;
CREATE DATABASE IF NOT EXISTS hotel_udhayam;
CREATE USER IF NOT EXISTS 'hotel_admin'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON hotel_master.* TO 'hotel_admin'@'localhost';
GRANT ALL PRIVILEGES ON hotel_udhayam.* TO 'hotel_admin'@'localhost';
FLUSH PRIVILEGES;
EOF
echo "  ⚠ Change the MySQL password in both MySQL and server/.env!"

# --- 8. Setup Nginx ---
echo "[8/8] Configuring Nginx..."
cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/hoteludhayam
ln -sf /etc/nginx/sites-available/hoteludhayam /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test nginx config
nginx -t

# Reload nginx
systemctl reload nginx

# --- Start/Restart API server ---
echo ""
echo "Starting API server with PM2..."
cd $APP_DIR
pm2 delete hotel-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "  Website:  http://hoteludhayam.international"
echo "  PMS App:  http://app.hoteludhayam.international"
echo "  API:      http://api.hoteludhayam.international"
echo ""
echo "  Next steps:"
echo "  1. Edit /var/www/hotel/server/.env (set real DB password & JWT secrets)"
echo "  2. Run: pm2 restart hotel-api"
echo "  3. Setup SSL with: certbot --nginx -d hoteludhayam.international -d www.hoteludhayam.international -d app.hoteludhayam.international -d api.hoteludhayam.international"
echo "  4. Seed the database: cd /var/www/hotel && npm run seed"
echo ""
echo "  DNS Records needed (point all to your VPS IP):"
echo "    A  @                           → YOUR_VPS_IP"
echo "    A  www                         → YOUR_VPS_IP"
echo "    A  app                         → YOUR_VPS_IP"
echo "    A  api                         → YOUR_VPS_IP"
echo ""
