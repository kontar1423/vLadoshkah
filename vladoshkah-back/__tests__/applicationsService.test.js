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

  describe('createTake', () => {
    test('создает новую заявку', async () => {
      const applicationData = {
        user_id: 1,
        shelter_id: 1,
        animal_id: 1,
        status: 'pending',
        description: 'I want to adopt'
      };
      
      const result = await applicationsService.createTake(applicationData);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(10);
      expect(result.user_id).toBe(1);
      expect(applicationsDao.create).toHaveBeenCalledWith(expect.objectContaining({ ...applicationData, type: 'take' }));
    });

    test('инвалидирует кеш после создания', async () => {
      const applicationData = {
        user_id: 1,
        shelter_id: 1,
        animal_id: 1,
        status: 'pending',
        description: 'Test'
      };
      
      await applicationsService.createTake(applicationData);
      
      expect(redisClient.delete).toHaveBeenCalledWith('applications:take:all');
    });

    test('выбрасывает ошибку если создание не удалось', async () => {
      jest.spyOn(applicationsDao, 'create').mockResolvedValue(null);
      
      await expect(applicationsService.createTake({}))
        .rejects.toThrow('Failed to create application');
    });
  });

  describe('getTakeById', () => {
    test('возвращает заявку по ID', async () => {
      const result = await applicationsService.getTakeById(1);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.status).toBe('pending');
      expect(applicationsDao.getById).toHaveBeenCalledWith(1, 'take');
    });

    test('выбрасывает ошибку если заявка не найдена', async () => {
      jest.spyOn(applicationsDao, 'getById').mockResolvedValue(null);
      
      await expect(applicationsService.getTakeById(999))
        .rejects.toThrow('Application not found');
    });

    test('инвалидирует кеш перед получением', async () => {
      await applicationsService.getTakeById(1);
      
      expect(redisClient.delete).toHaveBeenCalledWith('applications:take:all');
      expect(redisClient.delete).toHaveBeenCalledWith('application:take:1');
    });

    test('сохраняет результат в кеш', async () => {
      await applicationsService.getTakeById(1);
      
      expect(redisClient.set).toHaveBeenCalled();
    });
  });

  describe('getAllTake', () => {
    test('возвращает все заявки', async () => {
      const result = await applicationsService.getAllTake();
      
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(2);
      expect(applicationsDao.getAll).toHaveBeenCalledWith({ type: 'take' });
    });

    test('инвалидирует кеш перед получением', async () => {
      await applicationsService.getAllTake();
      
      expect(redisClient.delete).toHaveBeenCalledWith('applications:take:all');
    });

    test('сохраняет результат в кеш', async () => {
      await applicationsService.getAllTake();
      
      expect(redisClient.set).toHaveBeenCalledWith('applications:take:all', expect.any(Array), 300);
    });
  });

  describe('updateTake', () => {
    test('обновляет заявку', async () => {
      const updateData = { status: 'approved' };
      
      const result = await applicationsService.updateTake(1, updateData);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(applicationsDao.update).toHaveBeenCalledWith(1, { ...updateData, type: 'take' }, 'take');
    });

    test('выбрасывает ошибку если заявка не найдена', async () => {
      jest.spyOn(applicationsDao, 'update').mockResolvedValue(null);
      
      await expect(applicationsService.updateTake(999, { status: 'approved' }))
        .rejects.toThrow('Application not found');
    });

    test('инвалидирует кеш дважды (до и после обновления)', async () => {
      await applicationsService.updateTake(1, { status: 'approved' });
      
      // Должно быть 2 вызова для applications:take:all и 2 для application:take:1
      expect(redisClient.delete).toHaveBeenCalledWith('applications:take:all');
      expect(redisClient.delete).toHaveBeenCalledWith('application:take:1');
      expect(redisClient.delete).toHaveBeenCalledTimes(4); // 2 до + 2 после
    });
  });

  describe('removeTake', () => {
    test('удаляет заявку', async () => {
      const result = await applicationsService.removeTake(1);
      
      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(applicationsDao.remove).toHaveBeenCalledWith(1, 'take');
    });

    test('выбрасывает ошибку если заявка не найдена', async () => {
      jest.spyOn(applicationsDao, 'remove').mockResolvedValue(null);
      
      await expect(applicationsService.removeTake(999))
        .rejects.toThrow('Application not found');
    });

    test('инвалидирует кеш дважды (до и после удаления)', async () => {
      await applicationsService.removeTake(1);
      
      expect(redisClient.delete).toHaveBeenCalledWith('applications:take:all');
      expect(redisClient.delete).toHaveBeenCalledWith('application:take:1');
      expect(redisClient.delete).toHaveBeenCalledTimes(4); // 2 до + 2 после
    });
  });

  describe('countApprovedTake', () => {
    test('возвращает количество одобренных заявок', async () => {
      const result = await applicationsService.countApprovedTake();
      
      expect(result).toEqual({ count: 5 });
      expect(applicationsDao.countByStatus).toHaveBeenCalledWith('approved', 'take');
    });

    test('корректно обрабатывает 0 одобренных заявок', async () => {
      jest.spyOn(applicationsDao, 'countByStatus').mockResolvedValue(0);
      
      const result = await applicationsService.countApprovedTake();
      
      expect(result).toEqual({ count: 0 });
    });
  });
});
