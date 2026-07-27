import { useCallback, useMemo, type Dispatch, type MutableRefObject, type SetStateAction } from "react";

import type { Creature, GridCoord } from "../types/creature.ts";
import type { CreatureAction } from "../types/action.ts";
import type {
  Encounter,
  ActionRequestDraft,
  ActionExecutionSession,
  ManualDraftState,
  RecommendationTarget,
  AoeToken,
  ManualAoePlacement,
  PendingPreTurnResolution,
  Recommendation as RecommendationType,
} from "../types/SimulationTypes.ts";

import {
  clearManualAoePreview,
  setManualState,
} from "../utils/ActiveSimUtils/manualHelpers.ts";

import {
  buildRecommendationAoeToken,
  getReachableMovementAnchors,
  handleGridCellClick,
  handleGridCellHover,
  handleTokenSelect,
  selectManualMovementCreature,
} from "../utils/ActiveSimUtils/tokenHelpers.ts";

import {
  handleActionSubmission,
  handlePASubmission,
  handleActionExecution,
  handlePreTurnExecution,
} from "../utils/ActiveSimUtils/actionHelpers.ts";

import {
  simStart,
  handleNextTurn,
  handlePreTurnBack,
} from "../utils/ActiveSimUtils/simHelpers.ts";

type StateSetter<T> = Dispatch<SetStateAction<T>>;

export type UseEncounterSimulationCallbacksParams = {
  eid?: string;

  encounterData?: Encounter;
  currentTurnCreature?: Creature;
  currentTurnActions?: CreatureAction[];
  actionExecutionSession?: ActionExecutionSession;
  aoeTokens: AoeToken[];
  manualAoePlacement: ManualAoePlacement | null;
  manualDraft: ManualDraftState;
  preTurnQueue: PendingPreTurnResolution[];

  latestHoverRequestRef: MutableRefObject<number>;

  hasPreTurnQueue: boolean;
  manualMode: boolean;
  handlingNextTurn: boolean;
  endOfEncounter: boolean;
  encStart: boolean;
  activeEncounter: boolean;

  selectedCID: string | null;

  setAoeTokens: StateSetter<AoeToken[]>;
  setMovementPreviewCells: StateSetter<GridCoord[]>;
  setManualAoePlacement: StateSetter<ManualAoePlacement | null>;
  setManualMode: StateSetter<boolean>;
  setInitiativeOpen: StateSetter<boolean>;
  setActionOpen: StateSetter<boolean>;
  setManualDraft: StateSetter<ManualDraftState>;
  setInitiativeExpandedCid: StateSetter<string | null>;
  setSelectedCID: StateSetter<string | null>;

  setManualLock: StateSetter<boolean>;
  setActionExecutionSession: StateSetter<ActionExecutionSession | undefined>;

  setEncounterData: StateSetter<Encounter | undefined>;
  setCurrentTurnCreature: StateSetter<Creature | undefined>;
  setPreTurnQueue: StateSetter<PendingPreTurnResolution[]>;
  setRecommendRefreshKey: StateSetter<number>;
  setInitiativeRefreshKey: StateSetter<number>;

  setEncStart: StateSetter<boolean>;
  setActiveEncounter: StateSetter<boolean>;
  setHandlingNextTurn: StateSetter<boolean>;
};

