    import React, { useState, useEffect, useRef } from 'react';
    import MiniShelterCard from './MiniShelterCard';

    const ShelterCarousel = ({ shelters = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const containerRef = useRef(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const CARD_WIDTH = 380;
    const GAP = 10;

    const navigateTo = (newIndex) => {
        if (isTransitioning || shelters.length <= 1) return;
        setIsTransitioning(true);
        setCurrentIndex(newIndex);
        setTimeout(() => setIsTransitioning(false), 500);
    };

    const nextShelter = () => navigateTo((currentIndex + 1) % shelters.length);
    const prevShelter = () => navigateTo((currentIndex - 1 + shelters.length) % shelters.length);

    useEffect(() => {
        if (shelters.length <= 1) return;
        const interval = setInterval(() => {
            if (!isTransitioning) {
                setCurrentIndex((prev) => (prev + 1) % shelters.length);
            }
        }, 5000);
        return () => clearInterval(interval);
    }, [shelters.length, isTransitioning]);

    if (shelters.length === 0) {
        return (
        <div className="text-center py-10 text-green-40">
            Приюты пока не добавлены
        </div>
        );
    }

    if (shelters.length === 1) {
        return (
        <div className="flex justify-center py-6">
            <MiniShelterCard shelter={shelters[0]} />
        </div>
        );
    }

    if (isMobile && shelters.length > 0) {
        const currentShelter = shelters[currentIndex];

        return (
            <div className="relative w-full max-w-[160px] mx-auto px-2">
                <div className="relative overflow-hidden flex items-center justify-center min-h-[220px]">
                    <div className="flex-shrink-0 transition-all duration-500 ease-out flex justify-center w-full">
                        <div className="w-full max-w-[160px]">
                            <MiniShelterCard shelter={currentShelter} />
                        </div>
                    </div>
                </div>

                {shelters.length > 1 && (
                    <>
                        <button
                            onClick={prevShelter}
                            disabled={isTransitioning}
                            className={`absolute -left-6 top-1/2 -translate-y-1/2 z-40 bg-green-70 text-green-20 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 ${
                                isTransitioning
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-green-60 hover:scale-110 shadow-xl'
                            }`}
                            aria-label="Предыдущий приют"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>

                        <button
                            onClick={nextShelter}
                            disabled={isTransitioning}
                            className={`absolute -right-6 top-1/2 -translate-y-1/2 z-40 bg-green-70 text-green-20 rounded-full w-8 h-8 flex items-center justify-center transition-all duration-300 ${
                                isTransitioning
                                    ? 'opacity-50 cursor-not-allowed'
                                    : 'hover:bg-green-60 hover:scale-110 shadow-xl'
                            }`}
                            aria-label="Следующий приют"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>

                        <div className="flex justify-center mt-4 space-x-2">
                            {shelters.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => navigateTo(i)}
                                    disabled={isTransitioning}
                                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                                        i === currentIndex ? 'bg-green-70 scale-125' : 'bg-green-40 hover:bg-green-50'
                                    }`}
                                    aria-label={`Перейти к приюту ${i + 1}`}
                                />
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    }

    const getCarouselItems = () => {
        const items = [];
        for (let offset = -1; offset <= 1; offset++) {
        const index = (currentIndex + offset + shelters.length) % shelters.length;
        const position = offset;
        items.push({ 
            shelter: shelters[index], 
            position, 
            uniqueKey: `${shelters[index].id}-${offset}-${currentIndex}` 
        });
        }
        return items;
    };

    const items = getCarouselItems();

    return (
        <div className="relative w-full max-w-7xl mx-auto px-4">
        <div
            ref={containerRef}
            className="relative h-[520px] flex items-center justify-center overflow-visible"
        >
            {items.map(({ shelter, position, uniqueKey }) => {
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
                scale = 0.87;
                opacity = 1;
                zIndex = 20;
            } else if (isRight) {
                translateX = `calc(-50% + ${CARD_WIDTH + GAP}px)`;
                scale = 0.87;
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
                    width: `${CARD_WIDTH}px`,
                }}
                >
                <div style={{ width: '100%', maxWidth: `${CARD_WIDTH}px` }}>
                    <MiniShelterCard shelter={shelter} />
                </div>
                </div>
            );
            })}
        </div>

        {shelters.length > 1 && (
            <>
            <button
                onClick={prevShelter}
                disabled={isTransitioning}
                className={`absolute -left-6 top-1/2 -translate-y-1/2 z-40 bg-green-70 text-green-20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                isTransitioning
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-green-60 hover:scale-110 shadow-xl'
                }`}
                aria-label="Предыдущий приют"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
            </button>

            <button
                onClick={nextShelter}
                disabled={isTransitioning}
                className={`absolute -right-6 top-1/2 -translate-y-1/2 z-40 bg-green-70 text-green-20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 ${
                isTransitioning
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-green-60 hover:scale-110 shadow-xl'
                }`}
                aria-label="Следующий приют"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
            </button>
            </>
        )}

        {shelters.length > 1 && (
            <div className="flex justify-center mt-1 space-x-2">
            {shelters.map((_, i) => (
                <button
                key={i}
                onClick={() => navigateTo(i)}
                disabled={isTransitioning}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    i === currentIndex ? 'bg-green-70 scale-125' : 'bg-green-40 hover:bg-green-50'
                }`}
                aria-label={`Перейти к приюту ${i + 1}`}
                />
            ))}
            </div>
        )}
        </div>
    );
    };

    export default ShelterCarousel;
