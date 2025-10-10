import { getAllAnimals, getAnimalById, getAnimalsByShelterId, createAnimal, updateAnimal, removeAnimal } from '../services/animalsService';
import logger from '../logger';

async function getAll(req, res) {
  try {
    const animals = await getAllAnimals();
    res.json(animals);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error fetching animals');
    res.status(500).json({ error: 'Database error' });
  }
}

async function getById(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const animal = await getAnimalById(id);
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
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const animals = await getAnimalsByShelterId(id);
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
    const newAnimal = await createAnimal(req.body);
    res.status(201).json(newAnimal);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error creating animal');
    res.status(400).json({ error: err.message });
  }
}

async function update(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const updated = await updateAnimal(id, req.body);
    if (!updated) {
      const log = req.log || logger;
      log.warn({ id }, 'Controller: animal to update not found');
      return res.status(404).json({ error: 'Not found' });
    }
    res.json(updated);
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error updating animal');
    res.status(400).json({ error: err.message });
  }
}

async function remove(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ error: 'Invalid id' });
  }
  try {
    const deleted = await removeAnimal(id);
    if (!deleted) {
      const log = req.log || logger;
      log.warn({ id }, 'Controller: animal to delete not found');
      return res.status(404).json({ error: 'Not found' });
    }
    res.status(204).end();
  } catch (err) {
    const log = req.log || logger;
    log.error(err, 'Controller: error deleting animal');
    res.status(500).json({ error: 'Database error' });
  }
}

export default { getAll, getById, create, update, remove, getAllByShelterId };
