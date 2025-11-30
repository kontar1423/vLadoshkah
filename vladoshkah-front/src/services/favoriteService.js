
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
            // Используем bulk endpoint для получения всех избранных
            // Получаем все животные, затем проверяем их статус избранного через bulk endpoint
            const allAnimals = await api.get('/animals');
            const animalIds = allAnimals.data.map(animal => animal.id);
            
            if (animalIds.length === 0) {
                return [];
            }
            
            // Используем bulk endpoint для проверки избранных
            const response = await api.post('/users/favorite/animals', {
                user_id: userId,
                animal_ids: animalIds
            });
            
            // Фильтруем только те, которые в избранном (true)
            // Ответ: { "9": true, "10": false, "11": true }
            const favoritesMap = response.data || {};
            const favoriteIds = Object.keys(favoritesMap)
                .filter(id => favoritesMap[id] === true)
                .map(id => parseInt(id));
            
            return favoriteIds;
        } catch (error) {
            console.error('favoriteService: Error getting user favorites:', error);
            // При ошибке возвращаем пустой массив
            return [];
        }
    },
    
    async checkFavoritesBulk(userId, animalIds) {
        try {
            if (!animalIds || animalIds.length === 0) {
                return {};
            }
            
            const response = await api.post('/users/favorite/animals', {
                user_id: userId,
                animal_ids: animalIds
            });
            
            return response.data || {};
        } catch (error) {
            console.error('favoriteService: Error checking favorites bulk:', error);
            return {};
        }
    }
    };
