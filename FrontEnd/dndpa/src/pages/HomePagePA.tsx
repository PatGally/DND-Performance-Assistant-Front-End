import React, { useEffect, useState } from 'react';
import NavBar from './components/NavBar';
import HeroCarousel from './components/HeroCarousel';
import PASection from './components/PASection.tsx';
import HowToUseHome from './components/HowToUseHome.tsx';
import OpenSource from './components/OpenSource.tsx';
import AboutUs from './components/AboutUs.tsx';
import SiteFooter from './components/SiteFooter';
import './HomePagePA.css';

/**
 * HomePagePA
 * ----------
 * Top-level page composition. Each section is an isolated component so the
 * template can be rearranged, swapped, or extended easily.
 *
 * The nav bar is fixed/sticky and switches from transparent to solid once
 * the user scrolls past the hero. That scroll state lives here so it can be
 * passed down as a prop rather than duplicated in every child.
 */
const HomePagePA: React.FC = () => {
    const [isScrolled, setIsScrolled] = useState<boolean>(false);

    useEffect(() => {
        const handleScroll = (): void => {
            // Trigger the solid nav a little before leaving the hero for a smooth handoff
            setIsScrolled(window.scrollY > 80);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="pa-page">
            <NavBar isScrolled={isScrolled} />

            <main className="pa-main">
                <HeroCarousel />
                <PASection />
                <HowToUseHome />
                <OpenSource />
                <AboutUs />
            </main>

            <SiteFooter />
        </div>
    );
};

export default HomePagePA;