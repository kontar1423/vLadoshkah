
    import React, { useState, useEffect } from 'react';

    const ArcLetterByLetter = ({ text, delay = 30, className = '' }) => {
    const [revealedCount, setRevealedCount] = useState(0);
    const chars = text.split('');
    const total = chars.length;

    useEffect(() => {
        if (revealedCount >= total) return;
        const timer = setTimeout(() => {
        setRevealedCount((prev) => Math.min(prev + 1, total));
        }, delay);
        return () => clearTimeout(timer);
    }, [revealedCount, total, delay]);

    const arcDegrees = 180; 
    const radius = 460;     

    return (
        <div
        className={`relative ${className}`}
        style={{
            height: `${radius * 2.7}px`,
            display: 'block',
            width: '100%',
            pointerEvents: 'none',
        }}
        >
        {chars.map((char, i) => {
            const progress = total > 1 ? i / (total - 1) : 0;
            const angleDeg = -arcDegrees / 2 + progress * arcDegrees;
            const angleRad = (angleDeg * Math.PI) / 180;

            const x = 50 + 52 * Math.sin(angleRad); 
            const y = 33 - 32 * Math.cos(angleRad); 

            return (
            <span
                key={i}
                className="absolute text-center"
                style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) rotate(${angleDeg}deg)`,
                transformOrigin: 'center',
                whiteSpace: 'pre',
                opacity: i < revealedCount ? 1 : 0,
                transition: `opacity ${delay}ms ease-out`,
                fontSize: 'inherit',
                fontWeight: 'inherit',
                color: 'inherit',
                fontFamily: 'inherit',
                }}
            >
                {char === ' ' ? '\u00A0' : char}
            </span>
            );
        })}
        </div>
    );
    };

    export default ArcLetterByLetter;