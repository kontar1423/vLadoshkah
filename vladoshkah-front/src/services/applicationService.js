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
            const animalIdNum = parseInt(animalId);
            console.log('Checking applications for animal:', animalIdNum);
            console.log('User applications:', applications);
            
            const hasApplication = applications.some(app => {
                const appAnimalId = parseInt(app.animal_id);
                const matches = appAnimalId === animalIdNum && app.status !== 'rejected';
                console.log(`App animal_id: ${appAnimalId}, checking: ${animalIdNum}, matches: ${matches}, status: ${app.status}`);
                return matches;
            });
            
            console.log('Has application for this animal:', hasApplication);
            return hasApplication;
        } catch (error) {
            console.error('Error checking application for animal:', error);
            return false;
        }
    },

    async getApplicationsForAnimal(animalId) {
        try {
            const response = await api.get(`/applications/take/animal/${animalId}`);
            console.log('Applications for animal response:', response.data);
            return Array.isArray(response.data) ? response.data : [];
        } catch (error) {
            console.error('Error getting applications for animal:', error);
            if (error.response?.status === 404) {
                console.warn('Endpoint /applications/take/animal/:id not found, returning empty array');
            }
            return [];
        }
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