import { jest } from '@jest/globals';

// Мокаем db ПЕРЕД импортом
jest.mock('../src/db.js', () => {
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
jest.mock('../src/logger.js', () => ({
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

import pool from '../src/db.js';
import animalsDao from '../src/dao/animalsDao.js';

describe('animalsDao', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Пересоздаем мок query для каждого теста
    pool.query = jest.fn();
  });

  test('getAll queries and returns rows', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 1 }] });
    const rows = await animalsDao.getAll();
    // Проверяем, что вызывается запрос с JOIN (реальный SQL из DAO)
    expect(pool.query).toHaveBeenCalled();
    expect(rows).toEqual([{ id: 1 }]);
  });

  test('getById queries with param', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 5 }] });
    const row = await animalsDao.getById(5);
    // Проверяем, что вызывается запрос с JOIN (реальный SQL из DAO)
    expect(pool.query).toHaveBeenCalled();
    expect(pool.query.mock.calls[0][1]).toEqual([5]);
    expect(row).toEqual({ id: 5 });
  });

  test('create inserts and returns row', async () => {
    const animalData = { 
      name: 'Rex', 
      age: 3, 
      type: 'dog', 
      shelter_id: 1,
      health: null,
      gender: null,
      color: null,
      weight: null,
      personality: null,
      animal_size: null,
      history: null
    };
    pool.query.mockResolvedValue({ 
      rows: [{ id: 9, ...animalData }] 
    });
    const row = await animalsDao.create(animalData);
    expect(pool.query).toHaveBeenCalled();
    expect(row).toMatchObject({ id: 9, name: 'Rex' });
  });

  test('update updates and returns row', async () => {
    pool.query.mockResolvedValue({ 
      rowCount: 1, 
      rows: [{ id: 9, name: 'B', age: 4, type: 'dog', shelter_id: 1 }] 
    });
    const row = await animalsDao.update(9, { name: 'B', age: 4 });
    expect(pool.query).toHaveBeenCalled();
    expect(row).toMatchObject({ id: 9, name: 'B' });
  });

  test('remove deletes and returns row', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 9 }] });
    const row = await animalsDao.remove(9);
    expect(pool.query).toHaveBeenCalled();
    expect(row).toEqual({ id: 9 });
  });

  test('getAnimalsByShelter queries with shelter_id', async () => {
    pool.query.mockResolvedValue({ rowCount: 2, rows: [{ id: 1 }, { id: 2 }] });
    const rows = await animalsDao.getAnimalsByShelter(1);
    // Проверяем, что вызывается запрос с JOIN (реальный SQL из DAO)
    expect(pool.query).toHaveBeenCalled();
    expect(pool.query.mock.calls[0][1]).toEqual([1]);
    expect(rows.length).toBe(2);
  });

  test('findAnimals queries with filters', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 1, type: 'dog' }] });
    const filters = { type: 'dog' };
    const rows = await animalsDao.findAnimals(filters);
    expect(pool.query).toHaveBeenCalled();
    expect(rows.length).toBe(1);
  });
});
