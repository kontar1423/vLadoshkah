import React, { useEffect } from 'react';
import ReactDOM from 'react-dom';
import GodPes from '../assets/images/godpes.png';

const AdoptionConfirmationModal = ({ isOpen, onClose, onConfirm, petName, isLoading }) => {
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

    if (!isOpen) return null;

    return ReactDOM.createPortal(
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black bg-opacity-50 z-[9998]"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div 
                className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999] bg-green-95 rounded-custom p-6 max-w-md w-full animate-fade-up"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden">
                        <img 
                            src={GodPes}
                            alt="Pet adoption" 
                            className="w-full h-full object-cover"
                        />
                    </div>
                    
                    <h3 className="font-sf-rounded font-bold text-green-30 text-xl mb-4">
                        Забрать {petName} домой
                    </h3>
                    
                    <p className="text-green-40 font-inter text-sm mb-6 leading-relaxed">
                        Если вы хотите забрать питомца себе домой, то просто нажмите кнопку "подтвердить" 
                        и в скором времени приют свяжется с вами по почте или номеру, чтобы обсудить 
                        все нюансы отдачи животного
                    </p>
                    
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="flex-1 px-4 py-3 bg-green-80 text-green-40 font-sf-rounded font-semibold rounded-custom-small hover:bg-green-70 transition-colors disabled:opacity-50"
                        >
                            Отмена
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`flex-1 px-4 py-3 font-sf-rounded font-semibold rounded-custom-small transition-all duration-200 ${
                                isLoading
                                    ? 'bg-green-80 text-green-60 cursor-not-allowed'
                                    : 'bg-green-50 text-green-100 hover:bg-green-60 active:bg-green-40 shadow-lg hover:shadow-xl cursor-pointer'
                            }`}
                        >
                            {isLoading ? 'Отправка...' : 'Подтвердить'}
                        </button>
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
};

export default AdoptionConfirmationModal;