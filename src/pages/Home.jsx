import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import LapaIcon from '../assets/images/lapa.png';
import KotPhoto from '../assets/images/kot.png';
import CherbelPesPhoto from '../assets/images/cherbelpes.png';
import HorkiPhoto from '../assets/images/horki.png';
import PriutPhoto from '../assets/images/priut.jpg';
import ShapeTrue from '../assets/images/shapetrue.png';
import PigsPhoto from '../assets/images/pigs.png';
import MiniShelterCard from '../components/MiniShelterCard';
import { animalService } from '../services/animalService';
import { shelterService } from '../services/shelterService';
import PetCarousel from '../components/PetCarousel';
import ShelterCarousel from '../components/ShelterCarousel';

const Home = () => {
  // --- Состояния ---
  const [animals, setAnimals] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [loadingAnimals, setLoadingAnimals] = useState(true);
  const [loadingShelters, setLoadingShelters] = useState(true);
  const [animalIndex, setAnimalIndex] = useState(0);
  const [shelterIndex, setShelterIndex] = useState(0);

  // --- Загрузка данных ---
  useEffect(() => {
  const loadAnimals = async () => {
    try {
      console.log('Начало загрузки животных...');
      const data = await animalService.getAllAnimals(); 
      console.log('Данные животных:', data);
      setAnimals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Ошибка загрузки животных:', err);
      setAnimals([]);
    } finally {
      setLoadingAnimals(false);
    }
  };
  loadAnimals();
}, []);

  useEffect(() => {
    const loadShelters = async () => {
      try {
        const data = await shelterService.getAllShelters();
        setShelters(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Ошибка загрузки приютов:', err);
      } finally {
        setLoadingShelters(false);
      }
    };
    loadShelters();
  }, []);

  // --- Карусель питомцев ---
  const nextAnimal = () => {
    setAnimalIndex((prev) => (prev + 1) % animals.length);
  };

  const prevAnimal = () => {
    setAnimalIndex((prev) => (prev - 1 + animals.length) % animals.length);
  };

  // --- Карусель приютов ---
  const nextShelter = () => {
    setShelterIndex((prev) => (prev + 1) % shelters.length);
  };

  const prevShelter = () => {
    setShelterIndex((prev) => (prev - 1 + shelters.length) % shelters.length);
  };

  // --- Функция для получения округа ---
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

  // --- Рендер карточек ---
  const visibleAnimals = animals.length < 3 
    ? [...animals, ...animals.slice(0, 3 - animals.length)] 
    : animals;

  const visibleShelters = shelters.length < 3 
    ? [...shelters, ...shelters.slice(0, 3 - shelters.length)] 
    : shelters;

  return (
    <div className="min-h-screen bg-green-95">
      {/* 1. Hero — пустой блок */}
      <section className="w-full max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-16">
        <div className="bg-green-90 rounded-custom h-[400px] md:h-[500px] w-full"></div>
      </section>

      {/* 2. Карусель питомцев */}
      <section className="w-full max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-12">
        <h2 className="font-sf-rounded font-bold text-green-30 text-3xl md:text-5xl text-center mb-10">
          Забери нас домой!
        </h2>

        {loadingAnimals ? (
          <div className="text-center py-10 text-green-40">Загрузка питомцев...</div>
        ) : (
          <PetCarousel pets={animals} />
        )}
      </section>

<section className="w-full max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-12">
  <div className="bg-green-90 rounded-custom p-8 md:p-12 relative overflow-hidden">
    {/* Фигура с фоткой справа - срезанная наполовину */}
    <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-90 overflow-hidden">
      <div className="relative -right-1/4">
        {/* Основная большая фигура (видна только половина) */}
        <img
          src={ShapeTrue}
          alt="Фоновая фигура"
          className="w-80 h-80 md:w-96 md:h-96 lg:w-[500px] lg:h-[500px]"
        />
        {/* Вложенная фигура другого цвета - увеличенная */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative">
            <img
              src={ShapeTrue}
              alt="Вложенная фигура"
              className="w-56 h-56 md:w-72 md:h-72 lg:w-96 lg:h-96 filter brightness-0 opacity-70"
              style={{ filter: 'brightness(0) invert(1) opacity(0.7)' }}
            />
            {/* Фотка внутри вложенной фигуры */}
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

    {/* Текст слева */}
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

      {/* 4. Карусель приютов */}
      <section className="w-full max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-12">
        <h2 className="font-sf-rounded font-bold text-green-30 text-3xl md:text-5xl text-center mb-1">
          Обратите внимание на эти приюты
        </h2>

        {loadingShelters ? (
          <div className="text-center py-10 text-green-40">Загрузка приютов...</div>
        ) : (
          <ShelterCarousel shelters={shelters} />
        )}
      </section>

      {/* 5. Карта */}
      <section className="w-full max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-12">
        <h2 className="font-sf-rounded font-bold text-green-30 text-3xl md:text-4xl text-center mb-6">
          Приюты на карте
        </h2>
        <div className="bg-green-90 border-2 border-green-30 rounded-custom overflow-hidden">
          <div className="w-full h-[650px] flex items-center justify-center">
            <div className="text-center">
              <svg className="w-16 h-16 text-green-60 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p className="font-inter text-green-40 text-lg">Интерактивная карта приютов будет здесь</p>
            </div>
          </div>
        </div>
      </section>

      <section className="w-full max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Левый блок — вопросы */}
          <div className="space-y-8">
            {/* Вопрос 1 */}
            <div className="bg-green-90 rounded-custom p-6 flex items-start gap-6 relative overflow-hidden">
              {/* Фигура 1 - видна наполовину справа */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 opacity-20">
                <img
                  src={ShapeTrue}
                  alt="Фоновая фигура"
                  className="w-32 h-32"
                />
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

            {/* Вопрос 2 */}
            <div className="bg-green-80 rounded-custom p-6 flex items-start gap-6 relative overflow-hidden">
              {/* Фигура 2 - две фигуры в разных позициях */}
              <div className="absolute -left-8 -top-8 opacity-15">
                <img
                  src={ShapeTrue}
                  alt="Фоновая фигура"
                  className="w-24 h-24"
                />
              </div>
              <div className="absolute -right-12 bottom-4 opacity-10">
                <img
                  src={ShapeTrue}
                  alt="Фоновая фигура"
                  className="w-36 h-36"
                />
              </div>
              <div className="flex-shrink-0 z-10">
                <img
                  src={CherbelPesPhoto}
                  alt="Собака"
                  className="w-24 h-24 rounded-custom-small object-cover"
                />
              </div>
              <div className="z-10">
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

          {/* Правый блок — связь с нами */}
          <div className="bg-green-40 rounded-custom p-6 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Фигура 3 - большая фигура снизу слева */}
            <div className="absolute -left-20 -bottom-20 opacity-15">
              <img
                src={ShapeTrue}
                alt="Фоновая фигура"
                className="w-64 h-64"
              />
            </div>
            {/* Фигура 4 - маленькая фигура сверху справа */}
            <div className="absolute -right-10 -top-10 opacity-10">
              <img
                src={ShapeTrue}
                alt="Фоновая фигура"
                className="w-40 h-40"
              />
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
                href="https://t.me/your_bot"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-green-95 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-8 h-8 text-green-40" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.894 8.221l-1.97 9.28c-.145.656-.537.814-1.084.506l-3-2.21-1.447 1.394c-.14.141-.264.26-.42.207L7.13 16.35c-.537-.203-.537-.61 0-.814l11.095-5.004c.536-.203 1.002.15.769.585z"/>
                  </svg>
                </div>
                <span className="font-inter text-green-95">Telegram</span>
              </a>

              <a
                href="https://wa.me/ваш_номер"
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center"
              >
                <div className="w-16 h-16 bg-green-95 rounded-full flex items-center justify-center mb-2">
                  <svg className="w-8 h-8 text-green-40" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                </div>
                <span className="font-inter text-green-95">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;