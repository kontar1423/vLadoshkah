import Joi from 'joi';
const { object, string } = Joi;
import sheltersDao from '../dao/sheltersDao.js';
import photosService from './photosService.js';
import redisClient from '../cache/redis-client.js';

// Joi-схема для валидации shelter
// const shelterSchema = object({
//   name: string().min(2).required(),
//   address: string().optional(),
//   phone: string().optional(),
//   email: string().email().optional(),
//   description: string().optional(),
//   capacity: Joi.number().integer().min(0).optional(),
//   website: string().uri().optional(),
//   working_hours: string().optional()
// });

const cacheKey = 'shelters:all';
// Получить все приюты с фото
async function getAllShelters() {
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return cached;
  }
  const shelters = await sheltersDao.getAll();
  const allPhotos = await photosService.getPhotosByEntityType('shelter');
  
  const sheltersWithPhotos = shelters.map(shelter => ({
    ...shelter,
    photos: allPhotos
      .filter(photo => photo.entity_id === shelter.id)
      .map(photo => photo.url)
  }));
  
  return sheltersWithPhotos;
}

// Получить приют по id с фото
async function getShelterById(id) {
  const cached = await redisClient.get(cacheKey(id));
  if (cached) {
    return cached;
  }
  const [shelter, photos] = await Promise.all([
    sheltersDao.getById(id),
    photosService.getPhotosByEntity('shelter', id)
  ]);
  
  if (!shelter) {
    return null;
  }
  
  return {
    ...shelter,
    photos: photos.map(photo => photo.url)
  };
}

// Создать приют с возможностью загрузки фото
async function createShelter(shelterData, photoFiles = null) {
  const cached = await redisClient.get(cacheKey);
  if (cached) {
    return cached;
  }
  // const { error, value } = shelterSchema.validate(shelterData);
  // if (error) throw new Error(error.details[0].message);

  // Создаем приют
  const shelter = await sheltersDao.create(shelterData);
  
  // Если есть фото - загружаем их
  if (photoFiles) {
    const filesArray = Array.isArray(photoFiles) ? photoFiles : [photoFiles];
    
    await Promise.all(
      filesArray.map(photoFile => 
        photosService.uploadPhoto(photoFile, 'shelter', shelter.id)
      )
    );
  }
  
  // Возвращаем приют с фото
  return await getShelterById(shelter.id);
}

// Обновить приют
async function updateShelter(id, data) {
  const cached = await redisClient.get(cacheKey(id));
  if (cached) {
    return cached;
  }
  // const { error, value } = shelterSchema.validate(data);
  // if (error) throw new Error(error.details[0].message);
  
  const updatedShelter = await sheltersDao.update(id, data);
  if (!updatedShelter) {
    return null;
  }
  
  return await getShelterById(id);
}

// Удалить приют и все его фото
async function removeShelter(id) {
  const cached = await redisClient.get(cacheKey(id));
  if (cached) {
    return cached;
  }
  try {
    // Удаляем все фото приюта через универсальную функцию
    await photosService.deletePhotosOfEntity(id, 'shelter');
    
    // Затем удаляем сам приют
    return await sheltersDao.remove(id);
  } catch (error) {
    console.error('Error removing shelter:', error);
    throw error;
  }
}

export default { 
  getAllShelters, 
  getShelterById, 
  createShelter, 
  updateShelter, 
  removeShelter
  // НЕТ отдельной функции addPhotoToShelter
};