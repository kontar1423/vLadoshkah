    import React, { useState } from 'react';

    const DistrictFilter = ({ isOpen, onClose, onApplyFilter }) => {
    const [selectedDistricts, setSelectedDistricts] = useState([]);

    // Данные по округам Москвы
    const districts = [
        { id: 'cao', name: 'Центральный', color: '#006C35' },
        { id: 'sao', name: 'Северный', color: '#128937' },
        { id: 'svao', name: 'Северо-Восточный', color: '#1AA64A' },
        { id: 'vao', name: 'Восточный', color: '#44C265' },
        { id: 'yuvao', name: 'Юго-Восточный', color: '#80DA88' },
        { id: 'yao', name: 'Южный', color: '#BEEFBB' },
        { id: 'yuzao', name: 'Юго-Западный', color: '#DDF8D8' },
        { id: 'zao', name: 'Западный', color: '#F2FCEF' },
        { id: 'szao', name: 'Северо-Западный', color: '#FFFFFF' },
        { id: 'zelao', name: 'Зеленоградский', color: '#E8F5E8' },
        { id: 'tinao', name: 'Троицкий', color: '#D0EBD0' },
        { id: 'nao', name: 'Новомосковский', color: '#B8E0B8' }
    ];

    const handleDistrictClick = (districtId) => {
        setSelectedDistricts(prev => {
        if (prev.includes(districtId)) {
            return prev.filter(id => id !== districtId);
        } else {
            return [...prev, districtId];
        }
        });
    };

    const handleApply = () => {
        if (selectedDistricts.length > 0) {
        const selectedDistrictNames = selectedDistricts.map(id => 
            districts.find(d => d.id === id)?.name
        );
        onApplyFilter({ 
            districts: selectedDistrictNames, 
            districtIds: selectedDistricts 
        });
        }
        onClose();
    };

    const handleReset = () => {
        setSelectedDistricts([]);
        onApplyFilter({ districts: [], districtIds: [] });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-green-95 rounded-custom w-full max-w-6xl flex flex-col items-start gap-6 p-8 relative max-h-[90vh] overflow-y-auto">
            
            {/* Заголовок */}
            <header className="flex items-center justify-between self-stretch w-full">
            <h1 className="text-3xl font-sf-rounded font-bold text-green-30">
                Выберите округа Москвы
            </h1>
            <button 
                onClick={onClose}
                className="relative w-8 h-8 cursor-pointer text-green-40 hover:text-green-30 transition-colors"
                aria-label="Закрыть фильтры"
            >
                <svg className="w-full h-full" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>
            </header>

            {/* Выбранные округа */}
            {selectedDistricts.length > 0 && (
            <div className="bg-green-90 rounded-custom-small p-4 w-full">
                <p className="font-inter text-green-30 mb-2">
                Выбрано: <strong>{selectedDistricts.length}</strong> округ(а)
                </p>
                <div className="flex flex-wrap gap-2">
                {selectedDistricts.map(districtId => {
                    const district = districts.find(d => d.id === districtId);
                    return (
                    <span 
                        key={districtId}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-green-80 rounded-custom-small text-green-30 text-sm"
                    >
                        {district?.name}
                        <button 
                        onClick={() => handleDistrictClick(districtId)}
                        className="text-green-40 hover:text-green-20"
                        aria-label={`Убрать ${district?.name}`}
                        >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        </button>
                    </span>
                    );
                })}
                </div>
            </div>
            )}

            {/* Улучшенная карта Москвы */}
            <div className="w-full bg-white rounded-custom-small p-4">
            <svg 
                viewBox="0 0 1000 800" 
                className="w-full h-[500px]"
                xmlns="http://www.w3.org/2000/svg"
            >
                {/* Фон */}
                <rect width="1000" height="800" fill="#f8fafc" />
                
                {/* МКАД (контур Москвы) */}
                <path
                d="M200,300 Q250,250 300,280 Q350,250 400,270 Q450,240 500,260 Q550,230 600,250 Q650,220 700,240 Q750,210 800,230 Q820,280 780,320 Q750,350 720,380 Q680,420 650,450 Q600,500 580,550 Q550,600 520,650 Q480,620 450,590 Q420,560 380,530 Q350,500 320,470 Q280,430 250,400 Q220,370 200,340 Z"
                fill="#e8f5e8"
                stroke="#006C35"
                strokeWidth="3"
                strokeDasharray="5,5"
                />
                
                {/* Центральный округ (в центре) */}
                <path
                id="cao"
                d="M450,350 Q480,330 520,340 Q540,360 530,380 Q520,400 500,410 Q470,420 450,400 Q430,380 440,360 Z"
                fill={selectedDistricts.includes('cao') ? '#44C265' : '#006C35'}
                stroke="#00381F"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleDistrictClick('cao')}
                />
                
                {/* Северный округ (сверху) */}
                <path
                id="sao"
                d="M400,200 Q450,180 500,190 Q550,180 600,200 Q580,240 550,270 Q500,250 450,260 Q420,240 400,220 Z"
                fill={selectedDistricts.includes('sao') ? '#44C265' : '#128937'}
                stroke="#00381F"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleDistrictClick('sao')}
                />

                {/* Северо-Восточный округ (северо-восток) */}
                <path
                id="svao"
                d="M600,200 Q650,190 700,210 Q720,250 690,280 Q650,300 610,310 Q580,290 590,250 Z"
                fill={selectedDistricts.includes('svao') ? '#44C265' : '#1AA64A'}
                stroke="#00381F"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleDistrictClick('svao')}
                />

                {/* Восточный округ (восток) */}
                <path
                id="vao"
                d="M700,210 Q750,230 780,260 Q760,300 730,330 Q690,350 650,360 Q630,320 650,280 Z"
                fill={selectedDistricts.includes('vao') ? '#44C265' : '#44C265'}
                stroke="#00381F"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleDistrictClick('vao')}
                />

                {/* Юго-Восточный округ (юго-восток) */}
                <path
                id="yuvao"
                d="M650,360 Q680,380 710,400 Q690,450 650,480 Q610,500 580,520 Q560,480 580,440 Q590,410 610,390 Z"
                fill={selectedDistricts.includes('yuvao') ? '#44C265' : '#80DA88'}
                stroke="#00381F"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleDistrictClick('yuvao')}
                />

                {/* Южный округ (юг) */}
                <path
                id="yao"
                d="M500,410 Q530,430 550,450 Q530,490 500,520 Q460,540 430,520 Q410,480 430,440 Z"
                fill={selectedDistricts.includes('yao') ? '#44C265' : '#BEEFBB'}
                stroke="#00381F"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleDistrictClick('yao')}
                />

                {/* Юго-Западный округ (юго-запад) */}
                <path
                id="yuzao"
                d="M400,400 Q430,420 450,440 Q430,480 400,500 Q360,520 330,500 Q310,460 330,420 Z"
                fill={selectedDistricts.includes('yuzao') ? '#44C265' : '#DDF8D8'}
                stroke="#00381F"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleDistrictClick('yuzao')}
                />

                {/* Западный округ (запад) */}
                <path
                id="zao"
                d="M300,280 Q330,260 360,270 Q380,300 360,330 Q330,350 300,360 Q270,340 280,310 Z"
                fill={selectedDistricts.includes('zao') ? '#44C265' : '#F2FCEF'}
                stroke="#00381F"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleDistrictClick('zao')}
                />

                {/* Северо-Западный округ (северо-запад) */}
                <path
                id="szao"
                d="M300,200 Q350,180 400,190 Q380,230 350,250 Q320,240 300,220 Z"
                fill={selectedDistricts.includes('szao') ? '#44C265' : '#FFFFFF'}
                stroke="#00381F"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleDistrictClick('szao')}
                />

                {/* Зеленоградский округ (отдельно на северо-западе) */}
                <path
                id="zelao"
                d="M250,150 Q280,140 310,150 Q300,180 270,190 Q240,180 240,160 Z"
                fill={selectedDistricts.includes('zelao') ? '#44C265' : '#E8F5E8'}
                stroke="#00381F"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleDistrictClick('zelao')}
                />

                {/* Новомосковский округ (большой юго-запад) */}
                <path
                id="nao"
                d="M200,340 Q230,370 260,400 Q240,450 200,480 Q160,520 120,550 Q100,500 130,460 Q150,420 180,380 Z"
                fill={selectedDistricts.includes('nao') ? '#44C265' : '#B8E0B8'}
                stroke="#00381F"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleDistrictClick('nao')}
                />

                {/* Троицкий округ (юг) */}
                <path
                id="tinao"
                d="M120,550 Q160,580 200,600 Q180,650 140,680 Q100,660 80,620 Q90,580 110,560 Z"
                fill={selectedDistricts.includes('tinao') ? '#44C265' : '#D0EBD0'}
                stroke="#00381F"
                strokeWidth="2"
                className="cursor-pointer transition-all duration-300 hover:opacity-80"
                onClick={() => handleDistrictClick('tinao')}
                />

                {/* Подписи округов */}
                <text x="470" y="380" textAnchor="middle" className="text-sm font-inter pointer-events-none fill-green-30 font-bold">ЦАО</text>
                <text x="500" y="230" textAnchor="middle" className="text-sm font-inter pointer-events-none fill-green-30 font-bold">САО</text>
                <text x="630" y="270" textAnchor="middle" className="text-sm font-inter pointer-events-none fill-green-30 font-bold">СВАО</text>
                <text x="710" y="290" textAnchor="middle" className="text-sm font-inter pointer-events-none fill-green-30 font-bold">ВАО</text>
                <text x="630" y="430" textAnchor="middle" className="text-sm font-inter pointer-events-none fill-green-30 font-bold">ЮВАО</text>
                <text x="470" y="480" textAnchor="middle" className="text-sm font-inter pointer-events-none fill-green-30 font-bold">ЮАО</text>
                <text x="370" y="460" textAnchor="middle" className="text-sm font-inter pointer-events-none fill-green-30 font-bold">ЮЗАО</text>
                <text x="320" y="320" textAnchor="middle" className="text-sm font-inter pointer-events-none fill-green-30 font-bold">ЗАО</text>
                <text x="350" y="210" textAnchor="middle" className="text-sm font-inter pointer-events-none fill-green-30 font-bold">СЗАО</text>
                <text x="270" y="170" textAnchor="middle" className="text-xs font-inter pointer-events-none fill-green-30 font-bold">ЗелАО</text>
                <text x="160" y="450" textAnchor="middle" className="text-xs font-inter pointer-events-none fill-green-30 font-bold">Новомосковский</text>
                <text x="140" y="620" textAnchor="middle" className="text-xs font-inter pointer-events-none fill-green-30 font-bold">Троицкий</text>

                {/* Москва-река */}
                <path
                d="M200,300 Q300,320 400,330 Q500,340 600,350 Q650,360 700,370 Q720,390 700,410 Q650,420 600,430 Q500,440 400,450 Q300,460 250,470"
                fill="none"
                stroke="#4A90E2"
                strokeWidth="4"
                strokeDasharray="none"
                />
            </svg>
            </div>

            {/* Легенда карты */}
            <div className="w-full">
            <h3 className="font-sf-rounded font-bold text-green-30 text-lg mb-3">
                Округа Москвы ({selectedDistricts.length} выбрано)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {districts.map(district => (
                <div
                    key={district.id}
                    className={`flex items-center gap-2 p-2 rounded-custom-small cursor-pointer transition-colors ${
                    selectedDistricts.includes(district.id) ? 'bg-green-80' : 'bg-green-90'
                    }`}
                    onClick={() => handleDistrictClick(district.id)}
                >
                    <div 
                    className="w-4 h-4 rounded-sm border border-green-30"
                    style={{ backgroundColor: selectedDistricts.includes(district.id) ? '#44C265' : district.color }}
                    ></div>
                    <span className="font-inter text-green-30 text-sm">
                    {district.name}
                    </span>
                    {selectedDistricts.includes(district.id) && (
                    <svg className="w-4 h-4 text-green-40 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    )}
                </div>
                ))}
            </div>
            </div>

            {/* Кнопки действий */}
            <div className="flex gap-3 self-stretch justify-end pt-4 border-t border-green-80 w-full">
            <button
                type="button"
                onClick={handleReset}
                className="px-6 py-3 bg-green-80 rounded-[20px] text-green-40 hover:bg-green-70 font-medium transition-colors"
            >
                Сбросить все
            </button>
            <button
                type="button"
                onClick={handleApply}
                disabled={selectedDistricts.length === 0}
                className={`px-6 py-3 rounded-[20px] font-medium transition-colors ${
                selectedDistricts.length > 0
                    ? 'bg-green-70 text-green-20 hover:bg-green-60 cursor-pointer' 
                    : 'bg-green-80 text-green-60 cursor-not-allowed'
                }`}
            >
                Применить ({selectedDistricts.length})
            </button>
            </div>
        </div>
        </div>
    );
    };

    export default DistrictFilter;