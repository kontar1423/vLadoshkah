import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LapaIcon from '../assets/images/lapa.png';
import ReactDOM from 'react-dom';

const HelpSection = ({ isOpen, onClose }) => {
    const navigate = useNavigate();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleContactShelters = () => {
        if (onClose) onClose();
        navigate('/shelters');
    };

    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <>
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
                onClick={onClose}
            />
            
            <div 
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-green-90 overflow-hidden w-[85%] max-w-[320px] sm:max-w-md md:max-w-lg lg:max-w-2xl rounded-2xl shadow-xl"
                onClick={handleContentClick}
            >
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onClose) onClose();
                    }}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    onTouchEnd={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (onClose) onClose();
                    }}
                    className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-[10000] w-8 h-8 sm:w-8 sm:h-8 bg-green-80 text-green-30 rounded-full flex items-center justify-center hover:bg-green-70 active:bg-green-60 transition-colors touch-manipulation"
                    style={{ touchAction: 'manipulation' }}
                    aria-label="Закрыть"
                >
                    <svg className="w-4 h-4 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <div className="py-3 px-3 sm:py-4 sm:px-4 md:py-6 md:px-6 lg:py-8 lg:px-8 relative">
                    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                        <div className="absolute w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 -top-16 sm:-top-24 md:-top-32 -right-16 sm:-right-24 md:-right-32 bg-green-80 rounded-full opacity-20"></div>
                        <div className="absolute w-24 h-24 sm:w-36 sm:h-36 md:w-48 md:h-48 -bottom-12 sm:-bottom-18 md:-bottom-24 -left-12 sm:-left-18 md:-left-24 bg-green-70 rounded-full opacity-15"></div>
                        <div className="absolute w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 top-1/2 right-8 sm:right-12 md:right-16 bg-green-60 rounded-lg opacity-10 rotate-45"></div>
                        <div className="absolute w-8 h-8 sm:w-12 sm:h-12 md:w-16 md:h-16 top-4 sm:top-6 md:top-8 left-4 sm:left-6 md:left-8 bg-green-50 rounded-full opacity-10"></div>
                    </div>

                    <div className="relative z-10">
                        <div className="text-center mb-3 sm:mb-4 md:mb-6">
                            <div className="flex items-center justify-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                                <img
                                    src={LapaIcon} 
                                    alt="Лапа"
                                    className="w-8 h-8 sm:w-10 sm:h-10"
                                />
                                <h1 className="font-sf-rounded font-bold text-green-30 text-lg sm:text-xl md:text-2xl lg:text-3xl">
                                    Как помочь приютам?
                                </h1>
                            </div>
                        </div>

                        <div className="rounded-custom p-1.5 sm:p-2 mb-3 sm:mb-4 md:mb-6">
                            <div className="space-y-2 sm:space-y-3 md:space-y-4">
                                <p className="font-inter text-green-30 text-xs sm:text-sm md:text-base leading-relaxed">
                                    Помогать - это прекрасно! Чтобы ваша помощь была максимально безопасной и эффективной, важно знать:
                                </p>
                                
                                <p className="font-inter text-green-30 text-xs sm:text-sm md:text-base leading-relaxed">
                                    Наш сайт только показывает контакты и нужды приютов, но <strong className="text-green-20">не проводит денежные операции</strong>. Мы не собираем средства за них.
                                </p>

                                <div>
                                    <p className="font-inter text-green-30 text-xs sm:text-sm md:text-base font-semibold mb-1 sm:mb-2">
                                        Пожалуйста:
                                    </p>
                                    <ul className="space-y-1 sm:space-y-2">
                                        <li className="font-inter text-green-30 text-xs sm:text-sm md:text-base">
                                            • Позвоните или напишите в приют
                                        </li>
                                        <li className="font-inter text-green-30 text-xs sm:text-sm md:text-base">
                                            • Используйте для перевода только те реквизиты, которые вам дали непосредственно сотрудники приюта
                                        </li>
                                    </ul>
                                </div>

                                <p className="font-inter text-green-30 text-xs sm:text-sm md:text-base leading-relaxed">
                                    Так вы будете уверены, что ваши средства попадут по назначению.
                                    <br />
                                    Спасибо за вашу доброту и понимание!
                                </p>
                            </div>
                        </div>

                        <div className="text-center">
                            <button
                                onClick={handleContactShelters}
                                className="w-full px-4 sm:px-6 py-2 sm:py-2.5 md:py-3 bg-green-70 text-green-100 font-sf-rounded font-semibold text-xs sm:text-sm md:text-base rounded-custom-small hover:bg-green-60 transition-colors"
                                type="button"
                            >
                                Связаться с приютом
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default HelpSection;