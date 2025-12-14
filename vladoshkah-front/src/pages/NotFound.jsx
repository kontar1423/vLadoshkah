import React from 'react';
import DogImage from '../assets/images/peskrug.jpg';
import LapaIcon from '../assets/images/lapa.png';
import TgIcon from '../assets/images/tg.png';
import VkIcon from '../assets/images/vk.png';
import WhatsappIcon from '../assets/images/whatsapp.png';

const NotFound = () => {
  return (
    <div className="flex flex-col min-h-[60vh] bg-green-95">
      <div className="w-full px-2 sm:px-6 md:px-8 lg:px-12 py-10 sm:py-16">
        <div className="w-full max-w-screen-2xl mx-auto bg-gradient-to-b from-[#c9f4c9] to-[#b7eeb7] rounded-[32px] shadow-lg px-4 sm:px-8 md:px-12 py-12 sm:py-16 flex flex-col items-center justify-center gap-6 sm:gap-8 min-h-[420px]">
          <div className="flex items-center justify-center gap-6 sm:gap-10 text-[72px] sm:text-[96px] md:text-[112px] font-sf-rounded font-bold text-black">
            <span>4</span>
            <div className="relative">
              <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 rounded-full border-[10px] border-white shadow-xl overflow-hidden bg-white">
                <img
                  src={DogImage}
                  alt="Собака"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute inset-0 rounded-full border-[4px] border-[#0c6f3a] pointer-events-none" />
            </div>
            <span>4</span>
          </div>
          <p className="font-inter text-lg sm:text-xl text-green-30 text-center">Страница не найдена</p>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
