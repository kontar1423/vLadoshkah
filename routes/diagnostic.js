// routes/diagnostic.js
import express from 'express';
import { query } from '../db.js';
import { info, error } from '../logger.js';

const router = express.Router();

// Простой тест подключения к БД
router.get('/db', async (req, res) => {
  try {
    info('Testing database connection');
    const result = await query('SELECT version(), current_database(), current_user');
    
    res.json({
      status: 'success',
      database: {
        version: result.rows[0].version,
        name: result.rows[0].current_database,
        user: result.rows[0].current_user
      }
    });
  } catch (err) {
    error({ err: { message: err.message, stack: err.stack } }, 'Database connection test failed');
    res.status(500).json({
      status: 'error',
      error: err.message,
      details: 'Check if database is running and accessible'
    });
  }
});

// Проверка таблицы animals
router.get('/animals-table', async (req, res) => {
  try {
    const result = await query(`
      SELECT 
        table_name,
        column_name,
        data_type,
        is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'animals'
      ORDER BY ordinal_position
    `);
    
    res.json({
      status: 'success',
      table: 'animals',
      columns: result.rows
    });
  } catch (err) {
    error({ err }, 'Failed to check animals table');
    res.status(500).json({
      status: 'error',
      error: err.message
    });
  }
});

// Простой запрос к animals
router.get('/animals-data', async (req, res) => {
  try {
    const result = await query('SELECT * FROM animals LIMIT 5');
    
    res.json({
      status: 'success',
      count: result.rows.length,
      animals: result.rows
    });
  } catch (err) {
    error({ err }, 'Failed to fetch animals data');
    res.status(500).json({
      status: 'error',
      error: err.message
    });
  }
});

export default router;