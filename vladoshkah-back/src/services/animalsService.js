import animalsDao from '../dao/animalsDao.js';
import sheltersDao from '../dao/sheltersDao.js';
import photosDao from '../dao/photosDao.js';
import photosService from './photosService.js';
import redisClient from '../cache/redis-client.js';
import { normalizePhotos, toRelativeUploadUrl } from '../utils/urlUtils.js';
import logger from '../logger.js';

const CACHE_TTL = 3600;
const CACHE_KEYS = {
  ALL_ANIMALS: 'animals:all',
  ANIMAL_BY_ID: (id) => `animal:${id}`,
  ANIMALS_BY_SHELTER: (shelterId) => `animals:shelter:${shelterId}`,
  ANIMALS_SEARCH: (filtersHash) => `animals:search:${filtersHash}`
};

function normalizeAnimalPhotos(animal) {
  if (!animal) {
    return animal;
  }

  const photos = Array.isArray(animal.photos)
    ? animal.photos.map((photo) => ({
        ...photo,
        url: toRelativeUploadUrl(photo?.url),
      }))
    : [];

  return {
    ...animal,
    photos,
  };
}

function normalizeAnimalsCollection(animals) {
  if (Array.isArray(animals)) {
    return animals.map(normalizeAnimalPhotos);
  }

  return normalizeAnimalPhotos(animals);
}

async function getAnimalsWithPhotos(animals) {
  const allPhotos = normalizePhotos(await photosDao.getByEntityType('animal'));
  
  return animals.map(animal => normalizeAnimalPhotos({
    ...animal,
    photos: allPhotos
      .filter(photo => photo.entity_id === animal.id)
      .map(photo => ({
        url: photo.url,
      }))
  }));
}

async function invalidateAnimalCaches(animalId = null) {
  const keysToDelete = [CACHE_KEYS.ALL_ANIMALS];
  
  if (animalId) {
    keysToDelete.push(CACHE_KEYS.ANIMAL_BY_ID(animalId));
  }
  
  await Promise.all(keysToDelete.map(key => redisClient.delete(key)));
  
  await redisClient.deleteByPattern('animals:shelter:*');
  
  await redisClient.deleteByPattern('animals:search:*');
}

async function getAllAnimals(limit = null) {
  try {
    if (!limit) {
      const cached = await redisClient.get(CACHE_KEYS.ALL_ANIMALS);
      if (cached) {
        logger.debug('Cache hit: all animals');
        return normalizeAnimalsCollection(cached);
      }
      logger.debug('Cache miss: all animals');
    }
    
    const [animals, allPhotosRaw] = await Promise.all([
      animalsDao.getAll(limit ? Number(limit) : null),
      photosDao.getByEntityType('animal')
    ]);
  
    const allPhotos = normalizePhotos(allPhotosRaw);
    const animalsWithPhotos = animals.map(animal => normalizeAnimalPhotos({
      ...animal,
      photos: allPhotos
        .filter(photo => photo.entity_id === animal.id)
        .map(photo => ({
          url: photo.url,
        }))
    }));
    
    if (!limit) {
      await redisClient.set(CACHE_KEYS.ALL_ANIMALS, animalsWithPhotos, CACHE_TTL);
    }
    
    return animalsWithPhotos;
  } catch (err) {
    logger.error(err, 'Service: error fetching animals with photos');
    throw err;
  }
}

async function getAnimalById(id) {
  try {
    const cacheKey = CACHE_KEYS.ANIMAL_BY_ID(id);
    
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug({ id }, 'Cache hit: animal');
      return normalizeAnimalPhotos(cached);
    }

    logger.debug({ id }, 'Cache miss: animal');
    
    const [animal, photosRaw] = await Promise.all([
      animalsDao.getById(id),
      photosDao.getByEntity('animal', id)
    ]);
    
    if (!animal) {
      return null;
    }
    
    const photos = normalizePhotos(photosRaw);

    const animalWithPhotos = normalizeAnimalPhotos({
      ...animal,
      photos: photos.map(photo => ({
        url: photo.url,
      }))
    });
    
    await redisClient.set(cacheKey, animalWithPhotos, CACHE_TTL);
    
    return animalWithPhotos;
  } catch (err) {
    logger.error(err, 'Service: error fetching animal by id');
    throw err;
  }
}

async function getAnimalsByShelterId(shelterId) {
  try {
    const cacheKey = CACHE_KEYS.ANIMALS_BY_SHELTER(shelterId);
    
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug({ shelterId }, 'Cache hit: animals for shelter');
      return normalizeAnimalsCollection(cached);
    }

    logger.debug({ shelterId }, 'Cache miss: animals for shelter');
    
    const [animals, allPhotosRaw] = await Promise.all([
      animalsDao.getAnimalsByShelter(shelterId),
      photosDao.getByEntityType('animal')
    ]);
    
    const allPhotos = normalizePhotos(allPhotosRaw);
    const animalsWithPhotos = animals.map(animal => normalizeAnimalPhotos({
      ...animal,
      photos: allPhotos
        .filter(photo => photo.entity_id === animal.id)
        .map(photo => ({
          url: photo.url,
        }))
    }));
    
    await redisClient.set(cacheKey, animalsWithPhotos, CACHE_TTL);
    
    return animalsWithPhotos;
  } catch (err) {
    logger.error(err, 'Service: error fetching animals by shelter');
    throw err;
  }
}

