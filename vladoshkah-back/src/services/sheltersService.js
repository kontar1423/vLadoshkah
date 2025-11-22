import sheltersDao from '../dao/sheltersDao.js';  
import redisClient from '../cache/redis-client.js';
import photosDao from '../dao/photosDao.js';
import photosService from './photosService.js';
import { normalizePhotos, toRelativeUploadUrl } from '../utils/urlUtils.js';
import logger from '../logger.js';

const CACHE_KEYS = {
  ALL_SHELTERS: 'shelters:all',
  SHELTER_BY_ID: (id) => `shelter:${id}`,
};

function normalizeShelterPhotos(shelter) {
  if (!shelter) {
    return shelter;
  }

  const photos = Array.isArray(shelter.photos)
    ? shelter.photos.map((photo) => ({
        ...photo,
        url: toRelativeUploadUrl(photo?.url),
      }))
    : [];

  return {
    ...shelter,
    photos,
  };
}

function normalizeSheltersCollection(shelters) {
  if (Array.isArray(shelters)) {
    return shelters.map(normalizeShelterPhotos);
  }

  return normalizeShelterPhotos(shelters);
}

function ensureShelterAdminAccess(shelter, user) {
  if (!user || user.role !== 'shelter_admin') {
    return;
  }

  if (!shelter) {
    return null;
  }

  if (shelter.admin_id !== user.userId) {
    const err = new Error('You can only manage your own shelter');
    err.status = 403;
    throw err;
  }

  return shelter;
}

async function getOwnedShelter(id, user) {
  if (!user || user.role !== 'shelter_admin') {
    return null;
  }

  const shelter = await sheltersDao.getById(id);
  return ensureShelterAdminAccess(shelter, user);
}
// Получить все приюты с фото
async function getAllShelters(limit = null) {
  if (!limit) {
    const cached = await redisClient.get(CACHE_KEYS.ALL_SHELTERS);
    if (cached) {
      return normalizeSheltersCollection(cached);
    }
  }

  const shelters = await sheltersDao.getAll(limit ? Number(limit) : null);
  const allPhotos = normalizePhotos(await photosDao.getByEntityType('shelter'));
  
  const sheltersWithPhotos = shelters.map(shelter => normalizeShelterPhotos({
    ...shelter,
    photos: allPhotos
      .filter(photo => photo.entity_id === shelter.id)
      .map(photo => ({
        url: photo.url,
      }))
  }));
  
  // Кэшируем только полный список
  if (!limit) {
    await redisClient.set(CACHE_KEYS.ALL_SHELTERS, sheltersWithPhotos, 3600);
  }

  return sheltersWithPhotos;
}

// Получить приют по id с фото
async function getShelterById(id) {
  const shelterCacheKey = CACHE_KEYS.SHELTER_BY_ID(id);
  const cached = await redisClient.get(shelterCacheKey);
  if (cached) {
    return normalizeShelterPhotos(cached);
  }
  const [shelter, photos] = await Promise.all([
    sheltersDao.getById(id),
    photosDao.getByEntity('shelter', id)
  ]);
  
  if (!shelter) {
    return null;
  }
  
  const result = normalizeShelterPhotos({
    ...shelter,
    photos: normalizePhotos(photos).map(photo => ({
      url: photo.url,
    }))
  });
  
  // Cache the result
  await redisClient.set(shelterCacheKey, result, 3600);
  
  return result;
}

// Создать приют с возможностью загрузки фото
async function createShelter(shelterData, photoFiles = null, currentUser = null) {
  // Clear the all shelters cache since we're adding a new one
  await redisClient.delete(CACHE_KEYS.ALL_SHELTERS);

  const payload = { ...shelterData };
  // Привязываем приют к shelter_admin
  if (currentUser?.role === 'shelter_admin') {
    payload.admin_id = currentUser.userId;
  }
  
  // Создаем приют
  const shelter = await sheltersDao.create(payload);
  
  // Если есть фото - загружаем их
  if (photoFiles) {
    const filesArray = Array.isArray(photoFiles) ? photoFiles : [photoFiles];
    if (filesArray.length > 0) {
      await Promise.all(filesArray.map(photoFile => photosService.uploadPhoto(photoFile, 'shelter', shelter.id)));
    }
  }
  
  // Возвращаем приют с фото
  return await getShelterById(shelter.id);
}

// Обновить приют
async function updateShelter(id, data, currentUser = null) {
  // Clear both the all shelters cache and the specific shelter cache
  await Promise.all([
    redisClient.delete(CACHE_KEYS.ALL_SHELTERS),
    redisClient.delete(CACHE_KEYS.SHELTER_BY_ID(id))
  ]);

  // Проверяем доступ для shelter_admin
  const ownedShelter = await getOwnedShelter(id, currentUser);
  if (currentUser?.role === 'shelter_admin') {
    if (!ownedShelter) {
      return null;
    }
    // Не даём сменить владельца
    data = { ...data, admin_id: ownedShelter.admin_id };
  }
  
  const updatedShelter = await sheltersDao.update(id, data);
  if (!updatedShelter) {
    return null;
  }
  
  return await getShelterById(id);
}

// Удалить приют и все его фото
async function removeShelter(id, currentUser = null) {
  // Clear both the all shelters cache and the specific shelter cache
  await Promise.all([
    redisClient.delete(CACHE_KEYS.ALL_SHELTERS),
    redisClient.delete(CACHE_KEYS.SHELTER_BY_ID(id))
  ]);
  
  try {
    // Проверяем доступ для shelter_admin
    const ownedShelter = await getOwnedShelter(id, currentUser);
    if (currentUser?.role === 'shelter_admin') {
      if (!ownedShelter) {
        return null;
      }
    }

    // Удаляем все фото приюта через универсальную функцию
    const photos = await photosDao.getByEntity('shelter', id);
    if (photos.length > 0) {
      await Promise.all(photos.map(photo => photosDao.remove(photo.id)));
    }
    
    // Затем удаляем сам приют
    return await sheltersDao.remove(id);
  } catch (error) {
    logger.error(error, 'Error removing shelter');
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
