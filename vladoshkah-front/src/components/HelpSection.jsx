import React from 'react';
import { useNavigate } from 'react-router-dom';
import LapaIcon from '../assets/images/lapa.png';

const HelpSection = ({ onClose }) => {
    const navigate = useNavigate();

    const handleContactShelters = () => {
        if (onClose) onClose();
        navigate('/приюты');
    };

    return (
        <section className="bg-green-90 overflow-hidden w-full py-8 px-4 sm:px-6 relative">
            <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
                <div className="absolute w-64 h-64 -top-32 -right-32 bg-green-80 rounded-full opacity-20"></div>
                <div className="absolute w-48 h-48 -bottom-24 -left-24 bg-green-70 rounded-full opacity-15"></div>
                <div className="absolute w-32 h-32 top-1/2 right-16 bg-green-60 rounded-lg opacity-10 rotate-45"></div>
                <div className="absolute w-16 h-16 top-8 left-8 bg-green-50 rounded-full opacity-10"></div>
            </div>

            {onClose && (
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 w-8 h-8 bg-green-80 text-green-30 rounded-full flex items-center justify-center hover:bg-green-70 transition-colors"
                    aria-label="Закрыть"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            )}

            <div className="max-w-2xl mx-auto w-full relative z-10">
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-3 mb-3">
                        <img
                            src={LapaIcon} 
                            alt="Лапа"
                            className="w-10 h-10"
                        />
                        <h1 className="font-sf-rounded font-bold text-green-30 text-2xl md:text-3xl">
                            Как помочь приютам?
                        </h1>
                    </div>
                </div>

                <div className="rounded-custom p-2 mb-2">
                    <div className="space-y-3">
                        <p className="font-inter text-green-30 text-base leading-relaxed">
                            Помогать - это прекрасно! Чтобы ваша помощь была максимально безопасной и эффективной, важно знать:
                        </p>
                        
                        <p className="font-inter text-green-30 text-base leading-relaxed">
                            Наш сайт только показывает контакты и нужды приютов, но <strong className="text-green-20">не проводит денежные операции</strong>. Мы не собираем средства за них.
                        </p>

                        <div>
                            <p className="font-inter text-green-30 text-base font-semibold mb-2">
                                Пожалуйста:
                            </p>
                            <ul className="space-y-2">
                                <li className="font-inter text-green-30 text-base">
                                    • Позвоните или напишите в приют
                                </li>
                                <li className="font-inter text-green-30 text-base">
                                    • Используйте для перевода только те реквизиты, которые вам дали непосредственно сотрудники приюта
                                </li>
                            </ul>
                        </div>

                        <p className="font-inter text-green-30 text-base leading-relaxed">
                            Так вы будете уверены, что ваши средства попадут по назначению.
                            <br />
                            Спасибо за вашу доброту и понимание!
                        </p>
                    </div>
                </div>

                <div className="text-center">
                    <button
                        onClick={handleContactShelters}
                        className="w-full md:w-auto px-6 py-3 bg-green-70 text-green-100 font-sf-rounded font-semibold text-base rounded-custom-small hover:bg-green-60 transition-colors"
                        type="button"
                    >
                        Связаться с приютом
                    </button>
                </div>
            </div>
        </section>
    );
};

export default HelpSection;