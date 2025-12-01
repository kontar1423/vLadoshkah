    import { useCallback } from 'react';

    export const useForceScroll = () => {
    const forceScrollToTop = useCallback(() => {
        window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'smooth'
        });
    }, []);

    return forceScrollToTop;
    };