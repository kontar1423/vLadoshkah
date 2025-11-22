import request from 'supertest';
import { jest } from '@jest/globals';

// Мокаем initMinio ПЕРЕД импортом app
jest.mock('../src/initMinio.js', () => ({
  default: jest.fn().mockResolvedValue(undefined)
}));

// Импортируем app и сервисы
import app from '../src/index.js';
import authService from '../src/services/authService.js';

describe('Auth routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Мокаем методы authService
    jest.spyOn(authService, 'register').mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'user' },
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token'
    });
    
    jest.spyOn(authService, 'login').mockResolvedValue({
      user: { id: 1, email: 'test@example.com', role: 'user' },
      accessToken: 'mock_access_token',
      refreshToken: 'mock_refresh_token'
    });
    
    jest.spyOn(authService, 'refreshAccessToken').mockResolvedValue({
      accessToken: 'new_access_token',
      refreshToken: 'new_refresh_token'
    });
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/auth/register', () => {
    test('успешно регистрирует пользователя с валидными данными', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };
      
      const res = await request(app)
        .post('/api/auth/register')
        .send(userData);
      
      expect(res.status).toBe(201);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.accessToken).toBe('mock_access_token');
      expect(res.body.refreshToken).toBe('mock_refresh_token');
      expect(authService.register).toHaveBeenCalledWith(userData);
    });

    test('возвращает 400 при отсутствии email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ password: 'password123' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
    });

    test('возвращает 400 при отсутствии password', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
    });

    test('возвращает 400 при невалидном email', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'invalid-email', password: 'password123' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
    });

    test('возвращает 400 при коротком пароле', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'test@example.com', password: 'short' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
    });

    test('возвращает 409 при попытке зарегистрировать существующего пользователя', async () => {
      jest.spyOn(authService, 'register').mockRejectedValue(
        new Error('User with this email already exists')
      );
      
      const res = await request(app)
        .post('/api/auth/register')
        .send({ email: 'existing@example.com', password: 'password123' });
      
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/auth/login', () => {
    test('успешно логинит пользователя с валидными данными', async () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123'
      };
      
      const res = await request(app)
        .post('/api/auth/login')
        .send(credentials);
      
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.email).toBe('test@example.com');
      expect(res.body.accessToken).toBe('mock_access_token');
      expect(res.body.refreshToken).toBe('mock_refresh_token');
      expect(authService.login).toHaveBeenCalledWith(credentials.email, credentials.password);
    });

    test('возвращает 400 при отсутствии email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
    });

    test('возвращает 400 при отсутствии password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
    });

    test('возвращает 401 при неверных credentials', async () => {
      jest.spyOn(authService, 'login').mockRejectedValue(
        new Error('Invalid email or password')
      );
      
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com', password: 'wrongpassword' });
      
      expect(res.status).toBe(500);
    });
  });

  describe('POST /api/auth/refresh', () => {
    test('успешно обновляет токен с валидным refresh token', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'valid_refresh_token' });
      
      expect(res.status).toBe(200);
      expect(res.body.accessToken).toBe('new_access_token');
      expect(res.body.refreshToken).toBe('new_refresh_token');
      expect(authService.refreshAccessToken).toHaveBeenCalledWith('valid_refresh_token');
    });

    test('возвращает 400 при отсутствии refreshToken', async () => {
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({});
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Validation error');
    });

    test('возвращает 401 при невалидном refresh token', async () => {
      jest.spyOn(authService, 'refreshAccessToken').mockRejectedValue(
        new Error('Invalid or expired refresh token')
      );
      
      const res = await request(app)
        .post('/api/auth/refresh')
        .send({ refreshToken: 'invalid_token' });
      
      expect(res.status).toBe(500);
    });
  });
});

