import minioClient from '../minioClient.js';
import photosDao from '../dao/photosDao.js';
import { v4 as uuidv4 } from 'uuid';

class PhotosService {
  async uploadPhoto(file, entity_type, entity_id) {
    try {
      const fileExtension = file.originalname.split('.').pop();
      const objectName = `${uuidv4()}.${fileExtension}`;
      const bucketName = process.env.MINIO_BUCKET || 'uploads';

      console.log('Uploading file:', {
        originalName: file.originalname,
        mimetype: file.mimetype,
        size: file.size
      });

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

      console.log('File uploaded successfully:', objectName);

      const photoData = {
        original_name: file.originalname,
        object_name: objectName,
        bucket: bucketName,
        size: file.size,
        mimetype: file.mimetype,
        entity_type,
        entity_id: parseInt(entity_id),
        url: `http://localhost:9000/${bucketName}/${objectName}`
      };

      return await photosDao.create(photoData);
    } catch (error) {
      console.error('PhotosService: error uploading photo', error);
      throw error;
    }
  }
  
  async getPhotoFile(objectName) {
    try {
      const photo = await photosDao.getByObjectName(objectName);
      
      if (!photo) {
        throw new Error('Photo not found');
      }

      // Получаем файл из MinIO
      return await minioClient.getObject(photo.bucket, photo.object_name);
    } catch (error) {
      console.error('PhotosService: error getting photo file', error);
      throw error;
    }
  }

  async getPhotoFileInfo(objectName) {
    try {
      const photo = await photosDao.getByObjectName(objectName);
      
      if (!photo) {
        throw new Error('Photo not found');
      }

      return photo;
    } catch (error) {
      console.error('PhotosService: error getting photo info', error);
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
      return await photosDao.remove(id);
    } catch (error) {
      console.error('PhotosService: error deleting photo', error);
      throw error;
    }
  }

async deletePhotosOfEntity(EntityId, EntityType) {
  try {
    // Получаем все фото животного
    const photos = await photosDao.getByEntity(EntityType, EntityId);
    
    if (!photos || photos.length === 0) {
      console.log(`No photos found for ${EntityType} ${EntityId}`);
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
        console.error(`Error deleting photo ${photo.id}:`, error);
        // Продолжаем удалять остальные фото даже если одна ошибка
      }
    }

    console.log(`Deleted ${deletedCount} photos for ${EntityType} ${EntityId}`);
    return { deleted: deletedCount };
    
  } catch (error) {
    console.error(`PhotosService: error deleting ${EntityType} photos`, error);
    throw error;
  }
}

  // Сохраняем существующие методы
  async createPhoto(photoData) {
    return await photosDao.create(photoData);
  }

  async getPhoto(id) {
    return await photosDao.getById(id);
  }

  async getPhotoByObjectName(objectName) {
    return await photosDao.getByObjectName(objectName);
  }

  async getPhotosByEntity(entityType, entityId) {
    return await photosDao.getByEntity(entityType, entityId);
  }

  async getAllPhotos() {
    return await photosDao.getAll();
  }

  async getPhotosByEntityType(entityType) {
    return await photosDao.getByEntityType(entityType);
  }
}

export default new PhotosService();