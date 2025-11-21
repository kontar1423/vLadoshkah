// Хелпер для работы с фотографиями
export const getPhotoUrl = (photo) => {
    if (!photo) return null;
    
    const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL || 'http://172.29.8.236:9000/uploads';
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://172.29.8.236:4000';
    
    if (photo.url) {
        if (photo.url.startsWith('http')) {
            return photo.url;
        }
        // Проверяем, является ли URL относительным путем к API
        if (photo.url.startsWith('/api/photos/file/')) {
            return `${API_BASE_URL}${photo.url}`;
        }
        // Или это путь к MinIO
        return `${UPLOADS_BASE_URL}${photo.url.startsWith('/') ? '' : '/'}${photo.url}`;
    }
    
    if (photo.object_name) {
        return `${UPLOADS_BASE_URL}/${photo.object_name}`;
    }
    
    return null;
};

export const getMultiplePhotoUrls = (photos = []) => {
    return photos.map(photo => getPhotoUrl(photo)).filter(url => url !== null);
};