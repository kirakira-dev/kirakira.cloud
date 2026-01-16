#!/usr/bin/env node

/**
 * Message Sync Script
 * Fetches messages from VPS and updates the local messages.json file
 * 
 * Usage:
 *   node sync-messages.js <token>
 * 
 * Example:
 *   node sync-messages.js abc123def456...
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const VPS_URL = 'http://76.13.24.155/api/messages';
const LOCAL_FILE = path.join(__dirname, 'chat', 'messages.json');

// Get token from command line argument
const token = process.argv[2];

if (!token) {
    console.error('Error: Token is required');
    console.log('Usage: node sync-messages.js <token>');
    console.log('\nYou can get your token from localStorage in the browser console:');
    console.log('  localStorage.getItem("chatToken")');
    process.exit(1);
}

console.log('Fetching messages from VPS...');
console.log('URL:', VPS_URL);
console.log('Token:', token.substring(0, 20) + '...');

// Parse URL
const url = new URL(VPS_URL);
const client = url.protocol === 'https:' ? https : http;

const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'GET',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    }
};

const req = client.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        if (res.statusCode === 200) {
            try {
                const messages = JSON.parse(data);
                
                // Write to local file
                fs.writeFileSync(LOCAL_FILE, JSON.stringify(messages, null, 2), 'utf8');
                
                console.log(`✓ Successfully synced ${messages.length} messages to ${LOCAL_FILE}`);
                console.log('\nLatest messages:');
                messages.slice(-3).forEach(msg => {
                    const time = new Date(msg.timestamp).toLocaleString();
                    console.log(`  [${time}] ${msg.username}: ${msg.message}`);
                });
            } catch (error) {
                console.error('Error parsing response:', error.message);
                console.error('Response:', data);
                process.exit(1);
            }
        } else {
            console.error(`Error: HTTP ${res.statusCode}`);
            console.error('Response:', data);
            process.exit(1);
        }
    });
});

req.on('error', (error) => {
    console.error('Request error:', error.message);
    process.exit(1);
});

req.end();
