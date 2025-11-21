import api from './api';

export const userService = {
    async getCurrentUser() {
        try {
            const response = await api.get('/users/me');
            return response.data;
        } catch (error) {
            console.error(' userService: Error getting current user:', error);
            throw error;
        }
    },

    async updateUser(userData) {
        try {
            console.log('userService: Updating user data, type:', typeof userData);
            
            if (userData instanceof FormData) {
                console.log('📋 userService: FormData contents:');
                for (let [key, value] of userData.entries()) {
                    console.log(`  ${key}:`, value instanceof File ? `File: ${value.name}` : value);
                }
                
                try {
                    const response = await api.patch('/users/me', userData, {
                        headers: {
                            'Content-Type': 'multipart/form-data'
                        }
                    });
                    console.log('userService: User updated successfully with FormData');
                    return response.data;
                } catch (formDataError) {
                    console.log('userService: FormData failed, trying JSON...');
                    const jsonData = {};
                    for (let [key, value] of userData.entries()) {
                        if (!(value instanceof File)) {
                            jsonData[key] = value;
                        }
                    }
                    
                    console.log('userService: Converted to JSON:', jsonData);
                    
                    if (Object.keys(jsonData).length === 0) {
                        throw new Error('Нет полей для обновления после конвертации');
                    }
                    
                    const response = await api.patch('/users/me', jsonData);
                    console.log('userService: User updated successfully with JSON');
                    return response.data;
                }
            } else {
                console.log('userService: Sending as JSON:', userData);
                const response = await api.patch('/users/me', userData);
                console.log('userService: User updated successfully with JSON');
                return response.data;
            }
        } catch (error) {
            console.error('userService: All update methods failed:', error);
            
            if (error.response) {
                console.error('Response data:', error.response.data);
                console.error('Response status:', error.response.status);
                console.error('Response headers:', error.response.headers);
            } else if (error.request) {
                console.error('No response received:', error.request);
            } else {
                console.error('Error message:', error.message);
            }
            
            throw error;
        }
    },
    async uploadUserPhoto(photoFile) {
        try {
            const formData = new FormData();
            formData.append('photo', photoFile);
            formData.append('entity_type', 'user');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            if (user.id) {
                formData.append('entity_id', user.id);
                console.log('userService: Uploading photo for user ID:', user.id);
            }
            
            console.log('userService: Uploading user photo...');
            const response = await api.post('/photos/upload', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            console.log('userService: Photo uploaded successfully:', response.data);
            return response.data;
        } catch (error) {
            console.error('userService: Error uploading photo:', error);
            throw error;
        }
    },

    async updateUserProfileWithPhoto(userData, photoFile) {
        try {
            console.log(' userService: Updating profile with photo...');
            let photoResult = null;
            if (photoFile) {
                try {
                    photoResult = await this.uploadUserPhoto(photoFile);
                    console.log('userService: Photo uploaded, result:', photoResult);
                } catch (photoError) {
                    console.error('userService: Photo upload failed, continuing without photo:', photoError);
                }
            }
            
            if (Object.keys(userData).length > 0) {
                console.log('userService: Updating user profile data:', userData);
                const userResult = await this.updateUser(userData);
                console.log('userService: Profile data updated:', userResult);
            
                if (photoResult) {
                    userResult.photoUrl = photoResult.url;
                    userResult.photoUpload = photoResult;
                }
                
                return userResult;
            } else if (photoResult) {
                return { photoUrl: photoResult.url, photoUpload: photoResult };
            } else {
                throw new Error('Нет данных для обновления');
            }
            
        } catch (error) {
            console.error(' userService: Error updating profile with photo:', error);
            throw error;
        }
    },

    async createUser(userData) {
        try {
            console.log(' userService: Creating new user...');
            
            if (userData instanceof FormData) {
                const response = await api.post('/users', userData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                console.log(' userService: User created successfully with FormData:', response.data);
                return response.data;
            } else {
                const response = await api.post('/users', userData);
                console.log(' userService: User created successfully:', response.data);
                return response.data;
            }
        } catch (error) {
            console.error(' userService: Error creating user:', error);
            throw error;
        }
    },

    async getUserById(id) {
        try {
            const response = await api.get(`/users/${id}`);
            return response.data;
        } catch (error) {
            console.error('userService: Error getting user by ID:', error);
            throw error;
        }
    }
};