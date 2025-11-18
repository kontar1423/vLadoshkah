    import api from './api';

    export const userService = {
    // Получить данные текущего пользователя
    async getCurrentUser() {
        const response = await api.get('/users/me');
        return response.data;
    },

    // Обновить данные пользователя
    async updateUser(userId, userData) {
        const response = await api.put(`/users/${userId}`, userData);
        return response.data;
    },

    // Частичное обновление
    async patchUser(userId, userData) {
        const response = await api.patch(`/users/${userId}`, userData);
        return response.data;
    },

    // Загрузить фото профиля
    async uploadPhoto(userId, photoFile) {
        const formData = new FormData();
        formData.append('photo', photoFile);
        
        const response = await api.post(`/users/${userId}/photo`, formData, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
        });
        return response.data;
    }
    };