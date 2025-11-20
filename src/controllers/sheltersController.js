import sheltersService from "../services/sheltersService.js";
import serviceVotesService from "../services/VotesService.js";
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

async function vote(req, res) {
  try {
    const { shelter_id, vote } = req.body;
    const userId = req.user?.userId;

    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await serviceVotesService.createVote({
      userId,
      shelterId: shelter_id,
      vote
    });

    res.status(201).json({
      message: 'Vote recorded',
      rating: result.rating,
      vote: result.vote
    });
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error voting for shelter');

    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }

    // Обрабатываем уникальное ограничение на случай гонки
    if (err.code === '23505') {
      return res.status(409).json({ error: 'User has already voted for this shelter' });
    }

    res.status(500).json({ error: 'Database error' });
  }
}

export default { getAll, getById, create, update, remove, vote };
