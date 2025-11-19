    // src/hooks/useNavigation.js
    import { useNavigate, useLocation } from 'react-router-dom';
    import { useCallback } from 'react';

    export const useNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navigateTo = useCallback((path) => {
        if (location.pathname === path) {
        // Если это текущая страница - прокручиваем вверх и принудительно обновляем URL
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
        
        // Принудительно обновляем историю с временным параметром
        const timestamp = Date.now();
        const newUrl = `${path}?_scroll=${timestamp}`;
        window.history.replaceState({}, '', newUrl);
        
        // Вызываем событие чтобы ScrollToTop сработал
        window.dispatchEvent(new PopStateEvent('popstate'));
        } else {
        // Если другая страница - переходим
        navigate(path);
        }
    }, [navigate, location.pathname]);

    return navigateTo;
    };