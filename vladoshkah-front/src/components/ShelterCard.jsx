import React from "react";
import { Link } from 'react-router-dom';
import PriutPhoto from '../assets/images/priut.jpg';

const ShelterCard = ({ shelterData, onShowMap }) => {
    const { id, name, rating, description, photoUrl } = shelterData;

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
        <article className="relative w-full max-w-[1260px] min-h-[400px] md:h-[400px] bg-green-90 rounded-custom overflow-hidden flex flex-col md:flex-row">
            <div className="relative w-full md:w-[350px] h-[180px] md:h-full flex-shrink-0">
                <img 
                    src={photoUrl || PriutPhoto} 
                    alt={`Приют ${name}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                        e.target.style.display = 'none';
                        const fallback = document.getElementById(`shelter-main-fallback-${id}`);
                        if (fallback) fallback.style.display = 'flex';
                    }}
                />
                <div 
                    id={`shelter-main-fallback-${id}`}
                    className="hidden w-full h-full bg-gradient-to-br from-green-70 to-green-60 items-center justify-center flex-col p-4 text-center"
                >
                    <span className="text-green-98 font-sf-rounded font-bold text-xl mb-2">{name}</span>
                    <span className="text-green-95 font-inter">Приют для животных</span>
                </div>
                <div className="absolute top-0 right-0 w-32 h-full bg-gradient-to-l from-green-90 to-transparent hidden md:block"></div>
            </div>

            <div className="flex-1 flex flex-col items-start justify-between p-4 md:p-6 md:pl-6 md:pr-6">
                <div className="w-full">
                    <header className="inline-flex flex-col items-start relative mb-3 md:mb-4 w-full">
                        <h1 className="w-fit font-sf-rounded font-bold text-2xl md:text-4xl text-green-30 mb-2">
                            {name}
                        </h1>

                        <div className="flex items-center gap-2">
                            <div className="flex">
                                {renderStars(rating)}
                            </div>
                            <span className="font-inter font-medium text-green-30 text-sm">
                                {rating}
                            </span>
                        </div>
                    </header>

                    <p className="font-inter font-medium text-green-30 text-sm md:text-base leading-relaxed">
                        {description}
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
                    <Link
                        to={`/приют/${id}`}
                        className="all-[unset] box-border flex h-11 items-center justify-center gap-2 px-6 py-3 bg-green-70 rounded-custom-small hover:bg-green-80 transition-colors cursor-pointer w-full sm:w-auto"
                        aria-label={`Перейти в профиль приюта ${name}`}
                    >
                        <span className="relative w-fit font-inter font-medium text-green-20 text-base">
                            Перейти в приют
                        </span>
                    </Link>
                    
                    {onShowMap && (
                        <button
                            onClick={() => onShowMap(shelterData)}
                            className="all-[unset] box-border flex h-11 items-center justify-center gap-2 px-6 py-3 bg-green-60 rounded-custom-small hover:bg-green-50 transition-colors cursor-pointer w-full sm:w-auto"
                            aria-label={`Показать на карте приют ${name}`}
                        >
                            <svg className="w-5 h-5 text-green-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                            </svg>
                            <span className="relative w-fit font-inter font-medium text-green-20 text-base">
                                На карте
                            </span>
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
};

export default ShelterCard;