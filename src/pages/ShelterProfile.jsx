import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from 'react-router-dom';
import PriutPhoto from '../assets/images/priut.jpg';
import PrilegPhoto from '../assets/images/prileg.png';
import PetCard from '../components/PetCard';
import FiltersP from '../components/Filters_priut.jsx';

const ShelterProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [animalCount, setAnimalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [pets, setPets] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [petsPerPage] = useState(8);
  const [showFilters, setShowFilters] = useState(false);

  // Данные приюта с бекенда
  const [shelterData, setShelterData] = useState({
    name: "Некрасовка",
    rating: 4.5,
    description: "Муниципальный приют Некрасовка — один из крупнейших приютов Москвы для бездомных животных. Приют работает уже более десяти лет и временно содержит около 2 000–2 700 собак и 150–350 кошек. Все животные проходят обязательную вакцинацию, стерилизацию и имеют индивидуальные чипы с кодами, занесёнными в базу данных.",
    mapUrl: "https://yandex.ru/maps/org/nekrasovka/136521596345/",
    // Новые поля с бекенда
    contacts: {
      phone: "+7 (495) 123-45-67",
      telegram: "@nekrasovka_shelter",
      whatsapp: "+7 (495) 123-45-67",
      email: "nekrasovka@mail.ru"
    },
    // Флаг от бекенда - поддерживает ли приют возможность отдать животное
    acceptsAnimalsFromOwners: true // Это значение должно приходить с бекенда
  });

  // Функция для перехода на страницу анкеты
  const goToApplication = () => {
  navigate('/Anketa_give', { state: { shelterId: id, shelterName: shelterData.name } });
};

  // Функция для прокрутки к карте
  const scrollToMap = () => {
    const mapSection = document.getElementById('shelter-map');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Заглушка для данных с бекенда
  useEffect(() => {
    setAnimalCount(2850);

    const mockPets = Array.from({ length: 24 }, (_, index) => ({
      id: index + 1,
      name: ["Барсик", "Шарик", "Мурка", "Рекс", "Пушистик", "Джек", "Снежок", "Люси", "Бобик", "Марси", "Рыжик", "Зевс"][index % 12],
      age: ["2 года", "3 года", "1 год", "4 года", "6 месяцев", "2 года", "1.5 года", "3 года", "5 лет", "8 месяцев", "2.5 года", "1 год"][index % 12],
      gender: index % 2 === 0 ? "male" : "female",
      type: index % 2 === 0 ? "dog" : "cat"
    }));

    setPets(mockPets);
  }, []);

  // Обработчик применения фильтров
  const handleApplyFilters = (filters) => {
    console.log("Applied filters:", filters);
    // Здесь будет логика применения фильтров к данным
  };

  // Пагинация
  const indexOfLastPet = currentPage * petsPerPage;
  const indexOfFirstPet = indexOfLastPet - petsPerPage;
  const currentPets = pets.slice(indexOfFirstPet, indexOfLastPet);
  const totalPages = Math.ceil(pets.length / petsPerPage);

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

  // Функция для отображения звезд рейтинга
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

  return (
    <div className="min-h-screen bg-green-95 py-4 md:py-8">
      {/* Компонент Filters */}
      <FiltersP 
        isOpen={showFilters}
        onClose={() => setShowFilters(false)}
        onApply={handleApplyFilters}
      />

      <div className="max-w-container mx-auto px-4 space-y-8">
        {/* Основной блок приюта */}
        <article className="relative w-full max-w-[1260px] min-h-[400px] md:h-[400px] bg-green-90 rounded-custom overflow-hidden flex flex-col md:flex-row">
          
          {/* Полупрозрачное окошко сверху - показывается только если приют поддерживает возможность отдать питомца */}
          {shelterData.acceptsAnimalsFromOwners && (
            <div className="absolute top-4 right-6 z-20 bg-green-90 bg-opacity-90 border-2 border-green-30 rounded-custom-small px-4 py-2 backdrop-blur-sm">
              <span className="font-inter font-medium text-green-30 text-sm">
                Поддерживает возможность отдать питомца
              </span>
            </div>
          )}

          {/* Фотография */}
          <div className="relative w-full md:w-[350px] h-[180px] md:h-full flex-shrink-0">
            <img 
              src={PriutPhoto} 
              alt="Приют Некрасовка"
              className="w-full h-full object-cover"
            />
            {/* Градиентный переход */}
            <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-green-90 to-transparent hidden md:block"></div>
          </div>

          {/* Контент */}
          <div className="flex-1 flex flex-col items-start justify-between p-4 md:p-6 md:pl-6 md:pr-6">
            <div className="w-full">
              <header className="inline-flex flex-col items-start relative mb-3 md:mb-4 w-full">
                <h1 className="w-fit font-sf-rounded font-bold text-2xl md:text-4xl text-green-30 mb-2">
                  {shelterData.name}
                </h1>

                {/* Рейтинг со звездами */}
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {renderStars(shelterData.rating)}
                  </div>
                  <span className="font-inter font-medium text-green-30 text-sm">
                    {shelterData.rating}
                  </span>
                </div>
              </header>

              {/* Описание приюта */}
              <p className="font-inter font-medium text-green-30 text-sm md:text-base leading-relaxed mb-4">
                {shelterData.description}
              </p>

              {/* Минималистичные контакты без иконок */}
              <div className="mb-4">
                <div className="space-y-1">
                  <div className="font-inter font-medium text-green-30 text-sm">
                    Телефон: {shelterData.contacts.phone}
                  </div>
                  <div className="font-inter font-medium text-green-30 text-sm">
                    Telegram: {shelterData.contacts.telegram}
                  </div>
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

            {/* Кнопка показа на карте */}
            <button
              className="all-[unset] box-border flex h-11 items-center justify-center gap-2 px-6 py-3 bg-green-70 rounded-custom-small hover:bg-green-80 transition-colors cursor-pointer w-full mt-4"
              type="button"
              aria-label="Показать приют Некрасовка на карте"
              onClick={scrollToMap}
            >
              <span className="relative w-fit font-inter font-medium text-green-20 text-base">
                Показать на карте
              </span>
            </button>
          </div>
        </article>

        {/* Остальной код без изменений */}
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

        <section className="w-full max-w-[1260px] mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {currentPets.map((pet) => (
              <PetCard 
                key={pet.id}
                petData={pet}
              />
            ))}
          </div>

          {pets.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-8">
              <div className="bg-green-90 rounded-custom-small px-6 py-3">
                <span className="font-inter font-medium text-green-30">
                  Страница {currentPage} из {totalPages} • Показано {currentPets.length} из {pets.length} питомцев
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
        </section>

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
                <p className="font-inter text-green-60 text-sm mt-2">
                  {shelterData.mapUrl}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Блок заявки на отправление животного - показывается только если приют поддерживает возможность отдать животное */}
        {shelterData.acceptsAnimalsFromOwners && (
          <section className="w-full max-w-[1260px] mx-auto mt-12">
            <div className="bg-green-90 bg-opacity-50 rounded-custom p-6 md:p-8 backdrop-blur-sm border-2 border-green-40">
              <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
                {/* Фотография собаки слева */}
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