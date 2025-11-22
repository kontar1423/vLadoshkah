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
            console.log('AuthContext: Loading fresh user data from server...');
            const userData = await authService.getCurrentUserFromServer();
            setIsAuthenticated(true);
            setUser(userData);
            localStorage.setItem('user', JSON.stringify(userData));
            console.log('AuthContext: User authenticated with fresh data:', userData);
        } catch (error) {
            console.error('AuthContext: Failed to load user from server, using localStorage fallback');
            const userData = authService.getCurrentUser();
            if (userData) {
            setIsAuthenticated(true);
            setUser(userData);
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
        console.log('AuthContext: Registering user...');
        
        const result = await authService.register(userData);
        console.log('AuthContext: Register result:', result);
        
        if (result.success && result.user) {
            setIsAuthenticated(true);
            setUser(result.user);
            
            localStorage.setItem('profileComplete', 'false');
            
            console.log('AuthContext: Registration successful, user authenticated');
            return { success: true, user: result.user };
        } else {
            return { 
            success: false, 
            error: result.error || 'Ошибка регистрации' 
            };
        }
        } catch (error) {
        console.error('AuthContext: Register exception:', error);
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
            return { success: true };
        } else {
            return { 
            success: false, 
            error: result.error || 'Ошибка аутентификации' 
            };
        }
        } catch (error) {
        console.error('AuthContext: Login exception:', error);
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
            console.log('AuthContext: User data updated locally', updatedUser);
            
            const freshUserData = await authService.getCurrentUserFromServer();
            setUser(freshUserData);
            localStorage.setItem('user', JSON.stringify(freshUserData));
            console.log('AuthContext: Fresh user data loaded from server', freshUserData);
        }
        } catch (error) {
        console.error('AuthContext: Error updating user:', error);
        }
    };

    const refreshUser = async () => {
        try {
        const freshUserData = await authService.getCurrentUserFromServer();
        setUser(freshUserData);
        localStorage.setItem('user', JSON.stringify(freshUserData));
        console.log('AuthContext: User data refreshed from server', freshUserData);
        return freshUserData;
        } catch (error) {
        console.error('AuthContext: Error refreshing user:', error);
        throw error;
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