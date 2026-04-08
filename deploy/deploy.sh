#!/bin/bash
# =============================================================================
# Hotel Udhayam International - Production Deployment (Apache)
# API Port: 3006
# Run: sudo bash deploy/deploy.sh
# =============================================================================

set -e

APP_DIR="/var/www/hms"

echo "========================================="
echo "  Hotel Udhayam International - Deploy"
echo "========================================="

# --- 1. Pull latest code ---
echo "[1/6] Pulling latest code..."
cd $APP_DIR
git pull origin main

# --- 2. Install dependencies ---
echo "[2/6] Installing dependencies..."
npm install --workspaces

# --- 3. Build frontend apps ---
echo "[3/6] Building website..."
cd $APP_DIR/website
npx vite build

echo "       Building PMS admin..."
cd $APP_DIR/client
npx vite build

# --- 4. Server .env ---
echo "[4/6] Configuring server..."
cd $APP_DIR/server
if [ ! -f .env ]; then
    cp .env.production .env
    echo "  ⚠ EDIT /var/www/hms/server/.env with your actual DB password & JWT secrets!"
fi

# --- 5. Apache setup ---
echo "[5/6] Configuring Apache..."
a2enmod proxy proxy_http rewrite ssl headers deflate 2>/dev/null || true
cp $APP_DIR/deploy/apache.conf /etc/apache2/sites-available/hoteludhayam.conf
a2ensite hoteludhayam 2>/dev/null || true
apache2ctl configtest && systemctl reload apache2

# --- 6. PM2 ---
echo "[6/6] Starting API server..."
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
echo "  SSL: sudo certbot --apache -d hoteludhayam.international -d www.hoteludhayam.international -d app.hoteludhayam.international -d api.hoteludhayam.international"
echo ""
