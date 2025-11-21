    // services/favoriteService.js
    import api from './api';

    export const favoriteService = {
    // Проверить, есть ли животное в избранном
    async checkFavorite(userId, animalId) {
        try {
        const response = await api.get(`/users/favorite?user_id=${userId}&animal_id=${animalId}`);
        return response.data;
        } catch (error) {
        console.error('❌ favoriteService: Error checking favorite:', error);
        // Если 404 - значит не в избранном
        if (error.response?.status === 404) {
            return { isFavorite: false };
        }
        throw error;
        }
    },

    // Добавить в избранное
    async addFavorite(userId, animalId) {
        try {
        const response = await api.post('/users/favorite', {
            user_id: userId,
            animal_id: animalId
        });
        return response.data;
        } catch (error) {
        console.error('❌ favoriteService: Error adding favorite:', error);
        throw error;
        }
    },

    // Удалить из избранного
    async removeFavorite(userId, animalId) {
        try {
        const response = await api.delete('/users/favorite', {
            data: {
            user_id: userId,
            animal_id: animalId
            }
        });
        return response.data;
        } catch (error) {
        console.error('❌ favoriteService: Error removing favorite:', error);
        throw error;
        }
    },

    // Получить все избранные животные пользователя
    async getUserFavorites(userId) {
        try {
        // Если у вас есть endpoint для получения всех избранных
        // const response = await api.get(`/users/${userId}/favorites`);
        // return response.data;
        
        // Пока будем использовать localStorage как fallback
        const favorites = JSON.parse(localStorage.getItem('favoritePets') || '[]');
        return favorites;
        } catch (error) {
        console.error('❌ favoriteService: Error getting user favorites:', error);
        // Fallback на localStorage
        const favorites = JSON.parse(localStorage.getItem('favoritePets') || '[]');
        return favorites;
        }
    }
    };