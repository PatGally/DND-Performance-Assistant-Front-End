import React from 'react';
import '../../css/LandingPage.css';

/**
 * LandingPagePA
 * -------------
 * First page the user sees after logging in. Intentionally simple for alpha
 * testing — a welcome header, a short intro paragraph, a small row of info
 * cards, and a primary CTA.
 *
 * Text is all lorem ipsum placeholders — swap in real copy when ready.
 * Uses the same `pa-` class prefix and BEM-ish naming as HomePagePA so the
 * two can share a design language and CSS conventions.
 */
const LandingPage: React.FC = () => {
    const infoCards = [
        {
            id: 'c1',
            title: 'Interactive Mapping System',
            body: 'Run encounters on a grid-based map using your own images. Click, move, and position creatures.',
        },
        {
            id: 'c2',
            title: 'Performance Assistant',
            body: 'Get real-time action recommendations based on success chance, damage, and overall impact. The Performance Assistant helps you make smarter decisions every turn and improves with use.',
        },
        {
            id: 'c2',
            title: 'Built-In Rules Engine',
            body: 'Automatically enforces Dungeons & Dragons 5th Edition (2014) rules, including action economy, spell slots, and movement limits—so you can focus on gameplay, not rule-checking.',
        },
        {
            id: 'c3',
            title: 'Manual Mode Control',
            body: 'Override the system at any time. Adjust stats, positioning, and effects freely for full control over your encounter.',
        }
    ];

    return (
        <div className="pa-landing">
            <div className="pa-landing__inner">
                <div className="pa-landing__badge">ALPHA</div>
                <header className="pa-landing__header">
                    <h1 className="pa-landing__headline">
                        Welcome to DNDPA
                    </h1>
                    <p className="pa-landing__subtitle">
                        DNDPA is a real-time encounter management tool designed for Dungeons & Dragons 5e (2014).
                        Manage initiative, track combat, and receive intelligent action recommendations—all in one place.
                    </p>
                </header>

                <section className="pa-landing__cards" aria-label="Overview">
                    {infoCards.map((card) => (
                        <article key={card.id} className="pa-landing__card">
                            <h2 className="pa-landing__card-title">{card.title}</h2>
                            <p className="pa-landing__card-body">{card.body}</p>
                        </article>
                    ))}
                </section>
            </div>
        </div>
    );
};

export default LandingPage;