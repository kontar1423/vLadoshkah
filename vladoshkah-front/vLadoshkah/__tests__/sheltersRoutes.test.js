const request = require('supertest');

jest.mock('../services/sheltersService', () => ({
  getAllShelters: jest.fn().mockResolvedValue([{ id: 1, name: 'A' }]),
  getShelterById: jest.fn().mockImplementation(async (id) => id === 1 ? { id: 1, name: 'A' } : null),
  createShelter: jest.fn().mockImplementation(async (body) => ({ id: 2, ...body })),
  updateShelter: jest.fn().mockImplementation(async (id, body) => id === 1 ? ({ id, ...body }) : null),
  removeShelter: jest.fn().mockImplementation(async (id) => id === 1 ? ({ id: 1 }) : null)
}));

const app = require('../index');

describe('Shelters routes', () => {
  test('GET /shelters returns 200', async () => {
    const res = await request(app).get('/shelters');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('GET /shelters/1 returns 200', async () => {
    const res = await request(app).get('/shelters/1');
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ id: 1 });
  });

  test('GET /shelters/999 returns 404', async () => {
    const res = await request(app).get('/shelters/999');
    expect(res.status).toBe(404);
  });

  test('POST /shelters returns 201', async () => {
    const res = await request(app).post('/shelters').send({ name: 'Home' });
    expect(res.status).toBe(201);
    expect(res.body.id).toBeDefined();
  });

  test('PUT /shelters/1 returns 200', async () => {
    const res = await request(app).put('/shelters/1').send({ name: 'New' });
    expect(res.status).toBe(200);
  });

  test('PUT /shelters/999 returns 404', async () => {
    const res = await request(app).put('/shelters/999').send({ name: 'New' });
    expect(res.status).toBe(404);
  });

  test('DELETE /shelters/1 returns 204', async () => {
    const res = await request(app).delete('/shelters/1');
    expect(res.status).toBe(204);
  });
});


