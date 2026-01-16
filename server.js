const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const cors = require('cors');
const config = require('./server-config');

const app = express();
const PORT = config.port;
const HOST = config.host;

// Middleware
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false
}));

// Handle preflight requests
app.options('*', cors());

app.use(express.json());

// File paths
const USERS_FILE = path.join(__dirname, 'users.json');
const MESSAGES_FILE = path.join(__dirname, 'messages.json');

// Initialize files if they don't exist
async function initializeFiles() {
    try {
        await fs.access(USERS_FILE);
    } catch {
        await fs.writeFile(USERS_FILE, JSON.stringify([]), 'utf8');
    }
    
    try {
        await fs.access(MESSAGES_FILE);
    } catch {
        await fs.writeFile(MESSAGES_FILE, JSON.stringify([]), 'utf8');
    }
}

// Read users from file
async function readUsers() {
    try {
        const data = await fs.readFile(USERS_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading users:', error);
        return [];
    }
}

// Write users to file
async function writeUsers(users) {
    try {
        await fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing users:', error);
        throw error;
    }
}

// Read messages from file
async function readMessages() {
    try {
        const data = await fs.readFile(MESSAGES_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading messages:', error);
        return [];
    }
}

// Write messages to file
async function writeMessages(messages) {
    try {
        await fs.writeFile(MESSAGES_FILE, JSON.stringify(messages, null, 2), 'utf8');
    } catch (error) {
        console.error('Error writing messages:', error);
        throw error;
    }
}

// Hash password
function hashPassword(password) {
    return crypto.createHash('sha256').update(password).digest('hex');
}

// Generate token
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

// Verify token and get username (reads from users.json file)
async function verifyToken(token) {
    try {
        const users = await readUsers();
        const user = users.find(u => u.token === token);
        return user ? user.username : null;
    } catch (error) {
        console.error('Error verifying token:', error);
        return null;
    }
}

// Save users endpoint (for client to save user data)
app.post('/api/save-users', async (req, res) => {
    try {
        const users = req.body;
        await writeUsers(users);
        res.json({ message: 'Users saved successfully' });
    } catch (error) {
        console.error('Save users error:', error);
        res.status(500).json({ error: 'Failed to save users' });
    }
});

// Serve users.json file (for client to read)
app.get('/users.json', async (req, res) => {
    try {
        const users = await readUsers();
        res.json(users);
    } catch (error) {
        console.error('Error serving users.json:', error);
        res.json([]);
    }
});

// Also serve from chat directory
app.get('/chat/users.json', async (req, res) => {
    try {
        const users = await readUsers();
        res.json(users);
    } catch (error) {
        console.error('Error serving users.json:', error);
        res.json([]);
    }
});

// Middleware to verify token
async function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    const username = await verifyToken(token);
    if (!username) {
        return res.status(403).json({ error: 'Invalid token' });
    }

    req.username = username;
    next();
}

// Signup endpoint
app.post('/api/signup', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const users = await readUsers();

        // Check if user already exists
        if (users.find(u => u.username === username)) {
            return res.status(400).json({ error: 'Username already exists' });
        }

        // Create new user
        const hashedPassword = hashPassword(password);
        const token = generateToken();
        
        const newUser = {
            username,
            password: hashedPassword,
            token,
            createdAt: new Date().toISOString()
        };

        users.push(newUser);
        await writeUsers(users);

        res.json({ 
            message: 'User created successfully',
            token 
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Login endpoint
app.post('/api/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const users = await readUsers();
        const hashedPassword = hashPassword(password);

        // Find user
        const user = users.find(u => u.username === username && u.password === hashedPassword);

        if (!user) {
            return res.status(401).json({ error: 'Invalid username or password' });
        }

        // Generate new token
        const token = generateToken();
        user.token = token;
        await writeUsers(users);

        res.json({ 
            message: 'Login successful',
            token 
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get messages endpoint
app.get('/api/messages', authenticateToken, async (req, res) => {
    try {
        const messages = await readMessages();
        res.json(messages);
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Send message endpoint
app.post('/api/messages', authenticateToken, async (req, res) => {
    try {
        const { message } = req.body;
        const username = req.username;

        if (!message || !message.trim()) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const messages = await readMessages();
        
        const newMessage = {
            id: Date.now().toString(),
            username,
            message: message.trim(),
            timestamp: new Date().toISOString()
        };

        messages.push(newMessage);
        
        // Keep only last N messages
        if (messages.length > config.maxMessages) {
            messages.shift();
        }

        await writeMessages(messages);

        res.json({ 
            message: 'Message sent successfully',
            data: newMessage 
        });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Root API endpoint
app.get('/api', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Kirakira Chat API',
        endpoints: {
            signup: 'POST /api/signup',
            login: 'POST /api/login',
            messages: 'GET /api/messages',
            sendMessage: 'POST /api/messages',
            health: 'GET /api/health'
        }
    });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});

// Serve test page
app.get('/test-api.html', (req, res) => {
    res.sendFile(path.join(__dirname, 'test-api.html'));
});

// Start server
async function startServer() {
    await initializeFiles();
    app.listen(PORT, HOST, () => {
        console.log(`Server running on http://${HOST}:${PORT}`);
        console.log(`API endpoints:`);
        console.log(`  POST /api/signup - Create new account`);
        console.log(`  POST /api/login - Login`);
        console.log(`  GET  /api/messages - Get all messages (requires auth)`);
        console.log(`  POST /api/messages - Send message (requires auth)`);
    });
}

startServer().catch(console.error);

