import React, { useState, useEffect } from 'react';
import { shelterService } from '../../services/shelterService';
import { getPhotoUrl } from '../../utils/photoHelpers';
import ImageCropModal from '../ImageCropModal';

const SheltersManagement = () => {
    const [shelters, setShelters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingShelter, setEditingShelter] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        address: '',
        phone: '',
        email: '',
        website: '',
        description: '',
        capacity: '',
        working_hours: '',
        region: '',
        can_adopt: true
    });
    const [photos, setPhotos] = useState([]);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [pendingFiles, setPendingFiles] = useState([]);

    const regions = [
        { value: '', label: 'Выберите регион' },
        { value: 'cao', label: 'Центральный административный округ (ЦАО)' },
        { value: 'sao', label: 'Северный административный округ (САО)' },
        { value: 'svao', label: 'Северо-Восточный административный округ (СВАО)' },
        { value: 'vao', label: 'Восточный административный округ (ВАО)' },
        { value: 'yuvao', label: 'Юго-Восточный административный округ (ЮВАО)' },
        { value: 'yao', label: 'Южный административный округ (ЮАО)' },
        { value: 'yuzao', label: 'Юго-Западный административный округ (ЮЗАО)' },
        { value: 'zao', label: 'Западный административный округ (ЗАО)' },
        { value: 'szao', label: 'Северо-Западный административный округ (СЗАО)' },
        { value: 'zelao', label: 'Зеленоградский административный округ (ЗелАО)' },
        { value: 'tinao', label: 'Троицкий административный округ (ТиНАО)' },
        { value: 'nao', label: 'Новомосковский административный округ (НАО)' }
    ];

    useEffect(() => {
        loadShelters();
    }, []);

    const loadShelters = async () => {
        try {
            setLoading(true);
            const data = await shelterService.getAllShelters();
            setShelters(data);
        } catch (error) {
            console.error('Ошибка загрузки приютов:', error);
            alert('Не удалось загрузить приюты');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        
        const fileQueue = files.map(file => {
            const reader = new FileReader();
            return new Promise((resolve) => {
                reader.onload = (e) => resolve({ file, dataUrl: e.target.result });
                reader.readAsDataURL(file);
            });
        });
        
        Promise.all(fileQueue).then(results => {
            setPendingFiles(results);
            if (results.length > 0) {
                setImageToCrop(results[0].dataUrl);
                setCropModalOpen(true);
            }
        });
    };

    const handleCropComplete = (croppedFile) => {
        setPhotos(prev => [...prev, croppedFile]);
        
        const remainingFiles = pendingFiles.slice(1);
        setPendingFiles(remainingFiles);
        
        if (remainingFiles.length > 0) {
            setImageToCrop(remainingFiles[0].dataUrl);
        } else {
            setCropModalOpen(false);
            setImageToCrop(null);
        }
    };

    const handleCropCancel = () => {
        setPendingFiles([]);
        setCropModalOpen(false);
        setImageToCrop(null);
    };

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const prepareFormData = () => {
        const formDataToSend = new FormData();
        Object.keys(formData).forEach(key => {
            if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
                if (key === 'capacity') {
                    formDataToSend.append(key, parseInt(formData[key]));
                } else if (key === 'can_adopt') {
                    formDataToSend.append(key, formData[key] ? 'true' : 'false');
                } else {
                    formDataToSend.append(key, formData[key]);
                }
            }
        });
        photos.forEach(photo => {
            formDataToSend.append('photos', photo);
        });
        return formDataToSend;
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            alert('Введите название приюта');
            return;
        }
        if (photos.length === 0) {
            alert('Добавьте хотя бы одну фотографию');
            return;
        }

        try {
            const formDataToSend = prepareFormData();
            await shelterService.createShelter(formDataToSend);
            alert('Приют успешно создан');
            setShowCreateForm(false);
            resetForm();
            loadShelters();
        } catch (error) {
            console.error('Ошибка создания приюта:', error);
            alert(error.response?.data?.error || 'Не удалось создать приют');
        }
    };

    const handleEdit = (shelter) => {
        setEditingShelter(shelter);
        setFormData({
            name: shelter.name || '',
            address: shelter.address || '',
            phone: shelter.phone || '',
            email: shelter.email || '',
            website: shelter.website || '',
            description: shelter.description || '',
            capacity: shelter.capacity || '',
            working_hours: shelter.working_hours || '',
            region: shelter.region || '',
            can_adopt: shelter.can_adopt || false
        });
        setPhotos([]);
        setCropModalOpen(false);
        setImageToCrop(null);
        setPendingFiles([]);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingShelter) return;

        try {
            // Собираем только измененные или непустые поля
            const jsonPayload = {};
            Object.keys(formData).forEach(key => {
                const value = formData[key];
                // Включаем поле, если оно не пустое или если это булево значение
                if (value !== '' && value !== null && value !== undefined) {
                    if (key === 'capacity') {
                        const numValue = parseInt(value);
                        if (!isNaN(numValue)) {
                            jsonPayload[key] = numValue;
                        }
                    } else if (key === 'can_adopt') {
                        jsonPayload[key] = !!value;
                    } else {
                        jsonPayload[key] = value;
                    }
                }
            });

            // Если есть фото, отправляем FormData (можно только с фото, без других полей)
            if (photos.length > 0) {
                const formDataToSend = new FormData();
                // Добавляем только измененные поля в FormData (если они есть)
                Object.entries(jsonPayload).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formDataToSend.append(key, typeof value === 'boolean' ? value.toString() : value);
                    }
                });
                // Добавляем фото
                photos.forEach(photo => formDataToSend.append('photos', photo));
                await shelterService.updateShelter(editingShelter.id, formDataToSend);
            } else {
                // Если нет фото, но есть поля для обновления
                if (Object.keys(jsonPayload).length > 0) {
                    await shelterService.updateShelter(editingShelter.id, jsonPayload);
                } else {
                    alert('Нет изменений для сохранения');
                    return;
                }
            }

            alert('Приют успешно обновлен');
            setEditingShelter(null);
            resetForm();
            loadShelters();
        } catch (error) {
            console.error('Ошибка обновления приюта:', error);
            alert(error.response?.data?.error || error.response?.data?.details?.[0]?.message || 'Не удалось обновить приют');
        }
    };

    const handleDelete = async (shelterId) => {
        if (!window.confirm('Вы уверены, что хотите удалить этот приют? Это действие нельзя отменить.')) {
            return;
        }

        try {
            await shelterService.deleteShelter(shelterId);
            alert('Приют успешно удален');
            loadShelters();
        } catch (error) {
            console.error('Ошибка удаления приюта:', error);
            alert(error.response?.data?.error || 'Не удалось удалить приют');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            address: '',
            phone: '',
            email: '',
            website: '',
            description: '',
            capacity: '',
            working_hours: '',
            region: '',
            can_adopt: true
        });
        setPhotos([]);
        setCropModalOpen(false);
        setImageToCrop(null);
        setPendingFiles([]);
    };

    if (loading) {
        return (
            <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-50 mx-auto mb-4"></div>
                <div className="text-green-30">Загрузка приютов...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-green-30 font-sf-rounded font-bold text-2xl">Управление приютами</h2>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-6 py-3 bg-green-30 text-green-100 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-20 transition-all"
                >
                    {showCreateForm ? 'Отмена' : '+ Создать приют'}
                </button>
            </div>

            {(showCreateForm || editingShelter) && (
                <div className="bg-green-90 rounded-custom p-6 mb-6 border-2 border-green-80">
                    <h3 className="text-green-30 font-sf-rounded font-bold text-xl mb-4">
                        {editingShelter ? 'Редактировать приют' : 'Создать приют'}
                    </h3>
                    <form onSubmit={editingShelter ? handleUpdate : handleCreate} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Название *</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Адрес</label>
                                <input
                                    type="text"
                                    name="address"
                                    value={formData.address}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Телефон</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Email</label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Сайт приюта</label>
                                <input
                                    type="url"
                                    name="website"
                                    value={formData.website}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                    placeholder="https://example.com"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Вместимость</label>
                                <input
                                    type="number"
                                    name="capacity"
                                    value={formData.capacity}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Режим работы</label>
                                <input
                                    type="text"
                                    name="working_hours"
                                    value={formData.working_hours}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Регион</label>
                                <select
                                    name="region"
                                    value={formData.region}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                >
                                    {regions.map(region => (
                                        <option key={region.value} value={region.value}>
                                            {region.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-center">
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        name="can_adopt"
                                        checked={formData.can_adopt}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-green-30 bg-green-95 border-2 border-green-30 rounded"
                                    />
                                    <span className="text-green-40 font-inter font-medium">
                                        Может принимать животных
                                    </span>
                                </label>
                            </div>
                        </div>
                        <div>
                            <label className="block text-green-40 font-inter font-medium mb-2">Описание</label>
                            <textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows="3"
                                className="w-full px-4 py-2 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20"
                            />
                        </div>
                        <div>
                            <label className="block text-green-40 font-inter font-medium mb-2">
                                Фотографии {!editingShelter && '*'}
                            </label>
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                className="w-full px-4 py-2 bg-green-98 border-2 border-green-40 rounded-custom-small"
                            />
                            {photos.length > 0 && (
                                <div className="grid grid-cols-4 gap-2 mt-2">
                                    {photos.map((photo, index) => (
                                        <div key={index} className="relative">
                                            <img
                                                src={URL.createObjectURL(photo)}
                                                alt={`Preview ${index + 1}`}
                                                className="w-full h-20 object-cover rounded-custom-small"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => removePhoto(index)}
                                                className="absolute top-0 right-0 w-6 h-6 bg-green-20 text-white rounded-full"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="flex gap-4">
                            <button
                                type="submit"
                                className="px-6 py-3 bg-green-30 text-green-100 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-20 transition-all"
                            >
                                {editingShelter ? 'Сохранить' : 'Создать'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setEditingShelter(null);
                                    resetForm();
                                }}
                                className="px-6 py-3 bg-green-80 text-green-30 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-70 transition-all"
                            >
                                Отмена
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {shelters.map((shelter) => (
                    <div key={shelter.id} className="bg-green-90 rounded-custom p-4 border-2 border-green-80">
                        <div className="mb-4">
                            {shelter.photoUrl || (shelter.photos && shelter.photos.length > 0) ? (
                                <img
                                    src={getPhotoUrl(shelter.photoUrl ? { url: shelter.photoUrl } : shelter.photos[0])}
                                    alt={shelter.name}
                                    className="w-full h-48 object-cover rounded-custom-small mb-2"
                                />
                            ) : (
                                <div className="w-full h-48 bg-green-80 rounded-custom-small mb-2 flex items-center justify-center">
                                    <span className="text-green-40">Нет фото</span>
                                </div>
                            )}
                            <h3 className="text-green-30 font-sf-rounded font-bold text-xl mb-2">{shelter.name}</h3>
                            <p className="text-green-20 font-inter text-sm mb-1">{shelter.address || 'Адрес не указан'}</p>
                            <p className="text-green-20 font-inter text-sm">{shelter.phone || 'Телефон не указан'}</p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(shelter)}
                                className="flex-1 px-4 py-2 bg-green-30 text-green-100 font-sf-rounded font-semibold text-sm rounded-custom-small hover:bg-green-20 transition-all"
                            >
                                Редактировать
                            </button>
                            <button
                                onClick={() => handleDelete(shelter.id)}
                                className="flex-1 px-4 py-2 bg-green-80 text-green-30 font-sf-rounded font-semibold text-sm rounded-custom-small hover:bg-green-70 transition-all"
                            >
                                Удалить
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            <ImageCropModal
                isOpen={cropModalOpen}
                onClose={handleCropCancel}
                imageSrc={imageToCrop}
                onCropComplete={handleCropComplete}
                aspectRatio={1}
            />
        </div>
    );
};

export default SheltersManagement;
