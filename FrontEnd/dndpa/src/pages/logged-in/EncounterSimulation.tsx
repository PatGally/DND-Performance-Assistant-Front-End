//adding the party size and enemies are here, create character, then create map will be here
import { useEffect, useState } from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {ArrowRightShort, ArrowLeftShort} from "react-bootstrap-icons";
import axiosTokenInstance from "../../api/AxiosTokenInstance.ts";

import UserMenu from "./UserMenu.tsx";
import ActiveMap from "../../components/ActiveEncounter/ActiveMap.tsx";
import InitiativeList from "../../components/ActiveEncounter/InitiativeList.tsx";
import ActionList from "../../components/ActiveEncounter/ActionList.tsx";
import Recommendation from "../../components/ActiveEncounter/Recommendation.tsx";
import {getEncounter} from "../../api/EncounterGet.ts";
import {type PlayerCreature, type MonsterCreature, type Creature, isPlayerCreature} from "../../api/CreatureGet.ts";
export type InitiativeEntry = {
    name: string;
    iValue: number;
    turnType: string;
    currentTurn: boolean;
    actionResource: number;
    bonusActionResource: number;
    movementResource: number;
}
interface Encounter {
    eid: string;
    name: string;
    date: string;
    completed: boolean;
    mapdata: any;
    initiative : InitiativeEntry[];
    players : PlayerCreature[];
    monsters: MonsterCreature[];
}
import { useLocation } from "react-router-dom";


