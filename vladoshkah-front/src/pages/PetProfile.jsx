import React, { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from 'react-router-dom';
import PetCard from '../components/PetCard';
import { animalService } from '../services/animalService';
import { shelterService } from '../services/shelterService';
import { applicationService } from '../services/applicationService';
import { favoriteService } from '../services/favoriteService';
import AdoptionConfirmationModal from '../components/AdoptionConfirmationModal';
import { useAuth } from '../context/AuthContext';

const PetProfile = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [currentPet, setCurrentPet] = useState(null);
    const [shelterData, setShelterData] = useState(null);
    const [similarPets, setSimilarPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isApplied, setIsApplied] = useState(false);
    const [hasAnyApplication, setHasAnyApplication] = useState(false);
    const [isLoadingApplication, setIsLoadingApplication] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [checkingApplicationStatus, setCheckingApplicationStatus] = useState(true);
    const [similarFavoritesMap, setSimilarFavoritesMap] = useState({});
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);
    const { user } = useAuth();

    const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL || 'http://172.29.8.236:9000';

    useEffect(() => {
        checkApplicationStatus();
    }, [id, user]);

    const checkApplicationStatus = async () => {
        try {
            const currentAnimalId = parseInt(id);
            const currentUserId = user?.id ? parseInt(user.id) : null;
            setCheckingApplicationStatus(true);
            
            const token = localStorage.getItem('accessToken');
            if (!token) {
                setIsApplied(false);
                setHasAnyApplication(false);
                setCheckingApplicationStatus(false);
                return;
            }
            
            // Получаем все заявки на питомца (от всех пользователей)
            let userHasApplied = false;
            let hasAny = false;
            
            try {
                const allApplications = await applicationService.getApplicationsForAnimal(currentAnimalId);
                console.log('All applications for animal:', allApplications);
                
                if (Array.isArray(allApplications) && allApplications.length > 0) {
                    // Фильтруем активные заявки (не rejected)
                    const activeApplications = allApplications.filter(
                        app => app.status !== 'rejected'
                    );
                    
                    hasAny = activeApplications.length > 0;
                    
                    // Проверяем, есть ли заявка от текущего пользователя
                    if (currentUserId && hasAny) {
                        userHasApplied = activeApplications.some(
                            app => parseInt(app.user_id) === currentUserId
                        );
                        console.log('User has applied for this animal:', userHasApplied);
                    }
                    
                    console.log('Has any applications:', hasAny);
                }
            } catch (error) {
                console.error('Error checking applications for animal:', error);
                // Если endpoint не работает, пытаемся проверить через заявки пользователя
                if (currentUserId) {
                    try {
                        const userApplications = await applicationService.getUserTakeApplications();
                        const userAppForThisAnimal = userApplications.find(
                            app => parseInt(app.animal_id) === currentAnimalId && app.status !== 'rejected'
                        );
                        if (userAppForThisAnimal) {
                            userHasApplied = true;
                            hasAny = true;
                        }
                    } catch (userError) {
                        console.error('Error checking user applications:', userError);
                    }
                }
            }
            
            console.log('Final status:', { isApplied: userHasApplied, hasAnyApplication: hasAny });
            setIsApplied(userHasApplied);
            setHasAnyApplication(hasAny);
            
        } catch (error) {
            console.error('Error checking application status:', error);
            setIsApplied(false);
            setHasAnyApplication(false);
        } finally {
            setCheckingApplicationStatus(false);
        }
    };

    const handleAdoptClick = () => {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            navigate('/войти');
            return;
        }

        setIsModalOpen(true);
    };

    const handleConfirmAdoption = async () => {
        setIsLoadingApplication(true);
        try {
            const applicationData = {
                animal_id: parseInt(id),
                shelter_id: currentPet.shelter_id,
                status: 'pending',
                description: `Заявка на усыновление питомца ${currentPet.name}`
            };

            const response = await applicationService.createTakeApplication(applicationData);
            console.log('Application created:', response);
            
            // Сразу устанавливаем состояние, что заявка отправлена (навсегда)
            setIsApplied(true);
            setHasAnyApplication(true);
            setIsModalOpen(false);
            alert('Заявка успешно отправлена! Приют свяжется с вами в ближайшее время.');
            
            // Обновляем статус заявок после небольшой задержки (чтобы бэкенд успел обработать)
            setTimeout(() => {
                checkApplicationStatus();
            }, 500);
            
        } catch (error) {
            console.error('Error creating adoption application:', error);
            
            if (error.response?.status === 401) {
                alert('Сессия истекла. Пожалуйста, войдите снова.');
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                navigate('/войти');
            } else if (error.response?.status === 409) {
                alert('Вы уже подавали заявку на этого питомца');
                setIsApplied(true);
                setHasAnyApplication(true);
            } else {
                alert('Произошла ошибка при отправке заявки. Пожалуйста, попробуйте еще раз.');
            }
        } finally {
            setIsLoadingApplication(false);
        }
    };

    const handleCloseModal = () => {
        if (!isLoadingApplication) {
            setIsModalOpen(false);
        }
    };

    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        
        console.log('Processing photo:', photo);
        
        if (typeof photo === 'string') {
            if (photo.startsWith('http')) return photo;
            return `${UPLOADS_BASE_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
        }
        
        if (photo.url) {
            if (photo.url.startsWith('http')) return photo.url;
            return `${UPLOADS_BASE_URL}${photo.url.startsWith('/') ? '' : '/'}${photo.url}`;
        }
        
        if (photo.object_name) {
            return `${UPLOADS_BASE_URL}/${photo.object_name}`;
        }
        
        return null;
    };

    useEffect(() => {
        const loadPetData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Loading pet with ID:', id);

                const petData = await animalService.getAnimalById(id);
                console.log('Pet data from API:', petData);
                
                const normalizedPet = normalizePetData(petData);
                console.log('Normalized pet data:', normalizedPet);
                setCurrentPet(normalizedPet);

                if (normalizedPet.shelter_id) {
                    try {
                        const shelter = await shelterService.getShelterById(normalizedPet.shelter_id);
                        console.log('Shelter data:', shelter);
                        setShelterData(shelter);
                    } catch (shelterError) {
                        console.warn('Error loading shelter data:', shelterError);
                        setShelterData({
                            name: normalizedPet.shelter_name,
                            address: normalizedPet.address || 'Адрес не указан'
                        });
                    }
                }

                // Загружаем похожих питомцев
                try {
                    let similar = [];
                    
                    // Сначала пытаемся найти похожих в том же приюте
                    if (normalizedPet.shelter_id) {
                        try {
                            const shelterPets = await animalService.getAnimalsByShelter(normalizedPet.shelter_id);
                            const filteredByShelter = shelterPets
                                .filter(pet => pet.id !== parseInt(id) && pet.type === normalizedPet.type);
                            similar = [...filteredByShelter];
                        } catch (shelterError) {
                            console.warn('Error loading pets from shelter:', shelterError);
                        }
                    }
                    
                    // Если не хватает до 3, дополняем питомцами того же типа из других приютов
                    if (similar.length < 3 && normalizedPet.type) {
                        try {
                            const allByType = await animalService.getAnimalsWithFilters({
                                type: normalizedPet.type
                            });
                            
                            // Исключаем текущего питомца и тех, кто уже в списке
                            const existingIds = new Set([parseInt(id), ...similar.map(p => p.id)]);
                            const additional = allByType
                                .filter(pet => !existingIds.has(pet.id))
                                .slice(0, 3 - similar.length);
                            
                            similar = [...similar, ...additional];
                        } catch (typeError) {
                            console.warn('Error loading pets by type:', typeError);
                        }
                    }
                    
                    // Ограничиваем до 3 питомцев
                    const finalSimilar = similar.slice(0, 3);
                    const normalizedSimilar = finalSimilar.map(normalizePetData);
                    setSimilarPets(normalizedSimilar);
                    
                    // Проверяем избранные для похожих питомцев
                    if (normalizedSimilar.length > 0 && user?.id) {
                        try {
                            const animalIds = normalizedSimilar.map(pet => pet.id);
                            const favoritesResult = await favoriteService.checkFavoritesBulk(user.id, animalIds);
                            setSimilarFavoritesMap(favoritesResult || {});
                        } catch (favoritesError) {
                            console.error('Error loading favorites for similar pets:', favoritesError);
                            setSimilarFavoritesMap({});
                        }
                    } else {
                        setSimilarFavoritesMap({});
                    }
                } catch (similarError) {
                    console.warn('Error loading similar pets:', similarError);
                    setSimilarPets([]);
                }
            } catch (err) {
                console.error('Error loading pet data:', err);
                setError('Не удалось загрузить данные питомца');
                setCurrentPet(getMockPetData());
                setShelterData(getMockShelterData());
                setSimilarPets(getMockSimilarPets());
            } finally {
                setLoading(false);
            }
        };

        if (id) {
            loadPetData();
        }
    }, [id, user?.id]);

    // Обновляем similarFavoritesMap при изменении избранного
    useEffect(() => {
        const handleFavoritesUpdated = (event) => {
            const eventUserId = event.detail?.userId;
            const eventAnimalId = event.detail?.animalId;
            const eventIsFavorite = event.detail?.isFavorite;
            
            if (eventAnimalId && eventUserId === user?.id && eventIsFavorite !== undefined) {
                setSimilarFavoritesMap(prev => ({
                    ...prev,
                    [eventAnimalId]: eventIsFavorite
                }));
            }
        };

        window.addEventListener('favoritesUpdated', handleFavoritesUpdated);
        return () => {
            window.removeEventListener('favoritesUpdated', handleFavoritesUpdated);
        };
    }, [user?.id]);

    const normalizePetData = (petData) => {
        if (!petData) return null;

        let photos = [];
        if (Array.isArray(petData.photos)) {
            photos = petData.photos.map(photo => {
                const photoUrl = getPhotoUrl(photo);
                console.log('Photo URL generated:', photoUrl);
                
                return {
                    id: photo.id || Math.random(),
                    url: photoUrl,
                    object_name: photo.object_name || null
                };
            }).filter(photo => photo.url !== null);
        } else if (petData.photo_url) {
            const photoUrl = getPhotoUrl(petData.photo_url);
            photos = [{
                id: 1,
                url: photoUrl,
                object_name: null
            }];
        }

        console.log('Final photos array:', photos);

        return {
            id: petData.id,
            name: petData.name || 'Неизвестно',
            age: petData.age || 0,
            weight: petData.weight || null,
            height: petData.height || null,
            coat: petData.coat || null,
            color: petData.color || 'Не указан',
            breed: petData.breed || 'Порода не указана',
            description: petData.description || petData.history || 'Описание пока не добавлено.',
            shelter_id: petData.shelter_id,
            shelter_name: petData.shelter_name || 'Приют не указан',
            gender: petData.gender || 'unknown',
            photos: photos,
            type: petData.type || 'unknown',
            personality: petData.personality || 'Характер не описан',
            health: petData.health || 'Состояние здоровья не указано',
            animal_size: petData.animal_size,
            history: petData.history
        };
    };

    

    const formatAge = (age) => {
        if (typeof age === 'number') {
            if (age < 1) return "Меньше года";
            if (age === 1) return "1 год";
            
            // Правильное склонение: год/года/лет
            const lastDigit = age % 10;
            const lastTwoDigits = age % 100;
            
            // Исключения: 11, 12, 13, 14 всегда "лет"
            if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
                return `${age} лет`;
            }
            
            // 1 -> год, 2-4 -> года, остальные -> лет
            if (lastDigit === 1) {
                return `${age} год`;
            } else if (lastDigit >= 2 && lastDigit <= 4) {
                return `${age} года`;
            } else {
                return `${age} лет`;
            }
        }
        return age;
    };

    const getPetInfo = () => {
        if (!currentPet) return [];
        
        const info = [];
        
        if (currentPet.age) info.push({ id: 1, text: formatAge(currentPet.age) });
        if (currentPet.weight) info.push({ id: 2, text: `${currentPet.weight}${typeof currentPet.weight === 'number' ? ' кг' : ''}` });
        if (currentPet.height) info.push({ id: 3, text: `${currentPet.height}${typeof currentPet.height === 'number' ? ' см' : ''}` });
        if (currentPet.animal_size) info.push({ id: 4, text: getSizeDisplay(currentPet.animal_size) });
        
        return info;
    };

    const getPetDetails = () => {
        if (!currentPet) return [];
        
        const details = [];
        if (currentPet.coat) details.push({ id: 1, text: currentPet.coat });
        if (currentPet.color && currentPet.color !== 'Не указан') details.push({ id: 2, text: currentPet.color });
        if (currentPet.breed && currentPet.breed !== 'Порода не указана') details.push({ id: 3, text: currentPet.breed });
        
        return details;
    };

    const getSizeDisplay = (size) => {
        const sizeMap = {
            'small': 'Маленький',
            'medium': 'Средний',
            'large': 'Крупный'
        };
        return sizeMap[size] || size;
    };

    const getHealthDisplay = (health) => {
        const healthMap = {
            'healthy': 'Здоровый',
            'needs_treatment': 'Требует лечения',
            'special_needs': 'Особые потребности'
        };
        return healthMap[health] || health || 'Состояние здоровья не указано';
    };

    const getCurrentPhoto = () => {
        if (!currentPet || !currentPet.photos || currentPet.photos.length === 0) {
            return null;
        }
        
        const validPhotos = currentPet.photos.filter(photo => photo.url);
        if (validPhotos.length === 0) {
            return null;
        }
        
        const safeIndex = currentPhotoIndex >= validPhotos.length ? 0 : currentPhotoIndex;
        const currentPhoto = validPhotos[safeIndex];
        const photoUrl = currentPhoto.url;
        
        console.log('Current photo URL:', photoUrl, 'Index:', safeIndex, 'Total:', validPhotos.length);
        return photoUrl;
    };

    const getAvailablePhotos = () => {
        if (!currentPet || !currentPet.photos || currentPet.photos.length === 0) {
            return [];
        }
        return currentPet.photos.filter(photo => photo.url);
    };

    const handlePreviousPhoto = () => {
        const availablePhotos = getAvailablePhotos();
        if (availablePhotos.length === 0) return;
        setCurrentPhotoIndex((prev) => (prev === 0 ? availablePhotos.length - 1 : prev - 1));
    };

    const handleNextPhoto = () => {
        const availablePhotos = getAvailablePhotos();
        if (availablePhotos.length === 0) return;
        setCurrentPhotoIndex((prev) => (prev === availablePhotos.length - 1 ? 0 : prev + 1));
    };

    // Сбрасываем индекс при изменении питомца
    useEffect(() => {
        setCurrentPhotoIndex(0);
    }, [id]);

    if (loading) {
        return (
            <div className="min-h-screen bg-green-95 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-40 mx-auto mb-4"></div>
                    <h3 className="font-sf-rounded font-bold text-green-30 text-xl">
                        Загружаем данные питомца...
                    </h3>
                </div>
            </div>
        );
    }

    if (error || !currentPet) {
        return (
            <div className="min-h-screen bg-green-95 flex items-center justify-center">
                <div className="text-center">
                    <div className="bg-red-90 rounded-custom p-8 max-w-md mx-auto">
                        <svg 
                            className="w-16 h-16 text-red-40 mx-auto mb-4"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <h3 className="font-sf-rounded font-bold text-red-30 text-xl mb-2">
                            Ошибка загрузки
                        </h3>
                        <p className="font-inter text-red-20 mb-4">
                            {error || 'Питомец не найден'}
                        </p>
                        <Link
                            to="/найти-питомца"
                            className="px-6 py-3 bg-green-70 text-green-20 rounded-custom-small hover:bg-green-60 transition-colors inline-block"
                        >
                            Вернуться к поиску
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    const petInfo = getPetInfo();
    const petDetails = getPetDetails();
    const currentPhotoUrl = getCurrentPhoto();
    const availablePhotos = getAvailablePhotos();
    const hasMultiplePhotos = availablePhotos.length > 1;

    return (
        <div className="min-h-screen bg-green-95 py-10">
            <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px]">
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                <div className="lg:w-1/3">
                    <article className="flex flex-col items-start gap-6 bg-green-95 rounded-custom p-6">
                    <div className="w-full aspect-[1.01] rounded-custom overflow-hidden relative group">
                        {currentPhotoUrl ? (
                            <>
                                <img
                                    className="w-full h-full object-cover transition-opacity duration-300"
                                    alt={`Фотография ${currentPet.name} ${currentPhotoIndex + 1} из ${availablePhotos.length}`}
                                    src={currentPhotoUrl}
                                    onError={(e) => {
                                        console.error('Error loading image:', currentPhotoUrl);
                                        e.target.style.display = 'none';
                                        const fallback = document.getElementById(`fallback-${currentPet.id}`);
                                        if (fallback) fallback.style.display = 'flex';
                                    }}
                                />
                                
                                {/* Стрелочки для переключения фотографий */}
                                {hasMultiplePhotos && (
                                    <>
                                        {/* Стрелка влево */}
                                        <button
                                            onClick={handlePreviousPhoto}
                                            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                                            aria-label="Предыдущее фото"
                                            title="Предыдущее фото"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                                            </svg>
                                        </button>
                                        
                                        {/* Стрелка вправо */}
                                        <button
                                            onClick={handleNextPhoto}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-black/50 hover:bg-black/70 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200"
                                            aria-label="Следующее фото"
                                            title="Следующее фото"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                            </svg>
                                        </button>
                                        
                                        {/* Индикатор количества фотографий */}
                                        <div className="absolute bottom-20 right-4 z-10 px-3 py-1.5 bg-black/50 text-white text-sm rounded-full backdrop-blur-sm">
                                            {currentPhotoIndex + 1} / {availablePhotos.length}
                                        </div>
                                    </>
                                )}
                            </>
                        ) : null}
                        
                        <div 
                            id={`fallback-${currentPet.id}`}
                            className={`w-full h-full bg-gradient-to-br from-green-70 to-green-60 rounded-custom flex items-center justify-center flex-col p-4 ${currentPhotoUrl ? 'hidden' : 'flex'}`}
                        >
                            <span className="text-green-98 font-inter text-center mb-2 text-xl font-bold">
                                {currentPet.name}
                            </span>
                            <span className="text-green-95 font-inter text-sm text-center">
                                {currentPet.type === 'dog' ? '🐕 Собака' : currentPet.type === 'cat' ? '🐈 Кошка' : '🐾 Питомец'}
                            </span>
                            {currentPet.breed && currentPet.breed !== 'Порода не указана' && (
                                <span className="text-green-95 font-inter text-xs text-center mt-1">
                                    {currentPet.breed}
                                </span>
                            )}
                        </div>
                        
                        <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-green-95 to-transparent"></div>
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="flex items-center gap-4">
                                <div className="px-4 py-2 bg-green-90 rounded-full">
                                    <h2 className="font-sf-rounded font-bold text-green-20 text-2xl">
                                        {currentPet.name}
                                    </h2>
                                </div>
                                
                                <div className="flex w-11 h-11 items-center justify-center bg-green-90/80 rounded-[100px] backdrop-blur-sm">
                                    <span className="text-green-20 text-sm font-semibold">
                                        {currentPet.gender === "male" ? "♂" : "♀"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {(petInfo.length > 0 || petDetails.length > 0) && (
                        <div className="flex flex-col gap-4 w-full">
                            {petInfo.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {petInfo.map((info) => (
                                        <div
                                            key={info.id}
                                            className="inline-flex items-center justify-center gap-2.5 py-2 px-3 bg-green-70 rounded-[100px]"
                                        >
                                            <div className="relative w-fit font-inter font-semibold text-green-98 text-lg tracking-[0]">
                                                {info.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {petDetails.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {petDetails.map((detail) => (
                                        <div
                                            key={detail.id}
                                            className="inline-flex items-center justify-center gap-2.5 py-2 px-3 bg-green-70 rounded-[100px]"
                                        >
                                            <div className="text-green-98 relative w-fit font-inter font-semibold text-lg tracking-[0]">
                                                {detail.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    <div className="w-full space-y-3">
                        <div className="bg-green-90 rounded-custom-small p-4">
                            <h4 className="font-inter font-semibold text-green-30 text-sm mb-2">
                                Характер
                            </h4>
                            <p className="text-green-20 text-sm font-inter">
                                {currentPet.personality}
                            </p>
                        </div>

                        <div className="bg-green-90 rounded-custom-small p-4">
                            <h4 className="font-inter font-semibold text-green-30 text-sm mb-2">
                                Состояние здоровья
                            </h4>
                            <p className="text-green-20 text-sm font-inter">
                                {getHealthDisplay(currentPet.health)}
                            </p>
                        </div>
                    </div>
                    </article>
                </div>

                <div className="lg:w-2/3">
                    <section className="flex flex-col items-start justify-center gap-4 mb-6">
                        <div className="flex items-center justify-center p-6 relative self-stretch w-full bg-green-90 rounded-custom">
                            <p className="flex-1 font-inter font-regular text-green-20 text-[16px] leading-relaxed whitespace-pre-line">
                                {currentPet.description}
                            </p>
                        </div>
                    </section>

                    <section className="flex flex-col items-start justify-center gap-4 mb-8">
                        <div className="flex items-center justify-between p-6 relative self-stretch w-full bg-green-90 rounded-custom">
                            <address className="flex-1 font-inter font-semibold text-green-20 text-[16px] leading-relaxed not-italic">
                                {shelterData?.name || currentPet.shelter_name}
                                <br />
                                {shelterData?.address || 'Адрес не указан'}
                                {shelterData?.phone && (
                                    <>
                                        <br />
                                        Телефон: {shelterData.phone}
                                    </>
                                )}
                                {shelterData?.email && (
                                    <>
                                        <br />
                                        Email: {shelterData.email}
                                    </>
                                )}
                            </address>

                            <Link
                                to={`/приют/${currentPet.shelter_id}`}
                                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-70 rounded-custom-small hover:bg-green-60 transition-colors"
                                aria-label="Перейти к профилю приюта"
                            >
                                <span className="font-inter font-medium text-green-98 text-[16px]">
                                    К приюту
                                </span>
                            </Link>
                        </div>
                    </section>
                                        
                    <section className="flex flex-col items-start justify-center gap-4 mb-6">
                        <div className="flex flex-col items-start p-6 relative self-stretch w-full bg-green-90 rounded-custom gap-4">
                            <div className="w-full">
                                <h3 className="font-inter font-semibold text-green-30 text-lg mb-2">
                                    Хотите забрать {currentPet.name} домой?
                                </h3>
                                <p className="text-green-40 font-inter text-sm">
                                    Подайте заявку на усыновление и приют свяжется с вами для обсуждения деталей
                                </p>
                            </div>
                            
                            <div className="w-2/3 mx-auto">
                                {checkingApplicationStatus ? (
                                    <div className="w-full px-8 py-2 bg-green-70 text-green-40 font-sf-rounded font-semibold rounded-custom-small opacity-50 text-lg text-center">
                                        Проверка...
                                    </div>
                                ) : isApplied ? (
                                    <button
                                        disabled
                                        className="w-full px-8 py-2 bg-green-70 text-green-40 font-sf-rounded font-semibold rounded-custom-small cursor-not-allowed opacity-75 text-lg text-center"
                                        aria-disabled="true"
                                    >
                                        ✓ Заявка отправлена
                                    </button>
                                ) : hasAnyApplication ? (
                                    <button
                                        disabled
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        className="w-full px-8 py-2 bg-green-70 text-green-40 font-sf-rounded font-semibold rounded-custom-small cursor-not-allowed opacity-75 text-lg text-center pointer-events-none"
                                        aria-disabled="true"
                                    >
                                        Питомца уже хотят забрать
                                    </button>
                                ) : (
                                    <button
                                        onClick={handleAdoptClick}
                                        className="w-full px-8 py-2 bg-green-70 text-green-100 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-60 active:bg-green-40 shadow-lg hover:shadow-xl transition-all duration-200 text-lg text-center"
                                    >
                                        Хочу забрать к себе
                                    </button>
                                )}
                            </div>
                        </div>
                    </section>

                    {similarPets.length > 0 && (
                        <section className="flex flex-col items-center gap-4 relative self-stretch">
                            <div className="flex items-center gap-[25px] relative self-stretch w-full mb-6">
                                <h2 className="w-fit font-sf-rounded font-bold text-green-20 text-2xl">
                                    Похожие питомцы
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
                                {similarPets.map((pet) => (
                                    <PetCard 
                                        key={pet.id}
                                        petData={pet}
                                        initialFavorite={similarFavoritesMap[pet.id] === true}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
                </div>
            </div>

            <AdoptionConfirmationModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onConfirm={handleConfirmAdoption}
                petName={currentPet?.name}
                isLoading={isLoadingApplication}
            />
        </div>
    );
};

export default PetProfile;