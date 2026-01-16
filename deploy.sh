#!/bin/bash

# Deployment script for kirakira chat server
# Usage: ./deploy.sh

VPS_HOST="root@76.13.24.155"
VPS_PATH="/root/kirachat"
LOCAL_PATH="."

echo "🚀 Deploying chat server to VPS..."
echo "Host: $VPS_HOST"
echo "Path: $VPS_PATH"

# Create directory on VPS
echo "📁 Creating directory on VPS..."
ssh $VPS_HOST "mkdir -p $VPS_PATH"

# Copy files to VPS
echo "📤 Copying files to VPS..."
scp server.js $VPS_HOST:$VPS_PATH/
scp package.json $VPS_HOST:$VPS_PATH/
scp -r chat $VPS_HOST:$VPS_PATH/

# Install dependencies and start server
echo "📦 Installing dependencies..."
ssh $VPS_HOST "cd $VPS_PATH && npm install"

echo "✅ Deployment complete!"
echo ""
echo "To start the server, run:"
echo "  ssh $VPS_HOST 'cd $VPS_PATH && npm start'"
echo ""
echo "Or use PM2 for production:"
echo "  ssh $VPS_HOST 'cd $VPS_PATH && pm2 start server.js --name kirachat && pm2 save'"

