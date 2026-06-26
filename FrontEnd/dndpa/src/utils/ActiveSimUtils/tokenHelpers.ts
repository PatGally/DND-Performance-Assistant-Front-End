import type { Dispatch, MutableRefObject, SetStateAction } from "react";
import type { Creature, GridCoord } from "../../types/creature.ts";
import type { CreatureAction } from "../../types/action.ts";
import type {
  ActionExecutionSession,
  AoeToken,
  Encounter,
  ManualAoePlacement,
  Recommendation as RecommendationType,
} from "../../types/SimulationTypes.ts";

import axiosTokenInstance from "../../api/AxiosTokenInstance.ts";
import { getEncounter } from "../../api/EncounterGet.ts";

import {
  buildAoeTokenFromStats,
  buildManualAoePositioning,
  extractActionTiming,
  findActionByName,
  getAoeTargetsFromPositioning,
  getClosestAnchorToCaster,
  isDirectionalShape,
  isRecommendationAoeTarget,
  normalizeAoeShape,
  normalizeGridCoords,
  resolveAoeTokenImageName,
} from "./aoeHelpers.ts";

import {
  getCreatureCid,
  getCreaturePosition,
  getCreatureSize, getCurrentTurnCreatureFromEncounter,
} from "./CreatureHelpers.ts";

import { normalizeAction } from "./actionHelpers.ts";

type StateSetter<T> = Dispatch<SetStateAction<T>>;

export type HandleTokenSelectParams = {
  cid: string;
  encounterData?: Encounter;
  actionExecutionSession?: ActionExecutionSession;
  hasPreTurnQueue: boolean;
  manualMode: boolean;
  selectedCID: string | null;
  setInitiativeOpen: StateSetter<boolean>;
  setInitiativeExpandedCid: StateSetter<string | null>;
  setSelectedCID: StateSetter<string | null>;
};

export type SelectManualMovementCreatureParams = {
  cid: string;
  manualMode: boolean;
  actionExecutionSession?: ActionExecutionSession;
  hasPreTurnQueue: boolean;
  setSelectedCID: StateSetter<string | null>;
};

export type UpsertAoePreviewTokenParams = {
  token: AoeToken;
  setAoeTokens: StateSetter<AoeToken[]>;
};

export type CommitManualAoePlacementParams = {
  anchor: GridCoord;
  cursor: GridCoord;
  manualAoePlacement: ManualAoePlacement | null;
  encounterData?: Encounter;
  setActionExecutionSession: StateSetter<ActionExecutionSession | undefined>;
  setManualAoePlacement: StateSetter<ManualAoePlacement | null>;
  setAoeTokens: StateSetter<AoeToken[]>;
};

export type HandleGridCellHoverParams = {
  cellX: number;
  cellY: number;
  manualAoePlacement: ManualAoePlacement | null;
  latestHoverRequestRef: MutableRefObject<number>;
  setAoeTokens: StateSetter<AoeToken[]>;
};

export type HandleGridCellClickParams = {
  cellX: number;
  cellY: number;
  endOfEncounter: boolean;
  manualAoePlacement: ManualAoePlacement | null;
  actionExecutionSession?: ActionExecutionSession;
  encounterData?: Encounter;
  manualMode: boolean;
  selectedCID: string | null;
  hasPreTurnQueue: boolean;
  eid?: string;
  setManualAoePlacement: StateSetter<ManualAoePlacement | null>;
  setEncounterData: StateSetter<Encounter | undefined>;
  setSelectedCID: StateSetter<string | null>;
  setRecommendRefreshKey: StateSetter<number>;
  setActionExecutionSession: StateSetter<ActionExecutionSession | undefined>;
  setAoeTokens: StateSetter<AoeToken[]>;
  setInitiativeRefreshKey : StateSetter<number>;
};

export type BuildRecommendationAoeTokenParams = {
  recommendation: RecommendationType;
  previewResultID: string;
  currentTurnCreature?: Creature;
  currentTurnActions?: CreatureAction[];
};

type MapBounds = {
  cols: number;
  rows: number;
};

function getCreatureFootprint(creature: Creature): number {
  const sizeRaw = getCreatureSize(creature);

  if (sizeRaw === "large") return 2;
  if (sizeRaw === "huge") return 3;
  if (sizeRaw === "gargantuan") return 4;

  return 1;
}

function buildFootprintPosition(cellX: number, cellY: number, footprint: number): GridCoord[] {
  const newPos: GridCoord[] = [];

  for (let dy = 0; dy < footprint; dy++) {
    for (let dx = 0; dx < footprint; dx++) {
      newPos.push([cellX + dx, cellY + dy]);
    }
  }

  return newPos;
}

function getEncounterGridBounds(encounterData: Encounter): MapBounds | null {
  const cellBounds = encounterData.mapdata?.grid?.cellBounds;
  const cols = Number(cellBounds?.cols ?? 0);
  const rows = Number(cellBounds?.rows ?? 0);

  if (!Number.isFinite(cols) || !Number.isFinite(rows) || cols <= 0 || rows <= 0) {
    return null;
  }

  return { cols, rows };
}

