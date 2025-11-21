import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const AnketaGive = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { shelterId, shelterName } = location.state || {};

    const [formData, setFormData] = useState({
        // Основная информация
        petName: '',
        petSpecies: '',
        petBreed: '',
        petCharacter: '',
        petGender: '',
        petDate: '',
        
        // Медицинские данные
        vaccinationStatus: '',
        healthStatus: '',
        specialNeeds: '',
        
        // Характер и история
        petHistory: '',
        
        
    });

    const [petPhotos, setPetPhotos] = useState([]);
    const [isFormValid, setIsFormValid] = useState(false);
    const [touchedFields, setTouchedFields] = useState({});

    // Валидация формы
    useEffect(() => {
        const requiredFields = [
            'petName',
            'petSpecies', 
            'petGender'
        ];

        const isAllRequiredFieldsFilled = requiredFields.every(field => 
            formData[field] && formData[field].trim() !== ''
        );

        const hasAtLeastOnePhoto = petPhotos.length > 0;

        setIsFormValid(isAllRequiredFieldsFilled && hasAtLeastOnePhoto);
    }, [formData, petPhotos]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Отмечаем поле как "тронутое" для показа ошибок
        setTouchedFields(prev => ({
            ...prev,
            [name]: true
        }));
    };

    const handleBlur = (e) => {
        const { name } = e.target;
        setTouchedFields(prev => ({
            ...prev,
            [name]: true
        }));
    };

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files);
        if (files.length + petPhotos.length > 5) {
            alert('Можно загрузить не более 5 фотографий');
            return;
        }
        
        const newPhotos = files.map(file => ({
            file,
            preview: URL.createObjectURL(file),
            name: file.name
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

    const isFieldValid = (fieldName) => {
        const requiredFields = ['petName', 'petSpecies', 'petGender'];
        if (requiredFields.includes(fieldName)) {
            return formData[fieldName] && formData[fieldName].trim() !== '';
        }
        return true;
    };

    const getFieldError = (fieldName) => {
        if (!touchedFields[fieldName]) return null;
        
        if (!formData[fieldName] || formData[fieldName].trim() === '') {
            return 'Это поле обязательно для заполнения';
        }
        
        return null;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        if (!isFormValid) {
            // Помечаем все обязательные поля как "тронутые" для показа ошибок
            const requiredFields = ['petName', 'petSpecies', 'petGender', 'ownerName', 'ownerPhone'];
            const newTouchedFields = { ...touchedFields };
            requiredFields.forEach(field => {
                newTouchedFields[field] = true;
            });
            setTouchedFields(newTouchedFields);
            
            alert('Пожалуйста, заполните все обязательные поля и добавьте хотя бы одну фотографию');
            return;
        }

        // Здесь будет логика отправки данных
        console.log('Данные анкеты:', formData);
        console.log('Фотографии:', petPhotos);
        alert('Анкета успешно отправлена!');
        navigate('/приюты');
    };

    return (
        <div className="min-h-screen bg-green-95 py-8 px-[20px] md:px-[40px] lg:px-[60px]">
            <div className="max-w-4xl mx-auto">
                {/* Заголовок */}
                <div className="text-center mb-8">
                    <h1 className="font-sf-rounded font-bold text-green-30 text-3xl md:text-4xl lg:text-5xl mb-2">
                        Анкета животного
                    </h1>
                    {shelterName && (
                        <p className="font-inter text-green-40 text-lg">
                            Приют: {shelterName}
                        </p>
                    )}
                    <p className="text-green-40 font-inter text-sm mt-2">
                        * - обязательные поля для заполнения
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Основная информация о животном */}
                    <div className="bg-green-95 rounded-custom p-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                        <h2 className="font-sf-rounded font-bold text-green-30 text-2xl mb-6">
                            Основная информация
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="petName" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Кличка животного *
                                </label>
                                <input
                                    type="text"
                                    id="petName"
                                    name="petName"
                                    value={formData.petName}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className={`w-full px-4 py-3 bg-green-98 border-2 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:outline-none transition-colors ${
                                        getFieldError('petName') 
                                            ? 'border-red-500 focus:border-red-500' 
                                            : 'border-green-40 focus:border-green-50'
                                    }`}
                                    placeholder="Введите кличку"
                                />
                                {getFieldError('petName') && (
                                    <p className="text-red-500 text-xs mt-1">{getFieldError('petName')}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="petSpecies" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Вид животного *
                                </label>
                                <select
                                    id="petSpecies"
                                    name="petSpecies"
                                    value={formData.petSpecies}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className={`w-full px-4 py-3 bg-green-98 border-2 rounded-custom-small text-green-40 font-sf-rounded focus:outline-none transition-colors ${
                                        getFieldError('petSpecies') 
                                            ? 'border-red-500 focus:border-red-500' 
                                            : 'border-green-40 focus:border-green-50'
                                    }`}
                                >
                                    <option value="">Выберите вид</option>
                                    <option value="cat">Кошка</option>
                                    <option value="dog">Собака</option>
                                    <option value="other">Другое</option>
                                </select>
                                {getFieldError('petSpecies') && (
                                    <p className="text-red-500 text-xs mt-1">{getFieldError('petSpecies')}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="petBreed" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Порода
                                </label>
                                <input
                                    type="text"
                                    id="petBreed"
                                    name="petBreed"
                                    value={formData.petBreed}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-40 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                                    placeholder="Например: дворняжка"
                                />
                            </div>

                            <div>
                                <label htmlFor="petDate" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Дата рождения 
                                </label>
                                <input
                                    type="date"
                                    id="petDate"
                                    name="petDate"
                                    value={formData.petDate}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-40 font-sf-rounded focus:border-green-50 focus:outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label htmlFor="petCharacter" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Характер
                                </label>
                                <input
                                    type="text"
                                    id="petCharacter"
                                    name="petCharacter"
                                    value={formData.petCharacter}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-40 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                                    placeholder="Например: ласковый"
                                />
                            </div>

                            <div>
                                <label htmlFor="petGender" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Пол *
                                </label>
                                <select
                                    id="petGender"
                                    name="petGender"
                                    value={formData.petGender}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className={`w-full px-4 py-3 bg-green-98 border-2 rounded-custom-small text-green-40 font-sf-rounded focus:outline-none transition-colors ${
                                        getFieldError('petGender') 
                                            ? 'border-red-500 focus:border-red-500' 
                                            : 'border-green-40 focus:border-green-50'
                                    }`}
                                >
                                    <option value="">Выберите пол</option>
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                </select>
                                {getFieldError('petGender') && (
                                    <p className="text-red-500 text-xs mt-1">{getFieldError('petGender')}</p>
                                )}
                            </div>
                        </div>

                        {/* Секция для загрузки фотографий */}
                        <div className="mt-8 pt-6 border-t border-green-80">
                            <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-4">
                                Фотографии животного *
                            </h3>
                            <p className="text-green-40 font-inter text-sm mb-4">
                                Можно загрузить до 5 фотографий. Обязательно добавьте хотя бы одну.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Область загрузки */}
                                <div className="flex flex-col items-center justify-center">
                                    <label 
                                        htmlFor="petPhotos"
                                        className="w-full h-48 border-2 border-dashed border-green-40 rounded-custom-small flex flex-col items-center justify-center cursor-pointer hover:border-green-50 hover:bg-green-98 transition-colors"
                                    >
                                        <div className="text-center">
                                            <div className="w-12 h-12 bg-green-80 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <svg className="w-6 h-6 text-green-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                                </svg>
                                            </div>
                                            <p className="text-green-40 font-inter font-medium text-sm">
                                                Нажмите для загрузки
                                            </p>
                                            <p className="text-green-40 font-inter text-xs mt-1">
                                                или перетащите файлы сюда
                                            </p>
                                        </div>
                                        <input
                                            type="file"
                                            id="petPhotos"
                                            name="petPhotos"
                                            multiple
                                            accept="image/*"
                                            onChange={handlePhotoUpload}
                                            className="hidden"
                                        />
                                    </label>
                                    <p className="text-green-40 font-inter text-xs mt-2 text-center">
                                        JPG, PNG, до 5MB каждая
                                    </p>
                                </div>

                                {/* Предпросмотр загруженных фото */}
                                <div>
                                    {petPhotos.length > 0 ? (
                                        <div className="space-y-3">
                                            <p className="text-green-40 font-inter text-sm">
                                                Загружено фотографий: {petPhotos.length}/5
                                            </p>
                                            <div className="grid grid-cols-2 gap-3 max-h-48 overflow-y-auto">
                                                {petPhotos.map((photo, index) => (
                                                    <div key={index} className="relative group">
                                                        <img
                                                            src={photo.preview}
                                                            alt={`Preview ${index + 1}`}
                                                            className="w-full h-20 object-cover rounded-custom-small border-2 border-green-40"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => removePhoto(index)}
                                                            className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                        >
                                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                            </svg>
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className={`h-48 flex items-center justify-center border-2 border-dashed rounded-custom-small bg-green-98 ${
                                            touchedFields.petPhotos && petPhotos.length === 0 
                                                ? 'border-red-500' 
                                                : 'border-green-40'
                                        }`}>
                                            <p className={`text-center ${
                                                touchedFields.petPhotos && petPhotos.length === 0 
                                                    ? 'text-red-500' 
                                                    : 'text-green-40'
                                            } font-inter text-sm`}>
                                                Фотографии не загружены<br/>
                                                <span className="text-xs">Добавьте хотя бы одну фотографию</span>
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Медицинские данные */}
                    <div className="bg-green-95 rounded-custom p-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                        <h2 className="font-sf-rounded font-bold text-green-30 text-2xl mb-6">
                            Медицинские данные
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="vaccinationStatus" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Статус вакцинации
                                </label>
                                <select
                                    id="vaccinationStatus"
                                    name="vaccinationStatus"
                                    value={formData.vaccinationStatus}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-40 font-sf-rounded focus:border-green-50 focus:outline-none transition-colors"
                                >
                                    <option value="">Выберите статус</option>
                                    <option value="full">Полная вакцинация</option>
                                    <option value="partial">Частичная вакцинация</option>
                                    <option value="none">Не вакцинирован</option>
                                    <option value="unknown">Неизвестно</option>
                                </select>
                            </div>

                            <div>
                                <label htmlFor="healthStatus" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Состояние здоровья
                                </label>
                                <textarea
                                    id="healthStatus"
                                    name="healthStatus"
                                    value={formData.healthStatus}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors resize-none"
                                    placeholder="Опишите общее состояние здоровья, хронические заболевания и т.д."
                                />
                            </div>

                            <div>
                                <label htmlFor="specialNeeds" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Особые потребности
                                </label>
                                <textarea
                                    id="specialNeeds"
                                    name="specialNeeds"
                                    value={formData.specialNeeds}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors resize-none"
                                    placeholder="Особые условия содержания, диета, лекарства"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Характер и история */}
                    <div className="bg-green-95 rounded-custom p-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                        <h2 className="font-sf-rounded font-bold text-green-30 text-2xl mb-6">
                            Характер и история
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="petHistory" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    История животного
                                </label>
                                <textarea
                                    id="petHistory"
                                    name="petHistory"
                                    value={formData.petHistory}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors resize-none"
                                    placeholder="Откуда появилось животное, особые приметы, чем любит заниматься"
                                />
                            </div>
                        </div>
                    </div>

                    

                    {/* Кнопки действий */}
                    <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 animate-fade-up" style={{ animationDelay: '0.5s' }}>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            className="px-8 py-4 bg-green-80 text-green-40 font-sf-rounded font-semibold text-base rounded-custom-small hover:bg-green-70 transition-colors"
                        >
                            Назад
                        </button>
                        <button
                            type="submit"
                            disabled={!isFormValid}
                            className={`px-8 py-4 font-sf-rounded font-semibold text-base rounded-custom-small transition-all duration-200 ${
                                isFormValid
                                    ? 'bg-green-50 text-green-100 hover:bg-green-60 active:bg-green-40 shadow-lg hover:shadow-xl cursor-pointer'
                                    : 'bg-green-80 text-green-60 cursor-not-allowed'
                            }`}
                        >
                            {isFormValid ? 'Отправить анкету' : 'Заполните все обязательные поля'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AnketaGive;