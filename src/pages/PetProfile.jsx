import React, { useState, useEffect } from "react";
import { Link, useParams } from 'react-router-dom';
import PetCard from '../components/PetCard';
import { animalService } from '../services/animalService';
import { shelterService } from '../services/shelterService';

const PetProfile = () => {
    const { id } = useParams();
    const [currentPet, setCurrentPet] = useState(null);
    const [shelterData, setShelterData] = useState(null);
    const [similarPets, setSimilarPets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Используем тот же базовый URL что и в PetCard
    const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL || 'http://172.29.8.236:9000';

    // Унифицированная функция для получения URL фото (как в PetCard)
    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        
        console.log('Processing photo:', photo);
        
        // Если photo - строка с URL
        if (typeof photo === 'string') {
            if (photo.startsWith('http')) return photo;
            // Добавляем базовый URL если нужно
            return `${UPLOADS_BASE_URL}${photo.startsWith('/') ? '' : '/'}${photo}`;
        }
        
        // Если photo - объект с полем url
        if (photo.url) {
            if (photo.url.startsWith('http')) return photo.url;
            return `${UPLOADS_BASE_URL}${photo.url.startsWith('/') ? '' : '/'}${photo.url}`;
        }
        
        // Если photo - объект с полем object_name
        if (photo.object_name) {
            return `${UPLOADS_BASE_URL}/${photo.object_name}`;
        }
        
        return null;
    };

    // Загрузка данных питомца и приюта
    useEffect(() => {
        const loadPetData = async () => {
            try {
                setLoading(true);
                setError(null);

                console.log('Loading pet with ID:', id);

                // Загружаем данные питомца
                const petData = await animalService.getAnimalById(id);
                console.log('Pet data from API:', petData);
                
                // Нормализуем данные питомца с правильной обработкой фото
                const normalizedPet = normalizePetData(petData);
                console.log('Normalized pet data:', normalizedPet);
                setCurrentPet(normalizedPet);

                // Загружаем данные приюта
                if (normalizedPet.shelter_id) {
                    try {
                        const shelter = await shelterService.getShelterById(normalizedPet.shelter_id);
                        console.log('Shelter data:', shelter);
                        setShelterData(shelter);
                    } catch (shelterError) {
                        console.warn('Error loading shelter data:', shelterError);
                        // Если не удалось загрузить приют, используем данные из животного
                        setShelterData({
                            name: normalizedPet.shelter_name,
                            address: normalizedPet.address || 'Адрес не указан'
                        });
                    }
                }

                // Загружаем похожих питомцев
                if (normalizedPet.shelter_id) {
                    try {
                        const similar = await animalService.getAnimalsByShelter(normalizedPet.shelter_id);
                        const filteredSimilar = similar
                            .filter(pet => pet.id !== parseInt(id) && pet.type === normalizedPet.type)
                            .slice(0, 2);
                        
                        const normalizedSimilar = filteredSimilar.map(normalizePetData);
                        setSimilarPets(normalizedSimilar);
                    } catch (similarError) {
                        console.warn('Error loading similar pets:', similarError);
                    }
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
    }, [id]);

    // Функция для нормализации данных питомца с унифицированной обработкой фото
    const normalizePetData = (petData) => {
        if (!petData) return null;

        // Унифицированная обработка photos (как в PetCard)
        let photos = [];
        if (Array.isArray(petData.photos)) {
            photos = petData.photos.map(photo => {
                const photoUrl = getPhotoUrl(photo);
                console.log('Photo URL generated:', photoUrl);
                
                // Создаем объект с унифицированной структурой
                return {
                    id: photo.id || Math.random(),
                    url: photoUrl,
                    object_name: photo.object_name || null
                };
            }).filter(photo => photo.url !== null); // Фильтруем некорректные фото
        } else if (petData.photo_url) {
            // Если фото приходит как отдельное поле
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

    // Mock данные для fallback
    const getMockPetData = () => ({
        id: parseInt(id),
        name: "Бэлла",
        age: 7,
        weight: "25 кг",
        height: "35 см",
        coat: "Шерсть длинная",
        color: "Окрас черно-рыжий",
        breed: "Border collie",
        description: `Бэлла попала в приют после жизни на улице...`,
        shelter_id: 1,
        shelter_name: "ПетДом",
        gender: "female",
        photos: [],
        type: "dog",
        personality: "спокойная, сдержанная, флегматичная",
        health: "здорова, все прививки сделаны"
    });

    const getMockShelterData = () => ({
        name: "ПетДом",
        address: "Адрес: Шмаковская 23к4",
        phone: "+7 (123) 456-78-90",
        email: "pethome@example.com"
    });

    const getMockSimilarPets = () => [
        {
            id: 2,
            name: "Честер",
            age: 1,
            gender: "male",
            type: "dog",
            photos: [],
            shelter_name: "ПетДом",
            personality: "игривый, активный",
            breed: "Лабрадор"
        },
        {
            id: 3,
            name: "Горемыка",
            age: 2,
            gender: "female",
            type: "dog",
            photos: [],
            shelter_name: "ПетДом",
            personality: "дружелюбная, ласковая",
            breed: "Дворняжка"
        }
    ];

    // Форматирование возраста
    const formatAge = (age) => {
        if (typeof age === 'number') {
            if (age < 1) return "Меньше года";
            if (age === 1) return "1 год";
            if (age < 5) return `${age} года`;
            return `${age} лет`;
        }
        return age;
    };

    // Характеристики питомца
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

    // Отображение размера
    const getSizeDisplay = (size) => {
        const sizeMap = {
            'small': 'Маленький',
            'medium': 'Средний',
            'large': 'Крупный'
        };
        return sizeMap[size] || size;
    };

    // Получение основной фотографии
    const getMainPhoto = () => {
        if (!currentPet || !currentPet.photos || currentPet.photos.length === 0) {
            return null;
        }
        
        const mainPhoto = currentPet.photos[0];
        const photoUrl = mainPhoto.url;
        
        console.log('Main photo URL:', photoUrl);
        return photoUrl;
    };

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
    const mainPhotoUrl = getMainPhoto();

    return (
        <div className="min-h-screen bg-green-95 py-10">
            <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px]">
                {/* Основной контент */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                
                {/* Левая колонка - фото и характеристики */}
                <div className="lg:w-1/3">
                    <article className="flex flex-col items-start gap-6 bg-green-95 rounded-custom p-6">
                    {/* Фото питомца */}
                    <div className="w-full aspect-[1.01] rounded-custom overflow-hidden relative">
                        {mainPhotoUrl ? (
                            <img
                                className="w-full h-full object-cover"
                                alt={`Фотография ${currentPet.name}`}
                                src={mainPhotoUrl}
                                onError={(e) => {
                                    console.error('Error loading image:', mainPhotoUrl);
                                    e.target.style.display = 'none';
                                    const fallback = document.getElementById(`fallback-${currentPet.id}`);
                                    if (fallback) fallback.style.display = 'flex';
                                }}
                            />
                        ) : null}
                        
                        {/* Fallback если фото нет или не загрузилось */}
                        <div 
                            id={`fallback-${currentPet.id}`}
                            className={`w-full h-full bg-gradient-to-br from-green-70 to-green-60 rounded-custom flex items-center justify-center flex-col p-4 ${mainPhotoUrl ? 'hidden' : 'flex'}`}
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
                        
                        {/* Градиент только внизу фото */}
                        <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-green-95 to-transparent"></div>
                        
                        {/* Имя и пол поверх фото */}
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="flex items-center gap-4">
                                {/* Имя в окне green-90 с текстом green-20 */}
                                <div className="px-4 py-2 bg-green-90 rounded-full">
                                    <h2 className="font-sf-rounded font-bold text-green-20 text-2xl">
                                        {currentPet.name}
                                    </h2>
                                </div>
                                
                                {/* Пол полупрозрачный green-90 с текстом green-20 */}
                                <div className="flex w-11 h-11 items-center justify-center bg-green-90/80 rounded-[100px] backdrop-blur-sm">
                                    <span className="text-green-20 text-sm font-semibold">
                                        {currentPet.gender === "male" ? "♂" : "♀"}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Характеристики питомца */}
                    {(petInfo.length > 0 || petDetails.length > 0) && (
                        <div className="flex flex-col gap-4 w-full">
                            {/* Основные характеристики */}
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

                            {/* Дополнительные детали */}
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

                    {/* Характер и здоровье */}
                    <div className="w-full space-y-3">
                        {/* Характер */}
                        <div className="bg-green-90 rounded-custom-small p-4">
                            <h4 className="font-inter font-semibold text-green-30 text-sm mb-2">
                                Характер
                            </h4>
                            <p className="text-green-20 text-sm font-inter">
                                {currentPet.personality}
                            </p>
                        </div>

                        {/* Здоровье */}
                        <div className="bg-green-90 rounded-custom-small p-4">
                            <h4 className="font-inter font-semibold text-green-30 text-sm mb-2">
                                Состояние здоровья
                            </h4>
                            <p className="text-green-20 text-sm font-inter">
                                {currentPet.health}
                            </p>
                        </div>
                    </div>
                    </article>
                </div>

                {/* Правая колонка - описание и контакты */}
                <div className="lg:w-2/3">
                    {/* Описание питомца */}
                    <section className="flex flex-col items-start justify-center gap-4 mb-6">
                        <div className="flex items-center justify-center p-6 relative self-stretch w-full bg-green-90 rounded-custom">
                            <p className="flex-1 font-inter font-regular text-green-20 text-[16px] leading-relaxed whitespace-pre-line">
                                {currentPet.description}
                            </p>
                        </div>
                    </section>

                    {/* Контакты приюта */}
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

                    {/* Похожие питомцы */}
                    {similarPets.length > 0 && (
                        <section className="flex flex-col items-center gap-4 relative self-stretch">
                            <div className="flex items-center gap-[25px] relative self-stretch w-full mb-6">
                                <h2 className="w-fit font-sf-rounded font-bold text-green-20 text-2xl">
                                    Похожие питомцы
                                </h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                                {similarPets.map((pet) => (
                                    <PetCard 
                                        key={pet.id}
                                        petData={pet}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                </div>
                </div>
            </div>
        </div>
    );
};

export default PetProfile;