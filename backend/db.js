const { Pool } = require('pg');
require('dotenv').config({ path: require('path').join(__dirname, '../.env'), quiet: true });
if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 12, statement_timeout: 15000,
  application_name: 'dynamic-ui-platform', ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: true } : undefined });
module.exports = pool;
