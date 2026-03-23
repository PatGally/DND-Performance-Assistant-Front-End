import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import {Link, NavLink} from "react-router-dom";
import logo from '../components/nav/logo1.png'

function homePage(){
    return (
        <>
            <nav className="navbar navbar-dark bg-dark">
                <div className="container-fluid m-1">
                    <Link className="navbar-brand" to="/">
                        <img
                            src={logo}
                            alt="Company Logo"
                            style={{ height: "40px" }}
                        />
                    </Link>
                    <div className="navbar-nav ms-auto flex-row">
                        <NavLink type="button" className="btn text-light" to="/sign-in">Sign In</NavLink>
                        <NavLink type="button" className="btn btn-outline-light" to="/sign-up">Sign Up</NavLink>
                    </div>
                </div>
            </nav>
            <Container>
                <Row><Col> My content goes here </Col></Row>
            </Container>
        </>
    );
}

export default homePage;