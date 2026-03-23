import { useRef } from 'react';
import './Spotlight.css';

interface SpotlightCardProps extends React.PropsWithChildren {
    className?: string;
    spotlightColor?: `rgba(${number}, ${number}, ${number}, ${number})`;
    style?: React.CSSProperties;
}

const SpotlightCard: React.FC<SpotlightCardProps> = ({
                                                         children,
                                                         className = '',
                                                         spotlightColor = 'rgba(255, 255, 255, 0.25)',
                                                         style = {}
                                                     }) => {
    const divRef = useRef<HTMLDivElement>(null);

    const handleMouseMove: React.MouseEventHandler<HTMLDivElement> = (e) => {
        if (!divRef.current) return;
        const rect = divRef.current.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        divRef.current.style.setProperty('--mouse-x', `${x}px`);
        divRef.current.style.setProperty('--mouse-y', `${y}px`);
        divRef.current.style.setProperty('--spotlight-color', spotlightColor);
    };

    return (
        <div
            ref={divRef}
            onMouseMove={handleMouseMove}
            className={`card-spotlight ${className}`}
            style={style}
        >
            {children}
        </div>
    );
};

export default SpotlightCard;

// This is how you use the code
// <SpotlightCard
//     className="bg-dark text-white px-3"
//     spotlightColor="rgba(255, 255, 255, 0.15)"
//     style={{ position: 'sticky', top: 0, zIndex: 1 }}
// ></SpotlightCard>