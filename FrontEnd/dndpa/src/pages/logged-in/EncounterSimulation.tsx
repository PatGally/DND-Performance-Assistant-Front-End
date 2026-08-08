import {useCallback, useEffect, useMemo, useRef, useState} from "react";
import '../../css/EncounterSimulation.css'
import {ArrowLeftShort, ArrowRightShort} from "react-bootstrap-icons";
import axiosTokenInstance from "../../api/AxiosTokenInstance.ts";
import {useLocation} from "react-router-dom";

import ActiveMap from "../../components/ActiveEncounter/ActiveMap.tsx";
import InitiativeList from "../../components/ActiveEncounter/InitiativeList.tsx";
import ActionList from "../../components/ActiveEncounter/ActionList.tsx";
import Recommendation from "../../components/ActiveEncounter/Recommendation.tsx";
import InputHandler from "../../components/ActiveEncounter/InputHandler.tsx";
import MultiAttackInputHandler from "../../components/ActiveEncounter/MultiAttackInputHandler.tsx";
import ConcentrationCheckPanel, {
    type PendingConcentrationCheck,
} from "../../components/ActiveEncounter/ConcentrationCheckPanel.tsx";

import {
    getCreatureCid,
    getCurrentTurnCreatureFromEncounter,
    isLairActionEntry
} from "../../utils/ActiveSimUtils/CreatureHelpers.ts";

import {getEncounter} from "../../api/EncounterGet.ts";
import {isPlayerCreature} from "../../api/CreatureGet.ts";

import type {Creature, GridCoord} from "../../types/creature.ts";
import type {CreatureAction} from "../../types/action.ts";
import type { MultiattackDefinition, MultiattackRecommendation } from "../../types/multiattack.ts";
import { hasMultiattackDefinition } from "../../types/multiattack.ts";
import type {
    Encounter,
    ActionExecutionSession, ActionRequestDraft, ManualDraftState,
    AoeToken, ManualAoePlacement,
    PendingPreTurnResolution, RecommendationTarget
} from "../../types/SimulationTypes.ts";
import type { EncounterFull, EncounterResult } from "../../types/encounter.ts";

import ExitSimulation from "../../components/ActiveEncounter/ExitSimulation.tsx";
import {
    buildPreTurnSession,
    syncPreTurnQueueFromCreature
} from "../../utils/ActiveSimUtils/PreTurnHelpers.ts";
import {loadActions} from "../../utils/ActiveSimUtils/actionHelpers.ts";
import {onPanEnd, onPanMove, onPanStart, onWheel} from "../../utils/ActiveSimUtils/panningHelpers.ts";
import {onTouchStart, onTouchEnd, onTouchMove} from '../../utils/ActiveSimUtils/PinchingHelpers.ts'
import {
    clearManualState, handleManualCreatureChange,
    handleManualSimulate
} from "../../utils/ActiveSimUtils/manualHelpers.ts";
import { useEncounterSimulationCallbacks } from "../../hooks/ActiveSimHooks.ts";

function getPendingConcentrationChecks(
    encounter: Encounter | undefined
): PendingConcentrationCheck[] {
    if (!encounter) return [];

    const results = (
        encounter as Encounter & {
            results?: Array<{ concentrationChecks?: unknown }>;
        }
    ).results;

    if (!Array.isArray(results)) return [];

    const pending: PendingConcentrationCheck[] = [];
    for (const result of results) {
        if (!result || !Array.isArray(result.concentrationChecks)) continue;

        for (const rawCheck of result.concentrationChecks) {
            if (!rawCheck || typeof rawCheck !== "object") continue;
            const check = rawCheck as Partial<PendingConcentrationCheck>;

            if (
                typeof check.checkID !== "string" ||
                typeof check.cid !== "string" ||
                typeof check.damage !== "number" ||
                typeof check.dc !== "number" ||
                check.required !== true ||
                check.resolved === true ||
                check.cancelled === true
            ) {
                continue;
            }

            pending.push(check as PendingConcentrationCheck);
        }
    }

    return pending;
}

