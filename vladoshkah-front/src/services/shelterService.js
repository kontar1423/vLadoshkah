import api from './api';

export const shelterService = {
    async getAllShelters() {
        const response = await api.get('/shelters');
        return response.data.map(shelter => normalizeShelterData(shelter));
    },

    async getShelterById(id) {
        const response = await api.get(`/shelters/${id}`);
        return normalizeShelterData(response.data);
    }
};

const normalizeShelterData = (shelterData) => {
    if (!shelterData) return null;

    const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL || 'http://172.29.8.236:9000';

    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        
        console.log('Processing shelter photo:', photo);
        
        if (typeof photo === 'string') {
            if (photo.startsWith('http')) return photo;
            return `${UPLOADS_BASE_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
        }
        
        if (photo.url) {
            if (photo.url.startsWith('http')) return photo.url;
            return `${UPLOADS_BASE_URL}${photo.url.startsWith('/') ? '' : '/'}${photo.url}`;
        }
        
        if (photo.object_name) {
            return `${UPLOADS_BASE_URL}/${photo.object_name}`;
        }
        
        return null;
    };

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
    districtId: shelterData.region,
    photos: shelterData.photos || [],
    rating: shelterData.rating || 0,
    district: shelterData.district || 'Москва',
    description: shelterData.description || 'Описание приюта'
    };
};