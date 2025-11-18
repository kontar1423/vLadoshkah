    import axios from 'axios';

    const BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

    // Создаем экземпляр axios
    const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    });

    // Интерцептор для добавления токена
    api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
    );

    // Интерцептор для обновления токена при истечении
    api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;
        
        try {
            const refreshToken = localStorage.getItem('refreshToken');
            const response = await axios.post(`${BASE_URL}/auth/refresh`, {
            refreshToken
            });
            
            const { accessToken, refreshToken: newRefreshToken } = response.data;
            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('refreshToken', newRefreshToken);
            
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return api(originalRequest);
        } catch (refreshError) {
            // Если refresh не удался, разлогиниваем
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            localStorage.removeItem('user');
            window.location.href = '/войти';
            return Promise.reject(refreshError);
        }
        }

        return Promise.reject(error);
    }
    );

    export default api;