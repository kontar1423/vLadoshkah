import React, { useState, useEffect } from 'react'
import profpic from '../assets/images/profpic.jpg'
import PetCard from '../components/PetCard'
import { useAuth } from '../context/AuthContext'
import { animalService } from '../services/animalService'

const Profile = () => {
  const { user } = useAuth();
  const [volunteerInfo] = useState({
    name: user?.firstname || "Пользователь",
    status: "Подтвержденный волонтер",
    phone: user?.phone || "+79745671234",
    email: user?.email || "examplebigemail@mail.com",
    gender: user?.gender === 'male' ? 'Мужской' : user?.gender === 'female' ? 'Женский' : 'Не указан',
    bio: "Люблю собак. Заберу домой каждую.",
    image: profpic
  })

  const [favoritePets, setFavoritePets] = useState([]);
  const [loading, setLoading] = useState(true);

  // Загрузка избранных питомцев
  useEffect(() => {
    loadFavoritePets();
  }, []);

  const loadFavoritePets = async () => {
    try {
      setLoading(true);
      
      // Временная реализация - получаем ID избранных из localStorage
      const favoriteIds = JSON.parse(localStorage.getItem('favoritePets') || '[]');
      
      // Загружаем данные по каждому избранному питомцу
      const petsData = [];
      for (const petId of favoriteIds) {
        try {
          const pet = await animalService.getAnimalById(petId);
          petsData.push(pet);
        } catch (error) {
          console.error(`Ошибка загрузки питомца ${petId}:`, error);
        }
      }
      
      setFavoritePets(petsData);
    } catch (error) {
      console.error('Ошибка загрузки избранных питомцев:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-green-95">
      <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Основной контент - избранные питомцы */}
          <main className="flex-1">
            <section className="flex flex-col items-center gap-6 relative">
              <header className="flex items-center gap-6 relative self-stretch">
                <h1 className="w-fit mt-[-1.00px] font-sf-rounded font-bold text-green-20 text-2xl md:text-3xl">
                  Мои питомцы ({favoritePets.length})
                </h1>
              </header>

              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-40 mx-auto"></div>
                  <p className="text-green-30 mt-4">Загрузка избранных питомцев...</p>
                </div>
              ) : favoritePets.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  {favoritePets.map((pet) => (
                    <PetCard 
                      key={pet.id}
                      petData={pet}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 w-full">
                  <div className="bg-green-90 rounded-custom p-8 max-w-md mx-auto">
                    <svg 
                      className="w-16 h-16 text-green-60 mx-auto mb-4"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-2">
                      Нет избранных питомцев
                    </h3>
                    <p className="font-inter text-green-20 mb-4">
                      Добавляйте питомцев в избранное, нажимая на сердечко на карточках животных
                    </p>
                  </div>
                </div>
              )}
            </section>
          </main>

          {/* Боковая панель - информация о волонтере */}
          <aside
            className="lg:w-[340px] flex flex-col gap-6"
            aria-label="Информация о пользователе"
          >
            {/* Фотография профиля */}
            <div className="relative bg-green-90 rounded-custom overflow-hidden">
              <div className="relative h-124">
                <img
                  className="w-full h-full object-cover"
                  alt="Фон профиля"
                  src={volunteerInfo.image}
                />
                {/* Затемнение для лучшей читаемости текста */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50"></div>
                
                {/* Имя поверх фотографии */}
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="font-sf-rounded font-bold text-green-98 text-2xl md:text-3xl">
                    {volunteerInfo.name}
                  </h2>
                  <div className="inline-flex items-center justify-center gap-2.5 px-4 py-2 bg-green-90/30 rounded-custom-small mt-2">
                    <span className="relative w-fit font-sf-rounded font-medium text-green-98 text-sm">
                      {volunteerInfo.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Блок "Личная информация" */}
            <div className="bg-green-95 rounded-custom p-6 space-y-1">
              <h3 className="font-sf-rounded font-bold text-green-20 text-lg mb-2">
                Личная информация
              </h3>
              
              {/* Контактная информация */}
              <div className="space-y-4">
                <div className="inline-flex w-fit">
                  <div className="px-4 py-3 bg-green-98 rounded-custom-small border-2 border-green-30">
                    <a
                      href={`tel:${volunteerInfo.phone}`}
                      className="relative w-fit font-inter font-regular text-green-20 text-base hover:text-green-30 transition-colors whitespace-nowrap"
                      aria-label={`Позвонить по номеру ${volunteerInfo.phone}`}
                    >
                      {volunteerInfo.phone}
                    </a>
                  </div>
                </div>

                <div className="inline-flex w-fit">
                  <div className="px-4 py-3 bg-green-98 rounded-custom-small border-2 border-green-30">
                    <a
                      href={`mailto:${volunteerInfo.email}`}
                      className="relative w-fit font-inter font-regular text-green-20 text-base hover:text-green-30 transition-colors whitespace-nowrap"
                      aria-label={`Написать на email ${volunteerInfo.email}`}
                    >
                      {volunteerInfo.email}
                    </a>
                  </div>
                </div>

                <div className="inline-flex w-fit">
                  <div className="px-4 py-3 bg-green-98 rounded-custom-small border-2 border-green-30">
                    <span className="relative w-fit font-inter font-regular text-green-20 text-base whitespace-nowrap">
                      {volunteerInfo.gender}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Блок "О себе" */}
            <div className="bg-green-90 rounded-custom p-6">
              <h3 className="font-sf-rounded font-bold text-green-20 text-lg mb-4">
                О себе
              </h3>
              <p className="font-inter font-regular text-green-20 text-base leading-relaxed">
                {volunteerInfo.bio}
              </p>
            </div>

            {/* Блок для представителей приюта */}
            <div className="bg-green-95 rounded-custom p-1">
              <p className="font-inter font-regular text-green-20 text-sm leading-relaxed text-left">
                Вы являетесь представителем приюта?{' '}
                <a 
                  href="mailto:admin@ladoshkahsos.ru?subject=Заявка на доступ администратора&body=Здравствуйте! Я хочу получить доступ к функциям администратора для приюта."
                  className="underline hover:text-green-30 transition-colors"
                  aria-label="Отправить заявку для доступа к функциям администратора"
                >
                Отправьте  заявку
                </a>
                {' '}для доступа к функциям администратора
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

export default Profile