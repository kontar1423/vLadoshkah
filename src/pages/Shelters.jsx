import React, { useState, useEffect } from "react";
import ShelterCard from '../components/ShelterCard';
import DistrictFilter from '../components/DistrictFilter';
import { shelterService } from '../services/shelterService';

const Shelters = () => {
  const [shelters, setShelters] = useState([]);
  const [filteredShelters, setFilteredShelters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sheltersPerPage] = useState(12);
  const [showDistrictFilter, setShowDistrictFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    districts: [], // теперь массив выбранных округов
    districtIds: [] // ID выбранных округов
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Загрузка приютов с бекенда
  useEffect(() => {
    loadShelters();
  }, []);

  const loadShelters = async () => {
    try {
      setLoading(true);
      setError('');
      const sheltersData = await shelterService.getAllShelters();
      
      if (!sheltersData || !Array.isArray(sheltersData)) {
        console.warn('Нет данных о приютах или данные в неверном формате');
        setShelters([]);
        setFilteredShelters([]);
        return;
      }

      // Преобразуем данные с бекенда в нужный формат
      const formattedShelters = sheltersData.map(shelter => ({
        id: shelter.id,
        name: shelter.name,
        rating: 4.5,
        description: shelter.description,
        animalsCount: 0,
        address: shelter.address,
        phone: shelter.phone,
        email: shelter.email,
        website: shelter.website,
        working_hours: shelter.working_hours,
        capacity: shelter.capacity,
        status: shelter.status,
        photos: shelter.photos || [],
        // Используем поле region из бекенда для округа
        district: getDistrictName(shelter.region),
        districtId: shelter.region // используем напрямую код округа из бекенда
      }));

      setShelters(formattedShelters);
      setFilteredShelters(formattedShelters);
    } catch (err) {
      console.error('Ошибка загрузки приютов:', err);
      setShelters([]);
      setFilteredShelters([]);
    } finally {
      setLoading(false);
    }
  };

  // Функция для получения названия округа по коду
  const getDistrictName = (regionCode) => {
    const districtMap = {
      'cao': 'Центральный',
      'sao': 'Северный',
      'svao': 'Северо-Восточный',
      'vao': 'Восточный',
      'yuvao': 'Юго-Восточный',
      'yao': 'Южный',
      'yuzao': 'Юго-Западный',
      'zao': 'Западный',
      'szao': 'Северо-Западный',
      'zelao': 'Зеленоградский',
      'tinao': 'Троицкий',
      'nao': 'Новомосковский'
    };
    return districtMap[regionCode] || 'Москва';
  };

  // Обработчик применения фильтров по округу
  const handleApplyDistrictFilter = (filters) => {
    console.log('Applied district filters:', filters);
    setActiveFilters({
      districts: filters.districts || [],
      districtIds: filters.districtIds || []
    });
    
    applyFilters(filters.districtIds, searchTerm);
  };

  // Функция применения фильтров
  const applyFilters = (districtIds, search) => {
    let filtered = shelters;
    
    // Фильтрация по округам (может быть несколько выбранных)
    if (districtIds && districtIds.length > 0) {
      filtered = filtered.filter(shelter => 
        districtIds.includes(shelter.districtId)
      );
    }
    
    // Фильтрация по поиску
    if (search.trim() !== "") {
      filtered = filtered.filter(shelter =>
        shelter.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredShelters(filtered);
    setCurrentPage(1);
  };

  // Поиск по названию приюта
  useEffect(() => {
    applyFilters(activeFilters.districtIds, searchTerm);
  }, [searchTerm, shelters, activeFilters.districtIds]);

  // Функция для сброса всех фильтров
  const handleResetFilters = () => {
    setActiveFilters({ districts: [], districtIds: [] });
    setSearchTerm("");
    setFilteredShelters(shelters);
    setCurrentPage(1);
  };

  // Пагинация
  const indexOfLastShelter = currentPage * sheltersPerPage;
  const indexOfFirstShelter = indexOfLastShelter - sheltersPerPage;
  const currentShelters = filteredShelters.slice(indexOfFirstShelter, indexOfLastShelter);
  const totalPages = Math.ceil(filteredShelters.length / sheltersPerPage);

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

  // Форматирование выбранных округов для отображения
  const getSelectedDistrictsText = () => {
    if (activeFilters.districts.length === 0) return null;
    if (activeFilters.districts.length === 1) return activeFilters.districts[0];
    return `${activeFilters.districts.length} округа`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-95 flex items-center justify-center">
        <div className="text-lg text-green-30">Загрузка приютов...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-95">
      <DistrictFilter 
        isOpen={showDistrictFilter}
        onClose={() => setShowDistrictFilter(false)}
        onApplyFilter={handleApplyDistrictFilter}
      />

      <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-10">
        <div className="text-center mb-8">
          <h2 className="font-sf-rounded font-bold text-green-30 text-2xl md:text-3xl lg:text-5xl">
            Приюты на карте
          </h2>
        </div>

        <div className="w-full h-screen bg-green-90 rounded-custom overflow-hidden border-2 border-green-40 mb-16">
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center p-8">
              <svg 
                className="w-24 h-24 text-green-60 mx-auto mb-4"
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
              <p className="font-inter text-green-60 text-sm mt-2">
                Здесь будет отображаться интерактивная карта с приютами
              </p>
            </div>
          </div>
        </div>

        <section className="bg-green-95 rounded-custom p-6 w-full max-w-[1260px] mx-auto mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 w-full">
            <div className="w-full lg:w-auto text-center lg:text-left">
              <span className="font-sf-rounded font-bold text-green-30 text-2xl md:text-4xl">
                <strong className="text-green-30">{filteredShelters.length}</strong> приютов
              </span>
              {activeFilters.districts.length > 0 && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="bg-green-90 rounded-custom-small px-3 py-1 inline-block">
                    <span className="font-inter text-green-30 text-sm">
                      Округ: {getSelectedDistrictsText()}
                    </span>
                  </div>
                  <button
                    onClick={handleResetFilters}
                    className="text-green-60 hover:text-green-40 transition-colors"
                    aria-label="Сбросить фильтры"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
            </div>

            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Поиск приютов..."
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

              <button
                onClick={() => setShowDistrictFilter(true)}
                className="inline-flex items-center justify-center gap-2.5 px-6 py-3 bg-green-70 rounded-custom-small hover:bg-green-80 transition-colors cursor-pointer"
                type="button"
                aria-label="Фильтры по округам"
              >
                <svg 
                  className="relative w-6 h-6 aspect-[1] text-green-20"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span className="relative w-fit font-inter font-medium text-green-20 text-base">
                  {activeFilters.districts.length > 0 ? 'Изменить округ' : 'Выбрать округ'}
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="w-full max-w-[1260px] mx-auto">
          {/* Сообщение когда приютов нет */}
          {shelters.length === 0 && (
            <div className="text-center py-16">
              <div className="bg-green-90 rounded-custom p-12 max-w-2xl mx-auto">
                <svg 
                  className="w-24 h-24 text-green-60 mx-auto mb-6"
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <h3 className="font-sf-rounded font-bold text-green-30 text-2xl mb-4">
                  Приюты пока не добавлены
                </h3>
                <p className="font-inter text-green-20 text-lg mb-6">
                  В системе пока нет зарегистрированных приютов. 
                  Приюты будут отображаться здесь после их добавления администратором.
                </p>
                <div className="bg-green-95 rounded-custom-small p-4 inline-block">
                  <p className="font-inter text-green-40 text-sm">
                    Если вы представляете приют, обратитесь к администратору для регистрации.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Отображение приютов когда они есть */}
          {shelters.length > 0 && (
            <>
              <div className="grid grid-cols-1 gap-8">
                {currentShelters.map((shelter) => (
                  <ShelterCard 
                    key={shelter.id}
                    shelterData={shelter}
                  />
                ))}
              </div>

              {/* Пагинация */}
              {filteredShelters.length > 0 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
                  <div className="bg-green-90 rounded-custom-small px-6 py-3">
                    <span className="font-inter font-medium text-green-30">
                      Страница {currentPage} из {totalPages} • Показано {currentShelters.length} из {filteredShelters.length} приютов
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

              {/* Сообщение когда приюты есть, но не найдены по фильтрам */}
              {filteredShelters.length === 0 && shelters.length > 0 && (
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
                      Приюты не найдены
                    </h3>
                    <p className="font-inter text-green-20">
                      {activeFilters.districts.length > 0 
                        ? `В выбранных округах приюты не найдены. Попробуйте изменить параметры поиска или выбрать другие округа.`
                        : 'Попробуйте изменить параметры поиска или выбрать округ'
                      }
                    </p>
                    {(activeFilters.districts.length > 0 || searchTerm) && (
                      <button
                        onClick={handleResetFilters}
                        className="mt-4 px-4 py-2 bg-green-70 text-green-20 rounded-custom-small hover:bg-green-60 transition-colors"
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
      </div>
    </div>
  );
}

export default Shelters;