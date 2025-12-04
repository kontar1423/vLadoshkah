import React, { useEffect, useRef, useState } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { favoriteService } from '../services/favoriteService';

const PetCard = ({ petData, initialFavorite = false, onDelete = null, wideMobile = false }) => {
    const {
        id,
        name = "Питомец",
        age = "Возраст не указан",
        gender = "male",
        type,
        photos = [],
        shelter_name,
        color,
        personality
    } = petData || {};

    const { user } = useAuth();
    const [isFavorite, setIsFavorite] = useState(initialFavorite);
    const [favoriteLoading, setFavoriteLoading] = useState(false);
    const checkInProgressRef = useRef(false);

    const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL || 'http://172.29.8.236:9000/uploads';


    const formatAge = (age) => {
        if (typeof age === 'number') {
            if (age < 1) return "Меньше года";
            if (age === 1) return "1 год";
            
            const lastDigit = age % 10;
            const lastTwoDigits = age % 100;
            
            if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
                return `${age} лет`;
            }
            
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

    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        if (photo.url) {
            if (photo.url.startsWith('http')) return photo.url;
            return `${UPLOADS_BASE_URL}${photo.url.startsWith('/') ? '' : '/'}${photo.url}`;
        }
        if (photo.object_name) {
            return `${UPLOADS_BASE_URL}/${photo.object_name}`;
        }
        return null;
    };

    const handleFavoriteClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const token = localStorage.getItem('accessToken');
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        
        console.log('Favorite Click Debug:', {
            contextUser: user,
            storedUser: storedUser,
            hasToken: !!token,
            petId: id
        });

        if (!user && !storedUser) {
            alert('Пожалуйста, войдите в систему чтобы добавить питомца в избранное');
            return;
        }

        const currentUser = user || storedUser;

        if (favoriteLoading) return;

        setFavoriteLoading(true);
        
        try {
            const newFavoriteState = !isFavorite;
            
            if (isFavorite) {
                await favoriteService.removeFavorite(currentUser.id, id);
                console.log('PetCard: Removed from favorites');
            } else {
                await favoriteService.addFavorite(currentUser.id, id);
                console.log('PetCard: Added to favorites');
            }
            
            setIsFavorite(newFavoriteState);
            

            window.dispatchEvent(new CustomEvent('favoritesUpdated', { 
                detail: { userId: currentUser.id, animalId: id, isFavorite: newFavoriteState } 
            }));
            console.log('PetCard: Sent favoritesUpdated event');

        } catch (error) {
            console.error(' PetCard: Error updating favorite:', error);
            alert('Не удалось обновить избранное');
        } finally {
            setFavoriteLoading(false);
        }
    };

    useEffect(() => {
        let cancelled = false;

        if (initialFavorite !== undefined) {
            setIsFavorite(initialFavorite);
            const handleFavoritesUpdated = (event) => {
                const eventUserId = event.detail?.userId;
                const eventAnimalId = event.detail?.animalId;
                const eventIsFavorite = event.detail?.isFavorite;
                const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
                
                if (eventAnimalId === id && eventUserId === currentUser?.id && eventIsFavorite !== undefined) {
                    console.log('PetCard: Updating favorite status from event:', eventIsFavorite);
                    setIsFavorite(eventIsFavorite);
                }
            };
            
            window.addEventListener('favoritesUpdated', handleFavoritesUpdated);
            
            return () => {
                cancelled = true;
                window.removeEventListener('favoritesUpdated', handleFavoritesUpdated);
            };
        }

        const checkFavoriteStatus = async () => {
            const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
            
            if (!currentUser?.id || !id) {
                setIsFavorite(false);
                return;
            }

            if (checkInProgressRef.current) {
                console.log('PetCard: Check already in progress, skipping');
                return;
            }

            checkInProgressRef.current = true;

            try {
                console.log('Checking favorite status for:', {
                    userId: currentUser.id,
                    petId: id
                });
                
                const result = await favoriteService.checkFavorite(currentUser.id, id);
                if (cancelled) return;
                setIsFavorite(result.isFavorite);
                console.log('PetCard: Favorite status updated:', result.isFavorite);
            } catch (error) {
                if (cancelled) return;
                console.error('PetCard: Error checking favorite status:', error);
                setIsFavorite(false);
            } finally {
                checkInProgressRef.current = false;
            }
        };

        const handleFavoritesUpdated = (event) => {
            const eventUserId = event.detail?.userId;
            const eventAnimalId = event.detail?.animalId;
            const eventIsFavorite = event.detail?.isFavorite;
            const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
            
            if (eventAnimalId === id && eventUserId === currentUser?.id && eventIsFavorite !== undefined) {
                console.log('PetCard: Updating favorite status from event:', eventIsFavorite);
                setIsFavorite(eventIsFavorite);
            }
        };

        checkFavoriteStatus();
        window.addEventListener('favoritesUpdated', handleFavoritesUpdated);

        return () => {
            cancelled = true;
            checkInProgressRef.current = false;
            window.removeEventListener('favoritesUpdated', handleFavoritesUpdated);
        };
    }, [user?.id, id, initialFavorite]);

    const mainPhoto = photos.length > 0 ? photos[0] : null;
    const photoUrl = mainPhoto ? getPhotoUrl(mainPhoto) : null;

    const truncatePersonality = (text, maxLength = 20) => {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    };

    const mobileSizeClasses = wideMobile
        ? 'w-[280px] max-w-[280px] h-[300px]'
        : 'w-[220px] max-w-[220px] h-[260px]';

    return (
        <article 
            className={`flex flex-col ${mobileSizeClasses} sm:w-full sm:max-w-[300px] md:max-w-[320px] sm:h-[400px] md:h-[420px] bg-green-90 rounded-custom-small shadow-lg overflow-hidden transform transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl relative`}
            aria-label={`Карточка питомца ${name}`}
        >
            {onDelete && (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onDelete(id);
                    }}
                    className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 z-20 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 bg-green-80 hover:bg-green-70 text-green-20 rounded-full flex items-center justify-center shadow-lg transition-colors border-2 border-green-30"
                    aria-label="Удалить питомца"
                    title="Удалить питомца"
                >
                    <svg className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}
            <div className="relative w-full h-[180px] sm:h-auto sm:aspect-square bg-gray-100 rounded-t-custom-small overflow-hidden">
                {photoUrl ? (
                    <>
                        <img
                            className="w-full h-full object-cover object-center"
                            alt={`Фотография ${name}`}
                            src={photoUrl}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                const fallback = e.target.nextSibling;
                                if (fallback) fallback.style.display = 'flex';
                            }}
                        />
                        <div 
                            className="hidden w-full h-full bg-gradient-to-br from-green-70 to-green-60 items-center justify-center flex-col p-4 text-center"
                        >
                            <span className="text-green-98 font-inter mb-1">{name}</span>
                            <span className="text-green-95 font-inter text-sm">
                                {type === 'dog' ? ' Собака' : type === 'cat' ? ' Кошка' : ' Питомец'}
                            </span>
                            {color && (
                                <span className="text-green-95 font-inter text-xs mt-1">
                                    Окрас: {color}
                                </span>
                            )}
                        </div>
                        <div className="absolute bottom-0 left-0 w-full h-10 bg-gradient-to-t from-green-90 to-transparent"></div>
                    </>
                ) : (
                    <div className="w-full h-full bg-gradient-to-br from-green-70 to-green-60 flex items-center justify-center flex-col p-4 text-center">
                        <span className="text-green-98 font-inter mb-1">{name}</span>
                        <span className="text-green-95 font-inter text-sm">
                            {type === 'dog' ? ' Собака' : type === 'cat' ? ' Кошка' : ' Питомец'}
                        </span>
                        {color && (
                            <span className="text-green-95 font-inter text-xs mt-1">
                                Окрас: {color}
                            </span>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-1.5 md:gap-2 w-full px-2 sm:px-2 md:px-3 lg:px-4 relative -mt-2 sm:-mt-4 md:-mt-5 lg:-mt-6 mb-0 sm:mb-1 min-w-0">
                <div className="px-2 sm:px-2 md:px-2.5 lg:px-3 py-0.5 bg-green-90 rounded-full border-2 border-green-30 shadow-sm min-w-0 max-w-full overflow-hidden">
                    <span className="font-inter text-green-30 text-sm sm:text-xs md:text-sm lg:text-base truncate block">
                        {name}
                    </span>
                </div>
                <div className="flex w-6 h-6 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 items-center justify-center bg-green-90 rounded-full border-2 border-green-30 shadow-sm flex-shrink-0">
                    <span className={`text-sm sm:text-xs md:text-sm ${gender === "male" ? "text-blue-400" : "text-pink-400"}`}>
                        {gender === "male" ? "♂" : "♀"}
                    </span>
                </div>
                <div className="px-1.5 sm:px-1.5 md:px-2 py-0.5 bg-green-90 rounded-full border-2 border-green-30 shadow-sm flex-shrink-0">
                    <span className="font-inter text-green-30 text-sm sm:text-[10px] md:text-xs lg:text-sm">
                        {formatAge(age)}
                    </span>
                </div>
            </div>

            <div className="flex-1 px-1.5 sm:px-2 md:px-3 lg:px-4 py-0 sm:py-1 md:py-2 lg:py-3 flex flex-col justify-start gap-0.5 sm:gap-1 md:gap-1.5">
                {personality && (
                    <p className="text-green-40 text-sm sm:text-[10px] md:text-xs lg:text-sm font-inter line-clamp-2" title={personality}>
                        {personality}
                    </p>
                )}
                {shelter_name && (
                    <p className="text-green-50 text-sm sm:text-[10px] md:text-xs lg:text-sm font-inter truncate mt-0 sm:mt-auto">
                        {shelter_name}
                    </p>
                )}
            </div>

            <div className="flex flex-row w-full items-center gap-2 sm:gap-1.5 md:gap-2 px-3 sm:px-2 md:px-3 lg:px-4 mt-4 sm:mt-2 md:mt-3 lg:mt-3 pb-4 sm:pb-2 md:pb-2 lg:pb-3 pt-2 sm:pt-1">
                <Link
                    to={`/pet/${id}`}
                    className="text-green-98 flex items-center justify-center gap-1 sm:gap-1 md:gap-1.5 lg:gap-2 px-3 sm:px-2 md:px-2.5 lg:px-3 py-1.5 sm:py-1 md:py-1.5 lg:py-2 flex-1 bg-green-60 rounded-custom-small hover:bg-green-50 transition-colors shadow-sm text-sm sm:text-[10px] md:text-xs lg:text-[13px]"
                >
                    Познакомиться
                </Link>
                <button
                    onClick={handleFavoriteClick}
                    disabled={favoriteLoading}
                    className={`flex w-7 h-7 sm:w-6 sm:h-6 md:w-7 md:h-7 lg:w-8 lg:h-8 items-center justify-center rounded-custom-small transition-colors shadow-sm flex-shrink-0 ${
                        isFavorite 
                        ? 'bg-red-50 text-red-300 hover:bg-red-100' 
                        : 'bg-green-60 text-green-98 hover:bg-green-50'
                    } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
                >
                    {favoriteLoading ? (
                        <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 border-2 border-green-98 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg 
                            className={`w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 ${isFavorite ? 'fill-current' : 'stroke-current'}`}
                            fill={isFavorite ? "currentColor" : "none"}
                            strokeWidth={isFavorite ? 0 : 2}
                            viewBox="0 0 24 24"
                        >
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                    )}
                </button>
            </div>
        </article>
    );
};

export default PetCard;
