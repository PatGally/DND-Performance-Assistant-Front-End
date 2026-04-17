import React, { useRef } from 'react';

interface EsportsCard {
    id: string;
    image: string;
    alt: string;
}

/**
 * OpenSource
 * --------------
 * Horizontal scrollable row of landscape cards with left/right arrow controls
 * in the top-right. Uses native `scrollBy` with `behavior: smooth` — no
 * extra libraries required.
 *
 * The number of visible cards adjusts with viewport width via CSS; on small
 * screens the row scrolls on touch.
 */
const OpenSource: React.FC = () => {
    const scrollRef = useRef<HTMLDivElement | null>(null);

    const cards: EsportsCard[] = [
        { id: 'e1', image: '/placeholder-esports-1.jpg', alt: 'Esports card 1' },
        { id: 'e2', image: '/placeholder-esports-2.jpg', alt: 'Esports card 2' },
        { id: 'e3', image: '/placeholder-esports-3.jpg', alt: 'Esports card 3' },
        { id: 'e4', image: '/placeholder-esports-4.jpg', alt: 'Esports card 4' },
        { id: 'e5', image: '/placeholder-esports-5.jpg', alt: 'Esports card 5' },
    ];

    const scroll = (direction: 'left' | 'right'): void => {
        const node = scrollRef.current;
        if (!node) return;
        // Scroll by roughly one card width
        const amount = node.clientWidth * 0.6;
        node.scrollBy({
            left: direction === 'left' ? -amount : amount,
            behavior: 'smooth',
        });
    };

    return (
        <section className="pa-esports" aria-labelledby="esports-heading">
            <div className="pa-esports__header">
                <h2 id="esports-heading" className="pa-section-title"> We Are Open Source! </h2>
                <div className="pa-esports__controls">
                    <button
                        type="button"
                        className="pa-esports__arrow"
                        aria-label="Scroll left"
                        onClick={() => scroll('left')}
                    >
                        ←
                    </button>
                    <div className="pa-esports__divider" aria-hidden="true" />
                    <button
                        type="button"
                        className="pa-esports__arrow"
                        aria-label="Scroll right"
                        onClick={() => scroll('right')}
                    >
                        →
                    </button>
                </div>
            </div>

            <div className="pa-esports__scroller" ref={scrollRef}>
                {cards.map((card) => (
                    <article key={card.id} className="pa-esports__card">
                        {/* Replace inner div with <img src={card.image} alt={card.alt} /> */}
                        <div
                            className="pa-esports__card-image"
                            style={{ backgroundImage: `url(${card.image})` }}
                            role="img"
                            aria-label={card.alt}
                        />
                    </article>
                ))}
            </div>
        </section>
    );
};

export default OpenSource;