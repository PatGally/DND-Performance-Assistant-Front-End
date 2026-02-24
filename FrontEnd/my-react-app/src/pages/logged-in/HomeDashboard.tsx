import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import NavigationSignedIn from '../../components/nav/NavigationSignedIn';
import LoadCharacter from "../../components/Home-Dashboard/LoadCharacter.tsx";
import EncounterView from "../../components/Home-Dashboard/EncounterView";

import { useState } from 'react';
import CharCreation from "../../components/Home-Dashboard/CharCreation.tsx";
import {PersonCircle} from "react-bootstrap-icons";

function HomeDashboard(){
    const [activePage, setActivePage] = useState('SAVED_ENCOUNTERS');
    return(
        <Container fluid className="min-vh-100 d-flex flex-column" >
                <Row >
                    <Col lg={2} className="text-center bg-dark bg-gradient text-light">
                        <div>Logo</div>
                        <div className="p-3"><PersonCircle
                            size={35}
                            title="User"
                        /></div>
                    </Col>
                    <Col lg={10} className=" bg-dark bg-gradient text-light">
                        <h1>DASHBOARD</h1>
                    </Col>
                </Row>
            <Row>
                <Col lg={2} className="text-center bg-dark text-light"></Col>
                <Col lg={10} className="text-center bg-dark text-light">
                    {activePage === 'SAVED_ENCOUNTERS'}
                </Col>
            </Row>
            <Row className="flex-grow-1">
                <Col lg={2} className="text-center m-0 p-0">
                    {/*C5 main navigation goes here*/}
                    <NavigationSignedIn setActivePage={setActivePage} />
                </Col>
                <Col lg={10} className="bg-dark text-light">
                    {activePage === 'SAVED_ENCOUNTERS' && <EncounterView/>}
                    {activePage === 'LOAD_CHARACTERS' && <LoadCharacter/>}
                    {activePage === 'CREATE_CHARACTER' && <CharCreation />}
                    {activePage === 'HOW_TO_USE' && <div>How To Use </div>}
                </Col>
            </Row>

            <Row>
                <Col className="text-center bg-dark text-light">C7 Footer </Col>
            </Row>
        </Container>
    )
}

export default HomeDashboard;