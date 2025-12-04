import api from './api';

export const animalService = {
    async getAllAnimals() {
        const response = await api.get('/animals');
        return response.data;
    },

    async getAnimalsWithFilters(filters = {}) {
        const params = new URLSearchParams();
        
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== null && value !== undefined && value !== '') {
                params.append(key, value);
            }
        });

        const response = await api.get(`/animals/filters?${params.toString()}`);
        return response.data;
    },

    async getAnimalById(id) {
        const response = await api.get(`/animals/${id}`);
        return response.data;
    },

    async searchAnimals(term) {
        const response = await api.get(`/animals/search/${term}`);
        return response.data;
    },

    async getAnimalsByShelter(shelterId, forceRefresh = false) {
        try {
            console.log('Fetching animals for shelter:', shelterId, 'forceRefresh:', forceRefresh);
            const params = new URLSearchParams();
            params.append('shelter_id', shelterId);
            if (forceRefresh) {
                params.append('_t', Date.now().toString());
            }
            const url = `/animals/filters?${params.toString()}`;
            const response = await api.get(url);
            console.log('Animals response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching animals by shelter:', error);
            throw error;
        }
    },

    async createAnimal(animalData) {
        try {
            const response = await api.post('/animals', animalData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            console.error('Error creating animal:', error);
            throw error;
        }
    },

    async deleteAnimal(animalId) {
        try {
            const response = await api.delete(`/animals/${animalId}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting animal ${animalId}:`, error);
            throw error;
        }
    },

    async updateAnimal(animalId, animalData) {
        try {
            const isFormData = animalData instanceof FormData;
            const response = await api.put(`/animals/${animalId}`, animalData, {
                headers: isFormData
                    ? { 'Content-Type': 'multipart/form-data' }
                    : { 'Content-Type': 'application/json' }
            });
            return response.data;
        } catch (error) {
            console.error(`Error updating animal ${animalId}:`, error);
            throw error;
        }
    }
};