export function useEncounterSimulationCallbacks({
  eid,

  encounterData,
  currentTurnCreature,
  currentTurnActions,
  actionExecutionSession,
  aoeTokens,
  manualAoePlacement,
  preTurnQueue,

  latestHoverRequestRef,

  hasPreTurnQueue,
  manualMode,
  handlingNextTurn,
  endOfEncounter,
  encStart,
  activeEncounter,

  selectedCID,

  setAoeTokens,
  setMovementPreviewCells,
  setManualAoePlacement,
  setManualMode,
  setInitiativeOpen,
  setActionOpen,
  setManualDraft,
  setInitiativeExpandedCid,
  setSelectedCID,

  setManualLock,
  setActionExecutionSession,

  setEncounterData,
  setCurrentTurnCreature,
  setPreTurnQueue,
  setRecommendRefreshKey,
  setInitiativeRefreshKey,

  setEncStart,
  setActiveEncounter,
  setHandlingNextTurn,
}: UseEncounterSimulationCallbacksParams) {
  const movementHighlightAnchors = useMemo(
    () =>
      getReachableMovementAnchors({
        encounterData,
        currentTurnCreature,
        selectedCID,
        setupMode: encStart && !activeEncounter,
      }),
    [encounterData, currentTurnCreature, selectedCID, encStart, activeEncounter]
  );

  const handleSetManualState = useCallback(() => {
    setManualState({
      actionExecutionSession,
      latestHoverRequestRef,
      setAoeTokens,
      setManualAoePlacement,
      setManualMode,
      setInitiativeOpen,
      setActionOpen,
      setManualDraft,
      setInitiativeExpandedCid,
      setSelectedCID,
    });
  }, [
    actionExecutionSession,
    latestHoverRequestRef,
    setAoeTokens,
    setManualAoePlacement,
    setManualMode,
    setInitiativeOpen,
    setActionOpen,
    setManualDraft,
    setInitiativeExpandedCid,
    setSelectedCID,
  ]);

  const handleClearManualAoePreview = useCallback(() => {
    clearManualAoePreview({
      resultID: actionExecutionSession?.draft.resultID,
      latestHoverRequestRef,
      setAoeTokens,
      setManualAoePlacement,
    });
  }, [
    actionExecutionSession,
    latestHoverRequestRef,
    setAoeTokens,
    setManualAoePlacement,
  ]);

  const handleActiveMapTokenSelect = useCallback((cid: string) => {
    setMovementPreviewCells([]);

    handleTokenSelect({
      cid,
      encounterData,
      actionExecutionSession,
      hasPreTurnQueue,
      manualMode,
      setupMode: encStart && !activeEncounter,
      selectedCID,
      setInitiativeOpen,
      setInitiativeExpandedCid,
      setSelectedCID,
    });
  }, [
    encounterData,
    actionExecutionSession,
    hasPreTurnQueue,
    manualMode,
    encStart,
    activeEncounter,
    selectedCID,
    setInitiativeOpen,
    setInitiativeExpandedCid,
    setSelectedCID,
    setMovementPreviewCells,
  ]);

  const handleManualMovementSelect = useCallback((cid: string) => {
    selectManualMovementCreature({
      cid,
      manualMode,
      actionExecutionSession,
      hasPreTurnQueue,
      setSelectedCID,
    });
  }, [
    manualMode,
    actionExecutionSession,
    hasPreTurnQueue,
    setSelectedCID,
  ]);

  const handleActiveMapGridCellClick = useCallback(async (cellX: number, cellY: number) => {
    await handleGridCellClick({
      cellX,
      cellY,
      endOfEncounter,
      manualAoePlacement,
      actionExecutionSession,
      encounterData,
      manualMode,
      setupMode: encStart && !activeEncounter,
      selectedCID,
      hasPreTurnQueue,
      eid,
      setManualAoePlacement,
      setEncounterData,
      setSelectedCID,
      setRecommendRefreshKey,
      setActionExecutionSession,
      setAoeTokens,
      setMovementPreviewCells,
      setInitiativeRefreshKey,
    });
  }, [
    endOfEncounter,
    manualAoePlacement,
    actionExecutionSession,
    encounterData,
    manualMode,
    encStart,
    activeEncounter,
    selectedCID,
    hasPreTurnQueue,
    eid,
    setManualAoePlacement,
    setEncounterData,
    setSelectedCID,
    setRecommendRefreshKey,
    setActionExecutionSession,
    setAoeTokens,
    setMovementPreviewCells,
    setInitiativeRefreshKey,
  ]);

  const handleActiveMapGridCellHover = useCallback(async (cellX: number, cellY: number) => {
    await handleGridCellHover({
      cellX,
      cellY,
      encounterData,
      currentTurnCreature,
      setupMode: encStart && !activeEncounter,
      manualAoePlacement,
      selectedCID,
      movementHighlightAnchors,
      latestHoverRequestRef,
      setAoeTokens,
      setMovementPreviewCells,
    });
  }, [
    encounterData,
    currentTurnCreature,
    encStart,
    activeEncounter,
    manualAoePlacement,
    selectedCID,
    movementHighlightAnchors,
    latestHoverRequestRef,
    setAoeTokens,
    setMovementPreviewCells,
  ]);

  const handleBuildRecommendationAoeToken = useCallback((
    recommendation: RecommendationType,
    previewResultID: string
  ) => {
    return buildRecommendationAoeToken({
      recommendation,
      previewResultID,
      currentTurnCreature,
      currentTurnActions,
    });
  }, [
    currentTurnCreature,
    currentTurnActions,
  ]);

  const handleSubmitAction = useCallback((action: CreatureAction) => {
    void handleActionSubmission({
      action,
      currentTurnCreature,
      setManualLock,
      setActionExecutionSession,
      setManualAoePlacement,
    });
  }, [
    currentTurnCreature,
    setManualLock,
    setActionExecutionSession,
    setManualAoePlacement,
  ]);

  const handleSubmitRecommendation = useCallback((
    name: string,
    prob: number,
    eDam: number,
    impact: number,
    overallRank : number,
    base_weight : number,
    ml_weight: number,
    useML: boolean,
    final_weight: number,
    candidateCount: number,
    targets: RecommendationTarget,
    movementRecc: GridCoord[],
    previewResultID?: string
  ) => {
    void handlePASubmission({
      name,
      prob,
      eDam,
      impact,
      overallRank,
      base_weight,
      ml_weight,
      useML,
      final_weight,
      candidateCount,
      targets,
      movementRecc,
      previewResultID,
      currentTurnCreature,
      encounterData,
      currentTurnActions,
      setManualLock,
      setAoeTokens,
      setActionExecutionSession,
    });
  }, [
    currentTurnCreature,
    encounterData,
    currentTurnActions,
    setManualLock,
    setAoeTokens,
    setActionExecutionSession,
  ]);

  const handleExecuteAction = useCallback(
  (finalDraft: ActionRequestDraft): Promise<void | string> =>
    handleActionExecution({
      finalDraft,
      eid,
      currentTurnCreature,
      encounterData,
      actionExecutionSession,
      aoeTokens,
      setEncounterData,
      setAoeTokens,
      setCurrentTurnCreature,
      setActionExecutionSession,
      setManualLock,
      setInitiativeRefreshKey,
    }),
  [
    eid,
    currentTurnCreature,
    encounterData,
    actionExecutionSession,
    aoeTokens,
    setEncounterData,
    setAoeTokens,
    setCurrentTurnCreature,
    setActionExecutionSession,
    setManualLock,
    setInitiativeRefreshKey,
  ]
);

  const handleExecutePreTurn = useCallback(
  (finalDraft: ActionRequestDraft): Promise<void | string> =>
      handlePreTurnExecution({
      finalDraft,
      eid,
      currentTurnCreature,
      encounterData,
      preTurnQueue,
        aoeTokens,
      setManualLock,
      setPreTurnQueue,
      setActionExecutionSession,
      setEncounterData,
      setCurrentTurnCreature,
      setInitiativeRefreshKey,
    }),
  [
    eid,
    currentTurnCreature,
    encounterData,
    preTurnQueue,
    aoeTokens,
    setManualLock,
    setPreTurnQueue,
    setActionExecutionSession,
    setEncounterData,
    setCurrentTurnCreature,
    setInitiativeRefreshKey,
  ]);

  const handleSimStart = useCallback(() => {
    const didStart = simStart({
      encounterData,
      setEncStart,
      setActiveEncounter,
      setCurrentTurnCreature,
    });

    if (didStart && eid) {
      localStorage.setItem(`${eid}/started`, "true");
    }
  }, [
    eid,
    encounterData,
    setEncStart,
    setActiveEncounter,
    setCurrentTurnCreature,
  ]);

  const handleNextTurnWrapper = useCallback(() => {
    void handleNextTurn({
      currentTurnCreature,
      handlingNextTurn,
      actionExecutionSession,
      encounterData,
      encStart,
      activeEncounter,
      eid,
      hasPreTurnQueue,
      endOfEncounter,
      setHandlingNextTurn,
      setEncounterData,
      setCurrentTurnCreature,
      setPreTurnQueue,
      setInitiativeRefreshKey,
      setManualLock,
    });
  }, [
    currentTurnCreature,
    handlingNextTurn,
    actionExecutionSession,
    encounterData,
    encStart,
    activeEncounter,
    eid,
    hasPreTurnQueue,
    endOfEncounter,
    setHandlingNextTurn,
    setEncounterData,
    setCurrentTurnCreature,
    setPreTurnQueue,
    setInitiativeRefreshKey,
    setManualLock,
  ]);

  const handleExitPreTurn = useCallback(() => {
    handlePreTurnBack({
      setActionExecutionSession,
      setManualLock,
      setPreTurnQueue,
    });
  }, [
    setActionExecutionSession,
    setManualLock,
    setPreTurnQueue,
  ]);

  return {
    handleSetManualState,
    handleClearManualAoePreview,
    handleActiveMapTokenSelect,
    handleManualMovementSelect,
    handleActiveMapGridCellClick,
    handleActiveMapGridCellHover,
    handleBuildRecommendationAoeToken,
    handleSubmitAction,
    handleSubmitRecommendation,
    handleExecuteAction,
    handleExecutePreTurn,
    handleSimStart,
    handleNextTurnWrapper,
    handleExitPreTurn,
    movementHighlightAnchors,
  };
}
