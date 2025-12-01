import React, { useState, useEffect } from 'react';
import { applicationService } from '../../services/applicationService';
import { getPhotoUrl } from '../../utils/photoHelpers';

const ApplicationsManagement = () => {
    const [takeApplications, setTakeApplications] = useState([]);
    const [giveApplications, setGiveApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('take');

    useEffect(() => {
        loadApplications();
    }, []);

    const loadApplications = async () => {
        try {
            setLoading(true);
            const [takeData, giveData] = await Promise.all([
                applicationService.getUserTakeApplications(),
                applicationService.getUserGiveApplications()
            ]);
            setTakeApplications(takeData);
            setGiveApplications(giveData);
        } catch (error) {
            console.error('Ошибка загрузки заявок:', error);
            alert('Не удалось загрузить заявки');
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (application, newStatus, type) => {
        try {
            if (type === 'take') {
                await applicationService.updateTakeApplication(application.id, { status: newStatus });
            } else {
                await applicationService.updateGiveApplication(application.id, { status: newStatus });
            }
            alert('Статус заявки обновлен');
            loadApplications();
        } catch (error) {
            console.error('Ошибка обновления статуса:', error);
            alert(error.response?.data?.error || 'Не удалось обновить статус');
        }
    };

    const handleDelete = async (applicationId, type) => {
        if (!window.confirm('Вы уверены, что хотите удалить эту заявку? Это действие нельзя отменить.')) {
            return;
        }

        try {
            if (type === 'take') {
                await applicationService.deleteTakeApplication(applicationId);
            } else {
                await applicationService.deleteGiveApplication(applicationId);
            }
            alert('Заявка успешно удалена');
            loadApplications();
        } catch (error) {
            console.error('Ошибка удаления заявки:', error);
            alert(error.response?.data?.error || 'Не удалось удалить заявку');
        }
    };

    const getStatusLabel = (status) => {
        const statuses = {
            'pending': 'Ожидает',
            'approved': 'Одобрена',
            'rejected': 'Отклонена',
            'cancelled': 'Отменена'
        };
        return statuses[status] || status;
    };

    const getStatusColor = (status) => {
        const colors = {
            'pending': 'bg-green-80 text-green-30',
            'approved': 'bg-green-30 text-green-100',
            'rejected': 'bg-red-500 text-white',
            'cancelled': 'bg-gray-500 text-white'
        };
        return colors[status] || 'bg-green-80 text-green-30';
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-50 mx-auto mb-4"></div>
                <div className="text-green-30">Загрузка заявок...</div>
            </div>
        );
    }

    const applications = activeTab === 'take' ? takeApplications : giveApplications;

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-green-30 font-sf-rounded font-bold text-2xl">Управление заявками</h2>
            </div>

            <div className="flex gap-2 mb-6">
                <button
                    onClick={() => setActiveTab('take')}
                    className={`px-6 py-3 rounded-custom-small font-sf-rounded font-semibold transition-all ${
                        activeTab === 'take'
                            ? 'bg-green-30 text-green-100'
                            : 'bg-green-90 text-green-40 hover:bg-green-80'
                    }`}
                >
                    Заявки на взятие ({takeApplications.length})
                </button>
                <button
                    onClick={() => setActiveTab('give')}
                    className={`px-6 py-3 rounded-custom-small font-sf-rounded font-semibold transition-all ${
                        activeTab === 'give'
                            ? 'bg-green-30 text-green-100'
                            : 'bg-green-90 text-green-40 hover:bg-green-80'
                    }`}
                >
                    Заявки на отдачу ({giveApplications.length})
                </button>
            </div>

            <div className="space-y-4">
                {applications.length === 0 ? (
                    <div className="text-center py-12 bg-green-90 rounded-custom">
                        <p className="text-green-40 font-inter">Нет заявок</p>
                    </div>
                ) : (
                    applications.map((application) => (
                        <div key={application.id} className="bg-green-90 rounded-custom p-6 border-2 border-green-80">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <h3 className="text-green-30 font-sf-rounded font-bold text-xl mb-2">
                                        Заявка #{application.id}
                                    </h3>
                                    {activeTab === 'take' && (
                                        <>
                                            <p className="text-green-20 font-inter mb-1">
                                                Животное ID: {application.animal_id}
                                            </p>
                                            <p className="text-green-20 font-inter mb-1">
                                                Пользователь ID: {application.user_id}
                                            </p>
                                        </>
                                    )}
                                    {activeTab === 'give' && (
                                        <>
                                            {application.photos && application.photos.length > 0 && (
                                                <img
                                                    src={getPhotoUrl(application.photos[0])}
                                                    alt="Фото животного"
                                                    className="w-32 h-32 object-cover rounded-custom-small mb-2"
                                                />
                                            )}
                                            <p className="text-green-20 font-inter mb-1">
                                                Пользователь ID: {application.user_id}
                                            </p>
                                        </>
                                    )}
                                    <p className="text-green-20 font-inter mb-2">
                                        Описание: {application.description || 'Не указано'}
                                    </p>
                                    <span className={`px-3 py-1 rounded-full text-sm font-sf-rounded font-semibold ${getStatusColor(application.status)}`}>
                                        {getStatusLabel(application.status)}
                                    </span>
                                </div>
                                <div className="flex flex-col gap-2">
                                    <select
                                        value={application.status}
                                        onChange={(e) => handleStatusUpdate(application, e.target.value, activeTab)}
                                        className="px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20 font-sf-rounded font-semibold"
                                    >
                                        <option value="pending">Ожидает</option>
                                        <option value="approved">Одобрена</option>
                                        <option value="rejected">Отклонена</option>
                                        <option value="cancelled">Отменена</option>
                                    </select>
                                    <button
                                        onClick={() => handleDelete(application.id, activeTab)}
                                        className="px-4 py-2 bg-green-80 text-green-30 font-sf-rounded font-semibold text-sm rounded-custom-small hover:bg-green-70 transition-all"
                                    >
                                        Удалить
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ApplicationsManagement;


