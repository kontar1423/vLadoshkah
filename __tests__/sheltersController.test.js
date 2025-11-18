import { jest } from '@jest/globals';
import sheltersController from '../src/controllers/sheltersController.js';
import sheltersService from '../src/services/sheltersService.js';

describe('sheltersController', () => {
  let req, res;

  beforeEach(() => {
    req = {
      params: {},
      query: {},
      body: {},
      user: null,
      log: {
        error: jest.fn(),
        warn: jest.fn()
      }
    };

    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn()
    };

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAll', () => {
    test('возвращает все приюты', async () => {
      const mockShelters = [
        { id: 1, name: 'Home Shelter' },
        { id: 2, name: 'Hope Shelter' }
      ];

      jest.spyOn(sheltersService, 'getAllShelters').mockResolvedValue(mockShelters);

      await sheltersController.getAll(req, res);

      expect(res.json).toHaveBeenCalledWith(mockShelters);
      expect(sheltersService.getAllShelters).toHaveBeenCalled();
    });

    test('возвращает 500 при ошибке', async () => {
      jest.spyOn(sheltersService, 'getAllShelters').mockRejectedValue(new Error('DB error'));

      await sheltersController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getById', () => {
    test('возвращает приют по ID', async () => {
      const mockShelter = { id: 1, name: 'Home Shelter' };
      req.params.id = '1';

      jest.spyOn(sheltersService, 'getShelterById').mockResolvedValue(mockShelter);

      await sheltersController.getById(req, res);

      expect(res.json).toHaveBeenCalledWith(mockShelter);
      expect(sheltersService.getShelterById).toHaveBeenCalledWith(1);
    });

    test('возвращает 404 если приют не найден', async () => {
      req.params.id = '999';

      jest.spyOn(sheltersService, 'getShelterById').mockResolvedValue(null);

      await sheltersController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
    });

    test('возвращает 400 при невалидном ID', async () => {
      req.params.id = 'invalid';

      await sheltersController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid id' });
    });

    test('возвращает 500 при ошибке', async () => {
      req.params.id = '1';
      jest.spyOn(sheltersService, 'getShelterById').mockRejectedValue(new Error('DB error'));

      await sheltersController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('create', () => {
    test('создает приют', async () => {
      const mockShelter = { id: 10, name: 'New Shelter' };
      req.body = { name: 'New Shelter' };

      jest.spyOn(sheltersService, 'createShelter').mockResolvedValue(mockShelter);

      await sheltersController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockShelter);
      expect(sheltersService.createShelter).toHaveBeenCalledWith(req.body);
    });

    test('возвращает 400 при ошибке', async () => {
      req.body = { name: 'New Shelter' };
      jest.spyOn(sheltersService, 'createShelter').mockRejectedValue(new Error('Validation error'));

      await sheltersController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Validation error' });
    });
  });

  describe('update', () => {
    test('обновляет приют', async () => {
      const mockShelter = { id: 1, name: 'Updated Shelter' };
      req.params.id = '1';
      req.body = { name: 'Updated Shelter' };

      jest.spyOn(sheltersService, 'updateShelter').mockResolvedValue(mockShelter);

      await sheltersController.update(req, res);

      expect(res.json).toHaveBeenCalledWith(mockShelter);
      expect(sheltersService.updateShelter).toHaveBeenCalledWith(1, req.body);
    });

    test('возвращает 404 если приют не найден', async () => {
      req.params.id = '999';
      req.body = { name: 'Updated Shelter' };

      jest.spyOn(sheltersService, 'updateShelter').mockResolvedValue(null);

      await sheltersController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
    });

    test('возвращает 400 при невалидном ID', async () => {
      req.params.id = 'invalid';
      req.body = { name: 'Updated Shelter' };

      await sheltersController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('возвращает 400 при ошибке', async () => {
      req.params.id = '1';
      req.body = { name: 'Updated Shelter' };
      jest.spyOn(sheltersService, 'updateShelter').mockRejectedValue(new Error('Validation error'));

      await sheltersController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('remove', () => {
    test('удаляет приют', async () => {
      req.params.id = '1';

      jest.spyOn(sheltersService, 'removeShelter').mockResolvedValue({ id: 1 });

      await sheltersController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
      expect(sheltersService.removeShelter).toHaveBeenCalledWith(1);
    });

    test('возвращает 404 если приют не найден', async () => {
      req.params.id = '999';

      jest.spyOn(sheltersService, 'removeShelter').mockResolvedValue(null);

      await sheltersController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
    });

    test('возвращает 400 при невалидном ID', async () => {
      req.params.id = 'invalid';

      await sheltersController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('возвращает 500 при ошибке', async () => {
      req.params.id = '1';
      jest.spyOn(sheltersService, 'removeShelter').mockRejectedValue(new Error('DB error'));

      await sheltersController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });
});

