import React, { useState } from 'react';
import {NavLink} from "react-router-dom";
import { CaretRightFill } from 'react-bootstrap-icons';

interface HeroSlide {
    id: string;
    backgroundImage: string;
    titleImage?: string;
    headline: string;
    description: string;
    ctaLabel: string;
}


const HeroCarousel: React.FC = () => {
    const slides: HeroSlide[] = [
        {
            id: 'slide-1',
            backgroundImage: '/placeholder-hero-1.jpg',
            titleImage: '/placeholder-title-1.png',
            headline: 'WELCOME TO DNDPA!',
            description:
                'Take the guesswork out of every turn with DNDPA’s real-time ' +
                'action recommendations, designed to help you make smarter decisions instantly. ' +
                'Streamline encounter management and focus on what matters... TPKs.',
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

                <h1 className="pa-hero__headline">{active.headline}</h1>
                <p className="pa-hero__description">{active.description}</p>

                <p className="pa-hero__cta">
                    <span className="pa-hero__cta-arrow" aria-hidden="true"> <CaretRightFill size="25px"/>  </span>
                    <NavLink type="button" className="pa-hero__cta-label" to="/sign-up">{active.ctaLabel}</NavLink>
                </p>

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