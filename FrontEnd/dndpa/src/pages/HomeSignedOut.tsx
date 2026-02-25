import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import NavBarSignedOut from "../components/nav/NavBarSignedOut.tsx";

function homeSignedOut(){
    return (
        <>
        <Container>
            <Row>
                <Col> <NavBarSignedOut /> </Col>
            </Row>
        </Container>
        </>
    );
}

export default homeSignedOut;