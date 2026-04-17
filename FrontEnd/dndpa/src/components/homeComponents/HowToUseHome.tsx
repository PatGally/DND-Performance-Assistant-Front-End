import React from 'react';

interface GameCard {
    id: string;
    /** Portrait key-art image for the card */
    image: string;
    /** Platform icons (e.g. mobile, windows, apple) — pass any strings you want */
    platforms: string[];
}

/**
 * HowToUseHome
 * ------------
 * A row of portrait cards. Cards on the sides are slightly tilted and
 * scaled down; the middle card is upright and larger, creating a fan-like
 * "hero" emphasis. Platform badges sit in the bottom-right of each card.
 *
 * The tilt effect is handled in CSS via `:nth-child` selectors so you only
 * need to feed an array of cards in.
 */
const HowToUseHome: React.FC = () => {
    const games: GameCard[] = [
        { id: 'g1', image: '/placeholder-game-1.jpg', platforms: ['mobile'] },
        { id: 'g2', image: '/placeholder-game-2.jpg', platforms: ['windows', 'mobile'] },
        { id: 'g3', image: '/placeholder-game-3.jpg', platforms: ['windows', 'playstation', 'xbox'] },
        { id: 'g4', image: '/placeholder-game-4.jpg', platforms: ['mobile'] },
        { id: 'g5', image: '/placeholder-game-5.jpg', platforms: ['windows', 'apple'] },
    ];

    return (
        <section className="pa-games" aria-labelledby="games-heading">
            <div className="pa-games__header">
                <h2 id="games-heading" className="pa-section-title">How To Use</h2>
            </div>

            <div className="pa-games__row">
                {games.map((game) => (
                    <article key={game.id} className="pa-games__card">
                        <a href={`#game-${game.id}`} className="pa-games__card-link">
                            {/* Replace inner div with <img src={game.image} alt="" /> */}
                            <div
                                className="pa-games__card-image"
                                style={{ backgroundImage: `url(${game.image})` }}
                                role="img"
                                aria-label="Game key art"
                            />
                            <div className="pa-games__card-platforms">
                                {game.platforms.map((p) => (
                                    <span key={p} className="pa-games__platform" aria-label={p}>
                    {/* Replace with real platform icon */}
                                        <span className="pa-games__platform-placeholder" />
                  </span>
                                ))}
                            </div>
                        </a>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default HowToUseHome;