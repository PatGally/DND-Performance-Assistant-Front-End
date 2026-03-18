import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import HomeDashNav from '../../components/nav/HomeDashNav.tsx';
import LoadCharacter from "../../components/Home-Dashboard/LoadCharacter.tsx";
import EncounterView from "../../components/Home-Dashboard/EncounterView";
import CreateEncounter from "../../components/Home-Dashboard/CreateEncounter";

import { useState } from 'react';
import CharCreation from "../../components/Home-Dashboard/CharCreation.tsx";
import { PersonCircle } from "react-bootstrap-icons";
import {Button} from "react-bootstrap";

function HomeDashboard() {
    const [activePage, setActivePage] = useState('SAVED_ENCOUNTERS');

    return (
        <Container fluid className="p-0" style={{ height: '100vh', overflow: 'hidden' }}>

            {/* ── Row 1: Top Navbar ── */}
            <Row className="bg-dark text-white px-3 mx-0" style={{ position: 'sticky', top: 0, zIndex: 1 }}>
                <Col>
                    <h3>dndpa</h3>
                </Col>
                <Col className="text-end">
                    <Button className="btn-dark">
                        <PersonCircle title="User" size={24} />
                    </Button>

                </Col>
            </Row>

            {/* ── Row 2: Sidebar + Content ── */}
            <Row className="g-0 mx-0" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

                {/* ── Col 1: Sidebar ── */}
                <Col
                    className="bg-dark " //d-flex flex-column
                    style={{ width: '70px', flex: '0 0 70px', height: '100%', overflowY: 'auto' }}
                >
                    <Row className="flex-grow-1 mx-0">
                        <HomeDashNav setActivePage={setActivePage} />
                    </Row>
                </Col>

                <Col
                    className="d-flex flex-column"
                    style={{ height: '100%', overflowY: 'auto', position: 'relative' }}
                >
                    {/* Corners are weird for no so i took them out completly*/}

                    {/*<div style={{ position: 'sticky', top: 0, zIndex: 2, display: 'flex', justifyContent: 'space-between', pointerEvents: 'none' }}>*/}
                    {/*    /!* Left corner *!/*/}
                    {/*    <div style={{ width: '20px', height: '20px', backgroundColor: 'var(--bs-dark)' }}>*/}
                    {/*        <div style={{ width: '100%', height: '100%', backgroundColor: 'white', borderTopLeftRadius: '12px' }} />*/}
                    {/*    </div>*/}
                    {/*    /!* Right corner *!/*/}
                    {/*    <div style={{ width: '20px', height: '20px', backgroundColor: 'var(--bs-dark)' }}>*/}
                    {/*        <div style={{ width: '100%', height: '100%', backgroundColor: 'white', borderTopRightRadius: '12px' }} />*/}
                    {/*    </div>*/}
                    {/*</div>*/}


                    <Row className="flex-grow-1 mx-0" style={{ zIndex: 1, position: 'relative' }}>
                        {activePage === 'SAVED_ENCOUNTERS' && <EncounterView />}
                        {activePage === 'CREATE_ENCOUNTER' && <CreateEncounter />}
                        {activePage === 'LOAD_CHARACTERS' && <LoadCharacter />}
                        {activePage === 'CREATE_CHARACTER' && <CharCreation />}
                        {activePage === 'HOW_TO_USE' && <div>How To Use</div>}
                    </Row>
                </Col>
            </Row>

        </Container>
    );
}

export default HomeDashboard;