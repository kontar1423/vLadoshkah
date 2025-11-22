    import { useNavigate, useLocation } from 'react-router-dom';
    import { useCallback } from 'react';

    export const useNavigation = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navigateTo = useCallback((path) => {
        if (location.pathname === path) {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: 'smooth'
        });
        
        const timestamp = Date.now();
        const newUrl = `${path}?_scroll=${timestamp}`;
        window.history.replaceState({}, '', newUrl);
        
        window.dispatchEvent(new PopStateEvent('popstate'));
        } else {
        navigate(path);
        }
    }, [navigate, location.pathname]);

    return navigateTo;
    };