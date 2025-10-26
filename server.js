const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// session middleware (in-memory store — fine for demo; replace with a persistent store in production)
app.use(session({
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 15 } // 15 minutes
}));

// In-memory OTP store: { contact: { code, expiresAt } }
const otps = {};

// Serve login page unprotected
app.get('/login.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});

// Root route: require authentication; if not authenticated redirect to login
app.get('/', (req, res) => {
  if (!req.session || !req.session.authenticated) {
    return res.redirect('/login.html');
  }
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Simple API endpoint returning sample articles
app.get('/api/articles', (req, res) => {
  try {
    const articles = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'articles.json'), 'utf8'));
    res.json(articles);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load articles' });
  }
});

// Messages API: fans chat, predictions and analysis
app.get('/api/messages', (req, res) => {
  try {
    const messages = JSON.parse(fs.readFileSync(path.join(__dirname, 'data', 'messages.json'), 'utf8'));
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load messages' });
  }
});

app.post('/api/messages', (req, res) => {
  const { author, content, type } = req.body;
  if (!author || !content) return res.status(400).json({ error: 'author and content are required' });

  const filePath = path.join(__dirname, 'data', 'messages.json');
  try {
    const messages = JSON.parse(fs.readFileSync(filePath, 'utf8')) || [];
    const newId = messages.length ? Math.max(...messages.map(m => m.id)) + 1 : 1;
    const timestamp = new Date().toISOString();
    const message = { id: newId, author, content, type: type || 'chat', timestamp };
    messages.push(message);
    fs.writeFileSync(filePath, JSON.stringify(messages, null, 2), 'utf8');
    res.status(201).json(message);
  } catch (err) {
    console.error('Failed to write messages.json', err);
    res.status(500).json({ error: 'Failed to save message' });
  }
});

// Credentials API - requires authenticated session
const { openDb, encrypt, decrypt } = require('./db');

function requireAuth(req, res, next) {
  if (req.session && req.session.authenticated && req.session.contact) return next();
  return res.status(401).json({ error: 'Authentication required' });
}

app.get('/api/credentials', requireAuth, (req, res) => {
  try {
    const db = openDb();
    db.all('SELECT id, owner, site, username, secret_encrypted, notes, created_at FROM credentials WHERE owner = ?', [req.session.contact], (err, rows) => {
      db.close();
      if (err) return res.status(500).json({ error: 'Failed to read credentials' });
      const out = rows.map(r => ({ id: r.id, site: r.site, username: r.username, secret: decrypt(r.secret_encrypted), notes: r.notes, created_at: r.created_at }));
      res.json(out);
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.post('/api/credentials', requireAuth, (req, res) => {
  const { site, username, secret, notes } = req.body;
  if (!site || !username || !secret) return res.status(400).json({ error: 'site, username and secret are required' });
  try {
    const db = openDb();
    const secret_encrypted = encrypt(secret);
    const created_at = new Date().toISOString();
    db.run('INSERT INTO credentials (owner, site, username, secret_encrypted, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)', [req.session.contact, site, username, secret_encrypted, notes || '', created_at], function(err) {
      db.close();
      if (err) return res.status(500).json({ error: 'Failed to save credential' });
      res.status(201).json({ id: this.lastID, site, username, notes, created_at });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/credentials/:id', requireAuth, (req, res) => {
  const id = Number(req.params.id);
  const db = openDb();
  db.get('SELECT owner FROM credentials WHERE id = ?', [id], (err, row) => {
    if (err) { db.close(); return res.status(500).json({ error: 'DB error' }); }
    if (!row) { db.close(); return res.status(404).json({ error: 'Not found' }); }
    if (row.owner !== req.session.contact) { db.close(); return res.status(403).json({ error: 'Forbidden' }); }
    db.run('DELETE FROM credentials WHERE id = ?', [id], function(err) {
      db.close();
      if (err) return res.status(500).json({ error: 'Failed to delete' });
      res.json({ success: true });
    });
  });
});

// Admin endpoint: create a new article and persist to data/articles.json
app.post('/api/articles', (req, res) => {
  const { title, excerpt, image, url } = req.body;
  if (!title || !excerpt) return res.status(400).json({ error: 'title and excerpt are required' });

  const filePath = path.join(__dirname, 'data', 'articles.json');
  try {
    const articles = JSON.parse(fs.readFileSync(filePath, 'utf8')) || [];
    const newId = articles.length ? Math.max(...articles.map(a => a.id)) + 1 : 1;
    const article = { id: newId, title, excerpt, image: image || '', url: url || '#' };
    articles.push(article);
    fs.writeFileSync(filePath, JSON.stringify(articles, null, 2), 'utf8');
    res.status(201).json(article);
  } catch (err) {
    console.error('Failed to write articles.json', err);
    res.status(500).json({ error: 'Failed to save article' });
  }
});

// Request OTP endpoint (demo): generates a 6-digit code and 'sends' it.
app.post('/api/request-otp', (req, res) => {
  const { contact } = req.body;
  if (!contact) return res.status(400).json({ error: 'contact is required' });
  // generate 6-digit code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 1000 * 60 * 5; // 5 minutes
  otps[contact] = { code, expiresAt };
  // In production you'd send the code via email/SMS. For demo we return it in the response.
  console.log(`OTP for ${contact}: ${code}`);
  res.json({ success: true, otp: code, message: 'OTP generated (demo). In production the code would be sent via email or SMS.' });
});

// Verify OTP and create session
app.post('/api/verify-otp', (req, res) => {
  const { otp } = req.body;
  if (!otp) return res.status(400).json({ error: 'otp is required' });
  // find matching contact in otps store
  const entry = Object.entries(otps).find(([contact, data]) => data.code === otp && data.expiresAt > Date.now());
  if (!entry) return res.status(400).json({ error: 'Invalid or expired OTP' });
  const [contact] = entry;
  // mark session as authenticated
  req.session.authenticated = true;
  req.session.contact = contact;
  // remove used OTP
  delete otps[contact];
  res.json({ success: true });
});

// Auth status
app.get('/api/auth-status', (req, res) => {
  res.json({ authenticated: !!(req.session && req.session.authenticated), contact: req.session.contact || null });
});

app.post('/api/logout', (req, res) => {
  if (req.session) req.session.destroy(() => {});
  res.json({ success: true });
});

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Serve static files from the site folder (after routes so auth redirect works)
app.use(express.static(path.join(__dirname)));

// Export app for testing
module.exports = app;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}
