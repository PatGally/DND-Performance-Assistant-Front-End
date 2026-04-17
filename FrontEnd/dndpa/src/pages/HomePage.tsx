import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {Link, NavLink} from "react-router-dom";
import logo from '../components/nav/logo1.png'
import HomePageUI1 from "../components/ComplexUI/Homepageui1";
import HomePageUI2 from "../components/ComplexUI/Homepageui2";

import LogoLoop from '../components/ComplexUI/LogoLoop';
import { SiReact, SiNextdotjs, SiTypescript } from 'react-icons/si';


//TODO Give me logos and Products we used to make this project possible like CloudFlare or Docker
// Whatever we would like to be public with
const techLogos = [
    { node: <SiReact />, title: "React", href: "https://react.dev" },
    { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
    { node: <SiTypescript />, title: "TypeScript", href: "https://www.typescriptlang.org" },
];
//TODO this component is the main component of page - first thing users see
// Should be a call to action for users to sign up for DNDPA
// Brief to the point description of PA assistant
// Should have a panel that is cut at the edges
// cool open source image in the background with panel blurring it
// Show a cool monster at right side or the ORB that we have to describe the PA being an entity

function homePage(){
    return (
        <Container fluid className="container-fluid bg-dark">
            <Row style={{position: "sticky", top: 0, zIndex: 1000 }}>
                <nav className="navbar navbar-dark bg-dark"  >
                    <div className="container-fluid m-1" >
                        <Link className="navbar-brand" to="/">
                            <img
                                src={logo}
                                alt="Company Logo"
                                style={{ height: "40px" }}
                            />
                        </Link>
                        <div className="navbar-nav ms-auto flex-row">
                            <NavLink type="button" className="btn text-light" to="/sign-in">Sign In</NavLink>
                            <NavLink type="button" className="btn btn-danger" to="/sign-up">Sign Up</NavLink>
                        </div>
                    </div>
                </nav>
            </Row>
            <Row>
                {/*<img*/}
                {/*    src={bg_UI1}*/}
                {/*    alt="Company Background"*/}
                {/*    className="img-fluid p-0"*/}
                {/*/>*/}
                {/*<HomePageUI1 />*/}
                <HomePageUI1 />
                <HomePageUI2 />
            </Row>
            <Row>
                <div style={{ height: '200px', position: 'relative', overflow: 'hidden'}}>
                    <LogoLoop
                        logos={techLogos}
                        speed={100}
                        direction="left"
                        logoHeight={60}
                        gap={60}
                        hoverSpeed={0}
                        fadeOut
                    />
                </div>
            </Row>
            <Container>
                <Row><Col> Development Server </Col></Row>
            </Container>
        </Container>
    );
}

export default homePage;