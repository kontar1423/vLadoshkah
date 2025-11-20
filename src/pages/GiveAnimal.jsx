import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ShelterCard from '../components/ShelterCard';
import miniPes from '../assets/images/mini_pes.png';
import LapaIcon from '../assets/images/lapa.png';
import { shelterService } from '../services/shelterService';

const GiveAnimal = () => {
  const navigate = useNavigate();
  const [acceptingShelters, setAcceptingShelters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Загрузка приютов с бекенда
  useEffect(() => {
    loadAcceptingShelters();
  }, []);

  const loadAcceptingShelters = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Загружаем все приюты
      const allShelters = await shelterService.getAllShelters();
      
      // Фильтруем только те приюты, которые принимают животных (can_adopt: true)
      const acceptingSheltersData = allShelters.filter(shelter => 
        shelter.can_adopt === true
      );

      // В функции loadAcceptingShelters замените форматирование данных:
      const formattedShelters = acceptingSheltersData.map(shelter => ({
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
        photoUrl: shelter.photoUrl, // ДОБАВЬТЕ ЭТУ СТРОКУ
        district: getDistrictFromRegion(shelter.region),
        acceptsFromOwners: shelter.can_adopt
      }));

      setAcceptingShelters(formattedShelters);
      
    } catch (err) {
      console.error('Ошибка загрузки приютов:', err);
      setError('Не удалось загрузить список приютов');
    } finally {
      setLoading(false);
    }
  };

  // Функция для получения названия округа по коду региона
  const getDistrictFromRegion = (region) => {
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
    return districtMap[region] || 'Москва';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-green-95 flex items-center justify-center">
        <div className="text-lg text-green-30">Загрузка приютов...</div>
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
    <div className="min-h-screen bg-green-95">
      <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-10">
        {/* Красивый блок с текстом */}
        <div className="relative w-full max-w-[1260px] mx-auto mb-20">
          <div className="bg-green-90 rounded-custom p-8 md:p-12 relative overflow-hidden">
            
            {/* Декоративные элементы - шарики в разных местах и оттенках */}
            <div className="absolute top-4 left-8 w-20 h-20 bg-green-70 rounded-full opacity-60"></div>
            <div className="absolute top-12 right-16 w-16 h-16 bg-green-60 rounded-full opacity-40"></div>
            <div className="absolute bottom-8 left-20 w-12 h-12 bg-green-80 rounded-full opacity-50"></div>
            <div className="absolute bottom-16 right-8 w-24 h-24 bg-green-50 rounded-full opacity-30"></div>
            <div className="absolute top-1/2 left-1/3 w-8 h-8 bg-green-95 rounded-full opacity-70"></div>
            <div className="absolute top-1/3 right-1/4 w-10 h-10 bg-green-40 rounded-full opacity-25"></div>
            
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-center gap-8">
                
                {/* Левая часть - заголовок с лапкой */}
                <div className="lg:w-2/5 text-center lg:text-left">
                  <div className="flex items-center gap-4 justify-center lg:justify-start mb-6">
                    <img 
                      src={LapaIcon} 
                      alt="Лапа" 
                      className="w-12 h-12 md:w-16 md:h-16"
                    />
                    <h2 className="font-sf-rounded font-bold text-green-30 text-2xl md:text-3xl lg:text-4xl">
                      Хотите отдать животное?
                    </h2>
                  </div>
                </div>

                {/* Правая часть - текст с белым фоном */}
                <div className="lg:w-3/5">
                  <div className="bg-green-95 rounded-custom p-6 md:p-8 transform rotate-1 shadow-lg">
                    <div className="transform -rotate-1">
                      <p className="font-inter text-green-30 text-lg md:text-xl leading-relaxed text-right">
                        <span className="font-semibold">Мы никогда не знаем точно, где окажемся завтра,</span> поэтому если вы столкнулись с трудной ситуацией и за вашим питомцем некому приглядеть, не стесняйтесь обратиться к приютам, предоставляющим возможность отдать животное на передержку.
                      </p>
                    </div>
                  </div>

                  {/* Статистика */}
                  <div className="flex flex-wrap justify-center lg:justify-end gap-6 mt-8">
                    <div className="text-center">
                      <div className="font-sf-rounded font-bold text-green-30 text-2xl md:text-3xl">
                        {acceptingShelters.length}+
                      </div>
                      <div className="font-inter text-green-40 text-sm md:text-base">приютов помогают</div>
                    </div>
                    
                    <div className="text-center">
                      <div className="font-sf-rounded font-bold text-green-30 text-2xl md:text-3xl">100%</div>
                      <div className="font-inter text-green-40 text-sm md:text-base">понимание ситуации</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Блок с маленькой кнопкой-стрелкой и собакой */}
        <div className="relative w-full max-w-[1260px] mx-auto mb-10">
          <div className="flex flex-col items-center">
            
            {/* Собака и кнопка-стрелка */}
            <div className="relative mb-2 z-10">
              <div className="flex flex-col items-center gap-1">
                {/* Собака */}
                <div className="animate-bounce">
                  <img 
                    src={miniPes} 
                    alt="Собака" 
                    className="w-32 h-32 md:w-40 md:h-44 object-contain" 
                  />
                </div>
              </div>
            </div>

            <div className="text-center mb-1">
              <h3 className="font-sf-rounded font-bold text-green-30 text-xl md:text-2xl mb-2">
                Приюты, готовые помочь
              </h3>
              {acceptingShelters.length === 0 && (
                <p className="font-inter text-green-40 text-sm mt-2">
                  В данный момент нет приютов, принимающих животных
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Сетка карточек приютов */}
        <section id="shelters-section" className="w-full max-w-[1260px] mx-auto">
          {acceptingShelters.length > 0 ? (
            <div className="space-y-8 mb-16">
              {acceptingShelters.map((shelter, index) => (
                <div 
                  key={shelter.id}
                  className="animate-fade-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <ShelterCard 
                    shelterData={shelter}
                  />
                </div>
              ))}
            </div>
          ) : (
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
                  Приюты пока не принимают животных
                </h3>
                <p className="font-inter text-green-20 text-lg mb-6">
                  В данный момент нет приютов, которые принимают животных от владельцев. 
                  Попробуйте зайти позже или свяжитесь с приютами напрямую.
                </p>
                <div className="bg-green-95 rounded-custom-small p-4 inline-block">
                  <p className="font-inter text-green-40 text-sm">
                    Если вы представляете приют и хотите принимать животных, обратитесь к администратору.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Информационный блок о процессе */}
        <div className="max-w-[1260px] mx-auto mb-16">
          <div className="bg-green-90 rounded-custom p-8 md:p-12">
            <h2 className="font-sf-rounded font-bold text-green-30 text-2xl md:text-3xl text-center mb-12">
              Как проходит передача животного?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-70 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <span className="font-sf-rounded font-bold text-green-20 text-xl">1</span>
                </div>
                <h3 className="font-sf-rounded font-bold text-green-30 text-lg mb-3">Поиск приюта</h3>
                <p className="font-inter text-green-30 text-sm leading-relaxed">
                  Выберите приют, куда вам удобно отдать животное
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-70 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <span className="font-sf-rounded font-bold text-green-20 text-xl">2</span>
                </div>
                <h3 className="font-sf-rounded font-bold text-green-30 text-lg mb-3">Отправьте заявку</h3>
                <p className="font-inter text-green-30 text-sm leading-relaxed">
                  На странице приюта заполните карточку информации о питомце
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-70 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <span className="font-sf-rounded font-bold text-green-20 text-xl">3</span>
                </div>
                <h3 className="font-sf-rounded font-bold text-green-30 text-lg mb-3">Дождитесь обратной связи</h3>
                <p className="font-inter text-green-30 text-sm leading-relaxed">
                  Немного потерпите, совсем скоро вам ответят
                </p>
              </div>

              <div className="text-center">
                <div className="w-16 h-16 bg-green-70 rounded-full flex items-center justify-center mx-auto mb-4 relative">
                  <span className="font-sf-rounded font-bold text-green-20 text-xl">4</span>
                </div>
                <h3 className="font-sf-rounded font-bold text-green-30 text-lg mb-3">Подготовьтесь к передаче животного</h3>
                <p className="font-inter text-green-30 text-sm leading-relaxed">
                  Если приют одобрил вашу заявку, вы можете отводить животное в приют
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GiveAnimal;