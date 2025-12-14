import React, { useState, useEffect } from "react";
import ReactDOM from 'react-dom';

export const FiltersP = ({ isOpen, onClose, onApply, initialFilters, onReset }) => {
    const [filters, setFilters] = useState({
        type: "Все",
        gender: "Любой",
        animal_size: "Любой",
        health: "Любое",
        age_min: 0,
        age_max: 30,
    });

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (initialFilters && Object.keys(initialFilters).length > 0) {
                const updatedFilters = {
                    type: "Все",
                    gender: "Любой",
                    animal_size: "Любой",
                    health: "Любое",
                    age_min: 0,
                    age_max: 30,
                };

                if (initialFilters.type) {
                    updatedFilters.type = initialFilters.type === 'dog' ? 'Собаки' : 
                                        initialFilters.type === 'cat' ? 'Кошки' : 
                                        initialFilters.type === 'bird' ? 'Птицы' :
                                        initialFilters.type === 'rodent' ? 'Грызуны' :
                                        initialFilters.type === 'fish' ? 'Рыбы' :
                                        initialFilters.type === 'reptile' ? 'Рептилии' :
                                        initialFilters.type === 'other' ? 'Другое' : 'Все';
                }
                if (initialFilters.gender) {
                    updatedFilters.gender = initialFilters.gender === 'male' ? 'Мальчик' : 
                                        initialFilters.gender === 'female' ? 'Девочка' : 'Любой';
                }
                if (initialFilters.animal_size) {
                    updatedFilters.animal_size = initialFilters.animal_size === 'small' ? 'Маленький' : 
                                            initialFilters.animal_size === 'medium' ? 'Средний' : 
                                            initialFilters.animal_size === 'large' ? 'Большой' : 'Любой';
                }
                if (initialFilters.health) {
                    updatedFilters.health = initialFilters.health === 'healthy' ? 'Здоровый' : 
                                        initialFilters.health === 'needs_treatment' ? 'Требует лечения' : 
                                        initialFilters.health === 'special_needs' ? 'Особые потребности' : 'Любое';
                }
                if (initialFilters.age_min !== undefined) {
                    updatedFilters.age_min = initialFilters.age_min;
                }
                if (initialFilters.age_max !== undefined) {
                    updatedFilters.age_max = initialFilters.age_max;
                }

                setFilters(updatedFilters);
            } else {
                setFilters({
                    type: "Все",
                    gender: "Любой",
                    animal_size: "Любой",
                    health: "Любое",
                    age_min: 0,
                    age_max: 30,
                });
            }
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, initialFilters]);

    const filterFields = [
        {
            id: "type",
            label: "Кого вы ищете",
            value: filters.type,
            options: ["Все", "Собаки", "Кошки", "Птицы", "Грызуны", "Рыбы", "Рептилии", "Другое"],
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
    ];

    const handleFilterChange = (id, value) => {
        setFilters((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleAgeChange = (type, value) => {
        const numValue = parseInt(value);
        setFilters(prev => {
            if (type === 'min') {
                const newMin = Math.min(numValue, prev.age_max);
                return { 
                    ...prev, 
                    age_min: newMin
                };
            } else {
                const newMax = Math.max(numValue, prev.age_min);
                return { 
                    ...prev, 
                    age_max: newMax
                };
            }
        });
    };

    const handleReset = () => {
        setFilters({
            type: "Все",
            gender: "Любой",
            animal_size: "Любой",
            health: "Любое",
            age_min: 0,
            age_max: 30,
        });
        if (onReset) {
            onReset();
        }
    };

    const handleSubmit = () => {
        console.log("Filters applied:", filters);
        const apiFilters = {
            type: filters.type === "Собаки" ? "dog" : 
                filters.type === "Кошки" ? "cat" : 
                filters.type === "Птицы" ? "bird" :
                filters.type === "Грызуны" ? "rodent" :
                filters.type === "Рыбы" ? "fish" :
                filters.type === "Рептилии" ? "reptile" :
                filters.type === "Другое" ? "other" : "",
            gender: filters.gender === "Мальчик" ? "male" : filters.gender === "Девочка" ? "female" : "",
            animal_size: filters.animal_size === "Маленький" ? "small" : 
                        filters.animal_size === "Средний" ? "medium" : 
                        filters.animal_size === "Большой" ? "large" : "",
            health: filters.health === "Здоровый" ? "healthy" : 
                    filters.health === "Требует лечения" ? "needs_treatment" : 
                    filters.health === "Особые потребности" ? "special_needs" : "",
            age_min: filters.age_min,
            age_max: filters.age_max,
        };
        
        const cleanedFilters = Object.fromEntries(
            Object.entries(apiFilters).filter(([_, value]) => 
                value !== "" && value !== null && value !== undefined
            )
        );
        
        onApply(cleanedFilters);
        onClose();
    };

    const handleClose = () => {
        onClose();
    };

    if (!isOpen) return null;

    const minPosition = (filters.age_min / 30) * 100;
    const maxPosition = (filters.age_max / 30) * 100;

    return ReactDOM.createPortal(
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
                onClick={handleClose}
            />
            <div 
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-green-95 rounded-[20px] sm:rounded-[30px] md:rounded-[40px] w-[calc(100%-32px)] sm:w-[calc(100%-48px)] md:w-full max-w-2xl flex flex-col items-start gap-3 sm:gap-4 md:gap-6 p-4 sm:p-6 md:p-8 max-h-[90vh] overflow-y-auto animate-fade-up"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="flex items-center justify-between self-stretch w-full">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-sf-rounded font-bold text-green-30">Фильтры</h1>
                    <button 
                        onClick={handleClose}
                        className="relative w-5 h-5 sm:w-6 sm:h-6 cursor-pointer text-green-40 hover:text-green-20 transition-colors"
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

                <form className="flex flex-col items-start gap-3 sm:gap-4 self-stretch w-full">
                    {filterFields.map((field, index) => {
                        if (index % 2 === 1) {
                            const prevField = filterFields[index - 1];
                            return (
                                <div key={`row-${index}`} className="flex flex-col sm:flex-row gap-3 sm:gap-4 self-stretch w-full">
                                    <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
                                        <label htmlFor={prevField.id} className="text-sm sm:text-base font-medium text-green-40">
                                            {prevField.label}
                                        </label>
                                        <div className="h-10 sm:h-12 flex items-center justify-between px-3 sm:px-4 border-2 border-green-40 rounded-[15px] sm:rounded-[20px] bg-green-95 relative">
                                            <select
                                                id={prevField.id}
                                                value={prevField.value}
                                                onChange={(e) => handleFilterChange(prevField.id, e.target.value)}
                                                className="w-full text-sm sm:text-base md:text-lg appearance-none bg-transparent outline-none pr-6 sm:pr-8 text-green-40 cursor-pointer"
                                            >
                                                {prevField.options.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                            <svg 
                                                className="absolute right-2 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 text-green-40 pointer-events-none"
                                                fill="none" 
                                                stroke="currentColor" 
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col gap-1.5 sm:gap-2">
                                        <label htmlFor={field.id} className="text-sm sm:text-base font-medium text-green-40">
                                            {field.label}
                                        </label>
                                        <div className="h-10 sm:h-12 flex items-center justify-between px-3 sm:px-4 border-2 border-green-40 rounded-[15px] sm:rounded-[20px] bg-green-95 relative">
                                            <select
                                                id={field.id}
                                                value={field.value}
                                                onChange={(e) => handleFilterChange(field.id, e.target.value)}
                                                className="w-full text-sm sm:text-base md:text-lg appearance-none bg-transparent outline-none pr-6 sm:pr-8 text-green-40 cursor-pointer"
                                            >
                                                {field.options.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                            <svg 
                                                className="absolute right-2 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 text-green-40 pointer-events-none"
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
                                <div key={field.id} className="flex-1 flex flex-col gap-1.5 sm:gap-2 self-stretch w-full">
                                    <label htmlFor={field.id} className="text-sm sm:text-base font-medium text-green-40">
                                        {field.label}
                                    </label>
                                    <div className="h-10 sm:h-12 flex items-center justify-between px-3 sm:px-4 border-2 border-green-40 rounded-[15px] sm:rounded-[20px] bg-green-95 relative">
                                        <select
                                            id={field.id}
                                            value={field.value}
                                            onChange={(e) => handleFilterChange(field.id, e.target.value)}
                                            className="w-full text-sm sm:text-base md:text-lg appearance-none bg-transparent outline-none pr-6 sm:pr-8 text-green-40 cursor-pointer"
                                        >
                                            {field.options.map(option => (
                                                <option key={option} value={option}>{option}</option>
                                            ))}
                                        </select>
                                        <svg 
                                            className="absolute right-2 sm:right-3 w-4 h-4 sm:w-5 sm:h-5 text-green-40 pointer-events-none"
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

                    <div className="self-stretch w-full flex flex-col gap-2 sm:gap-4">
                        <label className="text-sm sm:text-base font-medium text-green-40">
                            Возраст питомца: {filters.age_min} - {filters.age_max} лет
                        </label>
                        
                        <div className="relative py-4">
                            <div className="relative h-2 bg-green-80 rounded-full">
                                <div 
                                    className="absolute h-2 bg-green-50 rounded-full"
                                    style={{
                                        left: `${minPosition}%`,
                                        width: `${maxPosition - minPosition}%`
                                    }}
                                ></div>
                                
                                <input
                                    type="range"
                                    min="0"
                                    max="30"
                                    value={filters.age_min}
                                    onChange={(e) => handleAgeChange('min', e.target.value)}
                                    className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max="30"
                                    value={filters.age_max}
                                    onChange={(e) => handleAgeChange('max', e.target.value)}
                                    className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
                                />
                                
                                <div 
                                    className="absolute w-6 h-6 bg-green-50 rounded-full border-2 border-green-98 -top-2 transform -translate-x-1/2 shadow-lg cursor-pointer z-20 hover:scale-110 transition-transform touch-none"
                                    style={{ left: `${minPosition}%` }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        const slider = e.currentTarget;
                                        const startX = e.clientX;
                                        const startLeft = minPosition;
                                        const sliderWidth = slider.parentElement.offsetWidth;

                                        const handleMouseMove = (moveEvent) => {
                                            const deltaX = moveEvent.clientX - startX;
                                            const deltaPercent = (deltaX / sliderWidth) * 100;
                                            let newPosition = startLeft + deltaPercent;
                                            newPosition = Math.max(0, Math.min(newPosition, maxPosition));
                                            const newValue = Math.round((newPosition / 100) * 30);
                                            handleAgeChange('min', newValue);
                                        };

                                        const handleMouseUp = () => {
                                            document.removeEventListener('mousemove', handleMouseMove);
                                            document.removeEventListener('mouseup', handleMouseUp);
                                        };

                                        document.addEventListener('mousemove', handleMouseMove);
                                        document.addEventListener('mouseup', handleMouseUp);
                                    }}
                                    onTouchStart={(e) => {
                                        e.preventDefault();
                                        const slider = e.currentTarget;
                                        const touch = e.touches[0];
                                        const startX = touch.clientX;
                                        const startLeft = minPosition;
                                        const sliderWidth = slider.parentElement.offsetWidth;

                                        const handleTouchMove = (moveEvent) => {
                                            const touch = moveEvent.touches[0];
                                            const deltaX = touch.clientX - startX;
                                            const deltaPercent = (deltaX / sliderWidth) * 100;
                                            let newPosition = startLeft + deltaPercent;
                                            newPosition = Math.max(0, Math.min(newPosition, maxPosition));
                                            const newValue = Math.round((newPosition / 100) * 30);
                                            handleAgeChange('min', newValue);
                                        };

                                        const handleTouchEnd = () => {
                                            document.removeEventListener('touchmove', handleTouchMove);
                                            document.removeEventListener('touchend', handleTouchEnd);
                                        };

                                        document.addEventListener('touchmove', handleTouchMove, { passive: false });
                                        document.addEventListener('touchend', handleTouchEnd);
                                    }}
                                ></div>
                                <div 
                                    className="absolute w-6 h-6 bg-green-50 rounded-full border-2 border-green-98 -top-2 transform -translate-x-1/2 shadow-lg cursor-pointer z-20 hover:scale-110 transition-transform touch-none"
                                    style={{ left: `${maxPosition}%` }}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        const slider = e.currentTarget;
                                        const startX = e.clientX;
                                        const startLeft = maxPosition;
                                        const sliderWidth = slider.parentElement.offsetWidth;

                                        const handleMouseMove = (moveEvent) => {
                                            const deltaX = moveEvent.clientX - startX;
                                            const deltaPercent = (deltaX / sliderWidth) * 100;
                                            let newPosition = startLeft + deltaPercent;
                                            newPosition = Math.max(minPosition, Math.min(newPosition, 100));
                                            const newValue = Math.round((newPosition / 100) * 30);
                                            handleAgeChange('max', newValue);
                                        };

                                        const handleMouseUp = () => {
                                            document.removeEventListener('mousemove', handleMouseMove);
                                            document.removeEventListener('mouseup', handleMouseUp);
                                        };

                                        document.addEventListener('mousemove', handleMouseMove);
                                        document.addEventListener('mouseup', handleMouseUp);
                                    }}
                                    onTouchStart={(e) => {
                                        e.preventDefault();
                                        const slider = e.currentTarget;
                                        const touch = e.touches[0];
                                        const startX = touch.clientX;
                                        const startLeft = maxPosition;
                                        const sliderWidth = slider.parentElement.offsetWidth;

                                        const handleTouchMove = (moveEvent) => {
                                            const touch = moveEvent.touches[0];
                                            const deltaX = touch.clientX - startX;
                                            const deltaPercent = (deltaX / sliderWidth) * 100;
                                            let newPosition = startLeft + deltaPercent;
                                            newPosition = Math.max(minPosition, Math.min(newPosition, 100));
                                            const newValue = Math.round((newPosition / 100) * 30);
                                            handleAgeChange('max', newValue);
                                        };

                                        const handleTouchEnd = () => {
                                            document.removeEventListener('touchmove', handleTouchMove);
                                            document.removeEventListener('touchend', handleTouchEnd);
                                        };

                                        document.addEventListener('touchmove', handleTouchMove, { passive: false });
                                        document.addEventListener('touchend', handleTouchEnd);
                                    }}
                                ></div>
                            </div>
                            
                            <div className="flex justify-between text-xs sm:text-sm text-green-40 mt-4 sm:mt-6">
                                <span>0 лет</span>
                                <span>30 лет</span>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 self-stretch justify-end pt-2 sm:pt-4">
                    <button
                        type="button"
                        onClick={handleReset}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-green-80 rounded-[15px] sm:rounded-[20px] text-sm sm:text-base text-green-40 hover:bg-green-70 font-medium transition-colors"
                    >
                        Сбросить
                    </button>
                    <button
                        type="button"
                        onClick={handleSubmit}
                        className="w-full sm:w-auto px-4 sm:px-6 py-2.5 sm:py-3 bg-green-70 text-green-20 rounded-[15px] sm:rounded-[20px] text-sm sm:text-base font-medium hover:bg-green-60 transition-colors"
                    >
                        Применить
                    </button>
                </div>
            </div>
        </>,
        document.body
    );
};

export default FiltersP;
