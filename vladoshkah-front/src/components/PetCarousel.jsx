    import React, { useState, useEffect, useRef } from 'react';
    import PetCard from './PetCard';

    const PetCarousel = ({ pets = [], favoritesMap = {} }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const containerRef = useRef(null);

    const CARD_WIDTH = 320;
    const GAP = 20;

    const navigateTo = (newIndex) => {
        if (isTransitioning || pets.length <= 1) return;
        setIsTransitioning(true);
        setCurrentIndex(newIndex);
        setTimeout(() => setIsTransitioning(false), 500);
    };

    const nextPet = () => navigateTo((currentIndex + 1) % pets.length);
    const prevPet = () => navigateTo((currentIndex - 1 + pets.length) % pets.length);

    useEffect(() => {
        if (pets.length <= 1) return;
        const interval = setInterval(() => {
        if (!isTransitioning) nextPet();
        }, 5000);
        return () => clearInterval(interval);
    }, [pets.length, currentIndex, isTransitioning]);

    if (pets.length === 0) {
        return (
        <div className="text-center py-10 text-green-40">
            Питомцы пока не добавлены
        </div>
        );
    }

    if (pets.length === 1) {
        return (
        <div className="flex justify-center py-6">
            <PetCard 
                petData={pets[0]} 
                initialFavorite={favoritesMap[pets[0].id] === true}
            />
        </div>
        );
    }

    
    const getCarouselItems = () => {
        const items = [];
        for (let offset = -1; offset <= 1; offset++) {
        const index = (currentIndex + offset + pets.length) % pets.length;
        const position = offset; 
        items.push({ pet: pets[index], position, uniqueKey: `${pets[index].id}-${offset}-${currentIndex}` });
        }
        return items;
    };

    const items = getCarouselItems();

    return (
        <div className="relative w-full max-w-6xl mx-auto px-4">
        <div
            ref={containerRef}
            className="relative h-[460px] flex items-center justify-center overflow-visible"
        >
            {items.map(({ pet, position, uniqueKey }) => {
            const isActive = position === 0;
            const isLeft = position === -1;
            const isRight = position === 1;

            let translateX = '0px';
            let scale = 1;
            let opacity = 1;
            let zIndex = 20;

            if (isActive) {
                translateX = '-50%';
                scale = 1;
                opacity = 1;
                zIndex = 30;
            } else if (isLeft) {
                translateX = `calc(-50% - ${CARD_WIDTH + GAP}px)`;
                scale = 0.85;
                opacity = 1;
                zIndex = 20;
            } else if (isRight) {
                translateX = `calc(-50% + ${CARD_WIDTH + GAP}px)`;
                scale = 0.85;
                opacity = 1;
                zIndex = 20;
            }

            return (
                <div
                key={uniqueKey}
                className="absolute transition-all duration-500 ease-out"
                style={{
                    width: `${CARD_WIDTH}px`,
                    left: '50%',
                    top: '50%',
                    transform: `translate(${translateX}, -50%) scale(${scale})`,
                    opacity: opacity,
                    zIndex: zIndex,
                    willChange: 'transform, opacity',
                }}
                >
                <PetCard 
                    petData={pet} 
                    initialFavorite={favoritesMap[pet.id] === true}
                />
                </div>
            );
            })}
        </div>

        {pets.length > 1 && (
            <>
            <button
                onClick={prevPet}
                disabled={isTransitioning}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-green-70 text-green-20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                isTransitioning
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-green-60 hover:scale-110 shadow-xl'
                }`}
                aria-label="Предыдущий питомец"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <button
                onClick={nextPet}
                disabled={isTransitioning}
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-green-70 text-green-20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                isTransitioning
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-green-60 hover:scale-110 shadow-xl'
                }`}
                aria-label="Следующий питомец"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
            </>
        )}

        {pets.length > 1 && (
            <div className="flex justify-center mt-6 space-x-2">
            {pets.map((_, i) => (
                <button
                key={i}
                onClick={() => navigateTo(i)}
                disabled={isTransitioning}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'bg-green-70 scale-125' : 'bg-green-40 hover:bg-green-50'
                }`}
                aria-label={`Перейти к питомцу ${i + 1}`}
                />
            ))}
            </div>
        )}
        </div>
    );
    };

    export default PetCarousel;