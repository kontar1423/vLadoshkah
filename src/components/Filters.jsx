import React, { useState } from "react";

export const Filters = ({ isOpen, onClose, onApply }) => {
    const [filters, setFilters] = useState({
        type: "Все",
        gender: "Любой",
        animal_size: "Любой",
        health: "Любое",
        age_min: 0,
        age_max: 20,
        shelter_id: "Любой",
    });

    const filterFields = [
        {
            id: "type",
            label: "Кого вы ищете",
            value: filters.type,
            options: ["Все", "Собаки", "Кошки"],
            fullWidth: true,
        },
        {
            id: "gender",
            label: "Пол питомца",
            value: filters.gender,
            options: ["Любой", "Мальчик", "Девочка"],
            fullWidth: false,
        },
        {
            id: "animal_size",
            label: "Размер питомца",
            value: filters.animal_size,
            options: ["Любой", "Маленький", "Средний", "Большой"],
            fullWidth: false,
        },
        {
            id: "health",
            label: "Здоровье питомца",
            value: filters.health,
            options: ["Любое", "Здоровый", "Требует лечения", "Особые потребности"],
            fullWidth: false,
        },
        {
            id: "shelter_id",
            label: "Приют",
            value: filters.shelter_id,
            options: ["Любой", "Приют №1", "Приют №2", "Приют №3"],
            fullWidth: false,
        },
    ];

    const handleFilterChange = (id, value) => {
        setFilters((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleAgeChange = (type, value) => {
        setFilters((prev) => {
            const newAgeMin = type === 'min' ? parseInt(value) : prev.age_min;
            const newAgeMax = type === 'max' ? parseInt(value) : prev.age_max;
            
            // Гарантируем что min <= max
            if (type === 'min' && newAgeMin > prev.age_max) {
                return { ...prev, age_min: prev.age_max, age_max: newAgeMin };
            }
            if (type === 'max' && newAgeMax < prev.age_min) {
                return { ...prev, age_min: newAgeMax, age_max: prev.age_min };
            }
            
            return { ...prev, [type === 'min' ? 'age_min' : 'age_max']: parseInt(value) };
        });
    };

    const handleReset = () => {
        setFilters({
            type: "Все",
            gender: "Любой",
            animal_size: "Любой",
            health: "Любое",
            age_min: 0,
            age_max: 20,
            shelter_id: "Любой",
        });
    };

    const handleSubmit = () => {
        console.log("Filters applied:", filters);
        
        // Конвертация фильтров в формат API
        const apiFilters = {
            type: filters.type === "Собаки" ? "dog" : filters.type === "Кошки" ? "cat" : "",
            gender: filters.gender === "Мальчик" ? "male" : filters.gender === "Девочка" ? "female" : "",
            animal_size: filters.animal_size === "Маленький" ? "small" : 
                        filters.animal_size === "Средний" ? "medium" : 
                        filters.animal_size === "Большой" ? "large" : "",
            health: filters.health === "Здоровый" ? "healthy" : 
                    filters.health === "Требует лечения" ? "needs_treatment" : 
                    filters.health === "Особые потребности" ? "special_needs" : "",
            age_min: filters.age_min,
            age_max: filters.age_max,
            shelter_id: filters.shelter_id !== "Любой" ? filters.shelter_id : "",
        };
        
        onApply(apiFilters);
        onClose();
    };

    const handleClose = () => {
        onClose();
    };

    // Если модальное окно закрыто, не рендерим ничего
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-green-95 rounded-[40px] w-full max-w-2xl flex flex-col items-start gap-6 p-8 relative">
                {/* Заголовок */}
                <header className="flex items-center justify-between self-stretch w-full">
                    <h1 className="text-4xl font-sf-rounded font-bold text-green-30">Фильтры</h1>
                    <button 
                        onClick={handleClose}
                        className="relative w-6 h-6 cursor-pointer text-green-40 hover:text-green-40 transition-colors"
                        aria-label="Закрыть фильтры"
                    >
                        <svg 
                            className="w-full h-full"
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </header>

                {/* Форма с фильтрами */}
                <form className="flex flex-col items-start gap-4 self-stretch w-full">
                    {filterFields.map((field, index) => {
                        

                        if (index % 2 === 1) {
                            const prevField = filterFields[index - 1];
                            return (
                                <div key={`row-${index}`} className="flex gap-4 self-stretch w-full">
                                    {/* Первое поле в ряду */}
                                    <div className="flex-1 flex flex-col gap-2">
                                        <label htmlFor={prevField.id} className="text-base font-medium text-green-40">
                                            {prevField.label}
                                        </label>
                                        <div className="h-12 flex items-center justify-between px-4 border-2 border-green-40 rounded-[20px] bg-green-95 relative">
                                            <select
                                                id={prevField.id}
                                                value={prevField.value}
                                                onChange={(e) => handleFilterChange(prevField.id, e.target.value)}
                                                className="w-full text-lg appearance-none bg-transparent outline-none pr-8 text-green-40"
                                            >
                                                {prevField.options.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                            <svg 
                                                className="absolute right-3 w-5 h-5 text-green-40 pointer-events-none"
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>

                                    {/* Второе поле в ряду */}
                                    <div className="flex-1 flex flex-col gap-2">
                                        <label htmlFor={field.id} className="text-base font-medium text-green-40">
                                            {field.label}
                                        </label>
                                        <div className="h-12 flex items-center justify-between px-4 border-2 border-green-40 rounded-[20px] bg-green-95 relative">
                                            <select
                                                id={field.id}
                                                value={field.value}
                                                onChange={(e) => handleFilterChange(field.id, e.target.value)}
                                                className="w-full text-lg appearance-none bg-transparent outline-none pr-8 text-green-40"
                                            >
                                                {field.options.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                            <svg 
                                                className="absolute right-3 w-5 h-5 text-green-40 pointer-events-none"
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            );
                        }

                        if (index === filterFields.length - 1 && index % 2 === 0) {
                            return (
                                <div key={field.id} className="self-stretch w-full flex flex-col gap-2">
                                    <label htmlFor={field.id} className="text-base font-medium text-green-40">
                                        {field.label}
                                    </label>
                                    <div className="h-12 flex items-center justify-between px-4 border-2 border-green-40 rounded-[20px] bg-green-95 relative">
                                        <select
                                            id={field.id}
                                            value={field.value}
                                            onChange={(e) => handleFilterChange(field.id, e.target.value)}
                                            className="w-full text-lg appearance-none bg-transparent outline-none pr-8 text-green-40"
                                        >
                                            {field.options.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        <svg 
                                            className="absolute right-3 w-5 h-5 text-green-40 pointer-events-none"
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            );
                        }

                        return null;
                    })}

                    {/* Ползунок для возраста */}
                    <div className="self-stretch w-full flex flex-col gap-1">
                        <label className="text-base font-medium text-green-40">
                            Возраст питомца: {filters.age_min} - {filters.age_max} лет
                        </label>
                        <div className="relative pt-8">
                            {/* Ползунок */}
                            <div className="relative h-2 bg-green-80 rounded-full">
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    value={filters.age_min}
                                    onChange={(e) => handleAgeChange('min', e.target.value)}
                                    className="absolute w-full h-2 opacity-0 cursor-pointer z-20"
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    value={filters.age_max}
                                    onChange={(e) => handleAgeChange('max', e.target.value)}
                                    className="absolute w-full h-2 opacity-0 cursor-pointer z-20"
                                />
                                
                                {/* Прогресс бар */}
                                <div 
                                    className="absolute h-2 bg-green-50 rounded-full"
                                    style={{
                                        left: `${(filters.age_min / 20) * 100}%`,
                                        right: `${100 - (filters.age_max / 20) * 100}%`
                                    }}
                                ></div>
                                
                                {/* Минимальный ползунок */}
                                <div 
                                    className="absolute w-6 h-6 bg-green-50 rounded-full border-2 border-green-98 -top-2 transform -translate-x-1/2 cursor-pointer z-10"
                                    style={{ left: `${(filters.age_min / 20) * 100}%` }}
                                ></div>
                                
                                {/* Максимальный ползунок */}
                                <div 
                                    className="absolute w-6 h-6 bg-green-50 rounded-full border-2 border-green-98 -top-2 transform -translate-x-1/2 cursor-pointer z-10"
                                    style={{ left: `${(filters.age_max / 20) * 100}%` }}
                                ></div>
                            </div>
                            
                            {/* Подписи значений */}
                            <div className="flex justify-between text-sm text-green-40 mt-2">
                                <span>0</span>
                                <span>20</span>
                            </div>
                        </div>
                    </div>
                </form>

                {/* Кнопки действий */}
                <div className="flex gap-3 self-stretch justify-end">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="px-6 py-3 bg-green-80 rounded-[20px] text-green-40 hover:bg-green-70 font-medium transition-colors"
                    >
                        Сбросить
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="px-6 py-3 bg-green-70 text-green-20 rounded-[20px] font-medium hover:bg-green-40 transition-colors"
                    >
                        Применить
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Filters;