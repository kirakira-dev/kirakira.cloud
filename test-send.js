#!/usr/bin/env node

/**
 * Test Message Send Script
 * Tests sending a message to the VPS with a token
 * 
 * Usage:
 *   node test-send.js <token> <message>
 * 
 * Example:
 *   node test-send.js abc123def456... "Hello from test script!"
 */

const http = require('http');
const https = require('https');

const VPS_URL = 'http://76.13.24.155/api/messages';

// Get token and message from command line arguments
const token = process.argv[2];
const message = process.argv.slice(3).join(' ');

if (!token || !message) {
    console.error('Error: Token and message are required');
    console.log('Usage: node test-send.js <token> <message>');
    console.log('\nExample:');
    console.log('  node test-send.js abc123... "Hello world!"');
    console.log('\nGet your token from browser localStorage:');
    console.log('  localStorage.getItem("chatToken")');
    process.exit(1);
}

console.log('Testing message send to VPS...');
console.log('URL:', VPS_URL);
console.log('Token:', token.substring(0, 20) + '...');
console.log('Message:', message);
console.log();

// Parse URL
const url = new URL(VPS_URL);
const client = url.protocol === 'https:' ? https : http;

const payload = JSON.stringify({ message });

const options = {
    hostname: url.hostname,
    port: url.port,
    path: url.pathname,
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
    }
};

const req = client.request(options, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(`Response Status: ${res.statusCode}`);
        console.log('Response Body:', data);
        
        if (res.statusCode === 200) {
            console.log('\n✓ Message sent successfully!');
            try {
                const response = JSON.parse(data);
                if (response.data) {
                    console.log('\nMessage details:');
                    console.log('  ID:', response.data.id);
                    console.log('  Username:', response.data.username);
                    console.log('  Message:', response.data.message);
                    console.log('  Timestamp:', response.data.timestamp);
                }
            } catch (e) {
                // Response might not be JSON
            }
        } else {
            console.log('\n✗ Failed to send message');
        }
    });
});

req.on('error', (error) => {
    console.error('Request error:', error.message);
    process.exit(1);
});

req.write(payload);
req.end();