async function createAnimal(animalData, photoFiles = [], currentUser = null) {
  try {
    const photosArray = Array.isArray(photoFiles)
      ? photoFiles.filter(Boolean)
      : photoFiles
        ? [photoFiles]
        : [];

    logger.info({ photosCount: photosArray.length }, 'Service: creating animal');

    if (currentUser?.role === 'shelter_admin') {
      const shelterId = Number(animalData.shelter_id);
      if (!shelterId) {
        const err = new Error('shelter_id is required for shelter_admin');
        err.status = 400;
        throw err;
      }
      const userShelters = await sheltersDao.getByAdminId(currentUser.userId);
      const hasAccess = userShelters.some((shelter) => shelter.id === shelterId);
      if (!hasAccess) {
        const err = new Error('You can only create animals in your own shelter');
        err.status = 403;
        throw err;
      }
    }
    
    const animal = await animalsDao.create(animalData);
    const shelterId = Number(animalData.shelter_id);
    const cacheKeysToDelete = [
      CACHE_KEYS.ALL_ANIMALS,
      CACHE_KEYS.ANIMAL_BY_ID(animal.id)
    ];
    
    if (shelterId) {
      cacheKeysToDelete.push(CACHE_KEYS.ANIMALS_BY_SHELTER(shelterId));
    }
    
    await Promise.all(cacheKeysToDelete.map(key => redisClient.delete(key)));
    if (photosArray.length > 0) {
      await Promise.all(
        photosArray.map(photoFile =>
          photosService.uploadPhoto(
            photoFile, 
            'animal', 
            animal.id
          )
        )
      );
      logger.info({ animalId: animal.id, photosCount: photosArray.length }, 'Service: photos uploaded for animal');
    }
    
    await invalidateAnimalCaches();
    
    const animalWithPhotos = await getAnimalById(animal.id);
    return animalWithPhotos;
    
  } catch (err) {
    logger.error(err, 'Service: error creating animal');
    throw err;
  }
}

async function updateAnimal(id, data, photoFiles = null, currentUser = null) {
  try {
    if (currentUser?.role === 'shelter_admin') {
      const animal = await animalsDao.getById(id);
      if (!animal) {
        return null;
      }
      const userShelters = await sheltersDao.getByAdminId(currentUser.userId);
      const hasAccess = userShelters.some((shelter) => shelter.id === animal.shelter_id);
      if (!hasAccess) {
        const err = new Error('You can only update animals from your own shelter');
        err.status = 403;
        throw err;
      }
      if (data?.shelter_id && Number(data.shelter_id) !== animal.shelter_id) {
        const err = new Error('You cannot move animal to another shelter');
        err.status = 403;
        throw err;
      }
      data = { ...data, shelter_id: animal.shelter_id };
    }

    await Promise.all([
      redisClient.delete(CACHE_KEYS.ALL_ANIMALS),
      redisClient.delete(CACHE_KEYS.ANIMAL_BY_ID(id))
    ]);
    
    // Обновляем только если есть данные для обновления (не только фото)
    if (Object.keys(data).length > 0) {
      const updatedAnimal = await animalsDao.update(id, data);
      if (!updatedAnimal) {
        return null;
      }
    }
    
    // Обрабатываем фото, если они есть
    if (photoFiles) {
      const filesArray = Array.isArray(photoFiles) ? photoFiles : [photoFiles];
      if (filesArray.length > 0) {
        await Promise.all(filesArray.map(photoFile => photosService.uploadPhoto(photoFile, 'animal', id)));
      }
    }
    
    await invalidateAnimalCaches(id);
    
    return await getAnimalById(id);
  } catch (err) {
    logger.error(err, 'Service: error updating animal');
    throw err;
  }
}

async function removeAnimal(id, currentUser = null) {
  try {
    if (currentUser?.role === 'shelter_admin') {
      const animal = await animalsDao.getById(id);
      if (!animal) {
        return null;
      }
      const userShelters = await sheltersDao.getByAdminId(currentUser.userId);
      const hasAccess = userShelters.some((shelter) => shelter.id === animal.shelter_id);
      if (!hasAccess) {
        const err = new Error('You can only delete animals from your own shelter');
        err.status = 403;
        throw err;
      }
    }

    await Promise.all([
      redisClient.delete(CACHE_KEYS.ALL_ANIMALS),
      redisClient.delete(CACHE_KEYS.ANIMAL_BY_ID(id))
    ]);
    await photosService.deletePhotosOfEntity(id, 'animal');
    const result = await animalsDao.remove(id);
    
    await invalidateAnimalCaches(id);
    
    return result;
  } catch (err) {
    logger.error(err, 'Service: error removing animal');
    throw err;
  }
}

async function findAnimals(filters) {
  try {
    const filtersHash = Buffer.from(JSON.stringify(filters)).toString('base64');
    const cacheKey = CACHE_KEYS.ANIMALS_SEARCH(filtersHash);
    
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit: animals search');
      return normalizeAnimalsCollection(cached);
    }

    logger.debug('Cache miss: animals search');
    
    const animals = await animalsDao.findAnimals(filters);
    const animalsWithPhotos = await getAnimalsWithPhotos(animals);
    
    await redisClient.set(cacheKey, animalsWithPhotos, 600);
    
    return animalsWithPhotos;
  } catch (err) {
    logger.error(err, 'Service: error finding animals with filters');
    throw err;
  }
}

export default { 
  getAllAnimals, 
  getAnimalById, 
  createAnimal, 
  updateAnimal, 
  removeAnimal, 
  getAnimalsByShelterId,
  findAnimals
};
