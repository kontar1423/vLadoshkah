import { jest } from '@jest/globals';
import usersService from '../src/services/usersService.js';
import usersDao from '../src/dao/usersDao.js';
import photosDao from '../src/dao/photosDao.js';
import photosService from '../src/services/photosService.js';
import redisClient from '../src/cache/redis-client.js';

describe('usersService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Мокаем методы usersDao
    jest.spyOn(usersDao, 'getAll').mockResolvedValue([
      { id: 1, email: 'user1@example.com', role: 'user' },
      { id: 2, email: 'user2@example.com', role: 'admin' }
    ]);
    
    jest.spyOn(usersDao, 'getById').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? 
        { id: 1, email: 'user1@example.com', role: 'user', firstname: 'John', lastname: 'Doe' } : 
        null
      );
    });
    
    jest.spyOn(usersDao, 'create').mockImplementation((data) => {
      return Promise.resolve({ id: 10, ...data });
    });
    
    jest.spyOn(usersDao, 'update').mockImplementation((id, data) => {
      return Promise.resolve(id === 1 ? { id, ...data } : null);
    });
    
    jest.spyOn(usersDao, 'remove').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? { id, email: 'user1@example.com' } : null);
    });
    
    // Мокаем методы photosDao
    jest.spyOn(photosDao, 'getByEntityType').mockResolvedValue([]);
    jest.spyOn(photosDao, 'getByEntity').mockResolvedValue([]);
    jest.spyOn(photosDao, 'remove').mockResolvedValue(true);
    
    // Мокаем photosService
    jest.spyOn(photosService, 'uploadPhoto').mockResolvedValue(undefined);
    
    // Мокаем redisClient
    jest.spyOn(redisClient, 'delete').mockResolvedValue(undefined);
    jest.spyOn(redisClient, 'get').mockResolvedValue(null);
    jest.spyOn(redisClient, 'set').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAll', () => {
    test('возвращает всех пользователей с фото', async () => {
      const result = await usersService.getAll();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(result[0].email).toBe('user1@example.com');
      expect(result[0].photos).toBeDefined();
      expect(usersDao.getAll).toHaveBeenCalled();
      expect(photosDao.getByEntityType).toHaveBeenCalledWith('user');
    });

    test('очищает кеш перед получением данных', async () => {
      await usersService.getAll();
      
      expect(redisClient.delete).toHaveBeenCalledWith('users:all');
    });

    test('корректно обрабатывает пользователей с фото', async () => {
      jest.spyOn(photosDao, 'getByEntityType').mockResolvedValue([
        { id: 1, entity_id: 1, entity_type: 'user', url: 'http://photo1.jpg' },
        { id: 2, entity_id: 2, entity_type: 'user', url: 'http://photo2.jpg' }
      ]);
      
      const result = await usersService.getAll();
      
      expect(result[0].photos).toHaveLength(1);
      expect(result[0].photos[0].url).toBe('http://photo1.jpg');
      expect(result[1].photos).toHaveLength(1);
      expect(result[1].photos[0].url).toBe('http://photo2.jpg');
    });
  });

  describe('getById', () => {
    test('возвращает пользователя по ID с фото', async () => {
      const result = await usersService.getById(1);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.email).toBe('user1@example.com');
      expect(result.photos).toBeDefined();
      expect(usersDao.getById).toHaveBeenCalledWith(1);
      expect(photosDao.getByEntity).toHaveBeenCalledWith('user', 1);
    });

    test('выбрасывает ошибку 404 если пользователь не найден', async () => {
      jest.spyOn(usersDao, 'getById').mockResolvedValue(null);
      
      await expect(usersService.getById(999)).rejects.toThrow('User not found');
    });

    test('очищает кеш конкретного пользователя', async () => {
      await usersService.getById(1);
      
      expect(redisClient.delete).toHaveBeenCalledWith('user:1');
    });
  });

  describe('create', () => {
    test('создает пользователя без фото', async () => {
      const userData = { 
        email: 'newuser@example.com', 
        password: 'password123',
        role: 'user'
      };
      
      // Мокаем getById который вызывается внутри create
      jest.spyOn(usersDao, 'getById').mockResolvedValue({
        id: 10,
        email: 'newuser@example.com',
        role: 'user'
      });
      
      const result = await usersService.create(userData);
      
      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(usersDao.create).toHaveBeenCalled();
      expect(photosService.uploadPhoto).not.toHaveBeenCalled();
    });

    test('создает пользователя с фото', async () => {
      const userData = { 
        email: 'newuser@example.com', 
        password: 'password123',
        role: 'user'
      };
      const photoFile = { filename: 'photo.jpg', buffer: Buffer.from('test') };
      
      // Мокаем getById который вызывается внутри create
      jest.spyOn(usersDao, 'getById').mockResolvedValue({
        id: 10,
        email: 'newuser@example.com',
        role: 'user'
      });
      
      const result = await usersService.create(userData, photoFile);
      
      expect(result).toBeDefined();
      expect(usersDao.create).toHaveBeenCalled();
      expect(photosService.uploadPhoto).toHaveBeenCalledWith(photoFile, 'user', 10);
    });

    test('хеширует пароль перед сохранением', async () => {
      const userData = { 
        email: 'newuser@example.com', 
        password: 'plaintext',
        role: 'user'
      };
      
      // Мокаем getById который вызывается внутри create
      jest.spyOn(usersDao, 'getById').mockResolvedValue({
        id: 10,
        email: 'newuser@example.com',
        role: 'user'
      });
      
      await usersService.create(userData);
      
      const createCall = usersDao.create.mock.calls[0][0];
      expect(createCall.password).not.toBe('plaintext');
    });

    test('не хеширует уже захешированный пароль', async () => {
      const userData = { 
        email: 'newuser@example.com', 
        password: '$2b$10$already_hashed',
        role: 'user'
      };
      
      // Мокаем getById который вызывается внутри create
      jest.spyOn(usersDao, 'getById').mockResolvedValue({
        id: 10,
        email: 'newuser@example.com',
        role: 'user'
      });
      
      await usersService.create(userData);
      
      const createCall = usersDao.create.mock.calls[0][0];
      expect(createCall.password).toBe('$2b$10$already_hashed');
    });

    test('очищает кеш всех пользователей', async () => {
      const userData = { email: 'new@example.com', password: 'pass', role: 'user' };
      
      // Мокаем getById который вызывается внутри create
      jest.spyOn(usersDao, 'getById').mockResolvedValue({
        id: 10,
        email: 'new@example.com',
        role: 'user'
      });
      
      await usersService.create(userData);
      
      expect(redisClient.delete).toHaveBeenCalledWith('users:all');
    });
  });

  describe('update', () => {
    test('обновляет пользователя без фото', async () => {
      const updateData = { firstname: 'Jane', lastname: 'Smith' };
      
      const result = await usersService.update(1, updateData);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(usersDao.update).toHaveBeenCalledWith(1, updateData);
    });

    test('обновляет пользователя с новым фото', async () => {
      const updateData = { firstname: 'Jane' };
      const photoFile = { filename: 'new-photo.jpg', buffer: Buffer.from('test') };
      
      jest.spyOn(photosDao, 'getByEntity').mockResolvedValue([
        { id: 1, url: 'old-photo.jpg' }
      ]);
      
      const result = await usersService.update(1, updateData, photoFile);
      
      expect(photosDao.remove).toHaveBeenCalledWith(1);
      expect(photosService.uploadPhoto).toHaveBeenCalledWith(photoFile, 'user', 1);
      expect(result).toBeDefined();
    });

    test('хеширует новый пароль', async () => {
      const updateData = { password: 'newpassword' };
      
      await usersService.update(1, updateData);
      
      const updateCall = usersDao.update.mock.calls[0][1];
      expect(updateCall.password).not.toBe('newpassword');
    });

    test('выбрасывает ошибку 404 если пользователь не найден', async () => {
      jest.spyOn(usersDao, 'update').mockResolvedValue(null);
      
      await expect(usersService.update(999, { firstname: 'Test' }))
        .rejects.toThrow('User not found or not updated');
    });

    test('очищает оба кеша при обновлении', async () => {
      await usersService.update(1, { firstname: 'Updated' });
      
      expect(redisClient.delete).toHaveBeenCalledWith('users:all');
      expect(redisClient.delete).toHaveBeenCalledWith('user:1');
    });
  });

  describe('remove', () => {
    test('удаляет пользователя без фото', async () => {
      jest.spyOn(photosDao, 'getByEntity').mockResolvedValue([]);
      
      const result = await usersService.remove(1);
      
      expect(result).toBeDefined();
      expect(usersDao.remove).toHaveBeenCalledWith(1);
      expect(photosDao.remove).not.toHaveBeenCalled();
    });

    test('удаляет пользователя с фото', async () => {
      jest.spyOn(photosDao, 'getByEntity').mockResolvedValue([
        { id: 1, url: 'photo1.jpg' },
        { id: 2, url: 'photo2.jpg' }
      ]);
      
      const result = await usersService.remove(1);
      
      expect(photosDao.remove).toHaveBeenCalledTimes(2);
      expect(photosDao.remove).toHaveBeenCalledWith(1);
      expect(photosDao.remove).toHaveBeenCalledWith(2);
      expect(usersDao.remove).toHaveBeenCalledWith(1);
    });

    test('выбрасывает ошибку 404 если пользователь не найден', async () => {
      jest.spyOn(usersDao, 'remove').mockResolvedValue(null);
      
      await expect(usersService.remove(999)).rejects.toThrow('User not found');
    });

    test('очищает оба кеша при удалении', async () => {
      await usersService.remove(1);
      
      expect(redisClient.delete).toHaveBeenCalledWith('users:all');
      expect(redisClient.delete).toHaveBeenCalledWith('user:1');
    });
  });
});

