import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { applicationService } from '../services/applicationService';
import { cropImageToSquare } from '../utils/imageCrop';

const AnketaGive = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { shelterId, shelterName } = location.state || {};

    const [formData, setFormData] = useState({
        name: '',
        species: '',
        breed: '',
        character: '',
        gender: '',
        birth_date: '',
        
        vaccination_status: '',
        health_status: '',
        special_needs: '',
        
        history: '',
    });

    const [petPhotos, setPetPhotos] = useState([]);
    const [isFormValid, setIsFormValid] = useState(false);
    const [touchedFields, setTouchedFields] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const requiredFields = [
            'name',
            'species', 
            'gender'
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

    const handlePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length + petPhotos.length > 5) {
            alert('Можно загрузить не более 5 фотографий');
            return;
        }
        
        try {
            const croppedFiles = await Promise.all(files.map(file => cropImageToSquare(file)));
            
            const newPhotos = croppedFiles.map(file => ({
                file,
                preview: URL.createObjectURL(file),
                name: file.name
            }));
            
            setPetPhotos(prev => [...prev, ...newPhotos]);
        } catch (error) {
            console.error('Ошибка при обработке фотографий:', error);
            alert('Ошибка при обработке фотографий');
        }
    };

    const removePhoto = (index) => {
        setPetPhotos(prev => {
            const newPhotos = [...prev];
            URL.revokeObjectURL(newPhotos[index].preview);
            newPhotos.splice(index, 1);
            return newPhotos;
        });
    };

    const getFieldError = (fieldName) => {
        if (!touchedFields[fieldName]) return null;
        
        if (!formData[fieldName] || formData[fieldName].trim() === '') {
            return 'Это поле обязательно для заполнения';
        }
        
        return null;
    };

    const prepareFormDataForBackend = () => {
        const formDataToSend = new FormData();
        
        Object.keys(formData).forEach(key => {
            if (formData[key]) {
                formDataToSend.append(key, formData[key]);
            }
        });

        if (shelterId) {
            formDataToSend.append('shelter_id', shelterId);
        }
        
        if (!formData.description) {
            const description = `Питомец для отдачи: ${formData.name}. ${formData.history || ''} ${formData.special_needs || ''}`.trim();
            if (description) {
                formDataToSend.append('description', description.substring(0, 5000));
            }
        }

        petPhotos.forEach((photo, index) => {
            formDataToSend.append('photo', photo.file);
        });

        return formDataToSend;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isFormValid) {
            const requiredFields = ['name', 'species', 'gender'];
            const newTouchedFields = { ...touchedFields };
            requiredFields.forEach(field => {
                newTouchedFields[field] = true;
            });
            setTouchedFields(newTouchedFields);
            
            alert('Пожалуйста, заполните все обязательные поля и добавьте хотя бы одну фотографию');
            return;
        }

        setIsSubmitting(true);

        try {
            const formDataToSend = prepareFormDataForBackend();
            
            const response = await applicationService.createGiveApplication(formDataToSend);

            console.log('Заявка на отдачу успешно создана:', response.data);
            alert('Анкета успешно отправлена! Мы свяжемся с вами в ближайшее время.');
            navigate('/shelters');
            
        } catch (error) {
            console.error('Ошибка при отправке анкеты:', error);
            
            if (error.response?.status === 401) {
                alert('Необходима авторизация. Пожалуйста, войдите в систему.');
                navigate('/login');
            } else if (error.response?.data?.message) {
                alert(`Ошибка: ${error.response.data.message}`);
            } else {
                alert('Произошла ошибка при отправке анкеты. Пожалуйста, попробуйте еще раз.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-green-95 py-8 px-[20px] md:px-[40px] lg:px-[60px]">
            <div className="max-w-4xl mx-auto">
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
                    <div className="bg-green-95 rounded-custom p-6 animate-fade-up" style={{ animationDelay: '0.1s' }}>
                        <h2 className="font-sf-rounded font-bold text-green-30 text-2xl mb-6">
                            Основная информация
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="name" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Кличка животного *
                                </label>
                                <input
                                    type="text"
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className={`w-full px-4 py-3 bg-green-98 border-2 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:outline-none transition-colors ${
                                        getFieldError('name') 
                                            ? 'border-red-500 focus:border-red-500' 
                                            : 'border-green-40 focus:border-green-50'
                                    }`}
                                    placeholder="Введите кличку"
                                />
                                {getFieldError('name') && (
                                    <p className="text-red-500 text-xs mt-1">{getFieldError('name')}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="species" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Вид животного *
                                </label>
                                <select
                                    id="species"
                                    name="species"
                                    value={formData.species}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className={`w-full px-4 py-3 bg-green-98 border-2 rounded-custom-small text-green-40 font-sf-rounded focus:outline-none transition-colors ${
                                        getFieldError('species') 
                                            ? 'border-red-500 focus:border-red-500' 
                                            : 'border-green-40 focus:border-green-50'
                                    }`}
                                >
                                    <option value="">Выберите вид</option>
                                    <option value="cat">Кошка</option>
                                    <option value="dog">Собака</option>
                                    <option value="other">Другое</option>
                                </select>
                                {getFieldError('species') && (
                                    <p className="text-red-500 text-xs mt-1">{getFieldError('species')}</p>
                                )}
                            </div>

                            <div>
                                <label htmlFor="breed" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Порода
                                </label>
                                <input
                                    type="text"
                                    id="breed"
                                    name="breed"
                                    value={formData.breed}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-40 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                                    placeholder="Например: дворняжка"
                                />
                            </div>

                            <div>
                                <label htmlFor="birth_date" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Дата рождения 
                                </label>
                                <input
                                    type="date"
                                    id="birth_date"
                                    name="birth_date"
                                    value={formData.birth_date}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-40 font-sf-rounded focus:border-green-50 focus:outline-none transition-colors"
                                />
                            </div>

                            <div>
                                <label htmlFor="character" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Характер
                                </label>
                                <input
                                    type="text"
                                    id="character"
                                    name="character"
                                    value={formData.character}
                                    onChange={handleChange}
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-40 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                                    placeholder="Например: ласковый"
                                />
                            </div>

                            <div>
                                <label htmlFor="gender" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Пол *
                                </label>
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    onBlur={handleBlur}
                                    required
                                    className={`w-full px-4 py-3 bg-green-98 border-2 rounded-custom-small text-green-40 font-sf-rounded focus:outline-none transition-colors ${
                                        getFieldError('gender') 
                                            ? 'border-red-500 focus:border-red-500' 
                                            : 'border-green-40 focus:border-green-50'
                                    }`}
                                >
                                    <option value="">Выберите пол</option>
                                    <option value="male">Мужской</option>
                                    <option value="female">Женский</option>
                                </select>
                                {getFieldError('gender') && (
                                    <p className="text-red-500 text-xs mt-1">{getFieldError('gender')}</p>
                                )}
                            </div>
                        </div>

                        <div className="mt-8 pt-6 border-t border-green-80">
                            <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-4">
                                Фотографии животного *
                            </h3>
                            <p className="text-green-40 font-inter text-sm mb-4">
                                Можно загрузить до 5 фотографий. Обязательно добавьте хотя бы одну.
                            </p>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

                    <div className="bg-green-95 rounded-custom p-6 animate-fade-up" style={{ animationDelay: '0.2s' }}>
                        <h2 className="font-sf-rounded font-bold text-green-30 text-2xl mb-6">
                            Медицинские данные
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <label htmlFor="vaccination_status" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Статус вакцинации
                                </label>
                                <select
                                    id="vaccination_status"
                                    name="vaccination_status"
                                    value={formData.vaccination_status}
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
                                <label htmlFor="health_status" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Состояние здоровья
                                </label>
                                <textarea
                                    id="health_status"
                                    name="health_status"
                                    value={formData.health_status}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors resize-none"
                                    placeholder="Опишите общее состояние здоровья, хронические заболевания и т.д."
                                />
                            </div>

                            <div>
                                <label htmlFor="special_needs" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Особые потребности
                                </label>
                                <textarea
                                    id="special_needs"
                                    name="special_needs"
                                    value={formData.special_needs}
                                    onChange={handleChange}
                                    rows="2"
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors resize-none"
                                    placeholder="Особые условия содержания, диета, лекарства"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-green-95 rounded-custom p-6 animate-fade-up" style={{ animationDelay: '0.3s' }}>
                        <h2 className="font-sf-rounded font-bold text-green-30 text-2xl mb-6">
                            История животного
                        </h2>
                        
                        <div className="space-y-6">
                            <div>
                                <textarea
                                    id="history"
                                    name="history"
                                    value={formData.history}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors resize-none"
                                    placeholder="Откуда появилось животное, особые приметы, чем любит заниматься"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 justify-end pt-6 animate-fade-up" style={{ animationDelay: '0.5s' }}>
                        <button
                            type="button"
                            onClick={() => navigate(-1)}
                            disabled={isSubmitting}
                            className="px-8 py-4 bg-green-80 text-green-40 font-sf-rounded font-semibold text-base rounded-custom-small hover:bg-green-70 transition-colors disabled:opacity-50"
                        >
                            Назад
                        </button>
                        <button
                            type="submit"
                            disabled={!isFormValid || isSubmitting}
                            className={`px-8 py-4 font-sf-rounded font-semibold text-base rounded-custom-small transition-all duration-200 ${
                                isFormValid && !isSubmitting
                                    ? 'bg-green-50 text-green-100 hover:bg-green-60 active:bg-green-40 shadow-lg hover:shadow-xl cursor-pointer'
                                    : 'bg-green-80 text-green-60 cursor-not-allowed'
                            }`}
                        >
                            {isSubmitting ? 'Отправка...' : isFormValid ? 'Отправить анкету' : 'Заполните все обязательные поля'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AnketaGive;