import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { shelterService } from '../services/shelterService'
import { userService } from '../services/userService'
import { useAuth } from '../context/AuthContext'
import { isShelterAdminRole } from '../utils/roleUtils'
import ImageCropModal from '../components/ImageCropModal'

const ShelterRegister = () => {
    const navigate = useNavigate()
    const { user, refreshUser } = useAuth()
    
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
    })

    const [photos, setPhotos] = useState([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [cropModalOpen, setCropModalOpen] = useState(false)
    const [imageToCrop, setImageToCrop] = useState(null)
    const [pendingFiles, setPendingFiles] = useState([])

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
    ]

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }))
    }

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files)
        
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
    }

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
    }

    const handleCropCancel = () => {
        setPendingFiles([]);
        setCropModalOpen(false);
        setImageToCrop(null);
    }

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index))
    }

    const prepareFormData = () => {
        const formDataToSend = new FormData()
        
        if (formData.name && formData.name.trim()) {
            formDataToSend.append('name', formData.name.trim());
        }
        
        if (formData.address && formData.address.trim()) {
            formDataToSend.append('address', formData.address.trim());
        }
        
        if (formData.phone && formData.phone.trim()) {
            formDataToSend.append('phone', formData.phone.trim());
        }
        
        if (formData.email && formData.email.trim()) {
            formDataToSend.append('email', formData.email.trim());
        }
        
        if (formData.website && formData.website.trim()) {
            formDataToSend.append('website', formData.website.trim());
        }
        
        if (formData.description && formData.description.trim()) {
            formDataToSend.append('description', formData.description.trim());
        }
        
        if (formData.working_hours && formData.working_hours.trim()) {
            formDataToSend.append('working_hours', formData.working_hours.trim());
        }
        
        if (formData.region && formData.region.trim()) {
            formDataToSend.append('region', formData.region.trim());
        }
        
        if (formData.capacity && formData.capacity !== '') {
            const capacityNum = parseInt(formData.capacity, 10);
            if (!isNaN(capacityNum) && capacityNum >= 0) {
                formDataToSend.append('capacity', capacityNum.toString());
            }
        }
        
        if (formData.can_adopt !== undefined && formData.can_adopt !== null) {
            formDataToSend.append('can_adopt', formData.can_adopt ? 'true' : 'false');
        }

        formDataToSend.append('status', 'active');
        photos.forEach((photo) => {
            formDataToSend.append('photos', photo);
        })

        return formDataToSend
    }

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!isShelterAdminRole(user?.role) && user?.role !== 'admin') {
            alert('Регистрация приюта доступна только администраторам приютов');
            navigate('/profile');
            return;
        }
        
        if (!formData.name.trim()) {
            alert('Пожалуйста, введите название приюта');
            return;
        }

        if (!formData.address.trim()) {
            alert('Пожалуйста, введите адрес приюта');
            return;
        }

        if (photos.length === 0) {
            alert('Пожалуйста, добавьте хотя бы одну фотографию приюта');
            return;
        }

        setIsSubmitting(true)

        try {
            console.log('Регистрируем приют...');
            
            const formDataToSend = prepareFormData();
            const shelterResponse = await shelterService.createShelter(formDataToSend);
            console.log('Приют создан:', shelterResponse);
            
            if (refreshUser) {
                await refreshUser();
                console.log('Данные пользователя обновлены');
            }
            
            alert('Приют успешно зарегистрирован! Теперь вы можете добавлять питомцев.');
            navigate('/admin-profile');
            
        } catch (error) {
            console.error('Ошибка при регистрации приюта:', error);
            
            if (error.response?.data?.error === 'Shelter admin can have only one shelter' || 
                error.response?.data?.message === 'Shelter admin can have only one shelter') {
                alert('У вас уже зарегистрирован приют. Вы будете перенаправлены в профиль.');
                navigate('/admin-profile');
                return;
            }
            
            if (error.response?.data?.error) {
                alert(`Ошибка: ${error.response.data.error}`);
            } else if (error.response?.data?.message) {
                alert(`Ошибка: ${error.response.data.message}`);
            } else {
                alert('Произошла ошибка при регистрации приюта. Пожалуйста, попробуйте еще раз.');
            }
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <>
        <div className="min-h-screen bg-green-95 flex items-center justify-center px-4 py-10">
            <div className="w-full max-w-6xl bg-green-95 rounded-custom p-8">
                <div className="flex flex-col lg:flex-row gap-8">
                    <div className="lg:w-2/3">
                        <h1 className="text-green-30 font-sf-rounded font-bold text-3xl md:text-4xl lg:text-5xl mb-2">
                            Регистрация приюта
                        </h1>
                        <p className="text-green-40 font-inter font-medium text-base md:text-lg mb-8">
                            Заполните информацию о вашем приюте
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                        Название приюта *
                                    </label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                                        placeholder="Введите название приюта"
                                    />
                                </div>

                                <div>
                                    <label className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                        Адрес приюта *
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        required
                                        className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                                        placeholder="Введите адрес приюта"
                                    />
                                </div>

                                <div>
                                    <label className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                        Телефон
                                    </label>
                                    <input
                                        type="tel"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                                        placeholder="Введите контактный телефон"
                                    />
                                </div>

                                <div>
                                    <label className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                                        placeholder="Введите email"
                                    />
                                </div>

                                <div>
                                    <label className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                        Сайт приюта
                                    </label>
                                    <input
                                        type="url"
                                        name="website"
                                        value={formData.website}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                                        placeholder="https://example.com"
                                    />
                                </div>

                                <div>
                                    <label className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                        Вместимость
                                    </label>
                                    <input
                                        type="number"
                                        name="capacity"
                                        value={formData.capacity}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                                        placeholder="Количество животных"
                                    />
                                </div>

                                <div>
                                    <label className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                        Режим работы
                                    </label>
                                    <input
                                        type="text"
                                        name="working_hours"
                                        value={formData.working_hours}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                                        placeholder="Например: 9:00-18:00"
                                    />
                                </div>
                                
                                <div>
                                    <label className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                        Регион
                                    </label>
                                    <select
                                        name="region"
                                        value={formData.region}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded focus:border-green-50 focus:outline-none transition-colors"
                                    >
                                        {regions.map(region => (
                                            <option key={region.value} value={region.value}>
                                                {region.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                    Описание
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows="3"
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors resize-none"
                                    placeholder="Опишите ваш приют"
                                />
                            </div>

                            <div>
                                <label className="flex items-center space-x-3">
                                    <input
                                        type="checkbox"
                                        name="can_adopt"
                                        checked={formData.can_adopt}
                                        onChange={handleChange}
                                        className="w-4 h-4 text-green-50 bg-green-98 border-2 border-green-40 rounded focus:ring-green-50 focus:ring-2"
                                    />
                                    <span className="text-green-40 font-inter font-medium text-sm md:text-base">
                                        Возможность отдать животное в этот приют
                                    </span>
                                </label>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="w-full px-6 py-4 bg-green-60 text-green-100 font-sf-rounded font-semibold text-base md:text-lg rounded-custom-small hover:bg-green-70 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSubmitting ? 'Регистрация...' : 'Зарегистрировать приют'}
                            </button>
                        </form>
                    </div>

                    <div className="lg:w-1/3">
                        <div className="bg-green-95 rounded-custom p-6 h-full">
                            <h3 className="text-green-30 font-sf-rounded font-bold text-xl mb-4">
                                Фотографии приюта
                            </h3>
                            <p className="text-green-40 font-inter text-sm mb-6">
                                Добавьте фотографии вашего приюта (минимум 1 фото)
                            </p>

                            <div className="space-y-4">
                                <label className="block w-full px-4 py-6 bg-green-98 border-2 border-dashed border-green-40 rounded-custom-small text-center cursor-pointer hover:border-green-50 transition-colors">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                        className="hidden"
                                    />
                                    <div className="flex flex-col items-center justify-center">
                                        <svg className="w-8 h-8 text-green-40 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                        </svg>
                                        <span className="text-green-40 font-inter text-sm">
                                            Нажмите для загрузки фото
                                        </span>
                                        <span className="text-green-40 font-inter text-xs mt-1">
                                            или перетащите файлы сюда
                                        </span>
                                    </div>
                                </label>

                                {photos.length > 0 && (
                                    <div className="space-y-3">
                                        <h4 className="text-green-30 font-inter font-medium text-sm">
                                            Загруженные фото ({photos.length})
                                        </h4>
                                        <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                                            {photos.map((photo, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={URL.createObjectURL(photo)}
                                                        alt={`Фото приюта ${index + 1}`}
                                                        className="w-full h-20 object-cover rounded-custom-small"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removePhoto(index)}
                                                        className="absolute -top-2 -right-2 w-6 h-6 bg-green-20 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        ×
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {photos.length === 0 && (
                                    <p className="text-green-30 font-inter text-xs text-center">
                                        * Необходимо загрузить минимум 1 фотографию
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <ImageCropModal
            isOpen={cropModalOpen}
            onClose={handleCropCancel}
            imageSrc={imageToCrop}
            onCropComplete={handleCropComplete}
            aspectRatio={1}
        />
        </>
    )
}

export default ShelterRegister;
