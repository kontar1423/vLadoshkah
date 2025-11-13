jest.mock('../db', () => ({
  query: jest.fn()
}));

const pool = require('../db');
const animalsDao = require('../dao/animalsDao');

describe('animalsDao', () => {
  afterEach(() => jest.clearAllMocks());

  test('getAll queries and returns rows', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 1 }] });
    const rows = await animalsDao.getAll();
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM animals ORDER BY id');
    expect(rows).toEqual([{ id: 1 }]);
  });

  test('getById queries with param', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 5 }] });
    const row = await animalsDao.getById(5);
    expect(pool.query).toHaveBeenCalledWith('SELECT * FROM animals WHERE id=$1', [5]);
    expect(row).toEqual({ id: 5 });
  });

  test('create inserts and returns row', async () => {
    pool.query.mockResolvedValue({ rows: [{ id: 9, name: 'Rex', age: 3, type: 'dog', shelter_id: 1 }] });
    const row = await animalsDao.create({ name: 'Rex', age: 3, type: 'dog', shelter_id: 1 });
    expect(pool.query).toHaveBeenCalled();
    expect(row).toMatchObject({ id: 9, name: 'Rex' });
  });

  test('update updates and returns row', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 9, name: 'B', age: 4, type: 'dog', shelter_id: 1 }] });
    const row = await animalsDao.update(9, { name: 'B', age: 4, type: 'dog', shelter_id: 1 });
    expect(pool.query).toHaveBeenCalled();
    expect(row).toMatchObject({ id: 9, name: 'B' });
  });

  test('remove deletes and returns row', async () => {
    pool.query.mockResolvedValue({ rowCount: 1, rows: [{ id: 9 }] });
    const row = await animalsDao.remove(9);
    expect(pool.query).toHaveBeenCalled();
    expect(row).toEqual({ id: 9 });
  });
});


