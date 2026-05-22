#!/bin/bash
# =====================================================
# StayOS - Quick Redeploy (run on VPS)
# Usage: bash /home/apps/StayOS/deploy/redeploy.sh
# =====================================================

set -e

cd /home/apps/StayOS

echo "📥 Pulling latest code..."
git pull origin main

echo "📦 Installing dependencies..."
npm ci

echo "🏗️  Building..."
NODE_ENV=production npm run build

echo "🔄 Restarting PM2..."
pm2 restart stayos
pm2 save

echo "✅ Redeploy complete!"
pm2 status
