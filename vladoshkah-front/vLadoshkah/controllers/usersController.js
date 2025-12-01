const userService = require('../services/usersService');
const logger = require('../logger');

async function getAll(req, res) {
  try {
    const users = await userService.getAll();
    res.json(users);
  } catch (err) {
    logger.error(err, 'Controller: error fetching all users');
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getById(req, res) {
  try {
    const user = await userService.getById(req.params.id);
    res.json(user);
  } catch (err) {
    logger.error(err, 'Controller: error fetching user by id');
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const user = await userService.create(req.body);
    res.status(201).json(user);
  } catch (err) {
    logger.error(err, 'Controller: error creating user');
    res.status(400).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const user = await userService.update(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    logger.error(err, 'Controller: error updating user');
    res.status(err.status || 400).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const user = await userService.remove(req.params.id);
    res.json(user);
  } catch (err) {
    logger.error(err, 'Controller: error deleting user');
    res.status(err.status || 400).json({ error: err.message });
  }
}

module.exports = { getAll, getById, create, update, remove };
