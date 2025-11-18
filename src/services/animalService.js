import api from './api';

export const animalService = {
    // Получить всех животных
    async getAllAnimals() {
        const response = await api.get('/animals');
        return response.data;
    },

    // Получить животных с фильтрами
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

    // Получить животное по ID
    async getAnimalById(id) {
        const response = await api.get(`/animals/${id}`);
        return response.data;
    },

    // Поиск животных
    async searchAnimals(term) {
        const response = await api.get(`/animals/search/${term}`);
        return response.data;
    },

    // Получить животных приюта - ИСПРАВЛЕННЫЙ ЭНДПОИНТ
    async getAnimalsByShelter(shelterId) {
        try {
            console.log('Fetching animals for shelter:', shelterId);
            const response = await api.get(`/animals/shelter/${shelterId}`);
            console.log('Animals response:', response.data);
            return response.data;
        } catch (error) {
            console.error('Error fetching animals by shelter:', error);
            throw error;
        }
    }
};