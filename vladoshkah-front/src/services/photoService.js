import api from './api';

export const photoService = {
    async uploadPhoto(photoFile, entityType, entityId) {
        try {
            const formData = new FormData();
            formData.append('photo', photoFile);
            formData.append('entity_type', entityType);
            formData.append('entity_id', entityId);
            
            const response = await api.post('/photos/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('photoService: Error uploading photo:', error);
            throw error;
        }
    },

    async deletePhoto(photoId) {
        try {
            await api.delete(`/photos/${photoId}`);
        } catch (error) {
            console.error(`photoService: Error deleting photo ${photoId}:`, error);
            throw error;
        }
    },

    async getPhotosByEntity(entityType, entityId) {
        try {
            const response = await api.get(`/photos/entity/${entityType}/${entityId}`);
            return response.data;
        } catch (error) {
            console.error(`photoService: Error getting photos for ${entityType}/${entityId}:`, error);
            throw error;
        }
    }
};


