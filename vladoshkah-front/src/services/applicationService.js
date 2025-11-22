import api from './api';

export const applicationService = {
    async createTakeApplication(applicationData) {
        const response = await api.post('/applications/take', applicationData);
        return response.data;
    },

    async getUserTakeApplications() {
        const response = await api.get('/applications/take');
        return response.data;
    },

    
    async getTakeApplicationById(id) {
        const response = await api.get(`/applications/take/${id}`);
        return response.data;
    },

    async updateTakeApplication(id, applicationData) {
        const response = await api.put(`/applications/take/${id}`, applicationData);
        return response.data;
    },

    async deleteTakeApplication(id) {
        await api.delete(`/applications/take/${id}`);
    },

    async getApprovedTakeApplicationsCount() {
        const response = await api.get('/applications/take/count/approved');
        return response.data;
    },

    async checkTakeApplicationForAnimal(animalId) {
    try {
        const applications = await this.getUserTakeApplications();
        return applications.some(app => app.animal_id === animalId && app.status !== 'rejected');
    } catch (error) {
        console.error('Error checking application for animal:', error);
        return false;
    }
},

    async checkTakeApplicationForAnimal(animalId) {
        const applications = await this.getUserTakeApplications();
        return applications.some(app => app.animal_id === animalId && app.status !== 'rejected');
    },

    async createGiveApplication(formData) {
        const response = await api.post('/applications/give', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    async getUserGiveApplications() {
        const response = await api.get('/applications/give');
        return response.data;
    },

    async getGiveApplicationById(id) {
        const response = await api.get(`/applications/give/${id}`);
        return response.data;
    },

    async updateGiveApplication(id, formData) {
        const response = await api.put(`/applications/give/${id}`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    async deleteGiveApplication(id) {
        await api.delete(`/applications/give/${id}`);
    }
};