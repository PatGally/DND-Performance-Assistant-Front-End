import {useCallback, useEffect, useRef, useState} from "react";
import Container from "react-bootstrap/Container";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import {ArrowLeftShort, ArrowRightShort} from "react-bootstrap-icons";
import axiosTokenInstance from "../../api/AxiosTokenInstance.ts";
import {useLocation} from "react-router-dom";

import ActiveMap from "../../components/ActiveEncounter/ActiveMap.tsx";
import InitiativeList from "../../components/ActiveEncounter/InitiativeList.tsx";
import ActionList from "../../components/ActiveEncounter/ActionList.tsx";
import Recommendation from "../../components/ActiveEncounter/Recommendation.tsx";
import InputHandler from "../../components/ActiveEncounter/InputHandler.tsx";

import {
    getCreatureCid, getCreaturePosition,
    getCurrentTurnCreatureFromEncounter
} from "../../utils/ActiveSimUtils/CreatureHelpers.ts";

import {getEncounter} from "../../api/EncounterGet.ts";
import {isPlayerCreature} from "../../api/CreatureGet.ts";

import type {Creature} from "../../types/creature.ts";
import type {CreatureAction} from "../../types/action.ts";
import type {
    Encounter,
    ActionExecutionSession, ManualDraftState,
    AoeToken, ManualAoePlacement,
    PendingPreTurnResolution
} from "../../types/SimulationTypes.ts";

import ExitSimulation from "../../components/ActiveEncounter/ExitSimulation.tsx";
import { Card } from "react-bootstrap";
import Orb from '../../css/Orb.tsx';
import {
    buildPreTurnSession,
    syncPreTurnQueueFromCreature
} from "../../utils/ActiveSimUtils/PreTurnHelpers.ts";
import {loadActions} from "../../utils/ActiveSimUtils/actionHelpers.ts";
import {onPanEnd, onPanMove, onPanStart, onWheel} from "../../utils/ActiveSimUtils/panningHelpers.ts";
import {
    clearManualState, handleManualCreatureChange,
    handleManualSimulate,
    setManualState
} from "../../utils/ActiveSimUtils/manualHelpers.ts";
import { useEncounterSimulationCallbacks } from "../../hooks/ActiveSimHooks.ts";

