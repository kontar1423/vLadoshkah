import React from 'react';

    const ArcText = ({ text, className = '' }) => {
    const chars = text.split('');
    const total = chars.length;
    const radius = 180;

    return (
        <div className={`relative ${className}`} style={{ height: `${radius * 2}px` }}>
        {chars.map((char, i) => {
            const progress = total > 1 ? (i / (total - 1)) : 0;
            const angleDeg = -arcDegrees / 2 + progress * arcDegrees;
            const angleRad = (angleDeg * Math.PI) / 180;

            const x = radius + radius * Math.sin(angleRad);
            const y = radius - radius * Math.cos(angleRad); 

            const rotate = angleDeg;

            return (
            <span
                key={i}
                className="absolute text-center opacity-100"
                style={{
                left: `${x}px`,
                top: `${y}px`,
                transform: `translate(-50%, -50%) rotate(${rotate}deg)`,
                transformOrigin: 'center',
                whiteSpace: 'pre',
                fontSize: 'inherit',
                fontWeight: 'inherit',
                color: 'inherit',
                }}
            >
                {char === ' ' ? '\u00A0' : char}
            </span>
            );
        })}
        </div>
    );
    };

    export default ArcText;