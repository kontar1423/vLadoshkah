import React, { useState, useEffect, useRef } from 'react';
import LapaIcon from '../assets/images/lapa.png';
import KotPhoto from '../assets/images/kot.png';
import CherbelPesPhoto from '../assets/images/cherbelpes.png';
import ShapeTrue from '../assets/images/shapetrue.png';
import PigsPhoto from '../assets/images/pigs.png';
import LudskoePhoto from '../assets/images/ludskoe.png';
import GodpesPhoto from '../assets/images/godpes.png'; 
import MiniShelterCard from '../components/MiniShelterCard';
import { animalService } from '../services/animalService';
import { shelterService } from '../services/shelterService';
import { favoriteService } from '../services/favoriteService';
import { useAuth } from '../context/AuthContext';
import PetCarousel from '../components/PetCarousel';
import ShelterCarousel from '../components/ShelterCarousel';
import LetterByLetter from '../components/ArcLetterByLetter';
import SheltersMap from '../components/SheltersMap';
import PetCardSkeleton from '../components/PetCardSkeleton';
import ShelterCardSkeleton from '../components/ShelterCardSkeleton'; 

const Home = () => {
  const { user } = useAuth();
  const [animals, setAnimals] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loadingAnimals, setLoadingAnimals] = useState(true);
  const [loadingShelters, setLoadingShelters] = useState(true);
  const [animalIndex, setAnimalIndex] = useState(0);
  const [shelterIndex, setShelterIndex] = useState(0);
  const [showText, setShowText] = useState(false); 
  const [favoritesMap, setFavoritesMap] = useState({});
  const sheltersLoadingRef = useRef(false);

const [selectedDistrict, setSelectedDistrict] = useState('all'); 

