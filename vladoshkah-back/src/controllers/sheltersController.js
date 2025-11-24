import sheltersService from "../services/sheltersService.js";
import serviceVotesService from "../services/VotesService.js";
import logger from '../logger.js';

// Получить все приюты
async function getAll(req, res) {
  try {
    let limit = req.query.limit ? parseInt(req.query.limit, 10) : null;
    if (!Number.isInteger(limit) || limit <= 0) {
      limit = null;
    }
    const shelters = await sheltersService.getAllShelters(limit);
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
    // Поддерживаем одно фото (photo) и несколько (photos)
    const files = req.files || {};
    const mergedPhotos = [
      ...(files.photo || []),
      ...(files.photos || []),
    ];

    const shelter = await sheltersService.createShelter(
      req.body,
      mergedPhotos.length ? mergedPhotos : null,
      req.user
    );
    res.status(201).json(shelter);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error creating shelter');
    res.status(err.status || 400).json({ error: err.message });
  }
}

// Обновить приют
async function update(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }
    const shelter = await sheltersService.updateShelter(id, req.body, req.user);
    if (!shelter) return res.status(404).json({ error: 'Not found' });
    res.json(shelter);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error updating shelter');
    res.status(err.status || 400).json({ error: err.message });
  }
}

// Удалить приют
async function remove(req, res) {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      return res.status(400).json({ error: 'Invalid id' });
    }

    const shelter = await sheltersService.removeShelter(id, req.user);
    if (!shelter) return res.status(404).json({ error: 'Not found' });
    res.status(204).end();
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error deleting shelter');
    res.status(err.status || 500).json({ error: err.message || 'Database error' });
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

    res.status(result.updated ? 200 : 201).json({
      message: result.updated ? 'Vote updated' : 'Vote recorded',
      rating: result.rating,
      vote: result.vote
    });
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error voting for shelter');

    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }

    res.status(500).json({ error: 'Database error' });
  }
}

export default { getAll, getById, create, update, remove, vote };
