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

            {/* ── Row 1: Top Navbar ── */}
            <Row
                className="bg-dark text-white px-3"
                style={{ position: 'sticky', top: 0, zIndex: 1 }}
            >

                <Col>
                    <h3>dndpa</h3>
                    <PersonCircle title="User" className="icon-responsive m-2 text-end" />
                </Col>

            </Row>

            {/* ── Row 2: Sidebar + Content ── */}
            <Row className="g-0" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

                {/* ── Col 1: Sidebar ── */}
                <Col
                    xs={1} sm={2} md={2} lg={2} xl={2} xxl={2}
                    className="bg-dark d-flex flex-column"
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
                    style={{ height: '100%', overflowY: 'auto', position: 'relative' }}
                >
                    {/* ── Rounded inner corner ── */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        width: '20px',
                        height: '20px',
                        backgroundColor: 'var(--bs-dark)',
                        zIndex: 0,
                    }}>
                        <div style={{
                            width: '100%',
                            height: '100%',
                            backgroundColor: 'white',
                            borderTopLeftRadius: '12px',
                        }} />
                    </div>

                    <Row className="flex-grow-1 p-3 mx-0" style={{ zIndex: 1, position: 'relative' }}>
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