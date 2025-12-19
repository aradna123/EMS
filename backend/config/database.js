const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT, 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false, // local = false
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Event listeners
pool.on('connect', () => console.log('✅ Local PostgreSQL connected'));
pool.on('error', (err) => console.error('❌ PostgreSQL error:', err.message));

// Test connection
pool.query('SELECT NOW()')
  .then(() => console.log('✅ Local PostgreSQL DB working'))
  .catch(err => console.error('❌ Local DB connection failed:', err.message));

module.exports = pool;

