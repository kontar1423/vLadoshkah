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

    const checkAuthStatus = async () => {
        const token = localStorage.getItem('accessToken');
        
        if (token) {
            try {
                console.log('AuthContext: Загрузка свежих данных пользователя...');
                const userData = await authService.getCurrentUserFromServer();
                setIsAuthenticated(true);
                setUser(userData);
                localStorage.setItem('user', JSON.stringify(userData));
                console.log('AuthContext: Пользователь аутентифицирован:', userData);
            } catch (error) {
                console.error('AuthContext: Ошибка загрузки пользователя:', error);
                const storedUser = localStorage.getItem('user');
                if (storedUser) {
                    try {
                        const userData = JSON.parse(storedUser);
                        setIsAuthenticated(true);
                        setUser(userData);
                        console.log('AuthContext: Используем сохраненные данные:', userData);
                    } catch (parseError) {
                        console.error('AuthContext: Ошибка парсинга данных:', parseError);
                        setIsAuthenticated(false);
                        setUser(null);
                    }
                } else {
                    setIsAuthenticated(false);
                    setUser(null);
                }
            }
        } else {
            setIsAuthenticated(false);
            setUser(null);
        }
        setLoading(false);
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            console.log('AuthContext: Регистрация пользователя...');
            
            const result = await authService.register(userData);
            console.log('AuthContext: Результат регистрации:', result);
            
            if (result.success && result.user) {
                setIsAuthenticated(true);
                setUser(result.user);
                localStorage.setItem('profileComplete', 'false');
                console.log('AuthContext: Регистрация успешна');
                return { success: true, user: result.user };
            } else {
                return { 
                    success: false, 
                    error: result.error || 'Ошибка регистрации' 
                };
            }
        } catch (error) {
            console.error('AuthContext: Ошибка регистрации:', error);
            return { 
                success: false, 
                error: 'Неожиданная ошибка при регистрации' 
            };
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        try {
            setLoading(true);
            const result = await authService.login({ email, password });
            
            if (result.success && result.user) {
                setIsAuthenticated(true);
                setUser(result.user);
                await checkAuthStatus(); // Перезагружаем свежие данные
                return { success: true };
            } else {
                return { 
                    success: false, 
                    error: result.error || 'Ошибка аутентификации' 
                };
            }
        } catch (error) {
            console.error('AuthContext: Ошибка входа:', error);
            return { 
                success: false, 
                error: 'Неожиданная ошибка при входе' 
            };
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        authService.logout();
        setIsAuthenticated(false);
        setUser(null);
        localStorage.removeItem('profileComplete');
    };

    const updateUser = async (userData) => {
        try {
            if (userData) {
                const updatedUser = { ...user, ...userData };
                setUser(updatedUser);
                localStorage.setItem('user', JSON.stringify(updatedUser));
                console.log('AuthContext: Данные пользователя обновлены локально', updatedUser);
                
                const freshUserData = await authService.getCurrentUserFromServer();
                setUser(freshUserData);
                localStorage.setItem('user', JSON.stringify(freshUserData));
                console.log('AuthContext: Свежие данные загружены с сервера', freshUserData);
            }
        } catch (error) {
            console.error('AuthContext: Ошибка обновления пользователя:', error);
        }
    };

    const refreshUser = async () => {
        try {
            console.log('AuthContext: Полное обновление данных пользователя...');
            const freshUserData = await authService.getCurrentUserFromServer();
            
            setUser(freshUserData);
            setIsAuthenticated(true);
            
            localStorage.setItem('user', JSON.stringify(freshUserData));
            console.log('AuthContext: Данные пользователя полностью обновлены', freshUserData);
            return freshUserData;
        } catch (error) {
            console.error('AuthContext: Ошибка обновления пользователя:', error);
            return user;
        }
    };

    const setAuthenticated = (userData) => {
        if (userData) {
            setUser(userData);
            setIsAuthenticated(true);
            localStorage.setItem('user', JSON.stringify(userData));
        }
    };

    const value = {
        isAuthenticated,
        user,
        loading,
        register,
        login,
        logout,
        updateUser,
        refreshUser,
        setAuthenticated
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};