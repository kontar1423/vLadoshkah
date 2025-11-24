import { jest } from '@jest/globals';
import votesService from '../src/services/VotesService.js';
import votesDao from '../src/dao/VotesDao.js';
import sheltersDao from '../src/dao/sheltersDao.js';
import redisClient from '../src/cache/redis-client.js';

describe('VotesService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('выбрасывает 404 если приют не найден', async () => {
    jest.spyOn(sheltersDao, 'getById').mockResolvedValue(null);

    await expect(
      votesService.createVote({ userId: 1, shelterId: 99, vote: 5 })
    ).rejects.toMatchObject({ message: 'Shelter not found', status: 404 });
  });

  test('создает новый голос и обновляет рейтинг приюта', async () => {
    jest.spyOn(sheltersDao, 'getById').mockResolvedValue({ id: 1 });
    const getExistingSpy = jest.spyOn(votesDao, 'getByUserAndShelter').mockResolvedValue(null);
    const createSpy = jest.spyOn(votesDao, 'create').mockResolvedValue({
      id: 10,
      user_id: 1,
      shelter_id: 1,
      vote: 5
    });
    const updateSpy = jest.spyOn(votesDao, 'update').mockResolvedValue(null);
    jest.spyOn(votesDao, 'getAllByShelterId').mockResolvedValue([
      { id: 10, vote: 5 },
      { id: 11, vote: 3 }
    ]);
    const updateRatingSpy = jest.spyOn(sheltersDao, 'updateRating').mockResolvedValue({
      id: 1,
      rating: 4,
      total_ratings: 2
    });
    const cacheDeleteSpy = jest.spyOn(redisClient, 'delete').mockResolvedValue(undefined);

    const result = await votesService.createVote({ userId: 1, shelterId: 1, vote: 5 });

    expect(getExistingSpy).toHaveBeenCalledWith(1, 1);
    expect(createSpy).toHaveBeenCalledWith({ user_id: 1, shelter_id: 1, vote: 5 });
    expect(updateSpy).not.toHaveBeenCalled();
    expect(updateRatingSpy).toHaveBeenCalledWith(1, { rating: 4, totalRatings: 2 });
    expect(cacheDeleteSpy).toHaveBeenCalledWith('shelters:all');
    expect(cacheDeleteSpy).toHaveBeenCalledWith('shelter:1');
    expect(result.updated).toBe(false);
    expect(result.rating).toBe(4);
    expect(result.vote).toEqual({
      id: 10,
      user_id: 1,
      shelter_id: 1,
      vote: 5
    });
  });

  test('обновляет существующий голос пользователя', async () => {
    jest.spyOn(sheltersDao, 'getById').mockResolvedValue({ id: 1 });
    const existingVote = { id: 7, user_id: 1, shelter_id: 1, vote: 2 };
    jest.spyOn(votesDao, 'getByUserAndShelter').mockResolvedValue(existingVote);
    const updateVoteSpy = jest.spyOn(votesDao, 'update').mockResolvedValue({
      ...existingVote,
      vote: 4
    });
    const createSpy = jest.spyOn(votesDao, 'create');
    jest.spyOn(votesDao, 'getAllByShelterId').mockResolvedValue([
      { vote: 4 },
      { vote: 5 }
    ]);
    const updateRatingSpy = jest.spyOn(sheltersDao, 'updateRating').mockResolvedValue({
      id: 1,
      rating: 4.5,
      total_ratings: 2
    });
    const cacheDeleteSpy = jest.spyOn(redisClient, 'delete').mockResolvedValue(undefined);

    const result = await votesService.createVote({ userId: 1, shelterId: 1, vote: 4 });

    expect(createSpy).not.toHaveBeenCalled();
    expect(updateVoteSpy).toHaveBeenCalledWith({ id: 7, vote: 4 });
    expect(updateRatingSpy).toHaveBeenCalledWith(1, { rating: 4.5 });
    expect(cacheDeleteSpy).toHaveBeenCalledWith('shelters:all');
    expect(cacheDeleteSpy).toHaveBeenCalledWith('shelter:1');
    expect(result.updated).toBe(true);
    expect(result.rating).toBe(4.5);
    expect(result.vote).toEqual({
      id: 7,
      user_id: 1,
      shelter_id: 1,
      vote: 4
    });
  });

  test('getAllVotesOfShelter вызывает VotesDao', async () => {
    const votes = [{ id: 1, vote: 5 }];
    const getAllSpy = jest.spyOn(votesDao, 'getAllByShelterId').mockResolvedValue(votes);

    const result = await votesService.getAllVotesOfShelter(42);

    expect(getAllSpy).toHaveBeenCalledWith(42);
    expect(result).toBe(votes);
  });
});