const getUniqueDistricts = (shelters) => {
  const districts = shelters
    .filter(shelter => shelter.region)
    .map(shelter => ({
      id: shelter.region,
      name: getDistrictName(shelter.region)
    }));
  const unique = [];
  const seen = new Set();
  for (const d of districts) {
    if (!seen.has(d.id)) {
      seen.add(d.id);
      unique.push(d);
    }
  }
  return unique.sort((a, b) => a.name.localeCompare(b.name));
};


  useEffect(() => {
    const loadAnimals = async () => {
      try {
        console.log('Начало загрузки животных...');
        const data = await animalService.getAllAnimals(); 
        console.log('Данные животных:', data);
        const animalsData = Array.isArray(data) ? data : [];
        setAnimals(animalsData);
        
        if (animalsData.length > 0 && user?.id) {
          try {
            const animalIds = animalsData.map(pet => pet.id);
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
        console.error('Ошибка загрузки животных:', err);
        setAnimals([]);
        setFavoritesMap({});
      } finally {
        setLoadingAnimals(false);
      }
    };
    loadAnimals();
  }, [user?.id]);

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


  useEffect(() => {
    const loadShelters = async () => {
      if (sheltersLoadingRef.current) {
        console.log('Home: Shelters load already in progress, skipping');
        return;
      }

      try {
        sheltersLoadingRef.current = true;
        const data = await shelterService.getAllShelters();
        
        const formattedShelters = (Array.isArray(data) ? data : []).map(shelter => ({
          ...shelter,
          district: getDistrictName(shelter.region),
          districtId: shelter.region,
          photoUrl: shelter.photoUrl || null
        }));

        setShelters(formattedShelters);
      } catch (err) {
        console.error('Ошибка загрузки приютов:', err);
        setShelters([]);
      } finally {
        setLoadingShelters(false);
        sheltersLoadingRef.current = false;
      }
    };
    loadShelters();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowText(true);
    }, 10);
    
    return () => clearTimeout(timer);
  }, []);

  const nextAnimal = () => {
    setAnimalIndex((prev) => (prev + 1) % animals.length);
  };

  const prevAnimal = () => {
    setAnimalIndex((prev) => (prev - 1 + animals.length) % animals.length);
  };

  const nextShelter = () => {
    setShelterIndex((prev) => (prev + 1) % shelters.length);
  };

  const prevShelter = () => {
    setShelterIndex((prev) => (prev - 1 + shelters.length) % shelters.length);
  };


  const visibleAnimals = animals.length < 3 
    ? [...animals, ...animals.slice(0, 3 - animals.length)] 
    : animals;

  const visibleShelters = shelters.length < 3 
    ? [...shelters, ...shelters.slice(0, 3 - shelters.length)] 
    : shelters;

  return (
    <div className="min-h-screen bg-green-95">
      <section className="w-full max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-12 sm:py-16">
        <div className="bg-green-90 rounded-custom h-[320px] sm:h-[380px] md:h-[500px] w-full relative overflow-hidden">
          <div className="absolute -bottom-20 -left-20 -right-20 flex items-start justify-center opacity-70">
            <div className="relative w-full max-w-4xl">
              <img
                src={ShapeTrue}
                alt="Фоновая форма"
                className="w-full object-cover scale-150"
                style={{ transform: 'scale(1) translateY(50%)' }}
              />
              
              
              <div className="absolute top-1/2  bottom-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4/5">
                <img
                  src={ShapeTrue}
                  alt="Вложенная форма"
                  className="w-full object-cover filter brightness-0 opacity-50"
                  style={{ 
                    filter: 'brightness(0) invert(1) opacity(0.5)',
                    transform: 'scale(0.7)'
                  }}
                /> 
              </div>
            </div>
          </div>
          
          <div className="absolute top-6 left-0 right-0 px-6 text-center sm:hidden">
            <p className="font-sf-rounded font-bold text-green-30 text-lg leading-tight max-w-[22ch] mx-auto">
              Настоящая дружба начинается здесь —<br />найди своего пушистого компаньона!
            </p>
          </div>

          <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-4 text-center animate-fade-in hidden sm:block">
            <LetterByLetter
              text="Настоящая дружба начинается здесь — найди своего пушистого компаньона!"
              delay={15}
              className="font-sf-rounded font-bold text-green-30 text-xl md:text-2xl lg:text-3xl leading-tight"
            />
          </div>
          
          <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
            <div className="relative w-full flex items-end justify-center h-[95%]">
              <img
                src={LudskoePhoto}
                alt="Руки"
                className="h-[86%] sm:h-[90%] max-h-none object-contain transform origin-[50%_100%] scale-[1.05] sm:scale-[1.18]"
              />
              <img
                src={GodpesPhoto}
                alt="Парящее изображение"
                className="absolute bottom-16 sm:bottom-22 md:bottom-36 lg:bottom-32 left-1/2 -translate-x-[55%] w-36 h-36 sm:w-40 sm:h-40 md:w-52 md:h-52 lg:w-64 lg:h-64 object-contain animate-float"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-8 sm:py-12">
        <h2 className="font-sf-rounded font-bold text-green-30 text-3xl md:text-5xl text-center mb-10 animate-slide-in-up">
          Забери нас домой!
        </h2>

        {loadingAnimals ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[...Array(3)].map((_, index) => (
              <PetCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <PetCarousel pets={animals} favoritesMap={favoritesMap} />
        )}
      </section>

<section className="w-full max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-8 sm:py-12">
  <div className="bg-green-90 rounded-custom p-8 md:p-12 relative overflow-hidden">
    
    <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-90 overflow-hidden">
      <div className="relative -right-1/4">
        
        <img
          src={ShapeTrue}
          alt="Фоновая фигура"
          className="w-80 h-80 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px]"
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <img
              src={ShapeTrue}
              alt="Вложенная фигура"
              className="w-56 h-56 md:w-72 md:h-72 lg:w-96 lg:h-96 filter brightness-0 opacity-70"
              style={{ filter: 'brightness(0) invert(1) opacity(0.7)' }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <img
                src={PigsPhoto}
                alt="Питомцы"
                className="w-44 h-44 md:w-56 md:h-56 lg:w-72 lg:h-72 object-cover rounded-full"
              />
            </div>
          </div>
        </div>
      </div>
    </div>

    <div className="relative z-10 max-w-2xl">
      <h2 className="font-sf-rounded font-bold text-green-30 text-3xl md:text-4xl mb-6">
        О нашей команде
      </h2>
      <div className="space-y-4">
        <p className="font-inter text-green-30 text-lg leading-relaxed">
          Мы — небольшая группа волонтёров, объединённых любовью к животным и мечтой сделать мир добрее.
        </p>
        <p className="font-inter text-green-30 text-lg leading-relaxed">
          Мы хотим обратить ваше внимание на большую проблему — сложность в выборе приюта, откуда можно взять животное. Отсутствие информации о приютах также порождает проблему, что люди, желающие финансово помочь, не знают как это сделать и какие приюты нуждаются в деньгах и провианте.
        </p>
        <p className="font-inter text-green-30 text-lg leading-relaxed">
          Наша команда решила помочь тем способом, которым может лучшего всего, а именно навыками в программировании. Мы надеемся, что наш сайт будет вам полезен!
        </p>
      </div>
    </div>
  </div>
</section>

      <section className="w-full max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-8 sm:py-12">
        <h2 className="font-sf-rounded font-bold text-green-30 text-3xl md:text-5xl text-center mb-1 animate-slide-in-up">
          Обратите внимание на эти приюты
        </h2>

        {loadingShelters ? (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {[...Array(2)].map((_, index) => (
              <ShelterCardSkeleton key={index} />
            ))}
          </div>
        ) : (
          <ShelterCarousel shelters={shelters} />
        )}
      </section>

      <section className="w-full max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-8 sm:py-12 relative z-10">
        <div className="text-center mb-8">
          <h2 className="font-sf-rounded font-bold text-green-30 text-3xl md:text-4xl mb-4">
            Приюты на карте
          </h2>
        </div>
        
        <div className="bg-green-90 border-2 border-green-40 rounded-custom overflow-hidden relative z-10">
          <div className="w-full h-[600px] relative z-10">
            {loadingShelters ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-40 mx-auto mb-4"></div>
                  <p className="font-inter text-green-40 text-lg">Загрузка карты...</p>
                </div>
              </div>
            ) : shelters.length > 0 ? (
              <SheltersMap 
                shelters={shelters}
                onShelterClick={(shelter) => {
                  window.location.href = `/shelter/${shelter.id}`;
                }}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
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
                  <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-2">
                    Приюты не найдены
                  </h3>
                  <p className="font-inter text-green-40 text-lg">
                    В системе пока нет зарегистрированных приютов
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      
        <div className="mt-6 flex justify-center">
            <div className="bg-green-40 rounded-custom-small px-4 py-2 text-center transition-all duration-300 hover:scale-105 hover:shadow-md">
            <div className="font-sf-rounded font-bold text-green-95 text-lg">
              {shelters.length} приютов на карте
            </div>
          </div>
        </div>
        
      </section>

      <section className="w-full max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-8 sm:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-8">
            <div className="bg-green-90 rounded-custom p-6 flex items-start gap-6 relative overflow-hidden">
              <div className="absolute top-9 left-8 w-20 h-20 bg-green-70 rounded-full opacity-60"></div>
              <div className="absolute top-12 right-16 w-16 h-16 bg-green-60 rounded-full opacity-40"></div>
              <div className="absolute bottom-8 left-20 w-12 h-12 bg-green-80 rounded-full opacity-50"></div>
              
              <div className="absolute top-1/2 left-1/3 w-8 h-8 bg-green-95 rounded-full opacity-70"></div>
              <div className="absolute top-1/3 right-1/4 w-10 h-10 bg-green-60 rounded-full opacity-25"></div>

              <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20">
                <img src={ShapeTrue} alt="Фоновая фигура" className="w-32 h-32" />
              </div>

              <div className="flex-shrink-0 z-10">
                <img
                  src={KotPhoto}
                  alt="Кот"
                  className="w-24 h-24 rounded-custom-small object-cover"
                />
              </div>
              <div className="z-10">
                <h3 className="font-sf-rounded font-bold text-green-30 text-xl md:text-2xl mb-3">
                  Не уверены, что ваша помощь поможет?
                </h3>
                <p className="font-inter text-green-30 text-lg leading-relaxed">
                  Любая помощь важна. Даже 50 рублей для приюта — это корм или лекарство.  
                  Лучше начать с малого, чем не начинать вовсе. Вместе мы сделаем больше.
                </p>
              </div>
            </div>

            <div className="bg-green-80 rounded-custom p-6 flex flex-col lg:flex-row-reverse items-start gap-6 relative overflow-hidden">
              <div className="absolute -left-8 -top-8 w-12 h-12 bg-green-40 rounded-full opacity-25"></div>
              <div className="absolute -right-18 bottom-7 w-24 h-24 bg-green-50 rounded-full opacity-30"></div>
              <div className="absolute top-6 right-10 w-10 h-10 bg-green-95 rounded-full opacity-40"></div>
              <div className="absolute bottom-12 left-8 w-16 h-16 bg-green-40 rounded-full opacity-20"></div>
              <div className="absolute top-1/3 left-1/4 w-8 h-8 bg-green-50 rounded-full opacity-40"></div>

              <div className="absolute -left-8 -top-8 opacity-15">
                <img src={ShapeTrue} alt="Фоновая фигура" className="w-24 h-24" />
              </div>
              <div className="absolute -right-12 bottom-4 opacity-10">
                <img src={ShapeTrue} alt="Фоновая фигура" className="w-36 h-36" />
              </div>

              <div className="flex-shrink-0 z-10">
                <img
                  src={CherbelPesPhoto}
                  alt="Собака"
                  className="w-24 h-24 rounded-custom-small object-cover"
                />
              </div>
              <div className="z-10 text-right lg:text-left">
                <h3 className="font-sf-rounded font-bold text-green-20 text-xl md:text-2xl mb-3">
                  А точно ли моя помощь дойдёт куда нужно?
                </h3>
                <p className="font-inter text-green-20 text-lg leading-relaxed">
                  На нашем сайте рейтинг приютов максимально честный и независимый.  
                  Вы сможете по-настоящему понять, кому можно доверять, чтобы ваш вклад пошёл на благо животным.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-20 rounded-custom p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute -left-10 -top-10 w-28 h-28 bg-green-40 rounded-full opacity-20"></div>
            <div className="absolute -right-16 -bottom-12 w-32 h-32 bg-green-20 rounded-full opacity-35"></div>
            <div className="absolute right-10 top-19 w-16 h-16 bg-green-90 rounded-full opacity-20"></div>
            <div className="absolute left-10 bottom-18 w-12 h-12 bg-green-70 rounded-full opacity-40"></div>
            <div className="absolute top-1/3 right-1/4 w-8 h-8 bg-green-50 rounded-full opacity-35"></div>

            <div className="absolute -left-20 -bottom-20 opacity-25">
              <img src={ShapeTrue} alt="Фоновая фигура" className="w-64 h-64" />
            </div>
            <div className="absolute -right-10 -top-10 opacity-20">
              <img src={ShapeTrue} alt="Фоновая фигура" className="w-40 h-40" />
            </div>

            <h3 className="font-sf-rounded font-bold text-green-95 text-2xl md:text-3xl text-center mb-6 z-10">
              Свяжитесь с нами
            </h3>
            <p className="font-inter text-green-98 text-lg text-center mb-8 z-10">
              У вас есть идеи, предложения или просто хотите помочь?  
              Мы всегда рады общению!
            </p>
            <div className="flex flex-wrap justify-center gap-8 z-10">
              <a
                href="https://web.telegram.org/a/#1216483862"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center group"
              >
                <div className="w-16 h-16 bg-green-95 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                  <svg className="w-8 h-8 text-green-40 group-hover:text-green-95 transition-all duration-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm4.64 6.8l-1.74 8.23c-.13.62-.47.78-1.01.49l-2.78-2.04-1.34 1.29c-.15.15-.27.27-.55.27l.2-2.84 5.18-4.68c.22-.2-.05-.31-.33-.11l-6.41 4.03-2.76-.86c-.6-.19-.61-.6.13-.89l10.78-4.14c.5-.18.93.13.75.85z"/>
                  </svg>
                </div>
              </a>

              <a
                href="https://web.whatsapp.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center group"
              >
                <div className="w-16 h-16 bg-green-95 rounded-full flex items-center justify-center mb-2 group-hover:bg-green-20 transition-all duration-300 group-hover:scale-110 group-hover:shadow-md">
                  <svg className="w-8 h-8 text-green-40 group-hover:text-green-95 transition-all duration-300" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
