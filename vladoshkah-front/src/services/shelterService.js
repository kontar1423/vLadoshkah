import api from './api';

export const shelterService = {
    async getAllShelters() {
        try {
            const response = await api.get('/shelters');
            return response.data.map(shelter => normalizeShelterData(shelter));
        } catch (error) {
            console.error('Error fetching shelters:', error);
            throw error;
        }
    },

    async getShelterById(id) {
        try {
            const response = await api.get(`/shelters/${id}`);
            return normalizeShelterData(response.data);
        } catch (error) {
            console.error(`Error fetching shelter ${id}:`, error);
            throw error;
        }
    },

    async createShelter(shelterData) {
        try {
            const response = await api.post('/shelters', shelterData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating shelter:', error);
            throw error;
        }
    },

    async updateShelter(shelterId, shelterData) {
        try {
            const isFormData = shelterData instanceof FormData;
            const response = await api.put(`/shelters/${shelterId}`, shelterData, {
                headers: isFormData
                    ? { 'Content-Type': 'multipart/form-data' }
                    : { 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating shelter ${shelterId}:`, error);
            throw error;
        }
    },

    async deleteShelter(shelterId) {
        try {
            const response = await api.delete(`/shelters/${shelterId}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting shelter ${shelterId}:`, error);
            throw error;
        }
    },

    async voteForShelter(shelterId, vote) {
        try {
            const response = await api.post('/shelters/vote', {
                shelter_id: shelterId,
                vote: vote
            });
            return response.data;
        } catch (error) {
            console.error(`Error voting for shelter ${shelterId}:`, error);
            throw error;
        }
    },

    async getShelterAnimals(shelterId) {
        try {
            const response = await api.get(`/animals/filters?shelter_id=${shelterId}`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching shelter ${shelterId} animals:`, error);
            throw error;
        }
    },

    async getShelterByAdminId(adminId) {
        try {
            const response = await api.get(`/shelters?admin_id=${adminId}`);
            return response.data.length > 0 ? normalizeShelterData(response.data[0]) : null;
        } catch (error) {
            console.error(`Error fetching shelter for admin ${adminId}:`, error);
            throw error;
        }
    },

    async getUserVote(shelterId) {
        try {
            const response = await api.get(`/shelters/${shelterId}/vote`);
            return response.data;
        } catch (error) {
            console.error(`Error fetching user vote for shelter ${shelterId}:`, error);
            if (error.response?.status === 401 || error.response?.status === 404) {
                return { vote: null, hasVote: false };
            }
            throw error;
        }
    }
};

const normalizeShelterData = (shelterData) => {
    if (!shelterData) return null;

    const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL || 'http://172.29.8.236:9000';

    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        
        if (typeof photo === 'string') {
            if (photo.startsWith('http')) return photo;
            return `${UPLOADS_BASE_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
        }
        
        if (photo.url) {
            if (photo.url.startsWith('http')) return photo.url;
            return `${UPLOADS_BASE_URL}${photo.url.startsWith('/') ? '' : '/'}${photo.url}`;
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

    return {
        ...shelterData,
        photoUrl: photoUrl,
        districtId: shelterData.region,
        photos: shelterData.photos || [],
        rating: shelterData.rating || 0,
        total_ratings: shelterData.total_ratings || 0,
        district: shelterData.district || 'Москва',
        description: shelterData.description || 'Описание приюта'
    };
};
