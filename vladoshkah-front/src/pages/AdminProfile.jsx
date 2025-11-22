import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import profpic from '../assets/images/profpic.jpg'
import PetCard from '../components/PetCard'
import pesik from '../assets/images/pesik.jpg'
import artem from '../assets/images/artem.jpg'

const AdminProfile = () => {
    const navigate = useNavigate()


    const [shelterInfo, setShelterInfo] = useState(null)
    const [shelterPets, setShelterPets] = useState([])

    const [hasPendingApplication, setHasPendingApplication] = useState(false)


    const handleRegisterShelter = () => {
        navigate('/регистрация-приюта')
    }

    const handleAddPet = () => {
        navigate('/Anketa_give', { 
            state: { 
                shelterId: shelterInfo.id, 
                shelterName: shelterInfo.name 
            } 
        })
    }

    const handleSubmitApplication = () => {
        console.log('Заявка на подтверждение приюта отправлена')
        setHasPendingApplication(true)
    }

    return (
        <div className="min-h-screen bg-green-95">
        <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px] py-10">
            <div className="flex flex-col lg:flex-row gap-8">
            <main className="flex-1">
                {!shelterInfo ? (
                <section className="bg-green-90 rounded-custom p-8 mb-8 border-2 border-green-80">
                    <div className="text-center">
                    <div className="w-20 h-20 bg-green-80 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-10 h-10 text-green-30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                    </div>
                    <h2 className="font-sf-rounded font-bold text-green-30 text-2xl mb-4">
                        {hasPendingApplication ? 'Заявка на рассмотрении' : 'Зарегистрируйте приют'}
                    </h2>
                    <p className="font-inter text-green-40 text-base mb-6 max-w-md mx-auto">
                        {hasPendingApplication 
                            ? 'Ваша заявка на регистрацию приюта находится на рассмотрении. Ожидайте подтверждения администратора.'
                            : 'Внесите корректные данные о приюте, чьим представителем вы являетесь'
                        }
                    </p>
                    {!hasPendingApplication && (
                        <button
                            onClick={handleRegisterShelter}
                            className="px-8 py-4 bg-green-70 text-green-100 font-sf-rounded font-semibold text-lg rounded-custom-small hover:bg-green-60 transition-colors shadow-lg"
                        >
                            Зарегистрировать приют
                        </button>
                    )}
                    {hasPendingApplication && (
                        <div className="animate-pulse">
                            <div className="px-8 py-4 bg-green-80 text-green-40 font-sf-rounded font-semibold text-lg rounded-custom-small">
                                Ожидание подтверждения...
                            </div>
                        </div>
                    )}
                    </div>
                </section>
                ) : (
                <>
                    <section className="bg-green-90 rounded-custom p-6 mb-8 border-2 border-green-50">
                        <div className="flex items-center justify-between">
                        <div>
                            <h2 className="font-sf-rounded font-bold text-green-30 text-2xl mb-2">
                            Подтвержденный приют
                            </h2>
                            <p className="font-inter text-green-40 text-lg">
                            {shelterInfo.name}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-4 py-2 bg-green-50 text-green-100 font-sf-rounded font-medium text-sm rounded-full">
                            Активен
                            </span>
                        </div>
                        </div>
                    </section>

                    <section className="bg-green-90 rounded-custom p-6 mb-8">
                        <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-2">
                                Управление питомцами приюта
                            </h3>
                            <p className="font-inter text-green-40 text-base">
                                Добавьте нового питомца в приют "{shelterInfo.name}"
                            </p>
                        </div>
                        <button
                            onClick={handleAddPet}
                            className="px-6 py-3 bg-green-50 text-green-100 font-sf-rounded font-semibold text-base rounded-custom-small hover:bg-green-60 cursor-pointer transition-colors"
                        >
                            Добавить питомца
                        </button>
                        </div>
                    </section>

                    <div className="border-t border-green-80 my-8"></div>

                    {shelterPets.length > 0 && (
                    <section className="mb-12">
                        <header className="flex items-center gap-4 mb-6">
                        <h2 className="font-sf-rounded font-bold text-green-20 text-2xl md:text-3xl">
                            Питомцы приюта: {shelterInfo.name}
                        </h2>
                        <span className="px-3 py-1 bg-green-50 text-green-100 font-sf-rounded font-medium text-sm rounded-full">
                            {shelterPets.length}
                        </span>
                        </header>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {shelterPets.map((pet) => (
                            <PetCard 
                            key={pet.id}
                            petData={pet}
                            />
                        ))}
                        </div>
                    </section>
                    )}
                </>
                )}

                <section className="flex flex-col items-center gap-6 relative">
                <header className="flex items-center gap-6 relative self-stretch">
                    <h1 className="w-fit mt-[-1.00px] font-sf-rounded font-bold text-green-20 text-2xl md:text-3xl">
                    Мои питомцы
                    </h1>
                    <span className="px-3 py-1 bg-green-80 text-green-30 font-sf-rounded font-medium text-sm rounded-full">
                    {personalPets.length}
                    </span>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    {personalPets.map((pet) => (
                    <PetCard 
                        key={pet.id}
                        petData={pet}
                    />
                    ))}
                </div>
                </section>
            </main>

            <aside
                className="lg:w-[340px] flex flex-col gap-6"
                aria-label="Информация о пользователе"
            >
                <div className="relative bg-green-90 rounded-custom overflow-hidden">
                <div className="relative h-124">
                    <img
                    className="w-full h-full object-cover"
                    alt="Фон профиля Константина"
                    src={volunteerInfo.image}
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/30 to-black/50"></div>
                    
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

                <div className="bg-green-95 rounded-custom p-6 space-y-1">
                <h3 className="font-sf-rounded font-bold text-green-20 text-lg mb-2">
                    Личная информация
                </h3>
                
                <div className="space-y-4">
                    <div className="inline-flex w-fit">
                    <div className="px-4 py-3 bg-green-98 rounded-custom-small border-2 border-green-30">
                        <a
                        href={`tel:${volunteerInfo.phone}`}
                        className="relative w-fit font-inter font-regular text-green-20 text-base hover:text-green-30 transition-colors whitespace-nowrap"
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

                <div className="bg-green-90 rounded-custom p-6">
                <h3 className="font-sf-rounded font-bold text-green-20 text-lg mb-4">
                    О себе
                </h3>
                <p className="font-inter font-regular text-green-20 text-base leading-relaxed">
                    {volunteerInfo.bio}
                </p>
                </div>

                {!shelterInfo && !hasPendingApplication && (
                <div className="bg-green-95 rounded-custom p-4">
                    <p className="font-inter font-regular text-green-20 text-sm leading-relaxed text-left">
                        Вы являетесь представителем приюта?{' '}
                        <button 
                            onClick={handleSubmitApplication}
                            className="underline hover:text-green-30 transition-colors text-green-50 font-medium"
                        >
                            Отправьте заявку
                        </button>
                        {' '}для доступа к функциям администратора
                    </p>
                </div>
                )}
            </aside>
            </div>
        </div>
        </div>
    )
}

export default AdminProfile