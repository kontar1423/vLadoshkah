import api from './api';

export const applicationService = {
    // === ЗАЯВКИ НА УСЫНОВЛЕНИЕ (TAKE) ===
    
    // Создать заявку на усыновление
    async createTakeApplication(applicationData) {
        const response = await api.post('/applications/take', applicationData);
        return response.data;
    },

    // Получить все заявки пользователя на усыновление
    async getUserTakeApplications() {
        const response = await api.get('/applications/take');
        return response.data;
    },

    // Получить заявку на усыновление по ID
    async getTakeApplicationById(id) {
        const response = await api.get(`/applications/take/${id}`);
        return response.data;
    },

    // Обновить заявку на усыновление
    async updateTakeApplication(id, applicationData) {
        const response = await api.put(`/applications/take/${id}`, applicationData);
        return response.data;
    },

    // Удалить заявку на усыновление
    async deleteTakeApplication(id) {
        await api.delete(`/applications/take/${id}`);
    },

    // Получить количество одобренных заявок на усыновление
    async getApprovedTakeApplicationsCount() {
        const response = await api.get('/applications/take/count/approved');
        return response.data;
    },

    // Проверить есть ли заявка на конкретного питомца
    async checkTakeApplicationForAnimal(animalId) {
        const applications = await this.getUserTakeApplications();
        return applications.some(app => app.animal_id === animalId && app.status !== 'rejected');
    },

    // === ЗАЯВКИ НА ОТДАЧУ (GIVE) ===

    // Создать заявку на отдачу питомца
    async createGiveApplication(formData) {
        const response = await api.post('/applications/give', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Получить все заявки пользователя на отдачу
    async getUserGiveApplications() {
        const response = await api.get('/applications/give');
        return response.data;
    },

    // Получить заявку на отдачу по ID
    async getGiveApplicationById(id) {
        const response = await api.get(`/applications/give/${id}`);
        return response.data;
    },

    // Обновить заявку на отдачу
    async updateGiveApplication(id, formData) {
        const response = await api.put(`/applications/give/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    // Удалить заявку на отдачу
    async deleteGiveApplication(id) {
        await api.delete(`/applications/give/${id}`);
    }
};