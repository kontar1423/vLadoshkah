import { jest } from '@jest/globals';
import applicationsService from '../src/services/applicationsService.js';
import applicationsDao from '../src/dao/applicationsDao.js';
import redisClient from '../src/cache/redis-client.js';

describe('applicationsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Мокаем методы applicationsDao
    jest.spyOn(applicationsDao, 'create').mockImplementation((data) => {
      return Promise.resolve({ id: 10, ...data, created_at: new Date(), updated_at: new Date() });
    });
    
    jest.spyOn(applicationsDao, 'getById').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? 
        { id: 1, user_id: 1, shelter_id: 1, animal_id: 1, status: 'pending', description: 'Test' } : 
        null
      );
    });
    
    jest.spyOn(applicationsDao, 'getAll').mockResolvedValue([
      { id: 1, user_id: 1, status: 'pending' },
      { id: 2, user_id: 2, status: 'approved' }
    ]);
    
    jest.spyOn(applicationsDao, 'update').mockImplementation((id, data) => {
      return Promise.resolve(id === 1 ? { id, ...data } : null);
    });
    
    jest.spyOn(applicationsDao, 'remove').mockImplementation((id) => {
      return Promise.resolve(id === 1 ? { id, user_id: 1, status: 'pending' } : null);
    });
    
    jest.spyOn(applicationsDao, 'countByStatus').mockResolvedValue(5);
    
    // Мокаем redisClient
    jest.spyOn(redisClient, 'delete').mockResolvedValue(undefined);
    jest.spyOn(redisClient, 'get').mockResolvedValue(null);
    jest.spyOn(redisClient, 'set').mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('create', () => {
    test('создает новую заявку', async () => {
      const applicationData = {
        user_id: 1,
        shelter_id: 1,
        animal_id: 1,
        status: 'pending',
        description: 'I want to adopt'
      };
      
      const result = await applicationsService.create(applicationData);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(10);
      expect(result.user_id).toBe(1);
      expect(applicationsDao.create).toHaveBeenCalledWith(applicationData);
    });

    test('инвалидирует кеш после создания', async () => {
      const applicationData = {
        user_id: 1,
        shelter_id: 1,
        animal_id: 1,
        status: 'pending',
        description: 'Test'
      };
      
      await applicationsService.create(applicationData);
      
      expect(redisClient.delete).toHaveBeenCalledWith('applications:all');
    });

    test('выбрасывает ошибку если создание не удалось', async () => {
      jest.spyOn(applicationsDao, 'create').mockResolvedValue(null);
      
      await expect(applicationsService.create({}))
        .rejects.toThrow('Failed to create application');
    });
  });

  describe('getById', () => {
    test('возвращает заявку по ID', async () => {
      const result = await applicationsService.getById(1);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.status).toBe('pending');
      expect(applicationsDao.getById).toHaveBeenCalledWith(1);
    });

    test('выбрасывает ошибку если заявка не найдена', async () => {
      jest.spyOn(applicationsDao, 'getById').mockResolvedValue(null);
      
      await expect(applicationsService.getById(999))
        .rejects.toThrow('Application not found');
    });

    test('инвалидирует кеш перед получением', async () => {
      await applicationsService.getById(1);
      
      expect(redisClient.delete).toHaveBeenCalledWith('applications:all');
      expect(redisClient.delete).toHaveBeenCalledWith('application:1');
    });

    test('сохраняет результат в кеш', async () => {
      await applicationsService.getById(1);
      
      expect(redisClient.set).toHaveBeenCalled();
    });
  });

  describe('getAll', () => {
    test('возвращает все заявки', async () => {
      const result = await applicationsService.getAll();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(applicationsDao.getAll).toHaveBeenCalled();
    });

    test('инвалидирует кеш перед получением', async () => {
      await applicationsService.getAll();
      
      expect(redisClient.delete).toHaveBeenCalledWith('applications:all');
    });

    test('сохраняет результат в кеш', async () => {
      await applicationsService.getAll();
      
      expect(redisClient.set).toHaveBeenCalledWith('applications:all', expect.any(Array), 300);
    });
  });

  describe('update', () => {
    test('обновляет заявку', async () => {
      const updateData = { status: 'approved' };
      
      const result = await applicationsService.update(1, updateData);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(applicationsDao.update).toHaveBeenCalledWith(1, updateData);
    });

    test('выбрасывает ошибку если заявка не найдена', async () => {
      jest.spyOn(applicationsDao, 'update').mockResolvedValue(null);
      
      await expect(applicationsService.update(999, { status: 'approved' }))
        .rejects.toThrow('Application not found');
    });

    test('инвалидирует кеш дважды (до и после обновления)', async () => {
      await applicationsService.update(1, { status: 'approved' });
      
      // Должно быть 2 вызова для applications:all и 2 для application:1
      expect(redisClient.delete).toHaveBeenCalledWith('applications:all');
      expect(redisClient.delete).toHaveBeenCalledWith('application:1');
      expect(redisClient.delete).toHaveBeenCalledTimes(4); // 2 до + 2 после
    });
  });

  describe('remove', () => {
    test('удаляет заявку', async () => {
      const result = await applicationsService.remove(1);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(applicationsDao.remove).toHaveBeenCalledWith(1);
    });

    test('выбрасывает ошибку если заявка не найдена', async () => {
      jest.spyOn(applicationsDao, 'remove').mockResolvedValue(null);
      
      await expect(applicationsService.remove(999))
        .rejects.toThrow('Application not found');
    });

    test('инвалидирует кеш дважды (до и после удаления)', async () => {
      await applicationsService.remove(1);
      
      expect(redisClient.delete).toHaveBeenCalledWith('applications:all');
      expect(redisClient.delete).toHaveBeenCalledWith('application:1');
      expect(redisClient.delete).toHaveBeenCalledTimes(4); // 2 до + 2 после
    });
  });

  describe('countApproved', () => {
    test('возвращает количество одобренных заявок', async () => {
      const result = await applicationsService.countApproved();
      
      expect(result).toEqual({ count: 5 });
      expect(applicationsDao.countByStatus).toHaveBeenCalledWith('approved');
    });

    test('корректно обрабатывает 0 одобренных заявок', async () => {
      jest.spyOn(applicationsDao, 'countByStatus').mockResolvedValue(0);
      
      const result = await applicationsService.countApproved();
      
      expect(result).toEqual({ count: 0 });
    });
  });
});

