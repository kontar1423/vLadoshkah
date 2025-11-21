import animalsService from "../services/animalsService.js";
import sheltersDao from "../dao/sheltersDao.js";
import animalsDao from "../dao/animalsDao.js";
import logger from '../logger.js';

async function getAll(req, res) {
  try {
    const animals = await animalsService.getAllAnimals();
    res.json(animals);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching animals');
    res.status(500).json({ error: 'Database error' });
  }
}

// GET /api/animals?type=cat&gender=female&age_min=1&age_max=5&search=ласковый
async function getAnimalsWithFilters(req, res) {
  try {
    const filters = {
      type: req.query.type,
      gender: req.query.gender,
      age_min: req.query.age_min ? parseInt(req.query.age_min) : undefined,
      age_max: req.query.age_max ? parseInt(req.query.age_max) : undefined,
      animal_size: req.query.size || req.query.animal_size, // Поддержка обоих вариантов
      health: req.query.health,
      shelter_id: req.query.shelter_id ? parseInt(req.query.shelter_id) : undefined,
      search: req.query.search
    };
    
    // Убираем undefined значения
    Object.keys(filters).forEach(key => filters[key] === undefined && delete filters[key]);

    const animals = await animalsService.findAnimals(filters);
    res.json(animals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

async function getById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const animal = await animalsService.getAnimalById(id);
    if (!animal) {
      const log = req.log || logger;
      log.warn({ id }, 'Controller: animal not found');
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(animal);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching animal');
    res.status(500).json({ error: 'Database error' });
  }
}

async function getAllByShelterId(req, res) {
  const id = Number(req.params.shelterId || req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const animals = await animalsService.getAnimalsByShelterId(id);
    if (!animals) {
      const log = req.log || logger;
      log.warn({ id }, 'Controller: animals not found');
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(animals);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching animals by ShelterId');
    res.status(500).json({ error: 'Database error' });
  }
}

async function create(req, res) {
  try {
    const animalData = req.body;
    const photoFile = req.file; // Фото из multer
    
    // Проверка доступа для админов приютов
    if (req.user && req.user.role === 'shelter_admin') {
      const shelterId = Number(animalData.shelter_id);
      if (!shelterId) {
        return res.status(400).json({
          success: false,
          error: 'shelter_id is required for shelter_admin'
        });
      }
      
      // Проверяем, что приют принадлежит этому админу
      const userShelters = await sheltersDao.getByAdminId(req.user.userId);
      const hasAccess = userShelters.some(shelter => shelter.id === shelterId);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'You can only create animals in your own shelter'
        });
      }
    }
    
    const log = req.log || logger;
    log.info({ hasPhoto: !!photoFile }, 'Controller: creating animal');
    
    const newAnimal = await animalsService.createAnimal(animalData, photoFile);
    
    res.status(201).json({
      success: true,
      animal: newAnimal,
      hasPhoto: !!photoFile,
      message: photoFile ? 'Animal created with photo' : 'Animal created successfully'
    });
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error creating animal');
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
    // Проверка доступа для админов приютов
    if (req.user && req.user.role === 'shelter_admin') {
      const animal = await animalsDao.getById(id);
      if (!animal) {
        return res.status(404).json({ error: 'Animal not found' });
      }
      
      // Проверяем, что животное принадлежит приюту этого админа
      const userShelters = await sheltersDao.getByAdminId(req.user.userId);
      const hasAccess = userShelters.some(shelter => shelter.id === animal.shelter_id);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'You can only update animals from your own shelter'
        });
      }

      // Не даем передвинуть животное в другой приют
      if (req.body?.shelter_id && Number(req.body.shelter_id) !== animal.shelter_id) {
        return res.status(403).json({
          success: false,
          error: 'You cannot move animal to another shelter'
        });
      }
      // Фиксируем shelter_id на текущем
      req.body.shelter_id = animal.shelter_id;
    }
    
    const updated = await animalsService.updateAnimal(id, req.body);
    if (!updated) {
      const log = req.log || logger;
      log.warn({ id }, 'Controller: animal to update not found');
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(updated);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error updating animal');
    res.status(err.status || 400).json({ error: err.message });
  }
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    // Проверка доступа для админов приютов
    if (req.user && req.user.role === 'shelter_admin') {
      const animal = await animalsDao.getById(id);
      if (!animal) {
        return res.status(404).json({ error: 'Animal not found' });
      }
      
      // Проверяем, что животное принадлежит приюту этого админа
      const userShelters = await sheltersDao.getByAdminId(req.user.userId);
      const hasAccess = userShelters.some(shelter => shelter.id === animal.shelter_id);
      
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: 'You can only delete animals from your own shelter'
        });
      }
    }
    
    const deleted = await animalsService.removeAnimal(id);
    if (!deleted) {
      const log = req.log || logger;
      log.warn({ id }, 'Controller: animal to delete not found');
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(204).end();
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error deleting animal');
    res.status(err.status || 500).json({ error: err.message || 'Database error' });
  }
}

export default { 
  getAll, 
  getById, 
  create, 
  update, 
  remove, 
  getAllByShelterId, 
  getAnimalsWithFilters,
};
