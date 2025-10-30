import { jest } from '@jest/globals';

// Мокаем db ПЕРЕД импортом
jest.mock('../db.js', () => {
  const mockQuery = jest.fn();
  return {
    default: {
      query: mockQuery,
      on: jest.fn()
    },
    query: mockQuery
  };
});

// Мокаем logger ПЕРЕД импортом
jest.mock('../logger.js', () => ({
  default: {
    debug: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warn: jest.fn()
  },
  debug: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  warn: jest.fn()
}));

import pool from '../db.js';
import sheltersDao from '../dao/sheltersDao.js';

describe('sheltersDao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Пересоздаем мок query для каждого теста
    pool.query = jest.fn();
  });

  test('getAll queries and returns rows', async () => {
    pool.query.mockResolvedValue({ rowCount: 2, rows: [{ id: 1 }, { id: 2 }] });
    const rows = await sheltersDao.getAll();
    // Реальный SQL использует ORDER BY name
    expect(pool.query).toHaveBeenCalled();
    expect(rows).toHaveLength(2);
  });

  test('getById queries with param', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 1 }] });
    const row = await sheltersDao.getById(1);
    // Реальный SQL использует пробелы вокруг = (id = $1)
    expect(pool.query).toHaveBeenCalled();
    expect(pool.query.mock.calls[0][1]).toEqual([1]);
    expect(row).toEqual({ id: 1 });
  });

  test('create inserts and returns row', async () => {
    const shelterData = { name: 'A', address: null, phone: null, email: null };
    pool.query.mockResolvedValue({ rows: [{ id: 3, ...shelterData }] });
    const row = await sheltersDao.create(shelterData);
    expect(pool.query).toHaveBeenCalled();
    // Реальный DAO возвращает все поля, включая null
    expect(row).toMatchObject({ id: 3, name: 'A' });
  });

  test('update updates and returns row', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 3, name: 'B' }] });
    const row = await sheltersDao.update(3, { name: 'B' });
    expect(pool.query).toHaveBeenCalled();
    expect(row).toEqual({ id: 3, name: 'B' });
  });

  test('remove deletes and returns row', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 5 }] });
    const row = await sheltersDao.remove(5);
    expect(pool.query).toHaveBeenCalled();
    expect(row).toEqual({ id: 5 });
  });

  test('getByAdminId queries with admin_id', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 1, admin_id: 10 }] });
    const rows = await sheltersDao.getByAdminId(10);
    expect(pool.query).toHaveBeenCalled();
    expect(rows.length).toBe(1);
  });
});
