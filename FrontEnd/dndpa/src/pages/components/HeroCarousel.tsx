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
    // ctaHref: string;
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
            headline: 'Lorem Ipsum Dolor Sit Amet',
            description:
                'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam.',
            ctaLabel: 'Get Started Now!',
            // ctaHref: '#play',
        },
        {
            id: 'slide-2',
            backgroundImage: '/placeholder-hero-2.jpg',
            titleImage: '/placeholder-title-2.png',
            headline: 'Lorem Ipsum Consectetur',
            description:
                'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident.',
            ctaLabel: 'Learn More',
            // ctaHref: '#learn',
        },
    ];

    const [activeIndex, setActiveIndex] = useState<number>(0);
    const active = slides[activeIndex];

    return (
        <section className="pa-hero" aria-label="Featured content">
            {/* Background image — replace src with your asset */}
            <div
                className="pa-hero__bg"
                style={{ backgroundImage: `url(${active.backgroundImage})` }}
                role="img"
                aria-label="Hero background"
            />
            {/* Subtle gradient so left-aligned text stays legible */}
            <div className="pa-hero__overlay" />

            <div className="pa-hero__content">
                {active.titleImage && (
                    <div className="pa-hero__title-image">
                        {/* Replace with <img src={active.titleImage} alt="" /> */}
                        <div className="pa-hero__title-image-placeholder">TITLE ART</div>
                    </div>
                )}

                <h1 className="pa-hero__headline">{active.headline}</h1>
                <p className="pa-hero__description">{active.description}</p>

                <p className="pa-hero__cta">
                    <span className="pa-hero__cta-arrow" aria-hidden="true">→</span>
                    <NavLink type="button" className="pa-hero__cta-label" to="/sign-up">{active.ctaLabel}</NavLink>
                </p>

                {/*</a>*/}
            </div>

            {/* Pagination dots */}
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