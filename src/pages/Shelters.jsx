import React, { useState, useEffect } from "react";
import ShelterCard from '../components/ShelterCard';
import DistrictFilter from '../components/DistrictFilter';

const Shelters = () => {
  const [shelters, setShelters] = useState([]);
  const [filteredShelters, setFilteredShelters] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sheltersPerPage] = useState(12);
  const [showDistrictFilter, setShowDistrictFilter] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    district: null,
    districtId: null
  });

  // Mock данные для приютов с бекенда
  const mockShelters = [
    {
      id: 1,
      name: "Приют Некрасовка",
      rating: 4.5,
      description: "Муниципальный приют Некрасовка — один из крупнейших приютов Москвы для бездомных животных. Приют работает уже более десяти лет и временно содержит около 2 000–2 700 собак и 150–350 кошек.",
      animalsCount: 2850,
      district: "Юго-Восточный",
      districtId: "yuvao"
    },
    {
      id: 2,
      name: "Приют Зоорассвет",
      rating: 4.2,
      description: "Приют в восточном округе Москвы, специализирующийся на помощи бездомным собакам и кошкам.",
      animalsCount: 1200,
      district: "Восточный",
      districtId: "vao"
    },
    {
      id: 3,
      name: "Приют Добрые руки",
      rating: 4.8,
      description: "Волонтерский приют, основанный энтузиастами. Занимается спасением и лечением животных.",
      animalsCount: 890,
      district: "Северный",
      districtId: "sao"
    },
    {
      id: 4,
      name: "Приют Лапки добра",
      rating: 4.3,
      description: "Частный приют, принимающий животных со сложными судьбами и требующих особого ухода.",
      animalsCount: 650,
      district: "Центральный",
      districtId: "cao"
    },
    {
      id: 5,
      name: "Приют Хвостик удачи",
      rating: 4.6,
      description: "Современный приют с передовыми технологиями содержания и ухода за животными.",
      animalsCount: 430,
      district: "Западный",
      districtId: "zao"
    },
    {
      id: 6,
      name: "Приют Руднево",
      rating: 4.1,
      description: "Крупный приют на юге Москвы, сотрудничающий с ветеринарными клиниками города.",
      animalsCount: 780,
      district: "Южный",
      districtId: "yao"
    },
    {
      id: 7,
      name: "Приют Зеленоград",
      rating: 4.4,
      description: "Приют в Зеленограде, занимающийся помощью животным северного округа Москвы.",
      animalsCount: 320,
      district: "Зеленоградский",
      districtId: "zelao"
    },
    {
      id: 8,
      name: "Приют Бирюлево",
      rating: 4.0,
      description: "Муниципальный приют в южном округе, работающий более 8 лет.",
      animalsCount: 540,
      district: "Южный",
      districtId: "yao"
    },
    {
      id: 9,
      name: "Приют Химки",
      rating: 4.7,
      description: "Приют в подмосковных Химках, принимающий животных из Московской области.",
      animalsCount: 210,
      district: "Северо-Западный",
      districtId: "szao"
    },
    {
      id: 10,
      name: "Приют Мытищи",
      rating: 4.2,
      description: "Волонтерская организация в Мытищах, помогающая бездомным животным.",
      animalsCount: 180,
      district: "Северо-Восточный",
      districtId: "svao"
    },
    {
      id: 11,
      name: "Приют Королев",
      rating: 4.5,
      description: "Научный городок Королев, приют сотрудничает с местными предприятиями.",
      animalsCount: 290,
      district: "Северо-Восточный",
      districtId: "svao"
    },
    {
      id: 12,
      name: "Приют Люберцы",
      rating: 4.3,
      description: "Крупный приют в Люберцах, имеющий собственную ветеринарную клинику.",
      animalsCount: 670,
      district: "Юго-Восточный",
      districtId: "yuvao"
    },
    {
      id: 13,
      name: "Приют Одинцово",
      rating: 4.6,
      description: "Элитный приют в Одинцово с современными условиями содержания.",
      animalsCount: 380,
      district: "Западный",
      districtId: "zao"
    },
    {
      id: 14,
      name: "Приют Красногорск",
      rating: 4.4,
      description: "Приют в Красногорске, специализирующийся на породистых животных.",
      animalsCount: 220,
      district: "Северо-Западный",
      districtId: "szao"
    },
    {
      id: 15,
      name: "Приют Домодедово",
      rating: 4.1,
      description: "Приют рядом с аэропортом Домодедово, работает с 2015 года.",
      animalsCount: 410,
      district: "Южный",
      districtId: "yao"
    }
  ];

  // Заглушка для данных с бекенда
  useEffect(() => {
    setShelters(mockShelters);
    setFilteredShelters(mockShelters);
  }, []);

  // Обработчик применения фильтров по округу
  const handleApplyDistrictFilter = (filters) => {
    setActiveFilters(filters);
    
    let filtered = shelters;
    
    // Фильтрация по округу
    if (filters.districtId) {
      filtered = filtered.filter(shelter => shelter.districtId === filters.districtId);
    }
    
    // Фильтрация по поиску
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(shelter =>
        shelter.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredShelters(filtered);
    setCurrentPage(1);
  };

  // Поиск по названию приюта
  useEffect(() => {
    let filtered = shelters;
    
    // Фильтрация по округу
    if (activeFilters.districtId) {
      filtered = filtered.filter(shelter => shelter.districtId === activeFilters.districtId);
    }
    
    // Фильтрация по поиску
    if (searchTerm.trim() !== "") {
      filtered = filtered.filter(shelter =>
        shelter.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredShelters(filtered);
    setCurrentPage(1);
  }, [searchTerm, shelters, activeFilters]);

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

  // Функция для сброса всех фильтров
  const handleResetFilters = () => {
    setActiveFilters({ district: null, districtId: null });
    setSearchTerm("");
    setFilteredShelters(shelters);
    setCurrentPage(1);
  };





  return (



    <div className="min-h-screen bg-green-95">
      {/* Компонент фильтров по округам */}
      <DistrictFilter 
        isOpen={showDistrictFilter}
        onClose={() => setShowDistrictFilter(false)}
        onApplyFilter={handleApplyDistrictFilter}
      />

      <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-10">
         {/* Заголовок карты */}
        <div className="text-center mb-8">
          <h2 className="font-sf-rounded font-bold text-green-30 text-2xl md:text-3xl lg:text-5xl">
            Приюты на карте
          </h2>
        </div>

        {/* Блок карты на весь экран */}
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

    

        {/* Блок статистики и поиска */}
        <section className="bg-green-95 rounded-custom p-6 w-full max-w-[1260px] mx-auto mb-8">
          <div className="flex flex-col lg:flex-row justify-between items-center gap-6 w-full">
            {/* Количество приютов и активный фильтр */}
            <div className="w-full lg:w-auto text-center lg:text-left">
              <span className="font-sf-rounded font-bold text-green-30 text-2xl md:text-4xl">
                <strong className="text-green-30">{filteredShelters.length}</strong> приютов
              </span>
              {activeFilters.district && (
                <div className="mt-2 flex items-center gap-2">
                  <div className="bg-green-90 rounded-custom-small px-3 py-1 inline-block">
                    <span className="font-inter text-green-30 text-sm">
                      Округ: {activeFilters.district}
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

            {/* Поиск и фильтры */}
            <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-4">
              {/* Поиск */}
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

              {/* Кнопка фильтров по округу */}
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
                  {activeFilters.district ? 'Изменить округ' : 'Выбрать округ'}
                </span>
              </button>
            </div>
          </div>
        </section>

        {/* Блок карточек приютов */}
        <section className="w-full max-w-[1260px] mx-auto">
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

          {/* No Results Message */}
          {filteredShelters.length === 0 && (
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
                  {activeFilters.district 
                    ? `В округе "${activeFilters.district}" приюты не найдены. Попробуйте изменить параметры поиска или выбрать другой округ.`
                    : 'Попробуйте изменить параметры поиска или выбрать округ'
                  }
                </p>
                {(activeFilters.district || searchTerm) && (
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
        </section>
      </div>
    </div>
  )
}

export default Shelters