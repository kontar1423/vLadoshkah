    import { createContext, useContext, useState, useEffect } from 'react';
    import { authService } from '../services/authService';

    const AuthContext = createContext();

    export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
    };

    export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = () => {
        const token = localStorage.getItem('accessToken');
        const userData = authService.getCurrentUser();
        
        if (token && userData) {
        setIsAuthenticated(true);
        setUser(userData);
        } else {
        // Если токен есть, но пользователя нет - очищаем
        if (token) {
            authService.logout();
        }
        }
        setLoading(false);
    };

    const login = async (email, password) => {
        try {
        setLoading(true);
        const result = await authService.login({ email, password });
        
        if (result.success) {
            setIsAuthenticated(true);
            setUser(result.user);
            return { success: true };
        } else {
            return { 
            success: false, 
            error: result.message || 'Ошибка входа' 
            };
        }
        } catch (error) {
        const errorMessage = error.response?.data?.error || 
                            error.message || 
                            'Ошибка входа';
        return { 
            success: false, 
            error: errorMessage 
        };
        } finally {
        setLoading(false);
        }
    };

    const register = async (userData) => {
        try {
        setLoading(true);
        const result = await authService.register(userData);
        
        if (result.success) {
            setIsAuthenticated(true);
            setUser(result.user);
            return { success: true };
        } else {
            return { 
            success: false, 
            error: result.message || 'Ошибка регистрации' 
            };
        }
        } catch (error) {
        const errorMessage = error.response?.data?.error || 
                            error.message || 
                            'Ошибка регистрации';
        
        // Обработка ошибок валидации
        if (error.response?.data?.details) {
            const validationErrors = error.response.data.details
            .map(detail => detail.message)
            .join(', ');
            return { 
            success: false, 
            error: validationErrors 
            };
        }
        
        return { 
            success: false, 
            error: errorMessage 
        };
        } finally {
        setLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
    };

    const updateUser = (userData) => {
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
    };

    const refreshUser = async () => {
        const userData = authService.getCurrentUser();
        if (userData) {
        setUser(userData);
        }
    };

    const value = {
        isAuthenticated,
        user,
        loading,
        login,
        register,
        logout,
        updateUser,
        refreshUser
    };

    return (
        <AuthContext.Provider value={value}>
        {children}
        </AuthContext.Provider>
    );
    };