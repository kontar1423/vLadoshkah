import sheltersService from "../services/sheltersService.js";
import logger from '../logger.js';

// Получить все приюты
async function getAll(req, res) {
  try {
    const shelters = await sheltersService.getAllShelters();
    res.json(shelters);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching shelters');
    res.status(500).json({ error: 'Database error' });
  }
}

// Получить приют по id
async function getById(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const shelter = await sheltersService.getShelterById(id);
    if (!shelter) return res.status(404).json({ error: 'Not found' });
    res.json(shelter);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching shelter');
    res.status(500).json({ error: 'Database error' });
  }
}

// Создать приют
async function create(req, res) {
  try {
    const shelter = await sheltersService.createShelter(req.body);
    res.status(201).json(shelter);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error creating shelter');
    res.status(400).json({ error: err.message });
  }
}

// Обновить приют
async function update(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const shelter = await sheltersService.updateShelter(id, req.body);
    if (!shelter) return res.status(404).json({ error: 'Not found' });
    res.json(shelter);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error updating shelter');
    res.status(400).json({ error: err.message });
  }
}

// Удалить приют
async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const shelter = await sheltersService.removeShelter(id);
    if (!shelter) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error deleting shelter');
    res.status(500).json({ error: 'Database error' });
  }
}

export default { getAll, getById, create, update, remove };
