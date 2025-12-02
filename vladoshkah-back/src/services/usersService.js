import userDAO from '../dao/usersDao.js';
import photosDao from '../dao/photosDao.js';
import logger from '../logger.js';
import redisClient from '../cache/redis-client.js';
import photosService from './photosService.js';
import bcrypt from 'bcryptjs';
import authConfig from '../config/auth.js';
const bcryptConfig = authConfig.bcrypt;
const CACHE_KEYS = {
  ALL_USERS: 'users:all',
  USER_BY_ID: (id) => `user:${id}`,
};

function mapUserDbError(err) {
  if (err?.code === '23505' && err?.constraint === 'users_email_key') {
    const conflict = new Error('User with this email already exists');
    conflict.status = 409;
    return conflict;
  }
  return err;
}
async function getAll() {
  try {

    await redisClient.delete(CACHE_KEYS.ALL_USERS);
    const [users, allPhotos] = await Promise.all([
      userDAO.getAll(),
      photosDao.getByEntityType('user')
    ]);
    
    const usersWithPhotos = users.map(user => {
      const { password: _, ...userWithoutPassword } = user;
      return {
        ...userWithoutPassword,
        photos: allPhotos
          .filter(photo => photo.entity_id === user.id)
          .map(photo => ({
            url: photo.url,
          }))
      };
    });
    
    return usersWithPhotos;
  } catch (err) {
    logger.error('Service: error fetching users with photos', err);
    throw err;
  }
}

async function getById(id) {
  try {
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
    
    const { password: _, ...userWithoutPassword } = user;
    
    return {
      ...userWithoutPassword,
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
    await redisClient.delete(CACHE_KEYS.ALL_USERS);
    const { password: _, ...userDataForLog } = userData;
    logger.info({ userData: userDataForLog }, 'Service: creating user');
    
    const processedUserData = { ...userData };
    if (processedUserData.password && !processedUserData.password.startsWith('$2b$')) {
      processedUserData.password = await bcrypt.hash(processedUserData.password, bcryptConfig.saltRounds);
    }
    
    const user = await userDAO.create(processedUserData);
    
    if (photoFile) {
      await photosService.uploadPhoto(
        photoFile, 
        'user', 
        user.id
      );
      logger.info('Service: photo uploaded for user', user.id);
    }
    
    const userWithPhotos = await getById(user.id);
    return userWithPhotos;
    
  } catch (err) {
    logger.error('Service: error creating user', err);
    throw mapUserDbError(err);
  }
}

async function update(id, data, photoFile = null) {
  try {
    await Promise.all([
      redisClient.delete(CACHE_KEYS.ALL_USERS),
      redisClient.delete(CACHE_KEYS.USER_BY_ID(id))
    ]);
    
    const processedData = { ...data };
    if (processedData.password && !processedData.password.startsWith('$2b$')) {
      processedData.password = await bcrypt.hash(processedData.password, bcryptConfig.saltRounds);
    }
    
    const updatedUser = await userDAO.update(id, processedData);
    if (!updatedUser) {
      const err = new Error('User not found or not updated');
      err.status = 404;
      throw err;
    }
    
    if (photoFile) {
      const photos = await photosDao.getByEntity('user', id);
      if (photos.length > 0) {
        await Promise.all(photos.map(photo => photosDao.remove(photo.id)));
      }
      
      await photosService.uploadPhoto(
        photoFile, 
        'user', 
        id
      );
      logger.info('Service: photo updated for user', id);
    }
    
    return await getById(id);
  } catch (err) {
    logger.error('Service: error updating user', err);
    throw mapUserDbError(err);
  }
}

async function remove(id) {
  try {
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
