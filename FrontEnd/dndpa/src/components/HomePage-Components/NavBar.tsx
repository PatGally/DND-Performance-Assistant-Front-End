import React from 'react';
import {NavLink} from "react-router-dom";
import d20 from "../../assets/d20.png";
interface NavBarProps {
    isScrolled: boolean;
}

const NavBar: React.FC<NavBarProps> = ({ isScrolled }) => {
    return (
        <header className={`pa-nav ${isScrolled ? 'pa-nav--solid' : 'pa-nav--transparent'}`}>
            <div className="pa-nav__inner">
                <div className="pa-nav__left">
                    <img src={d20} alt="D20 Logo" style={{ height: "40px" }}/>

                    <nav className="pa-nav__links" aria-label="Primary">
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