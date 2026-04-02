const mysql = require('mysql2/promise');

function createPool(includeDatabase) {
  const config = {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: (process.env.DB_HOST && process.env.DB_HOST !== '127.0.0.1' && process.env.DB_HOST !== 'localhost') ? { rejectUnauthorized: false } : undefined
  };

  if (includeDatabase !== false) {
    config.database = process.env.DB_NAME || 'greentrack';
  }

  return mysql.createPool(config);
}

module.exports = { createPool };
