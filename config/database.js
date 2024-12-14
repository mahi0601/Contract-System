const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'contracts',
  password: process.env.DB_PASSWORD || '1234',
  port: process.env.DB_PORT || 5000,
});

module.exports = pool;
