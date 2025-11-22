import serviceVotesDao from '../dao/VotesDao.js';
import sheltersDao from '../dao/sheltersDao.js';
import redisClient from '../cache/redis-client.js';
import logger from '../logger.js';

const SHELTER_CACHE_KEYS = {
  ALL: 'shelters:all',
  BY_ID: (id) => `shelter:${id}`,
};

function calculateAverageVote(votes = []) {
  if (!votes.length) {
    return 0;
  }

  const total = votes.reduce((sum, vote) => sum + Number(vote.vote || 0), 0);
  return Number((total / votes.length).toFixed(2));
}

async function getAllVotesOfShelter(shelterId) {
  return serviceVotesDao.getAllByShelterId(shelterId);
}

async function createVote({ userId, shelterId, vote }) {
  const shelter = await sheltersDao.getById(shelterId);
  if (!shelter) {
    const error = new Error('Shelter not found');
    error.status = 404;
    throw error;
  }

  const existingVote = await serviceVotesDao.getByUserAndShelter(userId, shelterId);
  if (existingVote) {
    const error = new Error('User has already voted for this shelter');
    error.status = 409;
    throw error;
  }

  const createdVote = await serviceVotesDao.create({
    user_id: userId,
    shelter_id: shelterId,
    vote,
  });

  // Пересчитываем рейтинг приюта
  const votes = await getAllVotesOfShelter(shelterId);
  const rating = calculateAverageVote(votes);
  const updatedShelter = await sheltersDao.updateRating(shelterId, rating);

  // Инвалидируем кэш приютов
  await Promise.all([
    redisClient.delete(SHELTER_CACHE_KEYS.ALL),
    redisClient.delete(SHELTER_CACHE_KEYS.BY_ID(shelterId)),
  ]);

  logger.info({ shelterId, rating }, 'Service: updated shelter rating after vote');

  return {
    vote: createdVote,
    rating,
    shelter: updatedShelter,
  };
}

export default {
  createVote,
  getAllVotesOfShelter,
};
