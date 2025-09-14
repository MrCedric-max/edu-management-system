const { Pool } = require('pg');
require('dotenv').config();

// Production database configuration
const pool = new Pool(
  process.env.DATABASE_URL ? 
    {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    } :
    {
      user: process.env.DB_USER || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      database: process.env.DB_NAME || 'educational_management',
      password: process.env.DB_PASSWORD || 'password',
      port: process.env.DB_PORT || 5432,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    }
);

// Test database connection
pool.on('connect', () => {
  console.log('📊 Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('❌ Unexpected error on idle client', err);
  process.exit(-1);
});

// Database connection wrapper
const db = {
  async query(text, params) {
    const start = Date.now();
    try {
      const res = await pool.query(text, params);
      const duration = Date.now() - start;
      console.log('📝 Executed query', { text, duration, rows: res.rowCount });
      return res;
    } catch (error) {
      console.error('❌ Database query error:', error);
      // Don't throw error, return empty result instead
      return { rows: [], rowCount: 0 };
    }
  },

  async connect() {
    try {
      // Test connection with a simple query
      await pool.query('SELECT NOW()');
      console.log('✅ Database pool connected');
    } catch (error) {
      console.error('❌ Database connection failed:', error);
      throw error;
    }
  },

  async close() {
    try {
      await pool.end();
      console.log('🔌 Database pool closed');
    } catch (error) {
      console.error('❌ Error closing database pool:', error);
      throw error;
    }
  },

  // Get a client from the pool
  async getClient() {
    return await pool.connect();
  }
};

module.exports = db;
