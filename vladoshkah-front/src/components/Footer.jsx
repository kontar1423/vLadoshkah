import React from 'react'
import VkIcon from '../assets/images/vk.png'
import WhatsAppIcon from '../assets/images/whatsapp.png'
import TgIcon from '../assets/images/tg.png'

export const Footer = () => {
  const socialLinks = [
    {
      id: 1,
      name: "VK",
      url: "https://vk.com/sergeysag",
      ariaLabel: "Свяжитесь с нами через VK",
      icon: (
        <img 
          src={VkIcon} 
          alt="VK" 
          className="w-6 h-6 object-contain"
        />
      )
    },
    {
      id: 2,
      name: "Telegram",
      url: "https://web.telegram.org/a/#1216483862",
      ariaLabel: "Свяжитесь с нами через Telegram",
      icon: (
        <img 
          src={TgIcon} 
          alt="Telegram" 
          className="w-6 h-6"
        />
      )
    },
    {
      id: 3,
      name: "WhatsApp",
      url: "https://wa.me/whatsapp",
      ariaLabel: "Свяжитесь с нами через WhatsApp",
      icon: (
        <img 
          src={WhatsAppIcon} 
          alt="WhatsApp" 
          className="w-6 h-6"
        />
      )
    }
    
  ];

  return (
    <footer className="flex flex-col w-full items-center gap-[40px] md:gap-[30px] px-[10px] md:px-[40px] lg:px-[60px] py-10 bg-green-20 relative z-30">
      <div className="inline-flex flex-col items-center gap-4 w-full max-w-container">
        <h2 className="relative w-fit mt-[-1.00px] font-inter font-medium text-green-100 text-base md:text-lg">
          Свяжитесь с нами
        </h2>
        <div className="flex items-center justify-center gap-8">
          {socialLinks.map((link) => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={link.ariaLabel}
              className="text-green-100 hover:text-green-90 transition-colors cursor-pointer transform hover:scale-110 duration-200 flex items-center justify-center w-8 h-8"
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>

      <div className="relative w-full max-w-[992px] text-center">
        <p className="mb-3 text-green-95 font-inter font-medium text-sm md:text-base">
          © 2025-2026 В ладошках
        </p>
        <p className="text-green-95 font-inter font-medium text-xs md:text-sm leading-relaxed">
          В ладошках использует файлы cookie. Продолжая работу с сайтом вы подтверждаете использование сайтом cookies вашего браузера, которые помогают нам делать этот сайт удобнее для пользователей. Вы можете запретить сохранение файлов cookie в настройках своего браузера.
        </p>
      </div>
    </footer>
  );
};

export default Footer;