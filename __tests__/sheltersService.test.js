const sheltersService = require('../services/sheltersService');

jest.mock('../dao/sheltersDao', () => ({
  getAll: jest.fn().mockResolvedValue([{ id: 1 }]),
  getById: jest.fn().mockResolvedValue({ id: 1, name: 'A' }),
  create: jest.fn().mockImplementation(async (name) => ({ id: 10, name })),
  update: jest.fn().mockImplementation(async (id, name) => ({ id, name })),
  remove: jest.fn().mockResolvedValue({ id: 1 })
}));

describe('sheltersService', () => {
  test('createShelter validates name', async () => {
    await expect(sheltersService.createShelter({})).rejects.toThrow();
  });

  test('createShelter succeeds', async () => {
    const res = await sheltersService.createShelter({ name: 'Home' });
    expect(res).toMatchObject({ id: 10, name: 'Home' });
  });

  test('updateShelter validates name', async () => {
    await expect(sheltersService.updateShelter(1, { name: '' })).rejects.toThrow();
  });
});


