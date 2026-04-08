#!/bin/bash
# =============================================================================
# Hotel Udhayam International - Production Deployment Script
#
# Domain: hoteludhayam.international
# API Port: 3006
#
# Run: sudo bash deploy/deploy.sh
# =============================================================================

set -e

APP_DIR="/var/www/hotel"

echo "========================================="
echo "  Hotel Udhayam International - Deploy"
echo "========================================="

# --- 1. Pull latest code ---
echo "[1/5] Pulling latest code..."
cd $APP_DIR
git pull origin main

# --- 2. Install dependencies ---
echo "[2/5] Installing dependencies..."
npm install --workspaces

# --- 3. Build frontend apps ---
echo "[3/5] Building website..."
cd $APP_DIR/website
npx vite build

echo "       Building PMS admin..."
cd $APP_DIR/client
npx vite build

# --- 4. Setup server .env ---
echo "[4/5] Configuring server..."
cd $APP_DIR/server
if [ ! -f .env ]; then
    cp .env.production .env
    echo "  ⚠ EDIT /var/www/hotel/server/.env with your actual DB password & JWT secrets!"
fi

# --- 5. Setup MySQL (if first time) ---
echo "[5/5] Setting up MySQL..."
mysql -u root <<'EOF' 2>/dev/null || echo "  MySQL setup skipped (may already exist)"
CREATE DATABASE IF NOT EXISTS hotel_master;
CREATE DATABASE IF NOT EXISTS hotel_udhayam;
CREATE USER IF NOT EXISTS 'hotel_admin'@'localhost' IDENTIFIED BY 'CHANGE_ME_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON hotel_master.* TO 'hotel_admin'@'localhost';
GRANT ALL PRIVILEGES ON hotel_udhayam.* TO 'hotel_admin'@'localhost';
FLUSH PRIVILEGES;
EOF

# --- Setup Nginx ---
echo ""
echo "Setting up Nginx..."
cp $APP_DIR/deploy/nginx.conf /etc/nginx/sites-available/hoteludhayam
ln -sf /etc/nginx/sites-available/hoteludhayam /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx

# --- Start/Restart API with PM2 ---
echo ""
echo "Starting API server with PM2..."
cd $APP_DIR
pm2 delete hotel-api 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save

echo ""
echo "========================================="
echo "  Deployment Complete!"
echo "========================================="
echo ""
echo "  Website:  https://hoteludhayam.international"
echo "  PMS App:  https://app.hoteludhayam.international"
echo "  API:      https://api.hoteludhayam.international (port 3006)"
echo ""
echo "  Next steps:"
echo "  1. Edit /var/www/hotel/server/.env (set real DB_PASS & JWT secrets)"
echo "  2. pm2 restart hotel-api"
echo "  3. SSL: sudo certbot --nginx -d hoteludhayam.international -d www.hoteludhayam.international -d app.hoteludhayam.international -d api.hoteludhayam.international"
echo "  4. Seed DB: cd /var/www/hotel && npm run seed"
echo ""
echo "  DNS Records (point all to VPS IP):"
echo "    A  @    → YOUR_VPS_IP"
echo "    A  www  → YOUR_VPS_IP"
echo "    A  app  → YOUR_VPS_IP"
echo "    A  api  → YOUR_VPS_IP"
echo ""
