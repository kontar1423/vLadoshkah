import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Profile from './Profile';
import AdminProfile from './AdminProfile';
import { isShelterAdminRole } from '../utils/roleUtils';

const ProfileSelector = () => {
    const { user, refreshUser } = useAuth();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const initializeProfile = async () => {
            try {
                console.log('🔄 ProfileSelector: Инициализация профиля...');
                
                // Всегда обновляем данные пользователя при загрузке
                if (user?.id) {
                    await refreshUser();
                }
                
            } catch (error) {
                console.error('❌ ProfileSelector: Ошибка инициализации:', error);
            } finally {
                setIsLoading(false);
            }
        };

        initializeProfile();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-green-95 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-50 mx-auto mb-4"></div>
                    <div className="text-lg text-green-30">Загрузка профиля...</div>
                </div>
            </div>
        );
    }

    // Показываем AdminProfile если пользователь shelter_admin/admin_shelter или admin
    const showAdminProfile = isShelterAdminRole(user?.role) || user?.role === 'admin';
    
    console.log('🎯 ProfileSelector: Роль пользователя:', user?.role);
    console.log('🎯 ProfileSelector: Показываем:', showAdminProfile ? 'AdminProfile' : 'Profile');
    
    return showAdminProfile ? <AdminProfile /> : <Profile />;
};

export default ProfileSelector;
