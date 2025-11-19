// src/components/MiniShelterCard.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import PriutPhoto from '../assets/images/priut.jpg';

const MiniShelterCard = ({ shelter }) => {
    const { id, name, rating, district, description, photoUrl } = shelter;

    const renderStars = (ratingValue) => {
        const fullStars = Math.floor(ratingValue);
        const hasHalfStar = ratingValue % 1 >= 0.5;
        
        return Array(5).fill(0).map((_, i) => {
            if (i < fullStars) {
                return (
                    <svg
                        key={i}
                        className="w-4 h-4 text-green-30"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                );
            } else if (i === fullStars && hasHalfStar) {
                return (
                    <svg
                        key={i}
                        className="w-4 h-4 text-green-30"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <defs>
                            <linearGradient id={`half-${id}-${i}`}>
                                <stop offset="50%" stopColor="currentColor"/>
                                <stop offset="50%" stopColor="#BEEFBB"/>
                            </linearGradient>
                        </defs>
                        <path fill={`url(#half-${id}-${i})`} d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                );
            } else {
                return (
                    <svg
                        key={i}
                        className="w-4 h-4 text-green-80"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                );
            }
        });
    };

    return (
        <div className="bg-green-90 rounded-custom-small p-4 w-full max-w-[380px] h-full flex flex-col">
            {/* Увеличенная фотография */}
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
                {/* Fallback для фото приюта */}
                <div 
                    id={`shelter-fallback-${id}`}
                    className="hidden w-full h-full bg-gradient-to-br from-green-70 to-green-60 items-center justify-center flex-col p-4 text-center"
                >
                    <span className="text-green-98 font-sf-rounded font-bold mb-1">{name}</span>
                    <span className="text-green-95 font-inter text-sm">Приют для животных</span>
                </div>
            </div>
            
            <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-2 line-clamp-1">{name}</h3>
            
            <div className="flex items-center gap-2 mb-3">
                <div className="flex">
                    {renderStars(rating || 0)}
                </div>
            </div>
            
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