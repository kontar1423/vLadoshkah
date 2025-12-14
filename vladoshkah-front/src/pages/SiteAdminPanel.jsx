import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import UsersManagement from '../components/admin/UsersManagement';
import SheltersManagement from '../components/admin/SheltersManagement';
import AnimalsManagement from '../components/admin/AnimalsManagement';
import ApplicationsManagement from '../components/admin/ApplicationsManagement';
import Profile from './Profile';

const SiteAdminPanel = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users');

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/profile');
        }
    }, [user, navigate]);

    if (!user || user.role !== 'admin') {
        return null;
    }

    const tabs = [
        { id: 'profile', label: 'Профиль' },
        { id: 'users', label: 'Пользователи' },
        { id: 'shelters', label: 'Приюты' },
        { id: 'animals', label: 'Животные' },
        { id: 'applications', label: 'Заявки' }
    ];

    return (
        <div className={`min-h-screen py-4 sm:py-8 px-2 sm:px-4 ${activeTab === 'profile' ? 'bg-green-95' : 'bg-green-95'}`}>
            <div className="max-w-7xl mx-auto">
                <div className="mb-4 sm:mb-8">
                    <h1 className="text-green-30 font-sf-rounded font-bold text-2xl sm:text-3xl md:text-4xl lg:text-5xl mb-2">
                        Панель администратора
                    </h1>
                    <p className="text-green-30 font-inter font-medium text-sm sm:text-base md:text-lg">
                        Управление пользователями, приютами, животными и заявками
                    </p>
                </div>

                <div className="bg-green-90 rounded-custom p-2 mb-4 sm:mb-6 flex flex-wrap gap-1.5 sm:gap-2 border-2 border-green-30 overflow-x-auto">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 md:py-3 rounded-custom-small font-sf-rounded font-semibold text-xs sm:text-sm md:text-base whitespace-nowrap transition-all duration-200 ${
                                activeTab === tab.id
                                    ? 'bg-green-40 text-green-95 shadow-lg'
                                    : 'bg-green-95 text-green-40 hover:bg-green-80 hover:text-green-20'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {activeTab === 'profile' ? (
                    <div>
                        <Profile isInAdminPanel={true} />
                    </div>
                ) : (
                    <div className="bg-green-95 rounded-custom p-3 sm:p-4 md:p-6 border-2 border-green-30 overflow-x-auto">
                        {activeTab === 'users' && <UsersManagement />}
                        {activeTab === 'shelters' && <SheltersManagement />}
                        {activeTab === 'animals' && <AnimalsManagement />}
                        {activeTab === 'applications' && <ApplicationsManagement />}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SiteAdminPanel;


