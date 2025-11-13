    // src/pages/AnketaInfo.jsx
    import React from 'react';

    const AnketaInfo = () => {
    return (
        <div className="min-h-screen bg-green-95 py-8">
        <div className="max-w-container mx-auto px-[20px] md:px-[40px] lg:[px-60px]">
            <div className="text-center mb-8">
            <h1 className="font-sf-rounded font-bold text-green-30 text-3xl md:text-4xl lg:text-5xl">
                Информационная анкета
            </h1>
            </div>

            <div className="bg-green-90 rounded-custom p-8 max-w-4xl mx-auto">
            <div className="text-center">
                <div className="w-24 h-24 bg-green-70 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-green-20 font-sf-rounded font-bold text-2xl">ℹ️</span>
                </div>
                <h2 className="font-sf-rounded font-bold text-green-30 text-2xl mb-4">
                Страница в разработке
                </h2>
                <p className="font-inter text-green-40 text-lg">
                Информационная анкета будет доступна в ближайшее время
                </p>
            </div>
            </div>
        </div>
        </div>
    );
    };

    export default AnketaInfo;