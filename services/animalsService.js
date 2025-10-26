// services/animalsService.js
import Joi from 'joi';
const { object, string, number } = Joi;
import animalsDao from '../dao/animalsDao.js';
import photosDao from '../dao/photosDao.js';
import photosService from './photosService.js';
import redisClient from '../cache/redis-client.js';

// Константы для кэширования
const CACHE_TTL = 3600; // 1 час
const CACHE_KEYS = {
  ALL_ANIMALS: 'animals:all',
  ANIMAL_BY_ID: (id) => `animal:${id}`,
  ANIMALS_BY_SHELTER: (shelterId) => `animals:shelter:${shelterId}`,
  ANIMALS_SEARCH: (filtersHash) => `animals:search:${filtersHash}`
};

// Вспомогательная функция для получения животных с фото
async function getAnimalsWithPhotos(animals) {
  const allPhotos = await photosDao.getByEntityType('animal');
  
  return animals.map(animal => ({
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
  
  // Удаляем все ключи по паттернам
  for (const pattern of patterns) {
    await redisClient.deleteByPattern(pattern);
  }
}

// Получить всех животных
async function getAllAnimals() {
  try {
    // Пытаемся получить из кэша
    const cached = await redisClient.get(CACHE_KEYS.ALL_ANIMALS);
    if (cached) {
      console.log('Cache hit: all animals');
      return cached;
    }

    console.log('Cache miss: all animals');
    
    // Два параллельных запроса вместо N+1
    const [animals, allPhotos] = await Promise.all([
      animalsDao.getAll(),
      photosDao.getByEntityType('animal')
    ]);
  
    // Объединяем в JavaScript
    const animalsWithPhotos = animals.map(animal => ({
      ...animal,
      photos: allPhotos
        .filter(photo => photo.entity_id === animal.id)
        .map(photo => photo.url)
    }));
    
    // Сохраняем в кэш
    await redisClient.set(CACHE_KEYS.ALL_ANIMALS, animalsWithPhotos, CACHE_TTL);
    
    return animalsWithPhotos;
  } catch (err) {
    console.error('Service: error fetching animals with photos', err);
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
      console.log(`Cache hit: animal ${id}`);
      return cached;
    }

    console.log(`Cache miss: animal ${id}`);
    
    const [animal, photos] = await Promise.all([
      animalsDao.getById(id),
      photosDao.getByEntity('animal', id)
    ]);
    
    if (!animal) {
      return null;
    }
    
    const animalWithPhotos = {
      ...animal,
      photos: photos.map(photo => ({
        url: photo.url,
      }))
    };
    
    // Сохраняем в кэш
    await redisClient.set(cacheKey, animalWithPhotos, CACHE_TTL);
    
    return animalWithPhotos;
  } catch (err) {
    console.error('Service: error fetching animal by id', err);
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
      console.log(`Cache hit: animals for shelter ${shelterId}`);
      return cached;
    }

    console.log(`Cache miss: animals for shelter ${shelterId}`);
    
    const [animals, allPhotos] = await Promise.all([
      animalsDao.getAnimalsByShelter(shelterId),
      photosDao.getByEntityType('animal')
    ]);
    
    const animalsWithPhotos = animals.map(animal => ({
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
    console.error('Service: error fetching animals by shelter', err);
    throw err;
  }
}

// Создать животное (с поддержкой фото)
async function createAnimal(animalData, photoFile = null) {
  try {
    console.log('Service: creating animal with data:', animalData);
    
    // 1. Создаем животное
    const animal = await animalsDao.create(animalData);
    
    // 2. Если есть фото - загружаем через photosService
    if (photoFile) {
      await photosService.uploadPhoto(
        photoFile, 
        'animal', 
        animal.id
      );
      console.log('Service: photo uploaded for animal', animal.id);
    }
    
    // 3. Инвалидируем кэш
    await invalidateAnimalCaches();
    
    // 4. Возвращаем животное с фото (будет закэшировано автоматически)
    const animalWithPhotos = await getAnimalById(animal.id);
    return animalWithPhotos;
    
  } catch (err) {
    console.error('Service: error creating animal', err);
    throw err;
  }
}

// Обновить животное
async function updateAnimal(id, data) {
  try {
    const updatedAnimal = await animalsDao.update(id, data);
    if (!updatedAnimal) {
      return null;
    }
    
    // Инвалидируем кэш
    await invalidateAnimalCaches(id);
    
    // Возвращаем обновленное животное с фото
    return await getAnimalById(id);
  } catch (err) {
    console.error('Service: error updating animal', err);
    throw err;
  }
}

// Удалить животное
async function removeAnimal(id) {
  try {
    // При удалении животного каскадно удалятся его фото
    await photosService.deletePhotosOfEntity(id, 'animal');
    const result = await animalsDao.remove(id);
    
    // Инвалидируем кэш
    await invalidateAnimalCaches(id);
    
    return result;
  } catch (err) {
    console.error('Service: error removing animal', err);
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
      console.log('Cache hit: animals search');
      return cached;
    }

    console.log('Cache miss: animals search');
    
    const animals = await animalsDao.findAnimals(filters);
    const animalsWithPhotos = await getAnimalsWithPhotos(animals);
    
    // Кэшируем на меньшее время, т.к. поиск может часто меняться
    await redisClient.set(cacheKey, animalsWithPhotos, 600); // 10 минут
    
    return animalsWithPhotos;
  } catch (err) {
    console.error('Service: error finding animals with filters', err);
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