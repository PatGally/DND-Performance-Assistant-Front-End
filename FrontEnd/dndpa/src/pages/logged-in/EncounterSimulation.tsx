import {useCallback, useEffect, useRef, useState} from "react";
import '../../css/EncounterSimulation.css'
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

    //Side HomePage-Components
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
        <div className="pa-enc">
            {/* ===== MAP LAYER (fills the whole page, header floats above) ===== */}
            <div className="pa-enc__map-layer">
                <div
                    ref={mapViewportRef}
                    className="pa-enc__map-viewport"
                    onMouseDown={(e) => onPanStart(e, isPanning, lastPanPos, mapViewportRef)}
                    onMouseMove={(e) =>
                        onPanMove(e, isPanning, lastPanPos, mapViewportRef, mapContentRef,
                            pan, zoom, mapNaturalWidth, mapNaturalHeight)
                    }
                    onMouseUp={() => onPanEnd(isPanning, mapViewportRef)}
                    onMouseLeave={() => onPanEnd(isPanning, mapViewportRef)}
                    onWheel={(e) =>
                        onWheel(e, mapViewportRef, mapContentRef, pan, zoom,
                            mapNaturalWidth, mapNaturalHeight, MIN_ZOOM, MAX_ZOOM)
                    }
                >
                    <div
                        ref={mapContentRef}
                        className="pa-enc__map-content"
                        style={{
                            // Transform stays inline — it's dynamic per-frame
                            transform: `translate(${pan.current.x}px, ${pan.current.y}px) scale(${zoom})`,
                        }}
                    >
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
            </div>

            {/* ===== HEADER (transparent gradient, floats over the map) ===== */}
            <header className="pa-enc__header">
                <div className="pa-enc__header-title">
                    <h3 className="pa-enc__title-text">
                        {encounterData
                            ? `${encounterData.name} Simulation`
                            : 'Encounter Simulation'}
                    </h3>
                </div>

                <div className="pa-enc__header-controls">
                    {/* Active-encounter control cluster: visible when sim is running.
                    Disabled states are driven by the same flags as before. */}
                    {activeEncounter && !endOfEncounter && (currentTurnCreature || isLairAction) && (
                        <>
                            <div className="pa-enc__turn-label">
                                {currentTurnCreature ? (
                                    <>
                                        <span className="pa-enc__turn-label-prefix">Current Turn:</span>{' '}
                                        <span className="pa-enc__turn-label-value">
                                        {isPlayerCreature(currentTurnCreature)
                                            ? currentTurnCreature.stats.name
                                            : currentTurnCreature.name}
                                    </span>
                                    </>
                                ) : (
                                    <span className="pa-enc__turn-label-value">Lair Action</span>
                                )}
                            </div>

                            <button
                                type="button"
                                className="pa-enc__btn pa-enc__btn--ghost"
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
                                type="button"
                                className="pa-enc__btn pa-enc__btn--ghost"
                                disabled={actionExecutionSession !== undefined || handlingNextTurn || manualLock}
                                onClick={() => setManualState({
                                    actionExecutionSession, latestHoverRequestRef,
                                    setAoeTokens, setManualAoePlacement, setManualMode,
                                    setInitiativeOpen, setActionOpen, setManualDraft, setInitiativeExpandedCid
                                })}
                            >
                                Manual
                            </button>

                            {manualMode && (
                                <button
                                    type="button"
                                    className="pa-enc__btn pa-enc__btn--primary"
                                    onClick={() =>
                                        handleManualSimulate({
                                            manualLock, manualMode, eid, manualDraft,
                                            setManualLock, setEncounterData, setCurrentTurnCreature,
                                            setManualDraft, setInitiativeExpandedCid, setManualMode,
                                            setInitiativeRefreshKey,
                                        })
                                    }
                                >
                                    Submit
                                </button>
                            )}

                            {!manualMode && (
                                <button
                                    type="button"
                                    className="pa-enc__btn pa-enc__btn--primary"
                                    disabled={actionExecutionSession !== undefined || hasPreTurnQueue}
                                    onClick={handleNextTurnWrapper}
                                >
                                    Next Turn
                                </button>
                            )}
                        </>
                    )}

                    {/* Start button: shown before the encounter is active */}
                    {encStart && !activeEncounter && (
                        <button
                            type="button"
                            className="pa-enc__btn pa-enc__btn--primary"
                            onClick={handleSimStart}
                        >
                            Start!
                        </button>
                    )}

                    <div className="pa-enc__exit-slot">
                        <ExitSimulation />
                    </div>
                </div>
            </header>

            {/* ===== LEFT PILL — toggle Initiative panel ===== */}
            {!initiativeOpen && (
                <button
                    type="button"
                    className="pa-enc__edge-pill pa-enc__edge-pill--left"
                    onClick={() => setInitiativeOpen(true)}
                    aria-label="Open initiative list"
                >
                    <ArrowRightShort />
                </button>
            )}

            {/* ===== LEFT PANEL — Initiative list ===== */}
            {initiativeOpen && (
                <aside className="pa-enc__side-panel pa-enc__side-panel--left">
                    <div className="pa-enc__side-panel-inner pa-enc__side-panel--left--border">
                        <InitiativeList
                            key={`${eid}-${initiativeRefreshKey}`}
                            eid={eid}
                            manualMode={manualMode}
                            expandedCid={initiativeExpandedCid}
                            onExpandedCidChange={setInitiativeExpandedCid}
                            manualDraft={manualDraft}
                            onManualCreatureChange={(nextCreature) =>
                                handleManualCreatureChange({ nextCreature, setManualDraft })
                            }
                        />
                    </div>

                    <button
                        type="button"
                        className="pa-enc__edge-pill pa-enc__edge-pill--left-close"
                        onClick={() => setInitiativeOpen(false)}
                        aria-label="Close initiative list"
                    >
                        <ArrowLeftShort />
                    </button>
                </aside>
            )}

            {/* ===== RIGHT PILL — toggle Action panel ===== */}
            {!actionOpen && !hasPreTurnQueue && !manualMode && !endOfEncounter && (
                <button
                    type="button"
                    className="pa-enc__edge-pill pa-enc__edge-pill--right"
                    onClick={() => setActionOpen(true)}
                    aria-label="Open action list"
                >
                    <ArrowLeftShort />
                </button>
            )}

            {/* ===== RIGHT PANEL — Action list ===== */}
            {actionOpen && encounterData && currentTurnCreature && !hasPreTurnQueue
                && !manualMode && !endOfEncounter && (
                    <aside className="pa-enc__side-panel pa-enc__side-panel--right">
                        <div className="pa-enc__side-panel-inner pa-enc__side-panel--right--border">
                            <ActionList
                                cid={getCreatureCid(currentTurnCreature)}
                                eid={eid}
                                handleActionSubmission={handleSubmitAction}
                                onSelectManual={handleSetManualState}
                            />
                        </div>

                        <button
                            type="button"
                            className="pa-enc__edge-pill pa-enc__edge-pill--right-close"
                            onClick={() => setActionOpen(false)}
                            aria-label="Close action list"
                        >
                            <ArrowRightShort />
                        </button>
                    </aside>
                )}

            {/* ===== BOTTOM CARD — Recommendation / InputHandler ===== */}
            {activeEncounter && currentTurnCreature && (
                <div className="pa-enc__bottom-card">
                    {hasPreTurnQueue && encounterData && !endOfEncounter && actionExecutionSession ? (
                        <>
                            <div className="pa-enc__bottom-card-title">Resolve Pre-Turn Effects</div>
                            <div className="pa-enc__bottom-card-subtitle">
                                {preTurnQueue.length} remaining for this creature.
                            </div>

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
                        <div className="pa-enc__bottom-card-title">Manual Mode</div>
                    ) : encounterData && actionExecutionSession ? (
                        <InputHandler
                            encounter={encounterData}
                            actionSession={actionExecutionSession}
                            setActionExecutionSession={setActionExecutionSession}
                            setManualLock={setManualLock}
                            clearManualAoePreview={handleClearManualAoePreview}
                            handleActionExecution={handleExecuteAction}
                            aoePlacementStage={manualAoePlacement?.stage ?? 'ready'}
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
                        <div className="pa-enc__bottom-card-title">End of Encounter!</div>
                    )}
                </div>
            )}
        </div>
    );
}

export default EncounterSimulation;

