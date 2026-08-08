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
import { isPlayerCreature } from "../../api/CreatureGet.ts";

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
  setupMode: boolean;
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
  encounterData?: Encounter;
  currentTurnCreature?: Creature;
  setupMode: boolean;
  manualAoePlacement: ManualAoePlacement | null;
  selectedCID: string | null;
  movementHighlightAnchors: Set<string>;
  latestHoverRequestRef: MutableRefObject<number>;
  setAoeTokens: StateSetter<AoeToken[]>;
  setMovementPreviewCells: StateSetter<GridCoord[]>;
};

export type HandleGridCellClickParams = {
  cellX: number;
  cellY: number;
  endOfEncounter: boolean;
  manualAoePlacement: ManualAoePlacement | null;
  actionExecutionSession?: ActionExecutionSession;
  encounterData?: Encounter;
  manualMode: boolean;
  setupMode: boolean;
  selectedCID: string | null;
  hasPreTurnQueue: boolean;
  eid?: string;
  setManualAoePlacement: StateSetter<ManualAoePlacement | null>;
  setEncounterData: StateSetter<Encounter | undefined>;
  setSelectedCID: StateSetter<string | null>;
  setRecommendRefreshKey: StateSetter<number>;
  setActionExecutionSession: StateSetter<ActionExecutionSession | undefined>;
  setAoeTokens: StateSetter<AoeToken[]>;
  setMovementPreviewCells: StateSetter<GridCoord[]>;
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

type PositionBounds = {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
};

function getCreatureFootprint(creature: Creature): number {
  const sizeRaw = getCreatureSize(creature);

  if (sizeRaw === "large") return 2;
  if (sizeRaw === "huge") return 3;
  if (sizeRaw === "gargantuan") return 4;

  return 1;
}

function getCreatureMovementMaxTiles(creature: Creature): number {
  const movementMaxFeet = Number(
      isPlayerCreature(creature) ? creature.stats.movementMax : creature.movementMax
  );

  if (!Number.isFinite(movementMaxFeet) || movementMaxFeet <= 0) return 0;

  return Math.floor(movementMaxFeet / 5);
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
  const cellBounds =
      encounterData.mapdata?.grid?.cellBounds ??
      (encounterData as { mapgrid?: { grid?: { cellBounds?: unknown } } }).mapgrid?.grid?.cellBounds;
  const cols = Number(
      (cellBounds as { cols?: number; col?: number } | undefined)?.cols ??
      (cellBounds as { cols?: number; col?: number } | undefined)?.col ??
      0
  );
  const rows = Number(
      (cellBounds as { rows?: number; row?: number } | undefined)?.rows ??
      (cellBounds as { rows?: number; row?: number } | undefined)?.row ??
      0
  );

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

function getPositionBounds(position: GridCoord[]): PositionBounds | null {
  if (position.length === 0) return null;

  const xs = position.map(([x]) => x);
  const ys = position.map(([, y]) => y);

  return {
    minX: Math.min(...xs),
    maxX: Math.max(...xs),
    minY: Math.min(...ys),
    maxY: Math.max(...ys),
  };
}

function serializeGridCoord([x, y]: GridCoord): string {
  return `${x},${y}`;
}

function areGridCoordListsEqual(a: GridCoord[], b: GridCoord[]): boolean {
  if (a.length !== b.length) return false;

  return a.every(([x, y], index) => x === b[index][0] && y === b[index][1]);
}

function setGridCoordsIfChanged(
    setter: StateSetter<GridCoord[]>,
    nextCoords: GridCoord[]
): void {
  setter((prevCoords) =>
      areGridCoordListsEqual(prevCoords, nextCoords) ? prevCoords : nextCoords
  );
}

function buildOccupiedCellSet(encounterData: Encounter, excludedCid: string): Set<string> {
  const occupiedCells = new Set<string>();
  const allCreatures: Creature[] = [
    ...(encounterData.players ?? []),
    ...(encounterData.monsters ?? []),
  ];

  for (const creature of allCreatures) {
    if (getCreatureCid(creature) === excludedCid) continue;

    for (const coord of normalizeGridCoords(getCreaturePosition(creature))) {
      occupiedCells.add(serializeGridCoord(coord));
    }
  }

  return occupiedCells;
}

function doesFootprintCollide(
    cellX: number,
    cellY: number,
    footprint: number,
    occupiedCells: Set<string>
): boolean {
  for (let dy = 0; dy < footprint; dy++) {
    for (let dx = 0; dx < footprint; dx++) {
      if (occupiedCells.has(`${cellX + dx},${cellY + dy}`)) {
        return true;
      }
    }
  }

  return false;
}

function canFootprintOccupyAnchor({
                                    cellX,
                                    cellY,
                                    footprint,
                                    bounds,
                                    occupiedCells,
                                  }: {
  cellX: number;
  cellY: number;
  footprint: number;
  bounds: MapBounds;
  occupiedCells: Set<string>;
}): boolean {
  return (
      cellX >= 0 &&
      cellY >= 0 &&
      cellX + footprint <= bounds.cols &&
      cellY + footprint <= bounds.rows &&
      !doesFootprintCollide(cellX, cellY, footprint, occupiedCells)
  );
}

export function findEncounterCreatureByCid(
    encounterData: Encounter,
    cid: string
): Creature | undefined {
  const allCreatures: Creature[] = [
    ...(encounterData.players ?? []),
    ...(encounterData.monsters ?? []),
  ];

  return allCreatures.find((creature) => getCreatureCid(creature) === cid);
}

function getCurrentTurnInitiativeStartingAnchor(
    encounterData: Encounter,
    currentTurnCreature: Creature
): GridCoord[] {
  const currentTurnCid = getCreatureCid(currentTurnCreature);
  const currentTurnEntry =
      encounterData.initiative.find(
          (entry) => entry.currentTurn && entry.cid === currentTurnCid
      ) ??
      encounterData.initiative.find((entry) => entry.cid === currentTurnCid);

  const startingAnchor = normalizeGridCoords(currentTurnEntry?.startingAnchor);

  return startingAnchor.length > 0
      ? startingAnchor
      : normalizeGridCoords(getCreaturePosition(currentTurnCreature));
}

export function getReachableMovementAnchors({
                                              encounterData,
                                              currentTurnCreature,
                                              selectedCID,
                                              setupMode = false,
                                            }: {
  encounterData?: Encounter;
  currentTurnCreature?: Creature;
  selectedCID?: string | null;
  setupMode?: boolean;
}): Set<string> {
  const reachableAnchors = new Set<string>();

  if (!encounterData) return reachableAnchors;

  const movementCreature = setupMode && selectedCID
      ? findEncounterCreatureByCid(encounterData, selectedCID)
      : currentTurnCreature;

  if (!movementCreature) return reachableAnchors;
  if ((movementCreature as { _isLairAction?: boolean })._isLairAction) {
    return reachableAnchors;
  }

  const bounds = getEncounterGridBounds(encounterData);
  if (!bounds) return reachableAnchors;

  const footprint = getCreatureFootprint(movementCreature);
  const maxAnchorX = bounds.cols - footprint;
  const maxAnchorY = bounds.rows - footprint;
  if (maxAnchorX < 0 || maxAnchorY < 0) return reachableAnchors;

  if (setupMode) {
    for (let y = 0; y <= maxAnchorY; y++) {
      for (let x = 0; x <= maxAnchorX; x++) {
        reachableAnchors.add(`${x},${y}`);
      }
    }
    return reachableAnchors;
  }

  const movementMaxTiles = getCreatureMovementMaxTiles(movementCreature);
  const startingAnchor = getCurrentTurnInitiativeStartingAnchor(
      encounterData,
      movementCreature
  );
  const startingBounds = getPositionBounds(startingAnchor);
  if (!startingBounds) return reachableAnchors;

  const occupiedCells = buildOccupiedCellSet(
      encounterData,
      getCreatureCid(movementCreature)
  );
  const startX = startingBounds.minX;
  const startY = startingBounds.minY;
  const startKey = `${startX},${startY}`;

  if (
      !canFootprintOccupyAnchor({
        cellX: startX,
        cellY: startY,
        footprint,
        bounds,
        occupiedCells,
      })
  ) {
    return reachableAnchors;
  }

  const movementDirections: GridCoord[] = [
    [-1, -1],
    [0, -1],
    [1, -1],
    [-1, 0],
    [1, 0],
    [-1, 1],
    [0, 1],
    [1, 1],
  ];
  const distanceByAnchor = new Map<string, number>([[startKey, 0]]);
  const queue: GridCoord[] = [[startX, startY]];

  reachableAnchors.add(startKey);

  for (let queueIndex = 0; queueIndex < queue.length; queueIndex++) {
    const [currentX, currentY] = queue[queueIndex];
    const currentDistance = distanceByAnchor.get(`${currentX},${currentY}`) ?? 0;

    if (currentDistance >= movementMaxTiles) continue;

    for (const [dx, dy] of movementDirections) {
      const nextX = currentX + dx;
      const nextY = currentY + dy;
      const nextKey = `${nextX},${nextY}`;

      if (distanceByAnchor.has(nextKey)) continue;
      if (nextX < 0 || nextY < 0 || nextX > maxAnchorX || nextY > maxAnchorY) {
        continue;
      }
      if (
          !canFootprintOccupyAnchor({
            cellX: nextX,
            cellY: nextY,
            footprint,
            bounds,
            occupiedCells,
          })
      ) {
        continue;
      }

      distanceByAnchor.set(nextKey, currentDistance + 1);
      reachableAnchors.add(nextKey);
      queue.push([nextX, nextY]);
    }
  }

  return reachableAnchors;
}

export function getMovementPreviewFootprint({
                                              cellX,
                                              cellY,
                                              encounterData,
                                              currentTurnCreature,
                                              setupMode,
                                              selectedCID,
                                              movementHighlightAnchors,
                                            }: {
  cellX: number;
  cellY: number;
  encounterData?: Encounter;
  currentTurnCreature?: Creature;
  setupMode: boolean;
  selectedCID: string | null;
  movementHighlightAnchors: Set<string>;
}): GridCoord[] {
  if (!encounterData || !selectedCID) return [];
  if (!setupMode) {
    if (!currentTurnCreature) return [];
    if ((currentTurnCreature as { _isLairAction?: boolean })._isLairAction) return [];
    if (selectedCID !== getCreatureCid(currentTurnCreature)) return [];
  }
  if (!movementHighlightAnchors.has(`${cellX},${cellY}`)) return [];

  const selectedCreature = findEncounterCreatureByCid(encounterData, selectedCID);
  if (!selectedCreature) return [];

  const footprint = buildFootprintPosition(
      cellX,
      cellY,
      getCreatureFootprint(selectedCreature)
  );
  const bounds = getEncounterGridBounds(encounterData);

  return bounds && isPositionWithinMap(footprint, bounds) ? footprint : [];
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

  // Avoid sending ruleset movement requests for cells the frontend already
  // knows are blocked or outside the creature's remaining movement range.
  // Manual/setup movement intentionally continues to use the override route.
  if (!manualMode) {
    const reachableAnchors = getReachableMovementAnchors({
      encounterData,
      currentTurnCreature: movedCreature,
      selectedCID,
      setupMode: false,
    });

    if (!reachableAnchors.has(`${cellX},${cellY}`)) {
      throw new Error(
          "Selected movement destination is blocked or outside the creature's movement range."
      );
    }
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
                                    setupMode, //encStart && !activeEncounter
                                    selectedCID,
                                    setInitiativeOpen,
                                    setInitiativeExpandedCid,
                                    setSelectedCID,
                                  }: HandleTokenSelectParams): void {
  if (!encounterData) return;

  if (setupMode) {
    setSelectedCID((prev) => (prev === cid ? null : cid));
    return;
  }

  if (actionExecutionSession || hasPreTurnQueue) return;

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
                                            encounterData,
                                            currentTurnCreature,
                                            setupMode,
                                            manualAoePlacement,
                                            selectedCID,
                                            movementHighlightAnchors,
                                            latestHoverRequestRef,
                                            setAoeTokens,
                                            setMovementPreviewCells,
                                          }: HandleGridCellHoverParams): Promise<void> {
  if (!manualAoePlacement) {
    setGridCoordsIfChanged(
        setMovementPreviewCells,
        getMovementPreviewFootprint({
          cellX,
          cellY,
          encounterData,
          currentTurnCreature,
          setupMode,
          selectedCID,
          movementHighlightAnchors,
        })
    );
    return;
  }

  setGridCoordsIfChanged(setMovementPreviewCells, []);

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
                                            setupMode,
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
                                            setInitiativeRefreshKey
                                          }: HandleGridCellClickParams): Promise<void> {
  const clickedCell: GridCoord = [cellX, cellY];
  if (endOfEncounter) return;
  setMovementPreviewCells([]);

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
      manualMode: manualMode || setupMode,
      setEncounterData,
      setSelectedCID,
      setRecommendRefreshKey,
      setInitiativeRefreshKey,
    });
  } catch (error) {
    const responseDetail =
        typeof error === "object" &&
        error !== null &&
        "response" in error
            ? String(
                (
                    error as {
                      response?: {
                        data?: {
                          detail?: unknown;
                        };
                      };
                    }
                ).response?.data?.detail ?? ""
            )
            : "";

    console.error(
        manualMode || setupMode
            ? "Manual movement simulation failed:"
            : "Movement simulation failed:",
        responseDetail ||
        (error instanceof Error ? error.message : "Unknown movement error"),
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