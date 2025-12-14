import React, { useState, useEffect, useRef } from "react";
import ShelterCard from '../components/ShelterCard';
import MiniShelterCard from '../components/MiniShelterCard';
import DistrictFilter from '../components/DistrictFilter';
import { shelterService } from '../services/shelterService';
import SheltersMap from '../components/SheltersMap';
import ShelterCardSkeleton from '../components/ShelterCardSkeleton';

const Shelters = () => {
  const [shelters, setShelters] = useState([]);
  const [filteredShelters, setFilteredShelters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sheltersPerPage] = useState(12);
  const [showDistrictFilter, setShowDistrictFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    districts: [], 
    districtIds: [] 
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const loadingRef = useRef(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    loadShelters();
  }, []);

  const loadShelters = async () => {
    if (loadingRef.current) {
      console.log('Shelters: Load already in progress, skipping');
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError('');
      const sheltersData = await shelterService.getAllShelters();
      
      if (!sheltersData || !Array.isArray(sheltersData)) {
        console.warn('Нет данных о приютах или данные в неверном формате');
        setShelters([]);
        setFilteredShelters([]);
        return;
      }

      const formattedShelters = sheltersData.map(shelter => ({
        id: shelter.id,
        name: shelter.name,
        rating: shelter.rating || 0, // Используем рейтинг из бэкенда
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
        photoUrl: shelter.photoUrl || null,
        district: getDistrictName(shelter.region),
        districtId: shelter.region
      }));

      setShelters(formattedShelters);
      setFilteredShelters(formattedShelters);
    } catch (err) {
      console.error('Ошибка загрузки приютов:', err);
      setShelters([]);
      setFilteredShelters([]);
      setError('Не удалось загрузить приюты. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  };

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

  const handleApplyDistrictFilter = (filters) => {
    console.log('Applied district filters:', filters);
    setActiveFilters({
      districts: filters.districts || [],
      districtIds: filters.districtIds || []
    });
    
    applyFilters(filters.districtIds, searchTerm);
  };

  const applyFilters = (districtIds, search) => {
    let filtered = shelters;
    
    if (districtIds && districtIds.length > 0) {
      filtered = filtered.filter(shelter => 
        districtIds.includes(shelter.districtId)
      );
    }
    
    if (search.trim() !== "") {
      filtered = filtered.filter(shelter =>
        shelter.name.toLowerCase().includes(search.toLowerCase())
      );
    }
    
    setFilteredShelters(filtered);
    setCurrentPage(1);
  };

  useEffect(() => {
    applyFilters(activeFilters.districtIds, searchTerm);
  }, [searchTerm, shelters, activeFilters.districtIds]);

  const handleResetFilters = () => {
    setActiveFilters({ districts: [], districtIds: [] });
    setSearchTerm("");
    setFilteredShelters(shelters);
    setCurrentPage(1);
  };

  const indexOfLastShelter = currentPage * sheltersPerPage;
  const indexOfFirstShelter = indexOfLastShelter - sheltersPerPage;
  const currentShelters = filteredShelters.slice(indexOfFirstShelter, indexOfLastShelter);
  const totalPages = Math.ceil(filteredShelters.length / sheltersPerPage);

  // Сохраняем позицию скролла перед переключением страницы
  const saveScrollPosition = () => {
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop;
    sessionStorage.setItem('sheltersScrollPosition', scrollPosition.toString());
  };

  // Восстанавливаем позицию скролла после изменения страницы
  useEffect(() => {
    const savedPosition = sessionStorage.getItem('sheltersScrollPosition');
    if (savedPosition && currentPage > 1) {
      setTimeout(() => {
        window.scrollTo({
          top: parseInt(savedPosition, 10),
          behavior: 'auto'
        });
      }, 0);
    }
  }, [currentPage]);

  const nextPage = () => {
    if (currentPage < totalPages) {
      saveScrollPosition();
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 1) {
      saveScrollPosition();
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageNumber) => {
    saveScrollPosition();
    setCurrentPage(pageNumber);
  };

  const getSelectedDistrictsText = () => {
    if (activeFilters.districts.length === 0) return null;
    if (activeFilters.districts.length === 1) return activeFilters.districts[0];
    return `${activeFilters.districts.length} округа`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-95">
        <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-10">
          <div className="text-center mb-8">
            <div className="h-12 w-64 bg-green-80 rounded-custom-small mx-auto mb-4 animate-pulse"></div>
          </div>
          <div className="space-y-6">
            {[...Array(3)].map((_, index) => (
              <ShelterCardSkeleton key={index} />
            ))}
          </div>
        </div>
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

        <div className="w-full h-[400px] sm:h-[500px] md:h-[600px] lg:h-screen rounded-custom overflow-hidden border-2 border-green-40 mb-16">
          <SheltersMap 
            shelters={shelters} 
            onShelterClick={(shelter) => {
              console.log('Выбран приют:', shelter);
            }}
          />
        </div>

        <section className="bg-green-95 rounded-custom p-6 w-full max-w-[960px] mx-auto mb-8">
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

          {shelters.length > 0 && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-1 gap-2 sm:gap-3 md:gap-8">
                {currentShelters.map((shelter) => (
                  isMobile ? (
                    <MiniShelterCard 
                      key={shelter.id}
                      shelter={shelter}
                      wideMobile
                    />
                  ) : (
                    <ShelterCard 
                      key={shelter.id}
                      shelterData={shelter}
                    />
                  )
                ))}
              </div>

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
