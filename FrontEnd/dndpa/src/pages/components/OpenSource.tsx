import React, { useRef } from 'react';

interface OpenSourceCard {
    id: string;
    image: string;
    alt: string;
    title: string;
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

    const cards: OpenSourceCard[] = [
        { id: 'e1', image: '/placeholder-open-1.jpg', alt: 'open card 1', title: 'hello' },
        { id: 'e2', image: '/placeholder-open-2.jpg', alt: 'open card 2', title: 'hello' },
        { id: 'e3', image: '/placeholder-open-3.jpg', alt: 'open card 3', title: 'hello' },
        { id: 'e4', image: '/placeholder-open-4.jpg', alt: 'open card 4', title: 'hello' },
        { id: 'e5', image: '/placeholder-open-5.jpg', alt: 'open card 5', title: 'hello' },
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
        <section className="pa-open" aria-labelledby="OpenSource-heading">
            <div className="pa-open__header">
                <h2 id="OpenSource-heading" className="pa-section-title"> We Are Open Source! </h2>
                <div className="pa-esports__controls">
                    <button
                        type="button"
                        className="pa-open__arrow "
                        aria-label="Scroll left"
                        onClick={() => scroll('left')}
                    >
                        ←
                    </button>
                    <div className="pa-esports__divider" aria-hidden="true" />
                    <button
                        type="button"
                        className="pa-open__arrow"
                        aria-label="Scroll right"
                        onClick={() => scroll('right')}
                    >
                        →
                    </button>
                </div>
            </div>

            <div className="pa-open__scroller" ref={scrollRef}>
                {cards.map((card) => (


                    <article key={card.id} className="pa-esports__card">
                        <div className="text-dark bg-light">{card.title}</div>
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