function EncounterSimulation() {
    const location = useLocation();
    const eid = location.state?.eid;

    //Side homeComponents
    const [initiativeOpen, setInitiativeOpen] = useState(false);
    const [initiativeRefreshKey, setInitiativeRefreshKey] = useState(0);
    const [recommendRefreshKey, setRecommendRefreshKey] = useState(0);
    const latestHoverRequestRef = useRef(0);
    const didHydrateInitialPreTurnRef = useRef(false);
    const [actionOpen, setActionOpen] = useState(false);

    //Pre/post enc logic
    const [encStart, setEncStart] = useState(false);
    const [activeEncounter, setActiveEncounter] = useState(true);
    const [endOfEncounter, setEndOfEncounter] = useState(false);

    const [encounterData, setEncounterData] = useState<Encounter>();
    const [loadingEncounter, setLoadingEncounter] = useState(true);
    const [encounterError, setEncounterError] = useState<string | null>(null);
    const [currentTurnCreature, setCurrentTurnCreature] = useState<Creature>();
    const [aoeTokens, setAoeTokens] = useState<AoeToken[]>([]);
    const [manualAoePlacement, setManualAoePlacement] = useState<ManualAoePlacement | null>(null);

    //selectedCID used for token selection
    const [selectedCID, setSelectedCID] = useState<string | null>(null);
    const [currentTurnActions, setCurrentTurnActions] = useState<CreatureAction[]>();
    //Locks the top three buttons
    const [actionExecutionSession, setActionExecutionSession] = useState<ActionExecutionSession>();
    const [handlingNextTurn, setHandlingNextTurn] = useState(false);
    const [preTurnQueue, setPreTurnQueue] = useState<PendingPreTurnResolution[]>([]);
    const [manualLock, setManualLock] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [manualDraft, setManualDraft] = useState<ManualDraftState>({
      affectedCreatures: [],
    });
    const [initiativeExpandedCid, setInitiativeExpandedCid] = useState<string | null>(null);
    const hasPreTurnQueue = preTurnQueue.length > 0;
    const [isLairAction, setIsLairAction] = useState(false);

    //Pan/zoom state
    const mapViewportRef = useRef<HTMLDivElement>(null);
    const mapContentRef = useRef<HTMLDivElement>(null);
    const zoom = useRef(1);
    const pan = useRef({ x: 0, y: 0 });
    const isPanning = useRef(false);
    const lastPanPos = useRef({ x: 0, y: 0 });
    const [mapNaturalWidth, setMapNaturalWidth] = useState(800);
    const [mapNaturalHeight, setMapNaturalHeight] = useState(600);
    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 4;
    const handleMapSizeLoaded = useCallback((w: number, h: number) => {
    setMapNaturalWidth((prev) => (prev === w ? prev : w));
    setMapNaturalHeight((prev) => (prev === h ? prev : h));
}, []);

    const {
      handleSetManualState, handleClearManualAoePreview, handleActiveMapTokenSelect,
      handleActiveMapGridCellClick, handleActiveMapGridCellHover, handleBuildRecommendationAoeToken,
      handleSubmitAction, handleSubmitRecommendation, handleExecuteAction,
      handleExecutePreTurn, handleSimStart, handleNextTurnWrapper, handleExitPreTurn,
    } = useEncounterSimulationCallbacks({
      eid, encounterData, currentTurnCreature, currentTurnActions, actionExecutionSession, aoeTokens,
      manualAoePlacement, manualDraft, preTurnQueue, latestHoverRequestRef, hasPreTurnQueue, manualMode,
      handlingNextTurn, endOfEncounter, encStart, activeEncounter, selectedCID, setAoeTokens, setManualAoePlacement,
      setManualMode, setInitiativeOpen, setActionOpen, setManualDraft, setInitiativeExpandedCid, setSelectedCID,
      setManualLock, setActionExecutionSession, setEncounterData, setCurrentTurnCreature, setPreTurnQueue,
      setRecommendRefreshKey, setInitiativeRefreshKey, setEncStart, setActiveEncounter, setHandlingNextTurn,
    });

    //ONLOAD EFFECTS
    useEffect(() => {
        //Loads the encounter from the DB
        const loadEncounter = async (): Promise<void> => {
            try {
                setLoadingEncounter(true);
                setEncounterError(null);

                const data = await getEncounter(eid);
                console.log(data);
                if (!data) {
                    setEncounterError("Encounter was not found.");
                    setEncounterData(undefined);
                    return;
                }

                setEncounterData(data);
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
            setEncStart(true);
            setActiveEncounter(false);
        } else {
            const storedTurn = getCurrentTurnCreatureFromEncounter(encounterData);
            if ((storedTurn && storedTurn.name === encounterData.initiative[0].name) ||
                (!storedTurn && encounterData.initiative[0].name.toLowerCase() == "lair action")) {
                handleSimStart();
            }
            if (storedTurn) {
              setCurrentTurnCreature(storedTurn);

              if (!didHydrateInitialPreTurnRef.current) {
                syncPreTurnQueueFromCreature(setPreTurnQueue, storedTurn);
                didHydrateInitialPreTurnRef.current = true;
              }
            }
        }
    }, [encounterData]);
    useEffect(() => {
      const storedAoeTokens = Array.isArray(
        (
          encounterData as
            | { mapdata?: { layers?: { aoeTokens?: unknown[] } } }
            | undefined
        )?.mapdata?.layers?.aoeTokens
      )
        ? (((encounterData as { mapdata?: { layers?: { aoeTokens?: unknown[] } } })
            ?.mapdata?.layers?.aoeTokens ?? []) as AoeToken[])
        : [];

      setAoeTokens((prev) => {
        const previewTokens = prev.filter((token) =>
          token.resultID.startsWith("preview:")
        );

        const merged = [...storedAoeTokens];

        for (const preview of previewTokens) {
          if (!merged.some((token) => token.resultID === preview.resultID)) {
            merged.push(preview);
          }
        }

        return merged;
      });
    }, [encounterData]);
    useEffect(() => {
      didHydrateInitialPreTurnRef.current = false;
    }, [eid]);
    useEffect(() => {
        console.log("currentTurnCreature changed:", currentTurnCreature);
        console.log("_isLairAction flag:", (currentTurnCreature as any)?._isLairAction);

        if (!currentTurnCreature) return;
        if ((currentTurnCreature as any)._isLairAction) {
            // Force manual mode, block ruleset
            setManualMode(true);
            setInitiativeOpen(true);
            setActionOpen(false);
            clearManualState({setManualDraft, setInitiativeExpandedCid});
            setManualLock(false);
            setIsLairAction(true);
            return;
        }

        setIsLairAction(false);
        loadActions(currentTurnCreature, eid, setCurrentTurnActions);
    }, [currentTurnCreature, encounterData]);
    useEffect(() => {
        const el = mapViewportRef.current;
        if (!el) return;
        const handler = (e: WheelEvent) => e.preventDefault();
        el.addEventListener("wheel", handler, { passive: false });
        return () => el.removeEventListener("wheel", handler);
    }, []);
    useEffect(() => {
      if (!encounterData || !currentTurnCreature) return;
      if (manualMode) return;
      if (actionExecutionSession) return;

      const nextItem = preTurnQueue[0];
      if (!nextItem) return;
      console.log("Turn queue of", preTurnQueue);

      setManualLock(true);
      setActionExecutionSession(buildPreTurnSession(nextItem, currentTurnCreature));
    }, [preTurnQueue, encounterData, currentTurnCreature,
                                                manualMode, actionExecutionSession]);
    useEffect(() => {
        const loadEndOfEncounter = async (): Promise<void> => {
            const response = await axiosTokenInstance.get(`/encounter/${eid}/completed`)
            if (response.data.isEnd) {
                if (encounterData && !encounterData.completed) {
                    await axiosTokenInstance.get(`/encounter/${eid}/setcompleted`);
                }
                setEndOfEncounter(true);
            }
        }
        loadEndOfEncounter()
    }, [encounterData, currentTurnCreature]);

    return (
        <Container fluid className="p-0" style={{ height: "100vh", display: "flex", flexDirection: "column", backgroundColor: "#000000" }}>
            <Row className="bg-dark text-white px-3 mx-0" style={{ height: "56px", flexShrink: 0 }}>
                <Col className="d-flex align-items-center">
                    {encounterData
                        ? <h3 className="mb-0">{encounterData.name} Simulation</h3>
                        : <h3 className="mb-0">Encounter Simulation</h3>
                            // ? <h3 className="mb-0">{(encounterData.name.length > 12
                            //     ? encounterData.name.slice(0, 12) + "..."
                            //     : encounterData.name)}{" "}
                            //     Simulation
                            // </h3>
                            // : <h3 className="mb-0">Encounter Simulation</h3>
                    }
                </Col>
                <Col className="d-flex align-items-center gap-2">
                    {activeEncounter && !endOfEncounter && (currentTurnCreature || isLairAction) && (
                        <>
                            {currentTurnCreature ? (
                                <p className="mb-0">
                                    Current Turn: {isPlayerCreature(currentTurnCreature)
                                    ? currentTurnCreature.stats.name
                                    : currentTurnCreature.name}
                                </p>
                            ) : (
                                <p className="mb-0">Lair Action</p>
                            )}

                            <button
                                disabled={isLairAction || actionExecutionSession !== undefined}
                                onClick={() => {
                                    setManualMode(false);
                                    clearManualState({
                                      setManualDraft,
                                      setInitiativeExpandedCid,
                                    });
                                }}
                            >
                                Ruleset
                            </button>

                            <button
                                disabled={actionExecutionSession !== undefined || handlingNextTurn || manualLock}
                                onClick={() => setManualState({actionExecutionSession, latestHoverRequestRef,
                                                        setAoeTokens, setManualAoePlacement, setManualMode,
                                                        setInitiativeOpen, setActionOpen, setManualDraft, setInitiativeExpandedCid})}
                            >
                                Manual
                            </button>

                            {manualMode && (
                                <button
                                    onClick={() =>
                                        handleManualSimulate({
                                            manualLock,
                                            manualMode,
                                            eid,
                                            manualDraft,
                                            setManualLock,
                                            setEncounterData,
                                            setCurrentTurnCreature,
                                            setManualDraft,
                                            setInitiativeExpandedCid,
                                            setManualMode,
                                            setInitiativeRefreshKey,
                                        })
                                    }
                                >
                                    Submit
                                </button>
                            )}

                            {!manualMode && (
                                <button
                                    disabled={actionExecutionSession !== undefined || hasPreTurnQueue}
                                    onClick={handleNextTurnWrapper}
                                >
                                    Next Turn
                                </button>
                            )}
                        </>
                    )}

                    {encStart && !activeEncounter && (
                        <button onClick={handleSimStart}>Start!</button>
                    )}

                </Col>
                <Col className="d-flex justify-content-end align-items-center">
                    <ExitSimulation />
                </Col>
            </Row>


            <Row className="g-0 mx-0" style={{ flex: 1, minHeight: 0 }}>
                <Col style={{ position: "relative", overflow: "hidden", height: "100%", padding: 0 }}>
                    <div
                        ref={mapViewportRef}
                        style={{
                            position: "absolute",
                            inset: 0,
                            overflow: "hidden",
                            cursor: "grab",
                        }}
                        onMouseDown={(e) =>
                            onPanStart(e, isPanning, lastPanPos, mapViewportRef)
                        }
                        onMouseMove={(e) =>
                            onPanMove(
                                e,
                                isPanning,
                                lastPanPos,
                                mapViewportRef,
                                mapContentRef,
                                pan,
                                zoom,
                                mapNaturalWidth,
                                mapNaturalHeight
                            )
                        }
                        onMouseUp={() =>
                            onPanEnd(isPanning, mapViewportRef)
                        }
                        onMouseLeave={() =>
                            onPanEnd(isPanning, mapViewportRef)
                        }
                        onWheel={(e) =>
                            onWheel(
                                e,
                                mapViewportRef,
                                mapContentRef,
                                pan,
                                zoom,
                                mapNaturalWidth,
                                mapNaturalHeight,
                                MIN_ZOOM,
                                MAX_ZOOM
                            )
                        }
                    >
                        <div ref={mapContentRef} style={{
                            transform: `translate(${pan.current.x}px, ${pan.current.y}px) scale(${zoom})`,
                            transformOrigin: "0 0",
                            willChange: "transform",
                            display: "inline-block",
                        }}>
                            {!encounterError && !loadingEncounter && encounterData && (
                                <ActiveMap
                                  encounter={encounterData}
                                  aoeTokens={aoeTokens}
                                  manualMode={manualMode}
                                  encStart={encStart}
                                  activeEncounter={activeEncounter}
                                  selectedCID={selectedCID}
                                  isAoePlacementActive={manualAoePlacement !== null}
                                  onTokenSelect={handleActiveMapTokenSelect}
                                  onGridCellClick={handleActiveMapGridCellClick}
                                  onGridCellHover={handleActiveMapGridCellHover}
                                  onMapSizeLoaded={handleMapSizeLoaded}
                                />
                            )}
                        </div>
                    </div>

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
                        <div style={{
                            position: "absolute",
                            top: 0,
                            left: 0,
                            height: "100%",
                            width: "20%",
                            minWidth: "220px",
                            maxWidth: "320px",
                            zIndex: 20,
                            display: "flex",
                            flexDirection: "column",
                        }}>
                            <div style={{
                                flex: 1,
                                background: "#222222",
                                color: "white",
                                borderRight: "1px solid #ccc",
                                overflowY: "auto",
                                padding: "12px",
                            }}>
                                <InitiativeList
                                  key={`${eid}-${initiativeRefreshKey}`}
                                  eid={eid}
                                  manualMode={manualMode}
                                  expandedCid={initiativeExpandedCid}
                                  onExpandedCidChange={setInitiativeExpandedCid}
                                  manualDraft={manualDraft}
                                  onManualCreatureChange={(nextCreature) =>
                                                          handleManualCreatureChange({
                                                            nextCreature,
                                                            setManualDraft,
                                                          })
                                                        }
                                />
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

                    {!actionOpen && !hasPreTurnQueue && !manualMode && !endOfEncounter && (
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
                    {actionOpen && encounterData && currentTurnCreature && !hasPreTurnQueue
                        && !manualMode && !endOfEncounter && (
                        <div style={{
                            position: "absolute",
                            top: 0,
                            right: 0,
                            height: "100%",
                            width: "20%",
                            minWidth: "220px",
                            maxWidth: "320px",
                            zIndex: 20,
                            display: "flex",
                            flexDirection: "column",
                        }}>
                            <div style={{
                                flex: 1,
                                background: "#222222",
                                color: "white",
                                borderLeft: "1px solid #ccc",
                                overflowY: "auto",
                                padding: "12px",
                            }}>
                                <ActionList
                                  cid={getCreatureCid(currentTurnCreature)}
                                  eid={eid}
                                  handleActionSubmission={handleSubmitAction}
                                  onSelectManual={handleSetManualState}
                                />
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

                    {activeEncounter && currentTurnCreature && (
                        <Card className="text-white "
                              style={{
                                  position: "absolute",
                                  bottom: 16,
                                  left: "50%",
                                  transform: "translateX(-50%)",
                                  zIndex: 15,
                                  width: "30%",
                                  backgroundColor: "rgba(15, 24, 40, 0.75)",
                                  backdropFilter: "blur(6px)",
                                  WebkitBackdropFilter: "blur(6px)",
                                  border: "none",
                                  outline: "none",
                                  boxShadow: "none"
                              }}
                        >
                            <Card.Body>
                                <Row>
                                    <Col lg={2}>
                                        <Orb
                                            hoverIntensity={2}
                                            rotateOnHover={false}
                                            hue={0}
                                            forceHoverState={false}
                                            backgroundColor="#100000"
                                        />
                                    </Col>
                                    <Col xs="auto" >
                                        {hasPreTurnQueue && encounterData && !endOfEncounter && actionExecutionSession ? (
                                          <>
                                            <Card.Title>Resolve Pre-Turn Effects</Card.Title>
                                            <Card.Text>
                                              {preTurnQueue.length} remaining for this creature.
                                            </Card.Text>

                                            <InputHandler
                                              encounter={encounterData}
                                              actionSession={actionExecutionSession}
                                              setActionExecutionSession={setActionExecutionSession}
                                              setManualLock={setManualLock}
                                              clearManualAoePreview={handleClearManualAoePreview}
                                              handleActionExecution={handleExecutePreTurn}
                                              aoePlacementStage="ready"
                                              onExit={handleExitPreTurn}
                                            />
                                          </>
                                        ) : manualMode ? (
                                            <Card.Text>Manual Mode</Card.Text>
                                        ) : encounterData && actionExecutionSession ? (
                                            <InputHandler
                                              encounter={encounterData}
                                              actionSession={actionExecutionSession}
                                              setActionExecutionSession={setActionExecutionSession}
                                              setManualLock={setManualLock}
                                              clearManualAoePreview={handleClearManualAoePreview}
                                              handleActionExecution={handleExecuteAction}
                                              aoePlacementStage={manualAoePlacement?.stage ?? "ready"}
                                            />
                                        ) : !endOfEncounter ? (
                                                <Recommendation
                                                  eid={eid}
                                                  cid={getCreatureCid(currentTurnCreature)}
                                                  setAoeTokens={setAoeTokens}
                                                  buildRecommendationAoeToken={handleBuildRecommendationAoeToken}
                                                  handlePASubmission={handleSubmitRecommendation}
                                                  key={recommendRefreshKey}
                                                />
                                        ) : (
                                            <>
                                                <h5>End of Encounter!</h5>
                                            </>
                                        )}
                                    </Col>
                                </Row>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>
        </Container>
    );
}

export default EncounterSimulation;

