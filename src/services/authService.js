    import api from './api';

    export const authService = {
    // Регистрация
    async register(userData) {
        try {
        const response = await api.post('/auth/register', userData);
        if (response.data.accessToken) {
            this.saveAuthData(response.data);
        }
        return response.data;
        } catch (error) {
        this.handleAuthError(error);
        throw error;
        }
    },

    // Логин
    async login(credentials) {
        try {
        const response = await api.post('/auth/login', credentials);
        if (response.data.accessToken) {
            this.saveAuthData(response.data);
        }
        return response.data;
        } catch (error) {
        this.handleAuthError(error);
        throw error;
        }
    },

    // Выход
    logout() {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
    },

    // Обновление токена
    async refreshToken() {
        try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
            throw new Error('No refresh token');
        }

        const response = await api.post('/auth/refresh', { refreshToken });
        this.saveAuthData(response.data);
        return response.data;
        } catch (error) {
        this.logout();
        throw error;
        }
    },

    // Сохранение данных аутентификации
    saveAuthData(authData) {
        if (authData.accessToken) {
        localStorage.setItem('accessToken', authData.accessToken);
        }
        if (authData.refreshToken) {
        localStorage.setItem('refreshToken', authData.refreshToken);
        }
        if (authData.user) {
        localStorage.setItem('user', JSON.stringify(authData.user));
        }
    },

    // Получение текущего пользователя
    getCurrentUser() {
        try {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
        } catch {
        return null;
        }
    },

    // Проверка аутентификации
    isAuthenticated() {
        return !!localStorage.getItem('accessToken');
    },

    // Получение токена
    getToken() {
        return localStorage.getItem('accessToken');
    },

    // Обработка ошибок аутентификации
    handleAuthError(error) {
        if (error.response?.status === 401) {
        this.logout();
        }
    }
    };