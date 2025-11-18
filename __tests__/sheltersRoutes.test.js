import request from 'supertest';
import { jest } from '@jest/globals';

// Мокаем initMinio ПЕРЕД импортом app
jest.mock('../src/initMinio.js', () => ({
  default: jest.fn().mockResolvedValue(undefined)
}));

// Импортируем app и сервисы
import app from '../src/index.js';
import { generateTestToken, authHeader } from './helpers/authHelper.js';
import sheltersService from '../src/services/sheltersService.js';

describe('Shelters routes', () => {
  const adminToken = generateTestToken({ role: 'admin' });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Мокаем методы сервиса используя jest.spyOn
    jest.spyOn(sheltersService, 'getAllShelters').mockResolvedValue([{ id: 1, name: 'Home Shelter', photos: [] }]);
    jest.spyOn(sheltersService, 'getShelterById').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? { id: 1, name: 'Home Shelter', photos: [] } : null);
    });
    jest.spyOn(sheltersService, 'createShelter').mockImplementation((body) => {
      return Promise.resolve({ id: 2, ...body, photos: [] });
    });
    jest.spyOn(sheltersService, 'updateShelter').mockImplementation((id, body) => {
      return Promise.resolve(id === 1 ? { id, ...body, photos: [] } : null);
    });
    jest.spyOn(sheltersService, 'removeShelter').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? true : false);
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/shelters', () => {
    test('returns 200 with list', async () => {
      const res = await request(app).get('/api/shelters');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/shelters/:id', () => {
    test('returns 200 with item', async () => {
      const res = await request(app).get('/api/shelters/1');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 1 });
    });

    test('returns 404 for non-existent id', async () => {
      const { default: sheltersService } = await import('../src/services/sheltersService.js');
      sheltersService.getShelterById.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/shelters/999');
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/shelters', () => {
    test('returns 401 without token', async () => {
      const res = await request(app)
        .post('/api/shelters')
        .send({ name: 'New Shelter', address: '123 Main St' });
      expect(res.status).toBe(401);
    });

    test('returns 201 with valid data and admin token', async () => {
      const res = await request(app)
        .post('/api/shelters')
        .set(authHeader(adminToken))
        .send({ name: 'New Shelter', address: '123 Main St' });
      expect(res.status).toBe(201);
      expect(res.body).toBeDefined();
      expect(res.body.id).toBeDefined();
    });

    test('returns 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/shelters')
        .set(authHeader(adminToken))
        .send({ name: '' });
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/shelters/:id', () => {
    test('returns 401 without token', async () => {
      const res = await request(app)
        .put('/api/shelters/1')
        .send({ name: 'Updated Shelter' });
      expect(res.status).toBe(401);
    });

    test('returns 200 with valid data', async () => {
      const res = await request(app)
        .put('/api/shelters/1')
        .set(authHeader(adminToken))
        .send({ name: 'Updated Shelter' });
      expect(res.status).toBe(200);
    });

    test('returns 404 for non-existent id', async () => {
      const { default: sheltersService } = await import('../src/services/sheltersService.js');
      sheltersService.updateShelter.mockResolvedValueOnce(null);
      const res = await request(app)
        .put('/api/shelters/999')
        .set(authHeader(adminToken))
        .send({ name: 'Updated Shelter' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/shelters/:id', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).delete('/api/shelters/1');
      expect(res.status).toBe(401);
    });

    test('returns 204 for successful deletion', async () => {
      const res = await request(app)
        .delete('/api/shelters/1')
        .set(authHeader(adminToken));
      expect(res.status).toBe(204);
    });
  });
});
