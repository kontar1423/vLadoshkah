import React from "react";
import { Link } from 'react-router-dom';
import featuredSeasonalAndGifts from '../assets/images/featured_seasonal_and_gifts.png';

const PetCard = ({ petData }) => {
    const {
        name = "Честер",
        age = "11 мес", 
        gender = "male",
        image,
        genderIcon,
        id
    } = petData || {};

    return (
        <article 
            className="flex flex-col h-full min-h-[400px] bg-green-90 rounded-custom-small shadow-lg overflow-hidden transform transition-transform duration-300 ease-in-out hover:-translate-y-2 hover:shadow-xl"
            aria-label={`Карточка питомца ${name}`}
        >
            {/* Контейнер для фотографии с градиентным переходом */}
            <div className="relative flex-1 bg-gray-100 rounded-t-custom-small overflow-hidden">
                {image ? (
                <>
                    <img
                    className="w-full h-full min-h-[280px] object-cover rounded-t-custom-small"
                    alt={`Фотография ${name}`}
                    src={image}
                    />
                    {/* Градиентный переход от фото к фону карточки */}
                    <div className="absolute bottom-0 left-0 w-full h-14 bg-gradient-to-t from-green-90 to-transparent"></div>
                </>
                ) : (
                <div 
                    className="w-full h-full min-h-[280px] bg-gray-200 rounded-t-custom-small flex items-center justify-center"
                    aria-label="Заглушка для фотографии"
                >
                    <span className="text-gray-400 font-inter">Фото питомца</span>
                </div>
                )}
            </div>

            {/* Информация о питомце - выровнена по левому краю */}
            <div 
                className="flex items-center gap-2 w-full px-4 relative -mt-6"
                role="group"
                aria-label="Информация о питомце"
            >
                {/* Имя питомца в круглом окошке */}
                <div className="inline-flex items-center justify-center gap-1">
                <div className="px-3 py-1 bg-green-90 rounded-full border-2 border-green-30 shadow-sm">
                    <span className="font-inter font-regular text-green-30 text-[16px] md:text-[18px] tracking-[0] leading-[normal]">
                    {name}
                    </span>
                </div>
                </div>

                {/* Пол питомца */}
                <div
                className="flex w-8 h-8 md:w-[37px] md:h-[37px] items-center justify-center bg-green-90 rounded-full border-2 border-green-30 shadow-sm"
                aria-label="Пол"
                >
                {genderIcon ? (
                    <img
                    className="relative w-4 h-4 md:w-6 md:h-6 aspect-[1]"
                    alt={gender === "male" ? "Самец" : "Самка"}
                    src={genderIcon}
                    />
                ) : (
                    <span className="text-green-30 text-xs md:text-sm font-regular">
                    {gender === "male" ? "♂" : "♀"}
                    </span>
                )}
                </div>

                {/* Возраст питомца */}
                <div
                className="inline-flex justify-center px-2 py-1 md:px-3 md:py-2 bg-green-90 rounded-full border-2 border-green-30 shadow-sm"
                aria-label="Возраст"
                >
                <span className="relative w-fit font-inter font-regular text-green-30 text-[12px] md:text-[14px] tracking-[0] leading-[normal]">
                    {age}
                </span>
                </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex w-full items-center gap-2 px-4 pb-4 pt-2">
                <Link
                    to={`/питомец/${id}`}
                    className="flex items-center justify-center gap-2 px-3 py-2 md:px-5 md:py-2.5 flex-1 bg-green-60 rounded-custom-small hover:bg-green-50 transition-colors shadow-sm"
                    aria-label={`Познакомиться с ${name}`}
                >
                    <span className="font-sf-rounded font-large text-green-98 text-[14px] md:text-[16px] tracking-[0] leading-[normal]">
                        Познакомиться
                    </span>
                </Link>
                
                <button
                className="flex w-8 h-8 md:w-[40px] md:h-[40px] items-center justify-center bg-green-60 rounded-custom-small hover:bg-green-50 transition-colors shadow-sm"
                type="button"
                aria-label="Отправить подарок"
                >
                <img
                    className="relative w-4 h-4 md:w-6 md:h-6 aspect-[1]"
                    alt="Отправить подарок"
                    src={featuredSeasonalAndGifts}
                />
                </button>
            </div>
        </article>
    );
};

export default PetCard;