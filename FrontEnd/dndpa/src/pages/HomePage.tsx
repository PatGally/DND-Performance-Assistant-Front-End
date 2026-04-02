import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {Link, NavLink} from "react-router-dom";
import logo from '../components/nav/logo1.png'
import HomePageUI1 from "../components/ComplexUI/Homepageui1.tsx";
import HomePageUI2 from "../components/ComplexUI/Homepageui2.tsx";

import LogoLoop from '../components/ComplexUI/LogoLoop.tsx';
import { SiReact, SiNextdotjs, SiTypescript } from 'react-icons/si';

import bg_UI1 from '../assets/bg_UI1.png'

//TODO Give me logos and Products we used to make this project possible like CloudFlare or Docker
// Whatever we would like to be public with
const techLogos = [
    { node: <SiReact />, title: "React", href: "https://react.dev" },
    { node: <SiNextdotjs />, title: "Next.js", href: "https://nextjs.org" },
    { node: <SiTypescript />, title: "TypeScript", href: "https://www.typescriptlang.org" },
];

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
                <img
                    src={bg_UI1}
                    alt="Company Background"
                    className="img-fluid p-0"
                />
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
            <Row>
                <Col className='text-start p-0'>
                    <HomePageUI2 />
                </Col>
                <Col className='text-end p-0'>
                    <HomePageUI2 />
                </Col>
            </Row>
        </Container>
    );
}

export default homePage;