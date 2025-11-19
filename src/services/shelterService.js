import api from './api';

export const shelterService = {
    // Получить все приюты
    async getAllShelters() {
        const response = await api.get('/shelters');
        return response.data.map(shelter => normalizeShelterData(shelter));
    },

    // Получить приют по ID
    async getShelterById(id) {
        const response = await api.get(`/shelters/${id}`);
        return normalizeShelterData(response.data);
    }
};

// Функция для нормализации данных приюта с обработкой фото
const normalizeShelterData = (shelterData) => {
    if (!shelterData) return null;

    const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL || 'http://172.29.8.236:9000';

    // Унифицированная функция для получения URL фото (как в PetCard)
    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        
        console.log('Processing shelter photo:', photo);
        
        // Если photo - строка с URL
        if (typeof photo === 'string') {
            if (photo.startsWith('http')) return photo;
            return `${UPLOADS_BASE_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
        }
        
        // Если photo - объект с полем url
        if (photo.url) {
            if (photo.url.startsWith('http')) return photo.url;
            return `${UPLOADS_BASE_URL}${photo.url.startsWith('/') ? '' : '/'}${photo.url}`;
        }
        
        // Если photo - объект с полем object_name
        if (photo.object_name) {
            return `${UPLOADS_BASE_URL}/${photo.object_name}`;
        }
        
        return null;
    };

    // Обработка фото приюта
    let photoUrl = null;
    if (shelterData.photos && Array.isArray(shelterData.photos) && shelterData.photos.length > 0) {
        photoUrl = getPhotoUrl(shelterData.photos[0]);
    } else if (shelterData.photo_url) {
        photoUrl = getPhotoUrl(shelterData.photo_url);
    } else if (shelterData.photo) {
        photoUrl = getPhotoUrl(shelterData.photo);
    }

    console.log('Shelter photo URL:', photoUrl);

    return {
        ...shelterData,
        photoUrl: photoUrl,
        // Обеспечиваем обратную совместимость
        photos: shelterData.photos || [],
        rating: shelterData.rating || 0,
        district: shelterData.district || 'Москва',
        description: shelterData.description || 'Описание приюта'
    };
};