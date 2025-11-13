import { Link, useNavigate } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import HelpSection from './HelpSection' // Импортируем компонент HelpSection

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const userMenuRef = useRef(null)
  const { isAuthenticated, login, logout } = useAuth()
  const navigate = useNavigate()
  
  const navigationItems = [
    { id: 1, label: "Найти питомца", path: "/найти-питомца" },
    { id: 2, label: "Помочь", path: null, action: () => setIsHelpModalOpen(true) }, // Изменено: нет пути, есть действие
    { id: 3, label: "Приюты", path: "/приюты" },
    { id: 4, label: "Отдать животное", path: "/отдать-животное" },
  ];

  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = () => {
    logout()
    setIsUserMenuOpen(false)
    navigate('/')
  }

  const handleMobileMenuToggle = () => {
    setIsMenuOpen(!isMenuOpen)
    // Закрываем пользовательское меню при открытии основного
    if (!isMenuOpen) {
      setIsUserMenuOpen(false)
    }
  }

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
    // Закрываем основное меню при открытии пользовательского
    if (!isUserMenuOpen) {
      setIsMenuOpen(false)
    }
  }

  const handleNavigationClick = (item) => {
    if (item.action) {
      item.action() // Выполняем действие если оно есть
      setIsMenuOpen(false) // Закрываем меню на мобильных
      setIsUserMenuOpen(false) // Закрываем пользовательское меню
    } else if (item.path) {
      navigate(item.path) // Переходим по пути если он есть
      setIsMenuOpen(false)
      setIsUserMenuOpen(false)
    }
  }

  const closeHelpModal = () => {
    setIsHelpModalOpen(false)
  }

  return (
    <>
      <header
        className="flex w-full min-h-[60px] md:min-h-[78px] items-center justify-between px-[20px] md:px-[40px] lg:px-[60px] xl:px-[80px] 2xl:px-[120px] py-2.5 sticky top-0 z-50 bg-[#ddf8d8cc] backdrop-blur-sm"
        role="banner"
      >
        <div className="gap-[15px] md:gap-[30px] lg:gap-[50px] xl:gap-[60px] 2xl:gap-[70px] flex items-center relative flex-1 flex-wrap md:flex-nowrap">
          <Link to="/" className="flex-shrink-0">
            <img
              className="relative w-[100px] md:w-[120px] lg:w-[139px] h-4 md:h-4 lg:h-5"
              alt="В Ладошках Logo"
              src="https://c.animaapp.com/qqBlbLv1/img/----------.svg"
            />
          </Link>

          {/* Desktop/Tablet Navigation */}
          <nav
            className="gap-[20px] md:gap-[30px] hidden md:flex items-center relative flex-[0_0_auto]"
            role="navigation"
            aria-label="Main navigation"
          >
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigationClick(item)}
                className={`inline-flex items-center justify-center gap-2.5 relative flex-[0_0_auto] hover:opacity-80 transition-opacity ${
                  item.path ? '' : 'cursor-pointer'
                }`}
              >
                <span className="relative w-fit mt-[-1.00px] font-inter font-medium text-green-20 text-lg md:text-xl tracking-[0] leading-[normal] whitespace-nowrap">
                  {item.label}
                </span>
              </button>
            ))}
          </nav>

          {/* Mobile Menu */}
          <nav
            className={`${
              isMenuOpen ? 'flex' : 'hidden'
            } absolute top-full left-0 right-0 bg-green-95 flex-col gap-0 px-[20px] py-4 z-50 border-t border-green-80 md:hidden`}
            role="navigation"
            aria-label="Mobile navigation"
          >
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigationClick(item)}
                className="inline-flex items-center justify-start gap-2.5 relative w-full py-3 hover:opacity-80 transition-opacity border-b border-green-80"
              >
                <span className="relative w-fit font-inter font-medium text-green-20 text-base tracking-[0] leading-[normal]">
                  {item.label}
                </span>
              </button>
            ))}
            {!isAuthenticated ? (
              <>
                <Link
                  to="/войти"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex items-center justify-start gap-2.5 relative w-full py-3 hover:opacity-80 transition-opacity border-b border-green-80"
                >
                  <span className="relative w-fit font-inter font-medium text-green-20 text-base tracking-[0] leading-[normal]">
                    Войти
                  </span>
                </Link>
                <Link
                  to="/регистрация"
                  onClick={() => setIsMenuOpen(false)}
                  className="inline-flex items-center justify-start gap-2.5 relative w-full py-3 hover:opacity-80 transition-opacity border-b border-green-80"
                >
                  <span className="relative w-fit font-inter font-medium text-green-20 text-base tracking-[0] leading-[normal]">
                    Зарегистрироваться
                  </span>
                </Link>
              </>
            ) : (
              <Link
                to="/профиль"
                onClick={() => setIsMenuOpen(false)}
                className="inline-flex items-center justify-start gap-2.5 relative w-full py-3 hover:opacity-80 transition-opacity border-b border-green-80"
              >
                <span className="relative w-fit font-inter font-medium text-green-20 text-base tracking-[0] leading-[normal]">
                  Профиль
                </span>
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4 md:gap-2 relative" ref={userMenuRef}>
          {/* User Account Button - Desktop/Tablet */}
          <div className="relative hidden md:block">
            <button
              className="relative w-8 h-8 md:w-10 md:h-10 aspect-[1] cursor-pointer flex-shrink-0 hover:opacity-80 transition-opacity flex items-center justify-center"
              aria-label="User account"
              type="button"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            >
              <img
                className="w-full h-full"
                alt=""
                src="https://c.animaapp.com/qqBlbLv1/img/person@2x.png"
              />
            </button>

            {/* User Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-green-98 border border-green-80 rounded-custom-small shadow-lg z-50 overflow-hidden">
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/войти"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block w-full text-left px-4 py-3 text-green-20 font-inter font-medium hover:bg-green-90 transition-colors"
                    >
                      Войти
                    </Link>
                    <Link
                      to="/регистрация"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block w-full text-left px-4 py-3 text-green-20 font-inter font-medium hover:bg-green-90 transition-colors border-t border-green-80"
                    >
                      Зарегистрироваться
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/профиль"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-3 text-green-20 font-inter font-medium hover:bg-green-90 transition-colors"
                    >
                      Профиль
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-green-20 font-inter font-medium hover:bg-green-90 transition-colors border-t border-green-80"
                    >
                      Выйти
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Combined Mobile Menu Toggle and User Button */}
          <div className="relative md:hidden">
            <button
              className="relative w-10 h-10 aspect-[1] cursor-pointer flex-shrink-0 hover:opacity-80 transition-opacity flex items-center justify-center"
              aria-label="Toggle menu and user options"
              type="button"
              onClick={handleUserMenuToggle}
            >
              {/* Иконка пользователя всегда видна */}
              <img
                className="w-6 h-6"
                alt="User menu"
                src="https://c.animaapp.com/qqBlbLv1/img/person@2x.png"
              />
            </button>

            {/* Combined Mobile Dropdown Menu */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-green-98 border border-green-80 rounded-custom-small shadow-lg z-50 overflow-hidden">
                {/* Навигационные пункты */}
                <div className="border-b border-green-80">
                  {navigationItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavigationClick(item)}
                      className="block w-full text-left px-4 py-3 text-green-20 font-inter font-medium hover:bg-green-90 transition-colors"
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                
                {/* Пользовательские пункты */}
                {!isAuthenticated ? (
                  <>
                    <Link
                      to="/войти"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block w-full text-left px-4 py-3 text-green-20 font-inter font-medium hover:bg-green-90 transition-colors border-t border-green-80"
                    >
                      Войти
                    </Link>
                    <Link
                      to="/регистрация"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block w-full text-left px-4 py-3 text-green-20 font-inter font-medium hover:bg-green-90 transition-colors"
                    >
                      Зарегистрироваться
                    </Link>
                  </>
                ) : (
                  <>
                    <Link
                      to="/профиль"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="block px-4 py-3 text-green-20 font-inter font-medium hover:bg-green-90 transition-colors border-t border-green-80"
                    >
                      Профиль
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-green-20 font-inter font-medium hover:bg-green-90 transition-colors"
                    >
                      Выйти
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Модальное окно HelpSection */}
      {isHelpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-green-90 rounded-custom shadow-2xl">
            {/* Кнопка закрытия */}
            <button
              onClick={closeHelpModal}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-green-80 text-green-30 rounded-full flex items-center justify-center hover:bg-green-70 transition-colors shadow-lg"
              aria-label="Закрыть"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            {/* Компонент HelpSection */}
            <HelpSection />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;