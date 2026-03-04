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

function HomeDashboard() {
    const [activePage, setActivePage] = useState('SAVED_ENCOUNTERS');

    return (
        <Container fluid className="p-0" style={{ height: '100vh', overflow: 'hidden' }}>


            <Row
                className="bg-primary d-flex justify-content-between align-items-center px-3"
                style={{ position: 'sticky', top: 0, zIndex: 1 }}
            >
                <h1 className="m-1">DASHBOARD</h1>
                <PersonCircle title="User" className="icon-responsive text-dark m-2 text-end" />
            </Row>


            <Row className="g-0" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}
            >

                <Col
                    xs={1} sm={2} md={2} lg={2} xl={2} xxl={2}
                    className="bg-primary d-flex flex-column"
                    style={{ height: '100%', overflowY: 'auto' }}
                >
                    <Row>
                        <HomeDashNav setActivePage={setActivePage} />
                    </Row>
                </Col>

                {/* ── Col 2: Scrollable Main Content ── */}
                <Col
                    xs={11} sm={10} md={10} lg={10} xl={10} xxl={10}
                    className="d-flex flex-column"
                    style={{ height: '100%', overflowY: 'auto' }}
                >
                    <Row className="flex-grow-1 p-3">
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