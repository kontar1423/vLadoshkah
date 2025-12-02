    import React from 'react';
    import { Link, useNavigate } from 'react-router-dom';
    import PriutPhoto from '../assets/images/priut.jpg';

    const MiniShelterCard = ({ shelter }) => {
    const { id, name, district, description, photoUrl } = shelter;
    const navigate = useNavigate();

    const handleCardClick = (e) => {
        if (window.innerWidth < 768) {
            e.preventDefault();
            navigate(`/shelter/${id}`);
        }
    }; 

    return (
        <div 
            onClick={handleCardClick}
            className="bg-green-90 rounded-custom-small p-2 sm:p-3 md:p-4 w-full max-w-[180px] sm:max-w-[280px] md:max-w-[380px] h-full flex flex-col cursor-pointer md:cursor-default hover:shadow-lg transition-shadow duration-300"
        >
        <div className="relative w-full h-24 sm:h-32 md:h-36 lg:h-40 mb-2 sm:mb-3 md:mb-4 overflow-hidden rounded-custom-small">
            <img
            src={photoUrl || PriutPhoto}
            alt={name}
            className="w-full h-full object-cover"
            onError={(e) => {
                e.target.style.display = 'none';
                const fallback = document.getElementById(`shelter-fallback-${id}`);
                if (fallback) fallback.style.display = 'flex';
            }}
            />
            <div 
            id={`shelter-fallback-${id}`}
            className="hidden w-full h-full bg-gradient-to-br from-green-70 to-green-60 items-center justify-center flex-col p-3 sm:p-4 text-center"
            >
            <span className="text-green-98 font-sf-rounded font-bold mb-1 text-sm sm:text-base">{name}</span>
            <span className="text-green-95 font-inter text-xs sm:text-sm">Приют для животных</span>
            </div>
        </div>
        
        <h3 className="font-sf-rounded font-bold text-green-30 text-sm sm:text-base md:text-lg lg:text-xl mb-1 sm:mb-1.5 md:mb-2 line-clamp-1">{name}</h3>
        
        <p className="font-inter text-green-40 text-[10px] sm:text-xs md:text-sm mb-1.5 sm:mb-2 md:mb-3 line-clamp-2 flex-grow">
            {description}
        </p>
        
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mt-auto gap-1 sm:gap-2">
            <span className="font-inter text-green-50 text-[9px] sm:text-xs md:text-sm truncate w-full sm:w-auto">{district || 'Москва'}</span>
            <Link
            to={`/shelter/${id}`}
            onClick={(e) => e.stopPropagation()}
            className="hidden md:inline font-inter font-medium text-green-70 hover:text-green-60 text-[9px] sm:text-xs md:text-sm transition-colors whitespace-nowrap"
            >
            Подробнее →
            </Link>
        </div>
        </div>
    );
    };

    export default MiniShelterCard;