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
        <div className={`min-h-screen py-8 px-4 ${activeTab === 'profile' ? 'bg-green-95' : 'bg-green-95'}`}>
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <h1 className="text-green-30 font-sf-rounded font-bold text-4xl md:text-5xl mb-2">
                        Панель администратора
                    </h1>
                    <p className="text-green-30 font-inter font-medium text-lg">
                        Управление пользователями, приютами, животными и заявками
                    </p>
                </div>

                <div className="bg-green-90 rounded-custom p-2 mb-6 flex flex-wrap gap-2 border-2 border-green-30">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-6 py-3 rounded-custom-small font-sf-rounded font-semibold text-base transition-all duration-200 ${
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
                    <div className="bg-green-95 rounded-custom p-6 border-2 border-green-30">
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


