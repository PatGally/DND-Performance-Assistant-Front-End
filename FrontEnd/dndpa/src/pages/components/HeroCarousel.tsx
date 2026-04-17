import React, { useState } from 'react';
import {NavLink} from "react-router-dom";

interface HeroSlide {
    id: string;
    /** Background image URL — swap in your own */
    backgroundImage: string;
    /** Optional logo/title image shown above the headline */
    titleImage?: string;
    headline: string;
    description: string;
    ctaLabel: string;
}

/**
 * HeroCarousel
 * ------------
 * Full-viewport-height hero with rotating slides. Each slide has:
 *   - a large background image
 *   - an optional "title image" (logo art) above the headline
 *   - a headline, description, and primary CTA
 *
 * Pagination dots at the bottom let the user jump between slides. Content
 * is anchored to the left side of the viewport with a subtle dark overlay
 * to keep text readable against busy artwork.
 *
 * Slides are defined inline as sample data — replace `slides` with own
 * array (or lift it to props if want to drive this from a CMS).
 */
const HeroCarousel: React.FC = () => {
    // Placeholder slides — swap backgroundImage / titleImage with real assets
    const slides: HeroSlide[] = [
        {
            id: 'slide-1',
            backgroundImage: '/placeholder-hero-1.jpg',
            titleImage: '/placeholder-title-1.png',
            headline: 'WELCOME TO DNDPA!',
            description:
                'Take the guesswork out of every turn with DNDPA’s real-time ' +
                'action recommendations, designed to help you make smarter decisions instantly. Streamline ' +
                'encounter management and focus on the game—sign in to start running faster, smoother D&D combat.',
            ctaLabel: 'Get Started Now!',
        },
    ];

    const [activeIndex, setActiveIndex] = useState<number>(0);
    const active = slides[activeIndex];

    return (
        <section className="pa-hero" aria-label="Featured content">
            <div
                className="pa-hero__bg"
                style={{ backgroundImage: `url(${active.backgroundImage})` }}
                role="img"
                aria-label="Hero background"
            />
            <div className="pa-hero__overlay" />

            <div className="pa-hero__content">
                {/*{active.titleImage && (*/}
                {/*    <div className="pa-hero__title-image">*/}
                {/*        <div className="pa-hero__title-image-placeholder">TITLE ART</div>*/}
                {/*    </div>*/}
                {/*)}*/}

                <h1 className="pa-hero__headline">{active.headline}</h1>
                <p className="pa-hero__description">{active.description}</p>

                <p className="pa-hero__cta">
                    <span className="pa-hero__cta-arrow" aria-hidden="true">→</span>
                    <NavLink type="button" className="pa-hero__cta-label" to="/sign-up">{active.ctaLabel}</NavLink>
                </p>

                {/*</a>*/}
            </div>

            <div className="pa-hero__pagination" role="tablist" aria-label="Slide navigation">
                {slides.map((slide, idx) => (
                    <button
                        key={slide.id}
                        type="button"
                        role="tab"
                        aria-selected={idx === activeIndex}
                        aria-label={`Go to slide ${idx + 1}`}
                        className={`pa-hero__dot ${idx === activeIndex ? 'pa-hero__dot--active' : ''}`}
                        onClick={() => setActiveIndex(idx)}
                    />
                ))}
            </div>
        </section>
    );
};

export default HeroCarousel;