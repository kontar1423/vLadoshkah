import React, { useEffect, useRef, useState } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { favoriteService } from '../services/favoriteService';

const PetCard = ({ petData, initialFavorite = false }) => {
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
    const lastCheckRef = useRef({ userId: null, animalId: null });

    const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL || 'http://172.29.8.236:9000/uploads';

    // 🔥 НОВАЯ ФУНКЦИЯ: Получение ключа для localStorage с привязкой к пользователю
    const getFavoriteStorageKey = () => {
        const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
        return currentUser ? `favoritePets_${currentUser.id}` : 'favoritePets_anonymous';
    };

    const formatAge = (age) => {
        if (typeof age === 'number') {
            if (age < 1) return "Меньше года";
            if (age === 1) return "1 год";
            if (age < 5) return `${age} года`;
            return `${age} лет`;
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

    // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Работа с избранными с привязкой к пользователю
    const handleFavoriteClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        const token = localStorage.getItem('accessToken');
        const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
        
        console.log('❤️ Favorite Click Debug:', {
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
            const storageKey = getFavoriteStorageKey();
            
            if (isFavorite) {
                // Удаляем из избранного
                await favoriteService.removeFavorite(currentUser.id, id);
                setIsFavorite(false);
                console.log('✅ PetCard: Removed from favorites');
                
                // 🔥 ИСПРАВЛЕНИЕ: Обновляем localStorage с привязкой к пользователю
                const favorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
                const updatedFavorites = favorites.filter(favId => favId !== id);
                localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));
            } else {
                // Добавляем в избранное
                await favoriteService.addFavorite(currentUser.id, id);
                setIsFavorite(true);
                console.log('✅ PetCard: Added to favorites');
                
                // 🔥 ИСПРАВЛЕНИЕ: Обновляем localStorage с привязкой к пользователю
                const favorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
                if (!favorites.includes(id)) {
                    favorites.push(id);
                    localStorage.setItem(storageKey, JSON.stringify(favorites));
                }
            }

            window.dispatchEvent(new CustomEvent('favoritesUpdated', { 
                detail: { userId: currentUser.id } 
            }));
            console.log('📢 PetCard: Sent favoritesUpdated event');

        } catch (error) {
            console.error('❌ PetCard: Error updating favorite:', error);
            alert('Не удалось обновить избранное');
        } finally {
            setFavoriteLoading(false);
        }
    };

    // 🔥 ИСПРАВЛЕННЫЙ useEffect: Проверяем избранное с привязкой к пользователю
    useEffect(() => {
        let cancelled = false;

        // Если заранее знаем, что карточка в избранном (например, в профиле), не дергаем API
        if (initialFavorite) {
            setIsFavorite(true);
            return () => {
                cancelled = true;
            };
        }

        const checkFavoriteStatus = async () => {
            const currentUser = user || JSON.parse(localStorage.getItem('user') || 'null');
            
            if (!currentUser?.id || !id) return;

            // Защита от лишних запросов
            const alreadyChecked =
                lastCheckRef.current.userId === currentUser.id &&
                lastCheckRef.current.animalId === id;
            if (alreadyChecked) return;

            lastCheckRef.current = { userId: currentUser.id, animalId: id };

            try {
                console.log('🔍 Checking favorite status for:', {
                    userId: currentUser.id,
                    petId: id
                });
                
                const result = await favoriteService.checkFavorite(currentUser.id, id);
                if (cancelled) return;
                setIsFavorite(result.isFavorite);
                
                // 🔥 ИСПРАВЛЕНИЕ: Синхронизируем с localStorage с привязкой к пользователю
                const storageKey = getFavoriteStorageKey();
                const favorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
                
                if (result.isFavorite && !favorites.includes(id)) {
                    favorites.push(id);
                    localStorage.setItem(storageKey, JSON.stringify(favorites));
                } else if (!result.isFavorite && favorites.includes(id)) {
                    const updatedFavorites = favorites.filter(favId => favId !== id);
                    localStorage.setItem(storageKey, JSON.stringify(updatedFavorites));
                }
            } catch (error) {
                if (cancelled) return;
                console.error('❌ PetCard: Error checking favorite status:', error);
                // Fallback на localStorage с привязкой к пользователю
                const storageKey = getFavoriteStorageKey();
                const favorites = JSON.parse(localStorage.getItem(storageKey) || '[]');
                setIsFavorite(favorites.includes(id));
            }
        };

        checkFavoriteStatus();

        return () => {
            cancelled = true;
        };
    }, [user?.id, id, initialFavorite]);

    const mainPhoto = photos.length > 0 ? photos[0] : null;
    const photoUrl = mainPhoto ? getPhotoUrl(mainPhoto) : null;

    return (
        <article 
            className="flex flex-col w-full max-w-[320px] h-[420px] bg-green-90 rounded-custom-small shadow-lg overflow-hidden transform transition-transform duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl"
            aria-label={`Карточка питомца ${name}`}
        >
            {/* Остальная разметка без изменений */}
            <div className="relative w-full aspect-square bg-gray-100 rounded-t-custom-small overflow-hidden">
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

            <div className="flex items-center gap-2 w-full px-4 relative -mt-6">
                <div className="px-3 py-1 bg-green-90 rounded-full border-2 border-green-30 shadow-sm">
                    <span className="font-inter text-green-30 text-sm md:text-base">
                        {name}
                    </span>
                </div>
                <div className="flex w-8 h-8 items-center justify-center bg-green-90 rounded-full border-2 border-green-30 shadow-sm">
                    <span className={`text-sm ${gender === "male" ? "text-blue-400" : "text-pink-400"}`}>
                        {gender === "male" ? "♂" : "♀"}
                    </span>
                </div>
                <div className="px-2 py-1 bg-green-90 rounded-full border-2 border-green-30 shadow-sm">
                    <span className="font-inter text-green-30 text-xs md:text-sm">
                        {formatAge(age)}
                    </span>
                </div>
            </div>

            <div className="flex-1 px-4 py-4 min-h-[72px] flex flex-col justify-start">
                {personality && (
                    <p className="text-green-40 text-xs font-inter line-clamp-3 mb-1">
                        {personality}
                    </p>
                )}
                {shelter_name && (
                    <p className="text-green-50 text-xs font-inter mt-auto">
                        {shelter_name}
                    </p>
                )}
            </div>

            <div className="flex w-full items-center gap-2 px-4 pb-4 pt-1">
                <Link
                    to={`/питомец/${id}`}
                    className="text-green-98 flex items-center justify-center gap-2 px-3 py-2 flex-1 bg-green-60 rounded-custom-small hover:bg-green-50 transition-colors shadow-sm text-[13px]"
                >
                    Познакомиться
                </Link>
                <button
                    onClick={handleFavoriteClick}
                    disabled={favoriteLoading}
                    className={`flex w-8 h-8 items-center justify-center rounded-custom-small transition-colors shadow-sm ${
                        isFavorite 
                        ? 'bg-red-50 text-red-300 hover:bg-red-100' 
                        : 'bg-green-60 text-green-98 hover:bg-green-50'
                    } ${favoriteLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
                >
                    {favoriteLoading ? (
                        <div className="w-4 h-4 border-2 border-green-98 border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <svg 
                            className={`w-4 h-4 ${isFavorite ? 'fill-current' : 'stroke-current'}`}
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