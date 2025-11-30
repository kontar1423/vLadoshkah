import request from 'supertest';
import { jest } from '@jest/globals';

// Мокаем initMinio ПЕРЕД импортом app
jest.mock('../src/initMinio.js', () => ({
  default: jest.fn().mockResolvedValue(undefined)
}));

// Мокаем DAO приютов для проверок владения
jest.mock('../src/dao/sheltersDao.js', () => ({
  __esModule: true,
  default: {
    getById: jest.fn(),
    getByAdminId: jest.fn(),
  }
}));

// Импортируем app и сервисы
import app from '../src/index.js';
import { generateTestToken, authHeader } from './helpers/authHelper.js';
import sheltersService from '../src/services/sheltersService.js';
import sheltersDao from '../src/dao/sheltersDao.js';

describe('Shelters routes', () => {
  const adminToken = generateTestToken({ role: 'admin' });
  const shelterAdminToken = generateTestToken({ role: 'shelter_admin', userId: 10 });

  beforeEach(() => {
    jest.clearAllMocks();
    if (!jest.isMockFunction(sheltersDao.getById)) {
      sheltersDao.getById = jest.fn();
    }
    if (!jest.isMockFunction(sheltersDao.getByAdminId)) {
      sheltersDao.getByAdminId = jest.fn();
    }
    
    // Мокаем методы сервиса используя jest.spyOn
    jest.spyOn(sheltersService, 'getAllShelters').mockResolvedValue([{ id: 1, name: 'Home Shelter', photos: [] }]);
    jest.spyOn(sheltersService, 'getShelterById').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? { id: 1, name: 'Home Shelter', photos: [] } : null);
    });
    jest.spyOn(sheltersService, 'getShelterByAdminId').mockImplementation((adminId) => {
      return Promise.resolve(adminId === 10 ? { id: 1, name: 'Home Shelter', admin_id: 10, photos: [] } : null);
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

    sheltersDao.getById.mockResolvedValue({ id: 1, admin_id: 10 });
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

  describe('GET /api/shelters/admin/:adminId', () => {
    test('returns 200 when shelter exists for admin', async () => {
      const res = await request(app).get('/api/shelters/admin/10');
      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({ admin_id: 10 });
    });

    test('returns 404 when shelter not found for admin', async () => {
      sheltersService.getShelterByAdminId.mockResolvedValueOnce(null);
      const res = await request(app).get('/api/shelters/admin/99');
      expect(res.status).toBe(404);
    });

    test('returns 400 for invalid admin id', async () => {
      const res = await request(app).get('/api/shelters/admin/not-a-number');
      expect(res.status).toBe(400);
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

    test('sets admin_id from shelter_admin token', async () => {
      const res = await request(app)
        .post('/api/shelters')
        .set(authHeader(shelterAdminToken))
        .send({ name: 'My Shelter', address: 'Street 1' });
      expect(res.status).toBe(201);
      expect(sheltersService.createShelter).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'My Shelter' }),
        null,
        expect.objectContaining({ userId: 10, role: 'shelter_admin' })
      );
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

    test('allows shelter_admin to update own shelter', async () => {
      const res = await request(app)
        .put('/api/shelters/1')
        .set(authHeader(shelterAdminToken))
        .send({ name: 'Mine' });
      expect(res.status).toBe(200);
    });

    test('forbids shelter_admin updating foreign shelter', async () => {
      const err = Object.assign(new Error('forbidden'), { status: 403 });
      sheltersService.updateShelter.mockRejectedValueOnce(err);
      const res = await request(app)
        .put('/api/shelters/1')
        .set(authHeader(shelterAdminToken))
        .send({ name: 'Not mine' });
      expect(res.status).toBe(403);
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

    test('allows shelter_admin to delete own shelter', async () => {
      const res = await request(app)
        .delete('/api/shelters/1')
        .set(authHeader(shelterAdminToken));
      expect(res.status).toBe(204);
    });

    test('forbids shelter_admin deleting foreign shelter', async () => {
      const err = Object.assign(new Error('forbidden'), { status: 403 });
      sheltersService.removeShelter.mockRejectedValueOnce(err);
      const res = await request(app)
        .delete('/api/shelters/1')
        .set(authHeader(shelterAdminToken));
      expect(res.status).toBe(403);
    });
  });
});
