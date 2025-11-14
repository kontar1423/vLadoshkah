import request from 'supertest';
import { jest } from '@jest/globals';

// Мокаем initMinio ПЕРЕД импортом app
jest.mock('../initMinio.js', () => ({
  default: jest.fn().mockResolvedValue(undefined)
}));

// Импортируем app и сервисы
import app from '../index.js';
import { generateTestToken, authHeader } from './helpers/authHelper.js';
import usersService from '../services/usersService.js';

describe('Users routes', () => {
  const adminToken = generateTestToken({ role: 'admin', userId: 1 });
  const userToken = generateTestToken({ role: 'user', userId: 2 });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Мокаем методы usersService
    jest.spyOn(usersService, 'getAll').mockResolvedValue([
      { id: 1, email: 'user1@example.com', role: 'admin', photos: [] },
      { id: 2, email: 'user2@example.com', role: 'user', photos: [] }
    ]);
    
    jest.spyOn(usersService, 'getById').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? 
        { id: 1, email: 'user1@example.com', role: 'admin', firstname: 'Admin', photos: [] } : 
        null
      );
    });
    
    jest.spyOn(usersService, 'create').mockImplementation((data) => {
      return Promise.resolve({ id: 10, ...data, photos: [] });
    });
    
    jest.spyOn(usersService, 'update').mockImplementation((id, data) => {
      return Promise.resolve(id === 1 ? { id, ...data, photos: [] } : null);
    });
    
    jest.spyOn(usersService, 'remove').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? { id, email: 'user1@example.com' } : null);
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('GET /api/users', () => {
    test('возвращает 200 со списком пользователей', async () => {
      const res = await request(app).get('/api/users');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBe(2);
      expect(usersService.getAll).toHaveBeenCalled();
    });

    test('публичный доступ без авторизации', async () => {
      const res = await request(app).get('/api/users');
      
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/users/:id', () => {
    test('возвращает 200 с пользователем', async () => {
      const res = await request(app).get('/api/users/1');
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.email).toBe('user1@example.com');
      expect(usersService.getById).toHaveBeenCalledWith(1);
    });

    test('возвращает 500 если пользователь не найден', async () => {
      const error = new Error('User not found');
      error.status = 404;
      jest.spyOn(usersService, 'getById').mockRejectedValue(error);
      
      const res = await request(app).get('/api/users/999');
      
      expect(res.status).toBe(404);
    });

    test('возвращает 400 при невалидном ID', async () => {
      const res = await request(app).get('/api/users/invalid');
      
      expect(res.status).toBe(400);
    });

    test('публичный доступ без авторизации', async () => {
      const res = await request(app).get('/api/users/1');
      
      expect(res.status).toBe(200);
    });
  });

  describe('POST /api/users', () => {
    test('создает пользователя с валидными данными (админ)', async () => {
      const userData = {
        email: 'newuser@example.com',
        password: 'password123',
        role: 'user'
      };
      
      const res = await request(app)
        .post('/api/users')
        .set(authHeader(adminToken))
        .send(userData);
      
      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.user.email).toBe('newuser@example.com');
      expect(usersService.create).toHaveBeenCalled();
    });

    test('возвращает 401 без токена', async () => {
      const res = await request(app)
        .post('/api/users')
        .send({ email: 'test@example.com', password: 'pass123', role: 'user' });
      
      expect(res.status).toBe(401);
    });

    test('возвращает 400 при отсутствии email', async () => {
      const res = await request(app)
        .post('/api/users')
        .set(authHeader(adminToken))
        .send({ password: 'password123', role: 'user' });
      
      expect(res.status).toBe(400);
    });

    test('возвращает 400 при отсутствии password', async () => {
      const res = await request(app)
        .post('/api/users')
        .set(authHeader(adminToken))
        .send({ email: 'test@example.com', role: 'user' });
      
      expect(res.status).toBe(400);
    });

    test('возвращает 400 при невалидном email', async () => {
      const res = await request(app)
        .post('/api/users')
        .set(authHeader(adminToken))
        .send({ email: 'invalid-email', password: 'password123', role: 'user' });
      
      expect(res.status).toBe(400);
    });

    test('возвращает 400 при коротком пароле', async () => {
      const res = await request(app)
        .post('/api/users')
        .set(authHeader(adminToken))
        .send({ email: 'test@example.com', password: 'short', role: 'user' });
      
      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/users/:id', () => {
    test('обновляет пользователя с валидными данными', async () => {
      const updateData = {
        firstname: 'Updated',
        lastname: 'User'
      };
      
      const res = await request(app)
        .put('/api/users/1')
        .set(authHeader(adminToken))
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(usersService.update).toHaveBeenCalledWith(1, updateData, undefined);
    });

    test('возвращает 401 без токена', async () => {
      const res = await request(app)
        .put('/api/users/1')
        .send({ firstname: 'Test' });
      
      expect(res.status).toBe(401);
    });

    test('возвращает 404 если пользователь не найден', async () => {
      const error = new Error('User not found or not updated');
      error.status = 404;
      jest.spyOn(usersService, 'update').mockRejectedValue(error);
      
      const res = await request(app)
        .put('/api/users/999')
        .set(authHeader(adminToken))
        .send({ firstname: 'Test' });
      
      expect(res.status).toBe(404);
    });

    test('возвращает 400 при невалидном ID', async () => {
      const res = await request(app)
        .put('/api/users/invalid')
        .set(authHeader(adminToken))
        .send({ firstname: 'Test' });
      
      expect(res.status).toBe(400);
    });

    test('возвращает 400 если body пустой', async () => {
      const res = await request(app)
        .put('/api/users/1')
        .set(authHeader(adminToken))
        .send({});
      
      expect(res.status).toBe(400);
    });
  });

  describe('PATCH /api/users/:id', () => {
    test('частично обновляет пользователя', async () => {
      const updateData = { firstname: 'Patched' };
      
      const res = await request(app)
        .patch('/api/users/1')
        .set(authHeader(userToken))
        .send(updateData);
      
      expect(res.status).toBe(200);
      expect(usersService.update).toHaveBeenCalledWith(1, updateData, undefined);
    });

    test('возвращает 401 без токена', async () => {
      const res = await request(app)
        .patch('/api/users/1')
        .send({ firstname: 'Test' });
      
      expect(res.status).toBe(401);
    });
  });

  describe('DELETE /api/users/:id', () => {
    test('удаляет пользователя (только админ)', async () => {
      const res = await request(app)
        .delete('/api/users/1')
        .set(authHeader(adminToken));
      
      expect(res.status).toBe(204);
      expect(usersService.remove).toHaveBeenCalledWith(1);
    });

    test('возвращает 401 без токена', async () => {
      const res = await request(app).delete('/api/users/1');
      
      expect(res.status).toBe(401);
    });

    test('возвращает 403 для не-админа', async () => {
      const res = await request(app)
        .delete('/api/users/1')
        .set(authHeader(userToken));
      
      expect(res.status).toBe(403);
    });

    test('возвращает 404 если пользователь не найден', async () => {
      const error = new Error('User not found');
      error.status = 404;
      jest.spyOn(usersService, 'remove').mockRejectedValue(error);
      
      const res = await request(app)
        .delete('/api/users/999')
        .set(authHeader(adminToken));
      
      expect(res.status).toBe(404);
    });

    test('возвращает 400 при невалидном ID', async () => {
      const res = await request(app)
        .delete('/api/users/invalid')
        .set(authHeader(adminToken));
      
      expect(res.status).toBe(400);
    });
  });
});

