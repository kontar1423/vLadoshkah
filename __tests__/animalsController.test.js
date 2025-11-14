import { jest } from '@jest/globals';
import animalsController from '../controllers/animalsController.js';
import animalsService from '../services/animalsService.js';
import sheltersDao from '../dao/sheltersDao.js';
import animalsDao from '../dao/animalsDao.js';

describe('animalsController', () => {
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
    
    // Мокаем animalsDao для проверки доступа
    jest.spyOn(animalsDao, 'getById').mockResolvedValue(null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('getAll', () => {
    test('возвращает всех животных', async () => {
      const mockAnimals = [
        { id: 1, name: 'Rex', type: 'dog' },
        { id: 2, name: 'Fluffy', type: 'cat' }
      ];

      jest.spyOn(animalsService, 'getAllAnimals').mockResolvedValue(mockAnimals);

      await animalsController.getAll(req, res);

      expect(res.json).toHaveBeenCalledWith(mockAnimals);
      expect(animalsService.getAllAnimals).toHaveBeenCalled();
    });

    test('возвращает 500 при ошибке', async () => {
      jest.spyOn(animalsService, 'getAllAnimals').mockRejectedValue(new Error('DB error'));

      await animalsController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getById', () => {
    test('возвращает животное по ID', async () => {
      const mockAnimal = { id: 1, name: 'Rex', type: 'dog' };
      req.params.id = '1';

      jest.spyOn(animalsService, 'getAnimalById').mockResolvedValue(mockAnimal);

      await animalsController.getById(req, res);

      expect(res.json).toHaveBeenCalledWith(mockAnimal);
      expect(animalsService.getAnimalById).toHaveBeenCalledWith(1);
    });

    test('возвращает 404 если животное не найдено', async () => {
      req.params.id = '999';

      jest.spyOn(animalsService, 'getAnimalById').mockResolvedValue(null);

      await animalsController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Not found' });
    });

    test('возвращает 400 при невалидном ID', async () => {
      req.params.id = 'invalid';

      await animalsController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid id' });
    });

    test('возвращает 500 при ошибке', async () => {
      req.params.id = '1';
      jest.spyOn(animalsService, 'getAnimalById').mockRejectedValue(new Error('DB error'));

      await animalsController.getById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('getAnimalsWithFilters', () => {
    test('возвращает животных с фильтрами', async () => {
      const mockAnimals = [{ id: 1, name: 'Rex', type: 'dog' }];
      req.query = { type: 'dog', age_min: '1', age_max: '5' };

      jest.spyOn(animalsService, 'findAnimals').mockResolvedValue(mockAnimals);

      await animalsController.getAnimalsWithFilters(req, res);

      expect(res.json).toHaveBeenCalledWith(mockAnimals);
      expect(animalsService.findAnimals).toHaveBeenCalledWith({
        type: 'dog',
        age_min: 1,
        age_max: 5
      });
    });

    test('возвращает 500 при ошибке', async () => {
      req.query = { type: 'dog' };
      jest.spyOn(animalsService, 'findAnimals').mockRejectedValue(new Error('DB error'));

      await animalsController.getAnimalsWithFilters(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
    });
  });

  describe('getAllByShelterId', () => {
    test('возвращает животных приюта', async () => {
      const mockAnimals = [{ id: 1, name: 'Rex', shelter_id: 1 }];
      req.params.shelterId = '1';

      jest.spyOn(animalsService, 'getAnimalsByShelterId').mockResolvedValue(mockAnimals);

      await animalsController.getAllByShelterId(req, res);

      expect(res.json).toHaveBeenCalledWith(mockAnimals);
      expect(animalsService.getAnimalsByShelterId).toHaveBeenCalledWith(1);
    });

    test('возвращает 400 при невалидном ID', async () => {
      req.params.shelterId = 'invalid';

      await animalsController.getAllByShelterId(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid id' });
    });

    test('возвращает 500 при ошибке', async () => {
      req.params.shelterId = '1';
      jest.spyOn(animalsService, 'getAnimalsByShelterId').mockRejectedValue(new Error('DB error'));

      await animalsController.getAllByShelterId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
  });

  describe('create', () => {
    test('создает животное от админа', async () => {
      const mockAnimal = { id: 10, name: 'New Dog', shelter_id: 1 };
      req.user = { role: 'admin' };
      req.body = { name: 'New Dog', shelter_id: 1 };

      jest.spyOn(animalsService, 'createAnimal').mockResolvedValue(mockAnimal);

      await animalsController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        success: true,
        animal: mockAnimal
      }));
    });

    test('создает животное с проверкой доступа для shelter_admin', async () => {
      const mockAnimal = { id: 10, name: 'New Dog', shelter_id: 1 };
      req.user = { role: 'shelter_admin', userId: 1 };
      req.body = { name: 'New Dog', shelter_id: 1 };

      jest.spyOn(sheltersDao, 'getByAdminId').mockResolvedValue([
        { id: 1, admin_id: 1 }
      ]);
      jest.spyOn(animalsService, 'createAnimal').mockResolvedValue(mockAnimal);

      await animalsController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(sheltersDao.getByAdminId).toHaveBeenCalledWith(1);
    });

    test('возвращает 403 для shelter_admin без доступа к приюту', async () => {
      req.user = { role: 'shelter_admin', userId: 1 };
      req.body = { name: 'New Dog', shelter_id: 999 };

      jest.spyOn(sheltersDao, 'getByAdminId').mockResolvedValue([
        { id: 1, admin_id: 1 }
      ]);

      await animalsController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'You can only create animals in your own shelter'
      });
    });

    test('возвращает 400 при ошибке', async () => {
      req.user = { role: 'admin' };
      req.body = { name: 'New Dog' };
      jest.spyOn(animalsService, 'createAnimal').mockRejectedValue(new Error('DB error'));

      await animalsController.create(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('update', () => {
    test('обновляет животное от админа', async () => {
      const mockAnimal = { id: 1, name: 'Updated Dog', type: 'dog' };
      req.user = { role: 'admin' };
      req.params.id = '1';
      req.body = { name: 'Updated Dog' };

      jest.spyOn(animalsService, 'updateAnimal').mockResolvedValue(mockAnimal);

      await animalsController.update(req, res);

      expect(res.json).toHaveBeenCalledWith(mockAnimal);
      expect(animalsService.updateAnimal).toHaveBeenCalledWith(1, { name: 'Updated Dog' });
    });

    test('возвращает 400 при невалидном ID', async () => {
      req.params.id = 'invalid';
      req.user = { role: 'admin' };

      await animalsController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('возвращает 400 при ошибке', async () => {
      req.params.id = '1';
      req.user = { role: 'admin' };
      jest.spyOn(animalsService, 'updateAnimal').mockRejectedValue(new Error('DB error'));

      await animalsController.update(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });
  });

  describe('remove', () => {
    test('удаляет животное от админа', async () => {
      req.user = { role: 'admin' };
      req.params.id = '1';

      jest.spyOn(animalsService, 'removeAnimal').mockResolvedValue(true);

      await animalsController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalled();
      expect(animalsService.removeAnimal).toHaveBeenCalledWith(1);
    });

    test('возвращает 400 при невалидном ID', async () => {
      req.params.id = 'invalid';
      req.user = { role: 'admin' };

      await animalsController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
    });

    test('возвращает 500 при ошибке', async () => {
      req.params.id = '1';
      req.user = { role: 'admin' };
      jest.spyOn(animalsService, 'removeAnimal').mockRejectedValue(new Error('DB error'));

      await animalsController.remove(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
    });
  });
});

