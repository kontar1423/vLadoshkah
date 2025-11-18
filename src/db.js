import 'dotenv/config'; // ES modules эквивалент require('dotenv').config()
import { Pool } from 'pg';
import logger from './logger.js';

const pool = new Pool({
  user: process.env.PGUSER || 'postgres',
  host: process.env.PGHOST || 'localhost',
  database: process.env.PGDATABASE || 'volunteer_db',
  password: process.env.PGPASSWORD || '1234',
  port: Number(process.env.PGPORT) || 5432,
});

pool.on('connect', () => {
  logger.info('DB: pool connected');
});

pool.on('acquire', () => {
  logger.debug('DB: client acquired');
});

pool.on('error', (err) => {
  logger.error(err, 'DB: unexpected error on idle client');
});

process.on('SIGINT', async () => {
  try {
    await pool.end();
    logger.info('DB: pool ended');
  } finally {
    process.exit(0);
  }
});

// Добавляем named export query
export const query = (text, params) => pool.query(text, params);

// Сохраняем default export
export default pool;