function EncounterSimulation() {
    const location = useLocation();
    const eid = location.state?.eid;

    //Side homeComponents
    const [initiativeOpen, setInitiativeOpen] = useState(true);
    const [initiativeRefreshKey, setInitiativeRefreshKey] = useState(0);
    const [recommendRefreshKey, setRecommendRefreshKey] = useState(0);
    const latestHoverRequestRef = useRef(0);
    const didHydrateInitialPreTurnRef = useRef(false);
    const [actionOpen, setActionOpen] = useState(true);

    //Pre/post enc logic
    const [encStart, setEncStart] = useState(false);
    const [activeEncounter, setActiveEncounter] = useState(true);
    const [endOfEncounter, setEndOfEncounter] = useState(false);

    const [encounterData, setEncounterData] = useState<Encounter>();
    const [loadingEncounter, setLoadingEncounter] = useState(true);
    const [encounterError, setEncounterError] = useState<string | null>(null);
    const [currentTurnCreature, setCurrentTurnCreature] = useState<Creature>();
    const [aoeTokens, setAoeTokens] = useState<AoeToken[]>([]);
    const [movementPreviewCells, setMovementPreviewCells] = useState<GridCoord[]>([]);
    const [recommendationMovementCells, setRecommendationMovementCells] = useState<GridCoord[]>([]);
    const [manualAoePlacement, setManualAoePlacement] = useState<ManualAoePlacement | null>(null);

    //selectedCID used for token selection
    const [selectedCID, setSelectedCID] = useState<string | null>(null);
    const [currentTurnActions, setCurrentTurnActions] = useState<CreatureAction[]>();
    //Locks the top three buttons
    const [actionExecutionSession, setActionExecutionSession] = useState<ActionExecutionSession>();
    const [pendingMultiattack, setPendingMultiattack] = useState<{
        definition: MultiattackDefinition;
        recommendation?: MultiattackRecommendation;
    }>();
    const [handlingNextTurn, setHandlingNextTurn] = useState(false);
    const [preTurnQueue, setPreTurnQueue] = useState<PendingPreTurnResolution[]>([]);
    const [manualLock, setManualLock] = useState(false);
    const [manualMode, setManualMode] = useState(false);
    const [manualDraft, setManualDraft] = useState<ManualDraftState>({
        affectedCreatures: [],
    });
    const [initiativeExpandedCid, setInitiativeExpandedCid] = useState<string | null>(null);
    const hasPreTurnQueue = preTurnQueue.length > 0;
    const pendingConcentrationChecks = useMemo(
        () => getPendingConcentrationChecks(encounterData),
        [encounterData]
    );
    const hasPendingConcentrationChecks = pendingConcentrationChecks.length > 0;
    const encounterResults = useMemo<EncounterResult[]>(() => {
        const results = (
            encounterData as
                | (Encounter & { results?: EncounterResult[] })
                | undefined
        )?.results;

        return Array.isArray(results) ? results : [];
    }, [encounterData]);
    const [isLairAction, setIsLairAction] = useState(false);

    //Finger Scroll/ Touch Screen state
    const lastPinchDist = useRef<number | null>(null);
    const lastPinchMid = useRef<{ x: number; y: number } | null>(null);
    const touchStartPos = useRef<{ x: number; y: number } | null>(null);
    const didPan = useRef<boolean>(false);
    const suppressNextClick = useRef<boolean>(false);

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
        handleManualMovementSelect, handleActiveMapGridCellClick, handleActiveMapGridCellHover, handleBuildRecommendationAoeToken,
        handleSubmitAction, handleSubmitRecommendation, handleExecuteAction,
        handleExecutePreTurn, handleSimStart, handleNextTurnWrapper, handleExitPreTurn, movementHighlightAnchors,
    } = useEncounterSimulationCallbacks({
        eid, encounterData, currentTurnCreature, currentTurnActions, actionExecutionSession, aoeTokens,
        manualAoePlacement, manualDraft, preTurnQueue, latestHoverRequestRef, hasPreTurnQueue, manualMode,
        handlingNextTurn, endOfEncounter, encStart, activeEncounter, selectedCID, setAoeTokens, setManualAoePlacement,
        setMovementPreviewCells, setManualMode, setInitiativeOpen, setActionOpen, setManualDraft, setInitiativeExpandedCid, setSelectedCID,
        setManualLock, setActionExecutionSession, setEncounterData, setCurrentTurnCreature, setPreTurnQueue,
        setRecommendRefreshKey, setInitiativeRefreshKey, setEncStart, setActiveEncounter, setHandlingNextTurn,
    });

    const refreshEncounterState = useCallback(async () => {
        const refreshedEncounter = await getEncounter(eid);
        if (!refreshedEncounter) return;

        const nextEncounter = refreshedEncounter as unknown as Encounter;
        setEncounterData(nextEncounter);

        const refreshedCurrentCreature =
            getCurrentTurnCreatureFromEncounter(nextEncounter);

        if (refreshedCurrentCreature) {
            setCurrentTurnCreature(refreshedCurrentCreature);
        }

        setInitiativeRefreshKey((value) => value + 1);
        setRecommendRefreshKey((value) => value + 1);
    }, [eid]);

    const handleEncounterChange = useCallback(
        (updatedEncounter: EncounterFull) => {
            const nextEncounter = updatedEncounter as unknown as Encounter;
            setEncounterData(nextEncounter);

            const refreshedCurrentCreature =
                getCurrentTurnCreatureFromEncounter(nextEncounter);

            if (refreshedCurrentCreature) {
                setCurrentTurnCreature(refreshedCurrentCreature);
            }

            setInitiativeRefreshKey((value) => value + 1);
            setRecommendRefreshKey((value) => value + 1);
        },
        []
    );

    const handleExecuteActionAndRefresh = useCallback(
        async (draft: ActionRequestDraft): Promise<void | string> => {
            const executionError = await handleExecuteAction(draft);
            if (typeof executionError !== "string" || executionError.trim() === "") {
                await refreshEncounterState();
            }
            return executionError;
        },
        [handleExecuteAction, refreshEncounterState]
    );

    const handleExecutePreTurnAndRefresh = useCallback(
        async (draft: ActionRequestDraft): Promise<void | string> => {
            // handlePreTurnExecution already refreshes encounter state and removes
            // exactly one queue item. Re-syncing from the creature here would
            // immediately re-add an unresolved lingSave/lingEffect in the same turn.
            return handleExecutePreTurn(draft);
        },
        [handleExecutePreTurn]
    );

    const handleActionSelection = useCallback((action: CreatureAction) => {
        setRecommendationMovementCells([]);

        if (hasMultiattackDefinition(action)) {
            setPendingMultiattack({ definition: action.multiattack });
            setActionOpen(false);
            setManualLock(true);
            return;
        }

        handleSubmitAction(action);
    }, [handleSubmitAction]);

    const handleRecommendationSelection = useCallback((
        name: string,
        prob: number,
        eDam: number,
        impact: number,
        overallRank: number,
        baseWeight: number,
        mlWeight: number,
        useML: boolean,
        finalWeight: number,
        candidateCount: number,
        targets: RecommendationTarget,
        previewResultID?: string,
        multiattack?: MultiattackDefinition
    ) => {
        setRecommendationMovementCells([]);

        if (multiattack) {
            setPendingMultiattack({
                definition: multiattack,
                recommendation: {
                    definition: multiattack,
                    prob,
                    eDam,
                    impact,
                    overallRank,
                    baseWeight,
                    mlWeight: mlWeight ?? null,
                    finalWeight,
                    candidateCount,
                    target: targets,
                },
            });
            setActionOpen(false);
            setManualLock(true);
            return;
        }

        handleSubmitRecommendation(
            name,
            prob,
            eDam,
            impact,
            overallRank,
            baseWeight,
            mlWeight,
            useML,
            finalWeight,
            candidateCount,
            targets,
            recommendationMovementCells,
            previewResultID
        );
    }, [handleSubmitRecommendation, recommendationMovementCells]);

    const handleMultiattackComplete = useCallback(async () => {
        await refreshEncounterState();
        setPendingMultiattack(undefined);
        setManualLock(false);
    }, [refreshEncounterState]);

    const loadEndOfEncounter = async (): Promise<void> => {
        try {
            const response = await axiosTokenInstance.get(`/encounter/${eid}/completed`);
            if (response.data.isEnd) {
                setEndOfEncounter(true);
            }
        }
        catch(e) {
            console.error(e);
        }
    }

    //ONLOAD EFFECTS
    useEffect(() => {
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

                setEncounterData(data as unknown as Encounter);
            } catch (error) {
                console.error("Failed to load encounter:", error);
                setEncounterError("Failed to load encounter data.");
                setEncounterData(undefined);
            } finally {
                setLoadingEncounter(false);
            }
        };
        loadEndOfEncounter();
        if (!endOfEncounter) {
            loadEncounter();
        }
    }, []);
    useEffect(() => {
        // Encounter lifecycle is explicit; token placement only controls whether Start can succeed.
        if (!encounterData || loadingEncounter || encounterError) return;

        const startedKey = `${eid}/started`;
        const storedStarted = localStorage.getItem(startedKey);

        if (storedStarted === null) {
            localStorage.setItem(startedKey, "false");
        }

        if (storedStarted !== "true") {
            setEncStart(true);
            setActiveEncounter(false);
            setCurrentTurnCreature(undefined);
            return;
        }

        setEncStart(false);
        setActiveEncounter(true);

        const storedTurn = getCurrentTurnCreatureFromEncounter(encounterData);

        if (storedTurn) {
            setCurrentTurnCreature(storedTurn);

            if (!didHydrateInitialPreTurnRef.current) {
                syncPreTurnQueueFromCreature(setPreTurnQueue, storedTurn);
                didHydrateInitialPreTurnRef.current = true;
            }

            return;
        }

        const firstInitiativeEntry = encounterData.initiative?.[0];
        if (
            firstInitiativeEntry &&
            isLairActionEntry(firstInitiativeEntry)
        ) {
            setCurrentTurnCreature(
                { _isLairAction: true } as unknown as Creature
            );
        }
    }, [eid, encounterData, loadingEncounter, encounterError]);

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
        setMovementPreviewCells([]);
    }, [selectedCID, currentTurnCreature, manualAoePlacement, actionExecutionSession]);
    useEffect(() => {

        if (!currentTurnCreature) return;
        if ((currentTurnCreature as any)._isLairAction) {
            setManualMode(true);
            setInitiativeOpen(true);
            setActionOpen(false);
            clearManualState({setManualDraft, setInitiativeExpandedCid, setSelectedCID});
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
        loadEndOfEncounter()
    }, [encounterData, currentTurnCreature]);

    return (
        <div className="pa-enc">
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
                    onTouchStart={(e) =>
                        onTouchStart(e, isPanning, lastPanPos, lastPinchDist, lastPinchMid,
                            touchStartPos, didPan)
                    }
                    onTouchMove={(e) =>
                        onTouchMove(e, isPanning, lastPanPos, lastPinchDist, lastPinchMid,
                            touchStartPos, didPan, mapViewportRef, mapContentRef,
                            pan, zoom, mapNaturalWidth, mapNaturalHeight, MIN_ZOOM, MAX_ZOOM)
                    }
                    onTouchEnd={(e) =>
                        onTouchEnd(e, isPanning, lastPanPos, lastPinchDist, lastPinchMid,
                            touchStartPos, didPan, suppressNextClick, mapViewportRef)
                    }
                    onTouchCancel={(e) =>
                        onTouchEnd(e, isPanning, lastPanPos, lastPinchDist, lastPinchMid,
                            touchStartPos, didPan, suppressNextClick, mapViewportRef)
                    }
                >
                    <div
                        ref={mapContentRef}
                        className="pa-enc__map-content"
                        style={{
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
                                movementHighlightAnchors={movementHighlightAnchors}
                                movementPreviewCells={movementPreviewCells}
                                recommendationMovementCells={recommendationMovementCells}
                                recommendationCreatureCID={
                                    currentTurnCreature ? getCreatureCid(currentTurnCreature) : null
                                }
                                onTokenSelect={handleActiveMapTokenSelect}
                                onGridCellClick={handleActiveMapGridCellClick}
                                onGridCellHover={handleActiveMapGridCellHover}
                                onMapSizeLoaded={handleMapSizeLoaded}
                            />
                        )}
                    </div>
                </div>
            </div>

            <header className="pa-enc__header">
                <div className="pa-enc__header-title">
                    <h3 className="pa-enc__title-text">
                        {encounterData
                            ? `${encounterData.name} Simulation`
                            : 'Encounter Simulation'}
                    </h3>
                </div>

                <div className="pa-enc__header-controls">
                    {activeEncounter && !endOfEncounter && (currentTurnCreature || isLairAction) && (
                        <>
                            <div className="pa-enc__turn-label">
                                {isLairAction ? (
                                    <span className="pa-enc__turn-label-value">
                                        Lair Action
                                    </span>
                                ) : currentTurnCreature ? (
                                    <>
                                        <span className="pa-enc__turn-label-prefix">
                                            Current Turn:
                                        </span>{" "}
                                        <span className="pa-enc__turn-label-value">
                                            {isPlayerCreature(currentTurnCreature)
                                                ? currentTurnCreature.stats.name
                                                : currentTurnCreature.name}
                                        </span>
                                    </>
                                ) : null}
                            </div>

                            <button
                                type="button"
                                className="pa-enc__btn pa-enc__btn--ghost"
                                aria-pressed={!manualMode}
                                disabled={isLairAction || actionExecutionSession !== undefined || pendingMultiattack !== undefined || hasPendingConcentrationChecks}
                                onClick={() => {
                                    setManualMode(false);
                                    clearManualState({
                                        setManualDraft,
                                        setInitiativeExpandedCid,
                                        setSelectedCID,
                                    });
                                }}
                            >
                                Ruleset
                            </button>

                            <button
                                type="button"
                                className="pa-enc__btn pa-enc__btn--ghost"
                                aria-pressed={manualMode}
                                disabled={actionExecutionSession !== undefined || pendingMultiattack !== undefined || hasPendingConcentrationChecks || handlingNextTurn || manualLock}
                                onClick={handleSetManualState}
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
                                            setInitiativeRefreshKey, setSelectedCID,
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
                                    disabled={actionExecutionSession !== undefined || pendingMultiattack !== undefined || hasPreTurnQueue || hasPendingConcentrationChecks}
                                    onClick={handleNextTurnWrapper}
                                >
                                    Next Turn
                                </button>
                            )}
                        </>
                    )}

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


            {!initiativeOpen && !endOfEncounter && !encStart && activeEncounter && (
                <button
                    type="button"
                    className="pa-enc__edge-pill pa-enc__edge-pill--left"
                    onClick={() => setInitiativeOpen(true)}
                    aria-label="Open initiative list"
                >
                    <ArrowRightShort />
                </button>
            )}

            {initiativeOpen && !endOfEncounter && !encStart && activeEncounter && (
                <aside className="pa-enc__side-panel pa-enc__side-panel--left">
                    <div className="pa-enc__side-panel-inner pa-enc__side-panel--left--border">
                        <InitiativeList
                            key={`${eid}-${initiativeRefreshKey}`}
                            eid={eid}
                            manualMode={manualMode}
                            expandedCid={initiativeExpandedCid}
                            onExpandedCidChange={setInitiativeExpandedCid}
                            manualDraft={manualDraft}
                            results={encounterResults}
                            onEncounterChange={handleEncounterChange}
                            selectedCID={selectedCID}
                            onManualMovementSelect={handleManualMovementSelect}
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

            {!actionOpen && !pendingMultiattack && !hasPreTurnQueue && !hasPendingConcentrationChecks && !manualMode && !endOfEncounter && (
                <button
                    type="button"
                    className="pa-enc__edge-pill pa-enc__edge-pill--right"
                    onClick={() => setActionOpen(true)}
                    aria-label="Open action list"
                >
                    <ArrowLeftShort />
                </button>
            )}

            {actionOpen && encounterData && currentTurnCreature && !pendingMultiattack && !hasPreTurnQueue
                && !hasPendingConcentrationChecks && !manualMode && !endOfEncounter && (
                    <aside className="pa-enc__side-panel pa-enc__side-panel--right">
                        <div className="pa-enc__side-panel-inner pa-enc__side-panel--right--border">
                            <ActionList
                                cid={getCreatureCid(currentTurnCreature)}
                                eid={eid}
                                handleActionSubmission={handleActionSelection}
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

            {activeEncounter && currentTurnCreature && (
                <div className="pa-enc__bottom-card">
                    {hasPendingConcentrationChecks && encounterData && !endOfEncounter ? (
                        <ConcentrationCheckPanel
                            eid={eid}
                            checks={pendingConcentrationChecks}
                            onResolved={refreshEncounterState}
                        />
                    ) : hasPreTurnQueue && encounterData && !endOfEncounter && actionExecutionSession ? (
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
                                handleActionExecution={handleExecutePreTurnAndRefresh}
                                aoePlacementStage="ready"
                                onExit={handleExitPreTurn}
                            />
                        </>
                    ) : manualMode ? (
                        <div className="pa-enc__bottom-card-title">Manual Mode</div>
                    ) : encounterData && pendingMultiattack ? (
                        <MultiAttackInputHandler
                            eid={eid}
                            actorCid={getCreatureCid(currentTurnCreature)}
                            encounter={encounterData}
                            definition={pendingMultiattack.definition}
                            recommendation={pendingMultiattack.recommendation}
                            onCancel={() => {
                                setPendingMultiattack(undefined);
                                setManualLock(false);
                            }}
                            onComplete={handleMultiattackComplete}
                        />
                    ) : encounterData && actionExecutionSession ? (
                        <InputHandler
                            encounter={encounterData}
                            actionSession={actionExecutionSession}
                            setActionExecutionSession={setActionExecutionSession}
                            setManualLock={setManualLock}
                            clearManualAoePreview={handleClearManualAoePreview}
                            handleActionExecution={handleExecuteActionAndRefresh}
                            aoePlacementStage={manualAoePlacement?.stage ?? 'ready'}
                        />
                    ) : encounterData && !endOfEncounter ? (
                        <Recommendation
                            eid={eid}
                            cid={getCreatureCid(currentTurnCreature)}
                            encounter={encounterData}
                            setAoeTokens={setAoeTokens}
                            buildRecommendationAoeToken={handleBuildRecommendationAoeToken}
                            onMovementRecommendationChange={setRecommendationMovementCells}
                            handlePASubmission={handleRecommendationSelection}
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