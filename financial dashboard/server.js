const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'data', 'users.json');

function readData() {
    if (!fs.existsSync(DATA_FILE)) return { users: {}, settings: {} };
    return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
}

function writeData(data) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

app.get('/api/data', (req, res) => {
    res.json(readData());
});

app.post('/api/users', (req, res) => {
    const db = readData();
    db.users = req.body;
    writeData(db);
    res.json({ success: true });
});

app.post('/api/admin-login', (req, res) => {
    const { email, password } = req.body;
    if (email === 'admin@portal.com' && password === 'secureAdmin123') {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server live on port ${PORT}`));
