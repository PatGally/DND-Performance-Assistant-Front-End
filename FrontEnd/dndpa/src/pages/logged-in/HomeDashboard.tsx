import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import HomeDashNav from '../../components/nav/HomeDashNav.tsx';
import LoadCharacter from "../../components/Home-Dashboard/LoadCharacter.tsx";
import EncounterView from "../../components/Home-Dashboard/EncounterView";
import CreateEncounter from "../../components/Home-Dashboard/CreateEncounter";
import UserMenu from "./UserMenu.tsx";
import { useEffect, useState } from 'react';
import CharCreation from "../../components/Home-Dashboard/CharCreation.tsx";
import { getMonsters, type Monster } from "../../api/MonstersGet.ts";
import { getEncounters } from "../../api/EncountersGet";
import creaturePacketGet from "../../api/CreaturePacketGet";
import type { EncounterWithPacket, Encounter } from "../../types/encounter.ts";
import {warmDriveImageCache} from "../../utils/driveImageCache.ts";
import {deleteEncounter} from "../../api/DeleteEncounter.ts"
import {deletePlayer} from "../../api/DeletePlayer.ts";

function HomeDashboard() {
    const [activePage, setActivePage] = useState('SAVED_ENCOUNTERS');
    const [monsters, setMonsters] = useState<Monster[]>([]);
    const [encounters, setEncounters] = useState<EncounterWithPacket[]>([]);
    const [loadingEncounter, setLoadingEncounter] = useState<boolean>(false);

    useEffect(() => {
        const fetchMonsters = async () => {
            const data = await getMonsters();
            setMonsters(data);
        };
        fetchMonsters();
    }, []);

    const handleDeleteEncounter = async (eid: string) => {
        try {
            await deleteEncounter(eid);
            await fetchEncounters();
        } catch (err) {
            console.error("Error deleting encounter", err);
        }
    };

    const onDeletePlayer = async (cid: string) => {
        try{
            await deletePlayer(cid);
        }catch(err){
            console.error("Error deleting player", err);
        }
    }

    const fetchEncounters = async () => {
        setLoadingEncounter(true);
        try {
            const data: Encounter[] = await getEncounters();

            const encountersWithPackets: EncounterWithPacket[] = data.map((enc) => ({
                ...enc,
                packet: undefined,
            }));
            await Promise.all(
                encountersWithPackets
                    .map(e => e.mapdata?.map?.mapLink)
                    .filter(Boolean)
                    .map(link => warmDriveImageCache(link))
            );
            setEncounters(encountersWithPackets);

            for (const encounterItem of encountersWithPackets) {
                try {
                    const packet = await creaturePacketGet(encounterItem.eid);
                    setEncounters((prev) =>
                        prev.map((e) =>
                            e.eid === encounterItem.eid ? { ...e, packet } : e
                        )
                    );
                } catch (err) {
                    console.error(`Error fetching packet for ${encounterItem.eid}`, err);
                }
            }
        } catch (err) {
            console.error("Error fetching encounters", err);
        } finally {
            setLoadingEncounter(false);
        }
    };

    useEffect(() => {
        fetchEncounters();
    }, []);

    const handleEncounterCreated = async() => {
        await fetchEncounters();
        setActivePage("SAVED_ENCOUNTERS");
    };

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
                    className="bg-dark"
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
                        {activePage === 'SAVED_ENCOUNTERS' && <EncounterView encounters={encounters} loadingEncounter={loadingEncounter} onDeleteEncounter={handleDeleteEncounter} />}
                        {activePage === 'CREATE_ENCOUNTER' && <CreateEncounter monsters={monsters} onEncounterCreated={handleEncounterCreated} />}
                        {activePage === 'LOAD_CHARACTERS' && <LoadCharacter onDeletePlayer={onDeletePlayer}/>}
                        {activePage === 'CREATE_CHARACTER' && <CharCreation />}
                        {activePage === 'HOW_TO_USE' && <div>How To Use</div>}
                    </Row>
                </Col>
            </Row>

        </Container>
    );
}

export default HomeDashboard;
