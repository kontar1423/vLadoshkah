import { jest } from '@jest/globals';
import authService from '../services/authService.js';
import usersDao from '../dao/usersDao.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('register', () => {
    test('успешно регистрирует нового пользователя', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password123',
        role: 'user'
      };

      jest.spyOn(usersDao, 'getByEmail').mockResolvedValue(null);
      jest.spyOn(usersDao, 'create').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'user',
        firstname: null,
        lastname: null,
        gender: null,
        phone: null
      });
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('hashed_password');
      jest.spyOn(jwt, 'sign').mockReturnValue('mock_token');

      const result = await authService.register(userData);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.password).toBeUndefined(); // Пароль должен быть удален
      expect(result.accessToken).toBe('mock_token');
      expect(result.refreshToken).toBe('mock_token');
      expect(usersDao.getByEmail).toHaveBeenCalledWith('test@example.com');
      expect(usersDao.create).toHaveBeenCalled();
    });

    test('выбрасывает ошибку если пользователь уже существует', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password123'
      };

      jest.spyOn(usersDao, 'getByEmail').mockResolvedValue({
        id: 1,
        email: 'existing@example.com'
      });
      const createSpy = jest.spyOn(usersDao, 'create');

      await expect(authService.register(userData)).rejects.toThrow('User with this email already exists');
      expect(createSpy).not.toHaveBeenCalled();
    });

    test('выбрасывает ошибку при отсутствии email', async () => {
      const userData = {
        password: 'password123'
      };

      jest.spyOn(usersDao, 'getByEmail').mockResolvedValue(null);

      await expect(authService.register(userData)).rejects.toThrow('Missing required fields');
    });

    test('выбрасывает ошибку при отсутствии password', async () => {
      const userData = {
        email: 'test@example.com'
      };

      jest.spyOn(usersDao, 'getByEmail').mockResolvedValue(null);

      await expect(authService.register(userData)).rejects.toThrow('Missing required fields');
    });

    test('выбрасывает ошибку при невалидном email', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'password123'
      };

      jest.spyOn(usersDao, 'getByEmail').mockResolvedValue(null);

      await expect(authService.register(userData)).rejects.toThrow('Invalid email format');
    });

    test('выбрасывает ошибку при коротком пароле', async () => {
      const userData = {
        email: 'test@example.com',
        password: '123'
      };

      jest.spyOn(usersDao, 'getByEmail').mockResolvedValue(null);

      await expect(authService.register(userData)).rejects.toThrow('Password must be at least 6 characters long');
    });
  });

  describe('login', () => {
    test('успешно выполняет вход с правильными данными', async () => {
      const email = 'test@example.com';
      const password = 'password123';

      jest.spyOn(usersDao, 'getByEmail').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password',
        role: 'user'
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwt, 'sign').mockReturnValue('mock_token');

      const result = await authService.login(email, password);

      expect(result).toBeDefined();
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
      expect(result.user.password).toBeUndefined(); // Пароль должен быть удален
      expect(result.accessToken).toBe('mock_token');
      expect(result.refreshToken).toBe('mock_token');
      expect(usersDao.getByEmail).toHaveBeenCalledWith(email);
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashed_password');
    });

    test('выбрасывает ошибку при неправильном email', async () => {
      jest.spyOn(usersDao, 'getByEmail').mockResolvedValue(null);

      await expect(authService.login('wrong@example.com', 'password123')).rejects.toThrow('Invalid email or password');
    });

    test('выбрасывает ошибку при неправильном пароле', async () => {
      jest.spyOn(usersDao, 'getByEmail').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        password: 'hashed_password'
      });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      await expect(authService.login('test@example.com', 'wrongpassword')).rejects.toThrow('Invalid email or password');
    });

    test('выбрасывает ошибку при отсутствии email', async () => {
      await expect(authService.login('', 'password123')).rejects.toThrow('Email and password are required');
    });

    test('выбрасывает ошибку при отсутствии password', async () => {
      await expect(authService.login('test@example.com', '')).rejects.toThrow('Email and password are required');
    });
  });

  describe('refreshAccessToken', () => {
    test('успешно обновляет токен с валидным refresh токеном', async () => {
      const refreshToken = 'valid_refresh_token';
      const decoded = {
        userId: 1,
        email: 'test@example.com',
        role: 'user'
      };

      jest.spyOn(jwt, 'verify').mockReturnValue(decoded);
      jest.spyOn(usersDao, 'getById').mockResolvedValue({
        id: 1,
        email: 'test@example.com',
        role: 'user'
      });
      jest.spyOn(jwt, 'sign').mockReturnValue('new_mock_token');

      const result = await authService.refreshAccessToken(refreshToken);

      expect(result).toBeDefined();
      expect(result.accessToken).toBe('new_mock_token');
      expect(result.refreshToken).toBe('new_mock_token');
      expect(jwt.verify).toHaveBeenCalled();
      expect(usersDao.getById).toHaveBeenCalledWith(1);
    });

    test('выбрасывает ошибку при отсутствии refresh токена', async () => {
      await expect(authService.refreshAccessToken('')).rejects.toThrow('Refresh token is required');
    });

    test('выбрасывает ошибку при невалидном токене', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        const error = new Error('Invalid token');
        error.name = 'JsonWebTokenError';
        throw error;
      });

      await expect(authService.refreshAccessToken('invalid_token')).rejects.toThrow('Invalid or expired refresh token');
    });

    test('выбрасывает ошибку при истекшем токене', async () => {
      jest.spyOn(jwt, 'verify').mockImplementation(() => {
        const error = new Error('Token expired');
        error.name = 'TokenExpiredError';
        throw error;
      });

      await expect(authService.refreshAccessToken('expired_token')).rejects.toThrow('Invalid or expired refresh token');
    });

    test('выбрасывает ошибку если пользователь не найден', async () => {
      const decoded = {
        userId: 999,
        email: 'test@example.com',
        role: 'user'
      };

      jest.spyOn(jwt, 'verify').mockReturnValue(decoded);
      jest.spyOn(usersDao, 'getById').mockResolvedValue(null);

      await expect(authService.refreshAccessToken('valid_token')).rejects.toThrow('User not found');
    });
  });
});

