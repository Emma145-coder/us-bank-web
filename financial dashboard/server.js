const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Path to users.json in your root folder
const DATA_FILE = path.join(__dirname, 'users.json');

// Helper function to read database
function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        return { 
            users: {}, 
            settings: { auth_enabled: false, auth_code: "9999", auth_name: "IMF CODE" } 
        };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

// Helper function to write database
function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// API: Get all users and global settings
app.get('/api/data', (req, res) => {
    res.json(readData());
});

// API: Save entire database state (users and settings from admin/dashboard)
app.post('/api/data', (req, res) => {
    writeData(req.body);
    res.json({ success: true });
});

// API: Backward compatibility for user-only updates (signup and transfers)
app.post('/api/users', (req, res) => {
    const db = readData();
    db.users = req.body;
    writeData(db);
    res.json({ success: true });
});

// API: Admin Login verification (Credentials: admin@usbank.com / Emma123@sa)
app.post('/api/admin-login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@usbank.com' && password === 'Emma123@sa') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`US Banking server running on port ${PORT}`);
});
