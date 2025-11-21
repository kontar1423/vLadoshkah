
    import api from './api';

    export const favoriteService = {
    async checkFavorite(userId, animalId) {
        try {
        const response = await api.get(`/users/favorite?user_id=${userId}&animal_id=${animalId}`);
        return response.data;
        } catch (error) {
        console.error('favoriteService: Error checking favorite:', error);
        if (error.response?.status === 404 || error.response?.status === 400 || error.response?.status === 429) {
            return { isFavorite: false };
        }
        throw error;
        }
    },

    async addFavorite(userId, animalId) {
        try {
        const response = await api.post('/users/favorite', {
            user_id: userId,
            animal_id: animalId
        });
        return response.data;
        } catch (error) {
        console.error('favoriteService: Error adding favorite:', error);
        throw error;
        }
    },

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
        console.error('favoriteService: Error removing favorite:', error);
        throw error;
        }
    },

    
    async getUserFavorites(userId) {
        try {
        const favorites = JSON.parse(localStorage.getItem('favoritePets') || '[]');
        return favorites;
        } catch (error) {
        console.error(' favoriteService: Error getting user favorites:', error);
        const favorites = JSON.parse(localStorage.getItem('favoritePets') || '[]');
        return favorites;
        }
    }
    };
