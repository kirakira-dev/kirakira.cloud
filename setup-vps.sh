#!/bin/bash

# VPS Setup Script - Run this ON the VPS
# Usage: ssh root@76.13.24.155 'bash -s' < setup-vps.sh

VPS_PATH="/root/kirachat"
PORT=3000

echo "🔧 Setting up kirakira chat server on VPS..."

# Install Node.js if not installed
if ! command -v node &> /dev/null; then
    echo "📦 Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Navigate to project directory
cd $VPS_PATH

# Install dependencies
echo "📦 Installing npm dependencies..."
npm install

# Create systemd service for PM2
echo "⚙️  Configuring PM2..."
pm2 start server.js --name kirachat
pm2 save
pm2 startup systemd -u root --hp /root

# Configure firewall
echo "🔥 Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow $PORT/tcp
    echo "✅ Firewall rule added for port $PORT"
elif command -v firewall-cmd &> /dev/null; then
    firewall-cmd --add-port=$PORT/tcp --permanent
    firewall-cmd --reload
    echo "✅ Firewall rule added for port $PORT"
else
    echo "⚠️  Please manually open port $PORT in your firewall"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "Server should be running on port $PORT"
echo "Check status with: pm2 status"
echo "View logs with: pm2 logs kirachat"
echo "Restart with: pm2 restart kirachat"

