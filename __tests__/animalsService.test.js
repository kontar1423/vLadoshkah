import { jest } from '@jest/globals';
import animalsService from '../services/animalsService.js';
import animalsDao from '../dao/animalsDao.js';
import photosDao from '../dao/photosDao.js';

describe('animalsService', () => {
  beforeEach(() => {
    // Мокаем все методы DAO используя jest.spyOn
    jest.spyOn(animalsDao, 'getAll').mockResolvedValue([{ id: 1, name: 'Rex', shelter_id: 1 }]);
    jest.spyOn(animalsDao, 'getById').mockResolvedValue({ id: 1, name: 'Rex', age: 3, type: 'dog', shelter_id: 1 });
    jest.spyOn(animalsDao, 'getAnimalsByShelter').mockResolvedValue([{ id: 1, shelter_id: 1 }]);
    jest.spyOn(animalsDao, 'create').mockResolvedValue({ id: 10, name: 'Rex', age: 3, type: 'dog', shelter_id: 1 });
    jest.spyOn(animalsDao, 'update').mockResolvedValue({ id: 1, name: 'Rex Updated', age: 4, type: 'dog', shelter_id: 1 });
    jest.spyOn(animalsDao, 'remove').mockResolvedValue(true);
    jest.spyOn(animalsDao, 'findAnimals').mockResolvedValue([{ id: 1 }]);
    jest.spyOn(photosDao, 'getByEntityType').mockResolvedValue([]);
    jest.spyOn(photosDao, 'getByEntity').mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getAllAnimals returns list', async () => {
    const res = await animalsService.getAllAnimals();
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThanOrEqual(0);
    expect(animalsDao.getAll).toHaveBeenCalled();
  });

  test('getAnimalById returns animal', async () => {
    const res = await animalsService.getAnimalById(1);
    expect(res).toBeDefined();
    expect(res.id).toBe(1);
    expect(animalsDao.getById).toHaveBeenCalledWith(1);
  });

  test('getAnimalById returns null for non-existent id', async () => {
    animalsDao.getById.mockResolvedValueOnce(null);
    
    const res = await animalsService.getAnimalById(999);
    expect(res).toBeNull();
  });

  test('createAnimal works with valid input', async () => {
    const data = { name: 'Rex', age: 3, type: 'dog', shelter_id: 1 };
    const created = await animalsService.createAnimal(data);
    expect(created).toBeDefined();
    expect(created.id).toBeDefined();
    expect(animalsDao.create).toHaveBeenCalled();
  });

  test('updateAnimal works with valid input', async () => {
    const data = { name: 'Rex Updated', age: 4 };
    const updated = await animalsService.updateAnimal(1, data);
    expect(updated).toBeDefined();
    expect(updated.id).toBe(1);
    expect(animalsDao.update).toHaveBeenCalledWith(1, data);
  });

  test('updateAnimal returns null for non-existent id', async () => {
    animalsDao.update.mockResolvedValueOnce(null);
    
    const res = await animalsService.updateAnimal(999, { name: 'Rex' });
    expect(res).toBeNull();
  });

  test('removeAnimal works', async () => {
    const res = await animalsService.removeAnimal(1);
    expect(res).toBeDefined();
    expect(animalsDao.remove).toHaveBeenCalledWith(1);
  });

  test('getAnimalsByShelterId returns animals', async () => {
    const res = await animalsService.getAnimalsByShelterId(1);
    expect(Array.isArray(res)).toBe(true);
    expect(animalsDao.getAnimalsByShelter).toHaveBeenCalledWith(1);
  });

  test('findAnimals works with filters', async () => {
    const filters = { type: 'dog', gender: 'male' };
    const res = await animalsService.findAnimals(filters);
    expect(Array.isArray(res)).toBe(true);
    expect(animalsDao.findAnimals).toHaveBeenCalledWith(filters);
  });
});
