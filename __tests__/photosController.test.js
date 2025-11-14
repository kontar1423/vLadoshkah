import { jest } from '@jest/globals';
import photosController from '../controllers/photosController.js';
import photosService from '../services/photosService.js';
import { Readable } from 'stream';

describe('photosController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      body: {},
      file: null
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      setHeader: jest.fn().mockReturnThis(),
      pipe: jest.fn()
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('uploadPhoto', () => {
    test('загружает фото с валидными данными', async () => {
      const mockPhoto = {
        id: 10,
        original_name: 'test.jpg',
        object_name: 'uuid-test.jpg',
        url: '/uploads/uuid-test.jpg',
        entity_type: 'animal',
        entity_id: 1,
        size: 1024,
        mimetype: 'image/jpeg',
        uploaded_at: new Date()
      };
      
      req.file = { originalname: 'test.jpg' };
      req.body = { entity_type: 'animal', entity_id: '1' };

      jest.spyOn(photosService, 'uploadPhoto').mockResolvedValue(mockPhoto);

      await photosController.uploadPhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        id: 10,
        original_name: 'test.jpg'
      }));
    });

    test('возвращает 400 если файл не загружен', async () => {
      req.body = { entity_type: 'animal', entity_id: '1' };

      await photosController.uploadPhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'No file uploaded' });
    });

    test('возвращает 400 если entity_type отсутствует', async () => {
      req.file = { originalname: 'test.jpg' };
      req.body = { entity_id: '1' };

      await photosController.uploadPhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'entity_type and entity_id are required' 
      });
    });

    test('возвращает 500 при ошибке', async () => {
      req.file = { originalname: 'test.jpg' };
      req.body = { entity_type: 'animal', entity_id: '1' };

      jest.spyOn(photosService, 'uploadPhoto').mockRejectedValue(new Error('Upload failed'));

      await photosController.uploadPhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Upload failed' });
    });
  });

  describe('getPhotoInfo', () => {
    test('возвращает информацию о фото', async () => {
      const mockPhoto = {
        id: 1,
        original_name: 'photo.jpg',
        mimetype: 'image/jpeg',
        size: 1024
      };
      req.params.id = '1';

      jest.spyOn(photosService, 'getPhoto').mockResolvedValue(mockPhoto);

      await photosController.getPhotoInfo(req, res);

      expect(res.json).toHaveBeenCalledWith(mockPhoto);
      expect(photosService.getPhoto).toHaveBeenCalledWith('1');
    });

    test('возвращает 404 если фото не найдено', async () => {
      req.params.id = '999';

      jest.spyOn(photosService, 'getPhoto').mockResolvedValue(null);

      await photosController.getPhotoInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Photo not found' });
    });

    test('возвращает 500 при ошибке', async () => {
      req.params.id = '1';
      jest.spyOn(photosService, 'getPhoto').mockRejectedValue(new Error('DB error'));

      await photosController.getPhotoInfo(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('deletePhoto', () => {
    test('удаляет фото', async () => {
      req.params.id = '1';

      jest.spyOn(photosService, 'deletePhoto').mockResolvedValue({ id: 1 });

      await photosController.deletePhoto(req, res);

      expect(res.json).toHaveBeenCalledWith({ message: 'Photo deleted successfully' });
      expect(photosService.deletePhoto).toHaveBeenCalledWith('1');
    });

    test('возвращает 404 если фото не найдено', async () => {
      req.params.id = '999';

      jest.spyOn(photosService, 'deletePhoto').mockRejectedValue(
        new Error('Photo not found')
      );

      await photosController.deletePhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Photo not found' });
    });

    test('возвращает 500 при другой ошибке', async () => {
      req.params.id = '1';
      jest.spyOn(photosService, 'deletePhoto').mockRejectedValue(new Error('Server error'));

      await photosController.deletePhoto(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPhotosByEntity', () => {
    test('возвращает фото сущности', async () => {
      const mockPhotos = [{ id: 1, entity_type: 'animal', entity_id: 1 }];
      req.params.entityType = 'animal';
      req.params.entityId = '1';

      jest.spyOn(photosService, 'getPhotosByEntity').mockResolvedValue(mockPhotos);

      await photosController.getPhotosByEntity(req, res);

      expect(res.json).toHaveBeenCalledWith(mockPhotos);
      expect(photosService.getPhotosByEntity).toHaveBeenCalledWith('animal', 1);
    });

    test('возвращает 500 при ошибке', async () => {
      req.params.entityType = 'animal';
      req.params.entityId = '1';
      jest.spyOn(photosService, 'getPhotosByEntity').mockRejectedValue(new Error('DB error'));

      await photosController.getPhotosByEntity(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getAllPhotos', () => {
    test('возвращает все фото', async () => {
      const mockPhotos = [{ id: 1, original_name: 'photo1.jpg' }];

      jest.spyOn(photosService, 'getAllPhotos').mockResolvedValue(mockPhotos);

      await photosController.getAllPhotos(req, res);

      expect(res.json).toHaveBeenCalledWith(mockPhotos);
    });

    test('возвращает 500 при ошибке', async () => {
      jest.spyOn(photosService, 'getAllPhotos').mockRejectedValue(new Error('DB error'));

      await photosController.getAllPhotos(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });

  describe('getPhotosByEntityType', () => {
    test('возвращает фото по типу сущности', async () => {
      const mockPhotos = [{ id: 1, entity_type: 'animal' }];
      req.params.entityType = 'animal';

      jest.spyOn(photosService, 'getPhotosByEntityType').mockResolvedValue(mockPhotos);

      await photosController.getPhotosByEntityType(req, res);

      expect(res.json).toHaveBeenCalledWith(mockPhotos);
      expect(photosService.getPhotosByEntityType).toHaveBeenCalledWith('animal');
    });

    test('возвращает 500 при ошибке', async () => {
      req.params.entityType = 'animal';
      jest.spyOn(photosService, 'getPhotosByEntityType').mockRejectedValue(new Error('DB error'));

      await photosController.getPhotosByEntityType(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