function isPositionWithinMap(position: GridCoord[], bounds: MapBounds): boolean {
  return position.every(
    ([x, y]) => x >= 0 && y >= 0 && x < bounds.cols && y < bounds.rows
  );
}

async function moveCreatureFromSelectedCell({
  cellX,
  cellY,
  selectedCID,
  encounterData,
  eid,
  manualMode,
  setEncounterData,
  setSelectedCID,
  setRecommendRefreshKey,
  setInitiativeRefreshKey,
}: {
  cellX: number;
  cellY: number;
  selectedCID: string;
  encounterData: Encounter;
  eid: string;
  manualMode: boolean;
  setEncounterData: StateSetter<Encounter | undefined>;
  setSelectedCID: StateSetter<string | null>;
  setRecommendRefreshKey: StateSetter<number>;
  setInitiativeRefreshKey: StateSetter<number>;
}): Promise<void> {
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

  const newPos = buildFootprintPosition(
    cellX,
    cellY,
    getCreatureFootprint(movedCreature)
  );

  const bounds = getEncounterGridBounds(encounterData);

  if (!bounds || !isPositionWithinMap(newPos, bounds)) {
    console.error("Selected movement target is outside the map bounds.");
    return;
  }

  const endpoint = manualMode
    ? `/encounter/${eid}/creature/${selectedCID}/simulate/manual-movement`
    : `/encounter/${eid}/creature/${selectedCID}/simulate/movement`

  await axiosTokenInstance.post(endpoint, newPos);

  const updatedEncounter = await getEncounter(eid);
  if (!updatedEncounter) {
    console.error("Encounter reload failed after movement.");
    return;
  }

  setEncounterData(updatedEncounter);
  setSelectedCID(null);
  setRecommendRefreshKey((prev) => prev + 1);
  setInitiativeRefreshKey((prev) => prev + 1);
}

export function handleTokenSelect({
  cid,
  encounterData,
  actionExecutionSession,
  hasPreTurnQueue,
  manualMode,
  selectedCID,
  setInitiativeOpen,
  setInitiativeExpandedCid,
  setSelectedCID,
}: HandleTokenSelectParams): void {
  if (!encounterData || actionExecutionSession || hasPreTurnQueue) return;

  if (manualMode) {
    if (selectedCID) {
      if (selectedCID === cid) {
        setSelectedCID(null);
      }

      return;
    }

    setInitiativeOpen(true);
    setInitiativeExpandedCid((prev) => (prev === cid ? null : cid));
    return;
  }

    //Creatures that aren't currentTurnCreature can no longer move.
  const currentTurnCreature = getCurrentTurnCreatureFromEncounter(encounterData);
  if (currentTurnCreature && cid !== getCreatureCid(currentTurnCreature)) {
    return;
  }

  setSelectedCID((prev) => (prev === cid ? null : cid));
}

export function selectManualMovementCreature({
  cid,
  manualMode,
  actionExecutionSession,
  hasPreTurnQueue,
  setSelectedCID,
}: SelectManualMovementCreatureParams): void {
  if (!manualMode || actionExecutionSession || hasPreTurnQueue) return;

  setSelectedCID((prev) => (prev === cid ? null : cid));
}

export function upsertAoePreviewToken({
  token,
  setAoeTokens,
}: UpsertAoePreviewTokenParams): void {
  setAoeTokens((prev) => {
    const withoutOld = prev.filter((existing) => existing.resultID !== token.resultID);
    return [...withoutOld, token];
  });
}

export async function commitManualAoePlacement({
  anchor,
  cursor,
  manualAoePlacement,
  encounterData,
  setActionExecutionSession,
  setManualAoePlacement,
  setAoeTokens,
}: CommitManualAoePlacementParams): Promise<void> {
  if (!manualAoePlacement || !encounterData) return;

  const positioning = await buildManualAoePositioning({
    shape: manualAoePlacement.shape,
    radiusCells: manualAoePlacement.radiusCells,
    lineWidthCells: manualAoePlacement.lineWidthCells ?? 1,
    anchor,
    cursor,
  });

  const targetCids = getAoeTargetsFromPositioning(
    positioning,
    encounterData,
    manualAoePlacement.cid
  );

  const token = buildAoeTokenFromStats({
    name: manualAoePlacement.name,
    cid: manualAoePlacement.cid,
    shape: manualAoePlacement.shape,
    timing: manualAoePlacement.timing,
    token_image: manualAoePlacement.token_image,
    resultID: manualAoePlacement.resultID,
    anchor,
    positioning,
  });

  upsertAoePreviewToken({
    token,
    setAoeTokens,
  });

  setActionExecutionSession((prev) =>
    prev
      ? {
          ...prev,
          draft: {
            ...prev.draft,
            targets: targetCids,
          },
        }
      : prev
  );

  setManualAoePlacement(null);
}

