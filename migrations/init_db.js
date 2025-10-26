const fs = require('fs');
const path = require('path');
const { openDb } = require('../db');

function run() {
  const db = openDb();
  db.serialize(() => {
    // credentials table stores encrypted secrets per owner (contact/session)
    db.run(`
      CREATE TABLE IF NOT EXISTS credentials (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        owner TEXT NOT NULL,
        site TEXT NOT NULL,
        username TEXT NOT NULL,
        secret_encrypted TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL
      )
    `);

    // users table: optional local users (if using passwords)
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        contact TEXT UNIQUE NOT NULL,
        password_hash TEXT,
        created_at TEXT NOT NULL
      )
    `);

    console.log('Database initialized at', path.join(__dirname, '..', 'data', 'app.db'));
  });
  db.close();
}

if (require.main === module) run();
