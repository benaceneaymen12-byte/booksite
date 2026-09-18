const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/api', (req, res) => {
  res.json({
    status: 'ok',
    service: 'PharmaLab API',
    storage: process.env.DB_PATH ? 'persistent-configured' : 'ephemeral-default',
  });
});

// Serve static in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../client/dist');
  const clientEntry = path.join(clientDist, 'index.html');

  if (fs.existsSync(clientEntry)) {
    app.use(express.static(clientDist));
    app.get('/{*splat}', (req, res) => {
      res.sendFile(clientEntry);
    });
  }
}

// Database
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'pharmalab.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
const db = new sqlite3.Database(DB_PATH);
if (!process.env.DB_PATH) {
  console.warn('WARNING: DB_PATH is not configured; SQLite data will be lost when the hosting service restarts.');
}

function dbRun(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function dbGet(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function dbAll(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function initDb() {
  return Promise.all([
    dbRun(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT,
      role TEXT DEFAULT 'analyst',
      email TEXT,
      phone TEXT,
      job_title TEXT,
      avatar TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sample_id TEXT NOT NULL,
      product_name TEXT,
      product_type TEXT,
      batch_lot TEXT,
      sampling_date TEXT,
      analysis_date TEXT,
      analyst TEXT,
      test_type TEXT,
      sop_ref TEXT,
      dilution REAL,
      volume_plated REAL,
      colony_count INTEGER,
      results_json TEXT,
      unit TEXT,
      result TEXT,
      observations TEXT,
      status TEXT DEFAULT 'draft',
      is_demo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS personnel_monitoring (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id TEXT NOT NULL,
      department TEXT,
      site TEXT,
      sampling_type TEXT,
      sampling_date TEXT,
      sampling_time TEXT,
      analyst TEXT,
      medium TEXT,
      colony_count INTEGER,
      microorganism TEXT,
      method TEXT,
      sop_ref TEXT,
      unit TEXT,
      result TEXT,
      observations TEXT,
      status TEXT DEFAULT 'draft',
      is_demo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS water_samples (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sample_id TEXT NOT NULL,
      water_type TEXT,
      sampling_point TEXT,
      sampling_date TEXT,
      sampling_time TEXT,
      analyst TEXT,
      volume REAL,
      dilution REAL,
      colony_count INTEGER,
      unit TEXT,
      result TEXT,
      sop_ref TEXT,
      observations TEXT,
      status TEXT DEFAULT 'draft',
      is_demo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS culture_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medium_name TEXT NOT NULL,
      manufacturer TEXT,
      lot_number TEXT,
      preparation_date TEXT,
      sterilization_date TEXT,
      sterilization_method TEXT,
      quantity_prepared REAL,
      quantity_used REAL,
      quantity_remaining REAL,
      expiry_date TEXT,
      storage_conditions TEXT,
      prepared_by TEXT,
      unit TEXT,
      volume TEXT,
      observations TEXT,
      is_demo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS email_notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      notification_key TEXT UNIQUE NOT NULL,
      sent_at TEXT DEFAULT (datetime('now'))
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS pre_poured_petri (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      media_id INTEGER NOT NULL,
      medium_name TEXT NOT NULL,
      lot_number TEXT,
      preparation_date TEXT,
      expiry_date TEXT,
      quantity_prepared REAL,
      quantity_used REAL DEFAULT 0,
      quantity_remaining REAL,
      prepared_by TEXT,
      observations TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (media_id) REFERENCES culture_media(id)
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS media_inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      medium_name TEXT NOT NULL,
      lot_number TEXT,
      supplier TEXT,
      received_date TEXT,
      opening_date TEXT,
      expiry_date TEXT,
      storage_location TEXT,
      quantity REAL,
      unit TEXT,
      observations TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS sterilization_cycles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      equipment TEXT,
      cycle_number TEXT,
      cycle_date TEXT,
      temperature REAL,
      duration_minutes INTEGER,
      operator TEXT,
      result TEXT,
      observations TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS microorganisms (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      alternative_name TEXT,
      sop_ref TEXT,
      notes TEXT,
      is_demo INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS shift_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT,
      analyst TEXT,
      shift_start TEXT,
      shift_end TEXT,
      shift_label TEXT,
      activities_json TEXT,
      observations TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT NOT NULL
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS specifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      limit_val TEXT,
      unit TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS sop_references (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      ref_code TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
    dbRun(`CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user TEXT,
      action TEXT NOT NULL,
      record_type TEXT NOT NULL,
      record_id INTEGER,
      old_value TEXT,
      new_value TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    )`),
  ]).then(() => Promise.all([
    dbRun('ALTER TABLE culture_media ADD COLUMN volume TEXT').catch(() => null),
    dbRun('ALTER TABLE users ADD COLUMN email TEXT').catch(() => null),
    dbRun('ALTER TABLE users ADD COLUMN phone TEXT').catch(() => null),
    dbRun('ALTER TABLE users ADD COLUMN job_title TEXT').catch(() => null),
    dbRun('ALTER TABLE users ADD COLUMN avatar TEXT').catch(() => null),
  ]));
}

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    name: user.name || '',
    role: user.role || 'analyst',
    email: user.email || '',
    phone: user.phone || '',
    jobTitle: user.job_title || '',
    avatar: user.avatar || '',
  };
}

function adminMiddleware(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ message: 'Admin access required' });
  next();
}

// Auth middleware
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pharmalab-secret-key');
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
}

// Auth routes
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, username: user.username, name: user.name, role: user.role || 'analyst' }, process.env.JWT_SECRET || 'pharmalab-secret-key', { expiresIn: '24h' });
    res.json({ token, user: publicUser(user) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
  const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
  res.json({ user: publicUser(user || req.user) });
});

app.put('/api/auth/profile', authMiddleware, async (req, res) => {
  try {
    const { name, email, phone, jobTitle, avatar } = req.body;
    if (avatar && (!avatar.startsWith('data:image/') || avatar.length > 700000)) {
      return res.status(400).json({ message: 'Avatar must be an image smaller than 500 KB' });
    }
    await dbRun('UPDATE users SET name = ?, email = ?, phone = ?, job_title = ?, avatar = ? WHERE id = ?', [
      String(name || '').trim(), String(email || '').trim(), String(phone || '').trim(), String(jobTitle || '').trim(), avatar || '', req.user.id,
    ]);
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.user.id]);
    res.json({ user: publicUser(user) });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  const users = await dbAll('SELECT id, username, name, role, email, phone, job_title, avatar, created_at FROM users ORDER BY username');
  res.json(users.map(publicUser));
});

app.post('/api/admin/users', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { username, password, name, email, phone, jobTitle, role } = req.body;
    if (!username?.trim() || !password) return res.status(400).json({ message: 'Username and password are required' });
    const hashed = await bcrypt.hash(password, 10);
    const result = await dbRun('INSERT INTO users (username, password, name, email, phone, job_title, role) VALUES (?, ?, ?, ?, ?, ?, ?)', [username.trim(), hashed, name || '', email || '', phone || '', jobTitle || '', role === 'admin' ? 'admin' : 'analyst']);
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [result.lastID]);
    res.status(201).json(publicUser(user));
  } catch (err) {
    res.status(err.message.includes('UNIQUE') ? 409 : 500).json({ message: err.message.includes('UNIQUE') ? 'Username already exists' : err.message });
  }
});

