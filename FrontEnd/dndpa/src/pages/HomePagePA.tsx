import React, { useEffect, useState } from 'react';
import NavBar from '../components/HomePage-Components/NavBar';
import HeroCarousel from '../components/HomePage-Components/HeroCarousel';
import PASection from '../components/HomePage-Components/PASection.tsx';


// import HowToUseHome from './HomePage-Components/HowToUseHome.tsx';
// import OpenSource from './HomePage-Components/OpenSource.tsx';
import AboutUs from '../components/HomePage-Components/AboutUs.tsx';
import SiteFooter from '../components/HomePage-Components/SiteFooter';
import '../css/HomePagePA.css';

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
                {/*<HowToUseHome />*/}
                {/*<OpenSource />*/}
                <AboutUs />
            </main>

            <SiteFooter />
        </div>
    );
};

export default HomePagePA;