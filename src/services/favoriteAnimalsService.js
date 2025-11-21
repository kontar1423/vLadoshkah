import favoriteAnimalsDao from '../dao/favoriteAnimalsDao.js';
import animalsDao from '../dao/animalsDao.js';
import usersDao from '../dao/usersDao.js';
import logger from '../logger.js';

async function ensureUserAndAnimal(userId, animalId) {
  const [user, animal] = await Promise.all([
    usersDao.getById(userId),
    animalsDao.getById(animalId)
  ]);

  if (!user) {
    const error = new Error('User not found');
    error.status = 404;
    throw error;
  }

  if (!animal) {
    const error = new Error('Animal not found');
    error.status = 404;
    throw error;
  }
}

async function isFavorite(userId, animalId) {
  try {
    await ensureUserAndAnimal(userId, animalId);
    const favorite = await favoriteAnimalsDao.find(userId, animalId);
    return Boolean(favorite);
  } catch (err) {
    logger.error(err, 'Service: error checking favorite');
    throw err;
  }
}

async function addFavorite(userId, animalId) {
  try {
    await ensureUserAndAnimal(userId, animalId);

    const existing = await favoriteAnimalsDao.find(userId, animalId);
    if (existing) {
      return { isFavorite: true, created: false };
    }

    const favorite = await favoriteAnimalsDao.create({
      user_id: userId,
      animal_id: animalId
    });

    return {
      isFavorite: Boolean(favorite),
      created: Boolean(favorite)
    };
  } catch (err) {
    logger.error(err, 'Service: error adding favorite');
    throw err;
  }
}

async function removeFavorite(userId, animalId) {
  try {
    await ensureUserAndAnimal(userId, animalId);
    const removed = await favoriteAnimalsDao.remove(userId, animalId);

    return {
      isFavorite: false,
      removed: Boolean(removed)
    };
  } catch (err) {
    logger.error(err, 'Service: error removing favorite');
    throw err;
  }
}

async function isFavoriteBulk(userId, animalIds = []) {
  try {
    if (!Array.isArray(animalIds) || animalIds.length === 0) {
      return {};
    }

    const validIds = animalIds
      .map((id) => Number(id))
      .filter((id) => Number.isInteger(id) && id > 0);

    if (!validIds.length) {
      return {};
    }

    const favorites = await favoriteAnimalsDao.getByUserAndAnimalIds(userId, validIds);
    const favoriteSet = new Set(favorites);

    return validIds.reduce((acc, id) => {
      acc[id] = favoriteSet.has(id);
      return acc;
    }, {});
  } catch (err) {
    logger.error(err, 'Service: error checking favorite bulk');
    throw err;
  }
}

export default {
  isFavorite,
  addFavorite,
  removeFavorite,
  isFavoriteBulk
};
