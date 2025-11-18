    import React from "react";
    import { Link } from 'react-router-dom';
    import PriutPhoto from '../assets/images/priut.jpg';

    const ShelterCard = ({ shelterData, onShowMap }) => {
    const { id, name, rating, description } = shelterData;

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
            src={PriutPhoto} 
            alt={`Приют ${name}`}
            className="w-full h-full object-cover"
            />
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

            <Link
            to={`/приют/${id}`}
            className="all-[unset] box-border flex h-11 items-center justify-center gap-2 px-6 py-3 bg-green-70 rounded-custom-small hover:bg-green-80 transition-colors cursor-pointer w-full mt-4"
            aria-label={`Перейти в профиль приюта ${name}`}
            >
            <span className="relative w-fit font-inter font-medium text-green-20 text-base">
                Перейти в приют
            </span>
            </Link>
        </div>
        </article>
    );
    };

    export default ShelterCard;