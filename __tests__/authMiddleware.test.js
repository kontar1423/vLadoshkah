import { jest } from '@jest/globals';
import jwt from 'jsonwebtoken';
import { authenticateToken, authorize } from '../src/middleware/auth.js';
import authConfig from '../src/config/auth.js';

const jwtConfig = authConfig.jwt;

describe('Auth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      user: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    test('пропускает запрос с валидным токеном', (done) => {
      const validToken = jwt.sign(
        { userId: 1, email: 'test@example.com', role: 'user' },
        jwtConfig.secret,
        { expiresIn: '1h' }
      );
      
      req.headers['authorization'] = `Bearer ${validToken}`;
      
      authenticateToken(req, res, next);
      
      // Проверяем что next был вызван (через setTimeout так как jwt.verify асинхронный)
      setTimeout(() => {
        expect(next).toHaveBeenCalled();
        expect(req.user).toEqual({
          userId: 1,
          email: 'test@example.com',
          role: 'user'
        });
        done();
      }, 100);
    });

    test('возвращает 401 если токен отсутствует', () => {
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token is required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('возвращает 401 если заголовок Authorization неправильного формата', () => {
      req.headers['authorization'] = 'InvalidFormat';
      
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Access token is required'
      });
    });

    test('возвращает 401 если токен истек', (done) => {
      const expiredToken = jwt.sign(
        { userId: 1, email: 'test@example.com', role: 'user' },
        jwtConfig.secret,
        { expiresIn: '-1h' } // Токен уже истек
      );
      
      req.headers['authorization'] = `Bearer ${expiredToken}`;
      
      authenticateToken(req, res, next);
      
      setTimeout(() => {
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Token expired'
        });
        expect(next).not.toHaveBeenCalled();
        done();
      }, 100);
    });

    test('возвращает 401 если токен невалиден', (done) => {
      req.headers['authorization'] = 'Bearer invalid_token_string';
      
      authenticateToken(req, res, next);
      
      setTimeout(() => {
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({
          success: false,
          error: 'Invalid token'
        });
        expect(next).not.toHaveBeenCalled();
        done();
      }, 100);
    });
  });

  describe('authorize', () => {
    test('пропускает запрос если роль разрешена', () => {
      req.user = { userId: 1, email: 'admin@example.com', role: 'admin' };
      
      const middleware = authorize('admin', 'shelter_admin');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('возвращает 403 если роль не разрешена', () => {
      req.user = { userId: 1, email: 'user@example.com', role: 'user' };
      
      const middleware = authorize('admin', 'shelter_admin');
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Insufficient permissions'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('возвращает 401 если req.user отсутствует', () => {
      req.user = null;
      
      const middleware = authorize('admin');
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('разрешает множественные роли', () => {
      req.user = { userId: 1, role: 'user' };
      
      const middleware = authorize('admin', 'user');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    test('работает с одной ролью', () => {
      req.user = { userId: 1, role: 'admin' };
      
      const middleware = authorize('admin');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });
  });
});

