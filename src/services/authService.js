    import api from './api';

    export const authService = {
    async register(userData) {
        try {
        console.log(' authService: Sending registration request...', userData);
        const response = await api.post('/auth/register', userData);
        console.log(' authService: Registration response:', response.data);
        
        if (response.data.accessToken && response.data.user) {
            this.saveAuthData(response.data);
            return {
            success: true,
            user: response.data.user,
            message: response.data.message || 'Регистрация успешна'
            };
        } else {
            return {
            success: false,
            error: 'Неполные данные от сервера'
            };
        }
        } catch (error) {
        console.error('authService: Registration error:', error);
        
        let message = 'Ошибка регистрации';
        
        if (error.response?.data?.error) {
            message = error.response.data.error;
        } else if (error.response?.data?.details) {
            message = error.response.data.details
            .map(detail => detail.message)
            .join(', ');
        } else if (error.message) {
            message = error.message;
        }
        
        return {
            success: false,
            error: message
        };
        }
    },

    async login(credentials) {
        try {
        console.log(' authService: Sending login request...', { email: credentials.email });
        const response = await api.post('/auth/login', credentials);
        console.log(' authService: Login response:', response.data);
        
        if (response.data.accessToken && response.data.user) {
            this.saveAuthData(response.data);
            return {
            success: true,
            user: response.data.user,
            message: response.data.message || 'Вход выполнен успешно'
            };
        } else {
            return {
            success: false,
            error: 'Неполные данные от сервера'
            };
        }
        } catch (error) {
        console.error('authService: Login error:', error);
        
        let message = 'Ошибка входа';
        
        if (error.response?.data?.error) {
            message = error.response.data.error;
        } else if (error.response?.data?.details) {
            message = error.response.data.details
            .map(detail => detail.message)
            .join(', ');
        } else if (error.response?.status === 401) {
            message = 'Неверный email или пароль';
        } else if (error.message) {
            message = error.message;
        }
        
        return {
            success: false,
            error: message
        };
        }
    },

    async getCurrentUserFromServer() {
        try {
        console.log('authService: Getting current user from server...');
        const response = await api.get('/users/me');
        console.log('authService: Current user data:', response.data);
        return response.data;
        } catch (error) {
        console.error('authService: Error getting current user from server:', error);
        throw error;
        }
    },

    logout() {
        console.log(' authService: Logging out...');
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        console.log(' authService: Logout completed');
    },

    saveAuthData(authData) {
        console.log('authService: Saving auth data...');
        if (authData.accessToken) {
        localStorage.setItem('accessToken', authData.accessToken);
        }
        if (authData.refreshToken) {
        localStorage.setItem('refreshToken', authData.refreshToken);
        }
        if (authData.user) {
        localStorage.setItem('user', JSON.stringify(authData.user));
        }
        console.log(' authService: Auth data saved');
    },

    getCurrentUser() {
        try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
        } catch {
        return null;
        }
    },
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    }
    };