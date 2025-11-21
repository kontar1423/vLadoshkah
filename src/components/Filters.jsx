import React, { useState, useEffect } from "react";
import { shelterService } from '../services/shelterService';

export const Filters = ({ isOpen, onClose, onApply, initialFilters, onReset }) => {
    const [filters, setFilters] = useState({
        type: "Все",
        gender: "Любой",
        animal_size: "Любой",
        health: "Любое",
        age_min: 0,
        age_max: 20,
        shelter_id: "Любой",
    });

    const [shelters, setShelters] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            loadShelters();
            if (initialFilters && Object.keys(initialFilters).length > 0) {
                const updatedFilters = {
                    type: "Все",
                    gender: "Любой",
                    animal_size: "Любой",
                    health: "Любое",
                    age_min: 0,
                    age_max: 20,
                    shelter_id: "Любой",
                };

                if (initialFilters.type) {
                    updatedFilters.type = initialFilters.type;
                }
                if (initialFilters.gender) {
                    updatedFilters.gender = initialFilters.gender;
                }
                if (initialFilters.animal_size) {
                    updatedFilters.animal_size = initialFilters.animal_size;
                }
                if (initialFilters.health) {
                    updatedFilters.health = initialFilters.health;
                }
                if (initialFilters.shelter_id) {
                    updatedFilters.shelter_id = initialFilters.shelter_id;
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
                    age_max: 20,
                    shelter_id: "Любой",
                });
            }
        }
    }, [isOpen, initialFilters]);

    const loadShelters = async () => {
        try {
            setLoading(true);
            const sheltersData = await shelterService.getAllShelters();
            setShelters(sheltersData);
        } catch (error) {
            console.error('Ошибка загрузки приютов:', error);
        } finally {
            setLoading(false);
        }
    };

    const filterFields = [
        {
            id: "type",
            label: "Кого вы ищете",
            value: filters.type,
            options: [
                { value: "Все", label: "Все" },
                { value: "dog", label: "Собаки" },
                { value: "cat", label: "Кошки" }
            ],
            fullWidth: true,
        },
        {
            id: "gender",
            label: "Пол питомца",
            value: filters.gender,
            options: [
                { value: "Любой", label: "Любой" },
                { value: "male", label: "Мальчик" },
                { value: "female", label: "Девочка" }
            ],
            fullWidth: false,
        },
        {
            id: "animal_size",
            label: "Размер питомца",
            value: filters.animal_size,
            options: [
                { value: "Любой", label: "Любой" },
                { value: "small", label: "Маленький" },
                { value: "medium", label: "Средний" },
                { value: "large", label: "Большой" }
            ],
            fullWidth: false,
        },
        {
            id: "health",
            label: "Здоровье питомца",
            value: filters.health,
            options: [
                { value: "Любое", label: "Любое" },
                { value: "healthy", label: "Здоровый" },
                { value: "needs_treatment", label: "Требует лечения" },
                { value: "special_needs", label: "Особые потребности" }
            ],
            fullWidth: false,
        },
        {
            id: "shelter_id",
            label: "Приют",
            value: filters.shelter_id,
            options: [
                { value: "Любой", label: "Любой" },
                ...shelters.map(shelter => ({ 
                    value: shelter.id, 
                    label: shelter.name 
                }))
            ],
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
                return { 
                    ...prev, 
                    age_min: Math.min(numValue, prev.age_max) 
                };
            } else {
                return { 
                    ...prev, 
                    age_max: Math.max(numValue, prev.age_min) 
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
            age_max: 20,
            shelter_id: "Любой",
        });
        if (onReset) {
            onReset();
        }
    };

    const handleSubmit = () => {
        console.log("Filters applied:", filters);
        
        const apiFilters = {
            type: filters.type === "Все" ? "" : filters.type,
            gender: filters.gender === "Любой" ? "" : filters.gender,
            animal_size: filters.animal_size === "Любой" ? "" : filters.animal_size,
            health: filters.health === "Любое" ? "" : filters.health,
            age_min: filters.age_min,
            age_max: filters.age_max,
            shelter_id: filters.shelter_id === "Любой" ? "" : filters.shelter_id,
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

    const minPosition = (filters.age_min / 20) * 100;
    const maxPosition = (filters.age_max / 20) * 100;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-green-95 rounded-[40px] w-full max-w-2xl flex flex-col items-start gap-6 p-8 relative max-h-[90vh] overflow-y-auto">
                <header className="flex items-center justify-between self-stretch w-full">
                    <h1 className="text-4xl font-sf-rounded font-bold text-green-30">Фильтры</h1>
                    <button 
                        onClick={handleClose}
                        className="relative w-6 h-6 cursor-pointer text-green-40 hover:text-green-20 transition-colors"
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

                <form className="flex flex-col items-start gap-4 self-stretch w-full">
                    {filterFields.map((field, index) => {
                        if (index % 2 === 1) {
                            const prevField = filterFields[index - 1];
                            return (
                                <div key={`row-${index}`} className="flex gap-4 self-stretch w-full">
                                    <div className="flex-1 flex flex-col gap-2">
                                        <label htmlFor={prevField.id} className="text-base font-medium text-green-40">
                                            {prevField.label}
                                        </label>
                                        <div className="h-12 flex items-center justify-between px-4 border-2 border-green-40 rounded-[20px] bg-green-95 relative">
                                            <select
                                                id={prevField.id}
                                                value={prevField.value}
                                                onChange={(e) => handleFilterChange(prevField.id, e.target.value)}
                                                className="w-full text-lg appearance-none bg-transparent outline-none pr-8 text-green-40 cursor-pointer"
                                            >
                                                {prevField.options.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
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

                                    <div className="flex-1 flex flex-col gap-2">
                                        <label htmlFor={field.id} className="text-base font-medium text-green-40">
                                            {field.label}
                                        </label>
                                        <div className="h-12 flex items-center justify-between px-4 border-2 border-green-40 rounded-[20px] bg-green-95 relative">
                                            <select
                                                id={field.id}
                                                value={field.value}
                                                onChange={(e) => handleFilterChange(field.id, e.target.value)}
                                                disabled={field.id === 'shelter_id' && loading}
                                                className="w-full text-lg appearance-none bg-transparent outline-none pr-8 text-green-40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {field.options.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {field.id === 'shelter_id' && loading ? (
                                                <div className="absolute right-3 w-5 h-5 border-2 border-green-40 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <svg 
                                                    className="absolute right-3 w-5 h-5 text-green-40 pointer-events-none"
                                                    fill="none" 
                                                    stroke="currentColor" 
                                                    viewBox="0 0 24 24"
                                                >
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                                </svg>
                                            )}
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
                                            className="w-full text-lg appearance-none bg-transparent outline-none pr-8 text-green-40 cursor-pointer"
                                        >
                                            {field.options.map(option => (
                                                <option key={option.value} value={option.value}>
                                                    {option.label}
                                                </option>
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

                    <div className="self-stretch w-full flex flex-col gap-4">
                        <label className="text-base font-medium text-green-40">
                            Возраст питомца: {filters.age_min} - {filters.age_max} лет
                        </label>
                        
                        <div className="relative py-4">
                            <div className="relative h-2 bg-green-80 rounded-full">
                                <div 
                                    className="absolute h-2 bg-green-50 rounded-full"
                                    style={{
                                        left: `${minPosition}%`,
                                        right: `${100 - maxPosition}%`
                                    }}
                                ></div>
                                
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    value={filters.age_min}
                                    onChange={(e) => handleAgeChange('min', e.target.value)}
                                    className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
                                />
                                <input
                                    type="range"
                                    min="0"
                                    max="20"
                                    value={filters.age_max}
                                    onChange={(e) => handleAgeChange('max', e.target.value)}
                                    className="absolute w-full h-2 opacity-0 cursor-pointer z-10"
                                />
                                
                                <div 
                                    className="absolute w-6 h-6 bg-green-50 rounded-full border-2 border-green-98 -top-2 transform -translate-x-1/2 shadow-lg pointer-events-none"
                                    style={{ left: `${minPosition}%` }}
                                ></div>
                                <div 
                                    className="absolute w-6 h-6 bg-green-50 rounded-full border-2 border-green-98 -top-2 transform -translate-x-1/2 shadow-lg pointer-events-none"
                                    style={{ left: `${maxPosition}%` }}
                                ></div>
                            </div>
                            
                            <div className="flex justify-between text-sm text-green-40 mt-6">
                                <span>0 лет</span>
                                <span>20 лет</span>
                            </div>
                        </div>
                    </div>
                </form>

                <div className="flex gap-3 self-stretch justify-end pt-4">
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
                        className="px-6 py-3 bg-green-70 text-green-20 rounded-[20px] font-medium hover:bg-green-60 transition-colors"
                    >
                        Применить фильтры
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Filters;