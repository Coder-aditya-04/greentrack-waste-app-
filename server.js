require('dotenv').config();
const express = require('express');
const path = require('path');
const { randomUUID } = require('crypto');
const { createPool } = require('./db');

const app = express();
let pool;
const PORT = Number(process.env.PORT || 3000);
const DB_NAME = process.env.DB_NAME || 'greentrack';
const SAFE_DB_NAME = DB_NAME.replace(/[^a-zA-Z0-9_]/g, '');

const seedZones = [
  { zone_id: 'Z-01', name: 'Library' },
  { zone_id: 'Z-02', name: 'Cafeteria' },
  { zone_id: 'Z-03', name: 'Hostel Block A' },
  { zone_id: 'Z-04', name: 'Main Gate' },
  { zone_id: 'Z-05', name: 'Sports Complex' }
];
const seedGroups = ['Group Alpha', 'Group Beta', 'Group Gamma', 'Group Delta'];

/* --- ID Utility --- */
function makeId(prefix) {
  return `${prefix}-${randomUUID()}`;
}

/* --- Database Bootstrap and Seed --- */
async function bootstrapDatabase() {
  const bootstrapPool = createPool(false);
  await bootstrapPool.query(`CREATE DATABASE IF NOT EXISTS ${SAFE_DB_NAME}`);
  await bootstrapPool.end();

  pool = createPool(true);

  await pool.query(
    `CREATE TABLE IF NOT EXISTS users (
      user_id VARCHAR(64) PRIMARY KEY,
      name VARCHAR(150) NOT NULL,
      email VARCHAR(190) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL,
      role ENUM('student', 'bis_member') NOT NULL,
      group_name VARCHAR(100) NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS cleaning_logs (
      log_id VARCHAR(64) PRIMARY KEY,
      zone_id VARCHAR(10) NOT NULL,
      group_name VARCHAR(100) NOT NULL,
      before_image_data LONGTEXT NOT NULL,
      after_image_data LONGTEXT NOT NULL,
      timestamp DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS issue_reports (
      report_id VARCHAR(64) PRIMARY KEY,
      zone_id VARCHAR(10) NOT NULL,
      description TEXT NOT NULL,
      status ENUM('Pending', 'Resolved') NOT NULL DEFAULT 'Pending',
      image_data LONGTEXT NULL,
      timestamp DATETIME NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS zones (
      zone_id VARCHAR(10) PRIMARY KEY,
      name VARCHAR(120) NOT NULL UNIQUE
    )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS bis_groups (
      group_name VARCHAR(100) PRIMARY KEY
    )`
  );

  for (const zone of seedZones) {
    await pool.query('INSERT IGNORE INTO zones (zone_id, name) VALUES (?, ?)', [zone.zone_id, zone.name]);
  }

  for (const groupName of seedGroups) {
    await pool.query('INSERT IGNORE INTO bis_groups (group_name) VALUES (?)', [groupName]);
  }

  const [usersCountRows] = await pool.query('SELECT COUNT(*) AS count FROM users');
  if (usersCountRows[0].count === 0) {
    await pool.query(
      'INSERT INTO users (user_id, name, email, password, role, group_name) VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)',
      [
        makeId('usr'),
        'Ananya Singh',
        'ananya@campus.edu',
        'greentrack123',
        'bis_member',
        'Group Alpha',
        makeId('usr'),
        'Rohan Mehta',
        'rohan@campus.edu',
        'greentrack123',
        'student',
        'Group Beta'
      ]
    );
  }

  const [logsCountRows] = await pool.query('SELECT COUNT(*) AS count FROM cleaning_logs');
  if (logsCountRows[0].count === 0) {
    const now = new Date();
    const beforeSvg = "data:image/svg+xml;base64," + Buffer.from("<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480'><rect width='100%' height='100%' fill='#a63d40'/><text x='50%' y='50%' text-anchor='middle' fill='white' font-size='36' font-family='Arial' dy='.3em'>Before</text></svg>").toString('base64');
    const afterSvg = "data:image/svg+xml;base64," + Buffer.from("<svg xmlns='http://www.w3.org/2000/svg' width='640' height='480'><rect width='100%' height='100%' fill='#2f855a'/><text x='50%' y='50%' text-anchor='middle' fill='white' font-size='36' font-family='Arial' dy='.3em'>After</text></svg>").toString('base64');

    await pool.query(
      'INSERT INTO cleaning_logs (log_id, zone_id, group_name, before_image_data, after_image_data, timestamp) VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)',
      [
        makeId('log'),
        'Z-01',
        'Group Beta',
        beforeSvg,
        afterSvg,
        new Date(now.getTime() - 2 * 86400000),
        makeId('log'),
        'Z-02',
        'Group Alpha',
        beforeSvg,
        afterSvg,
        new Date(now.getTime() - 86400000),
        makeId('log'),
        'Z-03',
        'Group Beta',
        beforeSvg,
        afterSvg,
        new Date(now.getTime() - 43200000)
      ]
    );
  }

  const [reportsCountRows] = await pool.query('SELECT COUNT(*) AS count FROM issue_reports');
  if (reportsCountRows[0].count === 0) {
    const now = new Date();
    await pool.query(
      'INSERT INTO issue_reports (report_id, zone_id, description, status, image_data, timestamp) VALUES (?, ?, ?, ?, ?, ?), (?, ?, ?, ?, ?, ?)',
      [
        makeId('rep'),
        'Z-04',
        'Litter near parking area',
        'Resolved',
        null,
        new Date(now.getTime() - 43200000),
        makeId('rep'),
        'Z-05',
        'Overflowing dry waste bin',
        'Pending',
        null,
        new Date(now.getTime() - 7200000)
      ]
    );
  }
}

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

