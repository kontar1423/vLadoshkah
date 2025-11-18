import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Pes from '../assets/images/sobaka.png';
import ButtonIcon from '../assets/images/Button.png';
import LapaIcon from '../assets/images/lapa.png';
import PetCard from '../components/PetCard';
import Filters from '../components/Filters';
import HelpSection from '../components/HelpSection';
import SearchIcon from '../assets/images/search.png';
import LineIcon from '../assets/images/line.png';
import miniPes from '../assets/images/mini_pes.png';
import { animalService } from '../services/animalService';
import { shelterService } from '../services/shelterService';

const FindPet = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [allPets, setAllPets] = useState([]);
  const [filteredPets, setFilteredPets] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [petsPerPage] = useState(24);
  const [showFilters, setShowFilters] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
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

    if (filterKey === 'shelter_id') {
      const shelter = shelters.find(s => s.id === filterValue);
      return shelter ? shelter.name : `Приют ${filterValue}`;
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

  // Загрузка животных и приютов
  useEffect(() => {
    loadAnimals();
    loadShelters();
  }, []);

  const loadAnimals = async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      let response;
      if (Object.keys(filters).length > 0) {
        response = await animalService.getAnimalsWithFilters(filters);
      } else {
        response = await animalService.getAllAnimals();
      }
      
      let animals = [];
      
      if (Array.isArray(response)) {
        animals = response;
      } else if (response && Array.isArray(response.data)) {
        animals = response.data;
      } else if (response && response.animals) {
        animals = response.animals;
      } else {
        console.warn('Unknown API response format:', response);
        animals = [];
      }
      
      setAllPets(animals);
      setFilteredPets(animals);
    } catch (err) {
      console.error('Error loading animals:', err);
      setError('Не удалось загрузить список животных');
      const mockPets = Array.from({ length: 12 }, (_, index) => ({
        id: index + 1,
        name: ["Барсик", "Шарик", "Мурка", "Рекс", "Пушистик", "Джек", "Снежок", "Люси", "Бобик", "Марси", "Рыжик", "Зевс"][index],
        age: Math.floor(Math.random() * 10) + 1,
        gender: index % 2 === 0 ? "male" : "female",
        type: index % 2 === 0 ? "dog" : "cat",
        animal_size: ["small", "medium", "large"][index % 3],
        health: "healthy",
        color: ["рыжий", "черный", "белый", "серый"][index % 4],
        personality: "дружелюбный",
        shelter_id: (index % 5) + 1,
        photos: [],
        shelter_name: `Приют ${(index % 5) + 1}`
      }));
      setAllPets(mockPets);
      setFilteredPets(mockPets);
    } finally {
      setLoading(false);
    }
  };

  const loadShelters = async () => {
    try {
      const response = await shelterService.getAllShelters();
      
      let sheltersData = [];
      
      if (Array.isArray(response)) {
        sheltersData = response;
      } else if (response && Array.isArray(response.data)) {
        sheltersData = response.data;
      } else if (response && response.shelters) {
        sheltersData = response.shelters;
      } else {
        console.warn('Unknown shelters API response format:', response);
        sheltersData = [];
      }
      
      setShelters(sheltersData);
    } catch (err) {
      console.error('Error loading shelters:', err);
      const mockShelters = [
        { id: 1, name: "Приют для безнадзорных и бесхозяйных животных «Некрасимейский»" },
        { id: 2, name: "Приют «Зоорассвет»" },
        { id: 3, name: "Приют «Добрые руки»" },
        { id: 4, name: "Приют «Лапки добра»" },
        { id: 5, name: "Приют «Хвостик удачи»" },
      ];
      setShelters(mockShelters);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Логика поиска приютов
  };

  const scrollToPets = () => {
    const petsSection = document.getElementById('pets-section');
    if (petsSection) {
      petsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Обработчик применения фильтров
  const handleApplyFilters = (filters) => {
    console.log("Applied filters:", filters);
    setActiveFilters(filters);
    
    let filtered = [...allPets];

    // Фильтрация по типу животного
    if (filters.type) {
      filtered = filtered.filter(pet => {
        if (filters.type === 'dog') return pet.type === 'dog';
        if (filters.type === 'cat') return pet.type === 'cat';
        return true;
      });
    }

    // Фильтрация по полу
    if (filters.gender) {
      filtered = filtered.filter(pet => pet.gender === filters.gender);
    }

    // Фильтрация по размеру
    if (filters.animal_size) {
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
    if (filters.health) {
      filtered = filtered.filter(pet => pet.health === filters.health);
    }

    // Фильтрация по приюту
    if (filters.shelter_id) {
      filtered = filtered.filter(pet => pet.shelter_id === filters.shelter_id);
    }

    setFilteredPets(filtered);
    setCurrentPage(1);
  };

  // Поиск по имени животного
  useEffect(() => {
    if (searchTerm.trim() === "") {
      applyFiltersToPets(activeFilters);
    } else {
      let searchedPets = [...allPets];
      
      searchedPets = applyFilters(searchedPets, activeFilters);
      
      searchedPets = searchedPets.filter(pet => 
        pet && pet.name && pet.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      setFilteredPets(searchedPets);
    }
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

    if (filters.shelter_id && filters.shelter_id !== '') {
      filtered = filtered.filter(pet => pet.shelter_id === filters.shelter_id);
    }

    if (filters.age_min !== undefined) {
      filtered = filtered.filter(pet => pet.age >= filters.age_min);
    }

    if (filters.age_max !== undefined) {
      filtered = filtered.filter(pet => pet.age <= filters.age_max);
    }

    return filtered;
  };

  const applyFiltersToPets = (filters) => {
    const filtered = applyFilters(allPets, filters);
    setFilteredPets(filtered);
  };

  // Сброс фильтров
  const handleResetFilters = () => {
    setActiveFilters({});
    setSearchTerm("");
    setFilteredPets(allPets);
    setCurrentPage(1);
  };

  // Пагинация
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

  const activeFilterLabels = formatActiveFilters();

  return (
    <div className="min-h-screen bg-green-95">
      {/* Компонент Filters */}
      <Filters 
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
        initialFilters={activeFilters}
        onReset={handleResetFilters}
      />

      {/* Модальное окно помощи */}
      {showHelp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-green-95 rounded-custom w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <HelpSection onClose={() => setShowHelp(false)} />
          </div>
        </div>
      )}

      <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px]">
        
        {/* Hero Section */}
        <section className="relative w-full h-screen rounded-custom overflow-hidden bg-gradient-to-r mb-32">
          <div className="absolute top-0 right-0 w-[500px] h-full flex items-center justify-end">
            <img
              className="h-4/5 w-auto object-contain max-w-full"
              alt="Cute puppy looking for a home"
              src={Pes}
            />
          </div>
          
          <div className="absolute top-0 left-0 w-full h-full flex flex-col justify-center gap-6 md:gap-9 pl-6 md:pl-[81px] pr-6">
            <h1 className="w-full md:w-[555px] font-sf-rounded font-bold text-green-40 text-3xl md:text-6xl leading-tight">
              НАЙДИ СВОЕГО ЛУЧШЕГО ДРУГА!
            </h1>
            
            <button
              onClick={scrollToPets}
              className="all-[unset] box-border inline-flex w-12 h-12 md:w-20 md:h-12 relative items-center justify-center bg-green-40 rounded-full cursor-pointer transition-colors hover:bg-green-50"
              aria-label="Перейти к питомцам"
              type="button"
            >
              <img 
                src={ButtonIcon} 
                alt="Найти сейчас" 
                className="w-4 h-4 md:w-6 md:h-6"
              />
            </button>
          </div>
        </section>

        {/* Why Help Section */}
        <section className="mt-8 md:mt-16 max-w-[1160px] mx-auto mb-12">
          <div className="relative w-full h-auto min-h-[300px] md:h-[400px] bg-green-90 rounded-custom overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-80 rounded-full -translate-y-32 translate-x-32 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-70 rounded-full translate-y-24 -translate-x-24 opacity-30"></div>
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-green-60 rounded-full opacity-20"></div>
            
            <div className="w-full h-full flex items-center py-8 md:py-0 relative z-10">
              <div className="w-full px-6 md:px-[119px]">
                <div className="flex items-center gap-4 mb-6 justify-center md:justify-start">
                  <img 
                    src={LapaIcon} 
                    alt="Paw icon" 
                    className="w-8 h-8 md:w-12 md:h-12"
                  />
                  <h2 className="font-sf-rounded font-bold text-green-30 text-2xl md:text-4xl text-center md:text-left">
                    Почему важно помогать?
                  </h2>
                </div>
                
                <div className="max-w-4xl mx-auto">
                  <p className="font-inter text-green-20 text-base md:text-lg leading-6 md:leading-7 mb-8 text-center md:text-left">
                    Бездомные животные находятся в приютах или на улицах городов и очень ждут, когда их заберут в новый дом. Они надеются обрести хозяина, который предоставит им постоянное жилье, заботу и регулярное питание. Для многих из них это единственный шанс изменить свою жизнь к лучшему. Однако процесс адаптации к новым условиям часто требует времени и терпения от новых владельцев.
                  </p>

                  <div className="flex justify-center">
                    <button 
                      onClick={() => setShowHelp(true)}
                      className="all-[unset] box-border inline-flex items-center justify-center px-6 py-3 bg-green-40 rounded-full cursor-pointer transition-colors hover:bg-green-50"
                    >
                      <span className="relative w-fit font-inter font-semibold text-green-95 text-base">
                        Помочь команде
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Statistics Section with Search */}
        <section className="mt-8 md:mt-16 max-w-[1160px] mx-auto mb-28">
          <div className="relative w-full bg-green-90 rounded-custom overflow-hidden p-8 md:p-12">
            <div className="absolute top-0 right-0 w-64 h-64 bg-green-80 rounded-full -translate-y-32 translate-x-32 opacity-50"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-green-70 rounded-full translate-y-24 -translate-x-24 opacity-30"></div>
            
            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
              {/* Левая часть с статистикой */}
              <div className="relative">
                <div className="relative bg-green-40 rounded-[40px] p-6 md:p-8 transform -rotate-2 shadow-2xl">
                  <div className="transform rotate-2">
                    <h3 className="font-sf-rounded font-bold text-green-95 text-2xl md:text-3xl lg:text-4xl text-center">
                      более {allPets.length} животных<br />ищут свой дом!
                    </h3>
                  </div>
                  <div className="absolute -top-2 -left-2 w-6 h-6 bg-green-60 rounded-full"></div>
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 bg-green-80 rounded-full"></div>
                </div>
              </div>

              {/* Правая часть с поиском, фильтрами и собакой */}
              <div className="flex-1 max-w-2xl">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Поиск с прыгающей собакой */}
                  <div className="flex-1 relative">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Поиск животных..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 bg-green-95 border-2 border-green-40 rounded-custom font-inter text-green-40 placeholder-green-40 focus:outline-none focus:border-green-40 pr-12"
                        disabled={loading}
                      />
                      {/* Прыгающая собака вместо иконки поиска */}
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 animate-bounce">
                        <img 
                          src={miniPes} 
                          alt="Собака" 
                          className="w-32 h-32 md:w-40 md:h-44 object-contain" 
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => setShowFilters(true)}
                    disabled={loading}
                    className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-green-70 rounded-custom-small hover:bg-green-80 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <span className="relative w-fit font-inter font-medium text-green-20 text-base">
                      Фильтры
                    </span>
                  </button>
                </div>

                {/* Отображение активных фильтров */}
                {activeFilterLabels && activeFilterLabels.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
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
            </div>
          </div>
        </section>

        {/* Pets Grid Section */}
        <section id="pets-section" className="w-full max-w-[1260px] mx-auto py-30 mb-25">
          {/* Results Info */}
          <div className="mb-6">
            <div className="bg-green-90 rounded-custom-small px-6 py-3 inline-block">
              <span className="font-inter font-medium text-green-30">
                {loading ? 'Загрузка...' : `Найдено ${filteredPets.length} питомцев ${searchTerm && `по запросу "${searchTerm}"`}`}
              </span>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="text-center py-12">
              <div className="bg-green-90 rounded-custom p-8 max-w-md mx-auto">
                <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-40 mx-auto mb-4"></div>
                <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-2">
                  Загружаем питомцев...
                </h3>
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="text-center py-12">
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
                  {error}
                </p>
                <button
                  onClick={() => loadAnimals(activeFilters)}
                  className="px-6 py-3 bg-green-70 text-green-20 rounded-custom-small hover:bg-green-60 transition-colors"
                >
                  Попробовать снова
                </button>
              </div>
            </div>
          )}

          {/* Pets Grid */}
          {!loading && !error && (
            <>
              {filteredPets.length > 0 ? (
                <>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {currentPets.map((pet) => (
                      <PetCard 
                        key={pet.id}
                        petData={pet}
                      />
                    ))}
                  </div>

                  {/* Пагинация */}
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
                        {Array.from({ length: totalPages }, (_, i) => i + 1)
                          .filter(page => 
                            page === 1 || 
                            page === totalPages || 
                            (page >= currentPage - 1 && page <= currentPage + 1)
                          )
                          .map((page, index, array) => {
                            const showEllipsis = index > 0 && page - array[index - 1] > 1;
                            return (
                              <React.Fragment key={page}>
                                {showEllipsis && (
                                  <span className="w-10 h-10 flex items-center justify-center text-green-30">...</span>
                                )}
                                <button
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
                              </React.Fragment>
                            );
                          })}
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
                </>
              ) : (
                /* No Results Message */
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
                        : 'Питомцы не найдены'
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
            </>
          )}
        </section>

        {/* Map Section */}
        <section className="mt-8 md:mt-16 max-w-[1160px] mx-auto mb-8">
          <div className="flex flex-col items-center gap-[25px] relative">
            <h1 className="self-stretch mt-[-1.00px] font-sf-rounded font-bold text-green-30 text-3xl md:text-4xl text-center">
              Животные рядом с твоим домом
            </h1>

            <div className="h-[600px] items-start self-stretch w-full flex flex-col lg:flex-row gap-4">
              {/* Left Side - Search and Shelters */}
              <aside className="flex-col w-full lg:w-[338px] items-start self-stretch">
                {/* Search Section */}
                <div className="bg-green-95 rounded-custom p-1 mb-2">
                  <form
                    className="items-center self-stretch w-full flex"
                    onSubmit={handleSearchSubmit}
                    role="search"
                  >
                    <label
                      htmlFor="search-input"
                      className="flex flex-col h-[49px] items-start justify-center flex-1"
                    >
                      <input
                        id="search-input"
                        type="search"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Поиск приютов..."
                        className="w-full font-inter font-medium text-green-40 text-base bg-green-95 border-2 border-green-40 rounded-custom px-4 py-3 focus:outline-none focus:border-green-40 placeholder-green-40"
                        aria-label="Поиск приютов для животных"
                      />
                    </label>

                    <button
                      type="submit"
                      className="w-[49px] h-[49px] flex items-center justify-center bg-green-70 rounded-full hover:bg-green-80 transition-colors ml-2"
                      aria-label="Выполнить поиск"
                    >
                      <img
                        className="w-6 h-6 mx-auto"
                        alt="Search" 
                        src={SearchIcon}
                      />
                    </button>
                  </form>
                </div>

                {/* Filtered Shelters List */}
                <div className="bg-green-90 rounded-custom p-4 flex-1">
                  <nav
                    className="flex flex-col items-start h-full"
                    aria-label="Список приютов для животных"
                  >
                    {/* Shelters List with Lines */}
                    <div className="w-full space-y-0">
                      {shelters
                        .filter(shelter => 
                          searchQuery.trim() === "" || 
                          shelter.name.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((shelter, index, filteredShelters) => (
                          <div
                            key={shelter.id}
                            className="flex flex-col items-center self-stretch w-full"
                          >
                            <Link
                              to={`/приют/${shelter.id}`}
                              className="relative self-stretch font-inter font-medium text-green-30 text-base py-4 hover:text-green-20 transition-colors cursor-pointer text-left hover:underline"
                            >
                              {shelter.name}
                            </Link>
                            
                            {index < filteredShelters.length - 1 && (
                              <img
                                className="relative w-6 h-px object-cover my-2"
                                alt="" 
                                src={LineIcon}
                                role="presentation"
                              />
                            )}
                          </div>
                        ))
                      }
                      
                      {/* No Results Message */}
                      {searchQuery.trim() !== "" && 
                      shelters.filter(shelter => 
                      shelter.name.toLowerCase().includes(searchQuery.toLowerCase())
                      ).length === 0 && (
                        <div className="text-center py-4">
                          <p className="font-inter text-green-60 text-sm">
                            Приюты не найдены
                          </p>
                        </div>
                      )}
                    </div>
                  </nav>
                </div>
              </aside>

              {/* Right Side - Map с border */}
              <div className="relative w-full lg:w-[812px] h-[600px] bg-green-90 rounded-custom overflow-hidden border-2 border-green-40">
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-center p-8">
                    <svg 
                      className="w-24 h-24 text-green-80 mx-auto mb-4"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <h3 className="font-sf-rounded font-bold text-green-30 text-2xl mb-2">
                      Карта приютов
                    </h3>
                    <p className="font-inter text-green-80 text-sm mt-2">
                      Здесь будет отображаться интерактивная карта с приютами
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Empty Space before Footer */}
        <div className="h-20"></div>
      </div>
    </div>
  );
};

export default FindPet;