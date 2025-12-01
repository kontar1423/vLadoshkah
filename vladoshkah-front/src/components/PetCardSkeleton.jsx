import React from 'react';

const PetCardSkeleton = () => {
    return (
        <article 
            className="flex flex-col w-full max-w-[320px] h-[420px] bg-green-90 rounded-custom-small shadow-lg overflow-hidden animate-pulse"
            aria-label="Загрузка карточки питомца"
        >
            {/* Изображение скелетон */}
            <div className="relative w-full aspect-square bg-gradient-to-br from-green-80 to-green-70 rounded-t-custom-small overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>

            {/* Бейджи скелетон */}
            <div className="flex items-center gap-2 w-full px-4 relative -mt-6">
                <div className="h-6 w-24 bg-green-80 rounded-full animate-pulse"></div>
                <div className="h-8 w-8 bg-green-80 rounded-full animate-pulse"></div>
                <div className="h-6 w-16 bg-green-80 rounded-full animate-pulse"></div>
            </div>

            {/* Текст скелетон */}
            <div className="flex-1 px-4 py-4 min-h-[72px] flex flex-col justify-start gap-2">
                <div className="h-4 w-full bg-green-80 rounded animate-pulse"></div>
                <div className="h-4 w-3/4 bg-green-80 rounded animate-pulse"></div>
                <div className="h-3 w-1/2 bg-green-80 rounded animate-pulse mt-auto"></div>
            </div>

            {/* Кнопки скелетон */}
            <div className="flex w-full items-center gap-2 px-4 pb-4 pt-1">
                <div className="h-10 flex-1 bg-green-80 rounded-custom-small animate-pulse"></div>
                <div className="h-8 w-8 bg-green-80 rounded-custom-small animate-pulse"></div>
            </div>
        </article>
    );
};

export default PetCardSkeleton;

