//adding the party size and enemies are here, create character, then create map will be here
import {useEffect, useRef, useState} from "react";
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
import { useLocation } from "react-router-dom";

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
    initiative: InitiativeEntry[];
    players: PlayerCreature[];
    monsters: MonsterCreature[];
}
interface PreTurnEffect {
    "name": string;
    "effect": {
        "spellName": string;
        "resultID": string;
    }
}

function clampPan(
    x: number,
    y: number,
    zoom: number,
    viewportRect: DOMRect,
    mapNaturalWidth: number,
    mapNaturalHeight: number,
    margin = 100
): { x: number; y: number } {
    const scaledMapW = mapNaturalWidth * zoom;
    const scaledMapH = mapNaturalHeight * zoom;
    const vw = viewportRect.width;
    const vh = viewportRect.height;

    const minX = -(scaledMapW - margin);
    const maxX = vw - margin;
    const minY = -(scaledMapH - margin);
    const maxY = vh - margin;

    return {
        x: Math.min(maxX, Math.max(minX, x)),
        y: Math.min(maxY, Math.max(minY, y)),
    };
}

function EncounterSimulation() {
    const location = useLocation();
    const eid = location.state?.eid;
    const SESSION_KEY = `encounter-${eid}`;

    //Side components
    const [initiativeOpen, setInitiativeOpen] = useState(false);
    const [initiativeRefreshKey, setInitiativeRefreshKey] = useState(0);
    const [actionOpen, setActionOpen] = useState(false);
    const [manualMode, setManualMode] = useState(false);

    //Pre/post enc logic
    const [encStart, setEncStart] = useState(false);
    const [activeEncounter, setActiveEncounter] = useState(true);

    const [encounterData, setEncounterData] = useState<Encounter>();
    const [loadingEncounter, setLoadingEncounter] = useState(true);
    const [encounterError, setEncounterError] = useState<string | null>(null);
    const [currentTurnCreature, setCurrentTurnCreature] = useState<Creature>();

    //selectedCID used for token selection
    const [selectedCID, setSelectedCID] = useState<string | null>(null);
    //Locks the top three buttons
    const [handlingInput, setHandlingInput] = useState(false);
    const [preTurnEffects, setPreTurnEffects] = useState<PreTurnEffect[]>();

    //Pan/zoom state
    const mapViewportRef = useRef<HTMLDivElement>(null);
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);
    const lastPanPos = useRef({ x: 0, y: 0 });
    const [mapNaturalWidth, setMapNaturalWidth] = useState(800);
    const [mapNaturalHeight, setMapNaturalHeight] = useState(600);

    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 4;

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
        //Loads the encounter from the DB/SessionStorage
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
        //Checks startup logic -> if not startup, then grab currentTurnCreature.
        if (!encounterData || loadingEncounter || encounterError) return;

        const allCreatures: Creature[] = [
            ...(encounterData.players ?? []),
            ...(encounterData.monsters ?? []),
        ];

        const zeroOccupants = allCreatures.filter((creature) => {
            const position = getCreaturePosition(creature);
            return position.some(
                (tile) =>
                    Array.isArray(tile) &&
                    tile.length === 2 &&
                    tile[0] === 0 &&
                    tile[1] === 0
            );
        });
        const noCollisionAtZero = zeroOccupants.length <= 1;

        if (!noCollisionAtZero) {
            console.log("Encounter start!");
            setEncStart(true);
            setActiveEncounter(false);
        } else {
            const storedTurn = readStoredJson<Creature>(`encounter-current-turn-${eid}`);
            if (storedTurn) {
                setCurrentTurnCreature(storedTurn);
                return;
            } else if (activeEncounter) {
                simStart();
            }
        }
    }, [encounterData, loadingEncounter, encounterError, eid, activeEncounter]);

    useEffect(() => {
        const el = mapViewportRef.current;
        if (!el) return;
        const handler = (e: WheelEvent) => e.preventDefault();
        el.addEventListener("wheel", handler, { passive: false });
        return () => el.removeEventListener("wheel", handler);
    }, []);

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
            sessionStorage.removeItem(`encounter-current-turn-${eid}`);
            return;
        }

        setCurrentTurnCreature(matchingCreature);
        sessionStorage.setItem(`encounter-current-turn-${eid}`, JSON.stringify(matchingCreature));
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
    function getCurrentTurnCreatureFromEncounter(encounter: Encounter): Creature | undefined {
        const currentTurnEntry = encounter.initiative.find((entry) => entry.currentTurn);
        if (!currentTurnEntry) return undefined;

        const allCreatures: Creature[] = [
            ...(encounter.players ?? []),
            ...(encounter.monsters ?? []),
        ];

        return allCreatures.find(
            (creature) => getCreatureName(creature).toLowerCase() === currentTurnEntry.name.toLowerCase()
        );
    }
    function handleTokenSelect(cid: string) {
        if (!encounterData) return;
        setSelectedCID((prev) => (prev === cid ? null : cid));
    }
    async function handleNextTurn() {
        if (handlingInput || !encounterData || encStart || !activeEncounter || !eid || preTurnEffects) return;

        try {
            setHandlingInput(true);

            const response = await axiosTokenInstance.get(`/encounter/${eid}/initiative/nextturn`);
            const preEffects = Array.isArray(response.data.preEffects) ? response.data.preEffects : [];
            const updatedEncounter = await getEncounter(eid);
            if (!updatedEncounter) {
                console.error("Failed to reload encounter after advancing turn.");
                return;
            }

            setEncounterData(updatedEncounter);
            sessionStorage.setItem(SESSION_KEY, JSON.stringify(updatedEncounter));

            const newCurrentTurnCreature = getCurrentTurnCreatureFromEncounter(updatedEncounter);
            if (!newCurrentTurnCreature) {
                console.error("Could not determine current turn creature from updated encounter.");
                setCurrentTurnCreature(undefined);
                sessionStorage.removeItem(`encounter-current-turn-${eid}`);
            } else {
                setCurrentTurnCreature(newCurrentTurnCreature);
                sessionStorage.setItem(
                    `encounter-current-turn-${eid}`,
                    JSON.stringify(newCurrentTurnCreature)
                );
            }
            if (Array.isArray(preEffects) && preEffects.length !== 0) {
                setPreTurnEffects(preEffects);
            }
        } catch (error) {
            console.error("Failed to advance turn:", error);
        } finally {
            setInitiativeRefreshKey((prev) => prev + 1);
            setHandlingInput(false);
        }
    }
    function handleManualSimulate() {
        handleNextTurn();
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

    //PAN/ZOOM FUNCTIONS
    function onPanStart(e: React.MouseEvent) {
        if ((e.target as HTMLElement).tagName === "IMG") return;
        setIsPanning(true);
        lastPanPos.current = { x: e.clientX, y: e.clientY };
    }
    function onPanMove(e: React.MouseEvent) {
        if (!isPanning) return;
        const rect = mapViewportRef.current!.getBoundingClientRect();
        const dx = e.clientX - lastPanPos.current.x;
        const dy = e.clientY - lastPanPos.current.y;
        lastPanPos.current = { x: e.clientX, y: e.clientY };
        setPan(prev => clampPan(prev.x + dx, prev.y + dy, zoom, rect, mapNaturalWidth, mapNaturalHeight));
    }
    function onPanEnd() { setIsPanning(false); }
    function onWheel(e: React.WheelEvent) {
        e.preventDefault();
        const rect = mapViewportRef.current!.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // 1.01 is slow, 1.05 is moderate, 1.1 is fast
        const factor = e.deltaY < 0 ? 1.01 : 0.991;

        setZoom(prevZoom => {
            const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prevZoom * factor));
            setPan(prevPan => {
                const ratio = nextZoom / prevZoom;
                const nextX = mouseX - ratio * (mouseX - prevPan.x);
                const nextY = mouseY - ratio * (mouseY - prevPan.y);
                return clampPan(nextX, nextY, nextZoom, rect, mapNaturalWidth, mapNaturalHeight);
            });
            return nextZoom;
        });
    }

    return (
        <Container fluid className="p-0" style={{ height: "100vh", display: "flex", flexDirection: "column" }}>

            {/* Fixed header */}
            <Row className="bg-dark text-white px-3 mx-0" style={{ height: "56px", flexShrink: 0 }}>
                <Col className="d-flex align-items-center">
                    {encounterData
                        ? <h3 className="mb-0">{encounterData.name} Simulation</h3>
                        : <h3 className="mb-0">Encounter Simulation</h3>
                    }
                </Col>
                <Col className="d-flex align-items-center gap-2">
                    {activeEncounter && currentTurnCreature && (
                        <>
                            <p className="mb-0">Current Turn: {isPlayerCreature(currentTurnCreature)
                                ? currentTurnCreature.stats.name
                                : currentTurnCreature.name}
                            </p>
                            <button onClick={() => setManualMode(false)}>Ruleset</button>
                            <button disabled={handlingInput} onClick={() => setManualMode(true)}>Manual</button>
                            {manualMode
                                ? <button onClick={handleManualSimulate}>Submit</button>
                                : <button onClick={handleNextTurn}>Next Turn</button>
                            }
                        </>
                    )}
                    {encStart && <button onClick={simStart}>Start!</button>}
                </Col>
                <Col className="d-flex justify-content-end align-items-center">
                    <UserMenu />
                </Col>
            </Row>

            {/* Main area */}
            <Row className="g-0 mx-0" style={{ flex: 1, minHeight: 0 }}>
                <Col style={{ position: "relative", overflow: "hidden", height: "100%", padding: 0 }}>

                    {/* MAP VIEWPORT — only this layer zooms/pans */}
                    <div
                        ref={mapViewportRef}
                        style={{
                            position: "absolute",
                            inset: 0,
                            overflow: "hidden",
                            cursor: isPanning ? "grabbing" : "grab",
                        }}
                        onMouseDown={onPanStart}
                        onMouseMove={onPanMove}
                        onMouseUp={onPanEnd}
                        onMouseLeave={onPanEnd}
                        onWheel={onWheel}
                    >
                        <div style={{
                            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                            transformOrigin: "0 0",
                            willChange: "transform",
                            display: "inline-block",
                        }}>
                            {!encounterError && !loadingEncounter && encounterData && (
                                <ActiveMap
                                    encounter={encounterData}
                                    manualMode={manualMode}
                                    encStart={encStart}
                                    activeEncounter={activeEncounter}
                                    selectedCID={selectedCID}
                                    onTokenSelect={handleTokenSelect}
                                    onGridCellClick={handleGridCellClick}
                                    onMapSizeLoaded={(w, h) => {
                                        setMapNaturalWidth(w);
                                        setMapNaturalHeight(h);
                                    }}
                                />
                            )}
                        </div>
                    </div>

                    {/* OVERLAYS — siblings to map viewport, never zoom */}

                    {/* Initiative — left sidebar */}
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
                            <ArrowRightShort />
                        </button>
                    )}
                    {initiativeOpen && (
                        <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            width: "15%",
                            minWidth: "220px",
                            maxWidth: "320px",
                            zIndex: 20,
                            display: "flex",
                            flexDirection: "column",
                        }}>
                            <div style={{
                                flex: 1,
                                background: "#f8f9fa",
                                borderRight: "1px solid #ccc",
                                overflowY: "auto",
                                padding: "12px",
                            }}>
                                <InitiativeList key={`${eid}-${initiativeRefreshKey}`} eid={eid} />
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
                                <ArrowLeftShort />
                            </button>
                        </div>
                    )}

                    {/* Actions — right sidebar */}
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
                            <ArrowLeftShort />
                        </button>
                    )}
                    {actionOpen && encounterData && currentTurnCreature && !preTurnEffects && !manualMode && (
                        <div style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            height: "100%",
                            width: "15%",
                            minWidth: "220px",
                            maxWidth: "320px",
                            zIndex: 20,
                            display: "flex",
                            flexDirection: "column",
                        }}>
                            <div style={{
                                flex: 1,
                                background: "#f8f9fa",
                                borderLeft: "1px solid #ccc",
                                overflowY: "auto",
                                padding: "12px",
                            }}>
                                <ActionList cid={getCreatureCid(currentTurnCreature)} eid={eid} />
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
                                <ArrowRightShort />
                            </button>
                        </div>
                    )}

                    {/* Recommendation — bottom center */}
                    {activeEncounter && currentTurnCreature && (
                        <div style={{
                            position: "absolute",
                            bottom: 16,
                            left: "50%",
                            transform: "translateX(-50%)",
                            zIndex: 15,
                        }}>
                            {preTurnEffects && preTurnEffects.length > 0 ? (
                                <div className="bg-light border rounded p-3">
                                    <h5>Resolve Pre-Turn Effects</h5>
                                    <p>This creature has effects that must be resolved before continuing.</p>
                                    {preTurnEffects.map((effect, index) => (
                                        <div key={index} className="mb-2">
                                            <strong>{effect.name ?? "Unnamed Effect"}</strong>
                                        </div>
                                    ))}
                                </div>
                            ) : manualMode ? (
                                <div>Manual Mode</div>
                            ) : (
                                <Recommendation eid={eid} cid={getCreatureCid(currentTurnCreature)} />
                            )}
                        </div>
                    )}

                </Col>
            </Row>
        </Container>
    );
}

export default EncounterSimulation;


