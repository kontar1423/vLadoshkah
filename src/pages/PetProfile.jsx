import React from "react";
import { Link } from 'react-router-dom';
import PetCard from '../components/PetCard';
import bellaPhoto from '../assets/images/bella_beli.jpg';

const PetProfile = () => {
    const currentPet = {
        id: 1,
        name: "Бэлла",
        age: "7 лет",
        weight: "25 кг",
        height: "35 см",
        coat: "Шерсть длинная",
        color: "Окрас черно-рыжий",
        breed: "Border collie",
        description: `Бэлла попала в приют после жизни на улице. Её нашли истощённой в промышленной зоне города, владелец так и не объявился.

    Первое время в приюте она была замкнутой и пассивной, держалась в стороне от людей и других собак. Со временем она привыкла к персоналу, но к незнакомцам по-прежнему относится настороженно и требует времени, чтобы начать доверять.

    Сейчас Бэлла — спокойная и сдержанная собака с флегматичным темпераментом. Она не создаёт шума, не проявляет агрессии, но не стремится к активному общению. Идеальным хозяином для неё станет терпеливый человек, готовый дать ей время освоиться в доме и ценящий спокойную и преданную компанию.`,
        shelter: "Приют: \"ПетДом\"",
        shelterId: "petdom", // Добавлен ID приюта для маршрута
        address: "Адрес: Шмаковская 23к4",
        gender: "female",
        image: bellaPhoto
    };

    const similarPets = [
        {
        id: 1,
        name: "Честер",
        age: "11 мес",
        gender: "male",
        genderIcon: null,
        image: null
        },
        {
        id: 2,
        name: "Горемыка",
        age: "2 года",
        gender: "female",
        genderIcon: null,
        image: null
        }
    ];

    const petInfo = [
        { id: 1, text: currentPet.age },
        { id: 2, text: currentPet.weight },
        { id: 3, text: currentPet.height },
    ];

    const petDetails = [
        { id: 4, text: currentPet.coat },
        { id: 5, text: currentPet.color },
    ];

    return (
        <div className="min-h-screen bg-green-95 py-10">
        <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:px-[60px]">
            {/* Основной контент */}
            <div className="flex flex-col lg:flex-row gap-8 items-start">
            
            {/* Левая колонка - фото и характеристики */}
            <div className="lg:w-1/3">
                <article className="flex flex-col items-start gap-6 bg-green-95 rounded-custom p-6">
                {/* Фото питомца с градиентом только внизу */}
                <div className="w-full aspect-[1.01] rounded-custom overflow-hidden relative">
                    <img
                    className="w-full h-full object-cover"
                    alt={`Фотография ${currentPet.name}`}
                    src={currentPet.image}
                    />
                    {/* Градиент только внизу фото */}
                    <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-green-95 to-transparent"></div>
                    
                    {/* Имя и пол поверх фото */}
                    <div className="absolute bottom-6 left-6 right-6">
                    <div className="flex items-center gap-4">
                        {/* Имя в окне green-90 с текстом green-20 */}
                        <div className="px-4 py-2 bg-green-90 rounded-full">
                        <h2 className="font-sf-rounded font-bold text-green-20 text-2xl">
                            {currentPet.name}
                        </h2>
                        </div>
                        
                        {/* Пол полупрозрачный green-90 с текстом green-20 */}
                        <div className="flex w-11 h-11 items-center justify-center bg-green-90/80 rounded-[100px] backdrop-blur-sm">
                        <span className="text-green-20 text-sm font-semibold">
                            {currentPet.gender === "male" ? "♂" : "♀"}
                        </span>
                        </div>
                    </div>
                    </div>
                </div>

                {/* Характеристики питомца */}
                <div className="relative w-[231px] h-[106px]">
                    {/* Первая строка характеристик */}
                    {petInfo.map((info, index) => (
                    <div
                        key={info.id}
                        className="inline-flex items-center justify-center gap-2.5 py-1 px-2 absolute top-0 bg-green-70 rounded-[100px] overflow-hidden"
                        style={{ left: `${index * 76 + (index > 0 ? 1 : 0)}px` }}
                    >
                        <div className="relative w-fit mt-[-1.00px] font-inter font-semibold text-green-98 text-xl tracking-[0]">
                        {info.text}
                        </div>
                    </div>
                    ))}

                    {/* Вторая строка характеристик */}
                    {petDetails.map((detail, index) => (
                    <div
                        key={detail.id}
                        className="inline-flex items-center justify-center gap-2.5 py-1 px-2 absolute bg-green-70 rounded-[100px] overflow-hidden"
                        style={{ top: `${37 + index * 37}px`, left: '0px' }}
                    >
                        <div className="text-green-98 relative w-fit mt-[-1.00px] font-inter font-semibold text-xl tracking-[0]">
                        {detail.text}
                        </div>
                    </div>
                    ))}
                </div>

                </article>
            </div>

            {/* Правая колонка - описание и контакты */}
            <div className="lg:w-2/3">
                {/* Описание питомца */}
                <section className="flex flex-col items-start justify-center gap-4 mb-6">
                <div className="flex items-center justify-center p-6 relative self-stretch w-full bg-green-90 rounded-custom">
                    <p className="flex-1 font-inter font-regular text-green-20 text-[16px] leading-relaxed whitespace-pre-line">
                    {currentPet.description}
                    </p>
                </div>
                </section>

                {/* Контакты приюта */}
                <section className="flex flex-col items-start justify-center gap-4 mb-8">
                <div className="flex items-center justify-between p-6 relative self-stretch w-full bg-green-90 rounded-custom">
                    <address className="flex-1 font-inter font-semibold text-green-20 text-[16px] leading-relaxed not-italic">
                    {currentPet.shelter}
                    <br />
                    {currentPet.address}
                    </address>

                    <Link
                    to={`/приют/${currentPet.shelterId}`}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-70 rounded-custom-small hover:bg-green-60 transition-colors"
                    aria-label="Перейти к профилю приюта"
                    >
                    <span className="font-inter font-medium text-green-98 text-[16px]">
                        К приюту
                    </span>
                    </Link>
                </div>
                </section>

                {/* Похожие питомцы */}
                <section className="flex flex-col items-center gap-4 relative self-stretch">
                <div className="flex items-center gap-[25px] relative self-stretch w-full mb-6">
                    <h2 className="w-fit font-sf-rounded font-bold text-green-20 text-2xl">
                    Похожие питомцы
                    </h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    {similarPets.map((pet) => (
                    <PetCard 
                        key={pet.id}
                        petData={pet}
                    />
                    ))}
                </div>
                </section>
            </div>
            </div>
        </div>
        </div>
    );
};

export default PetProfile;