/* --- Metadata API --- */
app.get('/api/meta', async (req, res) => {
  try {
    const [zones] = await pool.query('SELECT zone_id, name FROM zones ORDER BY zone_id ASC');
    const [groups] = await pool.query('SELECT group_name FROM bis_groups ORDER BY group_name ASC');
    res.json({ zones, groups: groups.map((g) => g.group_name) });
  } catch (error) {
    res.status(500).json({ message: 'Failed to load metadata.' });
  }
});

/* --- Authentication APIs --- */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { name, email, password, role, group_name } = req.body;
    const normalizedName = String(name || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '').trim();
    const normalizedRole = String(role || '').trim();
    const normalizedGroup = group_name ? String(group_name).trim() : null;
    if (!normalizedName || !normalizedEmail || !normalizedPassword || !normalizedRole) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    if (!['student', 'bis_member'].includes(normalizedRole)) {
      return res.status(400).json({ message: 'Invalid role.' });
    }

    if (normalizedPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters.' });
    }

    const [existing] = await pool.query('SELECT user_id FROM users WHERE email = ? LIMIT 1', [normalizedEmail]);
    if (existing.length) {
      return res.status(409).json({ message: 'Email already exists.' });
    }

    const user = {
      user_id: makeId('usr'),
      name: normalizedName,
      email: normalizedEmail,
      password: normalizedPassword,
      role: normalizedRole,
      group_name: normalizedGroup || null
    };

    await pool.query(
      'INSERT INTO users (user_id, name, email, password, role, group_name) VALUES (?, ?, ?, ?, ?, ?)',
      [user.user_id, user.name, user.email, user.password, user.role, user.group_name]
    );

    res.status(201).json({
      message: 'Signup successful.',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        group_name: user.group_name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Signup failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '').trim();
    if (!normalizedEmail || !normalizedPassword) {
      return res.status(400).json({ message: 'Email and password are required.' });
    }

    const [rows] = await pool.query(
      'SELECT user_id, name, email, password, role, group_name FROM users WHERE email = ? LIMIT 1',
      [normalizedEmail]
    );

    if (!rows.length || rows[0].password !== normalizedPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' });
    }

    const user = rows[0];
    res.json({
      message: 'Login successful.',
      user: {
        user_id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        group_name: user.group_name
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Login failed.' });
  }
});

/* --- Cleaning Log APIs --- */
app.get('/api/cleaning-logs', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT log_id, zone_id, group_name, before_image_data, after_image_data, timestamp FROM cleaning_logs ORDER BY timestamp DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load cleaning logs.' });
  }
});

app.post('/api/cleaning-logs', async (req, res) => {
  try {
    const { zone_id, group_name, before_image_data, after_image_data, timestamp } = req.body;
    if (!zone_id || !group_name || !before_image_data || !after_image_data || !timestamp) {
      return res.status(400).json({ message: 'Missing required log fields.' });
    }

    const log = {
      log_id: makeId('log'),
      zone_id,
      group_name,
      before_image_data,
      after_image_data,
      timestamp: new Date(timestamp)
    };

    await pool.query(
      'INSERT INTO cleaning_logs (log_id, zone_id, group_name, before_image_data, after_image_data, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [log.log_id, log.zone_id, log.group_name, log.before_image_data, log.after_image_data, log.timestamp]
    );

    res.status(201).json({ message: 'Cleaning log saved.', log });
  } catch (error) {
    res.status(500).json({ message: 'Failed to save cleaning log.' });
  }
});

/* --- Issue Report APIs --- */
app.get('/api/issues', async (req, res) => {
  try {
    const [rows] = await pool.query(
      'SELECT report_id, zone_id, description, status, image_data, timestamp FROM issue_reports ORDER BY timestamp DESC'
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to load issues.' });
  }
});

app.post('/api/issues', async (req, res) => {
  try {
    const { zone_id, description, status, image_data, timestamp } = req.body;
    if (!zone_id || !description) {
      return res.status(400).json({ message: 'Zone and description are required.' });
    }

    const report = {
      report_id: makeId('rep'),
      zone_id,
      description,
      status: status || 'Pending',
      image_data: image_data || null,
      timestamp: timestamp ? new Date(timestamp) : new Date()
    };

    await pool.query(
      'INSERT INTO issue_reports (report_id, zone_id, description, status, image_data, timestamp) VALUES (?, ?, ?, ?, ?, ?)',
      [report.report_id, report.zone_id, report.description, report.status, report.image_data, report.timestamp]
    );

    res.status(201).json({ message: 'Issue reported.', report });
  } catch (error) {
    res.status(500).json({ message: 'Failed to submit issue.' });
  }
});

/* --- Static Frontend Hosting --- */
app.use(express.static(path.resolve(__dirname)));

app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, 'index.html'));
});

bootstrapDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`GreenTrack server running at http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Database bootstrap failed:', error.message);
    process.exit(1);
  });
