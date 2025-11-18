    import api from './api';

    export const applicationService = {
    // Создать заявку на усыновление
    async createApplication(applicationData) {
        const response = await api.post('/applications', applicationData);
        return response.data;
    },

    // Получить все заявки пользователя
    async getUserApplications() {
        const response = await api.get('/applications');
        return response.data;
    },

    // Получить заявку по ID
    async getApplicationById(id) {
        const response = await api.get(`/applications/${id}`);
        return response.data;
    },

    // Обновить заявку
    async updateApplication(id, applicationData) {
        const response = await api.put(`/applications/${id}`, applicationData);
        return response.data;
    },

    // Удалить заявку
    async deleteApplication(id) {
        await api.delete(`/applications/${id}`);
    },

    // Получить количество одобренных заявок
    async getApprovedApplicationsCount() {
        const response = await api.get('/applications/count/approved');
        return response.data;
    }
    };