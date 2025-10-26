const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();

const DB_FILE = path.join(__dirname, 'data', 'app.db');

function openDb() {
  if (!fs.existsSync(path.dirname(DB_FILE))) fs.mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const db = new sqlite3.Database(DB_FILE);
  return db;
}

// Encryption helpers using AES-256-GCM
const KEY = process.env.CREDENTIALS_DB_KEY || null; // must be 32 bytes base64 or hex
function getKeyBuffer() {
  if (!KEY) throw new Error('CREDENTIALS_DB_KEY not set');
  // allow base64 or hex
  if (/^[0-9a-fA-F]+$/.test(KEY) && KEY.length === 64) return Buffer.from(KEY, 'hex');
  return Buffer.from(KEY, 'base64');
}

function encrypt(text) {
  const key = getKeyBuffer();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

function decrypt(data) {
  const key = getKeyBuffer();
  const b = Buffer.from(data, 'base64');
  const iv = b.slice(0, 12);
  const tag = b.slice(12, 28);
  const encrypted = b.slice(28);
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const out = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return out.toString('utf8');
}

module.exports = { openDb, encrypt, decrypt, DB_FILE };
