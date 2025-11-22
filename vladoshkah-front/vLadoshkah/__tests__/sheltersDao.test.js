jest.mock('../db', () => ({
  query: jest.fn()
}));

const pool = require('../db');
const sheltersDao = require('../dao/sheltersDao');

describe('sheltersDao', () => {
  afterEach(() => jest.clearAllMocks());

  test('getAll queries and returns rows', async () => {
    pool.query.mockResolvedValue({ rowCount: 2, rows: [{ id: 1 }, { id: 2 }] });
    const rows = await sheltersDao.getAll();
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM shelters ORDER BY id');
    expect(rows).toHaveLength(2);
  });

  test('getById queries with param', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 1 }] });
    const row = await sheltersDao.getById(1);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM shelters WHERE id=$1', [1]);
    expect(row).toEqual({ id: 1 });
  });

  test('create inserts and returns row', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 3, name: 'A' }] });
    const row = await sheltersDao.create('A');
    expect(pool.query).toHaveBeenCalled();
    expect(row).toEqual({ id: 3, name: 'A' });
  });

  test('update updates and returns row', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 3, name: 'B' }] });
    const row = await sheltersDao.update(3, 'B');
    expect(pool.query).toHaveBeenCalled();
    expect(row).toEqual({ id: 3, name: 'B' });
  });

  test('remove deletes and returns row', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 5 }] });
    const row = await sheltersDao.remove(5);
    expect(pool.query).toHaveBeenCalled();
    expect(row).toEqual({ id: 5 });
  });
});


