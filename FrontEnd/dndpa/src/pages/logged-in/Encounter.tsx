
// encounter map will be here
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";

function Encounter() {
    return(
        <Container fluid className="min-vh-100 d-flex flex-column">
            <Row>
                <Col lg={2} className="text-center bg-success-subtle text-success-emphasis">
                    C1
                    <div>Logo</div>
                    <div>User Icon</div>
                </Col>
                <Col lg={10} className=" bg-info-subtle text-info-emphasis">
                    DASHBOARD
                </Col>
            </Row>
            <Row>
                <Col lg={2} className="text-center bg-info-subtle text-info-emphasis">C3 nothing in here maybe</Col>
                <Col lg={10} className="text-center bg-success-subtle text-info-emphasis"> C4 User Options</Col>
            </Row>
            <Row className="flex-grow-1">
                <Col lg={2} className="text-center bg-success-subtle text-info-emphasis">
                    C5 main navigation goes here

                </Col>
                <Col lg={10} className="text-center bg-info-subtle text-info-emphasis">
                    C6 main page components go here

                </Col>
            </Row>
            <Row>
                <Col className="text-center bg-danger-subtle text-info-emphasis">C7 Footer </Col>
            </Row>
        </Container>
    )
}
export default Encounter;