import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useForceScroll } from '../hooks/useForceScroll'
import HelpSection from './HelpSection'

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isHelpModalOpen, setIsHelpModalOpen] = useState(false)
  const userMenuRef = useRef(null)
  const { isAuthenticated, user, logout, refreshUser } = useAuth() 
  const navigate = useNavigate()
  const location = useLocation()
  const forceScrollToTop = useForceScroll()
  
  const navigationItems = [
    { id: 1, label: "Найти питомца", path: "/найти-питомца" },
    { id: 2, label: "Помочь", path: null, action: () => setIsHelpModalOpen(true) },
    { id: 3, label: "Приюты", path: "/приюты" },
    { id: 4, label: "Отдать животное", path: "/отдать-животное" },
  ];

  // 🔥 ДОБАВЛЯЕМ: Функция для обновления данных пользователя
  const handleRefreshUser = async () => {
    try {
      await refreshUser();
      console.log('✅ Header: User data refreshed');
    } catch (error) {
      console.error('❌ Header: Error refreshing user data:', error);
    }
  };

  // 🔥 ДОБАВЛЯЕМ: Обновляем данные при монтировании компонента
  useEffect(() => {
    if (isAuthenticated) {
      handleRefreshUser();
    }
  }, [isAuthenticated]);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'smooth'
    });
  };

  const handleLogoClick = () => {
    if (location.pathname === '/') {
      handleScrollToTop();
    } else {
      navigate('/');
    }
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleNavButtonClick = (item) => {
    if (item.action) {
      item.action();
    } else if (item.path) {
      handleScrollToTop();
      if (location.pathname !== item.path) {
        handleNavigate(item.path);
      }
    }
    setIsMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  // 🔥 ИСПРАВЛЕННАЯ ФУНКЦИЯ: Правильное получение имени
  const getUserDisplayName = () => {
    console.log('👤 Header: Current user data:', user);
    
    // Используем реальные данные пользователя из API
    if (user?.firstname && user?.lastname) {
      return `${user.firstname} ${user.lastname}`;
    }
    if (user?.firstname) {
      return user.firstname;
    }
    if (user?.lastname) {
      return user.lastname;
    }
    return user?.email || 'Пользователь';
  };

  const getUserRoleDisplay = () => {
    const roleMap = {
      'user': 'Пользователь',
      'admin': 'Администратор',
      'shelter_admin': 'Админ приюта'
    };
    return roleMap[user?.role] || 'Пользователь';
  };

  // Получаем фото профиля
  const getProfilePhoto = () => {
    if (user?.photoUrl) {
      return user.photoUrl;
    }
    return "https://c.animaapp.com/qqBlbLv1/img/person@2x.png";
  };
  
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
    if (!isMenuOpen) {
      setIsUserMenuOpen(false)
    }
  }

  const handleUserMenuToggle = () => {
    setIsUserMenuOpen(!isUserMenuOpen)
    if (!isUserMenuOpen) {
      setIsMenuOpen(false)
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
          
          <div 
            className="flex-shrink-0 cursor-pointer"
            onClick={handleLogoClick}
          >
            <img
              className="relative w-[100px] md:w-[120px] lg:w-[139px] h-4 md:h-4 lg:h-5"
              alt="В Ладошках Logo"
              src="https://c.animaapp.com/qqBlbLv1/img/----------.svg"
            />
          </div>

          <nav
            className="gap-[20px] md:gap-[30px] hidden md:flex items-center relative flex-[0_0_auto]"
            role="navigation"
            aria-label="Main navigation"
          >
            {navigationItems.map((item) => (
              <div key={item.id}>
                {item.path ? (
                  <button
                    onClick={() => handleNavButtonClick(item)}
                    className={`inline-flex items-center justify-center gap-2.5 relative flex-[0_0_auto] hover:opacity-80 transition-opacity ${
                      location.pathname === item.path ? 'text-green-30 font-semibold' : 'text-green-20'
                    }`}
                  >
                    <span className="relative w-fit mt-[-1.00px] font-inter font-medium text-lg md:text-xl tracking-[0] leading-[normal] whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavButtonClick(item)}
                    className="inline-flex items-center justify-center gap-2.5 relative flex-[0_0_auto] hover:opacity-80 transition-opacity text-green-20"
                  >
                    <span className="relative w-fit mt-[-1.00px] font-inter font-medium text-lg md:text-xl tracking-[0] leading-[normal] whitespace-nowrap">
                      {item.label}
                    </span>
                  </button>
                )}
              </div>
            ))}
          </nav>

          <nav
            className={`${
              isMenuOpen ? 'flex' : 'hidden'
            } absolute top-full left-0 right-0 bg-green-95 flex-col gap-0 px-[20px] py-4 z-50 border-t border-green-80 md:hidden`}
            role="navigation"
            aria-label="Mobile navigation"
          >
            {navigationItems.map((item) => (
              <div key={item.id}>
                {item.path ? (
                  <button
                    onClick={() => handleNavButtonClick(item)}
                    className={`inline-flex items-center justify-start gap-2.5 relative w-full py-3 hover:opacity-80 transition-opacity border-b border-green-80 ${
                      location.pathname === item.path ? 'text-green-30 font-semibold bg-green-90' : 'text-green-20'
                    }`}
                  >
                    <span className="relative w-fit font-inter font-medium text-base tracking-[0] leading-[normal]">
                      {item.label}
                    </span>
                  </button>
                ) : (
                  <button
                    onClick={() => handleNavButtonClick(item)}
                    className="inline-flex items-center justify-start gap-2.5 relative w-full py-3 hover:opacity-80 transition-opacity border-b border-green-80 text-green-20"
                  >
                    <span className="relative w-fit font-inter font-medium text-base tracking-[0] leading-[normal]">
                      {item.label}
                    </span>
                  </button>
                )}
              </div>
            ))}
            {!isAuthenticated ? (
              <>
                <div
                  onClick={() => {
                    handleScrollToTop();
                    if (location.pathname !== '/войти') {
                      navigate('/войти');
                    }
                    setIsMenuOpen(false);
                  }}
                  className={`inline-flex items-center justify-start gap-2.5 relative w-full py-3 hover:opacity-80 transition-opacity border-b border-green-80 cursor-pointer ${
                    location.pathname === '/войти' ? 'text-green-30 font-semibold bg-green-90' : 'text-green-20'
                  }`}
                >
                  <span className="relative w-fit font-inter font-medium text-base tracking-[0] leading-[normal]">
                    Войти
                  </span>
                </div>
                <div
                  onClick={() => {
                    handleScrollToTop();
                    if (location.pathname !== '/регистрация') {
                      navigate('/регистрация');
                    }
                    setIsMenuOpen(false);
                  }}
                  className={`inline-flex items-center justify-start gap-2.5 relative w-full py-3 hover:opacity-80 transition-opacity border-b border-green-80 cursor-pointer ${
                    location.pathname === '/регистрация' ? 'text-green-30 font-semibold bg-green-90' : 'text-green-20'
                  }`}
                >
                  <span className="relative w-fit font-inter font-medium text-base tracking-[0] leading-[normal]">
                    Зарегистрироваться
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="px-4 py-3 border-b border-green-80 bg-green-90">
                  <p className="text-green-30 font-semibold text-sm">{getUserDisplayName()}</p>
                  <p className="text-green-40 text-xs">{getUserRoleDisplay()}</p>
                </div>
                <div
                  onClick={() => {
                    handleScrollToTop();
                    if (location.pathname !== '/профиль') {
                      navigate('/профиль');
                    }
                    setIsMenuOpen(false);
                  }}
                  className={`inline-flex items-center justify-start gap-2.5 relative w-full py-3 hover:opacity-80 transition-opacity border-b border-green-80 cursor-pointer ${
                    location.pathname === '/профиль' ? 'text-green-30 font-semibold bg-green-90' : 'text-green-20'
                  }`}
                >
                  <span className="relative w-fit font-inter font-medium text-base tracking-[0] leading-[normal]">
                    Профиль
                  </span>
                </div>
                {user?.role === 'admin' && (
                  <div
                    onClick={() => {
                      handleScrollToTop();
                      if (location.pathname !== '/админ-профиль') {
                        navigate('/админ-профиль');
                      }
                      setIsMenuOpen(false);
                    }}
                    className={`inline-flex items-center justify-start gap-2.5 relative w-full py-3 hover:opacity-80 transition-opacity border-b border-green-80 cursor-pointer ${
                      location.pathname === '/админ-профиль' ? 'text-green-30 font-semibold bg-green-90' : 'text-green-20'
                    }`}
                  >
                    <span className="relative w-fit font-inter font-medium text-base tracking-[0] leading-[normal]">
                      Админ панель
                    </span>
                  </div>
                )}
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center justify-start gap-2.5 relative w-full py-3 hover:opacity-80 transition-opacity border-b border-green-80 text-red-40"
                >
                  <span className="relative w-fit font-inter font-medium text-base tracking-[0] leading-[normal]">
                    Выйти
                  </span>
                </button>
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4 md:gap-2 relative" ref={userMenuRef}>
          <div className="relative hidden md:block">
            <button
              className="relative flex items-center gap-2 cursor-pointer flex-shrink-0 hover:opacity-80 transition-opacity p-2 rounded-custom-small hover:bg-green-90"
              aria-label="User account"
              type="button"
              onClick={handleUserMenuToggle}
            >
              <img
                className="w-8 h-8 md:w-10 md:h-10 rounded-full object-cover"
                alt="Аватар пользователя"
                src={getProfilePhoto()}
              />
              {isAuthenticated && (
                <div className="hidden lg:block text-left">
                  <p className="text-green-20 font-inter font-medium text-sm">
                    {getUserDisplayName()}
                  </p>
                  <p className="text-green-40 font-inter text-xs">
                    {getUserRoleDisplay()}
                  </p>
                </div>
              )}
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-green-98 border border-green-80 rounded-custom-small shadow-lg z-50 overflow-hidden">
                {!isAuthenticated ? (
                  <>
                    <div
                      onClick={() => {
                        handleScrollToTop();
                        if (location.pathname !== '/войти') {
                          navigate('/войти');
                        }
                        setIsUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-green-20 font-inter font-medium hover:bg-green-90 transition-colors cursor-pointer"
                    >
                      Войти
                    </div>
                    <div
                      onClick={() => {
                        handleScrollToTop();
                        if (location.pathname !== '/регистрация') {
                          navigate('/регистрация');
                        }
                        setIsUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-green-20 font-inter font-medium hover:bg-green-90 transition-colors border-t border-green-80 cursor-pointer"
                    >
                      Зарегистрироваться
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-3 bg-green-95 border-b border-green-80">
                      <p className="text-green-30 font-semibold text-sm">{getUserDisplayName()}</p>
                      <p className="text-green-40 text-xs">{getUserRoleDisplay()}</p>
                      <p className="text-green-40 text-xs truncate">{user?.email}</p>
                    </div>
                    
                    <div
                      onClick={() => {
                        handleScrollToTop();
                        if (location.pathname !== '/профиль') {
                          navigate('/профиль');
                        }
                        setIsUserMenuOpen(false);
                      }}
                      className="flex items-center gap-3 px-4 py-3 text-green-20 font-inter font-medium hover:bg-green-90 transition-colors cursor-pointer"
                    >
                      <img
                        className="w-5 h-5 rounded-full object-cover"
                        alt=""
                        src={getProfilePhoto()}
                      />
                      Профиль
                    </div>
                    
                    {user?.role === 'admin' && (
                      <div
                        onClick={() => {
                          handleScrollToTop();
                          if (location.pathname !== '/админ-профиль') {
                            navigate('/админ-профиль');
                          }
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-green-20 font-inter font-medium hover:bg-green-90 transition-colors border-t border-green-80 cursor-pointer"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Админ панель
                      </div>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-3 text-red-40 font-inter font-medium hover:bg-red-95 transition-colors border-t border-green-80"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                      </svg>
                      Выйти
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          <div className="relative md:hidden">
            <button
              className="relative w-10 h-10 aspect-[1] cursor-pointer flex-shrink-0 hover:opacity-80 transition-opacity flex items-center justify-center"
              aria-label="Toggle menu and user options"
              type="button"
              onClick={handleUserMenuToggle}
            >
              <img
                className="w-6 h-6 rounded-full object-cover"
                alt="User menu"
                src={getProfilePhoto()}
              />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-green-98 border border-green-80 rounded-custom-small shadow-lg z-50 overflow-hidden">
                {isAuthenticated && (
                  <div className="px-4 py-3 bg-green-95 border-b border-green-80">
                    <p className="text-green-30 font-semibold text-sm">{getUserDisplayName()}</p>
                    <p className="text-green-40 text-xs">{getUserRoleDisplay()}</p>
                  </div>
                )}
                
                <div className="border-b border-green-80">
                  {navigationItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleNavButtonClick(item)}
                      className={`block w-full text-left px-4 py-3 font-inter font-medium hover:bg-green-90 transition-colors ${
                        location.pathname === item.path ? 'text-green-30 font-semibold bg-green-90' : 'text-green-20'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
                
                {!isAuthenticated ? (
                  <>
                    <div
                      onClick={() => {
                        handleScrollToTop();
                        if (location.pathname !== '/войти') {
                          navigate('/войти');
                        }
                        setIsUserMenuOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-3 font-inter font-medium hover:bg-green-90 transition-colors border-t border-green-80 cursor-pointer ${
                        location.pathname === '/войти' ? 'text-green-30 font-semibold bg-green-90' : 'text-green-20'
                      }`}
                    >
                      Войти
                    </div>
                    <div
                      onClick={() => {
                        handleScrollToTop();
                        if (location.pathname !== '/регистрация') {
                          navigate('/регистрация');
                        }
                        setIsUserMenuOpen(false);
                      }}
                      className={`block w-full text-left px-4 py-3 font-inter font-medium hover:bg-green-90 transition-colors cursor-pointer ${
                        location.pathname === '/регистрация' ? 'text-green-30 font-semibold bg-green-90' : 'text-green-20'
                      }`}
                    >
                      Зарегистрироваться
                    </div>
                  </>
                ) : (
                  <>
                    <div
                      onClick={() => {
                        handleScrollToTop();
                        if (location.pathname !== '/профиль') {
                          navigate('/профиль');
                        }
                        setIsUserMenuOpen(false);
                      }}
                      className={`block px-4 py-3 font-inter font-medium hover:bg-green-90 transition-colors border-t border-green-80 cursor-pointer ${
                        location.pathname === '/профиль' ? 'text-green-30 font-semibold bg-green-90' : 'text-green-20'
                      }`}
                    >
                      Профиль
                    </div>
                    {user?.role === 'admin' && (
                      <div
                        onClick={() => {
                          handleScrollToTop();
                          if (location.pathname !== '/админ-профиль') {
                            navigate('/админ-профиль');
                          }
                          setIsUserMenuOpen(false);
                        }}
                        className={`block px-4 py-3 font-inter font-medium hover:bg-green-90 transition-colors cursor-pointer ${
                          location.pathname === '/админ-профиль' ? 'text-green-30 font-semibold bg-green-90' : 'text-green-20'
                        }`}
                      >
                        Админ панель
                      </div>
                    )}
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-3 text-red-40 font-inter font-medium hover:bg-red-95 transition-colors"
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

      {isHelpModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="relative w-full max-w-6xl max-h-[90vh] overflow-y-auto bg-green-90 rounded-custom shadow-2xl">
            <button
              onClick={closeHelpModal}
              className="absolute top-4 right-4 z-10 w-10 h-10 bg-green-80 text-green-30 rounded-full flex items-center justify-center hover:bg-green-70 transition-colors shadow-lg"
              aria-label="Закрыть"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            
            <HelpSection />
          </div>
        </div>
      )}
    </>
  );
};

export default Header;