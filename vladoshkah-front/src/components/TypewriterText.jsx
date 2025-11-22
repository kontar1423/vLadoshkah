    import React, { useState, useEffect } from 'react';

    const TypewriterText = ({ text, speed = 50 }) => {
    const [displayedText, setDisplayedText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (currentIndex < text.length) {
        const timer = setTimeout(() => {
            setDisplayedText(prev => prev + text[currentIndex]);
            setCurrentIndex(prev => prev + 1);
        }, speed);

        return () => clearTimeout(timer);
        }
    }, [currentIndex, text, speed]);

    return <span>{displayedText}</span>;
    };

    export default TypewriterText;