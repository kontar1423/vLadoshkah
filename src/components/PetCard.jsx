import React, { useState } from "react";
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const PetCard = ({ petData }) => {
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
    const [isFavorite, setIsFavorite] = useState(false);

    // Базовый URL для загрузки фото
    const UPLOADS_BASE_URL = import.meta.env.VITE_UPLOADS_BASE_URL || 'http://172.29.8.236:9000/uploads';

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

    // Получение URL первой фотографии
    const getPhotoUrl = (photo) => {
        if (!photo) return null;
        
        if (photo.url) {
            // Если URL уже полный
            if (photo.url.startsWith('http')) {
                return photo.url;
            }
            // Если URL относительный
            return `${UPLOADS_BASE_URL}${photo.url.startsWith('/') ? '' : '/'}${photo.url}`;
        }
        
        if (photo.object_name) {
            return `${UPLOADS_BASE_URL}/${photo.object_name}`;
        }
        
        return null;
    };

    // Обработчик добавления/удаления из избранного
    const handleFavoriteClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!user) {
            // Если пользователь не авторизован, можно показать модальное окно или перенаправить на вход
            alert('Пожалуйста, войдите в систему чтобы добавить питомца в избранное');
            return;
        }

        try {
            if (isFavorite) {
                // Удаляем из избранного
                await removeFromFavorites(id);
                setIsFavorite(false);
            } else {
                // Добавляем в избранное
                await addToFavorites(id);
                setIsFavorite(true);
            }
        } catch (error) {
            console.error('Ошибка при работе с избранным:', error);
            alert('Не удалось обновить избранное');
        }
    };

    // Функция для добавления в избранное (заглушка - нужно реализовать API)
    const addToFavorites = async (petId) => {
        // TODO: Реализовать вызов API для добавления в избранное
        console.log('Добавляем питомца в избранное:', petId);
        
        // Временное сохранение в localStorage
        const favorites = JSON.parse(localStorage.getItem('favoritePets') || '[]');
        if (!favorites.includes(petId)) {
            favorites.push(petId);
            localStorage.setItem('favoritePets', JSON.stringify(favorites));
        }
    };

    // Функция для удаления из избранного (заглушка - нужно реализовать API)
    const removeFromFavorites = async (petId) => {
        // TODO: Реализовать вызов API для удаления из избранного
        console.log('Удаляем питомца из избранного:', petId);
        
        // Временное удаление из localStorage
        const favorites = JSON.parse(localStorage.getItem('favoritePets') || '[]');
        const updatedFavorites = favorites.filter(favId => favId !== petId);
        localStorage.setItem('favoritePets', JSON.stringify(updatedFavorites));
    };

    // Проверяем при загрузке, есть ли питомец в избранном
    React.useEffect(() => {
        if (user && id) {
            const favorites = JSON.parse(localStorage.getItem('favoritePets') || '[]');
            setIsFavorite(favorites.includes(id));
        }
    }, [user, id]);

    // Получение первой фотографии
    const mainPhoto = photos.length > 0 ? photos[0] : null;
    const photoUrl = mainPhoto ? getPhotoUrl(mainPhoto) : null;

    return (
        <article 
            className="flex flex-col h-full min-h-[400px] bg-green-90 rounded-custom-small shadow-lg overflow-hidden transform transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl"
            aria-label={`Карточка питомца ${name}`}
        >
            {/* Контейнер для фотографии с градиентным переходом */}
            <div className="relative flex-1 bg-gray-100 rounded-t-custom-small overflow-hidden">
                {photoUrl ? (
                    <>
                        <img
                            className="w-full h-full min-h-[280px] object-cover rounded-t-custom-small"
                            alt={`Фотография ${name}`}
                            src={photoUrl}
                            onError={(e) => {
                                e.target.style.display = 'none';
                                // Показываем fallback если фото не загрузилось
                                const fallback = e.target.nextSibling;
                                if (fallback) fallback.style.display = 'flex';
                            }}
                        />
                        {/* Fallback если фото не загрузилось */}
                        <div 
                            className="hidden w-full h-full min-h-[280px] bg-gradient-to-br from-green-70 to-green-60 rounded-t-custom-small items-center justify-center flex-col p-4"
                        >
                            <span className="text-green-98 font-inter text-center mb-2">{name}</span>
                            <span className="text-green-95 font-inter text-sm text-center">
                                {type === 'dog' ? '🐕 Собака' : '🐈 Кошка'}
                            </span>
                        </div>
                        {/* Градиентный переход от фото к фону карточки */}
                        <div className="absolute bottom-0 left-0 w-full h-14 bg-gradient-to-t from-green-90 to-transparent"></div>
                    </>
                ) : (
                    <div 
                        className="w-full h-full min-h-[280px] bg-gradient-to-br from-green-70 to-green-60 rounded-t-custom-small flex items-center justify-center flex-col p-4"
                        aria-label="Заглушка для фотографии"
                    >
                        <span className="text-green-98 font-inter text-center mb-2">{name}</span>
                        <span className="text-green-95 font-inter text-sm text-center">
                            {type === 'dog' ? '🐕 Собака' : type === 'cat' ? '🐈 Кошка' : '🐾 Питомец'}
                        </span>
                        {color && (
                            <span className="text-green-95 font-inter text-xs text-center mt-1">
                                Окрас: {color}
                            </span>
                        )}
                    </div>
                )}
            </div>

            {/* Информация о питомце - выровнена по левому краю */}
            <div 
                className="flex items-center gap-2 w-full px-4 relative -mt-6"
                role="group"
                aria-label="Информация о питомце"
            >
                {/* Имя питомца в круглом окошке */}
                <div className="inline-flex items-center justify-center gap-1">
                    <div className="px-3 py-1 bg-green-90 rounded-full border-2 border-green-30 shadow-sm">
                        <span className="font-inter font-regular text-green-30 text-[16px] md:text-[18px] tracking-[0] leading-[normal]">
                            {name}
                        </span>
                    </div>
                </div>

                {/* Пол питомца */}
                <div
                    className="flex w-8 h-8 md:w-[37px] md:h-[37px] items-center justify-center bg-green-90 rounded-full border-2 border-green-30 shadow-sm"
                    aria-label={gender === "male" ? "Самец" : "Самка"}
                    title={gender === "male" ? "Самец" : "Самка"}
                >
                    <span className={`text-sm md:text-base font-regular ${
                        gender === "male" ? "text-blue-400" : "text-pink-400"
                    }`}>
                        {gender === "male" ? "♂" : "♀"}
                    </span>
                </div>

                {/* Возраст питомца */}
                <div
                    className="inline-flex justify-center px-2 py-1 md:px-3 md:py-2 bg-green-90 rounded-full border-2 border-green-30 shadow-sm"
                    aria-label="Возраст"
                >
                    <span className="relative w-fit font-inter font-regular text-green-30 text-[12px] md:text-[14px] tracking-[0] leading-[normal]">
                        {formatAge(age)}
                    </span>
                </div>
            </div>

            {/* Дополнительная информация */}
            {(personality || shelter_name) && (
                <div className="px-4 py-2">
                    {personality && (
                        <p className="text-green-40 text-xs font-inter line-clamp-2 mb-1">
                            {personality}
                        </p>
                    )}
                    {shelter_name && (
                        <p className="text-green-50 text-xs font-inter">
                            {shelter_name}
                        </p>
                    )}
                </div>
            )}

            {/* Кнопки действий */}
            <div className="flex w-full items-center gap-2 px-4 pb-4 pt-2">
                <Link
                    to={`/питомец/${id}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 md:px-5 md:py-2.5 flex-1 bg-green-60 rounded-custom-small hover:bg-green-50 transition-colors shadow-sm"
                    aria-label={`Познакомиться с ${name}`}
                >
                    <span className="font-sf-rounded font-large text-green-98 text-[14px] md:text-[16px] tracking-[0] leading-[normal]">
                        Познакомиться
                    </span>
                </Link>
                
                <button
                    onClick={handleFavoriteClick}
                    className={`flex w-8 h-8 md:w-[40px] md:h-[40px] items-center justify-center rounded-custom-small transition-colors shadow-sm ${
                        isFavorite 
                            ? 'bg-red-50 text-red-500 hover:bg-red-100' 
                            : 'bg-green-60 text-green-98 hover:bg-green-50'
                    }`}
                    type="button"
                    aria-label={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
                    title={isFavorite ? "Удалить из избранного" : "Добавить в избранное"}
                >
                    <svg 
                        className={`w-5 h-5 ${isFavorite ? 'fill-current' : 'stroke-current'}`}
                        fill={isFavorite ? "currentColor" : "none"}
                        strokeWidth={isFavorite ? 0 : 2}
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                </button>
            </div>
        </article>
    );
};

export default PetCard;