#!/bin/bash
# =====================================================
# StayOS - VPS First-Time Setup Script
# VPS: 103.97.127.43
# Run: bash setup-vps.sh
# =====================================================

set -e  # Exit on error

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║      StayOS VPS Setup - 103.97.127.43    ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# ── 1. System Update ──────────────────────────────
echo "📦 Updating system..."
apt-get update -y && apt-get upgrade -y

# ── 2. Install Node.js 20 ─────────────────────────
echo "🟢 Installing Node.js 20..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y nodejs
node --version
npm --version

# ── 3. Install PM2 ───────────────────────────────
echo "⚙️  Installing PM2..."
npm install -g pm2
pm2 --version

# ── 4. Install Nginx ─────────────────────────────
echo "🌐 Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx
systemctl start nginx

# ── 5. Install Certbot ───────────────────────────
echo "🔒 Installing Certbot..."
apt-get install -y certbot python3-certbot-nginx

# ── 6. Create app directories ────────────────────
echo "📁 Creating directories..."
mkdir -p /home/apps
mkdir -p /var/log/pm2

# ── 7. Clone StayOS ──────────────────────────────
echo "📥 Cloning StayOS..."
cd /home/apps

if [ -d "StayOS" ]; then
    echo "   Repo exists, pulling latest..."
    cd StayOS
    git pull origin main
else
    git clone https://github.com/dunghoangtien0504/StayOS.git
    cd StayOS
fi

# ── 8. Install dependencies ──────────────────────
echo "📦 Installing npm dependencies..."
npm ci

# ── 9. Create .env.production ────────────────────
echo ""
echo "⚠️  ACTION REQUIRED: Create /home/apps/StayOS/.env.production"
echo ""
echo "Run this command and fill in your values:"
echo ""
echo "  nano /home/apps/StayOS/.env.production"
echo ""
echo "Template:"
cat << 'ENVTEMPLATE'
# ===== StayOS Production Environment =====

# App
NODE_ENV=production
PORT=3002
NEXT_PUBLIC_APP_URL=https://stayos.hoangtiendung.com

# Pancake API (get from app.pancake.vn > Settings > API)
PANCAKE_API_KEY=
PANCAKE_API_SECRET=
PANCAKE_API_BASE=https://api.pancake.vn

# Add more when needed
# DATABASE_URL=
ENVTEMPLATE

echo ""
echo "Press ENTER after creating .env.production to continue..."
read

# ── 10. Build ────────────────────────────────────
echo "🏗️  Building Next.js..."
NODE_ENV=production npm run build

# ── 11. Setup PM2 ────────────────────────────────
echo "🚀 Starting with PM2..."
pm2 start ecosystem.config.js
pm2 save
pm2 startup systemd -u root --hp /root | tail -1 | bash

# ── 12. Setup Nginx ──────────────────────────────
echo "🌐 Configuring Nginx..."
cp /home/apps/StayOS/deploy/nginx-temp.conf /etc/nginx/sites-available/stayos

# Temp HTTP-only config (before SSL)
cat > /etc/nginx/sites-available/stayos-temp << 'NGINXTEMP'
server {
    listen 80;
    server_name stayos.hoangtiendung.com;

    location / {
        proxy_pass http://127.0.0.1:3002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
NGINXTEMP

ln -sf /etc/nginx/sites-available/stayos-temp /etc/nginx/sites-enabled/stayos
nginx -t && systemctl reload nginx

# ── 13. SSL with Let's Encrypt ───────────────────
echo "🔒 Getting SSL certificate..."
certbot --nginx -d stayos.hoangtiendung.com --non-interactive --agree-tos -m admin@hoangtiendung.com

# Apply full Nginx config with SSL
cp /home/apps/StayOS/deploy/nginx.conf /etc/nginx/sites-available/stayos
nginx -t && systemctl reload nginx

# ── Done ─────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════╗"
echo "║           ✅ Setup Complete!              ║"
echo "╚══════════════════════════════════════════╝"
echo ""
echo "🌐 StayOS: https://stayos.hoangtiendung.com"
echo ""
pm2 status
