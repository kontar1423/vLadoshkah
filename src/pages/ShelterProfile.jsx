import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import PriutPhoto from '../assets/images/priut.jpg';
import PrilegPhoto from '../assets/images/prileg.png';
import PetCard from '../components/PetCard';
import FiltersP from '../components/Filters_priut.jsx';
import { shelterService } from '../services/shelterService';
import { animalService } from '../services/animalService';

const ShelterProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
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

  // Функция для получения читаемого названия фильтра
  const getFilterDisplayName = (filterKey, filterValue) => {
    const filterLabels = {
      type: {
        dog: 'Собаки',
        cat: 'Кошки'
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

    if (filterKey === 'age_min' || filterKey === 'age_max') {
      return `${filterValue} ${getAgeWord(filterValue)}`;
    }

    return filterLabels[filterKey]?.[filterValue] || filterValue;
  };

  // Функция для склонения слова "год"
  const getAgeWord = (age) => {
    if (age % 10 === 1 && age % 100 !== 11) return 'год';
    if ([2, 3, 4].includes(age % 10) && ![12, 13, 14].includes(age % 100)) return 'года';
    return 'лет';
  };

  // Функция для форматирования отображения фильтров
  const formatActiveFilters = () => {
    const filterEntries = Object.entries(activeFilters).filter(([_, value]) => 
      value !== '' && value !== undefined && value !== null
    );

    if (filterEntries.length === 0) return null;

    // Обрабатываем возраст отдельно
    const ageFilters = {};
    const otherFilters = {};

    filterEntries.forEach(([key, value]) => {
      if (key === 'age_min' || key === 'age_max') {
        ageFilters[key] = value;
      } else {
        otherFilters[key] = value;
      }
    });

    const displayFilters = [];

    // Объединяем возрастные фильтры
    if (ageFilters.age_min !== undefined && ageFilters.age_max !== undefined) {
      displayFilters.push(`Возраст: ${ageFilters.age_min}-${ageFilters.age_max} ${getAgeWord(ageFilters.age_max)}`);
    } else if (ageFilters.age_min !== undefined) {
      displayFilters.push(`Возраст: от ${ageFilters.age_min} ${getAgeWord(ageFilters.age_min)}`);
    } else if (ageFilters.age_max !== undefined) {
      displayFilters.push(`Возраст: до ${ageFilters.age_max} ${getAgeWord(ageFilters.age_max)}`);
    }

    // Добавляем остальные фильтры
    Object.entries(otherFilters).forEach(([key, value]) => {
      displayFilters.push(getFilterDisplayName(key, value));
    });

    return displayFilters;
  };

  const [shelterData, setShelterData] = useState({
    name: "",
    rating: 4.5,
    description: "",
    contacts: {
      phone: "",
      telegram: "",
      whatsapp: "",
      email: ""
    },
    acceptsAnimalsFromOwners: false
  });

  useEffect(() => {
    loadShelterData();
  }, [id]);

  const loadShelterData = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Загрузка данных приюта с ID:', id);
      
      // Загружаем данные приюта
      const shelter = await shelterService.getShelterById(id);
      console.log('Данные приюта:', shelter);
      
      // Загружаем животных приюта
      let animals = [];
      try {
        animals = await animalService.getAnimalsByShelter(id);
        console.log('Животные приюта:', animals);
      } catch (animalError) {
        console.error('Ошибка загрузки животных:', animalError);
        animals = [];
      }

      // Обновляем данные приюта
      setShelterData(prev => ({
        name: shelter.name || "Приют",
        rating: 4.5,
        description: shelter.description || "Описание приюта",
        contacts: {
          phone: shelter.phone || "Телефон не указан",
          telegram: shelter.telegram || "",
          whatsapp: shelter.whatsapp || "",
          email: shelter.email || ""
        },
        acceptsAnimalsFromOwners: shelter.can_adopt || false
      }));

      // Форматируем животных для PetCard
      const formattedPets = Array.isArray(animals) ? animals.map(animal => {
        console.log('Обрабатываем животное:', animal);
        
        return {
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
        };
      }) : [];

      console.log('Форматированные животные:', formattedPets);
      
      setAllPets(formattedPets);
      setFilteredPets(formattedPets);
      setAnimalCount(formattedPets.length);

    } catch (err) {
      console.error('Ошибка загрузки данных приюта:', err);
      setError('Не удалось загрузить данные приюта');
      
      // Устанавливаем пустые массивы при ошибке
      setAllPets([]);
      setFilteredPets([]);
      setAnimalCount(0);
    } finally {
      setLoading(false);
    }
  };

  // Обработчик применения фильтров
  const handleApplyFilters = (filters) => {
    console.log("Applied filters:", filters);
    setActiveFilters(filters);
    
    let filtered = [...allPets];

    // Фильтрация по типу животного
    if (filters.type && filters.type !== '') {
      filtered = filtered.filter(pet => {
        if (filters.type === 'dog') return pet.type === 'dog';
        if (filters.type === 'cat') return pet.type === 'cat';
        return true;
      });
    }

    // Фильтрация по полу
    if (filters.gender && filters.gender !== '') {
      filtered = filtered.filter(pet => pet.gender === filters.gender);
    }

    // Фильтрация по размеру
    if (filters.animal_size && filters.animal_size !== '') {
      filtered = filtered.filter(pet => pet.animal_size === filters.animal_size);
    }

    // Фильтрация по возрасту
    if (filters.age_min !== undefined) {
      filtered = filtered.filter(pet => pet.age >= filters.age_min);
    }
    if (filters.age_max !== undefined) {
      filtered = filtered.filter(pet => pet.age <= filters.age_max);
    }

    // Фильтрация по здоровью
    if (filters.health && filters.health !== '') {
      filtered = filtered.filter(pet => pet.health === filters.health);
    }

    setFilteredPets(filtered);
    setAnimalCount(filtered.length);
    setCurrentPage(1);
  };

  // Поиск по имени животного
  useEffect(() => {
    let filtered = [...allPets];
    
    // Фильтрация по поиску
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(pet => 
        pet.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Применяем активные фильтры
    if (Object.keys(activeFilters).length > 0) {
      filtered = applyFilters(filtered, activeFilters);
    }
    
    setFilteredPets(filtered);
    setAnimalCount(filtered.length);
    setCurrentPage(1);
  }, [searchTerm, allPets, activeFilters]);

  // Вспомогательная функция для применения фильтров
  const applyFilters = (pets, filters) => {
    if (!filters || Object.keys(filters).length === 0) return pets;

    let filtered = [...pets];

    if (filters.type && filters.type !== '') {
      if (filters.type === 'dog') {
        filtered = filtered.filter(pet => pet.type === 'dog');
      } else if (filters.type === 'cat') {
        filtered = filtered.filter(pet => pet.type === 'cat');
      }
    }

    if (filters.gender && filters.gender !== '') {
      filtered = filtered.filter(pet => pet.gender === filters.gender);
    }

    if (filters.animal_size && filters.animal_size !== '') {
      filtered = filtered.filter(pet => pet.animal_size === filters.animal_size);
    }

    if (filters.health && filters.health !== '') {
      filtered = filtered.filter(pet => pet.health === filters.health);
    }

    if (filters.age_min !== undefined) {
      filtered = filtered.filter(pet => pet.age >= filters.age_min);
    }

    if (filters.age_max !== undefined) {
      filtered = filtered.filter(pet => pet.age <= filters.age_max);
    }

    return filtered;
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setActiveFilters({});
    setSearchTerm("");
    setFilteredPets(allPets);
    setAnimalCount(allPets.length);
    setCurrentPage(1);
  };

  const goToApplication = () => {
    navigate('/Anketa_give', { state: { shelterId: id, shelterName: shelterData.name } });
  };

  const scrollToMap = () => {
    const mapSection = document.getElementById('shelter-map');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const indexOfLastPet = currentPage * petsPerPage;
  const indexOfFirstPet = indexOfLastPet - petsPerPage;
  const currentPets = filteredPets.slice(indexOfFirstPet, indexOfLastPet);
  const totalPages = Math.ceil(filteredPets.length / petsPerPage);

  const nextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="w-5 h-5 md:w-6 md:h-6 text-green-30 fill-current" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <svg key={i} className="w-5 h-5 md:w-6 md:h-6 text-green-30 fill-current" viewBox="0 0 24 24">
            <defs>
              <linearGradient id="half-star">
                <stop offset="50%" stopColor="currentColor"/>
                <stop offset="50%" stopColor="#D1D5DB"/>
              </linearGradient>
            </defs>
            <path fill="url(#half-star)" d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      } else {
        stars.push(
          <svg key={i} className="w-5 h-5 md:w-6 md:h-6 text-green-80 fill-current" viewBox="0 0 24 24">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
          </svg>
        );
      }
    }
    return stars;
  };

  const activeFilterLabels = formatActiveFilters();

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
        {/* Основная информация о приюте */}
        <article className="relative w-full max-w-[1260px] min-h-[400px] md:h-[400px] bg-green-90 rounded-custom overflow-hidden flex flex-col md:flex-row">
          
          {shelterData.acceptsAnimalsFromOwners && (
            <div className="absolute top-4 right-6 z-20 bg-green-90 bg-opacity-90 border-2 border-green-30 rounded-custom-small px-4 py-2 backdrop-blur-sm">
              <span className="font-inter font-medium text-green-30 text-sm">
                Поддерживает возможность отдать питомца
              </span>
            </div>
          )}

          <div className="relative w-full md:w-[350px] h-[180px] md:h-full flex-shrink-0">
            <img 
              src={PriutPhoto} 
              alt={shelterData.name}
              className="w-full h-full object-cover"
            />
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-green-90 to-transparent hidden md:block"></div>
          </div>

          <div className="flex-1 flex flex-col items-start justify-between p-4 md:p-6 md:pl-6 md:pr-6">
            <div className="w-full">
              <header className="inline-flex flex-col items-start relative mb-3 md:mb-4 w-full">
                <h1 className="w-fit font-sf-rounded font-bold text-2xl md:text-4xl text-green-30 mb-2">
                  {shelterData.name}
                </h1>

                <div className="flex items-center gap-2">
                  <div className="flex">
                    {renderStars(shelterData.rating)}
                  </div>
                  <span className="font-inter font-medium text-green-30 text-sm">
                    {shelterData.rating}
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

            <button
              className="all-[unset] box-border flex h-11 items-center justify-center gap-2 px-6 py-3 bg-green-70 rounded-custom-small hover:bg-green-80 transition-colors cursor-pointer w-full mt-4"
              type="button"
              aria-label={`Показать приют ${shelterData.name} на карте`}
              onClick={scrollToMap}
            >
              <span className="relative w-fit font-inter font-medium text-green-20 text-base">
                Показать на карте
              </span>
            </button>
          </div>
        </article>

        {/* СЕКЦИЯ С ЖИВОТНЫМИ ПРИЮТА */}
        <section className="bg-green-95 rounded-custom p-6 w-full max-w-[1160px] mx-auto">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 w-full">
            <div className="w-full lg:w-auto text-center lg:text-left">
              <span className="font-sf-rounded font-bold text-green-30 text-2xl md:text-4xl">
                <strong className="text-green-30">{animalCount}</strong> питомцев
              </span>
              
              {/* Отображение активных фильтров */}
              {activeFilterLabels && activeFilterLabels.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <div className="bg-green-80 rounded-custom-small px-3 py-1 inline-block">
                    <span className="font-inter text-green-30 text-sm font-medium">
                      Активные фильтры:
                    </span>
                  </div>
                  {activeFilterLabels.map((filterLabel, index) => (
                    <div 
                      key={index}
                      className="bg-green-70 rounded-custom-small px-3 py-1 flex items-center gap-2"
                    >
                      <span className="font-inter text-green-20 text-sm">
                        {filterLabel}
                      </span>
                      <button
                        onClick={() => {
                          // Удаляем конкретный фильтр
                          const filterKey = Object.keys(activeFilters).find(key => {
                            const value = activeFilters[key];
                            if (key === 'age_min' || key === 'age_max') {
                              return filterLabel.includes(getFilterDisplayName(key, value));
                            }
                            return getFilterDisplayName(key, value) === filterLabel;
                          });
                          
                          if (filterKey) {
                            const newFilters = { ...activeFilters };
                            delete newFilters[filterKey];
                            setActiveFilters(newFilters);
                            handleApplyFilters(newFilters);
                          }
                        }}
                        className="text-green-40 hover:text-green-30 transition-colors"
                        aria-label={`Удалить фильтр ${filterLabel}`}
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={handleResetFilters}
                    className="text-green-60 hover:text-green-40 transition-colors font-inter text-sm underline"
                    aria-label="Сбросить все фильтры"
                  >
                    Сбросить все
                  </button>
                </div>
              )}
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

        {/* Кнопка фильтров */}
        <div className="flex items-start gap-2.5 p-[15px] relative bg-green-90 rounded-custom w-full max-w-[1260px] mx-auto">
          <button
            onClick={() => setShowFilters(true)}
            className="inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-green-70 rounded-custom-small hover:bg-green-80 transition-colors cursor-pointer"
            type="button"
            aria-label="Фильтры"
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
        </div>

        {/* КАРТОЧКИ ЖИВОТНЫХ */}
        <section className="w-full max-w-[1260px] mx-auto">
          {allPets.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {currentPets.map((pet) => (
                  <PetCard 
                    key={pet.id}
                    petData={pet}
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
                      onClick={prevPage}
                      disabled={currentPage === 1}
                      className={`flex items-center justify-center w-10 h-10 rounded-custom-small ${
                        currentPage === 1 
                          ? 'bg-green-80 text-green-60 cursor-not-allowed' 
                          : 'bg-green-70 text-green-20 hover:bg-green-60 cursor-pointer'
                      } transition-colors`}
                      aria-label="Предыдущая страница"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>

                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`w-10 h-10 rounded-custom-small font-inter font-medium transition-colors ${
                            page === currentPage
                              ? 'bg-green-70 text-green-20'
                              : 'bg-green-90 text-green-30 hover:bg-green-80'
                          }`}
                          aria-label={`Перейти на страницу ${page}`}
                          aria-current={page === currentPage ? 'page' : undefined}
                        >
                          {page}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={nextPage}
                      disabled={currentPage === totalPages}
                      className={`flex items-center justify-center w-10 h-10 rounded-custom-small ${
                        currentPage === totalPages 
                          ? 'bg-green-80 text-green-60 cursor-not-allowed' 
                          : 'bg-green-70 text-green-20 hover:bg-green-60 cursor-pointer'
                      } transition-colors`}
                      aria-label="Следующая страница"
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
                  {Object.keys(activeFilters).length > 0 || searchTerm 
                    ? 'По вашим фильтрам питомцы не найдены. Попробуйте изменить параметры поиска.'
                    : 'В этом приюте пока нет животных для усыновления'
                  }
                </p>
                {(Object.keys(activeFilters).length > 0 || searchTerm) && (
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 bg-green-70 text-green-20 rounded-custom-small hover:bg-green-60 transition-colors"
                  >
                    Сбросить фильтры
                  </button>
                )}
              </div>
            </div>
          )}
        </section>

        {/* КАРТА */}
        <section id="shelter-map" className="w-full mt-12">
          <div className="max-w-[1260px] mx-auto mb-6 text-center">
            <h2 className="font-sf-rounded font-bold text-2xl md:text-3xl text-green-30">
              Приют на карте
            </h2>
          </div>

          <div className="w-full bg-green-90 rounded-custom overflow-hidden">
            <div className="w-full h-[400px] md:h-[650px] bg-green-90 flex items-center justify-center">
              <div className="text-center">
                <svg 
                  className="w-16 h-16 text-green-60 mx-auto mb-4"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p className="font-inter font-medium text-green-40 text-lg">
                  Карта будет подключена позже
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ЗАЯВКА ТОЛЬКО ЕСЛИ can_adopt = true */}
        {shelterData.acceptsAnimalsFromOwners && (
          <section className="w-full max-w-[1260px] mx-auto mt-12">
            <div className="bg-green-90 bg-opacity-50 rounded-custom p-6 md:p-8 backdrop-blur-sm border-2 border-green-40">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                <div className="w-full md:w-1/3 flex justify-center">
                  <img 
                    src={PrilegPhoto} 
                    alt="Спит" 
                  />
                </div>
                
                <div className="w-full md:w-2/3 text-center">
                  <h3 className="font-sf-rounded font-bold text-green-30 text-xl md:text-2xl mb-4">
                    Заявка на отправление животного на передержку/отдать животное навсегда
                  </h3>
                  
                  <button
                    onClick={goToApplication}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-transparent border-2 border-green-40 text-green-40 rounded-custom-small hover:bg-green-40 hover:text-green-95 transition-all duration-300 font-inter font-medium"
                    type="button"
                    aria-label="Перейти к заполнению заявки"
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