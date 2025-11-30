import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { animalService } from '../services/animalService';
import { shelterService } from '../services/shelterService';
import { useAuth } from '../context/AuthContext';

const AddPetToShelter = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const [shelterInfo, setShelterInfo] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        type: '',
        breed: '',
        gender: '',
        age: '',
        color: '',
        animal_size: '',
        health: 'healthy',
        personality: '',
        description: '',
    });

    const [petPhotos, setPetPhotos] = useState([]);

    useEffect(() => {
        loadShelterInfo();
    }, [user]);

    const loadShelterInfo = async () => {
        try {
            if (user?.id) {
                const shelter = await shelterService.getShelterByAdminId(user.id);
                if (shelter) {
                    setShelterInfo(shelter);
                } else {
                    navigate('/профиль');
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки приюта:', error);
            navigate('/профиль');
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
        if (files.length + petPhotos.length > 5) {
            alert('Можно загрузить не более 5 фотографий');
            return;
        }
        
        const newPhotos = files.map(file => ({
            file,
            preview: URL.createObjectURL(file)
        }));
        
        setPetPhotos(prev => [...prev, ...newPhotos]);
    };

    const removePhoto = (index) => {
        setPetPhotos(prev => {
            const newPhotos = [...prev];
            URL.revokeObjectURL(newPhotos[index].preview);
            newPhotos.splice(index, 1);
            return newPhotos;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!shelterInfo) {
            alert('Ошибка: приют не найден');
            return;
        }

        if (petPhotos.length === 0) {
            alert('Пожалуйста, добавьте хотя бы одну фотографию питомца');
            return;
        }

        setIsSubmitting(true);

        try {
            const formDataToSend = new FormData();
            
            // Добавляем данные питомца
            Object.keys(formData).forEach(key => {
                if (formData[key] !== '' && formData[key] !== null && formData[key] !== undefined) {
                    formDataToSend.append(key, formData[key]);
                }
            });

            // Добавляем ID приюта
            formDataToSend.append('shelter_id', shelterInfo.id);

            // Добавляем фотографии
            petPhotos.forEach(photo => {
                formDataToSend.append('photos', photo.file);
            });

            await animalService.createAnimal(formDataToSend);

            alert('Питомец успешно добавлен в приют!');
            navigate('/профиль');
            
        } catch (error) {
            console.error('Ошибка при добавлении питомца:', error);
            alert('Произошла ошибка при добавлении питомца. Пожалуйста, попробуйте еще раз.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-green-95 flex items-center justify-center">
                <div className="text-lg text-green-30">Загрузка...</div>
            </div>
        );
    }

    if (!shelterInfo) {
        return (
            <div className="min-h-screen bg-green-95 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-green-20 mb-4">Приют не найден</p>
                    <button
                        onClick={() => navigate('/профиль')}
                        className="px-6 py-2 bg-green-50 text-green-100 rounded-custom-small hover:bg-green-60"
                    >
                        Вернуться в профиль
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-green-95 py-8 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-8">
                    <h1 className="font-sf-rounded font-bold text-green-30 text-3xl mb-2">
                        Добавление питомца в приют
                    </h1>
                    <p className="font-inter text-green-40 text-lg">
                        Приют: {shelterInfo.name}
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="bg-green-95 rounded-custom p-6">
                        <h2 className="font-sf-rounded font-bold text-green-30 text-2xl mb-6">
                            Основная информация
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-green-40 font-inter font-medium text-sm mb-2">
                                    Кличка животного *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 placeholder-green-40 focus:border-green-50 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-green-40 font-inter font-medium text-sm mb-2">
                                    Вид животного *
                                </label>
                                <select
                                    name="type"
                                    value={formData.type}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-40 focus:border-green-50 focus:outline-none"
                                >
                                    <option value="">Выберите вид</option>
                                    <option value="cat">Кошка</option>
                                    <option value="dog">Собака</option>
                                    <option value="bird">Птица</option>
                                    <option value="rodent">Грызун</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-green-40 font-inter font-medium text-sm mb-2">
                                    Порода
                                </label>
                                <input
                                    type="text"
                                    name="breed"
                                    value={formData.breed}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-40 placeholder-green-40 focus:border-green-50 focus:outline-none"
                                />
                            </div>

                            <div>
                                <label className="block text-green-40 font-inter font-medium text-sm mb-2">
                                    Пол *
                                </label>
                                <select
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-40 focus:border-green-50 focus:outline-none"
                                >
                                    <option value="">Выберите пол</option>
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-green-40 font-inter font-medium text-sm mb-2">
                                    Возраст (лет) *
                                </label>
                                <input
                                    type="number"
                                    name="age"
                                    value={formData.age}
                                    onChange={handleChange}
                                    min="0"
                                    max="30"
                                    required
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-40 placeholder-green-40 focus:border-green-50 focus:outline-none"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-95 rounded-custom p-6">
                        <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-4">
                            Фотографии животного *
                        </h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block w-full h-48 border-2 border-dashed border-green-40 rounded-custom-small flex flex-col items-center justify-center cursor-pointer hover:border-green-50">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                    />
                                    <div className="text-center">
                                        <div className="w-12 h-12 bg-green-80 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <svg className="w-6 h-6 text-green-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                            </svg>
                                        </div>
                                        <p className="text-green-40 font-inter font-medium text-sm">
                                            Нажмите для загрузки
                                        </p>
                                    </div>
                                </label>
                            </div>

                            <div>
                                {petPhotos.length > 0 ? (
                                    <div className="space-y-3">
                                        <p className="text-green-40 font-inter text-sm">
                                            Загружено фотографий: {petPhotos.length}/5
                                        </p>
                                        <div className="grid grid-cols-2 gap-3">
                                            {petPhotos.map((photo, index) => (
                                                <div key={index} className="relative">
                                                    <img
                                                        src={photo.preview}
                                                        alt={`Preview ${index + 1}`}
                                                        className="w-full h-20 object-cover rounded-custom-small border-2 border-green-40"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(index)}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="h-48 flex items-center justify-center border-2 border-dashed rounded-custom-small bg-green-98 border-green-40">
                                        <p className="text-green-40 font-inter text-sm text-center">
                                            Фотографии не загружены
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 justify-end">
                        <button
                            type="button"
                            onClick={() => navigate('/профиль')}
                            className="px-6 py-3 bg-green-80 text-green-40 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-70"
                        >
                            Назад
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-green-50 text-green-100 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-60 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Добавление...' : 'Добавить питомца'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddPetToShelter;