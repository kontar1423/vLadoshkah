import { jest } from '@jest/globals';
import sheltersController from '../src/controllers/sheltersController.js';
import sheltersService from '../src/services/sheltersService.js';
import votesService from '../src/services/VotesService.js';

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
      expect(sheltersService.getAllShelters).toHaveBeenCalledWith({ limit: null, adminId: null });
    });

    test('возвращает 500 при ошибке', async () => {
      jest.spyOn(sheltersService, 'getAllShelters').mockRejectedValue(new Error('DB error'));

      await sheltersController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });

    test('фильтрует по admin_id если передан', async () => {
      req.query.admin_id = '5';
      const mockShelters = [{ id: 3, admin_id: 5 }];
      jest.spyOn(sheltersService, 'getAllShelters').mockResolvedValue(mockShelters);

      await sheltersController.getAll(req, res);

      expect(res.json).toHaveBeenCalledWith(mockShelters);
      expect(sheltersService.getAllShelters).toHaveBeenCalledWith({ limit: null, adminId: 5 });
    });

    test('возвращает 400 при невалидном admin_id', async () => {
      req.query.admin_id = 'abc';

      await sheltersController.getAll(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid admin_id' });
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
      expect(sheltersService.createShelter).toHaveBeenCalledWith(req.body, null, req.user);
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
      expect(sheltersService.updateShelter).toHaveBeenCalledWith(1, req.body, req.user);
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
      expect(sheltersService.removeShelter).toHaveBeenCalledWith(1, req.user);
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
      expect(res.json).toHaveBeenCalledWith({ error: 'DB error' });
    });
  });

  describe('vote', () => {
    test('возвращает 401 если пользователь не авторизован', async () => {
      req.user = null;
      req.body = { shelter_id: 1, vote: 4 };

      await sheltersController.vote(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
    });

    test('создает новый голос и возвращает 201', async () => {
      req.user = { userId: 2, role: 'user' };
      req.body = { shelter_id: 5, vote: 4 };
      jest.spyOn(votesService, 'createVote').mockResolvedValue({
        updated: false,
        rating: 3.5,
        vote: { id: 10, shelter_id: 5, user_id: 2, vote: 4 },
        shelter: { id: 5, rating: 3.5 }
      });

      await sheltersController.vote(req, res);

      expect(votesService.createVote).toHaveBeenCalledWith({
        userId: 2,
        shelterId: 5,
        vote: 4
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Vote recorded',
        rating: 3.5,
        vote: { id: 10, shelter_id: 5, user_id: 2, vote: 4 }
      });
    });

    test('обновляет существующий голос и возвращает 200', async () => {
      req.user = { userId: 3, role: 'user' };
      req.body = { shelter_id: 7, vote: 5 };
      jest.spyOn(votesService, 'createVote').mockResolvedValue({
        updated: true,
        rating: 4.2,
        vote: { id: 11, shelter_id: 7, user_id: 3, vote: 5 },
        shelter: { id: 7, rating: 4.2 }
      });

      await sheltersController.vote(req, res);

      expect(votesService.createVote).toHaveBeenCalledWith({
        userId: 3,
        shelterId: 7,
        vote: 5
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Vote updated',
        rating: 4.2,
        vote: { id: 11, shelter_id: 7, user_id: 3, vote: 5 }
      });
    });

    test('прокидывает статус и сообщение ошибки сервиса', async () => {
      req.user = { userId: 4, role: 'user' };
      req.body = { shelter_id: 2, vote: 1 };
      const err = Object.assign(new Error('Shelter not found'), { status: 404 });
      jest.spyOn(votesService, 'createVote').mockRejectedValue(err);

      await sheltersController.vote(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Shelter not found' });
    });
  });
});
