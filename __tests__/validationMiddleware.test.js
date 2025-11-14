import { jest } from '@jest/globals';
import Joi from 'joi';
import { validate } from '../middleware/validation.js';

describe('Validation middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      body: {},
      query: {},
      params: {},
      file: null
    };
    
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    
    next = jest.fn();
    
    jest.clearAllMocks();
  });

  describe('validate', () => {
    test('пропускает валидные данные из body', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().integer().positive()
      });
      
      req.body = { name: 'Test', age: 25 };
      
      const middleware = validate(schema);
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
      expect(req.body.name).toBe('Test');
      expect(req.body.age).toBe(25);
    });

    test('возвращает 400 при невалидных данных', () => {
      const schema = Joi.object({
        name: Joi.string().required(),
        age: Joi.number().integer().positive().required()
      });
      
      req.body = { name: 'Test' }; // age отсутствует
      
      const middleware = validate(schema);
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Validation error',
        details: expect.arrayContaining([
          expect.objectContaining({
            field: 'age',
            message: expect.any(String)
          })
        ])
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('возвращает множественные ошибки валидации', () => {
      const schema = Joi.object({
        email: Joi.string().email().required(),
        age: Joi.number().integer().positive().required()
      });
      
      req.body = { email: 'invalid-email', age: -5 };
      
      const middleware = validate(schema);
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      const jsonCall = res.json.mock.calls[0][0];
      expect(jsonCall.details.length).toBeGreaterThan(0);
      expect(next).not.toHaveBeenCalled();
    });

    test('конвертирует типы', () => {
      const schema = Joi.object({
        id: Joi.number().required(),
        age: Joi.number().required(),
        isActive: Joi.boolean().required()
      });
      
      req.body = { id: '123', age: '25', isActive: 'true' };
      
      const middleware = validate(schema);
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.body.id).toBe(123); // Конвертировано в number
      expect(req.body.age).toBe(25);
      expect(req.body.isActive).toBe(true);
    });

    test('удаляет неизвестные поля', () => {
      const schema = Joi.object({
        name: Joi.string().required()
      });
      
      req.body = { name: 'Test', unknownField: 'value', anotherField: 123 };
      
      const middleware = validate(schema);
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.body.name).toBe('Test');
      expect(req.body.unknownField).toBeUndefined();
      expect(req.body.anotherField).toBeUndefined();
    });

    test('валидирует query параметры', () => {
      const schema = Joi.object({
        page: Joi.number().integer().positive(),
        limit: Joi.number().integer().positive()
      });
      
      req.query = { page: '1', limit: '10' };
      
      const middleware = validate(schema, 'query');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.query.page).toBe(1);
      expect(req.query.limit).toBe(10);
    });

    test('валидирует params', () => {
      const schema = Joi.object({
        id: Joi.number().integer().positive().required()
      });
      
      req.params = { id: '123' };
      
      const middleware = validate(schema, 'params');
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(req.params.id).toBe(123);
    });

    test('возвращает ошибку для невалидных params', () => {
      const schema = Joi.object({
        id: Joi.number().integer().positive().required()
      });
      
      req.params = { id: 'invalid' };
      
      const middleware = validate(schema, 'params');
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test('обрабатывает пустой body', () => {
      const schema = Joi.object({
        name: Joi.string().optional()
      });
      
      req.body = {};
      
      const middleware = validate(schema);
      middleware(req, res, next);
      
      expect(next).toHaveBeenCalled();
    });

    test('обрабатывает пустой body с опциональными полями', () => {
      const schema = Joi.object({
        name: Joi.string().optional(),
        age: Joi.number().optional()
      }).min(1);
      
      req.body = {};
      
      const middleware = validate(schema);
      middleware(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(next).not.toHaveBeenCalled();
    });

    test('обрабатывает body с req.file (multer)', () => {
      const schema = Joi.object({
        name: Joi.string().optional()
      });
      
      req.body = {};
      req.file = { filename: 'photo.jpg' };
      
      const middleware = validate(schema);
      middleware(req, res, next);
      
      // Не должно считать body пустым, если есть file
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    test('обрабатывает undefined body', () => {
      const schema = Joi.object({
        name: Joi.string().optional()
      });
      
      req.body = undefined;
      
      const middleware = validate(schema);
      middleware(req, res, next);
      
      // middleware должен создать пустой объект для undefined body
      expect(next).toHaveBeenCalled();
    });
  });
});

