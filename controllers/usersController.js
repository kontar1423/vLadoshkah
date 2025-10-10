import { getAll as _getAll, getById as _getById, create as _create, update as _update, remove as _remove } from '../services/usersService';
import { error as _error } from '../logger';

async function getAll(req, res) {
  try {
    const users = await _getAll();
    res.json(users);
  } catch (err) {
    _error(err, 'Controller: error fetching all users');
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getById(req, res) {
  try {
    const user = await _getById(req.params.id);
    res.json(user);
  } catch (err) {
    _error(err, 'Controller: error fetching user by id');
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const user = await _create(req.body);
    res.status(201).json(user);
  } catch (err) {
    _error(err, 'Controller: error creating user');
    res.status(400).json({ error: err.message });
  }
}

async function update(req, res) {
  try {
    const user = await _update(req.params.id, req.body);
    res.json(user);
  } catch (err) {
    _error(err, 'Controller: error updating user');
    res.status(err.status || 400).json({ error: err.message });
  }
}

async function remove(req, res) {
  try {
    const user = await _remove(req.params.id);
    res.json(user);
  } catch (err) {
    _error(err, 'Controller: error deleting user');
    res.status(err.status || 400).json({ error: err.message });
  }
}

export default { getAll, getById, create, update, remove };
