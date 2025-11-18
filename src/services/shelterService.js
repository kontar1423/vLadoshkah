    import api from './api';

    export const shelterService = {
    // Получить все приюты
    async getAllShelters() {
        const response = await api.get('/shelters');
        return response.data;
    },

    // Получить приют по ID
    async getShelterById(id) {
        const response = await api.get(`/shelters/${id}`);
        return response.data;
    }
    };