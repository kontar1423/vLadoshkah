import { jest } from '@jest/globals';
import sheltersService from '../src/services/sheltersService.js';
import sheltersDao from '../src/dao/sheltersDao.js';
import photosDao from '../src/dao/photosDao.js';

describe('sheltersService', () => {
  beforeEach(() => {
    // Мокаем все методы DAO используя jest.spyOn
    jest.spyOn(sheltersDao, 'getAll').mockResolvedValue([{ id: 1, name: 'Home', admin_id: 10 }]);
    jest.spyOn(sheltersDao, 'getById').mockResolvedValue({ id: 1, name: 'Home', admin_id: 10 });
    jest.spyOn(sheltersDao, 'getByAdminId').mockResolvedValue([]);
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

  test('getAllShelters filters by admin_id when passed', async () => {
    sheltersDao.getByAdminId.mockResolvedValue([{ id: 2, name: 'Admin Shelter', admin_id: 5 }]);

    const res = await sheltersService.getAllShelters({ adminId: 5 });

    expect(sheltersDao.getByAdminId).toHaveBeenCalledWith(5);
    expect(sheltersDao.getAll).not.toHaveBeenCalled();
    expect(res[0].admin_id).toBe(5);
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

  test('getShelterByAdminId returns first shelter for admin', async () => {
    sheltersDao.getByAdminId.mockResolvedValueOnce([{ id: 2, name: 'Admin Shelter', admin_id: 7 }]);

    const res = await sheltersService.getShelterByAdminId(7);

    expect(sheltersDao.getByAdminId).toHaveBeenCalledWith(7);
    expect(res).toMatchObject({ id: 2, admin_id: 7 });
  });

  test('getShelterByAdminId returns null when admin has no shelter', async () => {
    sheltersDao.getByAdminId.mockResolvedValueOnce([]);

    const res = await sheltersService.getShelterByAdminId(999);
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

  test('createShelter binds admin_id for shelter_admin', async () => {
    const res = await sheltersService.createShelter({ name: 'Owned shelter' }, null, { role: 'shelter_admin', userId: 5 });
    expect(sheltersDao.create).toHaveBeenCalledWith(expect.objectContaining({ admin_id: 5 }));
    expect(res).toBeDefined();
  });

  test('createShelter forbids multiple shelters for shelter_admin', async () => {
    sheltersDao.getByAdminId.mockResolvedValueOnce([{ id: 1, admin_id: 5 }]);
    await expect(
      sheltersService.createShelter({ name: 'Another shelter' }, null, { role: 'shelter_admin', userId: 5 })
    ).rejects.toMatchObject({ status: 400 });
  });

  test('updateShelter succeeds with valid data', async () => {
    const data = { name: 'Updated Shelter' };
    const updated = await sheltersService.updateShelter(1, data);
    expect(updated).toBeDefined();
    expect(updated.id).toBe(1);
    expect(sheltersDao.update).toHaveBeenCalledWith(1, data);
  });

  test('updateShelter prohibits non-owned shelter for shelter_admin', async () => {
    sheltersDao.getById.mockResolvedValueOnce({ id: 1, admin_id: 99 });
    await expect(sheltersService.updateShelter(1, { name: 'Nope' }, { role: 'shelter_admin', userId: 5 }))
      .rejects.toMatchObject({ status: 403 });
  });

  test('updateShelter returns null for non-existent id', async () => {
    sheltersDao.getById.mockResolvedValueOnce(null);
    const res = await sheltersService.updateShelter(999, { name: 'Updated' }, { role: 'shelter_admin', userId: 5 });
    expect(res).toBeNull();
  });

  test('removeShelter works', async () => {
    const res = await sheltersService.removeShelter(1);
    expect(res).toBeDefined();
    expect(sheltersDao.remove).toHaveBeenCalledWith(1);
  });

  test('removeShelter prohibits non-owned shelter for shelter_admin', async () => {
    sheltersDao.getById.mockResolvedValueOnce({ id: 1, admin_id: 99 });
    await expect(sheltersService.removeShelter(1, { role: 'shelter_admin', userId: 5 }))
      .rejects.toMatchObject({ status: 403 });
  });
});
