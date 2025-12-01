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

  const isVoteUpdate = Boolean(existingVote);
  const createdVote = isVoteUpdate
    ? await serviceVotesDao.update({ id: existingVote.id, vote })
    : await serviceVotesDao.create({
        user_id: userId,
        shelter_id: shelterId,
        vote,
      });

  // Пересчитываем рейтинг приюта
  const votes = await getAllVotesOfShelter(shelterId);
  const rating = calculateAverageVote(votes);
  const totalRatings = votes.length;
  const updatedShelter = await sheltersDao.updateRating(
    shelterId,
    isVoteUpdate ? { rating } : { rating, totalRatings }
  );

  // Инвалидируем кэш приютов
  await Promise.all([
    redisClient.delete(SHELTER_CACHE_KEYS.ALL),
    redisClient.delete(SHELTER_CACHE_KEYS.BY_ID(shelterId)),
  ]);

  logger.info(
    { shelterId, rating, totalRatings, updatedExistingVote: isVoteUpdate },
    'Service: updated shelter rating after vote'
  );

  return {
    vote: createdVote,
    rating,
    shelter: updatedShelter,
    updated: isVoteUpdate,
  };
}

export default {
  createVote,
  getAllVotesOfShelter,
};
