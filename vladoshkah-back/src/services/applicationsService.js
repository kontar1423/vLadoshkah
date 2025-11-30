import applicationsDao from '../dao/applicationsDao.js';
import logger from '../logger.js';
import redisClient from '../cache/redis-client.js';

const CACHE_KEYS = {
  ALL_TAKE: 'applications:take:all',
  TAKE_BY_ID: (id) => `application:take:${id}`,
};

async function invalidateCache(id = null) {
  const tasks = [redisClient.delete(CACHE_KEYS.ALL_TAKE)];
  if (id) {
    tasks.push(redisClient.delete(CACHE_KEYS.TAKE_BY_ID(id)));
  }
  await Promise.all(tasks);
}

async function createTake(applicationData) {
  try {
    const payload = { ...applicationData, type: 'take' };
    const application = await applicationsDao.create(payload);
    if (!application) {
      throw new Error('Failed to create application');
    }

    await invalidateCache(application.id);
    return application;
  } catch (err) {
    logger.error(err, 'Service: error creating take application');
    throw err;
  }
}

async function getTakeById(id) {
  try {
    await invalidateCache(id);

    const application = await applicationsDao.getById(id, 'take');
    if (!application) {
      throw new Error('Application not found');
    }

    await redisClient.set(CACHE_KEYS.TAKE_BY_ID(id), application, 300); // кэш на 5 минут
    return application;
  } catch (err) {
    logger.error(err, 'Service: error fetching take application by id');
    throw err;
  }
}

async function getTakeByAnimalId(animalId) {
  try {
    const applications = await applicationsDao.getAllByAnimalId(animalId, 'take');
    return applications;
  } catch (err) {
    logger.error(err, 'Service: error fetching take applications by animal id');
    throw err;
  }
}

async function getAllTake() {
  try {
    await redisClient.delete(CACHE_KEYS.ALL_TAKE);

    const applications = await applicationsDao.getAll({ type: 'take' });
    await redisClient.set(CACHE_KEYS.ALL_TAKE, applications, 300); // кэш на 5 минут
    return applications;
  } catch (err) {
    logger.error(err, 'Service: error fetching all take applications');
    throw err;
  }
}

async function updateTake(id, applicationData) {
  try {
    await invalidateCache(id);
    const application = await applicationsDao.update(id, { ...applicationData, type: 'take' }, 'take');
    if (!application) {
      throw new Error('Application not found');
    }

    await invalidateCache(id);
    return application;
  } catch (err) {
    logger.error(err, 'Service: error updating take application');
    throw err;
  }
}

async function removeTake(id) {
  try {
    await invalidateCache(id);
    const application = await applicationsDao.remove(id, 'take');
    if (!application) {
      throw new Error('Application not found');
    }

    await invalidateCache(id);
    return application;
  } catch (err) {
    logger.error(err, 'Service: error removing take application');
    throw err;
  }
}

async function countApprovedTake() {
  try {
    const count = await applicationsDao.countByStatus('approved', 'take');
    return { count };
  } catch (err) {
    logger.error(err, 'Service: error counting approved take applications');
    throw err;
  }
}

export default { 
  createTake, 
  getTakeById, 
  getTakeByAnimalId,
  getAllTake, 
  updateTake, 
  removeTake, 
  countApprovedTake 
};
