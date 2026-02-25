import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from "react-bootstrap/Container";
function EncounterCreationNav(){
    return (
        <Container>
            <Row className="justify-content-center">
                <Col className="text-center">Enter Name</Col>
                <Col className="text-center">Add Characters</Col>
                <Col className="text-center">Add Monsters</Col>
                <Col className="text-center">Map Link</Col>
                <Col className="text-center">Grid Size</Col>
            </Row>

        </Container>
    )
}

export default EncounterCreationNav;