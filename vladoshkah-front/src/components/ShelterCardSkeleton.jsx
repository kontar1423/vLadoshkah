import React from 'react';

const ShelterCardSkeleton = () => {
    return (
        <article className="relative w-full max-w-[1260px] min-h-[400px] md:h-[400px] bg-green-90 rounded-custom overflow-hidden flex flex-col md:flex-row animate-pulse">
            <div className="relative w-full md:w-[350px] h-[180px] md:h-full flex-shrink-0 overflow-hidden bg-gradient-to-br from-green-80 to-green-70">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer"></div>
            </div>

            <div className="flex-1 flex flex-col items-start justify-between p-4 md:p-6 md:pl-6 md:pr-6">
                <div className="w-full">
                    <div className="mb-3 md:mb-4">
                        <div className="h-8 w-48 bg-green-80 rounded mb-2 animate-pulse"></div>
                        <div className="flex items-center gap-2">
                            <div className="h-6 w-24 bg-green-80 rounded animate-pulse"></div>
                            <div className="h-5 w-12 bg-green-80 rounded animate-pulse"></div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="h-4 w-full bg-green-80 rounded animate-pulse"></div>
                        <div className="h-4 w-full bg-green-80 rounded animate-pulse"></div>
                        <div className="h-4 w-3/4 bg-green-80 rounded animate-pulse"></div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full mt-4">
                    <div className="h-11 w-full sm:w-40 bg-green-80 rounded-custom-small animate-pulse"></div>
                    <div className="h-11 w-full sm:w-32 bg-green-80 rounded-custom-small animate-pulse"></div>
                </div>
            </div>
        </article>
    );
};

export default ShelterCardSkeleton;

