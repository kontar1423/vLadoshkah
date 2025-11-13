import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const ShelterRegister = () => {
    const navigate = useNavigate()
    
    const [formData, setFormData] = useState({
        organization: '',
        inn: '',
        legalstatus: '',
        legaladdress: '',
        actualAddress: '',
        contacts: '',
        email: '',
        password: '',
        passwordRepeat: ''
    })

    const [photos, setPhotos] = useState([])

    const formFields = [
        { name: "organization", label: "Организация", type: "text", placeholder: "Введите название организации" },
        { name: "inn", label: "ИНН", type: "text", placeholder: "Введите ИНН" },
        { name: "legalstatus", label: "Юридический статус", type: "text", placeholder: "Введите юридический статус" },
        { name: "legaladdress", label: "Юридический адрес", type: "text", placeholder: "Введите юридический адрес" },
        { name: "actualAddress", label: "Фактический адрес", type: "text", placeholder: "Введите фактический адрес" },
        { name: "contacts", label: "Контакты", type: "tel", placeholder: "Введите контактный телефон" },
        { name: "email", label: "Почта", type: "email", placeholder: "Введите email" },
    ]

    const passwordFields = [
        { name: "password", label: "Пароль", type: "password", placeholder: "Введите пароль" },
        { name: "passwordRepeat", label: "Повтор пароля", type: "password", placeholder: "Повторите пароль" },
    ]

    const handleChange = (e) => {
        setFormData({
        ...formData,
        [e.target.name]: e.target.value
        })
    }

    const handlePhotoUpload = (e) => {
        const files = Array.from(e.target.files)
        setPhotos(prev => [...prev, ...files])
    }

    const removePhoto = (index) => {
        setPhotos(prev => prev.filter((_, i) => i !== index))
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        // Здесь будет логика регистрации приюта
        console.log('Данные приюта:', formData)
        console.log('Фотографии:', photos)
        navigate('/админ-профиль')
    }

    return (
        <div className="min-h-screen bg-green-95 flex items-center justify-center px-[20px] md:px-[40px] lg:px-[60px] py-10">
        <div className="w-full max-w-6xl bg-green-95 rounded-custom p-8">
            <div className="flex flex-col lg:flex-row gap-8">
            <div className="lg:w-2/3">
                <div className="animate-fade-in">
                <h1 className="text-green-30 font-sf-rounded font-bold text-3xl md:text-4xl lg:text-5xl mb-2">
                    Регистрация приюта
                </h1>
                <p className="text-green-40 font-inter font-medium text-base md:text-lg mb-8">
                    Заполните информацию о вашем приюте
                </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                {/* Основные поля формы */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {formFields.map((field, index) => (
                    <div 
                        key={field.name}
                        className="animate-fade-up"
                        style={{ animationDelay: `${0.1 + index * 0.1}s` }}
                    >
                        <label htmlFor={field.name} className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                        {field.label}
                        </label>
                        <input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                        placeholder={field.placeholder}
                        />
                    </div>
                    ))}
                </div>

                {/* Поля пароля */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {passwordFields.map((field, index) => (
                    <div 
                        key={field.name}
                        className="animate-fade-up"
                        style={{ animationDelay: `${0.8 + index * 0.1}s` }}
                    >
                        <label htmlFor={field.name} className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                        {field.label}
                        </label>
                        <input
                        type={field.type}
                        id={field.name}
                        name={field.name}
                        value={formData[field.name]}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors"
                        placeholder={field.placeholder}
                        />
                    </div>
                    ))}
                </div>

                <div className="animate-fade-up" style={{ animationDelay: '1.0s' }}>
                    <button
                    type="submit"
                    className="w-full px-6 py-4 bg-green-60 text-green-100 font-sf-rounded font-semibold text-base md:text-lg rounded-custom-small hover:bg-green-70 active:bg-green-40 transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                    Зарегистрировать приют
                    </button>
                </div>
                </form>
            </div>

            {/* Правая часть - загрузка фото (1/3 ширины) */}
            <div className="lg:w-1/3">
                <div className="bg-green-95 rounded-custom p-6 h-full">
                <h3 className="text-green-30 font-sf-rounded font-bold text-xl mb-4">
                    Фотографии приюта
                </h3>
                <p className="text-green-40 font-inter text-sm mb-6">
                    Добавьте фотографии вашего приюта (минимум 1 фото)
                </p>

                {/* Область загрузки фото */}
                <div className="space-y-4">
                    {/* Кнопка загрузки */}
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

                    {/* Список загруженных фото */}
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
                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                ×
                            </button>
                            </div>
                        ))}
                        </div>
                    </div>
                    )}

                    {/* Валидация минимального количества фото */}
                    {photos.length === 0 && (
                    <p className="text-green-30 font-inter text-xs text-center">
                        * Необходимо загрузить минимум 1 фотографию
                    </p>
                    )}
                </div>

                {/* Информационный блок */}
                <div className="mt-6 p-4 bg-green-90 rounded-custom-small">
                    <h4 className="text-green-30 font-inter font-medium text-sm mb-2">
                    Рекомендации по фото:
                    </h4>
                    <ul className="text-green-40 font-inter text-xs space-y-1">
                    <li>• Фото территории приюта</li>
                    <li>• Фото вольеров и помещений</li>
                    <li>• Фото сотрудников с животными</li>
                    <li>• Общие планы приюта</li>
                    </ul>
                </div>
                </div>
            </div>
            </div>
        </div>
        </div>
    )
}

export default ShelterRegister