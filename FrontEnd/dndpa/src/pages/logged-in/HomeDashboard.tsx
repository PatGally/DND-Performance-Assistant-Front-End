import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import HomeDashNav from '../../components/nav/HomeDashNav.tsx';
import LoadCharacter from "../../components/Home-Dashboard/LoadCharacter.tsx";
import EncounterView from "../../components/Home-Dashboard/EncounterView";
import CreateEncounter from "../../components/Home-Dashboard/CreateEncounter";
import UserMenu from "./UserMenu.tsx";

import {useEffect, useState} from 'react';
import CharCreation from "../../components/Home-Dashboard/CharCreation.tsx";
import {getMonsters, type Monster} from "../../api/MonstersGet.ts";


function HomeDashboard() {
    const [activePage, setActivePage] = useState('SAVED_ENCOUNTERS');

    const [monsters, setMonsters] = useState<Monster[]>([]);

    useEffect(() => {
        const fetchMonsters = async () => {
            const data = await getMonsters();
            setMonsters(data);
        };
        fetchMonsters();
    }, []);

    return (
        <Container fluid className="p-0" style={{ height: '100vh', overflow: 'hidden' }}>

            <Row className="bg-dark text-white px-3 mx-0" style={{ position: 'sticky', top: 0, zIndex: 1000 }}>
                <Col>
                    <h3>dndpa</h3>
                </Col>
                <Col className="text-end">
                    <UserMenu />
                </Col>
            </Row>

            <Row className="g-0 mx-0" style={{ height: 'calc(100vh - 56px)', overflow: 'hidden' }}>

                <Col
                    className="bg-dark "
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


                    <Row className="flex-grow-1 mx-0" style={{ zIndex: 1, position: 'relative' }}>
                        {activePage === 'SAVED_ENCOUNTERS' && <EncounterView />}
                        {activePage === 'CREATE_ENCOUNTER' && <CreateEncounter monsters={monsters} />}
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