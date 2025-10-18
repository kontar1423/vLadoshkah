import Joi from 'joi';
const { object, string, number } = Joi;
import animalsDao from '../dao/animalsDao.js';
import photosDao from '../dao/photosDao.js';

// Joi-схема для валидации animal
// const animalSchema = object({
//   name: string().min(2).required(),
//   age: number().integer().min(0).required(),
//   type: string().valid('dog','cat','other').required(),
//   shelter_id: number().integer().required()
// });

// Получить всех животных
async function getAllAnimals() {
  try {
    
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
        .map(photo => ({
          url: photo.url,
        }))
    }));
    
    return animalsWithPhotos;
  } catch (err) {
    console.error('Service: error fetching animals with photos', err);
    throw err;
  }
}

// Получить животное по id
async function getAnimalById(id) {
  try {
    const [animal, photos] = await Promise.all([
      animalsDao.getById(id),
      photosDao.getByEntityType('animal', id) // ← исправлено: должно быть getByEntityType или getByEntity
    ]);
    
    if (!animal) {
      return null;
    }
    
    return {
      ...animal,
      photos: photos.map(photo => ({
        url: photo.url,
      }))
    };
  } catch (err) {
    console.error('Service: error fetching animal by id', err);
    throw err;
  }
}

// Получить животных по приюту
async function getAnimalsByShelterId(shelterId) {
  try {
    const [animals, allPhotos] = await Promise.all([
      animalsDao.getAnimalsByShelter(shelterId), // ← исправлено: должно быть getAnimalsByShelter
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
    
    return animalsWithPhotos;
  } catch (err) {
    console.error('Service: error fetching animals by shelter', err);
    throw err;
  }
}

// Создать животное (с поддержкой фото)
// services/animalsService.js
import photosService from './photosService.js';

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
    
    // 3. Возвращаем животное с фото
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
    // const { error, value } = animalSchema.validate(data);
    // if (error) throw new Error(error.details[0].message);
    
    const updatedAnimal = await animalsDao.update(id, data);
    if (!updatedAnimal) {
      return null;
    }
    
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
    // При удалении животного каскадно удалятся его фото (если настроены CASCADE constraints)
    await photosService.deletePhotosOfEntity(id, 'animal');
    return await animalsDao.remove(id);
  } catch (err) {
    console.error('Service: error removing animal', err);
    throw err;
  }
}

// Поиск животных с фильтрами
async function findAnimals(filters) {
  try {
    const animals = await animalsDao.findAnimals(filters);
    const allPhotos = await photosDao.getByEntityType('animal');
    
    const animalsWithPhotos = animals.map(animal => ({
      ...animal,
      photos: allPhotos
        .filter(photo => photo.entity_id === animal.id)
        .map(photo => ({
          url: photo.url,
        }))
    }));
    
    return animalsWithPhotos;
  } catch (err) {
    console.error('Service: error finding animals with filters', err);
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
  findAnimals        // ← ДОБАВЛЯЕМ
};