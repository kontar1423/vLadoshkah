import userDAO from '../dao/usersDao.js';
import photosDao from '../dao/photosDao.js';
import logger from '../logger.js';
import redisClient from '../cache/redis-client.js';
import photosService from './photosService.js';
const CACHE_KEYS = {
  ALL_USERS: 'users:all',
  USER_BY_ID: (id) => `user:${id}`,
};
async function getAll() {
  try {

    // Clear the all users cache since we're fetching all users
    await redisClient.delete(CACHE_KEYS.ALL_USERS);
    // Два параллельных запроса для оптимизации
    const [users, allPhotos] = await Promise.all([
      userDAO.getAll(),
      photosDao.getByEntityType('user')
    ]);
    
    const usersWithPhotos = users.map(user => ({
      ...user,
      photos: allPhotos
        .filter(photo => photo.entity_id === user.id)
        .map(photo => ({
          url: photo.url,
        }))
    }));
    
    return usersWithPhotos;
  } catch (err) {
    logger.error('Service: error fetching users with photos', err);
    throw err;
  }
}

async function getById(id) {
  try {
    // Clear the specific user cache since we're fetching a single user
    await redisClient.delete(CACHE_KEYS.USER_BY_ID(id));
    const [user, photos] = await Promise.all([
      userDAO.getById(id),
      photosDao.getByEntity('user', id)
    ]);
    
    if (!user) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    
    return {
      ...user,
      photos: photos.map(photo => ({
        url: photo.url,
      }))
    };
  } catch (err) {
    logger.error('Service: error fetching user by id', err);
    throw err;
  }
}

async function create(userData, photoFile = null) {
  try {
    // Clear the all users cache since we're adding a new one
    await redisClient.delete(CACHE_KEYS.ALL_USERS);
    logger.info('Service: creating user with data:', userData);
    
    // 1. Создаем пользователя
    const user = await userDAO.create(userData);
    
    // 2. Если есть фото - загружаем через photosService
    if (photoFile) {
      await photosService.uploadPhoto(
        photoFile, 
        'user', 
        user.id
      );
      logger.info('Service: photo uploaded for user', user.id);
    }
    
    // 3. Возвращаем пользователя с фото
    const userWithPhotos = await getById(user.id);
    return userWithPhotos;
    
  } catch (err) {
    logger.error('Service: error creating user', err);
    throw err;
  }
}

async function update(id, data, photoFile = null) {
  try {
    // Clear both the all users cache and the specific user cache
    await Promise.all([
      redisClient.delete(CACHE_KEYS.ALL_USERS),
      redisClient.delete(CACHE_KEYS.USER_BY_ID(id))
    ]);
    const updatedUser = await userDAO.update(id, data);
    if (!updatedUser) {
      const err = new Error('User not found or not updated');
      err.status = 404;
      throw err;
    }
    
    // Если передано новое фото - обновляем
    if (photoFile) {
      // Сначала удаляем старые фото пользователя
      const photos = await photosDao.getByEntity('user', id);
      if (photos.length > 0) {
        await Promise.all(photos.map(photo => photosDao.remove(photo.id)));
      }
      
      // Загружаем новое фото
      await photosService.uploadPhoto(
        photoFile, 
        'user', 
        id
      );
      logger.info('Service: photo updated for user', id);
    }
    
    // Возвращаем обновленного пользователя с фото
    return await getById(id);
  } catch (err) {
    logger.error('Service: error updating user', err);
    throw err;
  }
}

async function remove(id) {
  try {
    // При удалении пользователя удаляем его фото
    // Clear both the all users cache and the specific user cache
    await Promise.all([
      redisClient.delete(CACHE_KEYS.ALL_USERS),
      redisClient.delete(CACHE_KEYS.USER_BY_ID(id))
    ]);
    const photos = await photosDao.getByEntity('user', id);
    if (photos.length > 0) {
      await Promise.all(photos.map(photo => photosDao.remove(photo.id)));
    }
    
    const deleted = await userDAO.remove(id);
    if (!deleted) {
      const err = new Error('User not found');
      err.status = 404;
      throw err;
    }
    
    return deleted;
  } catch (err) {
    logger.error('Service: error removing user', err);
    throw err;
  }
}

export default { 
  getAll, 
  getById, 
  create, 
  update, 
  remove, 
};