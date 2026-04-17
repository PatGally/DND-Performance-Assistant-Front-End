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
  getCreatureSize,
} from "./CreatureHelpers.ts";

import { normalizeAction } from "./actionHelpers.ts";

type StateSetter<T> = Dispatch<SetStateAction<T>>;

export type HandleTokenSelectParams = {
  cid: string;
  encounterData?: Encounter;
  actionExecutionSession?: ActionExecutionSession;
  hasPreTurnQueue: boolean;
  manualMode: boolean;
  setInitiativeOpen: StateSetter<boolean>;
  setInitiativeExpandedCid: StateSetter<string | null>;
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

export function handleTokenSelect({
  cid,
  encounterData,
  actionExecutionSession,
  hasPreTurnQueue,
  manualMode,
  setInitiativeOpen,
  setInitiativeExpandedCid,
  setSelectedCID,
}: HandleTokenSelectParams): void {
  if (!encounterData || actionExecutionSession || hasPreTurnQueue) return;

  if (manualMode) {
    setInitiativeOpen(true);
    setInitiativeExpandedCid((prev) => (prev === cid ? null : cid));
    return;
  }

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

  if (manualMode) return;
  if (!selectedCID || !encounterData || actionExecutionSession || hasPreTurnQueue || !eid) return;

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
    setSelectedCID(null);
    setRecommendRefreshKey((prev) => prev + 1);
    setInitiativeRefreshKey((prev) => prev + 1);
  } catch (error) {
    console.error("Movement simulation failed:", error);
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