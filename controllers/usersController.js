import usersService from "../services/usersService.js";
import logger from "../logger.js";

function _error(err, message) {
  const log = req.log || logger;
  log.error(err, message);
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

async function create(req, res) {
  try {
    const userData = req.body;
    const photoFile = req.file; // Фото из multer
    
    console.log('🟡 Creating user:', userData);
    console.log('🟡 Photo file:', photoFile ? `Yes (${photoFile.originalname})` : 'No');
    
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
    res.status(400).json({ 
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
    
    console.log('🟡 Updating user:', id);
    console.log('🟡 Photo file:', photoFile ? `Yes (${photoFile.originalname})` : 'No');
    
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

// Дополнительный контроллер для обновления только фото пользователя

export default { 
  getAll, 
  getById, 
  create, 
  update, 
  remove,
};