function EncounterSimulation() {
    const location = useLocation();
    const eid = location.state?.eid;
    const CREATURE_CID = "f4d5525d-1685-4797-a350-f0974662a779";
    const SESSION_KEY = `encounter-${eid}`;
    const [initiativeOpen, setInitiativeOpen] = useState(false);
    const [actionOpen, setActionOpen] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [encStart, setEncStart] = useState(false);
    const [activeEncounter, setActiveEncounter] = useState(true);
    const [encounterData, setEncounterData] = useState<Encounter>();
    const [loadingEncounter, setLoadingEncounter] = useState(true);
    const [encounterError, setEncounterError] = useState<string | null>(null);
    const [selectedCID, setSelectedCID] = useState<string | null>(null);
    const [handlingInput, setHandlingInput] = useState(false);
    const [currentTurnCreature, setCurrentTurnCreature] = useState<Creature>();
    //ONLOAD EFFECTS
    function readStoredJson<T>(key: string): T | null {
            const raw = sessionStorage.getItem(key);
            if (!raw || raw === "null") return null;

            try {
                return JSON.parse(raw) as T;
            } catch (error) {
                console.error(`Failed to parse sessionStorage key: ${key}`, error);
                return null;
            }
        }
    useEffect(() => {
        const loadEncounter = async (): Promise<void> => {
            try {
                setLoadingEncounter(true);
                setEncounterError(null);

                const storedEncounter = readStoredJson<Encounter>(SESSION_KEY);
                if (storedEncounter) {
                    setEncounterData(storedEncounter);
                    return;
                }

                const data = await getEncounter(eid);
                if (!data) {
                    setEncounterError("Encounter was not found.");
                    setEncounterData(undefined);
                    return;
                }

                setEncounterData(data);
                sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
            } catch (error) {
                console.error("Failed to load encounter:", error);
                setEncounterError("Failed to load encounter data.");
                setEncounterData(undefined);
            } finally {
                setLoadingEncounter(false);
            }
        };

    loadEncounter();
}, []);
    useEffect(() => {
    if (!encounterData || loadingEncounter || encounterError) return;

    const storedTurn = readStoredJson<Creature>("Current Turn");
    if (storedTurn) {
        setCurrentTurnCreature(storedTurn);
        return;
    }

    simStart();
}, [encounterData, loadingEncounter, encounterError]);
    useEffect(() => {
        simStart();
       setCurrentTurnCreature(JSON.parse(sessionStorage.getItem("Current Turn") as string));
    }, [encounterData, loadingEncounter, encounterError]);

    //SIM FUNCTIONS
    function simStart(): void {
    if (!encounterData || encounterData.initiative.length === 0) return;

    setEncStart(false);
    setActiveEncounter(true);

    const initStart = encounterData.initiative[0]?.name;
    if (!initStart) return;

    const allCreatures: Creature[] = [
        ...(encounterData.players ?? []),
        ...(encounterData.monsters ?? []),
    ];

    const matchingCreature = allCreatures.find(
        (creature) => getCreatureName(creature) === initStart
    );

    if (!matchingCreature) {
        console.warn("Could not find initiative starting creature.");
        setCurrentTurnCreature(undefined);
        sessionStorage.removeItem("Current Turn");
        return;
    }

    setCurrentTurnCreature(matchingCreature);
    sessionStorage.setItem("Current Turn", JSON.stringify(matchingCreature));
}
    function getCreatureName(creature: Creature): string {
        return isPlayerCreature(creature) ? creature.stats.name : creature.name;
    }

    function getCreatureCid(creature: Creature): string {
        return isPlayerCreature(creature) ? creature.stats.cid : creature.cid;
    }
    function getCreaturePosition(creature: Creature): number[][] {
        if (isPlayerCreature(creature)) {
            return Array.isArray((creature as { position?: number[][] }).position)
                ? ((creature as { position?: number[][] }).position ?? [])
                : (creature.stats.position ?? []);
        }
        return creature.position ?? [];
    }
    function getCreatureSize(creature: Creature): string {
        return isPlayerCreature(creature) ? "medium" : String(creature.size ?? "medium").toLowerCase();
    }
    function handleTokenSelect(cid: string) {
        if (!encounterData) return;
        console.log("In handleTokenSelect");
        setSelectedCID((prev) => (prev === cid ? null : cid));
    }
    async function handleGridCellClick(cellX: number, cellY: number) {
    if (!selectedCID || !encounterData) return;

    try {
        const allCreatures: Creature[] = [
            ...(encounterData.players ?? []),
            ...(encounterData.monsters ?? []),
        ];

        const movedCreature = allCreatures.find(
            (creature) => getCreatureCid(creature) === selectedCID
        );

        if (!movedCreature) {
            console.error("Could not find selected creature.");
            return;
        }

        const sizeRaw = getCreatureSize(movedCreature);

        let footprint = 1;
        if (sizeRaw === "large") footprint = 2;
        else if (sizeRaw === "huge") footprint = 3;
        else if (sizeRaw === "gargantuan") footprint = 4;

        const newPos: number[][] = [];
        for (let dy = 0; dy < footprint; dy++) {
            for (let dx = 0; dx < footprint; dx++) {
                newPos.push([cellX + dx, cellY + dy]);
            }
        }

        await axiosTokenInstance.post(
            `/encounter/${eid}/creature/${selectedCID}/simulate/movement`,
            newPos
        );

        const updatedEncounter = await getEncounter(eid);
        if (!updatedEncounter) {
            console.error("Encounter reload failed after movement.");
            return;
        }

        setEncounterData(updatedEncounter);
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedEncounter));
        setSelectedCID(null);
    } catch (error) {
        console.error("Movement simulation failed:", error);
    }
}

    return (
        <Container fluid className="p-0" style={{ height: "100vh", overflow: "hidden" }}>
            <Row className="bg-dark text-white px-3 mx-0" style={{ height: "56px" }}>
                <Col className="d-flex align-items-center">
                    <h3 className="mb-0">Encounter Simulation</h3>
                </Col>
                <Col className="d-flex align-items-center">
                    {activeEncounter && currentTurnCreature && (
                        <>
                            <p>Current Turn: {isPlayerCreature(currentTurnCreature) ?
                                currentTurnCreature.stats.name : currentTurnCreature.name}</p>
                            <button>Ruleset</button>
                            <button>Manual</button>
                        </>
                        )
                    }
                    {encStart && (
                        <>
                            <button onClick={simStart}>Start!</button>
                        </>
                    )
                    }
                </Col>
                <Col className="d-flex justify-content-end align-items-center">
                    <UserMenu />
                </Col>
            </Row>
            <Row className="g-0 mx-0" style={{ height: "calc(100vh - 56px)" }}>
                <Col style={{position: "relative", overflow: "hidden"}}>
                    {!encounterError && !loadingEncounter && encounterData && (
                        <ActiveMap style={{zIndex:1, position: 'relative'}}
                            encounter={encounterData}
                            manualMode={manualMode}
                            encStart={encStart}
                            activeEncounter={activeEncounter}
                            selectedCID={selectedCID}
                            onTokenSelect={handleTokenSelect}
                            onGridCellClick={handleGridCellClick}
                        />
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
                                <InitiativeList eid={eid}/>
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
                                <ActionList cid={CREATURE_CID} eid={eid}/>
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
                        {activeEncounter && currentTurnCreature && (
                            <Recommendation eid={eid} cid={getCreatureCid(currentTurnCreature)}/>
                        )}
                    </div>
                </Col>
            </Row>
        </Container>
    );
}

export default EncounterSimulation;