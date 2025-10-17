import userDAO from '../dao/usersDao.js';
import photoDAO from '../dao/photosDao.js';
import logger from '../logger.js';

async function getAll() {
  const photos = await photoDAO.getByEntityType('user');
  const users = await userDAO.getAll()
  const usersWithPhotos = users.map(user => ({
  ...user,
  photos: photos
    .filter(p => p.entity_id === user.id)
    .map(p => p.url)
}));
  return usersWithPhotos;
}

async function getById(id) {
  const user = await userDAO.getById(id);
  if (!user) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return user;
}

async function create(data) {
  return await userDAO.create(data);
}

async function update(id, data) {
  const updated = await userDAO.update(id, data);
  if (!updated) {
    const err = new Error('User not found or not updated');
    err.status = 404;
    throw err;
  }
  return updated;
}

async function remove(id) {
  const deleted = await userDAO.remove(id);
  if (!deleted) {
    const err = new Error('User not found');
    err.status = 404;
    throw err;
  }
  return deleted;
}

export default { getAll, getById, create, update, remove };
