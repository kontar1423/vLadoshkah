    // src/components/ShelterCarousel.jsx
    import React, { useState, useEffect, useRef } from 'react';
    import MiniShelterCard from './MiniShelterCard';

    const ShelterCarousel = ({ shelters = [] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isTransitioning, setIsTransitioning] = useState(false);
    const containerRef = useRef(null);

    const CARD_WIDTH = 380; // Шире чем у питомцев
    const GAP = 10;

    const navigateTo = (newIndex) => {
        if (isTransitioning || shelters.length <= 1) return;
        setIsTransitioning(true);
        setCurrentIndex(newIndex);
        setTimeout(() => setIsTransitioning(false), 500);
    };

    const nextShelter = () => navigateTo((currentIndex + 1) % shelters.length);
    const prevShelter = () => navigateTo((currentIndex - 1 + shelters.length) % shelters.length);

    // Автопрокрутка
    useEffect(() => {
        if (shelters.length <= 1) return;
        const interval = setInterval(() => {
        if (!isTransitioning) nextShelter();
        }, 5000);
        return () => clearInterval(interval);
    }, [shelters.length, currentIndex, isTransitioning]);

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

    // Генерируем 3 карточки: слева, центр, справа
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
        {/* Контейнер карусели */}
        <div
            ref={containerRef}
            className="relative h-[520px] flex items-center justify-center overflow-visible"
        >
            {items.map(({ shelter, position, uniqueKey }) => {
            const isActive = position === 0;
            const isLeft = position === -1;
            const isRight = position === 1;

            // Позиционирование
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
                scale = 0.9;
                opacity = 0.8;
                zIndex = 20;
            } else if (isRight) {
                translateX = `calc(-50% + ${CARD_WIDTH + GAP}px)`;
                scale = 0.9;
                opacity = 0.8;
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
                <MiniShelterCard shelter={shelter} />
                </div>
            );
            })}
        </div>

        {/* Кнопки навигации */}
        {shelters.length > 1 && (
            <>
            <button
                onClick={prevShelter}
                disabled={isTransitioning}
                className={`absolute left-0 top-1/2 -translate-y-1/2 z-40 bg-green-70 text-green-20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 ${
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
                className={`absolute right-0 top-1/2 -translate-y-1/2 z-40 bg-green-70 text-green-20 rounded-full w-12 h-12 flex items-center justify-center transition-all duration-300 ${
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

        {/* Индикаторы */}
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