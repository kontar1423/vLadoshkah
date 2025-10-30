import { jest } from '@jest/globals';
import photosService from '../services/photosService.js';
import photosDao from '../dao/photosDao.js';
import redisClient from '../cache/redis-client.js';
import minioClient from '../minioClient.js';

describe('photosService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Мокаем методы photosDao
    jest.spyOn(photosDao, 'create').mockImplementation((data) => {
      return Promise.resolve({ id: 10, ...data, created_at: new Date(), updated_at: new Date() });
    });
    
    jest.spyOn(photosDao, 'getById').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? 
        { id: 1, original_name: 'photo.jpg', entity_type: 'animal', entity_id: 1, bucket: 'uploads', object_name: 'test.jpg' } : 
        null
      );
    });
    
    jest.spyOn(photosDao, 'getByObjectName').mockImplementation((name) => {
      return Promise.resolve(name === 'test.jpg' ? 
        { id: 1, object_name: 'test.jpg', bucket: 'uploads' } : 
        null
      );
    });
    
    jest.spyOn(photosDao, 'getByEntity').mockResolvedValue([
      { id: 1, entity_type: 'animal', entity_id: 1 }
    ]);
    
    jest.spyOn(photosDao, 'getByEntityType').mockResolvedValue([]);
    
    jest.spyOn(photosDao, 'getAll').mockResolvedValue([
      { id: 1, original_name: 'photo1.jpg' }
    ]);
    
    jest.spyOn(photosDao, 'remove').mockImplementation((id) => {
      return Promise.resolve({ id, original_name: 'photo.jpg' });
    });
    
    // Мокаем redisClient
    jest.spyOn(redisClient, 'delete').mockResolvedValue(undefined);
    jest.spyOn(redisClient, 'get').mockResolvedValue(null);
    jest.spyOn(redisClient, 'set').mockResolvedValue(undefined);
    jest.spyOn(redisClient, 'deleteByPattern').mockResolvedValue(0);
    
    // Мокаем minioClient
    jest.spyOn(minioClient, 'putObject').mockResolvedValue({ etag: 'mock-etag' });
    jest.spyOn(minioClient, 'getObject').mockResolvedValue(Buffer.from('test'));
    jest.spyOn(minioClient, 'removeObject').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('uploadPhoto', () => {
    test('загружает фото и создает запись в БД', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test')
      };
      
      const result = await photosService.uploadPhoto(file, 'animal', 1);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(10);
      expect(minioClient.putObject).toHaveBeenCalled();
      expect(photosDao.create).toHaveBeenCalled();
      expect(redisClient.deleteByPattern).toHaveBeenCalled();
    });

    test('выбрасывает ошибку при ошибке загрузки', async () => {
      const file = {
        originalname: 'test.jpg',
        mimetype: 'image/jpeg',
        size: 1024,
        buffer: Buffer.from('test')
      };
      
      jest.spyOn(minioClient, 'putObject').mockRejectedValue(new Error('Upload failed'));
      
      await expect(photosService.uploadPhoto(file, 'animal', 1))
        .rejects.toThrow('Upload failed');
    });
  });

  describe('getPhotoFile', () => {
    test('возвращает файл фото из MinIO', async () => {
      const result = await photosService.getPhotoFile('test.jpg');
      
      expect(result).toBeDefined();
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(photosDao.getByObjectName).toHaveBeenCalledWith('test.jpg');
      expect(minioClient.getObject).toHaveBeenCalled();
    });

    test('выбрасывает ошибку если фото не найдено', async () => {
      jest.spyOn(photosDao, 'getByObjectName').mockResolvedValue(null);
      
      await expect(photosService.getPhotoFile('nonexistent.jpg'))
        .rejects.toThrow('Photo not found');
    });
  });

  describe('getPhotoFileInfo', () => {
    test('возвращает информацию о фото из кэша', async () => {
      const cachedPhoto = { id: 1, object_name: 'test.jpg' };
      jest.spyOn(redisClient, 'get').mockResolvedValue(cachedPhoto);
      
      const result = await photosService.getPhotoFileInfo('test.jpg');
      
      expect(result).toEqual(cachedPhoto);
      expect(photosDao.getByObjectName).not.toHaveBeenCalled();
    });

    test('возвращает информацию о фото из БД если нет в кэше', async () => {
      const result = await photosService.getPhotoFileInfo('test.jpg');
      
      expect(result).toBeDefined();
      expect(redisClient.get).toHaveBeenCalled();
      expect(photosDao.getByObjectName).toHaveBeenCalledWith('test.jpg');
      expect(redisClient.set).toHaveBeenCalled();
    });

    test('выбрасывает ошибку если фото не найдено', async () => {
      jest.spyOn(photosDao, 'getByObjectName').mockResolvedValue(null);
      
      await expect(photosService.getPhotoFileInfo('nonexistent.jpg'))
        .rejects.toThrow('Photo not found');
    });
  });

  describe('deletePhoto', () => {
    test('удаляет фото из MinIO и БД', async () => {
      const result = await photosService.deletePhoto(1);
      
      expect(result).toBeDefined();
      expect(photosDao.getById).toHaveBeenCalledWith(1);
      expect(minioClient.removeObject).toHaveBeenCalled();
      expect(photosDao.remove).toHaveBeenCalledWith(1);
      expect(redisClient.deleteByPattern).toHaveBeenCalled();
    });

    test('выбрасывает ошибку если фото не найдено', async () => {
      jest.spyOn(photosDao, 'getById').mockResolvedValue(null);
      
      await expect(photosService.deletePhoto(999))
        .rejects.toThrow('Photo not found');
    });
  });

  describe('deletePhotosOfEntity', () => {
    test('удаляет все фото сущности', async () => {
      const result = await photosService.deletePhotosOfEntity(1, 'animal');
      
      expect(result).toEqual({ deleted: 1 });
      expect(photosDao.getByEntity).toHaveBeenCalledWith('animal', 1);
      expect(minioClient.removeObject).toHaveBeenCalled();
      expect(photosDao.remove).toHaveBeenCalled();
      expect(redisClient.deleteByPattern).toHaveBeenCalled();
    });

    test('возвращает deleted: 0 если фото нет', async () => {
      jest.spyOn(photosDao, 'getByEntity').mockResolvedValue([]);
      
      const result = await photosService.deletePhotosOfEntity(999, 'animal');
      
      expect(result).toEqual({ deleted: 0 });
      expect(photosDao.remove).not.toHaveBeenCalled();
    });
  });

  describe('createPhoto', () => {
    test('создает фото и инвалидирует кэш', async () => {
      const photoData = {
        original_name: 'photo.jpg',
        object_name: 'uuid-photo.jpg',
        entity_type: 'animal',
        entity_id: 1
      };
      
      const result = await photosService.createPhoto(photoData);
      
      expect(result).toBeDefined();
      expect(photosDao.create).toHaveBeenCalledWith(photoData);
      expect(redisClient.deleteByPattern).toHaveBeenCalled();
    });
  });

  describe('getPhoto', () => {
    test('возвращает фото из кэша', async () => {
      const cachedPhoto = { id: 1, original_name: 'photo.jpg' };
      jest.spyOn(redisClient, 'get').mockResolvedValue(cachedPhoto);
      
      const result = await photosService.getPhoto(1);
      
      expect(result).toEqual(cachedPhoto);
      expect(photosDao.getById).not.toHaveBeenCalled();
    });

    test('возвращает фото из БД если нет в кэше', async () => {
      const result = await photosService.getPhoto(1);
      
      expect(result).toBeDefined();
      expect(photosDao.getById).toHaveBeenCalledWith(1);
      expect(redisClient.set).toHaveBeenCalled();
    });

    test('возвращает null если фото не найдено', async () => {
      jest.spyOn(photosDao, 'getById').mockResolvedValue(null);
      
      const result = await photosService.getPhoto(999);
      
      expect(result).toBeNull();
      expect(redisClient.set).not.toHaveBeenCalled();
    });
  });

  describe('getPhotoByObjectName', () => {
    test('возвращает фото из кэша', async () => {
      const cachedPhoto = { id: 1, object_name: 'test.jpg' };
      jest.spyOn(redisClient, 'get').mockResolvedValue(cachedPhoto);
      
      const result = await photosService.getPhotoByObjectName('test.jpg');
      
      expect(result).toEqual(cachedPhoto);
      expect(photosDao.getByObjectName).not.toHaveBeenCalled();
    });

    test('возвращает фото из БД если нет в кэше', async () => {
      const result = await photosService.getPhotoByObjectName('test.jpg');
      
      expect(result).toBeDefined();
      expect(photosDao.getByObjectName).toHaveBeenCalledWith('test.jpg');
    });
  });

  describe('getPhotosByEntity', () => {
    test('возвращает фото сущности из кэша', async () => {
      const cachedPhotos = [{ id: 1 }];
      jest.spyOn(redisClient, 'get').mockResolvedValue(cachedPhotos);
      
      const result = await photosService.getPhotosByEntity('animal', 1);
      
      expect(result).toEqual(cachedPhotos);
      expect(photosDao.getByEntity).not.toHaveBeenCalled();
    });

    test('возвращает фото сущности из БД если нет в кэше', async () => {
      const result = await photosService.getPhotosByEntity('animal', 1);
      
      expect(result).toBeDefined();
      expect(photosDao.getByEntity).toHaveBeenCalledWith('animal', 1);
      expect(redisClient.set).toHaveBeenCalled();
    });
  });

  describe('getAllPhotos', () => {
    test('возвращает все фото из кэша', async () => {
      const cachedPhotos = [{ id: 1 }];
      jest.spyOn(redisClient, 'get').mockResolvedValue(cachedPhotos);
      
      const result = await photosService.getAllPhotos();
      
      expect(result).toEqual(cachedPhotos);
      expect(photosDao.getAll).not.toHaveBeenCalled();
    });

    test('возвращает все фото из БД если нет в кэше', async () => {
      const result = await photosService.getAllPhotos();
      
      expect(result).toBeDefined();
      expect(photosDao.getAll).toHaveBeenCalled();
      expect(redisClient.set).toHaveBeenCalled();
    });
  });

  describe('getPhotosByEntityType', () => {
    test('возвращает фото типа из кэша', async () => {
      const cachedPhotos = [{ id: 1 }];
      jest.spyOn(redisClient, 'get').mockResolvedValue(cachedPhotos);
      
      const result = await photosService.getPhotosByEntityType('animal');
      
      expect(result).toEqual(cachedPhotos);
      expect(photosDao.getByEntityType).not.toHaveBeenCalled();
    });

    test('возвращает фото типа из БД если нет в кэше', async () => {
      const result = await photosService.getPhotosByEntityType('animal');
      
      expect(result).toBeDefined();
      expect(photosDao.getByEntityType).toHaveBeenCalledWith('animal');
      expect(redisClient.set).toHaveBeenCalled();
    });
  });
});

