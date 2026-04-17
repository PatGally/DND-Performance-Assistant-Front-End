import React, { useEffect, useState } from 'react';
import NavBar from '../components/homeComponents/NavBar';
import HeroCarousel from '../components/homeComponents/HeroCarousel';
// import PASection from '../components/homeComponents/PASection.tsx';
// import HowToUseHome from './homeComponents/HowToUseHome.tsx';
// import OpenSource from './homeComponents/OpenSource.tsx';
import AboutUs from '../components/homeComponents/AboutUs.tsx';
import SiteFooter from '../components/homeComponents/SiteFooter';
import './HomePagePA.css';

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
                {/*<PASection />*/}
                {/*<HowToUseHome />*/}
                {/*<OpenSource />*/}
                <AboutUs />
            </main>

            <SiteFooter />
        </div>
    );
};

export default HomePagePA;