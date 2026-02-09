import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import NavigationSignedIn from '../../components/nav/NavigationSignedIn';

import { useState } from 'react';
import CharacterCreation from "../../components/Home-Dashboard/CharacterCreation.tsx";
//Note you have not accounted much for change when screen size changes yet
//xs, sm, md, lg, xl and xxl
function HomeDashboard(){
    const [activePage, setActivePage] = useState('Home');
    return(
        <Container fluid className="min-vh-100 d-flex flex-column" >
                <Row >
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
                    {/*C5 main navigation goes here*/}
                    <NavigationSignedIn setActivePage={setActivePage} />
                </Col>
                <Col lg={10} className="text-center bg-info-subtle text-info-emphasis">
                    C6 main page components go here
                    {activePage === 'SAVED_ENCOUNTERS' && <div>Saved Encounters - with + for encounter creation</div>}
                    {activePage === 'LOAD_CHARACTERS' && <div>Load Characters</div>}
                    {activePage === 'CREATE_CHARACTER' && <CharacterCreation />}
                    {activePage === 'HOW_TO_USE' && <div>How To Use </div>}
                </Col>
            </Row>

            <Row>
                <Col className="text-center bg-danger-subtle text-info-emphasis">C7 Footer </Col>
            </Row>


        </Container>
    )
}

export default HomeDashboard;