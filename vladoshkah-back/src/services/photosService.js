import minioClient from '../minioClient.js';
import photosDao from '../dao/photosDao.js';
import redisClient from '../cache/redis-client.js';
import { v4 as uuidv4 } from 'uuid';
import { normalizePhoto, normalizePhotos, toRelativeUploadUrl } from '../utils/urlUtils.js';
import logger from '../logger.js';

// Константы для кэширования
const CACHE_TTL = 3600; // 1 час
const CACHE_KEYS = {
  PHOTO_BY_ID: (id) => `photo:${id}`,
  PHOTO_BY_OBJECT_NAME: (objectName) => `photo:object:${objectName}`,
  PHOTOS_BY_ENTITY: (entityType, entityId) => `photos:${entityType}:${entityId}`,
  PHOTOS_BY_ENTITY_TYPE: (entityType) => `photos:${entityType}:all`,
  ALL_PHOTOS: 'photos:all'
};

class PhotosService {
  // Вспомогательная функция для инвалидации кэша фото
  async invalidatePhotoCaches(photo = null, entityType = null, entityId = null) {
    const patterns = [
      'photos:all',
      'photos:animal:*',
      'photos:shelter:*',
      'photos:animal_to_give:*'
    ];
    
    if (photo) {
      patterns.push(CACHE_KEYS.PHOTO_BY_ID(photo.id));
      patterns.push(CACHE_KEYS.PHOTO_BY_OBJECT_NAME(photo.object_name));
    }
    
    if (entityType && entityId) {
      patterns.push(CACHE_KEYS.PHOTOS_BY_ENTITY(entityType, entityId));
    }
    
    if (entityType) {
      patterns.push(CACHE_KEYS.PHOTOS_BY_ENTITY_TYPE(entityType));
    }
    
    // Удаляем все ключи по паттернам
    for (const pattern of patterns) {
      await redisClient.deleteByPattern(pattern);
    }
  }

