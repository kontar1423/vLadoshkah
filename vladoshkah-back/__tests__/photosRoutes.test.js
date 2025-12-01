import request from 'supertest';
import { jest } from '@jest/globals';

// Мокаем initMinio ПЕРЕД импортом app
jest.mock('../src/initMinio.js', () => ({
  default: jest.fn().mockResolvedValue(undefined)
}));

// Импортируем app и сервисы
import app from '../src/index.js';
import { generateTestToken, authHeader } from './helpers/authHelper.js';
import photosService from '../src/services/photosService.js';
import { Readable } from 'stream';

describe('Photos routes', () => {
  const userToken = generateTestToken({ role: 'user', userId: 1 });
  const adminToken = generateTestToken({ role: 'admin', userId: 2 });

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Мокаем методы photosService
    jest.spyOn(photosService, 'uploadPhoto').mockImplementation((file, entityType, entityId) => {
      return Promise.resolve({
        id: 10,
        original_name: file.originalname,
        object_name: 'uuid-photo.jpg',
        url: '/uploads/uuid-photo.jpg',
        entity_type: entityType,
        entity_id: parseInt(entityId),
        size: file.size,
        mimetype: file.mimetype,
        uploaded_at: new Date()
      });
    });
    
    jest.spyOn(photosService, 'getPhoto').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? 
        { id: 1, original_name: 'photo.jpg', mimetype: 'image/jpeg', size: 1024 } : 
        null
      );
    });
    
    jest.spyOn(photosService, 'getPhotoFileInfo').mockImplementation((objectName) => {
      return Promise.resolve({
        id: 1,
        object_name: objectName,
        original_name: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      });
    });
    
    jest.spyOn(photosService, 'getPhotoFile').mockImplementation(() => {
      return Promise.resolve(Readable.from('binary data'));
    });
    
    jest.spyOn(photosService, 'deletePhoto').mockResolvedValue({
      id: 1,
      original_name: 'photo.jpg'
    });
    
    jest.spyOn(photosService, 'getPhotosByEntity').mockResolvedValue([
      { id: 1, entity_type: 'animal', entity_id: 1 }
    ]);
    
    jest.spyOn(photosService, 'getAllPhotos').mockResolvedValue([
      { id: 1, original_name: 'photo1.jpg' }
    ]);
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('POST /api/photos/upload', () => {
    test('загружает фото с валидными данными (авторизован)', async () => {
      const photoBuffer = Buffer.from('fake image data');
      
      const res = await request(app)
        .post('/api/photos/upload')
        .set(authHeader(userToken))
        .field('entity_type', 'animal')
        .field('entity_id', '1')
        .attach('photo', photoBuffer, 'test.jpg');
      
      expect(res.status).toBe(201);
      expect(res.body.id).toBe(10);
      expect(res.body.entity_type).toBe('animal');
      expect(photosService.uploadPhoto).toHaveBeenCalled();
    });

    test('возвращает 401 без токена', async () => {
      const photoBuffer = Buffer.from('fake image data');
      
      const res = await request(app)
        .post('/api/photos/upload')
        .field('entity_type', 'animal')
        .field('entity_id', '1')
        .attach('photo', photoBuffer, 'test.jpg');
      
      expect(res.status).toBe(401);
    });

    test('возвращает 400 если файл не загружен', async () => {
      const res = await request(app)
        .post('/api/photos/upload')
        .set(authHeader(userToken))
        .field('entity_type', 'animal')
        .field('entity_id', '1');
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('No file uploaded');
    });

    test('возвращает 400 если entity_type отсутствует', async () => {
      const photoBuffer = Buffer.from('fake image data');
      
      const res = await request(app)
        .post('/api/photos/upload')
        .set(authHeader(userToken))
        .field('entity_id', '1')
        .attach('photo', photoBuffer, 'test.jpg');
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('entity_type and entity_id are required');
    });

    test('возвращает 400 если entity_id отсутствует', async () => {
      const photoBuffer = Buffer.from('fake image data');
      
      const res = await request(app)
        .post('/api/photos/upload')
        .set(authHeader(userToken))
        .field('entity_type', 'animal')
        .attach('photo', photoBuffer, 'test.jpg');
      
      expect(res.status).toBe(400);
      expect(res.body.error).toBe('entity_type and entity_id are required');
    });
  });

  describe('GET /api/photos/info/:id', () => {
    test('возвращает информацию о фото', async () => {
      jest.spyOn(photosService, 'getPhoto').mockResolvedValueOnce({
        id: 1,
        original_name: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      });
      
      const res = await request(app).get('/api/photos/info/1');
      
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(1);
      expect(res.body.original_name).toBe('photo.jpg');
    });

    test('возвращает 404 если фото не найдено', async () => {
      jest.spyOn(photosService, 'getPhoto').mockResolvedValueOnce(null);
      
      const res = await request(app).get('/api/photos/info/999');
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Photo not found');
    });
  });

  describe('GET /api/photos/file/:objectName', () => {
    test('возвращает 404 если фото не найдено', async () => {
      jest.spyOn(photosService, 'getPhotoFileInfo').mockRejectedValueOnce(
        new Error('Photo not found')
      );
      
      const res = await request(app).get('/api/photos/file/nonexistent.jpg');
      
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/photos/:id', () => {
    test('удаляет фото (авторизован)', async () => {
      const res = await request(app)
        .delete('/api/photos/1')
        .set(authHeader(adminToken));
      
      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Photo deleted successfully');
      expect(photosService.deletePhoto).toHaveBeenCalledWith('1');
    });

    test('возвращает 401 без токена', async () => {
      const res = await request(app).delete('/api/photos/1');
      
      expect(res.status).toBe(401);
    });

    test('возвращает 404 если фото не найдено', async () => {
      jest.spyOn(photosService, 'deletePhoto').mockRejectedValue(
        new Error('Photo not found')
      );
      
      const res = await request(app)
        .delete('/api/photos/999')
        .set(authHeader(adminToken));
      
      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Photo not found');
    });
  });

  describe('GET /api/photos/entity/:entityType/:entityId', () => {
    test('возвращает фото сущности', async () => {
      const res = await request(app).get('/api/photos/entity/animal/1');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(photosService.getPhotosByEntity).toHaveBeenCalledWith('animal', 1);
    });

    test('публичный доступ без авторизации', async () => {
      const res = await request(app).get('/api/photos/entity/animal/1');
      
      expect(res.status).toBe(200);
    });
  });

  describe('GET /api/photos', () => {
    test('возвращает все фото', async () => {
      const res = await request(app).get('/api/photos');
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(photosService.getAllPhotos).toHaveBeenCalled();
    });

    test('публичный доступ без авторизации', async () => {
      const res = await request(app).get('/api/photos');
      
      expect(res.status).toBe(200);
    });
  });
});

