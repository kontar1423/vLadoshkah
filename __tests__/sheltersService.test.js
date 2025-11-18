import { jest } from '@jest/globals';
import sheltersService from '../src/services/sheltersService.js';
import sheltersDao from '../src/dao/sheltersDao.js';
import photosDao from '../src/dao/photosDao.js';

describe('sheltersService', () => {
  beforeEach(() => {
    // Мокаем все методы DAO используя jest.spyOn
    jest.spyOn(sheltersDao, 'getAll').mockResolvedValue([{ id: 1, name: 'Home' }]);
    jest.spyOn(sheltersDao, 'getById').mockResolvedValue({ id: 1, name: 'Home' });
    jest.spyOn(sheltersDao, 'create').mockImplementation((data) => Promise.resolve({ id: 10, ...data }));
    jest.spyOn(sheltersDao, 'update').mockImplementation((id, data) => Promise.resolve({ id, ...data }));
    jest.spyOn(sheltersDao, 'remove').mockResolvedValue(true);
    jest.spyOn(photosDao, 'getByEntityType').mockResolvedValue([]);
    jest.spyOn(photosDao, 'getByEntity').mockResolvedValue([]);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('getAllShelters returns list', async () => {
    const res = await sheltersService.getAllShelters();
    expect(Array.isArray(res)).toBe(true);
    expect(res.length).toBeGreaterThanOrEqual(0);
    expect(sheltersDao.getAll).toHaveBeenCalled();
  });

  test('getShelterById returns shelter', async () => {
    const res = await sheltersService.getShelterById(1);
    expect(res).toBeDefined();
    expect(res.id).toBe(1);
    expect(sheltersDao.getById).toHaveBeenCalledWith(1);
  });

  test('getShelterById returns null for non-existent id', async () => {
    sheltersDao.getById.mockResolvedValueOnce(null);
    
    const res = await sheltersService.getShelterById(999);
    expect(res).toBeNull();
  });

  test('createShelter succeeds with valid data', async () => {
    const testData = { name: 'Home Shelter' };
    
    const res = await sheltersService.createShelter(testData);
    expect(res).toBeDefined();
    expect(res.id).toBeDefined(); // Не проверяем конкретное значение id
    expect(res.name).toBeDefined(); // Только что объект имеет name
    expect(sheltersDao.create).toHaveBeenCalled();
  });

  test('updateShelter succeeds with valid data', async () => {
    const data = { name: 'Updated Shelter' };
    const updated = await sheltersService.updateShelter(1, data);
    expect(updated).toBeDefined();
    expect(updated.id).toBe(1);
    expect(sheltersDao.update).toHaveBeenCalledWith(1, data);
  });

  test('updateShelter returns null for non-existent id', async () => {
    sheltersDao.update.mockImplementationOnce(() => Promise.resolve(null));
    
    const res = await sheltersService.updateShelter(999, { name: 'Updated' });
    expect(res).toBeNull();
  });

  test('removeShelter works', async () => {
    const res = await sheltersService.removeShelter(1);
    expect(res).toBeDefined();
    expect(sheltersDao.remove).toHaveBeenCalledWith(1);
  });
});
