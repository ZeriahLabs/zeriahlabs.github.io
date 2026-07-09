const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Database = require('better-sqlite3');
const nodemailer = require('nodemailer');
const crypto = require('crypto'); // Built into Node, creates secure random tokens

const app = express();
app.use(express.json());
app.use(cors());

// NEW: This tells your server to host the website files inside your "public" folder
app.use(express.static('public'));

const JWT_SECRET = 'zeriah-labs-super-secret-key-2026';
const db = new Database('database.db');

// UPDATED: Added columns for reset_token and reset_token_expires
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    xp INTEGER DEFAULT 0,
    level TEXT DEFAULT 'Level 1 Rookie',
    reset_token TEXT,
    reset_token_expires INTEGER
  )
`);

// ---------------------------------------------------------
// NEW: EMAIL SENDER CONFIGURATION
// For testing, you can use a standard Gmail account. 
// Note: You must generate an "App Password" in your Google Account security settings, you cannot use your normal login password here.
// ---------------------------------------------------------
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'YOUR_EMAIL@gmail.com', 
    pass: 'YOUR_APP_PASSWORD'     
  }
});

// ---------------------------------------------------------
// 1. REGISTER ENDPOINT
// ---------------------------------------------------------
app.post('/api/register', async (req, res) => {
  const { email, password } = req.body;
  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const stmt = db.prepare('INSERT INTO users (email, password_hash) VALUES (?, ?)');
    const info = stmt.run(email, passwordHash);
    const token = jwt.sign({ userId: info.lastInsertRowid }, JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ message: 'Account created', token });
  } catch (error) {
    if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------
// 2. LOGIN ENDPOINT
// ---------------------------------------------------------
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user) return res.status(401).json({ error: 'Invalid email or password' });

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: 'Invalid email or password' });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '24h' });
    res.json({ message: 'Login successful', token, xp: user.xp, level: user.level });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------
// 3. SECURITY MIDDLEWARE
// ---------------------------------------------------------
const authenticateToken = (req, res, next) => {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied.' });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token.' });
    req.user = user;
    next();
  });
};

// ---------------------------------------------------------
// 4. FETCH USER PROGRESS
// ---------------------------------------------------------
app.get('/api/progress', authenticateToken, (req, res) => {
  const user = db.prepare('SELECT email, xp, level FROM users WHERE id = ?').get(req.user.userId);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// ---------------------------------------------------------
// 5. NEW: REQUEST PASSWORD RESET 
// ---------------------------------------------------------
app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

  // Privacy First: Always return success even if the email isn't in the DB to prevent bad actors from guessing emails
  if (!user) return res.json({ message: 'If that email exists, a reset link was sent.' });

  // Generate a secure 64-character token that expires in 1 hour
  const resetToken = crypto.randomBytes(32).toString('hex');
  const expireTime = Date.now() + (60 * 60 * 1000);

  // Save the temporary token to the database
  db.prepare('UPDATE users SET reset_token = ?, reset_token_expires = ? WHERE id = ?')
    .run(resetToken, expireTime, user.id);

  // Create the link pointing back to the frontend you are hosting
  const resetLink = `http://localhost:3000/?token=${resetToken}`;
  
  const mailOptions = {
    from: 'YOUR_EMAIL@gmail.com', // Change this
    to: email,
    subject: 'Zeriah Labs - Password Reset',
    text: `You requested a password reset. Click here to reset it: \n\n${resetLink}\n\nIf you did not request this, please safely ignore this email.`
  };

  transporter.sendMail(mailOptions, (error) => {
    if (error) console.error("Email error:", error);
    res.json({ message: 'If that email exists, a reset link was sent.' });
  });
});

// ---------------------------------------------------------
// 6. NEW: EXECUTE PASSWORD RESET
// ---------------------------------------------------------
app.post('/api/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;

  // Find user by token and make sure it hasn't expired yet
  const user = db.prepare('SELECT * FROM users WHERE reset_token = ? AND reset_token_expires > ?')
                 .get(token, Date.now());

  if (!user) return res.status(400).json({ error: 'Invalid or expired reset link.' });

  // Hash the new password and completely delete the temporary token from the DB
  const newHash = await bcrypt.hash(newPassword, 10);
  db.prepare('UPDATE users SET password_hash = ?, reset_token = NULL, reset_token_expires = NULL WHERE id = ?')
    .run(newHash, user.id);

  res.json({ message: 'Password successfully updated.' });
});

// Start the server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Zeriah Labs API running on http://localhost:${PORT}`);
});