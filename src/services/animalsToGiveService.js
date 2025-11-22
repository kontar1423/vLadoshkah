import animalsToGiveDao from '../dao/animalsToGiveDao.js';
import photosDao from '../dao/photosDao.js';
import photosService from './photosService.js';
import { normalizePhotos } from '../utils/urlUtils.js';
import logger from '../logger.js';

const ENTITY_TYPE = 'animal_to_give';

function attachPhotos(animal, photosByEntity) {
  if (!animal) return animal;
  const photos = photosByEntity
    .filter((photo) => photo.entity_id === animal.id)
    .map((photo) => ({ url: photo.url }));

  return { ...animal, photos };
}

async function getAll() {
  try {
    const [animals, photosRaw] = await Promise.all([
      animalsToGiveDao.getAll(),
      photosDao.getByEntityType(ENTITY_TYPE)
    ]);
    const photos = normalizePhotos(photosRaw);
    return animals.map((animal) => attachPhotos(animal, photos));
  } catch (err) {
    logger.error(err, 'Service: error fetching animals_to_give');
    throw err;
  }
}

async function getById(id) {
  try {
    const [animal, photosRaw] = await Promise.all([
      animalsToGiveDao.getById(id),
      photosDao.getByEntity(ENTITY_TYPE, id)
    ]);

    if (!animal) {
      return null;
    }

    const photos = normalizePhotos(photosRaw);
    return attachPhotos(animal, photos);
  } catch (err) {
    logger.error(err, 'Service: error fetching animal_to_give by id');
    throw err;
  }
}

async function create(data, photoFile = null) {
  try {
    const animal = await animalsToGiveDao.create(data);

    if (photoFile) {
      await photosService.uploadPhoto(photoFile, ENTITY_TYPE, animal.id);
    }

    return await getById(animal.id);
  } catch (err) {
    logger.error(err, 'Service: error creating animal_to_give');
    throw err;
  }
}

async function update(id, data, photoFile = null) {
  try {
    const updatedAnimal = await animalsToGiveDao.update(id, data);
    if (!updatedAnimal) {
      return null;
    }

    if (photoFile) {
      await photosService.uploadPhoto(photoFile, ENTITY_TYPE, id);
    }

    return await getById(id);
  } catch (err) {
    logger.error(err, 'Service: error updating animal_to_give');
    throw err;
  }
}

async function remove(id) {
  try {
    await photosService.deletePhotosOfEntity(id, ENTITY_TYPE);
    return await animalsToGiveDao.remove(id);
  } catch (err) {
    logger.error(err, 'Service: error removing animal_to_give');
    throw err;
  }
}

export default {
  getAll,
  getById,
  create,
  update,
  remove
};
