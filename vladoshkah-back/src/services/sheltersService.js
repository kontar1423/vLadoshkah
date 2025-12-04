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

function normalizePositiveInt(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function normalizeListOptions(limitOrOptions = null) {
  if (limitOrOptions && typeof limitOrOptions === 'object') {
    return {
      limit: normalizePositiveInt(limitOrOptions.limit),
      adminId: normalizePositiveInt(limitOrOptions.adminId),
    };
  }

  return {
    limit: normalizePositiveInt(limitOrOptions),
    adminId: null,
  };
}

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

function attachPhotosToShelters(shelters, allPhotos) {
  const normalizedPhotos = normalizePhotos(allPhotos || []);
  const collection = Array.isArray(shelters) ? shelters : [];

  return collection.map((shelter) =>
    normalizeShelterPhotos({
      ...shelter,
      photos: normalizedPhotos
        .filter((photo) => photo.entity_id === shelter.id)
        .map((photo) => ({
          url: photo.url,
        })),
    })
  );
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

async function getAllShelters(limitOrOptions = null) {
  const { limit, adminId } = normalizeListOptions(limitOrOptions);

  if (adminId) {
    const shelters = await sheltersDao.getByAdminId(adminId);
    const allPhotos = await photosDao.getByEntityType('shelter');
    const sliced = limit ? shelters.slice(0, limit) : shelters;
    return attachPhotosToShelters(sliced, allPhotos);
  }

  if (!limit) {
    const cached = await redisClient.get(CACHE_KEYS.ALL_SHELTERS);
    if (cached) {
      return normalizeSheltersCollection(cached);
    }
  }

  const shelters = await sheltersDao.getAll(limit ? Number(limit) : null);
  const allPhotos = await photosDao.getByEntityType('shelter');
  const sheltersWithPhotos = attachPhotosToShelters(shelters, allPhotos);

  if (!limit) {
    await redisClient.set(CACHE_KEYS.ALL_SHELTERS, sheltersWithPhotos, 3600);
  }

  return sheltersWithPhotos;
}

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

  await redisClient.set(shelterCacheKey, result, 3600);
  
  return result;
}

async function getShelterByAdminId(adminId) {
  const normalizedAdminId = normalizePositiveInt(adminId);
  if (!normalizedAdminId) {
    const err = new Error('Invalid admin id');
    err.status = 400;
    throw err;
  }

  const shelters = await sheltersDao.getByAdminId(normalizedAdminId);
  if (!shelters || shelters.length === 0) {
    return null;
  }

  const allPhotos = await photosDao.getByEntityType('shelter');
  const [shelterWithPhotos] = attachPhotosToShelters(shelters, allPhotos);
  return shelterWithPhotos || null;
}

async function createShelter(shelterData, photoFiles = null, currentUser = null) {
  const payload = { ...shelterData };

  if (currentUser?.role === 'shelter_admin') {
    const existingShelters = await sheltersDao.getByAdminId(currentUser.userId);
    if (existingShelters.length > 0) {
      const err = new Error('Shelter admin can have only one shelter');
      err.status = 400;
      throw err;
    }
    payload.admin_id = currentUser.userId;
  }

  const shelter = await sheltersDao.create(payload);

  await redisClient.delete(CACHE_KEYS.ALL_SHELTERS);

  if (photoFiles) {
    const filesArray = Array.isArray(photoFiles) ? photoFiles : [photoFiles];
    if (filesArray.length > 0) {
      await Promise.all(filesArray.map(photoFile => photosService.uploadPhoto(photoFile, 'shelter', shelter.id)));
    }
  }

  return await getShelterById(shelter.id);
}

async function updateShelter(id, data, photoFiles = null, currentUser = null) {
  await Promise.all([
    redisClient.delete(CACHE_KEYS.ALL_SHELTERS),
    redisClient.delete(CACHE_KEYS.SHELTER_BY_ID(id))
  ]);

  const ownedShelter = await getOwnedShelter(id, currentUser);
  if (currentUser?.role === 'shelter_admin') {
    if (!ownedShelter) {
      return null;
    }

    data = { ...data, admin_id: ownedShelter.admin_id };
  }
  
  // Обновляем только если есть данные для обновления (не только фото)
  if (Object.keys(data).length > 0) {
    const updatedShelter = await sheltersDao.update(id, data);
    if (!updatedShelter) {
      return null;
    }
  }
  
  // Обрабатываем фото, если они есть
  if (photoFiles) {
    const filesArray = Array.isArray(photoFiles) ? photoFiles : [photoFiles];
    if (filesArray.length > 0) {
      await Promise.all(filesArray.map(photoFile => photosService.uploadPhoto(photoFile, 'shelter', id)));
    }
  }
  
  return await getShelterById(id);
}

async function removeShelter(id, currentUser = null) {

  await Promise.all([
    redisClient.delete(CACHE_KEYS.ALL_SHELTERS),
    redisClient.delete(CACHE_KEYS.SHELTER_BY_ID(id))
  ]);
  
  try {

    const ownedShelter = await getOwnedShelter(id, currentUser);
    if (currentUser?.role === 'shelter_admin') {
      if (!ownedShelter) {
        return null;
      }
    }

    const photos = await photosDao.getByEntity('shelter', id);
    if (photos.length > 0) {
      await Promise.all(photos.map(photo => photosDao.remove(photo.id)));
    }

    return await sheltersDao.remove(id);
  } catch (error) {
    logger.error(error, 'Error removing shelter');
    throw error;
  }
}

export default { 
  getAllShelters, 
  getShelterById, 
  getShelterByAdminId,
  createShelter, 
  updateShelter, 
  removeShelter

};
