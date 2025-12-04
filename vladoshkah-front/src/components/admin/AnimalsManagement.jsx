import React, { useState, useEffect } from 'react';
import { animalService } from '../../services/animalService';
import { shelterService } from '../../services/shelterService';
import { getPhotoUrl } from '../../utils/photoHelpers';
import { useNavigate } from 'react-router-dom';
import ImageCropModal from '../ImageCropModal';

const AnimalsManagement = () => {
    const navigate = useNavigate();
    const [animals, setAnimals] = useState([]);
    const [shelters, setShelters] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingAnimal, setEditingAnimal] = useState(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        type: '',
        breed: '',
        gender: '',
        age: '',
        weight: '',
        color: '',
        animal_size: '',
        health: '',
        personality: '',
        history: '',
        shelter_id: ''
    });
    const [photos, setPhotos] = useState([]);
    const [cropModalOpen, setCropModalOpen] = useState(false);
    const [imageToCrop, setImageToCrop] = useState(null);
    const [pendingFiles, setPendingFiles] = useState([]);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [animalsData, sheltersData] = await Promise.all([
                animalService.getAllAnimals(),
                shelterService.getAllShelters()
            ]);
            setAnimals(animalsData);
            setShelters(sheltersData);
        } catch (error) {
            console.error('Ошибка загрузки данных:', error);
            alert('Не удалось загрузить данные');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + photos.length > 5) {
            alert('Можно загрузить не более 5 фотографий');
            return;
        }
        
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
                if (key === 'age' || key === 'shelter_id') {
                    formDataToSend.append(key, parseInt(formData[key]));
                } else if (key === 'weight') {
                    formDataToSend.append(key, parseFloat(formData[key]));
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
        if (!formData.name.trim() || !formData.shelter_id) {
            alert('Заполните обязательные поля: название и приют');
            return;
        }
        if (photos.length === 0) {
            alert('Добавьте хотя бы одну фотографию');
            return;
        }

        try {
            const formDataToSend = prepareFormData();
            await animalService.createAnimal(formDataToSend);
            alert('Животное успешно создано');
            setShowCreateForm(false);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Ошибка создания животного:', error);
            alert(error.response?.data?.error || 'Не удалось создать животное');
        }
    };

    const handleEdit = (animal) => {
        setEditingAnimal(animal);
        setFormData({
            name: animal.name || '',
            type: animal.type || '',
            breed: animal.breed || '',
            gender: animal.gender || '',
            age: animal.age || '',
            weight: animal.weight || '',
            color: animal.color || '',
            animal_size: animal.animal_size || '',
            health: animal.health || '',
            personality: animal.personality || '',
            history: animal.history || '',
            shelter_id: animal.shelter_id || ''
        });
        setPhotos([]);
        setCropModalOpen(false);
        setImageToCrop(null);
        setPendingFiles([]);
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        if (!editingAnimal) return;

        try {
            // Собираем только непустые поля
            const jsonPayload = {};
            Object.keys(formData).forEach(key => {
                const value = formData[key];
                if (value !== '' && value !== null && value !== undefined) {
                    if (key === 'age' || key === 'shelter_id') {
                        jsonPayload[key] = parseInt(value);
                    } else if (key === 'weight') {
                        jsonPayload[key] = parseFloat(value);
                    } else {
                        jsonPayload[key] = value;
                    }
                }
            });

            // Если есть новые фото, отправляем FormData (можно только с фото, без других полей)
            if (photos.length > 0) {
                const formDataToSend = new FormData();
                // Добавляем только измененные поля в FormData (если они есть)
                Object.entries(jsonPayload).forEach(([key, value]) => {
                    if (value !== null && value !== undefined) {
                        formDataToSend.append(key, value);
                    }
                });
                // Добавляем фото
                photos.forEach(photo => formDataToSend.append('photos', photo));
                await animalService.updateAnimal(editingAnimal.id, formDataToSend);
            } else {
                // Если нет фото, но есть поля для обновления
                if (Object.keys(jsonPayload).length > 0) {
                    await animalService.updateAnimal(editingAnimal.id, jsonPayload);
                } else {
                    alert('Нет изменений для сохранения');
                    return;
                }
            }

            alert('Животное успешно обновлено');
            setEditingAnimal(null);
            resetForm();
            loadData();
        } catch (error) {
            console.error('Ошибка обновления животного:', error);
            alert(error.response?.data?.error || 'Не удалось обновить животное');
        }
    };

    const handleDelete = async (animalId) => {
        if (!window.confirm('Вы уверены, что хотите удалить это животное? Это действие нельзя отменить.')) {
            return;
        }

        try {
            await animalService.deleteAnimal(animalId);
            alert('Животное успешно удалено');
            loadData();
        } catch (error) {
            console.error('Ошибка удаления животного:', error);
            alert(error.response?.data?.error || 'Не удалось удалить животное');
        }
    };

    const resetForm = () => {
        setFormData({
            name: '',
            type: '',
            breed: '',
            gender: '',
            age: '',
            weight: '',
            color: '',
            animal_size: '',
            health: '',
            personality: '',
            history: '',
            shelter_id: ''
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
                <div className="text-green-30">Загрузка животных...</div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-green-30 font-sf-rounded font-bold text-2xl">Управление животными</h2>
                <button
                    onClick={() => setShowCreateForm(!showCreateForm)}
                    className="px-6 py-3 bg-green-30 text-green-100 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-20 transition-all"
                >
                    {showCreateForm ? 'Отмена' : '+ Создать животное'}
                </button>
            </div>

            {(showCreateForm || editingAnimal) && (
                <div className="bg-green-90 rounded-custom p-6 mb-6 border-2 border-green-80">
                    <h3 className="text-green-30 font-sf-rounded font-bold text-xl mb-4">
                        {editingAnimal ? 'Редактировать животное' : 'Создать животное'}
                    </h3>
                    <form onSubmit={editingAnimal ? handleUpdate : handleCreate} className="space-y-4">
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
                                <label className="block text-green-40 font-inter font-medium mb-2">Приют *</label>
                                <select
                                    name="shelter_id"
                                    value={formData.shelter_id}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                >
                                    <option value="">Выберите приют</option>
                                    {shelters.map(shelter => (
                                        <option key={shelter.id} value={shelter.id}>{shelter.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Тип</label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                >
                                    <option value="">Выберите тип</option>
                                    <option value="dog">Собака</option>
                                    <option value="cat">Кошка</option>
                                    <option value="bird">Птица</option>
                                    <option value="rodent">Грызун</option>
                                    <option value="fish">Рыба</option>
                                    <option value="reptile">Рептилия</option>
                                    <option value="other">Другое</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Порода</label>
                                <input
                                    type="text"
                                    name="breed"
                                    value={formData.breed}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Пол</label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                >
                                    <option value="">Выберите пол</option>
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Возраст</label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Вес (кг)</label>
                                <input
                                    type="number"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    step="0.1"
                                    min="0"
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Цвет</label>
                                <input
                                    type="text"
                                    name="color"
                                    value={formData.color}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                />
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Размер</label>
                                <select
                                    name="animal_size"
                                    value={formData.animal_size}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                >
                                    <option value="">Выберите размер</option>
                                    <option value="small">Маленький</option>
                                    <option value="medium">Средний</option>
                                    <option value="large">Большой</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-green-40 font-inter font-medium mb-2">Здоровье</label>
                                <select
                                    name="health"
                                    value={formData.health}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 bg-green-95 border-2 border-green-30 rounded-custom-small text-green-20"
                                >
                                    <option value="">Выберите статус</option>
                                    <option value="healthy">Здоров</option>
                                    <option value="needs_treatment">Требует лечения</option>
                                    <option value="special_needs">Особые потребности</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-green-40 font-inter font-medium mb-2">Характер</label>
                            <textarea
                                name="personality"
                                value={formData.personality}
                                onChange={handleChange}
                                rows="2"
                                className="w-full px-4 py-2 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20"
                            />
                        </div>
                        <div>
                            <label className="block text-green-40 font-inter font-medium mb-2">История</label>
                            <textarea
                                name="history"
                                value={formData.history}
                                onChange={handleChange}
                                rows="2"
                                className="w-full px-4 py-2 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20"
                            />
                        </div>
                        <div>
                            <label className="block text-green-40 font-inter font-medium mb-2">
                                Фотографии {!editingAnimal && '*'}
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
                                {editingAnimal ? 'Сохранить' : 'Создать'}
                            </button>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowCreateForm(false);
                                    setEditingAnimal(null);
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
                {animals.map((animal) => (
                    <div key={animal.id} className="bg-green-90 rounded-custom p-4 border-2 border-green-80">
                        <div className="mb-4">
                            {animal.photoUrl || (animal.photos && animal.photos.length > 0) ? (
                                <img
                                    src={getPhotoUrl(animal.photoUrl ? { url: animal.photoUrl } : animal.photos[0])}
                                    alt={animal.name}
                                    className="w-full h-48 object-cover rounded-custom-small mb-2 cursor-pointer"
                                    onClick={() => navigate(`/pet/${animal.id}`)}
                                />
                            ) : (
                                <div className="w-full h-48 bg-green-80 rounded-custom-small mb-2 flex items-center justify-center">
                                    <span className="text-green-40">Нет фото</span>
                                </div>
                            )}
                            <h3 className="text-green-30 font-sf-rounded font-bold text-xl mb-2">{animal.name}</h3>
                            <p className="text-green-20 font-inter text-sm mb-1">
                                {animal.type === 'dog' ? 'Собака' : animal.type === 'cat' ? 'Кошка' : animal.type}
                            </p>
                            <p className="text-green-20 font-inter text-sm">
                                Приют: {shelters.find(s => s.id === animal.shelter_id)?.name || 'Не указан'}
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => handleEdit(animal)}
                                className="flex-1 px-4 py-2 bg-green-30 text-green-100 font-sf-rounded font-semibold text-sm rounded-custom-small hover:bg-green-20 transition-all"
                            >
                                Редактировать
                            </button>
                            <button
                                onClick={() => handleDelete(animal.id)}
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

export default AnimalsManagement;
