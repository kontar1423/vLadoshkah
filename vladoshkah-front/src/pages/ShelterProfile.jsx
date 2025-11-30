import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import PriutPhoto from '../assets/images/priut.jpg';
import PrilegPhoto from '../assets/images/prileg.png';
import PetCard from '../components/PetCard';
import FiltersP from '../components/Filters_priut';
import { shelterService } from '../services/shelterService';
import { animalService } from '../services/animalService';
import { favoriteService } from '../services/favoriteService';
import SheltersMap from '../components/SheltersMap';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const ShelterProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Проверка ID
  if (!id || isNaN(Number(id))) {
    return (
      <div className="min-h-screen bg-green-95 flex items-center justify-center">
        <div className="text-red-500 text-lg">Неверный ID приюта</div>
      </div>
    );
  }

  const [animalCount, setAnimalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [allPets, setAllPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [petsPerPage] = useState(8);
  const [showFilters, setShowFilters] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilters, setActiveFilters] = useState({});
  const [userRating, setUserRating] = useState(null);
  const [ratingStats, setRatingStats] = useState({ average: 0, totalRatings: 0 });
  const [isRatingLoading, setIsRatingLoading] = useState(false);
  const [favoritesMap, setFavoritesMap] = useState({});

  const [shelterData, setShelterData] = useState({
    id: null,
    name: "",
    rating: 0,
    description: "",
    contacts: {
      phone: "",
      telegram: "",
      whatsapp: "",
      email: ""
    },
    acceptsAnimalsFromOwners: false,
    photoUrl: null,
    photos: [],
    address: "",
    district: "", 
    districtId: ""
  });

  // Получение человекочитаемого названия фильтра
  const getFilterDisplayName = (filterKey, filterValue) => {
    const filterLabels = {
      type: {
        dog: 'Собаки',
        cat: 'Кошки',
        bird: 'Птицы',
        rodent: 'Грызуны',
        fish: 'Рыбы',
        reptile: 'Рептилии'
      },
      gender: {
        male: 'Мальчики',
        female: 'Девочки'
      },
      animal_size: {
        small: 'Маленькие',
        medium: 'Средние',
        large: 'Большие'
      },
      health: {
        healthy: 'Здоровые',
        needs_treatment: 'Требуют лечения',
        special_needs: 'Особые потребности'
      }
    };

    if (filterKey === 'age_min') return `От ${filterValue} ${getAgeWord(filterValue)}`;
    if (filterKey === 'age_max') return `До ${filterValue} ${getAgeWord(filterValue)}`;

    return filterLabels[filterKey]?.[filterValue] || filterValue;
  };

  const getAgeWord = (age) => {
    if (age % 10 === 1 && age % 100 !== 11) return 'год';
    if ([2, 3, 4].includes(age % 10) && ![12, 13, 14].includes(age % 100)) return 'года';
    return 'лет';
  };

  // Применение фильтров
  const applyFilters = useCallback((pets, filters) => {
    if (!filters || Object.keys(filters).length === 0) return pets;

    return pets.filter(pet => {
      // Тип животного
      if (filters.type && filters.type !== 'Все' && pet.type !== filters.type) return false;
      
      // Пол
      if (filters.gender && filters.gender !== 'Любой' && pet.gender !== filters.gender) return false;
      
      // Размер
      if (filters.animal_size && filters.animal_size !== 'Любой' && pet.animal_size !== filters.animal_size) return false;
      
      // Здоровье
      if (filters.health && filters.health !== 'Любое' && pet.health !== filters.health) return false;
      
      // Возраст
      if (filters.age_min !== undefined && pet.age < filters.age_min) return false;
      if (filters.age_max !== undefined && pet.age > filters.age_max) return false;
      
      return true;
    });
  }, []);

  // Обработчики фильтров
  const handleApplyFilters = (filters) => {
    setActiveFilters(filters);
    setShowFilters(false);
  };

  const handleResetFilters = () => {
    setActiveFilters({});
    setSearchTerm("");
  };

  // Навигация
  const goToApplication = () => {
    navigate('/Anketa_give', { state: { shelterId: id, shelterName: shelterData.name } });
  };

  const scrollToMap = () => {
    const mapSection = document.getElementById('shelter-map');
    if (mapSection) mapSection.scrollIntoView({ behavior: 'smooth' });
  };

  // Функция для безопасного преобразования в число
  const safeNumber = (value, defaultValue = 0) => {
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  };

  // Загрузка данных приюта
  const loadShelterData = useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError('');
      
      const [shelterRes, animalsRes] = await Promise.allSettled([
        shelterService.getShelterById(id),
        animalService.getAnimalsByShelter(id, forceRefresh)
      ]);

      if (shelterRes.status === 'rejected') throw shelterRes.reason;
      const shelter = shelterRes.value;

      let animals = [];
      if (animalsRes.status === 'fulfilled') {
        animals = animalsRes.value;
      } else {
        console.error('Ошибка загрузки животных:', animalsRes.reason);
      }

      // Используем рейтинг из данных приюта
      const avgRating = safeNumber(shelter.rating, 0);
      const totalRatings = safeNumber(shelter.total_ratings, 0);

      // Загрузка оценки пользователя из localStorage
      let userVote = null;
      if (isAuthenticated) {
        const userRatings = JSON.parse(localStorage.getItem('userShelterRatings') || '{}');
        userVote = userRatings[id] || null;
      }

      setShelterData({
        id: shelter.id,
        name: shelter.name || "Приют",
        rating: avgRating,
        description: shelter.description || "Описание приюта",
        contacts: {
          phone: shelter.phone || "Телефон не указан",
          telegram: shelter.telegram || "",
          whatsapp: shelter.whatsapp || "",
          email: shelter.email || ""
        },
        acceptsAnimalsFromOwners: shelter.can_adopt || shelter.accepts_animals || false,
        photoUrl: shelter.photoUrl || null,
        photos: shelter.photos || [],
        address: shelter.address || "",
        district: shelter.district || 'Москва',
        districtId: shelter.region || shelter.districtId || ""
      });

      setRatingStats({ 
        average: avgRating, 
        totalRatings: totalRatings 
      });
      setUserRating(userVote);

      const formattedPets = Array.isArray(animals) ? animals.map(animal => ({
        id: animal.id,
        name: animal.name || "Без имени",
        age: animal.age || 0,
        gender: animal.gender || "unknown",
        type: animal.type || "unknown",
        photos: animal.photos || [],
        personality: animal.personality || "",
        color: animal.color || "",
        animal_size: animal.animal_size || "medium",
        health: animal.health || "healthy",
        shelter_name: shelter.name
      })) : [];

      setAllPets(formattedPets);
      setFilteredPets(formattedPets);
      setAnimalCount(formattedPets.length);
      
      // Проверяем избранные для всех питомцев одним bulk запросом
      if (formattedPets.length > 0 && user?.id) {
        try {
          const animalIds = formattedPets.map(pet => pet.id);
          const favoritesResult = await favoriteService.checkFavoritesBulk(user.id, animalIds);
          setFavoritesMap(favoritesResult || {});
        } catch (favoritesError) {
          console.error('Error loading favorites:', favoritesError);
          setFavoritesMap({});
        }
      } else {
        setFavoritesMap({});
      }
    } catch (err) {
      console.error('Ошибка загрузки данных приюта:', err);
      setError('Не удалось загрузить данные приюта');
    } finally {
      setLoading(false);
    }
  }, [id, isAuthenticated, user?.id]);

  // Обновляем favoritesMap при изменении избранного
  useEffect(() => {
    const handleFavoritesUpdated = (event) => {
      const eventUserId = event.detail?.userId;
      const eventAnimalId = event.detail?.animalId;
      const eventIsFavorite = event.detail?.isFavorite;
      
      if (eventAnimalId && eventUserId === user?.id && eventIsFavorite !== undefined) {
        setFavoritesMap(prev => ({
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

  useEffect(() => {
    loadShelterData();
  }, [loadShelterData, id]);
  
  // Обновляем данные при фокусе на странице (возврат с другой страницы)
  useEffect(() => {
    const handleFocus = () => {
      console.log('ShelterProfile: Window focused, refreshing data with force refresh');
      loadShelterData(true); // Принудительное обновление при фокусе
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        console.log('ShelterProfile: Page visible, refreshing data with force refresh');
        loadShelterData(true); // Принудительное обновление при видимости
      }
    };

    // Обработчик события удаления питомца
    const handlePetDeleted = (event) => {
      const { petId, shelterId } = event.detail || {};
      const shelterIdNum = Number(shelterId);
      const currentShelterId = Number(id);
      
      if (shelterId && shelterIdNum === currentShelterId) {
        const petIdNum = Number(petId);
        console.log('ShelterProfile: Pet deleted event received, removing pet:', petId, 'Type:', typeof petId);
        // Немедленно удаляем питомца из состояния с правильным сравнением типов
        setAllPets(prev => {
          const filtered = prev.filter(pet => {
            const petIdToCompare = Number(pet.id);
            const shouldKeep = petIdToCompare !== petIdNum;
            if (!shouldKeep) {
              console.log('ShelterProfile: Filtering out pet:', pet.id, 'Type:', typeof pet.id);
            }
            return shouldKeep;
          });
          console.log('ShelterProfile: Updated allPets, removed pet:', petId, 'Previous count:', prev.length, 'New count:', filtered.length);
          return filtered;
        });
        setFilteredPets(prev => {
          const filtered = prev.filter(pet => Number(pet.id) !== petIdNum);
          console.log('ShelterProfile: Updated filteredPets, removed pet:', petId);
          return filtered;
        });
        setAnimalCount(prev => Math.max(0, prev - 1));
        // Обновляем favoritesMap
        setFavoritesMap(prev => {
          const updated = { ...prev };
          delete updated[petId];
          delete updated[petIdNum];
          return updated;
        });
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('petDeleted', handlePetDeleted);
    
    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('petDeleted', handlePetDeleted);
    };
  }, [loadShelterData, id]);
  
  // Обновляем данные при изменении ID приюта в URL
  useEffect(() => {
    if (id) {
      console.log('ShelterProfile: Shelter ID changed, reloading data');
      loadShelterData(true); // Принудительное обновление при смене ID
    }
  }, [id, loadShelterData]);

  // Поиск и фильтрация
  useEffect(() => {
    let filtered = [...allPets];
    
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(pet => 
        pet.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (Object.keys(activeFilters).length > 0) {
      filtered = applyFilters(filtered, activeFilters);
    }
    
    setFilteredPets(filtered);
    setAnimalCount(filtered.length);
    setCurrentPage(1);
  }, [searchTerm, allPets, activeFilters, applyFilters]);

  // Отправка оценки через правильный эндпоинт
  const handleRateShelter = async (rating) => {
    if (!isAuthenticated) {
      navigate('/войти');
      return;
    }

    setIsRatingLoading(true);
    try {
      const response = await api.post('/shelters/vote', {
        shelter_id: Number(id),
        vote: rating
      });

      console.log('Response from vote API:', response.data);

      // Сохраняем оценку пользователя в localStorage
      const userRatings = JSON.parse(localStorage.getItem('userShelterRatings') || '{}');
      
      // Определяем, это новая оценка или изменение существующей
      const isNewRating = userRatings[id] === undefined;
      userRatings[id] = rating;
      localStorage.setItem('userShelterRatings', JSON.stringify(userRatings));

      // Обновляем данные согласно ответу API
      const newRating = safeNumber(response.data.rating, ratingStats.average);
      
      // Правильно обновляем количество оценок
      // Если это новая оценка - увеличиваем счетчик, если изменение - оставляем прежним
      const newTotalRatings = isNewRating 
        ? ratingStats.totalRatings + 1 
        : ratingStats.totalRatings;

      setUserRating(rating);
      setRatingStats({
        average: newRating,
        totalRatings: newTotalRatings
      });

      // Обновляем данные приюта
      setShelterData(prev => ({
        ...prev,
        rating: newRating
      }));

    } catch (error) {
      console.error('Ошибка при оценке приюта:', error);
      if (error.response?.status === 409) {
        // Если пользователь уже оценивал, все равно обновляем оценку
        const response = await api.post('/shelters/vote', {
          shelter_id: Number(id),
          vote: rating
        });

        // Сохраняем оценку пользователя в localStorage
        const userRatings = JSON.parse(localStorage.getItem('userShelterRatings') || '{}');
        userRatings[id] = rating;
        localStorage.setItem('userShelterRatings', JSON.stringify(userRatings));

        // Обновляем данные
        const newRating = safeNumber(response.data.rating, ratingStats.average);
        
        setUserRating(rating);
        setRatingStats({
          average: newRating,
          totalRatings: ratingStats.totalRatings // Количество оценок не меняется при изменении
        });

        setShelterData(prev => ({
          ...prev,
          rating: newRating
        }));
      } else {
        alert('Не удалось отправить оценку. Попробуйте позже.');
      }
    } finally {
      setIsRatingLoading(false);
    }
  };

  // Компонент звезд для оценки
  const RatingStars = ({ currentRating, onRate, disabled = false, size = "medium" }) => {
    const [hoverRating, setHoverRating] = useState(0);
    
    const starSize = size === "large" ? "w-8 h-8 md:w-9 md:h-9" : "w-6 h-6 md:w-7 md:h-7";

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => !disabled && onRate(star)}
            onMouseEnter={() => !disabled && setHoverRating(star)}
            onMouseLeave={() => !disabled && setHoverRating(0)}
            disabled={disabled || isRatingLoading}
            className={`transition-transform duration-200 ${
              !disabled && !isRatingLoading ? 'hover:scale-110 cursor-pointer' : 'cursor-default'
            } ${isRatingLoading ? 'opacity-50' : ''}`}
            aria-label={`Оценить на ${star} звезд`}
          >
            <svg 
              className={`${starSize} ${
                star <= (hoverRating || currentRating) 
                  ? 'text-green-40 fill-current' 
                  : 'text-green-80 fill-current'
              }`} 
              viewBox="0 0 24 24"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
        ))}
      </div>
    );
  };

  // Статические звезды для отображения рейтинга
  const StaticStars = ({ rating, size = "medium" }) => {
    const safeRating = safeNumber(rating, 0);
    const stars = [];
    const fullStars = Math.floor(safeRating);
    const hasHalfStar = safeRating % 1 >= 0.5;
    const starSize = size === "large" ? "w-6 h-6 md:w-7 md:h-7" : "w-5 h-5 md:w-6 md:h-6";

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className={`${starSize} text-green-30 fill-current`} viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative">
            <svg className={`${starSize} text-green-80 fill-current`} viewBox="0 0 24 24">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            <div className="absolute top-0 left-0 overflow-hidden" style={{ width: '50%' }}>
              <svg className={`${starSize} text-green-30 fill-current`} viewBox="0 0 24 24">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
              </svg>
            </div>
          </div>
        );
      } else {
        stars.push(
          <svg key={i} className={`${starSize} text-green-80 fill-current`} viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      }
    }
    return stars;
  };

  // Пагинация
  const indexOfLastPet = currentPage * petsPerPage;
  const indexOfFirstPet = indexOfLastPet - petsPerPage;
  const currentPets = filteredPets.slice(indexOfFirstPet, indexOfLastPet);
  const totalPages = Math.ceil(filteredPets.length / petsPerPage);

  // Визуализация активных фильтров
  const activeFilterLabels = Object.entries(activeFilters)
    .filter(([_, value]) => value !== '' && value !== undefined && value !== null)
    .map(([key, value]) => getFilterDisplayName(key, value));

  if (loading) {
    return (
      <div className="min-h-screen bg-green-95 flex items-center justify-center">
        <div className="text-lg text-green-30">Загрузка данных приюта...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-green-95 flex items-center justify-center">
        <div className="text-red-500 text-lg">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-95 py-4 md:py-8">
      <FiltersP 
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
        onReset={handleResetFilters}
      />

      <div className="max-w-container mx-auto px-4 space-y-8">
        {/* Карточка приюта */}
        <div className="relative w-full max-w-[1260px] min-h-[400px] md:h-[400px] bg-green-90 rounded-custom overflow-hidden flex flex-col md:flex-row">
          <div className="relative w-full md:w-[350px] h-[180px] md:h-full flex-shrink-0">
            <img 
              src={shelterData.photoUrl || PriutPhoto} 
              alt={shelterData.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.style.display = 'none';
                const fallback = document.getElementById(`shelter-profile-fallback-${shelterData.id}`);
                if (fallback) fallback.style.display = 'flex';
              }}
            />
            
            <div 
              id={`shelter-profile-fallback-${shelterData.id}`}
              className={`w-full h-full bg-gradient-to-br from-green-70 to-green-60 items-center justify-center flex-col p-4 text-center ${shelterData.photoUrl ? 'hidden' : 'flex'}`}
            >
              <span className="text-green-98 font-sf-rounded font-bold text-xl mb-2">{shelterData.name}</span>
              <span className="text-green-95 font-inter">Приют для животных</span>
            </div>
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-green-90 to-transparent hidden md:block"></div>
          </div>

          <div className="flex-1 flex flex-col p-4 md:p-6 md:pl-6 md:pr-6 relative">
            {shelterData.acceptsAnimalsFromOwners && (
              <div className="absolute top-4 right-4 bg-green-90 bg-opacity-90 border-2 border-green-30 rounded-custom-small px-3 py-2 backdrop-blur-sm max-w-[200px]">
                <span className="font-inter font-medium text-green-30 text-xs sm:text-sm leading-tight">
                  Поддерживает возможность отдать питомца
                </span>
              </div>
            )}

            <div className="w-full flex-1">
              <header className="inline-flex flex-col items-start relative mb-3 md:mb-4 w-full pr-[220px] sm:pr-[240px] md:pr-[260px]">
                <h1 className="w-fit font-sf-rounded font-bold text-2xl md:text-4xl text-green-30 mb-2">
                  {shelterData.name}
                </h1>

                <div className="flex items-center gap-2 mb-4">
                  <div className="flex">
                    <StaticStars rating={ratingStats.average} />
                  </div>
                  <span className="font-inter font-medium text-green-30 text-sm">
                    {safeNumber(ratingStats.average).toFixed(1)} ({ratingStats.totalRatings} оценок)
                  </span>
                </div>
              </header>

              <p className="font-inter font-medium text-green-30 text-sm md:text-base leading-relaxed mb-4">
                {shelterData.description}
              </p>

              <div className="mb-4">
                <div className="space-y-1">
                  <div className="font-inter font-medium text-green-30 text-sm">
                    Телефон: {shelterData.contacts.phone}
                  </div>
                  {shelterData.contacts.telegram && (
                    <div className="font-inter font-medium text-green-30 text-sm">
                      Telegram: {shelterData.contacts.telegram}
                    </div>
                  )}
                  {shelterData.contacts.whatsapp && (
                    <div className="font-inter font-medium text-green-30 text-sm">
                      WhatsApp: {shelterData.contacts.whatsapp}
                    </div>
                  )}
                  {shelterData.contacts.email && (
                    <div className="font-inter font-medium text-green-30 text-sm">
                      Email: {shelterData.contacts.email}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="w-full mt-auto pt-4">
              <button
                className="all-[unset] box-border flex h-11 items-center justify-center gap-2 px-6 py-3 bg-green-70 rounded-custom-small hover:bg-green-80 transition-colors cursor-pointer w-full"
                onClick={scrollToMap}
              >
                <span className="relative w-fit font-inter font-medium text-green-20 text-base">
                  Показать на карте
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* БЛОК ОЦЕНКИ ПРИЮТА */}
        <div className="w-full max-w-[1260px] mx-auto">
          <div className="bg-green-90 rounded-custom p-6 border-2 border-green-70">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-4">
                  Оцените приют
                </h3>
                
                {userRating ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex">
                        <StaticStars rating={userRating} size="large" />
                      </div>
                      <span className="font-inter font-semibold text-green-30">
                        Ваша оценка: {userRating}
                      </span>
                    </div>
                    <p className="font-inter text-green-40 text-sm">
                      Спасибо за вашу оценку! Вы можете изменить её в любой момент.
                    </p>
                    <div className="flex items-center gap-2">
                      <span className="font-inter text-green-30 text-sm">Изменить оценку:</span>
                      <RatingStars 
                        currentRating={userRating} 
                        onRate={handleRateShelter}
                        size="medium"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <RatingStars 
                        currentRating={0} 
                        onRate={handleRateShelter}
                        disabled={!isAuthenticated}
                        size="large"
                      />
                      {!isAuthenticated && (
                        <span className="font-inter text-green-40 text-sm">
                          Войдите в аккаунт, чтобы оценить приют
                        </span>
                      )}
                    </div>
                    {isAuthenticated && (
                      <p className="font-inter text-green-40 text-sm">
                        Нажмите, чтобы оценить приют 
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Остальной код остается без изменений */}
        <section className="bg-green-95 rounded-custom p-6 w-full max-w-[1160px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 w-full">
            <div className="w-full lg:w-auto text-center lg:text-left">
              <span className="font-sf-rounded font-bold text-green-30 text-2xl md:text-4xl">
                <strong className="text-green-30">{animalCount}</strong> питомцев
              </span>
            </div>

            <div className="w-full lg:w-auto">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск животных..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full lg:w-80 px-4 py-3 bg-green-95 border-2 border-green-40 rounded-custom font-inter text-green-40 placeholder-green-40 focus:outline-none focus:border-green-40"
                />
                <svg 
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-green-40"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        {/* Кнопка фильтров и активные фильтры */}
        <div className="flex flex-wrap items-center gap-2.5 p-[15px] relative bg-green-90 rounded-custom w-full max-w-[1260px] mx-auto">
          <button
            onClick={() => setShowFilters(true)}
            className="inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-green-70 rounded-custom-small hover:bg-green-80 transition-colors cursor-pointer"
          >
            <svg 
              className="relative w-6 h-6 aspect-[1] text-green-20"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
            </svg>
            <span className="relative w-fit mt-[-1.00px] font-inter font-medium text-green-20 text-base">
              Фильтры
            </span>
          </button>

          {/* Активные фильтры рядом с кнопкой */}
          {activeFilterLabels.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {activeFilterLabels.map((label, index) => (
                <div key={index} className="bg-green-70 rounded-custom-small px-3 py-1 flex items-center gap-2">
                  <span className="font-inter text-green-20 text-sm">{label}</span>
                </div>
              ))}
              <button
                onClick={handleResetFilters}
                className="text-green-60 hover:text-green-40 transition-colors font-inter text-sm underline"
              >
                Сбросить
              </button>
            </div>
          )}
        </div>

        {/* Список питомцев */}
        <section className="w-full max-w-[1260px] mx-auto">
          {allPets.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentPets.map((pet) => (
                  <PetCard 
                    key={pet.id} 
                    petData={pet}
                    initialFavorite={favoritesMap[pet.id] === true}
                  />
                ))}
              </div>

              {filteredPets.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                  <div className="bg-green-90 rounded-custom-small px-6 py-3">
                    <span className="font-inter font-medium text-green-30">
                      Страница {currentPage} из {totalPages} • Показано {currentPets.length} из {filteredPets.length} питомцев
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center w-10 h-10 rounded-custom-small ${
                        currentPage === 1 
                          ? 'bg-green-80 text-green-60 cursor-not-allowed' 
                          : 'bg-green-70 text-green-20 hover:bg-green-60 cursor-pointer'
                      } transition-colors`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const page = currentPage <= 3 
                          ? i + 1 
                          : currentPage >= totalPages - 2 
                            ? totalPages - 4 + i 
                            : currentPage - 2 + i;
                        if (page < 1 || page > totalPages) return null;
                        return (
                          <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-10 h-10 rounded-custom-small font-inter font-medium transition-colors ${
                              page === currentPage
                                ? 'bg-green-70 text-green-20'
                                : 'bg-green-90 text-green-30 hover:bg-green-80'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      })}
                    </div>

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center w-10 h-10 rounded-custom-small ${
                        currentPage === totalPages 
                          ? 'bg-green-80 text-green-60 cursor-not-allowed' 
                          : 'bg-green-70 text-green-20 hover:bg-green-60 cursor-pointer'
                      } transition-colors`}
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <div className="bg-green-90 rounded-custom p-8 max-w-md mx-auto">
                <svg 
                  className="w-16 h-16 text-green-60 mx-auto mb-4"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-2">
                  В приюте пока нет животных
                </h3>
                <p className="font-inter text-green-20">
                  В этом приюте еще не добавлены животные для усыновления.
                </p>
              </div>
            </div>
          )}

          {filteredPets.length === 0 && allPets.length > 0 && (
            <div className="text-center py-12">
              <div className="bg-green-90 rounded-custom p-8 max-w-md mx-auto">
                <svg 
                  className="w-16 h-16 text-green-60 mx-auto mb-4"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-2">
                  Питомцы не найдены
                </h3>
                <p className="font-inter text-green-20 mb-4">
                  По вашим фильтрам питомцы не найдены. Попробуйте изменить параметры поиска.
                </p>
                <button
                  onClick={handleResetFilters}
                  className="px-4 py-2 bg-green-70 text-green-20 rounded-custom-small hover:bg-green-60 transition-colors"
                >
                  Сбросить фильтры
                </button>
              </div>
            </div>
          )}
        </section>

        <section id="shelter-map" className="w-full mt-12">
          <div className="max-w-[1260px] mx-auto mb-6 text-center">
            <h2 className="font-sf-rounded font-bold text-2xl md:text-3xl text-green-30">
              Приют на карте
            </h2>
            {shelterData.address && (
              <p className="font-inter text-green-40 text-lg mt-2">
                Адрес: {shelterData.address}
              </p>
            )}
          </div>

          <div className="w-full bg-green-90 border-2 border-green-40 rounded-custom overflow-hidden relative z-10">
            <div className="w-full h-[400px] md:h-[500px] relative z-10">
              {shelterData.address ? (
                <SheltersMap shelters={[shelterData]} />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-green-85">
                  <p className="font-inter text-green-30 text-lg">Адрес приюта не указан</p>
                </div>
              )}
            </div>
          </div>
        </section>

        {shelterData.acceptsAnimalsFromOwners && (
          <section className="w-full max-w-[1260px] mx-auto mt-12">
            <div className="bg-green-90 bg-opacity-50 rounded-custom p-6 md:p-8 backdrop-blur-sm border-2 border-green-40">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="w-full md:w-1/3 flex justify-center">
                  <img 
                    src={PrilegPhoto} 
                    alt="Спит" 
                    className="max-w-full h-auto"
                  />
                </div>
                
                <div className="w-full md:w-2/3 text-center">
                  <h3 className="font-sf-rounded font-bold text-green-30 text-xl md:text-2xl mb-4">
                    Заявка на отправление животного на передержку/отдать животное навсегда
                  </h3>
                  
                  <button
                    onClick={goToApplication}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-transparent border-2 border-green-40 text-green-40 rounded-custom-small hover:bg-green-40 hover:text-green-95 transition-all duration-300 font-inter font-medium"
                  >
                    <span>Заполнить заявку</span>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default ShelterProfile;