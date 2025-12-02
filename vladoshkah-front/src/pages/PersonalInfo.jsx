import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { userService } from '../services/userService'
import { useAuth } from '../context/AuthContext'
import ImageCropModal from '../components/ImageCropModal'

const PersonalInfo = () => {
    const [formData, setFormData] = useState({
        firstname: '',
        lastname: '',
        phone: '',
        gender: '',
        bio: '' 
    })
    const [profilePhoto, setProfilePhoto] = useState(null)
    const [photoPreview, setPhotoPreview] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const fileInputRef = useRef(null)
    const [cropModalOpen, setCropModalOpen] = useState(false)
    const [imageToCrop, setImageToCrop] = useState(null)
    const { user, updateUser } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        console.log(' PersonalInfo: Checking access...');
        
        const token = localStorage.getItem('accessToken');
        if (!token) {
            console.log('PersonalInfo: No token found, redirecting to register');
            navigate('/register');
            return;
        }

        console.log('PersonalInfo: Token found, loading form...');
        loadUserProfile();
    }, [navigate])

    const loadUserProfile = async () => {
        try {
            const userData = await userService.getCurrentUser();
            if (userData) {
                console.log(' PersonalInfo: Loaded user data from server:', userData);
                setFormData({
                    firstname: userData.firstname || '',
                    lastname: userData.lastname || '',
                    phone: userData.phone || '',
                    gender: userData.gender || '',
                    bio: userData.bio || userData.personalInfo || '' 
                });
                
                if (userData.photoUrl || (userData.photos && userData.photos[0])) {
                    const photoUrl = userData.photoUrl || userData.photos[0]?.url;
                    setPhotoPreview(photoUrl);
                }
            }
        } catch (error) {
            console.log('PersonalInfo: Could not load from server, using localStorage');
            const cachedUser = JSON.parse(localStorage.getItem('user') || 'null');
            if (cachedUser) {
                console.log('PersonalInfo: Using cached user from localStorage:', cachedUser);
                setFormData({
                    firstname: cachedUser.firstname || '',
                    lastname: cachedUser.lastname || '',
                    phone: cachedUser.phone || '',
                    gender: cachedUser.gender || '',
                    bio: cachedUser.bio || cachedUser.personalInfo || '' 
                });
                
                if (cachedUser.photoUrl) {
                    setPhotoPreview(cachedUser.photoUrl);
                }
            }
        }
    }

    const isProfileComplete = () => {
        return formData.firstname.trim() && 
            formData.lastname.trim() && 
            formData.gender;
    }

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handlePhotoChange = (e) => {
        const file = e.target.files[0]
        if (!file) return

        if (!file.type.startsWith('image/')) {
            setError('Пожалуйста, выберите файл изображения')
            return
        }

        if (file.size > 5 * 1024 * 1024) {
            setError('Размер файла не должен превышать 5MB')
            return
        }

        const reader = new FileReader()
        reader.onload = (e) => {
            setImageToCrop(e.target.result)
            setCropModalOpen(true)
        }
        reader.readAsDataURL(file)
    }

    const handleCropComplete = (croppedFile) => {
        setProfilePhoto(croppedFile)
        const reader = new FileReader()
        reader.onload = (e) => {
            setPhotoPreview(e.target.result)
            setError('')
        }
        reader.readAsDataURL(croppedFile)
        setCropModalOpen(false)
        setImageToCrop(null)
    }

    const handleRemovePhoto = () => {
        setProfilePhoto(null)
        setPhotoPreview('')
        if (fileInputRef.current) {
            fileInputRef.current.value = ''
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        
        if (!isProfileComplete()) {
            setError('Пожалуйста, заполните обязательные поля (имя, фамилия, пол)')
            return
        }

        setLoading(true)

        try {
            console.log(' PersonalInfo: Starting profile update...');
            
            const userDataToUpdate = {
                firstname: formData.firstname.trim(),
                lastname: formData.lastname.trim(),
                gender: formData.gender
            };
            
            if (formData.phone.trim()) {
                userDataToUpdate.phone = formData.phone.trim();
            }
            
            if (formData.bio.trim()) {
                userDataToUpdate.bio = formData.bio.trim();
                console.log(' PersonalInfo: Sending bio field:', formData.bio.trim());
            }

            console.log(' PersonalInfo: User data to update:', userDataToUpdate);

            const updatedUser = await userService.updateUserProfileWithPhoto(
                userDataToUpdate, 
                profilePhoto
            );

            console.log(' PersonalInfo: Profile updated successfully:', updatedUser);
            
            console.log(' PersonalInfo: Loading complete user data from server...');
            const completeUserData = await userService.getCurrentUser();
            console.log(' PersonalInfo: Complete user data loaded:', completeUserData);
            
            if (updateUser) {
                updateUser(completeUserData);
                console.log(' PersonalInfo: AuthContext updated with complete data');
            }
            
            localStorage.setItem('user', JSON.stringify(completeUserData));
            localStorage.setItem('profileComplete', 'true');
            
            console.log('PersonalInfo: All data synchronized, redirecting...');
            
            navigate('/profile');
            
        } catch (error) {
            console.error('PersonalInfo: Error updating profile:', error);
            
            
            if (error.response?.data) {
                const errorData = error.response.data;
                console.error(' Server error details:', errorData);
                
                if (errorData.details && Array.isArray(errorData.details)) {
                    const errorMessages = errorData.details.map(detail => 
                        detail.message || detail.field ? `${detail.field}: ${detail.message}` : String(detail)
                    ).join(', ');
                    setError(`Ошибки валидации: ${errorMessages}`);
                } else if (errorData.error) {
                    setError(`Ошибка сервера: ${errorData.error}`);
                } else {
                    setError('Неизвестная ошибка сервера');
                }
            } else if (error.message) {
                setError(error.message);
            } else {
                setError('Ошибка при сохранении данных. Попробуйте еще раз.');
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-green-95 flex items-center justify-center px-[20px] md:px-[40px] lg:px-[60px] py-10">
            <div className="w-full max-w-4xl">
                <h1 className="text-green-30 font-sf-rounded font-bold text-3xl md:text-4xl lg:text-5xl mb-2 text-center">
                    Заполните личную информацию
                </h1>
                <p className="text-green-40 font-inter font-medium text-base md:text-lg mb-8 text-center">
                    Чтобы продолжить работу, заполните обязательные поля
                </p>

                {error && (
                    <div className="animate-fade-up mb-6 p-4 bg-red-90 border border-red-40 rounded-custom-small">
                        <p className="text-red-20 font-inter font-medium text-center">{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="animate-fade-up" style={{ animationDelay: '0.1s' }}>
                        <div className="text-center">
                            <div className="w-32 h-32 bg-green-90 border-2 border-green-40 rounded-full flex items-center justify-center mx-auto mb-4 relative overflow-hidden">
                                {photoPreview ? (
                                    <img 
                                        src={photoPreview} 
                                        alt="Превью фото" 
                                        className="w-full h-full rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-green-20 text-4xl">+</span>
                                )}
                                
                                {photoPreview && (
                                    <button
                                        type="button"
                                        onClick={handleRemovePhoto}
                                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-90 border-2 border-red-40 rounded-full flex items-center justify-center hover:bg-red-80 transition-colors z-10"
                                    >
                                        <span className="text-red-20 text-lg">×</span>
                                    </button>
                                )}
                            </div>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handlePhotoChange}
                                className="hidden"
                                id="profilePhoto"
                            />
                            <label
                                htmlFor="profilePhoto"
                                className="inline-block px-6 py-3 bg-green-30 text-green-100 font-sf-rounded font-semibold text-base rounded-custom-small hover:bg-green-40 transition-all duration-200 cursor-pointer mb-2"
                            >
                                {photoPreview ? 'Изменить фото' : 'Добавить фото'}
                            </label>
                            <p className="text-green-40 text-sm mt-1">
                                {profilePhoto ? `Выбран файл: ${profilePhoto.name}` : 'JPG, PNG до 5MB'}
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="animate-fade-up" style={{ animationDelay: '0.2s' }}>
                            <label htmlFor="firstname" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                Имя *
                            </label>
                            <input
                                type="text"
                                id="firstname"
                                name="firstname"
                                value={formData.firstname}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-40 focus:outline-none transition-colors"
                                placeholder="Введите ваше имя"
                                disabled={loading}
                            />
                        </div>

                        <div className="animate-fade-up" style={{ animationDelay: '0.3s' }}>
                            <label htmlFor="lastname" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                Фамилия *
                            </label>
                            <input
                                type="text"
                                id="lastname"
                                name="lastname"
                                value={formData.lastname}
                                onChange={handleChange}
                                required
                                className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-40 focus:outline-none transition-colors"
                                placeholder="Введите вашу фамилию"
                                disabled={loading}
                            />
                        </div>

                        <div className="animate-fade-up" style={{ animationDelay: '0.4s' }}>
                            <label htmlFor="phone" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                Телефон
                            </label>
                            <input
                                type="tel"
                                id="phone"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-40 focus:outline-none transition-colors"
                                placeholder="+7 (999) 999-99-99"
                                disabled={loading}
                            />
                        </div>

                        <div className="animate-fade-up" style={{ animationDelay: '0.5s' }}>
                            <label htmlFor="gender" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                                Пол *
                            </label>
                            <div className="relative">
                                <select
                                    id="gender"
                                    name="gender"
                                    value={formData.gender}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-4 py-3 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded focus:border-green-40 focus:outline-none transition-colors appearance-none cursor-pointer pr-10"
                                    disabled={loading}
                                >
                                    <option value="" disabled className="text-green-40 bg-green-98">Выберите пол</option>
                                    <option value="male" className="text-green-20 bg-green-98 py-2">Мужской</option>
                                    <option value="female" className="text-green-20 bg-green-98 py-2">Женский</option>
                                    <option value="other" className="text-green-20 bg-green-98 py-2">Другое</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-green-40">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="animate-fade-up" style={{ animationDelay: '0.6s' }}>
                        <label htmlFor="bio" className="block text-green-40 font-inter font-medium text-sm md:text-base mb-2">
                            О себе
                        </label>
                        <textarea
                            id="bio"
                            name="bio" 
                            value={formData.bio}
                            onChange={handleChange}
                            rows={6}
                            className="w-full px-4 py-4 bg-green-98 border-2 border-green-40 rounded-custom-small text-green-20 font-sf-rounded placeholder-green-40 focus:border-green-50 focus:outline-none transition-colors resize-none text-sm md:text-base"
                            placeholder="Расскажите о себе, вашем опыте с животными, почему хотите помочь..."
                            disabled={loading}
                        />
                    </div>

                    <div className="flex flex-col gap-4">
                        <div className="animate-fade-up" style={{ animationDelay: '0.7s' }}>
                            <button
                                type="submit"
                                disabled={loading || !isProfileComplete()}
                                className="w-full px-6 py-4 bg-green-50 text-green-100 font-sf-rounded font-semibold text-base md:text-lg rounded-custom-small hover:bg-green-60 active:bg-green-40 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Сохранение...' : 'Сохранить и перейти в профиль'}
                            </button>
                        </div>

                        <div className="animate-fade-up" style={{ animationDelay: '0.8s' }}>
                            <p className="text-center text-green-40 font-inter font-medium text-xs md:text-sm">
                                * - Обязательное поле. Без заполнения этих полей вы не сможете перейти в профиль.
                            </p>
                        </div>
                    </div>
                </form>

                <ImageCropModal
                    isOpen={cropModalOpen}
                    onClose={() => {
                        setCropModalOpen(false)
                        setImageToCrop(null)
                        if (fileInputRef.current) {
                            fileInputRef.current.value = ''
                        }
                    }}
                    imageSrc={imageToCrop}
                    onCropComplete={handleCropComplete}
                    aspectRatio={1}
                />
            </div>
        </div>
    )
}

export default PersonalInfo