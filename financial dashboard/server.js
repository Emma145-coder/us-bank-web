const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'users.json');

function readData() {
    if (!fs.existsSync(DATA_FILE)) {
        return { 
            users: {}, 
            settings: { auth_enabled: false, auth_code: "9999", auth_name: "IMF CODE" } 
        };
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// Get all data (users + settings)
app.get('/api/data', (req, res) => {
    res.json(readData());
});

// Save entire database state (users and settings)
app.post('/api/data', (req, res) => {
    writeData(req.body);
    res.json({ success: true });
});

// Backward compatibility route for user-only updates
app.post('/api/users', (req, res) => {
    const db = readData();
    db.users = req.body;
    writeData(db);
    res.json({ success: true });
});

// Admin Login verification
app.post('/api/admin-login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@usbank.com' && password === 'Emma123@sa') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid admin credentials' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