export async function handleGridCellHover({
  cellX,
  cellY,
  manualAoePlacement,
  latestHoverRequestRef,
  setAoeTokens,
}: HandleGridCellHoverParams): Promise<void> {
  if (!manualAoePlacement) return;

  const requestId = ++latestHoverRequestRef.current;
  const hoverCell: GridCoord = [cellX, cellY];

  let anchor = manualAoePlacement.anchor;

  if (manualAoePlacement.stage === "pick_anchor" && !manualAoePlacement.selfOrigin) {
    anchor = hoverCell;
  }

  if (!anchor) return;

  const positioning = await buildManualAoePositioning({
    shape: manualAoePlacement.shape,
    radiusCells: manualAoePlacement.radiusCells,
    lineWidthCells: manualAoePlacement.lineWidthCells ?? 1,
    anchor,
    cursor: hoverCell,
  });

  if (requestId !== latestHoverRequestRef.current) return;

  const previewToken = buildAoeTokenFromStats({
    name: manualAoePlacement.name,
    cid: manualAoePlacement.cid,
    shape: manualAoePlacement.shape,
    timing: manualAoePlacement.timing,
    token_image: manualAoePlacement.token_image,
    resultID: manualAoePlacement.resultID,
    anchor,
    positioning,
  });

  upsertAoePreviewToken({
    token: previewToken,
    setAoeTokens,
  });
}

export async function handleGridCellClick({
  cellX,
  cellY,
  endOfEncounter,
  manualAoePlacement,
  actionExecutionSession,
  encounterData,
  manualMode,
  selectedCID,
  hasPreTurnQueue,
  eid,
  setManualAoePlacement,
  setEncounterData,
  setSelectedCID,
  setRecommendRefreshKey,
  setActionExecutionSession,
  setAoeTokens,
    setInitiativeRefreshKey
}: HandleGridCellClickParams): Promise<void> {
  const clickedCell: GridCoord = [cellX, cellY];
  if (endOfEncounter) return;

  if (manualAoePlacement && actionExecutionSession && encounterData) {
    if (manualAoePlacement.stage === "pick_anchor" && !manualAoePlacement.selfOrigin) {
      if (isDirectionalShape(manualAoePlacement.shape)) {
        setManualAoePlacement((prev) =>
          prev
            ? {
                ...prev,
                anchor: clickedCell,
                stage: "pick_direction",
              }
            : prev
        );
        return;
      }

      await commitManualAoePlacement({
        anchor: clickedCell,
        cursor: clickedCell,
        manualAoePlacement,
        encounterData,
        setActionExecutionSession,
        setManualAoePlacement,
        setAoeTokens,
      });

      setInitiativeRefreshKey((prev) => prev + 1);
      return;
    }

    if (manualAoePlacement.stage === "pick_direction" && manualAoePlacement.anchor) {
      await commitManualAoePlacement({
        anchor: manualAoePlacement.anchor,
        cursor: clickedCell,
        manualAoePlacement,
        encounterData,
        setActionExecutionSession,
        setManualAoePlacement,
        setAoeTokens,
      });
      setInitiativeRefreshKey((prev) => prev + 1);
      return;
    }

    if (
      manualAoePlacement.stage === "pick_anchor" &&
      manualAoePlacement.selfOrigin &&
      manualAoePlacement.anchor
    ) {
      await commitManualAoePlacement({
        anchor: manualAoePlacement.anchor,
        cursor: clickedCell,
        manualAoePlacement,
        encounterData,
        setActionExecutionSession,
        setManualAoePlacement,
        setAoeTokens,
      });
      setInitiativeRefreshKey((prev) => prev + 1);
      return;
    }
  }

  if (!selectedCID || !encounterData || actionExecutionSession || hasPreTurnQueue || !eid) return;

  try {
    await moveCreatureFromSelectedCell({
      cellX,
      cellY,
      selectedCID,
      encounterData,
      eid,
      manualMode,
      setEncounterData,
      setSelectedCID,
      setRecommendRefreshKey,
      setInitiativeRefreshKey,
    });
  } catch (error) {
    console.error(
      manualMode ? "Manual movement simulation failed:" : "Movement simulation failed:",
      error
    );
  }
}

export function buildRecommendationAoeToken({
  recommendation,
  previewResultID,
  currentTurnCreature,
  currentTurnActions,
}: BuildRecommendationAoeTokenParams): AoeToken | null {
  if (!currentTurnCreature || !currentTurnActions) return null;
  if (!isRecommendationAoeTarget(recommendation.target)) return null;

  const positioning = normalizeGridCoords(recommendation.target.positioning);
  if (positioning.length === 0) return null;

  const action = findActionByName(recommendation.name, currentTurnActions);
  if (!action) return null;

  const casterPosition = normalizeGridCoords(
    getCreaturePosition(currentTurnCreature) as unknown
  );

  const normalizedShape = normalizeAoeShape(normalizeAction(action).shape);

  return {
    name: recommendation.name,
    positioning,
    token_image: resolveAoeTokenImageName(action, normalizedShape),
    resultID: previewResultID,
    cid: getCreatureCid(currentTurnCreature),
    anchor: getClosestAnchorToCaster(positioning, casterPosition),
    timing: extractActionTiming(action),
    shape: normalizedShape,
  };
}