app.put('/api/admin/users/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { name, email, phone, jobTitle, role, password } = req.body;
    const nextRole = role === 'admin' ? 'admin' : 'analyst';
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      await dbRun('UPDATE users SET name=?, email=?, phone=?, job_title=?, role=?, password=? WHERE id=?', [name || '', email || '', phone || '', jobTitle || '', nextRole, hashed, req.params.id]);
    } else {
      await dbRun('UPDATE users SET name=?, email=?, phone=?, job_title=?, role=? WHERE id=?', [name || '', email || '', phone || '', jobTitle || '', nextRole, req.params.id]);
    }
    const user = await dbGet('SELECT * FROM users WHERE id = ?', [req.params.id]);
    res.json(publicUser(user));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Analyses
app.get('/api/analyses', authMiddleware, async (req, res) => {
  try {
    const { q, status, productType } = req.query;
    let sql = 'SELECT * FROM analyses WHERE 1=1';
    const params = [];
    if (q) {
      sql += ' AND (sample_id LIKE ? OR product_name LIKE ? OR batch_lot LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (productType) { sql += ' AND product_type = ?'; params.push(productType); }
    sql += ' ORDER BY created_at DESC';
    const rows = await dbAll(sql, params);
    res.json(rows.map(r => ({ ...r, results: JSON.parse(r.results_json || '[]'), isDemo: !!r.is_demo })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/analyses/:id', authMiddleware, async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM analyses WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json({ ...row, results: JSON.parse(row.results_json || '[]'), isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/analyses', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const resultsJson = JSON.stringify(data.results || []);
    const { lastID } = await dbRun(
      `INSERT INTO analyses (sample_id, product_name, product_type, batch_lot, sampling_date, analysis_date, analyst, test_type, sop_ref, dilution, volume_plated, colony_count, results_json, unit, result, observations, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.sampleId, data.productName, data.productType, data.batchLot, data.samplingDate, data.analysisDate, data.analyst, data.testType, data.sopRef, data.dilution, data.volumePlated, data.colonyCount, resultsJson, data.unit, data.result, data.observations, data.status || 'draft']
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id) VALUES (?, 'created', 'analysis', ?)`, [req.user.username, lastID]);
    const row = await dbGet('SELECT * FROM analyses WHERE id = ?', [lastID]);
    res.status(201).json({ ...row, results: JSON.parse(row.results_json || '[]'), isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/analyses/:id', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const existing = await dbGet('SELECT * FROM analyses WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await dbRun(
      `UPDATE analyses SET sample_id=?, product_name=?, product_type=?, batch_lot=?, sampling_date=?, analysis_date=?, analyst=?, test_type=?, sop_ref=?, dilution=?, volume_plated=?, colony_count=?, results_json=?, unit=?, result=?, observations=?, status=?, updated_at=datetime('now') WHERE id=?`,
      [data.sampleId, data.productName, data.productType, data.batchLot, data.samplingDate, data.analysisDate, data.analyst, data.testType, data.sopRef, data.dilution, data.volumePlated, data.colonyCount, JSON.stringify(data.results || []), data.unit, data.result, data.observations, data.status, req.params.id]
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value, new_value) VALUES (?, 'updated', 'analysis', ?, ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing), JSON.stringify({ ...existing, results_json: JSON.stringify(data.results || []) })]);
    const row = await dbGet('SELECT * FROM analyses WHERE id = ?', [req.params.id]);
    res.json({ ...row, results: JSON.parse(row.results_json || '[]'), isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/analyses/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await dbGet('SELECT * FROM analyses WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await dbRun('DELETE FROM analyses WHERE id = ?', [req.params.id]);
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value) VALUES (?, 'deleted', 'analysis', ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing)]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Personnel
app.get('/api/personnel', authMiddleware, async (req, res) => {
  try {
    const { q, status } = req.query;
    let sql = 'SELECT * FROM personnel_monitoring WHERE 1=1';
    const params = [];
    if (q) {
      sql += ' AND (employee_id LIKE ? OR department LIKE ? OR sampling_type LIKE ?)';
      params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC';
    const rows = await dbAll(sql, params);
    res.json(rows.map(r => ({ ...r, isDemo: !!r.is_demo })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/personnel/:id', authMiddleware, async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM personnel_monitoring WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json({ ...row, isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/personnel', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const { lastID } = await dbRun(
      `INSERT INTO personnel_monitoring (employee_id, department, site, sampling_type, sampling_date, sampling_time, analyst, medium, colony_count, microorganism, method, sop_ref, unit, result, observations, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.employeeId, data.department, data.site, data.samplingType, data.samplingDate, data.samplingTime, data.analyst, data.medium, data.colonyCount, data.microorganism, data.method, data.sopRef, data.unit, data.result, data.observations, data.status || 'draft']
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id) VALUES (?, 'created', 'personnel', ?)`, [req.user.username, lastID]);
    const row = await dbGet('SELECT * FROM personnel_monitoring WHERE id = ?', [lastID]);
    res.status(201).json({ ...row, isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/personnel/:id', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const existing = await dbGet('SELECT * FROM personnel_monitoring WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await dbRun(
      `UPDATE personnel_monitoring SET employee_id=?, department=?, site=?, sampling_type=?, sampling_date=?, sampling_time=?, analyst=?, medium=?, colony_count=?, microorganism=?, method=?, sop_ref=?, unit=?, result=?, observations=?, status=?, updated_at=datetime('now') WHERE id=?`,
      [data.employeeId, data.department, data.site, data.samplingType, data.samplingDate, data.samplingTime, data.analyst, data.medium, data.colonyCount, data.microorganism, data.method, data.sopRef, data.unit, data.result, data.observations, data.status, req.params.id]
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value, new_value) VALUES (?, 'updated', 'personnel', ?, ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing), JSON.stringify({ ...existing })]);
    const row = await dbGet('SELECT * FROM personnel_monitoring WHERE id = ?', [req.params.id]);
    res.json({ ...row, isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/personnel/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await dbGet('SELECT * FROM personnel_monitoring WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await dbRun('DELETE FROM personnel_monitoring WHERE id = ?', [req.params.id]);
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value) VALUES (?, 'deleted', 'personnel', ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing)]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Water
app.get('/api/water', authMiddleware, async (req, res) => {
  try {
    const { q, status, waterType } = req.query;
    let sql = 'SELECT * FROM water_samples WHERE 1=1';
    const params = [];
    if (q) {
      sql += ' AND (sample_id LIKE ? OR sampling_point LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    if (waterType) { sql += ' AND water_type = ?'; params.push(waterType); }
    sql += ' ORDER BY created_at DESC';
    const rows = await dbAll(sql, params);
    res.json(rows.map(r => ({ ...r, isDemo: !!r.is_demo })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/water/:id', authMiddleware, async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM water_samples WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json({ ...row, isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/water', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const { lastID } = await dbRun(
      `INSERT INTO water_samples (sample_id, water_type, sampling_point, sampling_date, sampling_time, analyst, volume, dilution, colony_count, unit, result, sop_ref, observations, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.sampleId, data.waterType, data.samplingPoint, data.samplingDate, data.samplingTime, data.analyst, data.volume, data.dilution, data.colonyCount, data.unit, data.result, data.sopRef, data.observations, data.status || 'draft']
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id) VALUES (?, 'created', 'water', ?)`, [req.user.username, lastID]);
    const row = await dbGet('SELECT * FROM water_samples WHERE id = ?', [lastID]);
    res.status(201).json({ ...row, isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/water/:id', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const existing = await dbGet('SELECT * FROM water_samples WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await dbRun(
      `UPDATE water_samples SET sample_id=?, water_type=?, sampling_point=?, sampling_date=?, sampling_time=?, analyst=?, volume=?, dilution=?, colony_count=?, unit=?, result=?, sop_ref=?, observations=?, status=?, updated_at=datetime('now') WHERE id=?`,
      [data.sampleId, data.waterType, data.samplingPoint, data.samplingDate, data.samplingTime, data.analyst, data.volume, data.dilution, data.colonyCount, data.unit, data.result, data.sopRef, data.observations, data.status, req.params.id]
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value, new_value) VALUES (?, 'updated', 'water', ?, ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing), JSON.stringify({ ...existing })]);
    const row = await dbGet('SELECT * FROM water_samples WHERE id = ?', [req.params.id]);
    res.json({ ...row, isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/water/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await dbGet('SELECT * FROM water_samples WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await dbRun('DELETE FROM water_samples WHERE id = ?', [req.params.id]);
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value) VALUES (?, 'deleted', 'water', ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing)]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Media
app.get('/api/media', authMiddleware, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT m.*,
        (SELECT user FROM audit_logs WHERE record_type = 'media' AND record_id = m.id AND action = 'created' ORDER BY id ASC LIMIT 1) AS created_by_user,
        (SELECT user FROM audit_logs WHERE record_type = 'media' AND record_id = m.id AND action = 'updated' ORDER BY id DESC LIMIT 1) AS updated_by_user
      FROM culture_media m ORDER BY expiry_date ASC
    `);
    res.json(rows.map(r => ({
      ...r,
      quantity_remaining: r.quantity_remaining ?? (r.quantity_prepared || 0) - (r.quantity_used || 0),
      isDemo: !!r.is_demo,
    })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    const row = await dbGet(`
      SELECT m.*,
        (SELECT user FROM audit_logs WHERE record_type = 'media' AND record_id = m.id AND action = 'created' ORDER BY id ASC LIMIT 1) AS created_by_user,
        (SELECT user FROM audit_logs WHERE record_type = 'media' AND record_id = m.id AND action = 'updated' ORDER BY id DESC LIMIT 1) AS updated_by_user
      FROM culture_media m WHERE m.id = ?
    `, [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json({ ...row, quantity_remaining: row.quantity_remaining ?? (row.quantity_prepared || 0) - (row.quantity_used || 0), isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/media', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const qtyRemaining = (data.quantityPrepared || 0) - (data.quantityUsed || 0);
    const { lastID } = await dbRun(
      `INSERT INTO culture_media (medium_name, manufacturer, lot_number, preparation_date, sterilization_date, sterilization_method, quantity_prepared, quantity_used, quantity_remaining, expiry_date, storage_conditions, prepared_by, unit, volume, observations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.mediumName, data.manufacturer, data.lotNumber, data.preparationDate, data.sterilizationDate, data.sterilizationMethod, data.quantityPrepared, data.quantityUsed, qtyRemaining, data.expiryDate, data.storageConditions, data.preparedBy, data.unit, data.volume, data.observations]
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id) VALUES (?, 'created', 'media', ?)`, [req.user.username, lastID]);
    const row = await dbGet('SELECT * FROM culture_media WHERE id = ?', [lastID]);
    res.status(201).json({ ...row, quantity_remaining: row.quantity_remaining ?? qtyRemaining, isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/media/:id', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const existing = await dbGet('SELECT * FROM culture_media WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    const qtyRemaining = (data.quantityPrepared || 0) - (data.quantityUsed || 0);
    await dbRun(
      `UPDATE culture_media SET medium_name=?, manufacturer=?, lot_number=?, preparation_date=?, sterilization_date=?, sterilization_method=?, quantity_prepared=?, quantity_used=?, quantity_remaining=?, expiry_date=?, storage_conditions=?, prepared_by=?, unit=?, volume=?, observations=?, updated_at=datetime('now') WHERE id=?`,
      [data.mediumName, data.manufacturer, data.lotNumber, data.preparationDate, data.sterilizationDate, data.sterilizationMethod, data.quantityPrepared, data.quantityUsed, qtyRemaining, data.expiryDate, data.storageConditions, data.preparedBy, data.unit, data.volume, data.observations, req.params.id]
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value, new_value) VALUES (?, 'updated', 'media', ?, ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing), JSON.stringify({ ...existing, quantity_remaining: qtyRemaining })]);
    const row = await dbGet('SELECT * FROM culture_media WHERE id = ?', [req.params.id]);
    res.json({ ...row, quantity_remaining: row.quantity_remaining ?? qtyRemaining, isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/media/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await dbGet('SELECT * FROM culture_media WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await dbRun('DELETE FROM culture_media WHERE id = ?', [req.params.id]);
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value) VALUES (?, 'deleted', 'media', ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing)]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Pre-poured Petri dishes linked to prepared culture media
app.get('/api/petri', authMiddleware, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM pre_poured_petri ORDER BY expiry_date ASC, created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/petri', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const media = await dbGet('SELECT * FROM culture_media WHERE id = ?', [data.mediaId]);
    if (!media) return res.status(400).json({ message: 'Culture media batch not found' });
    const quantityPrepared = Number(data.quantityPrepared) || 0;
    const quantityUsed = Number(data.quantityUsed) || 0;
    const mediaRemaining = Number(media.quantity_remaining ?? ((media.quantity_prepared || 0) - (media.quantity_used || 0)));
    if (quantityPrepared <= 0) return res.status(400).json({ message: 'Petri quantity must be greater than zero' });
    if (quantityPrepared > mediaRemaining) return res.status(400).json({ message: 'Not enough prepared media remaining' });
    const mediaUsed = Number(media.quantity_used) || 0;
    await dbRun(
      `UPDATE culture_media SET quantity_used = ?, quantity_remaining = ?, updated_at=datetime('now') WHERE id = ?`,
      [mediaUsed + quantityPrepared, mediaRemaining - quantityPrepared, media.id]
    );
    const { lastID } = await dbRun(
      `INSERT INTO pre_poured_petri (media_id, medium_name, lot_number, preparation_date, expiry_date, quantity_prepared, quantity_used, quantity_remaining, prepared_by, observations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [media.id, media.medium_name, media.lot_number, media.preparation_date, media.expiry_date, quantityPrepared, quantityUsed, quantityPrepared - quantityUsed, data.preparedBy, data.observations]
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value, new_value) VALUES (?, 'created', 'petri', ?, ?, ?)`, [req.user.username, lastID, JSON.stringify({ mediaRemaining }), JSON.stringify({ mediaRemaining: mediaRemaining - quantityPrepared, quantity: quantityPrepared })]);
    res.status(201).json(await dbGet('SELECT * FROM pre_poured_petri WHERE id = ?', [lastID]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/petri/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await dbGet('SELECT * FROM pre_poured_petri WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    const media = await dbGet('SELECT * FROM culture_media WHERE id = ?', [existing.media_id]);
    if (media) {
      const used = Math.max(0, (Number(media.quantity_used) || 0) - (Number(existing.quantity_prepared) || 0));
      const prepared = Number(media.quantity_prepared) || 0;
      await dbRun('UPDATE culture_media SET quantity_used = ?, quantity_remaining = ?, updated_at=datetime(\'now\') WHERE id = ?', [used, prepared - used, media.id]);
    }
    await dbRun('DELETE FROM pre_poured_petri WHERE id = ?', [req.params.id]);
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value) VALUES (?, 'deleted', 'petri', ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing)]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Culture-media inventory
app.get('/api/inventory', authMiddleware, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM media_inventory ORDER BY expiry_date ASC, created_at DESC');
    res.json(rows);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/inventory', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const { lastID } = await dbRun(
      `INSERT INTO media_inventory (medium_name, lot_number, supplier, received_date, opening_date, expiry_date, storage_location, quantity, unit, observations)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.mediumName, data.lotNumber, data.supplier, data.receivedDate, data.openingDate, data.expiryDate, data.storageLocation, data.quantity, data.unit, data.observations]
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id) VALUES (?, 'created', 'inventory', ?)`, [req.user.username, lastID]);
    res.status(201).json(await dbGet('SELECT * FROM media_inventory WHERE id = ?', [lastID]));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/inventory/import', authMiddleware, async (req, res) => {
  const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
  try {
    for (const data of rows) {
      await dbRun(
        `INSERT INTO media_inventory (medium_name, lot_number, supplier, received_date, opening_date, expiry_date, storage_location, quantity, unit, observations)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [data.mediumName, data.lotNumber, data.supplier, data.receivedDate, data.openingDate, data.expiryDate, data.storageLocation, data.quantity, data.unit, data.observations]
      );
    }
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, new_value) VALUES (?, 'created', 'inventory_import', 0, ?)`, [req.user.username, JSON.stringify({ count: rows.length })]);
    res.status(201).json({ imported: rows.length });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.delete('/api/inventory/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await dbGet('SELECT * FROM media_inventory WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await dbRun('DELETE FROM media_inventory WHERE id = ?', [req.params.id]);
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value) VALUES (?, 'deleted', 'inventory', ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing)]);
    res.status(204).send();
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/sterilization', authMiddleware, async (req, res) => {
  try { res.json(await dbAll('SELECT * FROM sterilization_cycles ORDER BY cycle_date DESC, created_at DESC')); }
  catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/sterilization', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const { lastID } = await dbRun(`INSERT INTO sterilization_cycles (equipment, cycle_number, cycle_date, temperature, duration_minutes, operator, result, observations) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [data.equipment, data.cycleNumber, data.cycleDate, data.temperature, data.durationMinutes, data.operator, data.result, data.observations]);
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id) VALUES (?, 'created', 'sterilization', ?)`, [req.user.username, lastID]);
    res.status(201).json(await dbGet('SELECT * FROM sterilization_cycles WHERE id = ?', [lastID]));
  } catch (err) { res.status(500).json({ message: err.message }); }
});

// Microorganisms
app.get('/api/microorganisms', authMiddleware, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM microorganisms ORDER BY name ASC');
    res.json(rows.map(r => ({ ...r, isDemo: !!r.is_demo })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/microorganisms', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const { lastID } = await dbRun(
      `INSERT INTO microorganisms (name, alternative_name, sop_ref, notes, is_demo) VALUES (?, ?, ?, ?, ?)`,
      [data.name, data.alternativeName, data.sopRef, data.notes, data.isDemo ? 1 : 0]
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id) VALUES (?, 'created', 'microorganism', ?)`, [req.user.username, lastID]);
    const row = await dbGet('SELECT * FROM microorganisms WHERE id = ?', [lastID]);
    res.status(201).json({ ...row, isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/microorganisms/:id', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const existing = await dbGet('SELECT * FROM microorganisms WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await dbRun(
      `UPDATE microorganisms SET name=?, alternative_name=?, sop_ref=?, notes=? WHERE id=?`,
      [data.name, data.alternativeName, data.sopRef, data.notes, req.params.id]
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value, new_value) VALUES (?, 'updated', 'microorganism', ?, ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing), JSON.stringify({ ...existing, name: data.name, alternative_name: data.alternativeName, sop_ref: data.sopRef, notes: data.notes })]);
    const row = await dbGet('SELECT * FROM microorganisms WHERE id = ?', [req.params.id]);
    res.json({ ...row, isDemo: !!row.is_demo });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/microorganisms/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await dbGet('SELECT * FROM microorganisms WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await dbRun('DELETE FROM microorganisms WHERE id = ?', [req.params.id]);
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value) VALUES (?, 'deleted', 'microorganism', ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing)]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reports
app.get('/api/reports', authMiddleware, async (req, res) => {
  try {
    const { date, analyst } = req.query;
    let sql = 'SELECT * FROM shift_reports WHERE 1=1';
    const params = [];
    if (date) { sql += ' AND date = ?'; params.push(date); }
    if (analyst) { sql += ' AND analyst LIKE ?'; params.push(`%${analyst}%`); }
    sql += ' ORDER BY date DESC';
    const rows = await dbAll(sql, params);
    res.json(rows.map(r => ({ ...r, activities: JSON.parse(r.activities_json || '[]') })));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/reports/:id', authMiddleware, async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM shift_reports WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json({ ...row, activities: JSON.parse(row.activities_json || '[]') });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/reports', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const { lastID } = await dbRun(
      `INSERT INTO shift_reports (date, analyst, shift_start, shift_end, shift_label, activities_json, observations)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [data.date, data.analyst, data.shiftStart, data.shiftEnd, data.shiftLabel, JSON.stringify(data.activities || []), data.observations]
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id) VALUES (?, 'created', 'report', ?)`, [req.user.username, lastID]);
    const row = await dbGet('SELECT * FROM shift_reports WHERE id = ?', [lastID]);
    res.status(201).json({ ...row, activities: JSON.parse(row.activities_json || '[]') });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/reports/:id', authMiddleware, async (req, res) => {
  const data = req.body;
  try {
    const existing = await dbGet('SELECT * FROM shift_reports WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await dbRun(
      `UPDATE shift_reports SET date=?, analyst=?, shift_start=?, shift_end=?, shift_label=?, activities_json=?, observations=?, updated_at=datetime('now') WHERE id=?`,
      [data.date, data.analyst, data.shiftStart, data.shiftEnd, data.shiftLabel, JSON.stringify(data.activities || []), data.observations, req.params.id]
    );
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value, new_value) VALUES (?, 'updated', 'report', ?, ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing), JSON.stringify({ ...existing, activities_json: JSON.stringify(data.activities || []) })]);
    const row = await dbGet('SELECT * FROM shift_reports WHERE id = ?', [req.params.id]);
    res.json({ ...row, activities: JSON.parse(row.activities_json || '[]') });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/reports/:id', authMiddleware, async (req, res) => {
  try {
    const existing = await dbGet('SELECT * FROM shift_reports WHERE id = ?', [req.params.id]);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    await dbRun('DELETE FROM shift_reports WHERE id = ?', [req.params.id]);
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, old_value) VALUES (?, 'deleted', 'report', ?, ?)`, [req.user.username, req.params.id, JSON.stringify(existing)]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PDF generation endpoint
app.get('/api/reports/:id/pdf', authMiddleware, async (req, res) => {
  try {
    const row = await dbGet('SELECT * FROM shift_reports WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ message: 'Not found' });

    const settings = await dbAll('SELECT * FROM settings');
    const settingMap = {};
    settings.forEach(s => { settingMap[s.key] = s.value; });
    const labName = settingMap.labName || 'Laboratoire';

    const shiftLabel = row.shift_label || `${row.shift_start} - ${row.shift_end}`;
    const activities = JSON.parse(row.activities_json || '[]');
    const generated = new Date().toLocaleString();

    const activityItems = activities.map(a => `<li>${a}</li>`).join('') || '<li style="color:#888;">Aucune activité enregistrée</li>';

    const observationsHtml = row.observations
      ? `<div class="section"><h2>Observations</h2><div class="observations">${row.observations}</div></div>`
      : '';

    const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8">
<style>
body{font-family:system-ui,sans-serif;padding:40px;max-width:800px;margin:0 auto;color:#1A2332}
.header{text-align:center;margin-bottom:40px;border-bottom:2px solid #4A90D9;padding-bottom:20px}
.header h1{color:#4A90D9;margin:0}
.header .lab{font-size:1.2em;margin-top:5px}
.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:15px;margin-bottom:30px}
.info-item{background:#F5F7FA;padding:10px 15px;border-radius:8px}
.info-item .label{font-size:0.75em;color:#5A6270;text-transform:uppercase}
.info-item .value{font-size:1.1em;font-weight:600;margin-top:2px}
.section{margin-bottom:25px}
.section h2{color:#1A2332;border-bottom:1px solid #E0E0E0;padding-bottom:5px}
.activity-list{list-style:none;padding:0}
.activity-list li{padding:8px 0;border-bottom:1px solid #E0E0E0;display:flex;align-items:center;gap:10px}
.activity-list li::before{content:"✓";color:#22C55E;font-weight:bold}
.observations{background:#F5F7FA;padding:15px;border-radius:8px;white-space:pre-wrap}
.footer{margin-top:40px;padding-top:20px;border-top:2px solid #4A90D9;text-align:center;font-size:0.85em;color:#5A6270}
@media print{body{padding:20px}}
</style></head><body>
<div class="header"><h1>🧪 Rapport de Shift</h1><p class="lab">${labName}</p>
<p style="color:#5A6270;font-size:0.9em">PharmaLab Assistant — Document indicatif</p></div>
<div class="info-grid">
<div class="info-item"><div class="label">Date</div><div class="value">${row.date||'—'}</div></div>
<div class="info-item"><div class="label">Analyste</div><div class="value">${row.analyst||'—'}</div></div>
<div class="info-item"><div class="label">Shift</div><div class="value">${shiftLabel}</div></div>
<div class="info-item"><div class="label">Généré le</div><div class="value">${generated}</div></div>
</div>
<div class="section"><h2>Activités</h2><ul class="activity-list">${activityItems}</ul></div>
${observationsHtml}
<div class="footer"><p>Document généré automatiquement par PharmaLab Assistant.</p>
<p>Ce rapport est un aide-mémoire et ne remplace pas la documentation GMP officielle.</p></div>
</body></html>`;

    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Search
app.get('/api/search', authMiddleware, async (req, res) => {
  try {
    const { q, type, status, dateFrom, dateTo } = req.query;
    if (!q) return res.json([]);
    const results = [];

    if (!type || type === 'analysis') {
      const rows = await dbAll(`SELECT id, sample_id as sampleId, product_name as productName, batch_lot as batchLot, status, 'analysis' as _type FROM analyses WHERE sample_id LIKE ? OR product_name LIKE ? OR batch_lot LIKE ?`, [`%${q}%`, `%${q}%`, `%${q}%`]);
      results.push(...rows);
    }
    if (!type || type === 'personnel') {
      const rows = await dbAll(`SELECT id, employee_id as employeeId, department, status, 'personnel' as _type FROM personnel_monitoring WHERE employee_id LIKE ? OR department LIKE ?`, [`%${q}%`, `%${q}%`]);
      results.push(...rows);
    }
    if (!type || type === 'water') {
      const rows = await dbAll(`SELECT id, sample_id as sampleId, water_type as waterType, sampling_point as samplingPoint, status, 'water' as _type FROM water_samples WHERE sample_id LIKE ? OR sampling_point LIKE ?`, [`%${q}%`, `%${q}%`]);
      results.push(...rows);
    }
    if (!type || type === 'media') {
      const rows = await dbAll(`SELECT id, medium_name as mediumName, lot_number as lotNumber, status, 'media' as _type FROM culture_media WHERE medium_name LIKE ? OR lot_number LIKE ?`, [`%${q}%`, `%${q}%`]);
      results.push(...rows);
    }
    if (!type || type === 'microorganism') {
      const rows = await dbAll(`SELECT id, name, 'microorganism' as _type FROM microorganisms WHERE name LIKE ?`, [`%${q}%`]);
      results.push(...rows);
    }
    if (!type || type === 'report') {
      const rows = await dbAll(`SELECT id, date, analyst, shift_label as shiftLabel, 'report' as _type FROM shift_reports WHERE date LIKE ? OR analyst LIKE ?`, [`%${q}%`, `%${q}%`]);
      results.push(...rows);
    }
    res.json(results.slice(0, 100));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Dashboard stats
app.get('/api/dashboard/stats', authMiddleware, async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const [a, p, w, rm, fp, pend, comp] = await Promise.all([
      dbGet('SELECT COUNT(*) as count FROM analyses WHERE date(analysis_date) = ?', [today]),
      dbGet('SELECT COUNT(*) as count FROM personnel_monitoring WHERE date(sampling_date) = ?', [today]),
      dbGet('SELECT COUNT(*) as count FROM water_samples WHERE date(sampling_date) = ?', [today]),
      dbGet('SELECT COUNT(*) as count FROM analyses WHERE product_type = ?', ['raw_material']),
      dbGet('SELECT COUNT(*) as count FROM analyses WHERE product_type = ?', ['finished_product']),
      dbGet('SELECT COUNT(*) as count FROM analyses WHERE status = ?', ['pending']),
      dbGet('SELECT COUNT(*) as count FROM analyses WHERE status = ?', ['completed']),
    ]);
    res.json({
      analysesToday: a?.count || 0,
      personnelToday: p?.count || 0,
      waterToday: w?.count || 0,
      rawMaterials: rm?.count || 0,
      finishedProducts: fp?.count || 0,
      pendingRecords: pend?.count || 0,
      completedRecords: comp?.count || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/dashboard/activity', authMiddleware, async (req, res) => {
  try {
    const rows = await dbAll(`
      SELECT 'analysis' as record_type, id, sample_id || ' - ' || COALESCE(product_name, '') as label, 'Analyses' as section, created_at as time, '🔬' as icon FROM analyses
      UNION ALL
      SELECT 'personnel' as record_type, id, employee_id || ' - ' || COALESCE(department, '') as label, 'Personnel' as section, created_at as time, '👥' as icon FROM personnel_monitoring
      UNION ALL
      SELECT 'water' as record_type, id, sample_id || ' - ' || COALESCE(water_type, '') as label, 'Eaux' as section, created_at as time, '💧' as icon FROM water_samples
      UNION ALL
      SELECT 'media' as record_type, id, medium_name as label, 'Milieux' as section, created_at as time, '🧫' as icon FROM culture_media
      ORDER BY time DESC LIMIT 10
    `);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Settings
app.get('/api/settings', authMiddleware, async (req, res) => {
  try {
    const rows = await dbAll('SELECT * FROM settings');
    const s = {};
    rows.forEach(r => { s[r.key] = r.value; });
    res.json(s);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/settings', authMiddleware, async (req, res) => {
  const { key, value } = req.body;
  try {
    await dbRun('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)', [key, value]);
    res.json({ key, value });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/backup', authMiddleware, async (req, res) => {
  try {
    const tables = ['users', 'analyses', 'personnel_monitoring', 'water_samples', 'culture_media', 'pre_poured_petri', 'media_inventory', 'microorganisms', 'shift_reports', 'settings', 'specifications', 'sop_references', 'audit_logs'];
    const backup = { version: 1, createdAt: new Date().toISOString(), tables: {} };
    for (const table of tables) backup.tables[table] = await dbAll(`SELECT * FROM ${table}`);
    res.json(backup);
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.post('/api/restore', authMiddleware, async (req, res) => {
  const backup = req.body;
  if (!backup?.tables || typeof backup.tables !== 'object') return res.status(400).json({ message: 'Invalid backup file' });
  const allowedTables = ['analyses', 'personnel_monitoring', 'water_samples', 'culture_media', 'pre_poured_petri', 'media_inventory', 'microorganisms', 'shift_reports', 'settings', 'specifications', 'sop_references'];
  try {
    let restored = 0;
    for (const table of allowedTables) {
      const rows = Array.isArray(backup.tables[table]) ? backup.tables[table] : [];
      for (const row of rows) {
        const columns = Object.keys(row).filter((column) => column !== 'id');
        if (!columns.length) continue;
        const placeholders = columns.map(() => '?').join(', ');
        await dbRun(`INSERT INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`, columns.map((column) => row[column]));
        restored += 1;
      }
    }
    await dbRun(`INSERT INTO audit_logs (user, action, record_type, record_id, new_value) VALUES (?, 'created', 'restore', 0, ?)`, [req.user.username, JSON.stringify({ restored })]);
    res.json({ restored });
  } catch (err) { res.status(500).json({ message: err.message }); }
});

app.get('/api/settings/specifications', authMiddleware, async (req, res) => {
  try {
    res.json(await dbAll('SELECT * FROM specifications ORDER BY name ASC'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/settings/specifications', authMiddleware, async (req, res) => {
  const { name, limit_val, unit } = req.body;
  try {
    const { lastID } = await dbRun('INSERT INTO specifications (name, limit_val, unit) VALUES (?, ?, ?)', [name, limit_val, unit]);
    res.status(201).json({ id: lastID, name, limit_val, unit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/settings/specifications/:id', authMiddleware, async (req, res) => {
  const { name, limit_val, unit } = req.body;
  try {
    await dbRun('UPDATE specifications SET name=?, limit_val=?, unit=? WHERE id=?', [name, limit_val, unit, req.params.id]);
    res.json({ id: req.params.id, name, limit_val, unit });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/settings/specifications/:id', authMiddleware, async (req, res) => {
  try {
    await dbRun('DELETE FROM specifications WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/settings/sops', authMiddleware, async (req, res) => {
  try {
    res.json(await dbAll('SELECT * FROM sop_references ORDER BY name ASC'));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/settings/sops', authMiddleware, async (req, res) => {
  const { name, refCode, ref_code } = req.body;
  const reference = refCode ?? ref_code ?? '';
  try {
    const { lastID } = await dbRun('INSERT INTO sop_references (name, ref_code) VALUES (?, ?)', [name, reference]);
    res.status(201).json({ id: lastID, name, refCode: reference, ref_code: reference });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/settings/sops/:id', authMiddleware, async (req, res) => {
  const { name, refCode, ref_code } = req.body;
  const reference = refCode ?? ref_code ?? '';
  try {
    await dbRun('UPDATE sop_references SET name = ?, ref_code = ? WHERE id = ?', [name, reference, req.params.id]);
    res.json({ id: req.params.id, name, refCode: reference, ref_code: reference });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/settings/sops/:id', authMiddleware, async (req, res) => {
  try {
    await dbRun('DELETE FROM sop_references WHERE id = ?', [req.params.id]);
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Audit
app.get('/api/audit', authMiddleware, async (req, res) => {
  try {
    const { page = '1', limit = '50' } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const rows = await dbAll('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ? OFFSET ?', [parseInt(limit), offset]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Seed demo data
async function seedDemoData() {
  const defaultAdminPassword = 'aymen1234';
  const defaultAnalystPassword = 'analyst1234';
  const userExists = await dbGet('SELECT id FROM users WHERE username = ?', ['admin']);

  if (!userExists) {
    const hashed = await bcrypt.hash(defaultAdminPassword, 10);
    await dbRun('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)', ['admin', hashed, 'Administrateur', 'admin']);
    console.log('Default admin user created (admin/aymen1234)');
  } else {
    const hashed = await bcrypt.hash(defaultAdminPassword, 10);
    await dbRun('UPDATE users SET password = ?, name = ?, role = ? WHERE username = ?', [hashed, 'Administrateur', 'admin', 'admin']);
    console.log('Default admin password reset to (admin/aymen1234)');
  }

  const analystExists = await dbGet('SELECT id FROM users WHERE username = ?', ['analyst']);
  if (!analystExists) {
    const hashedAnalyst = await bcrypt.hash(defaultAnalystPassword, 10);
    await dbRun('INSERT INTO users (username, password, name, role) VALUES (?, ?, ?, ?)', ['analyst', hashedAnalyst, 'Analyste', 'analyst']);
    console.log('Default analyst user created (analyst/analyst1234)');
  }

  const mediaCount = await dbGet('SELECT COUNT(*) as count FROM culture_media');
  if (mediaCount?.count === 0) {
    await dbRun(`INSERT INTO culture_media (medium_name, manufacturer, lot_number, preparation_date, expiry_date, quantity_prepared, quantity_used, quantity_remaining, storage_conditions, prepared_by, unit, is_demo) VALUES
      ('TSA p/r blood agar', 'BioMérieux', 'LOT-DEMO-001', date('now', '-10 days'), date('now', '+50 days'), 500, 120, 380, '4°C', 'J. Dupont', 'g', 1)`);
    await dbRun(`INSERT INTO culture_media (medium_name, manufacturer, lot_number, preparation_date, expiry_date, quantity_prepared, quantity_used, quantity_remaining, storage_conditions, prepared_by, unit, is_demo) VALUES
      ('TSA p/r soy agar', 'BD Difco', 'LOT-DEMO-002', date('now', '-5 days'), date('now', '+25 days'), 300, 80, 220, '4°C', 'M. Martin', 'g', 1)`);
    await dbRun(`INSERT INTO culture_media (medium_name, manufacturer, lot_number, preparation_date, expiry_date, quantity_prepared, quantity_used, quantity_remaining, storage_conditions, prepared_by, unit, is_demo) VALUES
      ('CASO agar', 'Merck', 'LOT-DEMO-003', date('now', '-15 days'), date('now', '-2 days'), 200, 190, 10, '2-8°C', 'S. Bernard', 'g', 1)`);
    console.log('Demo culture media inserted');
  }

  const microCount = await dbGet('SELECT COUNT(*) as count FROM microorganisms');
  if (microCount?.count === 0) {
    await dbRun(`INSERT INTO microorganisms (name, alternative_name, sop_ref, notes, is_demo) VALUES ('E. coli', 'Escherichia coli', 'SOP-MIC-001', 'Germe spécifié - présence dans les eaux', 1)`);
    await dbRun(`INSERT INTO microorganisms (name, alternative_name, sop_ref, notes, is_demo) VALUES ('P. aeruginosa', 'Pseudomonas aeruginosa', 'SOP-MIC-002', 'Germe spécifié - présence dans les eaux', 1)`);
    await dbRun(`INSERT INTO microorganisms (name, alternative_name, sop_ref, notes, is_demo) VALUES ('S. aureus', 'Staphylococcus aureus', 'SOP-MIC-003', 'Contrôle personnel - coagulase positif', 1)`);
    await dbRun(`INSERT INTO microorganisms (name, alternative_name, sop_ref, notes, is_demo) VALUES ('Salmonella spp.', 'Salmonella', 'SOP-MIC-004', 'Recherche dans les matières premières', 1)`);
    console.log('Demo microorganisms inserted');
  }

  const specCount = await dbGet('SELECT COUNT(*) as count FROM specifications');
  if (specCount?.count === 0) {
    await dbRun('INSERT INTO specifications (name, limit_val, unit) VALUES (?, ?, ?)', ['UFC/100mL eau purifiée', '100', 'UFC/100mL']);
    await dbRun('INSERT INTO specifications (name, limit_val, unit) VALUES (?, ?, ?)', ['UFC/100mL WFI', '10', 'UFC/100mL']);
    await dbRun('INSERT INTO specifications (name, limit_val, unit) VALUES (?, ?, ?)', ['Revêche TSA 72h', '45', 'mm']);
    console.log('Demo specifications inserted');
  }

  const sopCount = await dbGet('SELECT COUNT(*) as count FROM sop_references');
  if (sopCount?.count === 0) {
    await dbRun("INSERT INTO sop_references (name, ref_code) VALUES (?, ?)", ["Contrôle microbiologique de l'eau", 'SOP-EAU-001']);
    await dbRun("INSERT INTO sop_references (name, ref_code) VALUES (?, ?)", ['Contrôle du personnel', 'SOP-PERS-001']);
    await dbRun("INSERT INTO sop_references (name, ref_code) VALUES (?, ?)", ["Méthode d'analyse - UFC", 'SOP-MIC-001']);
    console.log('Demo SOPs inserted');
  }
}

async function checkMediaExpiryEmails() {
  const { RESEND_API_KEY, SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO } = process.env;
  const hasResend = Boolean(RESEND_API_KEY && EMAIL_FROM && EMAIL_TO);
  const hasSmtp = Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS && EMAIL_FROM && EMAIL_TO);
  if (!hasResend && !hasSmtp) {
    console.log('Email notifications disabled: configure RESEND_API_KEY, EMAIL_FROM, and EMAIL_TO (or SMTP settings)');
    return;
  }

  const warningDays = Number.parseInt(process.env.MEDIA_EXPIRY_WARNING_DAYS || '10', 10);
  const days = Number.isFinite(warningDays) && warningDays > 0 ? warningDays : 10;
  const media = await dbAll(
    `SELECT id, medium_name, lot_number, expiry_date, manufacturer
     FROM culture_media
     WHERE expiry_date IS NOT NULL AND expiry_date <= date('now', ?)
     ORDER BY expiry_date ASC`,
    [`+${days} days`],
  );
  if (!media.length) {
    console.log(`No culture media expiring within ${days} days`);
    return;
  }

  const pending = [];
  for (const item of media) {
    const notificationKey = `media:${item.id}:${item.expiry_date}`;
    const sent = await dbGet('SELECT id FROM email_notifications WHERE notification_key = ?', [notificationKey]);
    if (!sent) pending.push(item);
  }
  if (!pending.length) {
    console.log('No new culture-media expiry emails to send');
    return;
  }

  const lines = pending.map((item) => {
    const status = new Date(`${item.expiry_date}T23:59:59`) < new Date() ? 'EXPIRED' : 'EXPIRING SOON';
    return `- ${item.medium_name} | Lot: ${item.lot_number || 'N/A'} | Expiry: ${item.expiry_date} | ${status}`;
  });
  const subject = `Culture media expiry alert (${pending.length})`;
  const text = `The following culture media batches require attention:\n\n${lines.join('\n')}`;
  if (hasResend) {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: [EMAIL_TO], subject, text }),
    });
    if (!response.ok) throw new Error(`Resend returned HTTP ${response.status}: ${await response.text()}`);
    console.log('Email sent through Resend');
  } else {
    const port = Number.parseInt(SMTP_PORT || '587', 10);
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port,
      secure: port === 465,
      auth: { user: SMTP_USER, pass: SMTP_PASS },
    });
    await transporter.sendMail({ from: EMAIL_FROM, to: EMAIL_TO, subject, text });
    console.log('Email sent through SMTP');
  }
  for (const item of pending) {
    await dbRun('INSERT INTO email_notifications (notification_key) VALUES (?)', [`media:${item.id}:${item.expiry_date}`]);
  }
  console.log(`Sent ${pending.length} culture-media expiry email notification(s)`);
}

// Start
initDb().then(() => {
  seedDemoData().then(() => {
    console.log('Database initialized and demo data seeded');
    checkMediaExpiryEmails().catch((err) => console.error('Email notification error:', err.message));
    setInterval(() => {
      checkMediaExpiryEmails().catch((err) => console.error('Email notification error:', err.message));
    }, 24 * 60 * 60 * 1000);
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`PharmaLab API server running on http://0.0.0.0:${PORT}`);
    });
  }).catch(err => console.error('Seed error:', err));
}).catch(err => console.error('DB init error:', err));
