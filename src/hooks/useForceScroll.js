    // src/hooks/useForceScroll.js
    import { useCallback } from 'react';

    export const useForceScroll = () => {
    const forceScrollToTop = useCallback(() => {
        // Просто прокручиваем вверх без всяких проверок
        window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
        });
    }, []);

    return forceScrollToTop;
    };