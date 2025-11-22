const animalsService = require('../services/animalsService');

jest.mock('../dao/animalsDao', () => ({
  getAll: jest.fn().mockResolvedValue([{ id: 1 }]),
  getById: jest.fn().mockResolvedValue({ id: 1 }),
  create: jest.fn().mockImplementation(async (val) => ({ id: 10, ...val })),
  update: jest.fn().mockImplementation(async (id, val) => ({ id, ...val })),
  remove: jest.fn().mockResolvedValue({ id: 1 })
}));

describe('animalsService', () => {
  test('getAllAnimals returns list', async () => {
    const res = await animalsService.getAllAnimals();
    expect(Array.isArray(res)).toBe(true);
  });

  test('createAnimal validates input (name required)', async () => {
    await expect(animalsService.createAnimal({ age: 1, type: 'dog', shelter_id: 1 }))
      .rejects.toThrow();
  });

  test('createAnimal works with valid input', async () => {
    const data = { name: 'Rex', age: 3, type: 'dog', shelter_id: 1 };
    const created = await animalsService.createAnimal(data);
    expect(created).toMatchObject(data);
    expect(created.id).toBeDefined();
  });

  test('updateAnimal validates input (type invalid)', async () => {
    const data = { name: 'Rex', age: 3, type: 'invalid', shelter_id: 1 };
    await expect(animalsService.updateAnimal(1, data)).rejects.toThrow();
  });
});


