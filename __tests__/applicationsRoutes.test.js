import request from 'supertest';
import { jest } from '@jest/globals';

// Мокаем initMinio ПЕРЕД импортом app
jest.mock('../initMinio.js', () => ({
  default: jest.fn().mockResolvedValue(undefined)
}));

// Импортируем app и сервисы
import app from '../index.js';
import { generateTestToken, authHeader } from './helpers/authHelper.js';
import applicationsService from '../services/applicationsService.js';

describe('Applications routes', () => {
  const userToken = generateTestToken({ role: 'user', userId: 1 });
  const adminToken = generateTestToken({ role: 'admin', userId: 2 });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Мокаем методы applicationsService
    jest.spyOn(applicationsService, 'getAll').mockResolvedValue([
      { id: 1, user_id: 1, shelter_id: 1, animal_id: 1, status: 'pending', description: 'Test 1' },
      { id: 2, user_id: 2, shelter_id: 1, animal_id: 2, status: 'approved', description: 'Test 2' }
    ]);
    
    jest.spyOn(applicationsService, 'getById').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? 
        { id: 1, user_id: 1, shelter_id: 1, animal_id: 1, status: 'pending', description: 'Test application' } : 
        null
      );
    });
    
    jest.spyOn(applicationsService, 'create').mockImplementation((data) => {
      return Promise.resolve({ id: 10, ...data, created_at: new Date(), updated_at: new Date() });
    });
    
    jest.spyOn(applicationsService, 'update').mockImplementation((id, data) => {
      return Promise.resolve(id === 1 ? { id, ...data } : null);
    });
    
    jest.spyOn(applicationsService, 'remove').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? { id, user_id: 1, status: 'pending' } : null);
    });
    
    jest.spyOn(applicationsService, 'countApproved').mockResolvedValue({ count: 5 });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/applications', () => {
    test('возвращает 200 со списком заявок', async () => {
      const res = await request(app)
        .get('/api/applications')
        .set(authHeader(userToken));
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(applicationsService.getAll).toHaveBeenCalled();
    });

    test('возвращает 401 без токена', async () => {
      const res = await request(app).get('/api/applications');
      
      expect(res.status).toBe(401);
    });
  });

  describe('GET /api/applications/:id', () => {
    test('возвращает 200 с заявкой', async () => {
      const res = await request(app)
        .get('/api/applications/1')
        .set(authHeader(userToken));
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.status).toBe('pending');
      expect(applicationsService.getById).toHaveBeenCalledWith(1);
    });

    test('возвращает 401 без токена', async () => {
      const res = await request(app).get('/api/applications/1');
      
      expect(res.status).toBe(401);
    });

    test('возвращает 404 если заявка не найдена', async () => {
      jest.spyOn(applicationsService, 'getById').mockRejectedValue(new Error('Application not found'));
      
      const res = await request(app)
        .get('/api/applications/999')
        .set(authHeader(userToken));
      
      expect(res.status).toBe(404);
    });

    test('возвращает 400 при невалидном ID', async () => {
      const res = await request(app)
        .get('/api/applications/invalid')
        .set(authHeader(userToken));
      
      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/applications', () => {
    test('создает заявку с валидными данными', async () => {
      const applicationData = {
        user_id: 1,
        shelter_id: 1,
        animal_id: 1,
        status: 'pending',
        description: 'I want to adopt this pet'
      };
      
      const res = await request(app)
        .post('/api/applications')
        .set(authHeader(userToken))
        .send(applicationData);
      
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(10);
      expect(applicationsService.create).toHaveBeenCalled();
    });

    test('возвращает 401 без токена', async () => {
      const res = await request(app)
        .post('/api/applications')
        .send({ user_id: 1, shelter_id: 1, animal_id: 1 });
      
      expect(res.status).toBe(401);
    });

    test('возвращает 400 при отсутствии обязательных полей', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set(authHeader(userToken))
        .send({ user_id: 1 });
      
      expect(res.status).toBe(400);
    });

    test('возвращает 400 при невалидном user_id', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set(authHeader(userToken))
        .send({
          user_id: 'invalid',
          shelter_id: 1,
          animal_id: 1,
          status: 'pending'
        });
      
      expect(res.status).toBe(400);
    });

    test('возвращает 400 при невалидном status', async () => {
      const res = await request(app)
        .post('/api/applications')
        .set(authHeader(userToken))
        .send({
          user_id: 1,
          shelter_id: 1,
          animal_id: 1,
          status: 'invalid_status'
        });
      
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/applications/:id', () => {
    test('обновляет заявку с валидными данными', async () => {
      const updateData = {
        status: 'approved',
        description: 'Updated description'
      };
      
      const res = await request(app)
        .put('/api/applications/1')
        .set(authHeader(adminToken))
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(applicationsService.update).toHaveBeenCalledWith(1, updateData);
    });

    test('возвращает 401 без токена', async () => {
      const res = await request(app)
        .put('/api/applications/1')
        .send({ status: 'approved' });
      
      expect(res.status).toBe(401);
    });

    test('возвращает 404 если заявка не найдена', async () => {
      jest.spyOn(applicationsService, 'update').mockRejectedValue(new Error('Application not found'));
      
      const res = await request(app)
        .put('/api/applications/999')
        .set(authHeader(adminToken))
        .send({ status: 'approved' });
      
      expect(res.status).toBe(404);
    });

    test('возвращает 400 при невалидном ID', async () => {
      const res = await request(app)
        .put('/api/applications/invalid')
        .set(authHeader(adminToken))
        .send({ status: 'approved' });
      
      expect(res.status).toBe(400);
    });

    test('возвращает 400 если body пустой', async () => {
      const res = await request(app)
        .put('/api/applications/1')
        .set(authHeader(adminToken))
        .send({});
      
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/applications/:id', () => {
    test('удаляет заявку', async () => {
      const res = await request(app)
        .delete('/api/applications/1')
        .set(authHeader(adminToken));
      
      expect(res.status).toBe(200);
      expect(applicationsService.remove).toHaveBeenCalledWith(1);
    });

    test('возвращает 401 без токена', async () => {
      const res = await request(app).delete('/api/applications/1');
      
      expect(res.status).toBe(401);
    });

    test('возвращает 404 если заявка не найдена', async () => {
      jest.spyOn(applicationsService, 'remove').mockRejectedValue(new Error('Application not found'));
      
      const res = await request(app)
        .delete('/api/applications/999')
        .set(authHeader(adminToken));
      
      expect(res.status).toBe(404);
    });

    test('возвращает 400 при невалидном ID', async () => {
      const res = await request(app)
        .delete('/api/applications/invalid')
        .set(authHeader(adminToken));
      
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/applications/count/approved', () => {
    test('возвращает количество одобренных заявок', async () => {
      const res = await request(app)
        .get('/api/applications/count/approved')
        .set(authHeader(userToken));
      
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(5);
      expect(applicationsService.countApproved).toHaveBeenCalled();
    });

    test('доступен без токена (публичная метрика)', async () => {
      const res = await request(app).get('/api/applications/count/approved');
      
      expect(res.status).toBe(200);
      expect(res.body.count).toBe(5);
      expect(applicationsService.countApproved).toHaveBeenCalled();
    });
  });
});