  async uploadPhoto(file, entity_type, entity_id) {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const objectName = `${uuidv4()}.${fileExtension}`;
      const bucketName = process.env.MINIO_BUCKET || 'uploads';

      logger.debug({
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      }, 'Uploading file');

      // РЕШЕНИЕ: Передаем метаданные как ОБЪЕКТ, а не строку
      const metaData = {
        'Content-Type': file.mimetype,
        'X-Amz-Meta-Original-Name': file.originalname,
        'X-Amz-Meta-Uploaded-At': new Date().toISOString()
      };

      // Загружаем с правильными метаданными
      await minioClient.putObject(
        bucketName,
        objectName,
        file.buffer,
        file.size,
        metaData  // передаем ОБЪЕКТ метаданных
      );

      logger.debug({ objectName }, 'File uploaded successfully');

      const photoUrl = toRelativeUploadUrl(`http://localhost:9000/${bucketName}/${objectName}`);

      const photoData = {
        original_name: file.originalname,
        object_name: objectName,
        bucket: bucketName,
        size: file.size,
        mimetype: file.mimetype,
        entity_type,
        entity_id: parseInt(entity_id),
        url: photoUrl
      };

      const photo = normalizePhoto(await photosDao.create(photoData));
      
      // Инвалидируем кэш после создания фото
      await this.invalidatePhotoCaches(photo, entity_type, entity_id);
      
      logger.debug({ entity_type, entity_id }, 'Photo created and cache invalidated');
      
      return photo;
    } catch (error) {
      logger.error(error, 'PhotosService: error uploading photo');
      throw error;
    }
  }
  
  async getPhotoFile(objectName) {
    try {
      // Для файлов обычно не кэшируем, т.к. это бинарные данные
      const photo = await photosDao.getByObjectName(objectName);
      
      if (!photo) {
        throw new Error('Photo not found');
      }

      // Получаем файл из MinIO
      return await minioClient.getObject(photo.bucket, photo.object_name);
    } catch (error) {
      logger.error(error, 'PhotosService: error getting photo file');
      throw error;
    }
  }

  async getPhotoFileInfo(objectName) {
    try {
      const cacheKey = CACHE_KEYS.PHOTO_BY_OBJECT_NAME(objectName);
      
      // Пытаемся получить из кэша
      const cached = await redisClient.get(cacheKey);
      if (cached) {
        logger.debug({ objectName }, 'Cache hit: photo info');
        return normalizePhoto(cached);
      }

      logger.debug({ objectName }, 'Cache miss: photo info');
      
      const photoRecord = await photosDao.getByObjectName(objectName);
      
      if (!photoRecord) {
        throw new Error('Photo not found');
      }

      const photo = normalizePhoto(photoRecord);

      // Сохраняем в кэш
      await redisClient.set(cacheKey, photo, CACHE_TTL);
      
      return photo;
    } catch (error) {
      logger.error(error, 'PhotosService: error getting photo info');
      throw error;
    }
  }

  async deletePhoto(id) {
    try {
      const photo = await photosDao.getById(id);
      
      if (!photo) {
        throw new Error('Photo not found');
      }

      // Удаляем из MinIO
      await minioClient.removeObject(photo.bucket, photo.object_name);
      
      // Удаляем запись из БД
      const result = await photosDao.remove(id);
      
      // Инвалидируем кэш
      await this.invalidatePhotoCaches(photo, photo.entity_type, photo.entity_id);
      
      logger.debug({ id }, 'Photo deleted and cache invalidated');
      
      return result;
    } catch (error) {
      logger.error(error, 'PhotosService: error deleting photo');
      throw error;
    }
  }

  async deletePhotosOfEntity(EntityId, EntityType) {
    try {
      // Получаем все фото животного
      const photos = await photosDao.getByEntity(EntityType, EntityId);
      
      if (!photos || photos.length === 0) {
        logger.debug({ EntityType, EntityId }, 'No photos found for entity');
        return { deleted: 0 };
      }

      let deletedCount = 0;
      
      // Удаляем каждое фото
      for (let i = 0; i < photos.length; i++) {
        const photo = photos[i];
        try {
          // Удаляем из MinIO
          await minioClient.removeObject(photo.bucket, photo.object_name);
          // Удаляем из БД
          await photosDao.remove(photo.id);
          deletedCount++;
        } catch (error) {
          logger.error(error, { photoId: photo.id }, 'Error deleting photo');
          // Продолжаем удалять остальные фото даже если одна ошибка
        }
      }

      // Инвалидируем кэш после удаления всех фото
      await this.invalidatePhotoCaches(null, EntityType, EntityId);
      
      logger.info({ EntityType, EntityId, deletedCount }, 'Deleted photos for entity and invalidated cache');
      return { deleted: deletedCount };
      
    } catch (error) {
      logger.error(error, { EntityType }, 'PhotosService: error deleting entity photos');
      throw error;
    }
  }

  // Сохраняем существующие методы с добавлением кэширования
  async createPhoto(photoData) {
    const preparedPhotoData = {
      ...photoData,
      url: toRelativeUploadUrl(photoData?.url),
    };

    const photo = normalizePhoto(await photosDao.create(preparedPhotoData));
    
    // Инвалидируем кэш
    await this.invalidatePhotoCaches(photo, photo.entity_type, photo.entity_id);
    
    return photo;
  }

  async getPhoto(id) {
    const cacheKey = CACHE_KEYS.PHOTO_BY_ID(id);
    
    // Пытаемся получить из кэша
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug({ id }, 'Cache hit: photo');
      return normalizePhoto(cached);
    }

    logger.debug({ id }, 'Cache miss: photo');
    
    const photoRecord = await photosDao.getById(id);
    const photo = normalizePhoto(photoRecord);

    if (photo) {
      // Сохраняем в кэш
      await redisClient.set(cacheKey, photo, CACHE_TTL);
    }
    
    return photo;
  }

  async getPhotoByObjectName(objectName) {
    const cacheKey = CACHE_KEYS.PHOTO_BY_OBJECT_NAME(objectName);
    
    // Пытаемся получить из кэша
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug({ objectName }, 'Cache hit: photo by object name');
      return normalizePhoto(cached);
    }

    logger.debug({ objectName }, 'Cache miss: photo by object name');
    
    const photoRecord = await photosDao.getByObjectName(objectName);
    const photo = normalizePhoto(photoRecord);

    if (photo) {
      // Сохраняем в кэш
      await redisClient.set(cacheKey, photo, CACHE_TTL);
    }
    
    return photo;
  }

  async getPhotosByEntity(entityType, entityId) {
    const cacheKey = CACHE_KEYS.PHOTOS_BY_ENTITY(entityType, entityId);
    
    // Пытаемся получить из кэша
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug({ entityType, entityId }, 'Cache hit: photos for entity');
      return normalizePhotos(cached);
    }

    logger.debug({ entityType, entityId }, 'Cache miss: photos for entity');
    
    const photos = normalizePhotos(await photosDao.getByEntity(entityType, entityId));
    
    // Сохраняем в кэш
    await redisClient.set(cacheKey, photos, CACHE_TTL);
    
    return photos;
  }

  async getAllPhotos() {
    const cacheKey = CACHE_KEYS.ALL_PHOTOS;
    
    // Пытаемся получить из кэша
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug('Cache hit: all photos');
      return normalizePhotos(cached);
    }

    logger.debug('Cache miss: all photos');
    
    const photos = normalizePhotos(await photosDao.getAll());
    
    // Сохраняем в кэш
    await redisClient.set(cacheKey, photos, CACHE_TTL);
    
    return photos;
  }

  async getPhotosByEntityType(entityType) {
    const cacheKey = CACHE_KEYS.PHOTOS_BY_ENTITY_TYPE(entityType);
    
    // Пытаемся получить из кэша
    const cached = await redisClient.get(cacheKey);
    if (cached) {
      logger.debug({ entityType }, 'Cache hit: photos for entity type');
      return normalizePhotos(cached);
    }

    logger.debug({ entityType }, 'Cache miss: photos for entity type');
    
    const photos = normalizePhotos(await photosDao.getByEntityType(entityType));
    
    // Сохраняем в кэш
    await redisClient.set(cacheKey, photos, CACHE_TTL);
    
    return photos;
  }

  // // Дополнительный метод для принудительной очистки кэша фото
  // async clearPhotoCache() {
  //   try {
  //     await redisClient.deleteByPattern('photo:*');
  //     await redisClient.deleteByPattern('photos:*');
  //     console.log('Photo cache cleared');
  //   } catch (error) {
  //     console.error('Error clearing photo cache', error);
  //     throw error;
  //   }
  // }
}

export default new PhotosService();
