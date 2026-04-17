import React from 'react';
import {NavLink} from "react-router-dom";
import d20 from "../../assets/d20.png";
interface NavBarProps {
    /** When true, the nav gets a solid background instead of transparent */
    isScrolled: boolean;
}
// TODO remove pa-nav__logo-placeholder from css styles
/**
 * NavBar
 * ------
 * Sticky top navigation. Renders transparent over the hero and switches to a
 * solid dark bar once scrolled. The left side holds the brand mark and a
 * secondary badge plus primary links; the right side holds a locale picker,
 * search, and a sign-in CTA.
 *
 * Replace the logo and badge <div> placeholders with your own <img> tags.
 */
const NavBar: React.FC<NavBarProps> = ({ isScrolled }) => {
    return (
        <header className={`pa-nav ${isScrolled ? 'pa-nav--solid' : 'pa-nav--transparent'}`}>
            <div className="pa-nav__inner">
                <div className="pa-nav__left">
                    <img src={d20} alt="D20 Logo" style={{ height: "40px" }}/>

                    <nav className="pa-nav__links" aria-label="Primary">
                        {/*<a href="#about" className="pa-nav__link">WHO WE ARE</a>*/}
                    </nav>
                </div>

                <div className="pa-nav__right">
                    <NavLink type="button" className="pa-nav__signin" to="/sign-in">Sign In</NavLink>
                </div>
            </div>
        </header>
    );
};

export default NavBar;