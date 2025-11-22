const request = require('supertest');

jest.mock('../services/animalsService', () => ({
  getAllAnimals: jest.fn().mockResolvedValue([{ id: 1 }]),
  getAnimalById: jest.fn().mockImplementation(async (id) => id === 1 ? { id: 1 } : null),
  createAnimal: jest.fn().mockImplementation(async (body) => ({ id: 2, ...body })),
  updateAnimal: jest.fn().mockImplementation(async (id, body) => id === 1 ? ({ id, ...body }) : null),
  removeAnimal: jest.fn().mockImplementation(async (id) => id === 1 ? ({ id: 1 }) : null)
}));

const app = require('../index');

describe('Animals routes', () => {
  test('GET /animals returns 200 with list', async () => {
    const res = await request(app).get('/animals');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /animals/1 returns 200 with item', async () => {
    const res = await request(app).get('/animals/1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1 });
  });

  test('GET /animals/999 returns 404', async () => {
    const res = await request(app).get('/animals/999');
    expect(res.status).toBe(404);
  });

  test('POST /animals returns 201', async () => {
    const res = await request(app).post('/animals').send({ name: 'Rex', age: 3, type: 'dog', shelter_id: 1 });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  test('PUT /animals/1 returns 200 when updated', async () => {
    const res = await request(app).put('/animals/1').send({ name: 'Rex', age: 4, type: 'dog', shelter_id: 1 });
    expect(res.status).toBe(200);
  });

  test('PUT /animals/999 returns 404 when not found', async () => {
    const res = await request(app).put('/animals/999').send({ name: 'Rex', age: 4, type: 'dog', shelter_id: 1 });
    expect(res.status).toBe(404);
  });

  test('DELETE /animals/1 returns 204', async () => {
    const res = await request(app).delete('/animals/1');
    expect(res.status).toBe(204);
  });
});


