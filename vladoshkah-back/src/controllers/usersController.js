import usersService from "../services/usersService.js";
import logger from "../logger.js";
import favoriteAnimalsService from "../services/favoriteAnimalsService.js";

function resolveAnimalId(payload = {}) {
  return payload.animal_id ?? payload.shelter_id;
}

function isRequestorAllowed(req, targetUserId) {
  if (!req.user) {
    return false;
  }

  return Number(req.user.userId) === Number(targetUserId) || req.user.role === 'admin';
}

function resolveUserIdFromRequest(req, payloadUserId) {
  const tokenUserId = Number(req.user?.userId);
  const payloadId = payloadUserId !== undefined ? Number(payloadUserId) : NaN;

  // Предпочитаем ID из токена
  if (Number.isInteger(tokenUserId)) {
    return tokenUserId;
  }

  // Админ может передать любой user_id
  if (req.user?.role === 'admin' && Number.isInteger(payloadId)) {
    return payloadId;
  }

  return payloadId;
}

async function getAll(req, res) {
  try {
    const users = await usersService.getAll();
    res.json(users);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching all users');
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function getById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  
  try {
    const user = await usersService.getById(id);
    res.json(user);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching user by id');
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function getMe(req, res) {
  if (!req.user?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const id = Number(req.user.userId);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  
  try {
    const user = await usersService.getById(id);
    res.json(user);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching user');
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function create(req, res) {
  try {
    const userData = req.body;
    const photoFile = req.file; // Фото из multer
    
    const log = req.log || logger;
    log.info({ hasPhoto: !!photoFile }, 'Controller: creating user');
    
    const newUser = await usersService.create(userData, photoFile);
    
    res.status(201).json({
      success: true,
      user: newUser,
      hasPhoto: !!photoFile,
      message: photoFile ? 'User created with photo' : 'User created successfully'
    });
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error creating user');
    res.status(err.status || 400).json({ 
      success: false,
      error: err.message 
    });
  }
}

async function update(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  
  try {
    const userData = req.body;
    const photoFile = req.file; // Новое фото из multer
    
    const log = req.log || logger;
    log.info({ id, hasPhoto: !!photoFile }, 'Controller: updating user');
    
    const updatedUser = await usersService.update(id, userData, photoFile);
    
    res.json({
      success: true,
      user: updatedUser,
      photoUpdated: !!photoFile,
      message: photoFile ? 'User updated with new photo' : 'User updated successfully'
    });
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error updating user');
    res.status(err.status || 400).json({ 
      success: false,
      error: err.message 
    });
  }
}

async function updateMe(req, res) {
  if (!req.user?.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const id = Number(req.user.userId);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  
  try {
    const userData = req.body;
    const photoFile = req.file; // Новое фото из multer
    
    const log = req.log || logger;
    log.info({ id, hasPhoto: !!photoFile }, 'Controller: updating user');
    
    const updatedUser = await usersService.update(id, userData, photoFile);
    
    res.json({
      success: true,
      user: updatedUser,
      photoUpdated: !!photoFile,
      message: photoFile ? 'User updated with new photo' : 'User updated successfully'
    });
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error updating user');
    res.status(err.status || 400).json({ 
      success: false,
      error: err.message 
    });
  }
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  
  try {
    await usersService.remove(id);
    res.status(204).end();
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error deleting user');
    res.status(err.status || 400).json({ 
      success: false,
      error: err.message 
    });
  }
}

async function getFavorite(req, res) {
  const log = req.log || logger;
  const userId = resolveUserIdFromRequest(req, req.query.user_id);
  const animalId = Number(resolveAnimalId(req.query));

  if (!Number.isInteger(userId) || !Number.isInteger(animalId)) {
    return res.status(400).json({ error: 'Invalid user_id or animal_id' });
  }

  if (!isRequestorAllowed(req, userId)) {
    return res.status(403).json({ error: 'Access denied for this user_id' });
  }

  try {
    const isFavorite = await favoriteAnimalsService.isFavorite(userId, animalId);
    res.json({ isFavorite });
  } catch (err) {
    log.error(err, 'Controller: error checking favorite animal');
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function addFavorite(req, res) {
  const log = req.log || logger;
  const userId = resolveUserIdFromRequest(req, req.body.user_id);
  const animalId = Number(resolveAnimalId(req.body));

  if (!Number.isInteger(userId) || !Number.isInteger(animalId)) {
    return res.status(400).json({ error: 'Invalid user_id or animal_id' });
  }

  if (!isRequestorAllowed(req, userId)) {
    return res.status(403).json({ error: 'Access denied for this user_id' });
  }

  try {
    const result = await favoriteAnimalsService.addFavorite(userId, animalId);
    res.status(result.created ? 201 : 200).json({
      message: result.created ? 'Favorite added' : 'Already in favorites',
      isFavorite: result.isFavorite
    });
  } catch (err) {
    log.error(err, 'Controller: error adding favorite animal');
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function removeFavorite(req, res) {
  const log = req.log || logger;
  const userId = resolveUserIdFromRequest(req, req.body.user_id);
  const animalId = Number(resolveAnimalId(req.body));

  if (!Number.isInteger(userId) || !Number.isInteger(animalId)) {
    return res.status(400).json({ error: 'Invalid user_id or animal_id' });
  }

  if (!isRequestorAllowed(req, userId)) {
    return res.status(403).json({ error: 'Access denied for this user_id' });
  }

  try {
    const result = await favoriteAnimalsService.removeFavorite(userId, animalId);
    res.json({
      message: result.removed ? 'Favorite removed' : 'Favorite not found',
      isFavorite: result.isFavorite
    });
  } catch (err) {
    log.error(err, 'Controller: error removing favorite animal');
    res.status(err.status || 500).json({ error: err.message });
  }
}

async function bulkFavoriteStatus(req, res) {
  const log = req.log || logger;
  const userId = resolveUserIdFromRequest(req, req.body.user_id);
  const animalIds = req.body.animal_ids;

  if (!Number.isInteger(userId)) {
    return res.status(400).json({ error: 'Invalid user_id' });
  }

  if (!isRequestorAllowed(req, userId)) {
    return res.status(403).json({ error: 'Access denied for this user_id' });
  }

  try {
    const result = await favoriteAnimalsService.isFavoriteBulk(userId, animalIds);
    res.json(result);
  } catch (err) {
    log.error(err, 'Controller: error checking bulk favorites');
    res.status(err.status || 500).json({ error: err.message });
  }
}

export default { 
  getAll, 
  getById, 
  create, 
  update, 
  remove,
  updateMe,
  getMe,
  getFavorite,
  addFavorite,
  removeFavorite,
  bulkFavoriteStatus
};
