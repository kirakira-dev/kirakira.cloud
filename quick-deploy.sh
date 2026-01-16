#!/bin/bash

# Quick deployment script - copies files and sets up server
VPS_HOST="root@76.13.24.155"
VPS_PATH="/root/kirachat"

echo "🚀 Deploying to $VPS_HOST:$VPS_PATH"

# Create directory
ssh $VPS_HOST "mkdir -p $VPS_PATH"

# Copy files
echo "📤 Copying files..."
scp server.js server-config.js package.json $VPS_HOST:$VPS_PATH/ 2>/dev/null || {
    echo "❌ Failed to copy files. Make sure you have SSH access configured."
    exit 1
}
scp -r chat $VPS_HOST:$VPS_PATH/ 2>/dev/null || {
    echo "❌ Failed to copy chat directory."
    exit 1
}

# Install and start
echo "📦 Installing dependencies and starting server..."
ssh $VPS_HOST "cd $VPS_PATH && \
    npm install && \
    (pm2 delete kirachat 2>/dev/null || true) && \
    pm2 start server.js --name kirachat && \
    pm2 save && \
    echo '✅ Server started!'"

echo ""
echo "✅ Deployment complete!"
echo "Server should be running on http://76.13.24.155:3000"
echo ""
echo "To check status: ssh $VPS_HOST 'pm2 status'"
echo "To view logs: ssh $VPS_HOST 'pm2 logs kirachat'"

