//adding the party size and enemies are here, create character, then create map will be here
import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {ArrowRightShort, ArrowLeftShort} from "react-bootstrap-icons";

import UserMenu from "./UserMenu.tsx";
import ActiveMap from "../../components/ActiveEncounter/ActiveMap.tsx";
import InitiativeList from "../../components/ActiveEncounter/InitiativeList.tsx";
import ActionList from "../../components/ActiveEncounter/ActionList.tsx";
import Recommendation from "../../components/ActiveEncounter/Recommendation.tsx";

import {getEncounter} from "../../api/EncounterGet.ts";
const ENCOUNTER_EID = "enc_001";
const CREATURE_CID = "930eacb8-a93b-413a-b834-53e6ae3793e0";
const SESSION_KEY = `encounter-${ENCOUNTER_EID}`;


function EncounterSimulation() {
    const [initiativeOpen, setInitiativeOpen] = useState(false);
    const [actionOpen, setActionOpen] = useState(false);
    const [encounterData, setEncounterData] = useState<any | null>(null);
    const [loadingEncounter, setLoadingEncounter] = useState(true);
    const [encounterError, setEncounterError] = useState<string | null>(null);

    useEffect(() => {
    const loadEncounter = async () => {
        try {
            setLoadingEncounter(true);
            setEncounterError(null);

            const storedEncounter = sessionStorage.getItem(SESSION_KEY);

            if (storedEncounter !== null && storedEncounter !== "null") {
                const parsedEncounter = JSON.parse(storedEncounter);
                setEncounterData(parsedEncounter);
                return;
            }

            const data = await getEncounter(ENCOUNTER_EID);
            setEncounterData(data);
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
        } catch (error) {
            console.error("Failed to load encounter:", error);
            setEncounterError("Failed to load encounter data.");
        } finally {
            setLoadingEncounter(false);
        }
    };

    loadEncounter();
    }, []);

    return (
        <Container fluid className="p-0" style={{ height: "100vh", overflow: "hidden" }}>
            <Row className="bg-dark text-white px-3 mx-0" style={{ height: "56px" }}>
                <Col className="d-flex align-items-center">
                    <h3 className="mb-0">Encounter Simulation</h3>
                </Col>
                <Col className="d-flex justify-content-end align-items-center">
                    <UserMenu />
                </Col>
            </Row>

            <Row className="g-0 mx-0" style={{ height: "calc(100vh - 56px)" }}>
                <Col style={{position: "relative", overflow: "hidden"}}>
                    <ActiveMap/>
                    {!encounterError && !loadingEncounter && encounterData && (
                        <div>Encounter loaded</div>
                    )}

                    {!initiativeOpen && (
                        <button
                            onClick={() => setInitiativeOpen(true)}
                            style={{
                                position: "absolute",
                                top: "50%",
                                left: 0,
                                transform: "translateY(-50%)",
                                zIndex: 30,
                            }}
                        >
                            <ArrowRightShort/>
                        </button>
                    )}

                    {initiativeOpen && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                left: 0,
                                height: "100%",
                                width: "15%",
                                minWidth: "220px",
                                maxWidth: "320px",
                                zIndex: 20,
                            }}
                        >
                            <div
                                style={{
                                    height: "100%",
                                    background: "#f8f9fa",
                                    borderRight: "1px solid #ccc",
                                    overflowY: "auto",
                                    padding: "12px",
                                }}
                            >
                                <InitiativeList eid={ENCOUNTER_EID}/>
                            </div>

                            <button
                                onClick={() => setInitiativeOpen(false)}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    right: "-44px",
                                    transform: "translateY(-50%)",
                                    zIndex: 30,
                                }}
                            >
                                <ArrowLeftShort/>
                            </button>
                        </div>
                    )}

                    {!actionOpen && (
                        <button
                            onClick={() => setActionOpen(true)}
                            style={{
                                position: "absolute",
                                top: "50%",
                                right: 0,
                                transform: "translateY(-50%)",
                                zIndex: 30,
                            }}
                        >
                            <ArrowLeftShort/>
                        </button>
                    )}

                    {actionOpen && (
                        <div
                            style={{
                                position: "absolute",
                                top: 0,
                                right: 0,
                                height: "100%",
                                width: "15%",
                                minWidth: "220px",
                                maxWidth: "320px",
                                zIndex: 20,
                            }}
                        >
                            <div
                                style={{
                                    height: "100%",
                                    background: "#f8f9fa",
                                    borderRight: "1px solid #ccc",
                                    overflowY: "auto",
                                    padding: "12px",
                                }}
                            >
                                <ActionList cid={CREATURE_CID} eid={ENCOUNTER_EID}/>
                            </div>

                            <button
                                onClick={() => setActionOpen(false)}
                                style={{
                                    position: "absolute",
                                    top: "50%",
                                    left: "-44px",
                                    transform: "translateY(-50%)",
                                    zIndex: 30,
                                }}
                            >
                                <ArrowRightShort/>
                            </button>
                        </div>
                    )}

                    <div
                        style={{
                            position: "absolute",
                            left: "50%",
                            bottom: 16,
                            transform: "translateX(-50%)",
                            zIndex: 15,
                        }}
                    >
                        <Recommendation eid={ENCOUNTER_EID} cid={CREATURE_CID}/>
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default EncounterSimulation;