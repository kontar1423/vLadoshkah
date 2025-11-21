    import React from 'react';
    import { Link } from 'react-router-dom';
    import PriutPhoto from '../assets/images/priut.jpg';

    const MiniShelterCard = ({ shelter }) => {
    const { id, name, district, description, photoUrl } = shelter; 

    return (
        <div className="bg-green-90 rounded-custom-small p-4 w-full max-w-[380px] h-full flex flex-col">
        <div className="relative w-full h-40 mb-4 overflow-hidden rounded-custom-small">
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
            className="hidden w-full h-full bg-gradient-to-br from-green-70 to-green-60 items-center justify-center flex-col p-4 text-center"
            >
            <span className="text-green-98 font-sf-rounded font-bold mb-1">{name}</span>
            <span className="text-green-95 font-inter text-sm">Приют для животных</span>
            </div>
        </div>
        
        <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-2 line-clamp-1">{name}</h3>
        
    
        
        <p className="font-inter text-green-40 text-sm mb-3 line-clamp-3 flex-grow">
            {description}
        </p>
        
        <div className="flex justify-between items-center mt-auto">
            <span className="font-inter text-green-50 text-sm">Округ: {district || 'Москва'}</span>
            <Link
            to={`/приют/${id}`}
            className="font-inter font-medium text-green-70 hover:text-green-60 text-sm transition-colors"
            >
            Подробнее →
            </Link>
        </div>
        </div>
    );
    };

    export default MiniShelterCard;