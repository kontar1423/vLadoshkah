import React, { useState, useEffect, useRef } from 'react';
import PetCard from './PetCard';

const PetCarousel = ({ pets = [], favoritesMap = {}, isHomePage = false }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [isCompactLayout, setIsCompactLayout] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const checkMobile = () => {
            const width = window.innerWidth;
            setIsMobile(width < 640);
            setIsCompactLayout(width < 1024);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

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
            if (!isTransitioning) {
                setCurrentIndex((prev) => (prev + 1) % pets.length);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [pets.length, isTransitioning]);

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

    if (isCompactLayout && pets.length > 0) {
        const currentPet = pets[currentIndex];
        const isTablet = !isMobile;

        const mobileContainerClass = isHomePage
            ? (isTablet ? 'max-w-[380px]' : 'max-w-[300px]')
            : (isTablet ? 'max-w-[320px]' : 'max-w-[230px]');
        const mobileMinHeightClass = isHomePage
            ? (isTablet ? 'min-h-[420px]' : 'min-h-[360px]')
            : (isTablet ? 'min-h-[400px]' : 'min-h-[340px]');
        const mobileCardWidthClass = isHomePage
            ? (isTablet ? 'max-w-[360px]' : 'max-w-[320px]')
            : (isTablet ? 'max-w-[300px]' : 'max-w-[230px]');
        const mobileCardShiftClass = '';
        const arrowOffsetLeft = isHomePage ? '-left-8' : isTablet ? '-left-10' : '-left-12';
        const arrowOffsetRight = isHomePage ? '-right-8' : isTablet ? '-right-10' : '-right-12';
        const arrowSizeClass = isHomePage || isTablet ? 'w-11 h-11' : 'w-10 h-10';
        const arrowIconSize = isHomePage || isTablet ? 'w-5 h-5' : 'w-4 h-4';

        return (
            <div className={`relative w-full ${mobileContainerClass} mx-auto pt-4 pb-8`}>
                <div className={`relative overflow-visible flex items-center justify-center ${mobileMinHeightClass}`}>
                    <div className="flex-shrink-0 transition-all duration-500 ease-out flex justify-center items-center w-full">
                        <div className={`${mobileCardWidthClass} mx-auto`}>
                            <PetCard 
                                petData={currentPet} 
                                initialFavorite={favoritesMap[currentPet.id] === true}
                                wideMobile
                                mobileLarge={isHomePage || isTablet}
                            />
                        </div>
                    </div>
                </div>

                {pets.length > 1 && (
                    <>
                        <button
                            onClick={prevPet}
                            disabled={isTransitioning}
                            className={`absolute ${arrowOffsetLeft} top-1/2 -translate-y-1/2 z-40 bg-green-70 text-green-20 rounded-full ${arrowSizeClass} flex items-center justify-center transition-all duration-300 ${
                                isTransitioning
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-green-60 hover:scale-110 shadow-xl'
                            }`}
                            aria-label="Предыдущий питомец"
                        >
                            <svg className={`${arrowIconSize}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button
                            onClick={nextPet}
                            disabled={isTransitioning}
                            className={`absolute ${arrowOffsetRight} top-1/2 -translate-y-1/2 z-40 bg-green-70 text-green-20 rounded-full ${arrowSizeClass} flex items-center justify-center transition-all duration-300 ${
                                isTransitioning
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-green-60 hover:scale-110 shadow-xl'
                            }`}
                            aria-label="Следующий питомец"
                        >
                            <svg className={`${arrowIconSize}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <div className="flex justify-center items-center mt-6 mb-2 space-x-1.5 flex-wrap gap-y-2">
                            {(() => {
                                const getVisibleIndicators = () => {
                                    if (pets.length <= 5) {
                                        return pets.map((_, i) => i);
                                    }
                                    const indicators = [];
                                    if (currentIndex === 0) {
                                        indicators.push(pets.length - 1, 0, 1);
                                    } else if (currentIndex === pets.length - 1) {
                                        indicators.push(pets.length - 2, pets.length - 1, 0);
                                    } else {
                                        indicators.push(currentIndex - 1, currentIndex, currentIndex + 1);
                                    }
                                    return indicators;
                                };
                                const visibleIndicators = getVisibleIndicators();
                                return visibleIndicators.map((i) => (
                                    <button
                                        key={i}
                                        onClick={() => navigateTo(i)}
                                        disabled={isTransitioning}
                                        className={`rounded-full transition-all duration-300 ${
                                            i === currentIndex 
                                                ? 'bg-green-70 scale-110 w-1.5 h-1.5' 
                                                : 'bg-green-40 hover:bg-green-50 opacity-70 w-1 h-1'
                                        }`}
                                        aria-label={`Перейти к питомцу ${i + 1}`}
                                    />
                                ));
                            })()}
                        </div>
                    </>
                )}
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

    // Для десктопа показываем все индикаторы, если их не больше 10, иначе показываем только 3
    const getVisibleIndicators = () => {
        if (pets.length <= 10) {
            return pets.map((_, i) => i);
        }
        const indicators = [];
        if (currentIndex === 0) {
            indicators.push(pets.length - 1, 0, 1);
        } else if (currentIndex === pets.length - 1) {
            indicators.push(pets.length - 2, pets.length - 1, 0);
        } else {
            indicators.push(currentIndex - 1, currentIndex, currentIndex + 1);
        }
        return indicators;
    };

    const DESKTOP_CARD_WIDTH = 280;
    const DESKTOP_GAP = 24;

    return (
        <div className="relative w-full max-w-5xl mx-auto px-4 pt-4 pb-16">
        <div
            ref={containerRef}
            className="relative h-[480px] flex items-center justify-center overflow-visible"
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
                translateX = `calc(-50% - ${DESKTOP_CARD_WIDTH + DESKTOP_GAP}px)`;
                scale = 0.85;
                opacity = 1;
                zIndex = 20;
            } else if (isRight) {
                translateX = `calc(-50% + ${DESKTOP_CARD_WIDTH + DESKTOP_GAP}px)`;
                scale = 0.85;
                opacity = 1;
                zIndex = 20;
            }

            return (
                <div
                key={uniqueKey}
                className="absolute transition-all duration-500 ease-out flex justify-center"
                style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(${translateX}, -50%) scale(${scale})`,
                    opacity: opacity,
                    zIndex: zIndex,
                    willChange: 'transform, opacity',
                    width: `${DESKTOP_CARD_WIDTH}px`,
                }}
                >
                <div style={{ width: '100%', maxWidth: `${DESKTOP_CARD_WIDTH}px` }}>
                    <PetCard 
                        petData={pet} 
                        initialFavorite={favoritesMap[pet.id] === true}
                    />
                </div>
                </div>
            );
            })}
        </div>

        {pets.length > 1 && (
            <>
            <button
                onClick={prevPet}
                disabled={isTransitioning}
                className={`absolute -left-6 top-1/2 -translate-y-1/2 z-40 bg-green-70 text-green-20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 ${
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
                className={`absolute -right-6 top-1/2 -translate-y-1/2 z-40 bg-green-70 text-green-20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 ${
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
            <div className="flex justify-center items-center mt-10 mb-2 space-x-1.5 flex-wrap gap-y-2">
            {(() => {
                const visibleIndicators = getVisibleIndicators();
                return visibleIndicators.map((i) => (
                    <button
                        key={i}
                        onClick={() => navigateTo(i)}
                        disabled={isTransitioning}
                        className={`rounded-full transition-all duration-300 ${
                            i === currentIndex 
                                ? 'bg-green-70 scale-110 w-1.5 h-1.5' 
                                : 'bg-green-40 hover:bg-green-50 opacity-70 w-1 h-1'
                        }`}
                        aria-label={`Перейти к питомцу ${i + 1}`}
                    />
                ));
            })()}
            </div>
        )}
        </div>
    );
    };

    export default PetCarousel;
