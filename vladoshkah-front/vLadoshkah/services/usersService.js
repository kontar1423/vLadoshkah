const userDAO = require('../dao/usersDao');
const logger = require('../logger');

async function getAll() {
  return await userDAO.getAll();
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

module.exports = { getAll, getById, create, update, remove };
