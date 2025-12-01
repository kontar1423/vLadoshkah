import request from 'supertest';
import { jest } from '@jest/globals';

// Мокаем initMinio ПЕРЕД импортом app
jest.mock('../src/initMinio.js', () => ({
  default: jest.fn().mockResolvedValue(undefined)
}));

// Импортируем app и сервисы
import app from '../src/index.js';
import { generateTestToken, authHeader } from './helpers/authHelper.js';
import animalsService from '../src/services/animalsService.js';

describe('Animals routes', () => {
  const adminToken = generateTestToken({ role: 'admin' });
  const shelterAdminToken = generateTestToken({ role: 'shelter_admin', userId: 1 });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Мокаем методы сервиса используя jest.spyOn
    jest.spyOn(animalsService, 'getAllAnimals').mockResolvedValue([{ id: 1, name: 'Rex', age: 3, type: 'dog', shelter_id: 1, photos: [] }]);
    jest.spyOn(animalsService, 'getAnimalById').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? { id: 1, name: 'Rex', age: 3, type: 'dog', shelter_id: 1, photos: [] } : null);
    });
    jest.spyOn(animalsService, 'getAnimalsByShelterId').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? [{ id: 1, name: 'Rex', shelter_id: 1, photos: [] }] : []);
    });
    jest.spyOn(animalsService, 'createAnimal').mockImplementation((body) => {
      return Promise.resolve({ id: 2, ...body, photos: [] });
    });
    jest.spyOn(animalsService, 'updateAnimal').mockImplementation((id, body) => {
      return Promise.resolve(id === 1 ? { id, ...body, photos: [] } : null);
    });
    jest.spyOn(animalsService, 'removeAnimal').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? true : false);
    });
    jest.spyOn(animalsService, 'findAnimals').mockResolvedValue([{ id: 1, name: 'Rex', photos: [] }]);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/animals', () => {
    test('returns 200 with list', async () => {
      const res = await request(app).get('/api/animals');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  describe('GET /api/animals/:id', () => {
    test('returns 200 with item', async () => {
      const res = await request(app).get('/api/animals/1');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ id: 1 });
    });

    test('returns 400 for invalid id', async () => {
      const res = await request(app).get('/api/animals/invalid');
      expect(res.status).toBe(400);
    });

    test('returns 404 for non-existent id', async () => {
      const { default: animalsService } = await import('../src/services/animalsService.js');
      animalsService.getAnimalById.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/animals/999');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/animals/shelter/:shelterId', () => {
    test('returns 200 with animals from shelter', async () => {
      const res = await request(app).get('/api/animals/shelter/1');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('returns 400 for invalid shelterId', async () => {
      const res = await request(app).get('/api/animals/shelter/invalid');
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/animals/filters', () => {
    test('returns 200 with filtered animals', async () => {
      const res = await request(app).get('/api/animals/filters?type=dog');
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    test('returns 400 for invalid filter value', async () => {
      const res = await request(app).get('/api/animals/filters?gender=invalid');
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/animals', () => {
    test('returns 401 without token', async () => {
      const res = await request(app)
        .post('/api/animals')
        .send({ name: 'Rex', age: 3, type: 'dog', shelter_id: 1 });
      expect(res.status).toBe(401);
    });

    test('returns 201 with valid data and token', async () => {
      const res = await request(app)
        .post('/api/animals')
        .set(authHeader(adminToken))
        .send({ name: 'Rex', age: 3, type: 'dog', shelter_id: 1 });
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.animal).toBeDefined();
    });

    test('returns 400 for invalid data', async () => {
      const res = await request(app)
        .post('/api/animals')
        .set(authHeader(adminToken))
        .send({ name: '', age: 3, type: 'dog', shelter_id: 1 });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBeDefined();
    });

    test('returns 400 for missing required fields', async () => {
      const res = await request(app)
        .post('/api/animals')
        .set(authHeader(adminToken))
        .send({ age: 3, type: 'dog' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('returns 400 for invalid age', async () => {
      const res = await request(app)
        .post('/api/animals')
        .set(authHeader(adminToken))
        .send({ name: 'Rex', age: -1, type: 'dog', shelter_id: 1 });
      expect(res.status).toBe(400);
    });

    test('allows shelter_admin to create animal only in own shelter', async () => {
      const res = await request(app)
        .post('/api/animals')
        .set(authHeader(shelterAdminToken))
        .send({ name: 'Rex', age: 3, type: 'dog', shelter_id: 1 });
      expect(res.status).toBe(201);
      expect(animalsService.createAnimal).toHaveBeenCalledWith(
        expect.objectContaining({ shelter_id: 1 }),
        expect.any(Array),
        expect.objectContaining({ userId: 1, role: 'shelter_admin' })
      );
    });

    test('forbids shelter_admin to create animal in foreign shelter', async () => {
      const err = Object.assign(new Error('forbidden'), { status: 403 });
      animalsService.createAnimal.mockRejectedValueOnce(err);
      const res = await request(app)
        .post('/api/animals')
        .set(authHeader(shelterAdminToken))
        .send({ name: 'Rex', age: 3, type: 'dog', shelter_id: 1 });
      expect(res.status).toBe(403);
    });
  });

  describe('PUT /api/animals/:id', () => {
    test('returns 401 without token', async () => {
      const res = await request(app)
        .put('/api/animals/1')
        .send({ name: 'Rex Updated' });
      expect(res.status).toBe(401);
    });

    test('returns 200 with valid data', async () => {
      const res = await request(app)
        .put('/api/animals/1')
        .set(authHeader(adminToken))
        .send({ name: 'Rex Updated', age: 4 });
      expect(res.status).toBe(200);
    });

    test('returns 400 for invalid id', async () => {
      const res = await request(app)
        .put('/api/animals/invalid')
        .set(authHeader(adminToken))
        .send({ name: 'Rex' });
      expect(res.status).toBe(400);
    });

    test('returns 404 for non-existent id', async () => {
      const { default: animalsService } = await import('../src/services/animalsService.js');
      animalsService.updateAnimal.mockResolvedValueOnce(null);
      const res = await request(app)
        .put('/api/animals/999')
        .set(authHeader(adminToken))
        .send({ name: 'Rex Updated' });
      expect(res.status).toBe(404);
    });

    test('returns 400 for invalid update data', async () => {
      const res = await request(app)
        .put('/api/animals/1')
        .set(authHeader(adminToken))
        .send({ age: -1 });
      expect(res.status).toBe(400);
    });

    test('forbids shelter_admin moving animal to another shelter', async () => {
      const err = Object.assign(new Error('forbidden'), { status: 403 });
      animalsService.updateAnimal.mockRejectedValueOnce(err);
      const res = await request(app)
        .put('/api/animals/1')
        .set(authHeader(shelterAdminToken))
        .send({ name: 'Rex', shelter_id: 2 });
      expect(res.status).toBe(403);
    });

    test('forbids shelter_admin updating foreign animal', async () => {
      const err = Object.assign(new Error('forbidden'), { status: 403 });
      animalsService.updateAnimal.mockRejectedValueOnce(err);
      const res = await request(app)
        .put('/api/animals/1')
        .set(authHeader(shelterAdminToken))
        .send({ name: 'Rex' });
      expect(res.status).toBe(403);
    });

    test('allows shelter_admin updating own animal', async () => {
      const res = await request(app)
        .put('/api/animals/1')
        .set(authHeader(shelterAdminToken))
        .send({ name: 'Rex Updated' });
      expect(res.status).toBe(200);
    });
  });

  describe('DELETE /api/animals/:id', () => {
    test('returns 401 without token', async () => {
      const res = await request(app).delete('/api/animals/1');
      expect(res.status).toBe(401);
    });

    test('returns 204 for successful deletion', async () => {
      const res = await request(app)
        .delete('/api/animals/1')
        .set(authHeader(adminToken));
      expect(res.status).toBe(204);
    });

    test('returns 400 for invalid id', async () => {
      const res = await request(app)
        .delete('/api/animals/invalid')
        .set(authHeader(adminToken));
      expect(res.status).toBe(400);
    });

    test('forbids shelter_admin deleting foreign animal', async () => {
      const err = Object.assign(new Error('forbidden'), { status: 403 });
      animalsService.removeAnimal.mockRejectedValueOnce(err);
      const res = await request(app)
        .delete('/api/animals/1')
        .set(authHeader(shelterAdminToken));
      expect(res.status).toBe(403);
    });

    test('allows shelter_admin deleting own animal', async () => {
      const res = await request(app)
        .delete('/api/animals/1')
        .set(authHeader(shelterAdminToken));
      expect(res.status).toBe(204);
    });
  });
});
