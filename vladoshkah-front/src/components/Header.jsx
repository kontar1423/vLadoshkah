import { useNavigate, useLocation } from 'react-router-dom'
import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useForceScroll } from '../hooks/useForceScroll'
import HelpSection from './HelpSection'
import { isShelterAdminRole, normalizeRole } from '../utils/roleUtils'

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
    { id: 1, label: "Найти питомца", path: "/find-pet" },
    { id: 2, label: "Помочь", path: null, action: () => setIsHelpModalOpen(true) },
    { id: 3, label: "Приюты", path: "/shelters" },
    { id: 4, label: "Отдать животное", path: "/give-animal" },
  ];

  const handleRefreshUser = async () => {
    try {
      await refreshUser();
      console.log('Header: User data refreshed');
    } catch (error) {
      console.error('Header: Error refreshing user data:', error);
    }
  };

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

  const getUserDisplayName = () => {
    console.log('Header: Current user data:', user);
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
    const normalizedRole = normalizeRole(user?.role);
    return roleMap[normalizedRole] || 'Пользователь';
  };

  const getProfilePhoto = () => {
    if (user?.photoUrl) {
      return user.photoUrl;
    }
    return "https://c.animaapp.com/qqBlbLv1/img/person@2x.png";
  };

  const isAdmin = user?.role === 'admin' || isShelterAdminRole(user?.role);
  
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
        className="flex w-full min-h-[60px] md:min-h-[78px] items-center justify-between px-[20px] md:px-[40px] lg:px-[60px] xl:px-[80px] 2xl:px-[120px] py-2.5 fixed md:sticky top-0 left-0 right-0 z-50 bg-[#ddf8d8cc] backdrop-blur-sm transition-all duration-300 shadow-soft"
        role="banner"
      >
        <div className="gap-[15px] md:gap-[30px] lg:gap-[50px] xl:gap-[60px] 2xl:gap-[70px] flex items-center relative flex-1 flex-wrap md:flex-nowrap">
          
          <div 
            className="flex-shrink-0 cursor-pointer transition-opacity duration-300 hover:opacity-80"
            onClick={handleLogoClick}
          >
            <img
              className="relative w-[100px] md:w-[120px] lg:w-[139px] h-4 md:h-4 lg:h-5 transition-all duration-300"
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
                    className={`inline-flex items-center justify-center gap-2.5 relative flex-[0_0_auto] transition-all duration-300 ${
                      location.pathname === item.path 
                        ? 'text-green-30 font-semibold' 
                        : 'text-green-20 hover:text-green-30'
                    }`}
                  >
                    <span className="relative w-fit mt-[-1.00px] font-inter font-medium text-lg md:text-xl tracking-[0] leading-[normal] whitespace-nowrap transition-all duration-300">
                      {item.label}
                    </span>
                    {location.pathname === item.path && (
                      <span className="absolute bottom-0 left-0 w-full h-0.5 bg-green-40 animate-scale-in"></span>
                    )}
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
            } absolute top-full left-0 right-0 mx-[20px] my-2 bg-green-98 flex-col gap-0 rounded-custom-small z-50 border-2 border-green-50 shadow-2xl md:hidden max-h-[calc(100vh-100px)] overflow-y-auto backdrop-blur-sm`}
            role="navigation"
            aria-label="Mobile navigation"
          >
            <div className="px-0 py-2">
              {navigationItems.map((item, index) => (
                <div key={item.id}>
                  {item.path ? (
                    <button
                      onClick={() => handleNavButtonClick(item)}
                      className={`inline-flex items-center justify-start gap-3 relative w-full px-4 py-3.5 transition-all duration-200 ${
                        index < navigationItems.length - 1 ? 'border-b border-green-70' : ''
                      } ${
                        location.pathname === item.path 
                          ? 'text-green-20 font-bold bg-gradient-to-r from-green-90 to-green-80' 
                          : 'text-green-30 hover:bg-green-90 hover:text-green-20'
                      }`}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        {item.path === '/find-pet' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        )}
                        {item.path === '/shelters' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        )}
                        {item.path === '/give-animal' && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        )}
                        {!item.path && (
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        )}
                      </svg>
                      <span className="relative w-fit font-inter font-semibold text-base tracking-wide">
                        {item.label}
                      </span>
                    </button>
                  ) : (
                    <button
                      onClick={() => handleNavButtonClick(item)}
                      className={`inline-flex items-center justify-start gap-3 relative w-full px-4 py-3.5 transition-all duration-200 ${
                        index < navigationItems.length - 1 ? 'border-b border-green-70' : ''
                      } text-green-30 hover:bg-green-90 hover:text-green-20`}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                      <span className="relative w-fit font-inter font-semibold text-base tracking-wide">
                        {item.label}
                      </span>
                    </button>
                  )}
                </div>
              ))}
            </div>
            <div className="border-t-2 border-green-50 my-2"></div>
            <div className="px-0 pb-2">
              {!isAuthenticated ? (
                <>
                  <div
                    onClick={() => {
                      handleScrollToTop();
                      if (location.pathname !== '/login') {
                        navigate('/login');
                      }
                      setIsMenuOpen(false);
                    }}
                    className={`inline-flex items-center justify-start gap-3 relative w-full px-4 py-3.5 transition-all duration-200 border-b border-green-70 cursor-pointer ${
                      location.pathname === '/login' 
                        ? 'text-green-20 font-bold bg-gradient-to-r from-green-90 to-green-80' 
                        : 'text-green-30 hover:bg-green-90 hover:text-green-20'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    <span className="relative w-fit font-inter font-semibold text-base tracking-wide">
                      Войти
                    </span>
                  </div>
                  <div
                    onClick={() => {
                      handleScrollToTop();
                      if (location.pathname !== '/register') {
                        navigate('/register');
                      }
                      setIsMenuOpen(false);
                    }}
                    className={`inline-flex items-center justify-start gap-3 relative w-full px-4 py-3.5 transition-all duration-200 cursor-pointer ${
                      location.pathname === '/register' 
                        ? 'text-green-20 font-bold bg-gradient-to-r from-green-90 to-green-80' 
                        : 'text-green-30 hover:bg-green-90 hover:text-green-20'
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                    </svg>
                    <span className="relative w-fit font-inter font-semibold text-base tracking-wide">
                      Зарегистрироваться
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="px-4 py-3.5 border-b-2 border-green-50 bg-gradient-to-r from-green-70 to-green-60 -mx-0 mb-2 rounded-t-custom-small">
                    <p className="text-green-98 font-bold text-base mb-0.5">{getUserDisplayName()}</p>
                    <p className="text-green-95 font-medium text-xs">{getUserRoleDisplay()}</p>
                  </div>
                  
                  {isAdmin ? (
                    <div
                      onClick={() => {
                        handleScrollToTop();
                        if (location.pathname !== '/profile') {
                          navigate('/profile');
                        }
                        setIsMenuOpen(false);
                      }}
                      className={`inline-flex items-center justify-start gap-3 relative w-full px-4 py-3.5 transition-all duration-200 border-b border-green-70 cursor-pointer ${
                        location.pathname === '/profile' 
                          ? 'text-green-20 font-bold bg-gradient-to-r from-green-90 to-green-80' 
                          : 'text-green-30 hover:bg-green-90 hover:text-green-20'
                      }`}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      <span className="relative w-fit font-inter font-semibold text-base tracking-wide">
                        {user?.role === 'admin' ? 'Админ панель' : 'Админ приюта'}
                      </span>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        handleScrollToTop();
                        if (location.pathname !== '/profile') {
                          navigate('/profile');
                        }
                        setIsMenuOpen(false);
                      }}
                      className={`inline-flex items-center justify-start gap-3 relative w-full px-4 py-3.5 transition-all duration-200 border-b border-green-70 cursor-pointer ${
                        location.pathname === '/profile' 
                          ? 'text-green-20 font-bold bg-gradient-to-r from-green-90 to-green-80' 
                          : 'text-green-30 hover:bg-green-90 hover:text-green-20'
                      }`}
                    >
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      <span className="relative w-fit font-inter font-semibold text-base tracking-wide">
                        Профиль
                      </span>
                    </div>
                  )}
                  
                  <button
                    onClick={handleLogout}
                    className="inline-flex items-center justify-start gap-3 relative w-full px-4 py-3.5 transition-all duration-200 hover:bg-red-50 hover:text-red-300 text-green-30"
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span className="relative w-fit font-inter font-semibold text-base tracking-wide">
                      Выйти
                    </span>
                  </button>
                </>
              )}
            </div>
          </nav>
        </div>

        <div className="flex items-center gap-4 md:gap-2 relative flex-shrink-0" ref={userMenuRef}>
          <div className="relative md:hidden">
            <button
              className="relative w-10 h-10 aspect-[1] cursor-pointer flex-shrink-0 hover:opacity-80 transition-opacity flex items-center justify-center"
              aria-label="Toggle menu"
              type="button"
              onClick={handleMobileMenuToggle}
            >
              <svg 
                className="w-6 h-6 text-green-30" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d={isMenuOpen 
                    ? "M6 18L18 6M6 6l12 12" 
                    : "M4 6h16M4 12h16M4 18h16"
                  } 
                />
              </svg>
            </button>
          </div>

          <div className="relative hidden md:block">
            <button
              className="relative flex items-center gap-2 cursor-pointer flex-shrink-0 transition-all duration-300 p-2 rounded-custom-small hover:bg-green-90"
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
                  <p className="text-green-30 font-inter font-medium text-sm">
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
                        if (location.pathname !== '/login') {
                          navigate('/login');
                        }
                        setIsUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-green-30 font-inter font-medium hover:bg-green-90 transition-all duration-300 cursor-pointer hover:pl-6"
                    >
                      Войти
                    </div>
                    <div
                      onClick={() => {
                        handleScrollToTop();
                        if (location.pathname !== '/register') {
                          navigate('/register');
                        }
                        setIsUserMenuOpen(false);
                      }}
                      className="block w-full text-left px-4 py-3 text-green-30 font-inter font-medium hover:bg-green-90 transition-colors border-t border-green-80 cursor-pointer"
                    >
                      Зарегистрироваться
                    </div>
                  </>
                ) : (
                  <>
                    <div className="px-4 py-3 bg-green-95 border-b border-green-80">
                      <p className="text-green-30 font-semibold text-sm">{getUserDisplayName()}</p>
                      <p className="text-green-40 text-xs">{getUserRoleDisplay()}</p>
                    </div>
                    
                    {isAdmin ? (
                      <div
                        onClick={() => {
                          handleScrollToTop();
                          if (location.pathname !== '/profile') {
                            navigate('/profile');
                          }
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-green-30 font-inter font-medium hover:bg-green-90 transition-all duration-300 cursor-pointer hover:pl-6"
                      >
                        <img
                          className="w-5 h-5 rounded-full object-cover"
                          alt=""
                          src={getProfilePhoto()}
                        />
                        {user?.role === 'admin' ? 'Админ панель' : 'Профиль'}
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          handleScrollToTop();
                          if (location.pathname !== '/profile') {
                            navigate('/profile');
                          }
                          setIsUserMenuOpen(false);
                        }}
                        className="flex items-center gap-3 px-4 py-3 text-green-30 font-inter font-medium hover:bg-green-90 transition-all duration-300 cursor-pointer hover:pl-6"
                      >
                        <img
                          className="w-5 h-5 rounded-full object-cover"
                          alt=""
                          src={getProfilePhoto()}
                        />
                        Профиль
                      </div>
                    )}
                    
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full text-left px-4 py-3 text-green-30 font-inter font-medium hover:bg-green-90 transition-all duration-300 border-t border-green-80 hover:pl-6"
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
        </div>
      </header>

      <HelpSection 
        isOpen={isHelpModalOpen} 
        onClose={closeHelpModal} 
      />
    </>
  );
};

export default Header;
