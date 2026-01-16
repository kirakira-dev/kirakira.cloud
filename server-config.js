// Server configuration
// You can customize these settings

module.exports = {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0', // Listen on all interfaces
    maxMessages: 1000, // Maximum messages to keep in history
    messagePollInterval: 2000, // Frontend polling interval in ms
    tokenLength: 64, // Token length in bytes (will be hex encoded, so 64 bytes = 128 hex chars)
};

