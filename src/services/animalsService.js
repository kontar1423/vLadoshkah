// services/animalsService.js
import animalsDao from '../dao/animalsDao.js';
import photosDao from '../dao/photosDao.js';
import photosService from './photosService.js';
import redisClient from '../cache/redis-client.js';
import { normalizePhotos, toRelativeUploadUrl } from '../utils/urlUtils.js';
import logger from '../logger.js';

// Константы для кэширования
const CACHE_TTL = 3600; // 1 час
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

// Вспомогательная функция для получения животных с фото
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

// Вспомогательная функция для инвалидации кэша
async function invalidateAnimalCaches(animalId = null) {
  const patterns = [
    CACHE_KEYS.ALL_ANIMALS,
    'animals:shelter:*',
    'animals:search:*'
  ];
  
  if (animalId) {
    patterns.push(CACHE_KEYS.ANIMAL_BY_ID(animalId));
  }
  
  // Clear the all animals cache since we're fetching all animals
  await Promise.all([
    redisClient.delete(CACHE_KEYS.ALL_ANIMALS),
    redisClient.delete(CACHE_KEYS.ANIMAL_BY_ID(animalId)),
  ]);
}

// Получить всех животных
async function getAllAnimals() {
  try {
    // Пытаемся получить из кэша
    const cached = await redisClient.get(CACHE_KEYS.ALL_ANIMALS);
    if (cached) {
      logger.debug('Cache hit: all animals');
      return normalizeAnimalsCollection(cached);
    }

    logger.debug('Cache miss: all animals');
    
    // Два параллельных запроса вместо N+1
    const [animals, allPhotosRaw] = await Promise.all([
      animalsDao.getAll(),
      photosDao.getByEntityType('animal')
    ]);
  
    // Объединяем в JavaScript
    const allPhotos = normalizePhotos(allPhotosRaw);
    const animalsWithPhotos = animals.map(animal => normalizeAnimalPhotos({
      ...animal,
      photos: allPhotos
        .filter(photo => photo.entity_id === animal.id)
        .map(photo => ({
          url: photo.url,
        }))
    }));
    
    // Сохраняем в кэш
    await redisClient.set(CACHE_KEYS.ALL_ANIMALS, animalsWithPhotos, CACHE_TTL);
    
    return animalsWithPhotos;
  } catch (err) {
    logger.error(err, 'Service: error fetching animals with photos');
    throw err;
  }
}

// Получить животное по id
async function getAnimalById(id) {
  try {
    const cacheKey = CACHE_KEYS.ANIMAL_BY_ID(id);
    
    // Пытаемся получить из кэша
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
    
    // Сохраняем в кэш
    await redisClient.set(cacheKey, animalWithPhotos, CACHE_TTL);
    
    return animalWithPhotos;
  } catch (err) {
    logger.error(err, 'Service: error fetching animal by id');
    throw err;
  }
}

// Получить животных по приюту
async function getAnimalsByShelterId(shelterId) {
  try {
    const cacheKey = CACHE_KEYS.ANIMALS_BY_SHELTER(shelterId);
    
    // Пытаемся получить из кэша
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
    
    // Сохраняем в кэш
    await redisClient.set(cacheKey, animalsWithPhotos, CACHE_TTL);
    
    return animalsWithPhotos;
  } catch (err) {
    logger.error(err, 'Service: error fetching animals by shelter');
    throw err;
  }
}

// Создать животное (с поддержкой фото)
async function createAnimal(animalData, photoFile = null) {
  try {
    logger.info({ hasPhoto: !!photoFile }, 'Service: creating animal');
    
    // 1. Создаем животное
    const animal = await animalsDao.create(animalData);
    // Clear the all animals cache since we're adding a new animal
    await Promise.all([
      redisClient.delete(CACHE_KEYS.ALL_ANIMALS),
      redisClient.delete(CACHE_KEYS.ANIMAL_BY_ID(animal.id))
    ]);
    // 2. Если есть фото - загружаем через photosService
    if (photoFile) {
      await photosService.uploadPhoto(
        photoFile, 
        'animal', 
        animal.id
      );
      logger.info({ animalId: animal.id }, 'Service: photo uploaded for animal');
    }
    
    // 3. Инвалидируем кэш
    await invalidateAnimalCaches();
    
    // 4. Возвращаем животное с фото (будет закэшировано автоматически)
    const animalWithPhotos = await getAnimalById(animal.id);
    return animalWithPhotos;
    
  } catch (err) {
    logger.error(err, 'Service: error creating animal');
    throw err;
  }
}

// Обновить животное
async function updateAnimal(id, data) {
  try {
    // Clear the specific animal cache since we're updating a single animal
    await Promise.all([
      redisClient.delete(CACHE_KEYS.ALL_ANIMALS),
      redisClient.delete(CACHE_KEYS.ANIMAL_BY_ID(id))
    ]);
    const updatedAnimal = await animalsDao.update(id, data);
    if (!updatedAnimal) {
      return null;
    }
    
    // Инвалидируем кэш
    await invalidateAnimalCaches(id);
    
    // Возвращаем обновленное животное с фото
    return await getAnimalById(id);
  } catch (err) {
    logger.error(err, 'Service: error updating animal');
    throw err;
  }
}

// Удалить животное
async function removeAnimal(id) {
  try {
    // При удалении животного каскадно удалятся его фото
    // Clear the specific animal cache since we're removing a single animal
    await Promise.all([
      redisClient.delete(CACHE_KEYS.ALL_ANIMALS),
      redisClient.delete(CACHE_KEYS.ANIMAL_BY_ID(id))
    ]);
    await photosService.deletePhotosOfEntity(id, 'animal');
    const result = await animalsDao.remove(id);
    
    // Инвалидируем кэш
    await invalidateAnimalCaches(id);
    
    return result;
  } catch (err) {
    logger.error(err, 'Service: error removing animal');
    throw err;
  }
}

// Поиск животных с фильтрами
async function findAnimals(filters) {
  try {
    // Создаем хэш фильтров для ключа кэша
    const filtersHash = Buffer.from(JSON.stringify(filters)).toString('base64');
    const cacheKey = CACHE_KEYS.ANIMALS_SEARCH(filtersHash);
    
    // Пытаемся получить из кэша
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit: animals search');
      return normalizeAnimalsCollection(cached);
    }

    logger.debug('Cache miss: animals search');
    
    const animals = await animalsDao.findAnimals(filters);
    const animalsWithPhotos = await getAnimalsWithPhotos(animals);
    
    // Кэшируем на меньшее время, т.к. поиск может часто меняться
    await redisClient.set(cacheKey, animalsWithPhotos, 600); // 10 минут
    
    return animalsWithPhotos;
  } catch (err) {
    logger.error(err, 'Service: error finding animals with filters');
    throw err;
  }
}

// Дополнительный метод для принудительной инвалидации кэша
// async function clearCache() {
//   try {
//     await invalidateAnimalCaches();
//     console.log('Animal cache cleared');
//   } catch (err) {
//     console.error('Error clearing animal cache', err);
//     throw err;
//   }
// }

export default { 
  getAllAnimals, 
  getAnimalById, 
  createAnimal, 
  updateAnimal, 
  removeAnimal, 
  getAnimalsByShelterId,
  findAnimals,
  // clearCache
};