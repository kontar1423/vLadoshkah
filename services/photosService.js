import { PhotosDao } from '../dao/photosDao.js';

export const PhotosService = {
    async getAllPhotos() {
        return await PhotosDao.getAll();
    },

    async getPhotoById(id) {
        return await PhotosDao.getById(id);
    },

    async getPhotosByEntity(entityType, entityId) {
        return await PhotosDao.getByEntity(entityType, entityId);
    },

    async createPhoto(data) {
        return await PhotosDao.create(data);
    },

    async deletePhoto(id) {
        return await PhotosDao.delete(id);
    },
};
